import sqlite3

conn = sqlite3.connect('edusaas.db')
try:
    conn.execute('ALTER TABLE students ADD COLUMN user_id INTEGER')
except:
    pass

cursor = conn.execute('SELECT id, name FROM students')
students = cursor.fetchall()

for sid, sname in students:
    cursor2 = conn.execute(
        'SELECT id FROM users WHERE name = ? AND role = "Student" ORDER BY created_at LIMIT 1',
        (sname,)
    )
    row = cursor2.fetchone()
    if row:
        conn.execute('UPDATE students SET user_id = ? WHERE id = ?', (row[0], sid))

conn.commit()

cursor = conn.execute('SELECT id, name, user_id, avatar_url FROM students')
for row in cursor.fetchall():
    print(row)

conn.close()
