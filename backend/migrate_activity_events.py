import sqlite3

def migrate():
    conn = sqlite3.connect('edusaas.db')
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("PRAGMA table_info(activity_events)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    # Add missing columns
    if 'ip_address' not in columns:
        print("Adding ip_address column...")
        cursor.execute("ALTER TABLE activity_events ADD COLUMN ip_address TEXT")
        
    if 'user_agent' not in columns:
        print("Adding user_agent column...")
        cursor.execute("ALTER TABLE activity_events ADD COLUMN user_agent TEXT")
        
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
