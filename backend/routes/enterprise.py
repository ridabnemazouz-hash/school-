from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse
import csv
import io
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, engine
from routes.auth import get_current_user, require_super_admin
from models import (
    BlockedIP, SecurityIncident, BackupRecord, IntegrationConfig,
    AlertRule, AlertNotification, ABTest, MigrationRecord,
    ActivityEvent, BillingMetric, ReportRecord,
    SchoolDB, UserDB, PaymentDB, SecurityLogDB
)
import os
import json
import shutil
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

class ReportRequest(BaseModel):
    report_type: str = "general"
    school_id: Optional[int] = None
    format: str = "pdf"

router = APIRouter(prefix="/enterprise", tags=["enterprise"])

def require_platform_owner(current_user=Depends(require_super_admin)):
    if current_user.school_id is not None:
        raise HTTPException(status_code=403, detail="Only platform owner can access")
    return current_user

def log_activity(db: Session, event_type: str, entity_type: str = None, entity_id: int = None, school_id: int = None, user_email: str = None, details: str = None):
    event = ActivityEvent(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        school_id=school_id,
        user_email=user_email,
        details=details,
    )
    db.add(event)
    db.commit()

# ==========================================
# 1. SECURITY CENTER
# ==========================================

@router.get("/security/incidents")
def get_security_incidents(
    severity: str = "",
    resolved: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    query = db.query(SecurityIncident)
    if severity:
        query = query.filter(SecurityIncident.severity == severity)
    if resolved is not None:
        query = query.filter(SecurityIncident.resolved == resolved)
    incidents = query.order_by(SecurityIncident.created_at.desc()).limit(limit).all()
    return [{
        "id": i.id, "incident_type": i.incident_type, "severity": i.severity,
        "ip_address": i.ip_address, "user_agent": i.user_agent,
        "target": i.target, "payload": i.payload, "details": i.details,
        "resolved": i.resolved, "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
        "created_at": i.created_at.isoformat() if i.created_at else None,
    } for i in incidents]

@router.post("/security/incidents/auto-detect")
def auto_detect_incidents(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    detected = []
    hour_ago = datetime.utcnow() - timedelta(hours=1)
    failed = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_failed",
        SecurityLogDB.created_at >= hour_ago,
        SecurityLogDB.ip_address.isnot(None)
    ).all()
    ip_counts = {}
    for f in failed:
        ip_counts[f.ip_address] = ip_counts.get(f.ip_address, 0) + 1
    for ip, count in ip_counts.items():
        if count >= 5:
            existing = db.query(SecurityIncident).filter(
                SecurityIncident.ip_address == ip,
                SecurityIncident.incident_type == "brute_force",
                SecurityIncident.resolved == False,
                SecurityIncident.created_at >= hour_ago,
            ).first()
            if not existing:
                severity = "critical" if count >= 20 else "high" if count >= 10 else "medium"
                inc = SecurityIncident(
                    incident_type="brute_force",
                    severity=severity,
                    ip_address=ip,
                    details=f"{count} failed login attempts from {ip} in the last hour",
                )
                db.add(inc)
                db.flush()
                detected.append({"ip": ip, "attempts": count, "severity": severity, "incident_id": inc.id})
    db.commit()
    return {"detected": detected, "total": len(detected)}

@router.post("/security/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: int, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    inc = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc.resolved = True
    inc.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": "Incident resolved"}

@router.get("/security/blocked-ips")
def get_blocked_ips(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    ips = db.query(BlockedIP).order_by(BlockedIP.created_at.desc()).all()
    return [{
        "id": b.id, "ip_address": b.ip_address, "reason": b.reason,
        "blocked_by": b.blocked_by, "is_active": b.is_active,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "expires_at": b.expires_at.isoformat() if b.expires_at else None,
    } for b in ips]

@router.post("/security/block-ip")
def block_ip(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    ip = body.get("ip_address")
    if not ip:
        raise HTTPException(status_code=400, detail="ip_address required")
    existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()
    if existing:
        existing.is_active = True
        existing.reason = body.get("reason", existing.reason)
        db.commit()
        return {"message": f"IP {ip} already blocked, reactivated"}
    blocked = BlockedIP(
        ip_address=ip,
        reason=body.get("reason", "Manually blocked"),
        blocked_by=owner.email,
    )
    db.add(blocked)
    log_activity(db, "ip_blocked", "blocked_ip", blocked.id, details=f"IP {ip} blocked by {owner.email}")
    db.commit()
    return {"message": f"IP {ip} blocked", "id": blocked.id}

@router.delete("/security/unblock-ip/{ip_id}")
def unblock_ip(ip_id: int, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    blocked = db.query(BlockedIP).filter(BlockedIP.id == ip_id).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="Blocked IP not found")
    blocked.is_active = False
    db.commit()
    return {"message": f"IP {blocked.ip_address} unblocked"}

@router.post("/security/force-reset-passwords")
def force_reset_passwords(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    target = body.get("target", "all")  # all, school:X, specific users
    query = db.query(UserDB)
    if target.startswith("school:"):
        school_id = int(target.split(":")[1])
        query = query.filter(UserDB.school_id == school_id)
    elif target == "platform_only":
        query = query.filter(UserDB.school_id.is_(None))
    users = query.all()
    count = 0
    for u in users:
        if u.id != owner.id:
            u.status = "PasswordReset"
            count += 1
    db.commit()
    log_activity(db, "force_password_reset", "users", 0, details=f"{count} passwords reset by {owner.email}")
    return {"message": f"Password reset forced for {count} users", "count": count}

@router.get("/security/dashboard")
def get_security_dashboard(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    total_incidents = db.query(SecurityIncident).count()
    active_incidents = db.query(SecurityIncident).filter(SecurityIncident.resolved == False).count()
    critical_incidents = db.query(SecurityIncident).filter(
        SecurityIncident.severity == "critical", SecurityIncident.resolved == False
    ).count()
    blocked_ips = db.query(BlockedIP).filter(BlockedIP.is_active == True).count()
    failed_logins_today = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_failed",
        SecurityLogDB.created_at >= datetime.utcnow() - timedelta(days=1)
    ).count()
    by_severity = db.query(SecurityIncident.severity, func.count(SecurityIncident.id)).group_by(SecurityIncident.severity).all()
    by_type = db.query(SecurityIncident.incident_type, func.count(SecurityIncident.id)).group_by(SecurityIncident.incident_type).all()
    top_attacker_ips = db.query(SecurityIncident.ip_address, func.count(SecurityIncident.id)).filter(
        SecurityIncident.ip_address.isnot(None), SecurityIncident.resolved == False
    ).group_by(SecurityIncident.ip_address).order_by(func.count(SecurityIncident.id).desc()).limit(5).all()
    return {
        "total_incidents": total_incidents,
        "active_incidents": active_incidents,
        "critical_incidents": critical_incidents,
        "blocked_ips": blocked_ips,
        "failed_logins_today": failed_logins_today,
        "by_severity": [{"severity": s[0], "count": s[1]} for s in by_severity],
        "by_type": [{"type": t[0], "count": t[1]} for t in by_type],
        "top_attacker_ips": [{"ip": i[0], "count": i[1]} for i in top_attacker_ips],
    }

# ==========================================
# 2. BACKUP MANAGER
# ==========================================

@router.get("/backups")
def get_backups(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    backups = db.query(BackupRecord).order_by(BackupRecord.created_at.desc()).all()
    return [{
        "id": b.id, "filename": b.filename, "size_mb": b.size_mb,
        "backup_type": b.backup_type, "status": b.status,
        "triggered_by": b.triggered_by, "notes": b.notes,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "completed_at": b.completed_at.isoformat() if b.completed_at else None,
    } for b in backups]

@router.post("/backups/create")
def create_backup(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    url = str(engine.url)
    if "sqlite" not in url:
        raise HTTPException(status_code=500, detail="Backup only supported for SQLite in this version")
    db_path = url.split("///")[-1]
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database file not found")
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.db"
    dest = os.path.join(backup_dir, filename)
    shutil.copy2(db_path, dest)
    size_mb = round(os.path.getsize(dest) / (1024 * 1024), 2)
    backup = BackupRecord(
        filename=filename,
        size_mb=size_mb,
        backup_type=body.get("type", "manual"),
        status="completed",
        triggered_by=owner.email,
        notes=body.get("notes"),
        completed_at=datetime.utcnow(),
    )
    db.add(backup)
    log_activity(db, "backup_created", "backup", backup.id, details=f"Backup {filename} created ({size_mb}MB)")
    db.commit()
    return {"message": "Backup created", "id": backup.id, "filename": filename, "size_mb": size_mb}

@router.get("/backups/{backup_id}/download")
def download_backup(backup_id: int, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    backup = db.query(BackupRecord).filter(BackupRecord.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    
    backup_path = os.path.join(os.path.dirname(__file__), "..", "backups", backup.filename)
    if not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="Backup file not found on disk")
    
    return FileResponse(
        backup_path,
        media_type="application/x-sqlite3",
        filename=backup.filename
    )

@router.delete("/backups/{backup_id}")
def delete_backup(backup_id: int, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    backup = db.query(BackupRecord).filter(BackupRecord.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    backup_path = os.path.join(os.path.dirname(__file__), "..", "backups", backup.filename)
    if os.path.exists(backup_path):
        os.remove(backup_path)
    db.delete(backup)
    db.commit()
    return {"message": "Backup deleted"}

# ==========================================
# 3. BILLING DEEP ANALYTICS
# ==========================================

@router.get("/billing/analytics")
def get_billing_analytics(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    schools = db.query(SchoolDB).filter(SchoolDB.is_active == True).all()
    total_revenue = 0
    revenue_by_school = []
    monthly_revenue = {}
    for school in schools:
        payments = db.query(PaymentDB).filter(
            PaymentDB.school_id == school.id,
            PaymentDB.status == "Paid",
        ).all()
        school_revenue = sum(p.amount for p in payments)
        total_revenue += school_revenue
        student_count = db.query(UserDB).filter(UserDB.school_id == school.id, UserDB.role == "Student").count()
        revenue_by_school.append({
            "school_id": school.id,
            "school_name": school.name,
            "revenue": school_revenue,
            "student_count": student_count,
            "revenue_per_student": round(school_revenue / student_count, 2) if student_count > 0 else 0,
            "subscription_plan": school.subscription_plan,
        })
        for p in payments:
            if p.payment_date:
                month = p.payment_date.strftime("%Y-%m")
                monthly_revenue[month] = monthly_revenue.get(month, 0) + p.amount
    total_students = sum(r["student_count"] for r in revenue_by_school)
    active_schools = len(schools)
    mrr = total_revenue / max(active_schools, 1)
    total_schools_ever = db.query(SchoolDB).count()
    churned_schools = db.query(SchoolDB).filter(SchoolDB.is_active == False).count()
    churn_rate = round((churned_schools / total_schools_ever * 100), 2) if total_schools_ever > 0 else 0
    avg_lifespan_months = 12
    ltv = mrr * avg_lifespan_months
    return {
        "total_revenue": total_revenue,
        "mrr": round(mrr, 2),
        "ltv": round(ltv, 2),
        "churn_rate": churn_rate,
        "total_students": total_students,
        "active_schools": active_schools,
        "revenue_by_school": sorted(revenue_by_school, key=lambda x: x["revenue"], reverse=True),
        "monthly_revenue": dict(sorted(monthly_revenue.items())),
    }

@router.post("/billing/record-metric")
def record_billing_metric(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    metric = BillingMetric(
        school_id=body.get("school_id"),
        metric_type=body.get("metric_type"),
        value=body.get("value", 0),
        period=body.get("period", datetime.utcnow().strftime("%Y-%m")),
    )
    db.add(metric)
    db.commit()
    return {"message": "Metric recorded", "id": metric.id}

# ==========================================
# 4. INTEGRATION HUB
# ==========================================

@router.get("/integrations")
def get_integrations(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    integrations = db.query(IntegrationConfig).all()
    defaults = {
        "stripe": {"name": "Stripe Payments", "icon": "💳", "fields": ["publishable_key", "secret_key", "webhook_secret"]},
        "smtp": {"name": "Email (SMTP)", "icon": "📧", "fields": ["host", "port", "username", "password", "from_email"]},
        "sms": {"name": "SMS Gateway", "icon": "📱", "fields": ["api_key", "sender_id", "base_url"]},
        "twilio": {"name": "Twilio", "icon": "📞", "fields": ["account_sid", "auth_token", "phone_number"]},
        "sendgrid": {"name": "SendGrid", "icon": "✉️", "fields": ["api_key", "from_email"]},
    }
    result = []
    for key, info in defaults.items():
        config = db.query(IntegrationConfig).filter(IntegrationConfig.service == key).first()
        result.append({
            "service": key,
            "name": info["name"],
            "icon": info["icon"],
            "fields": info["fields"],
            "is_active": config.is_active if config else False,
            "config": json.loads(config.config) if config and config.config else {},
            "last_tested": config.last_tested.isoformat() if config and config.last_tested else None,
            "test_status": config.test_status if config else None,
        })
    return result

@router.post("/integrations/{service}/configure")
def configure_integration(service: str, body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    config = db.query(IntegrationConfig).filter(IntegrationConfig.service == service).first()
    if config:
        config.config = json.dumps(body.get("config", {}))
        config.is_active = body.get("is_active", False)
        config.updated_at = datetime.utcnow()
    else:
        config = IntegrationConfig(
            service=service,
            config=json.dumps(body.get("config", {})),
            is_active=body.get("is_active", False),
        )
        db.add(config)
    db.commit()
    return {"message": f"Integration {service} configured"}

@router.post("/integrations/{service}/test")
def test_integration(service: str, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    config = db.query(IntegrationConfig).filter(IntegrationConfig.service == service).first()
    if not config:
        raise HTTPException(status_code=404, detail="Integration not configured")
    test_result = {"success": False, "message": "Mock test — configure real credentials for live test"}
    if service == "stripe":
        cfg = json.loads(config.config)
        test_result["success"] = bool(cfg.get("secret_key"))
        test_result["message"] = "Stripe keys present" if test_result["success"] else "Stripe secret_key missing"
    elif service == "smtp":
        cfg = json.loads(config.config)
        test_result["success"] = bool(cfg.get("host") and cfg.get("username"))
        test_result["message"] = "SMTP config present" if test_result["success"] else "SMTP host/username missing"
    elif service == "sms":
        cfg = json.loads(config.config)
        test_result["success"] = bool(cfg.get("api_key"))
        test_result["message"] = "SMS API key present" if test_result["success"] else "SMS API key missing"
    config.last_tested = datetime.utcnow()
    config.test_status = "success" if test_result["success"] else "failed"
    db.commit()
    return test_result

# ==========================================
# 5. ALERTS SYSTEM
# ==========================================

@router.get("/alerts/rules")
def get_alert_rules(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    rules = db.query(AlertRule).all()
    if not rules:
        defaults = [
            ("Server Down", "server_down", 1, "Server unreachable for 1 min", "dashboard,email"),
            ("Database Slow", "db_slow", 5000, "Query takes > 5000ms", "dashboard"),
            ("Error Spike", "error_spike", 50, "More than 50 errors in 1 hour", "dashboard,email"),
            ("High Churn", "high_churn", 10, "Churn rate exceeds 10%", "dashboard,email"),
            ("Payment Failed", "payment_failed", 5, "More than 5 failed payments per day", "dashboard"),
        ]
        for name, rtype, thresh, cond, channels in defaults:
            rule = AlertRule(name=name, rule_type=rtype, threshold=thresh, condition=cond, notification_channels=channels)
            db.add(rule)
        db.commit()
        rules = db.query(AlertRule).all()
    return [{
        "id": r.id, "name": r.name, "rule_type": r.rule_type,
        "threshold": r.threshold, "condition": r.condition,
        "enabled": r.enabled, "notification_channels": r.notification_channels,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rules]

@router.put("/alerts/rules/{rule_id}")
def update_alert_rule(rule_id: int, body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for key in ["name", "rule_type", "threshold", "condition", "enabled", "notification_channels"]:
        if key in body:
            setattr(rule, key, body[key])
    db.commit()
    return {"message": "Alert rule updated"}

@router.get("/alerts/notifications")
def get_alert_notifications(unread_only: bool = False, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    query = db.query(AlertNotification)
    if unread_only:
        query = query.filter(AlertNotification.is_read == False)
    notifs = query.order_by(AlertNotification.created_at.desc()).limit(100).all()
    return [{
        "id": n.id, "rule_id": n.rule_id, "severity": n.severity,
        "title": n.title, "message": n.message, "channel": n.channel,
        "is_read": n.is_read, "created_at": n.created_at.isoformat() if n.created_at else None,
    } for n in notifs]

@router.post("/alerts/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    notif = db.query(AlertNotification).filter(AlertNotification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/alerts/check")
def run_alert_checks(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    rules = db.query(AlertRule).filter(AlertRule.enabled == True).all()
    triggered = []
    for rule in rules:
        if rule.rule_type == "error_spike":
            hour_ago = datetime.utcnow() - timedelta(hours=1)
            count = db.query(SecurityLogDB).filter(
                SecurityLogDB.event_type == "login_failed",
                SecurityLogDB.created_at >= hour_ago,
            ).count()
            if rule.threshold and count >= rule.threshold:
                notif = AlertNotification(
                    rule_id=rule.id, severity="high",
                    title=f"Alert: {rule.name}",
                    message=f"{count} errors detected (threshold: {rule.threshold})",
                    channel=rule.notification_channels.split(",")[0],
                )
                db.add(notif)
                triggered.append({"rule": rule.name, "value": count, "threshold": rule.threshold})
    db.commit()
    return {"triggered": triggered, "total_triggered": len(triggered)}

# ==========================================
# 6. ACTIVITY FEED
# ==========================================

@router.get("/activity-feed")
def get_activity_feed(limit: int = 100, event_type: str = "", db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    query = db.query(ActivityEvent)
    if event_type:
        query = query.filter(ActivityEvent.event_type == event_type)
    events = query.order_by(ActivityEvent.created_at.desc()).limit(limit).all()
    return [{
        "id": e.id, "event_type": e.event_type, "entity_type": e.entity_type,
        "entity_id": e.entity_id, "school_id": e.school_id,
        "user_email": e.user_email, "details": e.details,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "ago": _time_ago(e.created_at),
    } for e in events]

@router.get("/activity-feed/events")
def get_event_types(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    types = db.query(ActivityEvent.event_type, func.count(ActivityEvent.id)).group_by(ActivityEvent.event_type).all()
    return [{"type": t[0], "count": t[1]} for t in types]

def _time_ago(dt):
    if not dt:
        return "Unknown"
    diff = datetime.utcnow() - dt
    if diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds >= 3600:
        return f"{diff.seconds // 3600}h ago"
    elif diff.seconds >= 60:
        return f"{diff.seconds // 60}m ago"
    else:
        return "Just now"

# ==========================================
# 7. A/B TESTING
# ==========================================

@router.get("/ab-tests")
def get_ab_tests(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    tests = db.query(ABTest).order_by(ABTest.created_at.desc()).all()
    return [{
        "id": t.id, "name": t.name, "description": t.description,
        "feature_key": t.feature_key, "variant_a_name": t.variant_a_name,
        "variant_b_name": t.variant_b_name, "traffic_split": t.traffic_split,
        "target_schools": json.loads(t.target_schools) if t.target_schools else None,
        "status": t.status, "results": json.loads(t.results) if t.results else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "started_at": t.started_at.isoformat() if t.started_at else None,
        "ended_at": t.ended_at.isoformat() if t.ended_at else None,
    } for t in tests]

@router.post("/ab-tests")
def create_ab_test(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    test = ABTest(
        name=body["name"],
        description=body.get("description"),
        feature_key=body["feature_key"],
        variant_a_name=body.get("variant_a_name", "A"),
        variant_b_name=body.get("variant_b_name", "B"),
        traffic_split=body.get("traffic_split", 50),
        target_schools=json.dumps(body.get("target_schools", [])) if body.get("target_schools") else None,
    )
    db.add(test)
    log_activity(db, "ab_test_created", "ab_test", test.id, details=f"Test '{test.name}' created")
    db.commit()
    return {"message": "A/B test created", "id": test.id}

@router.put("/ab-tests/{test_id}")
def update_ab_test(test_id: int, body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    test = db.query(ABTest).filter(ABTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    for key in ["status", "results", "traffic_split"]:
        if key in body:
            val = body[key]
            if key == "results":
                val = json.dumps(val)
            elif key == "status" and val == "running":
                test.started_at = datetime.utcnow()
            elif key == "status" and val == "completed":
                test.ended_at = datetime.utcnow()
            setattr(test, key, val)
    db.commit()
    return {"message": "A/B test updated"}

@router.delete("/ab-tests/{test_id}")
def delete_ab_test(test_id: int, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    test = db.query(ABTest).filter(ABTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    db.delete(test)
    db.commit()
    return {"message": "A/B test deleted"}

# ==========================================
# 8. DATA ANONYMIZATION
# ==========================================

@router.post("/anonymize")
def anonymize_data(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    target = body.get("target", "all")
    fields = body.get("fields", ["email", "name", "phone"])
    count = 0
    if target in ["all", "users"]:
        users = db.query(UserDB).all()
        for u in users:
            if "email" in fields:
                u.email = f"user_{u.id}@anonymized.local"
            if "name" in fields:
                u.name = f"User {u.id}"
            count += 1
    if target in ["all", "schools"]:
        schools = db.query(SchoolDB).all()
        for s in schools:
            if "name" in fields:
                s.name = f"School {s.id}"
            if "email" in fields:
                s.email = f"school_{s.id}@anonymized.local"
            if "phone" in fields:
                s.phone = "+0000000000"
            count += 1
    db.commit()
    log_activity(db, "data_anonymized", "system", 0, details=f"{count} records anonymized by {owner.email}")
    return {"message": f"{count} records anonymized", "count": count}

@router.post("/anonymize/preview")
def anonymize_preview(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    fields = body.get("fields", ["email", "name"])
    sample = db.query(UserDB).limit(5).all()
    preview = []
    for u in sample:
        preview.append({
            "id": u.id,
            "original": {f: getattr(u, f, None) for f in fields},
            "anonymized": {f: (f"user_{u.id}@anonymized.local" if f == "email" else f"User {u.id}") for f in fields},
        })
    return {"preview": preview, "note": "This is a preview. Run POST /anonymize to apply changes."}

# ==========================================
# 9. REPORT GENERATOR
# ==========================================

@router.get("/reports")
def get_reports(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    reports = db.query(ReportRecord).order_by(ReportRecord.created_at.desc()).all()
    return [{
        "id": r.id, "school_id": r.school_id, "report_type": r.report_type,
        "format": r.format, "status": r.status, "file_url": r.file_url,
        "generated_by": r.generated_by,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "completed_at": r.completed_at.isoformat() if r.completed_at else None,
    } for r in reports]

@router.post("/reports/generate")
def generate_report(body: ReportRequest, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    report_type = body.report_type
    school_id = body.school_id
    report = ReportRecord(
        school_id=school_id,
        report_type=report_type,
        format=body.format,
        status="completed",
        generated_by=owner.email,
        completed_at=datetime.utcnow(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    try:
        data = _generate_report_data(db, report_type, school_id)
    except Exception as data_err:
        print(f"REPORT DATA COLLECTION FAILED: {str(data_err)}")
        data = {"error": "Failed to collect full report data", "details": str(data_err)}
    
    return {"message": "Report generated", "id": report.id, "data": data}

@router.get("/reports/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    report = db.query(ReportRecord).filter(ReportRecord.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Generate CSV data based on report type
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report.report_type == "security":
        writer.writerow(["ID", "Type", "Severity", "IP Address", "Details", "Resolved", "Created At"])
        incidents = db.query(SecurityIncident).all()
        for inc in incidents:
            writer.writerow([inc.id, inc.incident_type, inc.severity, inc.ip_address, inc.details, inc.resolved, inc.created_at])
    elif report.report_type == "financial":
        writer.writerow(["ID", "School ID", "Student", "Amount", "Status", "Date"])
        payments = db.query(PaymentDB).filter(PaymentDB.status == "Paid").all()
        for p in payments:
            writer.writerow([p.id, p.school_id, p.student_name, p.amount, p.status, p.payment_date])
    else:
        writer.writerow(["Report ID", "Type", "Generated By", "Date"])
        writer.writerow([report.id, report.report_type, report.generated_by, report.created_at])
    
    output.seek(0)
    filename = f"report_{report.report_type}_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

def _generate_report_data(db: Session, report_type: str, school_id: int = None):
    schools = db.query(SchoolDB).filter(SchoolDB.is_active == True)
    if school_id:
        schools = schools.filter(SchoolDB.id == school_id)
    schools = schools.all()
    if report_type == "financial":
        total_revenue = 0
        payments = db.query(PaymentDB)
        if school_id:
            payments = payments.filter(PaymentDB.school_id == school_id)
        payments = payments.filter(PaymentDB.status == "Paid").all()
        total_revenue = sum(p.amount for p in payments)
        return {"total_revenue": total_revenue, "payment_count": len(payments), "schools": len(schools)}
    elif report_type == "academic":
        total_students = 0
        total_teachers = 0
        for s in schools:
            total_students += db.query(UserDB).filter(UserDB.school_id == s.id, UserDB.role == "Student").count()
            total_teachers += db.query(UserDB).filter(UserDB.school_id == s.id, UserDB.role == "Teacher").count()
        return {"total_students": total_students, "total_teachers": total_teachers, "schools": len(schools)}
    elif report_type == "security":
        total_incidents = db.query(SecurityIncident).count()
        active_incidents = db.query(SecurityIncident).filter(SecurityIncident.resolved == False).count()
        blocked_ips = db.query(BlockedIP).filter(BlockedIP.is_active == True).count()
        return {"total_incidents": total_incidents, "active_incidents": active_incidents, "blocked_ips": blocked_ips}
    else:
        return {"total_schools": len(schools), "total_users": db.query(UserDB).count(), "generated_at": datetime.utcnow().isoformat()}

# ==========================================
# 10. LIVE CODE RELOAD
# ==========================================

@router.get("/reload/status")
def get_reload_status(owner=Depends(require_platform_owner)):
    import psutil
    process = psutil.Process(os.getpid())
    return {
        "pid": os.getpid(),
        "status": "running",
        "uptime_seconds": round(datetime.utcnow().timestamp() - process.create_time(), 1),
        "memory_mb": round(process.memory_info().rss / (1024 * 1024), 1),
    }

@router.post("/reload/restart")
def trigger_restart(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    log_activity(db, "server_restart_requested", "system", 0, details=f"Restart requested by {owner.email}")
    return {"message": "Restart signal sent. In production, this triggers a process restart via supervisor/systemd."}

@router.post("/reload/clear-cache")
def clear_cache(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    cache_dir = os.path.join(os.path.dirname(__file__), "..", "__pycache__")
    cleared = 0
    if os.path.exists(cache_dir):
        for root, dirs, files in os.walk(cache_dir):
            for f in files:
                if f.endswith(".pyc"):
                    os.remove(os.path.join(root, f))
                    cleared += 1
    return {"message": f"Cache cleared ({cleared} files removed)"}

# ==========================================
# 11. MIGRATION MANAGER
# ==========================================

@router.get("/migrations")
def get_migrations(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    migrations = db.query(MigrationRecord).order_by(MigrationRecord.created_at.desc()).all()
    pending = [
        {"name": "001_add_user_avatar_url", "description": "Add avatar_url column to users"},
        {"name": "002_add_school_settings", "description": "Add settings JSON column to schools"},
        {"name": "003_add_audit_trail", "description": "Create audit_trail table"},
    ]
    applied_names = {m.migration_name for m in migrations}
    for p in pending:
        if p["name"] not in applied_names:
            p["status"] = "pending"
            migrations.append(MigrationRecord(
                migration_name=p["name"], status="pending", details=p["description"]
            ))
    db.commit()
    result = db.query(MigrationRecord).order_by(MigrationRecord.created_at.desc()).all()
    return [{
        "id": m.id, "migration_name": m.migration_name, "status": m.status,
        "applied_at": m.applied_at.isoformat() if m.applied_at else None,
        "rolled_back_at": m.rolled_back_at.isoformat() if m.rolled_back_at else None,
        "details": m.details,
    } for m in result]

@router.post("/migrations/apply")
def apply_migration(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    migration_name = body.get("migration_name")
    if not migration_name:
        raise HTTPException(status_code=400, detail="migration_name required")
    mig = db.query(MigrationRecord).filter(MigrationRecord.migration_name == migration_name).first()
    if not mig:
        mig = MigrationRecord(migration_name=migration_name, status="applying", details=body.get("description"))
        db.add(mig)
    try:
        if migration_name == "001_add_user_avatar_url":
            from sqlalchemy import text
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
            except Exception:
                pass
        mig.status = "applied"
        mig.applied_at = datetime.utcnow()
        db.commit()
        log_activity(db, "migration_applied", "migration", mig.id, details=f"Migration {migration_name} applied")
        return {"message": f"Migration {migration_name} applied"}
    except Exception as e:
        mig.status = "failed"
        mig.details = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/migrations/rollback")
def rollback_migration(body: dict, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    migration_name = body.get("migration_name")
    if not migration_name:
        raise HTTPException(status_code=400, detail="migration_name required")
    mig = db.query(MigrationRecord).filter(MigrationRecord.migration_name == migration_name).first()
    if not mig or mig.status != "applied":
        raise HTTPException(status_code=400, detail="Migration not applied")
    try:
        if migration_name == "001_add_user_avatar_url":
            from sqlalchemy import text
            try:
                db.execute(text("ALTER TABLE users DROP COLUMN avatar_url"))
            except Exception:
                pass
        mig.status = "rolled_back"
        mig.rolled_back_at = datetime.utcnow()
        db.commit()
        return {"message": f"Migration {migration_name} rolled back"}
    except Exception as e:
        mig.status = "failed"
        mig.details = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
