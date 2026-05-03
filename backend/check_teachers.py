import sqlite3
conn = sqlite3.connect('edusaas.db')
cursor = conn.execute("SELECT id, name, email, role, status FROM users WHERE role = 'Teacher'")
rows = cursor.fetchall()
print("Teachers in DB:", rows)
conn.close()
