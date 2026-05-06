from sqlalchemy.orm import Query
from fastapi import HTTPException
from models import UserDB

def enforce_school_scope(query: Query, model, user: UserDB) -> Query:
    """
    Enforces multi-tenant isolation by filtering queries based on the user's school_id.
    If the user is a Platform Owner, no filter is applied (full access).
    """
    if user.role in ["Owner", "Super Admin"] and user.school_id is None:
        return query
    
    if hasattr(model, 'school_id'):
        return query.filter(model.school_id == user.school_id)
    
    return query

def validate_school_access(school_id: int, user: UserDB):
    """
    Validates that a user has access to a specific school.
    """
    if user.role in ["Owner", "Super Admin"] and user.school_id is None:
        return True
    
    if user.school_id != school_id:
        raise HTTPException(status_code=403, detail="Access denied to this school's data")
    
    return True
