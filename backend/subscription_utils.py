from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException
from database import SessionLocal
from models import SchoolDB
import datetime

class SubscriptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip check for public paths and platform owner paths
        path = request.url.path
        if path.startswith(("/auth", "/docs", "/openapi.json", "/health", "/enterprise")):
            return await call_next(request)
        
        # We need the current user to check their school_id
        # This is tricky because we haven't authenticated yet in the middleware chain
        # Usually, this check is done in a dependency or after auth middleware
        # But for global blocking, we can extract school_id from token if present
        
        # For now, let's implement this as a decorator or a dependency to be more precise
        return await call_next(request)

GRACE_PERIOD_DAYS = 3

def check_subscription(school_id: int, db):
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    if not school:
        return
    
    if not school.is_active:
        raise HTTPException(status_code=402, detail="School account is inactive. Please contact support.")
    
    if school.subscription_status == "Expired":
        # Point 9: Grace Period check
        if school.subscription_expiry:
            try:
                # Assuming ISO format or simple YYYY-MM-DD
                expiry_date = datetime.datetime.fromisoformat(school.subscription_expiry.replace("Z", "+00:00"))
                grace_end = expiry_date + datetime.timedelta(days=GRACE_PERIOD_DAYS)
                
                if datetime.datetime.utcnow() > grace_end:
                    raise HTTPException(status_code=402, detail="Subscription grace period ended. Please renew to access your data.")
            except (ValueError, TypeError):
                # Fallback if date parsing fails
                raise HTTPException(status_code=402, detail="Subscription expired. Please renew access.")
        else:
            raise HTTPException(status_code=402, detail="Subscription expired. Please renew access.")
