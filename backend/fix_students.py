import sqlite3
from auth_utils import get_password_hash

conn = sqlite3.connect('edusaas.db')
cursor = conn.execute('SELECT id, name, avatar_url FROM students WHERE avatar_url IS NOT NULL')
students = cursor.fetchall()

for sid, name, avatar in students:
    email = f"{name}_{sid}@school.com"
    hashed = get_password_hash(name + "123")
    conn.execute(
        'INSERT INTO users (name, email, role, hashed_password, status) VALUES (?, ?, ?, ?, ?)',
        (name, email, 'Student', hashed, 'Active')
    )
    conn.commit()
    user_id = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()[0]
    conn.execute('UPDATE students SET user_id = ? WHERE id = ?', (user_id, sid))
    conn.commit()
    print(f"Student {sid}: user_id={user_id}, avatar={avatar}")

conn.close()
print("Done!")
