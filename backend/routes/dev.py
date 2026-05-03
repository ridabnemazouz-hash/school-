from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from database import get_db, engine
from routes.auth import get_current_user, require_super_admin
from models import (
    UserDB, SchoolDB, StudentDB, ClassDB, SecurityLogDB, FeatureFlagDB,
    SubjectDB, MessageDB, ContentDB, PaymentDB, ExpenseDB, SalaryDB,
    TeacherClassDB, NoteDB, ScheduleEntryDB, VideoRoomDB
)
import os
import csv
import io
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/dev", tags=["dev"])

ALLOWED_MODELS = {
    "users": UserDB,
    "schools": SchoolDB,
    "students": StudentDB,
    "classes": ClassDB,
    "subjects": SubjectDB,
    "messages": MessageDB,
    "content": ContentDB,
    "payments": PaymentDB,
    "expenses": ExpenseDB,
    "salaries": SalaryDB,
    "teacher_classes": TeacherClassDB,
    "notes": NoteDB,
    "schedule": ScheduleEntryDB,
    "video_rooms": VideoRoomDB,
    "security_logs": SecurityLogDB,
    "feature_flags": FeatureFlagDB,
}

DEFAULT_FLAGS = [
    ("ai_tutor", "AI Tutor", True, "Enable AI-powered tutoring features"),
    ("payments", "Payments", True, "Enable payment processing"),
    ("chat", "Chat", True, "Enable student-teacher chat"),
    ("video_rooms", "Video Rooms", True, "Enable video conferencing"),
    ("transport", "Transport", True, "Enable bus/transport management"),
    ("analytics", "Analytics", False, "Enable advanced analytics dashboard"),
    ("api_access", "API Access", False, "Allow external API integrations"),
    ("custom_branding", "Custom Branding", False, "Allow schools to customize branding"),
]

def seed_flags(db: Session):
    existing = db.query(FeatureFlagDB).count()
    if existing == 0:
        for key, name, enabled, desc in DEFAULT_FLAGS:
            db.add(FeatureFlagDB(key=key, name=name, enabled=enabled, description=desc))
        db.commit()

def require_platform_owner(current_user=Depends(require_super_admin)):
    if current_user.school_id is not None:
        raise HTTPException(status_code=403, detail="Only platform owner can access dev tools")
    return current_user

@router.get("/tables")
def list_tables(owner=Depends(require_platform_owner)):
    tables = []
    for name, model in ALLOWED_MODELS.items():
        mapper = inspect(model)
        cols = [c.key for c in mapper.attrs]
        tables.append({"name": name, "columns": cols})
    return tables

@router.get("/tables/{table_name}")
def get_table_data(
    table_name: str,
    page: int = 1,
    per_page: int = 20,
    search: str = "",
    sort_col: str = "id",
    sort_dir: str = "desc",
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    if table_name not in ALLOWED_MODELS:
        raise HTTPException(status_code=400, detail=f"Table not available. Allowed: {list(ALLOWED_MODELS.keys())}")

    model = ALLOWED_MODELS[table_name]
    mapper = inspect(model)
    cols = {c.key: c for c in mapper.attrs}

    query = db.query(model)

    if search:
        from sqlalchemy import or_
        filters = []
        for col_name, col in cols.items():
            if hasattr(col, 'columns') and len(col.columns) > 0:
                sql_col = list(col.columns)[0]
                if 'VARCHAR' in str(sql_col.type) or 'TEXT' in str(sql_col.type) or 'STRING' in str(sql_col.type):
                    filters.append(sql_col.ilike(f"%{search}%"))
        if filters:
            query = query.filter(or_(*filters))

    total = query.count()

    if sort_col in cols:
        sort_attr = getattr(model, sort_col, None)
        if sort_attr is not None:
            query = query.order_by(sort_attr.desc() if sort_dir == "desc" else sort_attr.asc())

    offset = (page - 1) * per_page
    data = query.offset(offset).limit(per_page).all()

    result = []
    for row in data:
        row_dict = {}
        for col_name in cols.keys():
            val = getattr(row, col_name, None)
            if isinstance(val, datetime):
                val = val.isoformat()
            if col_name == "hashed_password":
                val = "***REDACTED***"
            row_dict[col_name] = val
        result.append(row_dict)

    return {
        "table": table_name,
        "columns": list(cols.keys()),
        "data": result,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
    }

@router.get("/tables/{table_name}/export")
def export_table(
    table_name: str,
    fmt: str = "json",
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    if table_name not in ALLOWED_MODELS:
        raise HTTPException(status_code=400, detail="Table not available")

    model = ALLOWED_MODELS[table_name]
    mapper = inspect(model)
    cols = [c.key for c in mapper.attrs]

    data = db.query(model).all()
    result = []
    for row in data:
        row_dict = {}
        for col_name in cols:
            val = getattr(row, col_name, None)
            if isinstance(val, datetime):
                val = val.isoformat()
            if col_name == "hashed_password":
                val = "***REDACTED***"
            row_dict[col_name] = val
        result.append(row_dict)

    if fmt == "csv":
        output = io.StringIO()
        if result:
            writer = csv.DictWriter(output, fieldnames=cols)
            writer.writeheader()
            writer.writerows(result)
        from fastapi.responses import StreamingResponse
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={table_name}.csv"},
        )

    return {"table": table_name, "columns": cols, "data": result, "total": len(result)}

@router.put("/tables/{table_name}/{record_id}")
def update_record(
    table_name: str,
    record_id: int,
    updates: dict,
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    if table_name not in ALLOWED_MODELS:
        raise HTTPException(status_code=400, detail="Table not available")

    forbidden = {"hashed_password", "id", "refresh_token"}
    safe = {k: v for k, v in updates.items() if k not in forbidden}
    if not safe:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    model = ALLOWED_MODELS[table_name]
    record = db.query(model).filter(model.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    changes = {}
    for key, val in safe.items():
        old_val = getattr(record, key, None)
        setattr(record, key, val)
        changes[key] = {"old": str(old_val), "new": str(val)}

    log_dev_action(db, "update", owner, table_name, record_id, changes)
    db.commit()
    db.refresh(record)
    return {"message": "Record updated", "changes": changes}

@router.delete("/tables/{table_name}/{record_id}")
def delete_record(
    table_name: str,
    record_id: int,
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    if table_name not in ALLOWED_MODELS:
        raise HTTPException(status_code=400, detail="Table not available")
    if table_name == "schools" and record_id == 1:
        raise HTTPException(status_code=400, detail="Cannot delete default school")
    if table_name == "users" and record_id == 1:
        raise HTTPException(status_code=400, detail="Cannot delete platform owner")

    model = ALLOWED_MODELS[table_name]
    record = db.query(model).filter(model.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    log_dev_action(db, "delete", owner, table_name, record_id, {})
    db.delete(record)
    db.commit()
    return {"message": f"Record {record_id} deleted from {table_name}"}

@router.post("/sql")
def run_sql(
    query: dict,
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    sql = query.get("sql", "").strip()
    if not sql:
        raise HTTPException(status_code=400, detail="No SQL query provided")

    forbidden_ops = ["DROP ", "ALTER ", "TRUNCATE ", "DELETE ", "CREATE ", "INSERT ", "UPDATE ", "GRANT ", "REVOKE ", "EXEC "]
    upper_sql = sql.upper().strip()
    for op in forbidden_ops:
        if upper_sql.startswith(op) or f" {op}" in upper_sql:
            raise HTTPException(status_code=403, detail=f"WRITE operations are disabled in Dev Console. Only SELECT queries allowed.")

    try:
        result = db.execute(text(sql))
        columns = result.keys() if result.returns_rows else []
        rows = [dict(r._mapping) for r in result] if result.returns_rows else []

        for row in rows:
            for k, v in row.items():
                if isinstance(v, datetime):
                    row[k] = v.isoformat()

        return {
            "columns": list(columns),
            "rows": rows,
            "row_count": len(rows),
            "execution_time_ms": 0,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stats")
def get_db_stats(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    stats = {}
    for name, model in ALLOWED_MODELS.items():
        stats[name] = db.query(model).count()

    stats["active_users"] = db.query(UserDB).filter(UserDB.status == "Active").count()
    stats["pending_users"] = db.query(UserDB).filter(UserDB.status == "Pending").count()
    stats["active_schools"] = db.query(SchoolDB).filter(SchoolDB.is_active == True).count()
    stats["db_size_mb"] = get_db_size()
    return stats

@router.get("/logs")
def get_dev_logs(limit: int = 100, event_type: str = "", db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    query = db.query(SecurityLogDB)
    if event_type:
        query = query.filter(SecurityLogDB.event_type == event_type)
    logs = query.order_by(SecurityLogDB.created_at.desc()).limit(limit).all()
    return [{
        "id": l.id, "event_type": l.event_type, "email": l.email,
        "ip_address": l.ip_address, "user_agent": l.user_agent,
        "details": l.details, "created_at": l.created_at.isoformat() if l.created_at else None,
    } for l in logs]

@router.get("/recent-actions")
def get_recent_actions(limit: int = 50, db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    logs = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type.in_(["dev_action", "login_success", "login_failed", "registration"])
    ).order_by(SecurityLogDB.created_at.desc()).limit(limit).all()
    return [{
        "id": l.id, "action": l.event_type, "user": l.email, "ip": l.ip_address,
        "details": l.details, "timestamp": l.created_at.isoformat() if l.created_at else None,
    } for l in logs]

@router.get("/errors")
def get_recent_errors(limit: int = 50, owner=Depends(require_platform_owner)):
    log_file = os.path.join(os.path.dirname(__file__), "..", "security.log")
    if not os.path.exists(log_file):
        return {"errors": []}
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        errors = []
        for line in reversed(lines[-500:]):
            if "ERROR" in line or "WARNING" in line or "Exception" in line:
                errors.append(line.strip())
            if len(errors) >= limit:
                break
        return {"errors": errors[:limit], "total_lines": len(lines)}
    except Exception as e:
        return {"errors": [f"Failed to read log file: {str(e)}"]}

@router.get("/system")
def get_system_info(owner=Depends(require_platform_owner)):
    import psutil
    import platform
    import time

    process = psutil.Process(os.getpid())
    cpu_percent = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()

    return {
        "version": "2.0.0",
        "environment": "development" if os.environ.get("PRODUCTION") != "true" else "production",
        "python_version": platform.python_version(),
        "os": f"{platform.system()} {platform.release()}",
        "cpu_percent": cpu_percent,
        "memory_total_mb": round(mem.total / (1024 * 1024), 1),
        "memory_used_mb": round(mem.used / (1024 * 1024), 1),
        "memory_percent": mem.percent,
        "process_memory_mb": round(process.memory_info().rss / (1024 * 1024), 1),
        "db_size_mb": get_db_size(),
        "uptime": round(time.time() - psutil.Process(os.getpid()).create_time(), 1),
        "active_connections": len(psutil.net_connections(kind='inet')) if hasattr(psutil, 'net_connections') else 0,
    }

@router.get("/sessions")
def get_active_sessions(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    users = db.query(UserDB).filter(UserDB.refresh_token.isnot(None)).all()
    sessions = []
    for u in users:
        from auth_utils import decode_token
        payload = decode_token(u.refresh_token)
        expires = "Unknown"
        if payload and payload.get("exp"):
            try:
                exp_dt = datetime.utcfromtimestamp(payload["exp"])
                if exp_dt < datetime.utcnow():
                    expires = "Expired"
                else:
                    delta = exp_dt - datetime.utcnow()
                    expires = f"{delta.days}d {delta.seconds // 3600}h"
            except Exception:
                expires = "Invalid"

        sessions.append({
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "school_id": u.school_id,
            "last_active": u.created_at.isoformat() if u.created_at else None,
            "token_expires": expires,
            "status": u.status,
        })
    return sessions

@router.post("/sessions/{user_id}/revoke")
def revoke_session(
    user_id: int,
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == owner.id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own session")
    user.refresh_token = None
    db.commit()
    log_dev_action(db, "revoke_session", owner, "users", user_id, {"email": user.email})
    return {"message": f"Session revoked for {user.email}"}

@router.post("/sessions/revoke-all")
def revoke_all_sessions(
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    db.query(UserDB).update({UserDB.refresh_token: None}, synchronize_session=False)
    db.commit()
    log_dev_action(db, "revoke_all_sessions", owner, "users", 0, {})
    return {"message": "All sessions revoked"}

@router.get("/feature-flags")
def get_feature_flags(db: Session = Depends(get_db), owner=Depends(require_platform_owner)):
    seed_flags(db)
    flags = db.query(FeatureFlagDB).all()
    return [{
        "id": f.id, "key": f.key, "name": f.name, "enabled": f.enabled,
        "description": f.description, "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    } for f in flags]

@router.put("/feature-flags/{flag_id}")
def toggle_feature_flag(
    flag_id: int,
    body: dict,
    db: Session = Depends(get_db),
    owner=Depends(require_platform_owner),
):
    flag = db.query(FeatureFlagDB).filter(FeatureFlagDB.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    old = flag.enabled
    if "enabled" in body:
        flag.enabled = body["enabled"]
    flag.updated_at = datetime.utcnow()
    db.commit()

    log_dev_action(db, "toggle_flag", owner, "feature_flags", flag_id, {"key": flag.key, "old": old, "new": flag.enabled})
    return {"message": f"Flag '{flag.key}' toggled", "enabled": flag.enabled}

def get_db_size():
    try:
        url = str(engine.url)
        if "sqlite" in url:
            db_path = url.split("///")[-1]
            if os.path.exists(db_path):
                return round(os.path.getsize(db_path) / (1024 * 1024), 2)
        return 0.0
    except Exception:
        return 0.0

def log_dev_action(db: Session, action: str, user, table: str, record_id: int, changes: dict):
    log = SecurityLogDB(
        event_type="dev_action",
        email=user.email,
        ip_address="localhost",
        details=f"[{action}] {table}#{record_id} | {str(changes)}",
    )
    db.add(log)
    db.commit()

@router.get("/schema")
def get_schema(owner=Depends(require_platform_owner)):
    schema = {}
    for name, model in ALLOWED_MODELS.items():
        mapper = inspect(model)
        cols = []
        for c in mapper.attrs:
            if hasattr(c, 'columns') and len(c.columns) > 0:
                sql_col = list(c.columns)[0]
                cols.append({
                    "name": c.key,
                    "type": str(sql_col.type),
                    "primary": sql_col.primary_key,
                    "nullable": sql_col.nullable,
                    "unique": sql_col.unique if hasattr(sql_col, 'unique') else False,
                })

        foreign_keys = []
        for table_name in mapper.columns.keys():
            col_obj = mapper.columns[table_name]
            for fk in col_obj.foreign_keys:
                foreign_keys.append({
                    "column": c.key if c.key == table_name else table_name,
                    "references": str(fk.target_fullname),
                })

        schema[name] = {"columns": cols, "foreign_keys": foreign_keys, "total": len(cols)}

    edges = []
    for name, info in schema.items():
        for fk in info["foreign_keys"]:
            ref_table = fk["references"].split(".")[0] if "." in fk["references"] else fk["references"]
            edges.append({"from": name, "to": ref_table, "column": fk["column"]})

    return {"tables": schema, "edges": edges}

@router.get("/logs-summary")
def get_logs_summary(owner=Depends(require_platform_owner)):
    db = next(get_db())
    now = datetime.utcnow()

    total = db.query(SecurityLogDB).count()
    failed_logins = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_failed"
    ).count()
    successful_logins = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_success"
    ).count()
    dev_actions = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "dev_action"
    ).count()
    registrations = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "registration"
    ).count()

    top_emails = db.query(
        SecurityLogDB.email,
        __import__("sqlalchemy").func.count(SecurityLogDB.id).label("cnt")
    ).group_by(SecurityLogDB.email).order_by(__import__("sqlalchemy").desc("cnt")).limit(10).all()

    event_types = db.query(
        SecurityLogDB.event_type,
        __import__("sqlalchemy").func.count(SecurityLogDB.id).label("cnt")
    ).group_by(SecurityLogDB.event_type).order_by(__import__("sqlalchemy").desc("cnt")).all()

    recent_issues = []
    hour_ago = now - __import__("datetime").timedelta(hours=1)
    failed_last_hour = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_failed",
        SecurityLogDB.created_at >= hour_ago
    ).count()
    if failed_last_hour > 5:
        recent_issues.append(f"⚠️ {failed_last_hour} failed login attempts in the last hour")

    blocked = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "rate_limit_blocked"
    ).count()
    if blocked > 0:
        recent_issues.append(f"🚫 {blocked} rate limit blocks detected")

    top_ips = db.query(
        SecurityLogDB.ip_address,
        __import__("sqlalchemy").func.count(SecurityLogDB.id).label("cnt")
    ).filter(
        SecurityLogDB.ip_address.isnot(None),
        SecurityLogDB.event_type == "login_failed"
    ).group_by(SecurityLogDB.ip_address).order_by(__import__("sqlalchemy").desc("cnt")).limit(5).all()

    summary_text = f"""📊 **System Summary**
Total events: {total} | Logins: {successful_logins} | Failed: {failed_logins} | Dev actions: {dev_actions}
Registrations: {registrations} | Rate blocks: {blocked}
"""
    if recent_issues:
        summary_text += "\n⚠️ Issues:\n" + "\n".join(recent_issues)
    if top_emails:
        summary_text += "\n\n👥 Most active users:\n" + "\n".join([f"- {e[0] or 'system'} ({e[1]} events)" for e in top_emails[:5]])

    return {
        "total": total,
        "failed_logins": failed_logins,
        "successful_logins": successful_logins,
        "dev_actions": dev_actions,
        "registrations": registrations,
        "rate_blocks": blocked,
        "recent_issues": recent_issues,
        "top_emails": [{"email": e[0], "count": e[1]} for e in top_emails],
        "event_types": [{"type": e[0], "count": e[1]} for e in event_types],
        "top_failed_ips": [{"ip": i[0], "count": i[1]} for i in top_ips],
        "summary": summary_text,
    }

@router.get("/perf")
def get_performance(owner=Depends(require_platform_owner)):
    import time

    queries = {}
    db = next(get_db())

    for name, model in ALLOWED_MODELS.items():
        start = time.time()
        count = db.query(model).count()
        elapsed = (time.time() - start) * 1000
        queries[name] = {"count": count, "query_time_ms": round(elapsed, 2)}

    slow_queries = [{"table": k, "time": v["query_time_ms"], "rows": v["count"]}
                    for k, v in queries.items() if v["query_time_ms"] > 10]
    slow_queries.sort(key=lambda x: x["time"], reverse=True)

    suggestions = []
    if slow_queries:
        for sq in slow_queries[:3]:
            suggestions.append(f"⚡ {sq['table']}: {sq['time']:.1f}ms — consider adding index or optimizing query")

    return {
        "queries": queries,
        "slow_queries": slow_queries,
        "suggestions": suggestions,
        "total_tables": len(queries),
    }
