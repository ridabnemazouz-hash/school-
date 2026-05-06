from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import SubscriptionDB, SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse, SchoolDB
from routes.auth import require_owner, require_admin_or_super

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

PLAN_PRICES = {
    "Free": 0,
    "Basic": 2900,  # $29/month
    "Premium": 9900,  # $99/month
    "Enterprise": 29900  # $299/month
}

PLAN_LIMITS = {
    "Free": {"max_students": 50, "max_teachers": 10},
    "Basic": {"max_students": 200, "max_teachers": 30},
    "Premium": {"max_students": 1000, "max_teachers": 100},
    "Enterprise": {"max_students": 999999, "max_teachers": 999999}
}

def check_subscription_expiry(db: Session):
    """Check and update expired subscriptions"""
    now = datetime.utcnow()
    expired = db.query(SubscriptionDB).filter(
        SubscriptionDB.expires_at < now,
        SubscriptionDB.status == "Active"
    ).all()
    
    for sub in expired:
        sub.status = "Expired"
        # Update school status
        school = db.query(SchoolDB).filter(SchoolDB.id == sub.school_id).first()
        if school:
            school.subscription_status = "Expired"
    
    if expired:
        db.commit()

@router.get("/{school_id}")
def get_subscription(school_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin_or_super)):
    # Check for expired subscriptions first
    check_subscription_expiry(db)
    
    # School users can only view their own subscription
    if current_user.school_id and current_user.school_id != school_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    subscription = db.query(SubscriptionDB).filter(SubscriptionDB.school_id == school_id).first()
    
    if not subscription:
        # Create default free subscription
        subscription = SubscriptionDB(
            school_id=school_id,
            plan="Free",
            status="Active",
            started_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=365*100)  # Free never expires
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "school_id": subscription.school_id,
        "plan": subscription.plan,
        "status": subscription.status,
        "started_at": subscription.started_at.isoformat() if subscription.started_at else None,
        "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None,
        "amount_paid": subscription.amount_paid,
        "billing_cycle": subscription.billing_cycle,
        "auto_renew": subscription.auto_renew,
        "limits": PLAN_LIMITS.get(subscription.plan, PLAN_LIMITS["Free"])
    }

@router.post("/{school_id}")
def create_subscription(
    school_id: int, 
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_owner)
):
    # Verify school exists
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Check if subscription already exists
    existing = db.query(SubscriptionDB).filter(SubscriptionDB.school_id == school_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subscription already exists. Use PUT to update.")
    
    # Calculate expiry
    expires_at = datetime.utcnow()
    if data.billing_cycle == "yearly":
        expires_at += timedelta(days=365)
    else:
        expires_at += timedelta(days=30)
    
    subscription = SubscriptionDB(
        school_id=school_id,
        plan=data.plan,
        status="Active",
        started_at=datetime.utcnow(),
        expires_at=expires_at,
        amount_paid=data.amount_paid,
        billing_cycle=data.billing_cycle
    )
    
    # Update school subscription info
    school.subscription_plan = data.plan
    school.subscription_status = "Active"
    school.subscription_expiry = expires_at.strftime("%Y-%m-%d")
    school.max_students = PLAN_LIMITS.get(data.plan, PLAN_LIMITS["Free"])["max_students"]
    school.max_teachers = PLAN_LIMITS.get(data.plan, PLAN_LIMITS["Free"])["max_teachers"]
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "school_id": subscription.school_id,
        "plan": subscription.plan,
        "status": subscription.status,
        "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None
    }

@router.put("/{school_id}")
def update_subscription(
    school_id: int,
    data: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_owner)
):
    subscription = db.query(SubscriptionDB).filter(SubscriptionDB.school_id == school_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if data.plan:
        subscription.plan = data.plan
        # Update school limits
        school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
        if school:
            school.subscription_plan = data.plan
            school.max_students = PLAN_LIMITS.get(data.plan, PLAN_LIMITS["Free"])["max_students"]
            school.max_teachers = PLAN_LIMITS.get(data.plan, PLAN_LIMITS["Free"])["max_teachers"]
    
    if data.status:
        subscription.status = data.status
        school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
        if school:
            school.subscription_status = data.status
    
    if data.expires_at:
        subscription.expires_at = data.expires_at
    
    if data.auto_renew is not None:
        subscription.auto_renew = data.auto_renew
    
    db.commit()
    db.refresh(subscription)
    
    return {"message": "Subscription updated successfully"}

@router.get("/plans/available")
def get_available_plans():
    return {
        "plans": [
            {
                "name": "Free",
                "price_monthly": 0,
                "price_yearly": 0,
                "max_students": 50,
                "max_teachers": 10,
                "features": ["Basic dashboard", "Up to 50 students", "Up to 10 teachers"]
            },
            {
                "name": "Basic",
                "price_monthly": 2900,
                "price_yearly": 29000,
                "max_students": 200,
                "max_teachers": 30,
                "features": ["Advanced dashboard", "Up to 200 students", "Up to 30 teachers", "Email support"]
            },
            {
                "name": "Premium",
                "price_monthly": 9900,
                "price_yearly": 99000,
                "max_students": 1000,
                "max_teachers": 100,
                "features": ["Full dashboard", "Up to 1000 students", "Up to 100 teachers", "Priority support", "Analytics"]
            },
            {
                "name": "Enterprise",
                "price_monthly": 29900,
                "price_yearly": 299000,
                "max_students": 999999,
                "max_teachers": 999999,
                "features": ["Unlimited", "Custom features", "Dedicated support", "SLA"]
            }
        ]
    }
