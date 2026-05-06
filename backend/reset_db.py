import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models import *
from auth_utils import get_password_hash
from datetime import datetime

def reset_database():
    db = SessionLocal()
    try:
        print("Deleting all data from all tables...")

        # Delete in correct order to avoid foreign key issues
        tables_to_clear = [
            (SecurityLogDB, "security_logs"),
            (MessageDB, "messages"),
            (NoteDB, "notes"),
            (ScheduleEntryDB, "schedule"),
            (ContentDB, "content"),
            (PaymentDB, "payments"),
            (ExpenseDB, "expenses"),
            (SalaryDB, "salaries"),
            (VideoRoomDB, "video_rooms"),
            (TeacherClassDB, "teacher_classes"),
            (StudentDB, "students"),
            (ClassDB, "classes"),
            (SubjectDB, "subjects"),
            (FeatureFlagDB, "feature_flags"),
            (BlockedIP, "blocked_ips"),
            (SecurityIncident, "security_incidents"),
            (BackupRecord, "backup_records"),
            (IntegrationConfig, "integration_configs"),
            (AlertRule, "alert_rules"),
            (AlertNotification, "alert_notifications"),
            (ABTest, "ab_tests"),
            (MigrationRecord, "migration_records"),
            (ActivityEvent, "activity_events"),
            (BillingMetric, "billing_metrics"),
            (ReportRecord, "report_records"),
            (UserDB, "users"),
            (SchoolDB, "schools"),
        ]

        for model, table_name in tables_to_clear:
            try:
                count = db.query(model).delete()
                print(f"  Cleared {table_name} ({count} records)")
            except Exception as e:
                print(f"  Error clearing {table_name}: {e}")

        print("\nCreating developer account...")

        # Create single developer account
        developer = UserDB(
            name="Developer",
            email="dev@edusaas.com",
            role="Super Admin",
            hashed_password=get_password_hash("dev123"),
            status="Active",
            created_at=datetime.utcnow()
        )
        db.add(developer)
        db.commit()

        print("Developer account created:")
        print("  Email: dev@edusaas.com")
        print("  Password: dev123")
        print("  Role: Super Admin")

        print("\nDatabase reset complete!")
        print("  - All schools deleted")
        print("  - All user accounts deleted")
        print("  - Only developer account remains")

    except Exception as e:
        print(f"\nError: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
