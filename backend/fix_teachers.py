import sqlite3
conn = sqlite3.connect('edusaas.db')
conn.execute("UPDATE users SET status = 'Active' WHERE role = 'Teacher'")
conn.commit()
cursor = conn.execute("SELECT id, name, email, role, status FROM users WHERE role = 'Teacher'")
for row in cursor.fetchall():
    print(row)
conn.close()
print("Done - all teachers set to Active")
