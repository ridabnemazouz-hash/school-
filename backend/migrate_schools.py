import sqlite3

conn = sqlite3.connect('edusaas.db')

conn.execute('''
CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY,
    name TEXT,
    code TEXT UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    subscription_plan TEXT DEFAULT 'Free',
    subscription_status TEXT DEFAULT 'Active',
    subscription_expiry TEXT,
    max_students INTEGER DEFAULT 50,
    max_teachers INTEGER DEFAULT 10,
    is_active INTEGER DEFAULT 1,
    created_at TEXT
)
''')

existing = conn.execute("SELECT id FROM schools WHERE code = 'DEMO'").fetchone()
if not existing:
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    conn.execute("INSERT INTO schools (name, code, address, phone, email, subscription_plan, subscription_status, max_students, max_teachers, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ('Demo School', 'DEMO', 'Casablanca, Morocco', '+212 5 22 00 00 00', 'contact@demo-school.ma', 'Premium', 'Active', '999', '999', 1, now))
    print("Created default school: Demo School (ID=1)")
else:
    print("Default school exists")

columns_to_add = {
    'users': 'school_id',
    'security_logs': 'school_id',
    'students': 'school_id',
    'classes': 'school_id',
    'subjects': 'school_id',
    'teacher_classes': 'school_id',
    'notes': 'school_id',
    'schedule': 'school_id',
    'messages': 'school_id',
    'content': 'school_id',
    'payments': 'school_id',
    'expenses': 'school_id',
    'salaries': 'school_id',
    'video_rooms': 'school_id',
}

for table, col in columns_to_add.items():
    cols = [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    if col not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} INTEGER")
        print(f"Added {col} to {table}")
    else:
        print(f"{col} already in {table}")

conn.execute("UPDATE users SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE security_logs SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE students SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE classes SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE subjects SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE teacher_classes SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE notes SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE schedule SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE messages SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE content SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE payments SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE expenses SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE salaries SET school_id = 1 WHERE school_id IS NULL")
conn.execute("UPDATE video_rooms SET school_id = 1 WHERE school_id IS NULL")
conn.commit()

cursor = conn.execute("SELECT id, name, code, subscription_plan FROM schools")
for row in cursor.fetchall():
    print(f"School: {row}")

cursor = conn.execute("SELECT id, name, role, school_id FROM users WHERE school_id IS NOT NULL")
rows = cursor.fetchall()
print(f"\nUsers with school_id: {len(rows)}")
for r in rows:
    print(r)

conn.close()
print("\nMigration complete!")
