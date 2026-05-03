import sqlite3
from datetime import datetime

conn = sqlite3.connect('edusaas.db')
now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')
conn.execute("UPDATE users SET created_at = ? WHERE created_at IS NULL", (now,))
conn.commit()
cursor = conn.execute("SELECT id, name, created_at FROM users WHERE role = 'Student'")
for row in cursor.fetchall():
    print(row)
conn.close()
