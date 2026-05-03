import sqlite3
conn = sqlite3.connect('edusaas.db')
cursor = conn.execute("SELECT id, name, role, status, created_at FROM users WHERE role = 'Student'")
for row in cursor.fetchall():
    print(row)
conn.close()
