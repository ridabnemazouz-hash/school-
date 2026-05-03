import sqlite3

conn = sqlite3.connect('edusaas.db')

subjects = [
    ('Mathematics', 'MATH', 7, '#3b82f6'),
    ('Physics', 'PC', 7, '#8b5cf6'),
    ('Chemistry', 'CHIM', 7, '#8b5cf6'),
    ('Biology', 'SVT', 5, '#10b981'),
    ('Arabic', 'AR', 4, '#f59e0b'),
    ('French', 'FR', 4, '#ef4444'),
    ('English', 'EN', 3, '#06b6d4'),
    ('History', 'HIST', 2, '#f97316'),
    ('Geography', 'GEO', 2, '#f97316'),
    ('Islamic Education', 'ISL', 2, '#14b8a6'),
    ('Philosophy', 'PHIL', 3, '#a855f7'),
    ('Computer Science', 'INFO', 2, '#6366f1'),
    ('Physical Education', 'EPS', 2, '#84cc16'),
]

for name, code, coef, color in subjects:
    existing = conn.execute('SELECT id FROM subjects WHERE name = ?', (name,)).fetchone()
    if not existing:
        conn.execute('INSERT INTO subjects (name, code, coefficient, color) VALUES (?, ?, ?, ?)', (name, code, coef, color))
        print(f'Added: {name}')
    else:
        print(f'Skip: {name}')

conn.commit()
conn.close()
print('Done!')
