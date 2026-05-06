import sqlite3

def check_all_tables():
    conn = sqlite3.connect('edusaas.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Table: {table}, Columns: {columns}")
    
    conn.close()

if __name__ == "__main__":
    check_all_tables()
