import sqlite3

conn = sqlite3.connect('backend/ardhnarishwar_local.db')
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print('Tables:', tables)

for t in ['users', 'companies', 'jobs', 'candidates', 'interview_sessions', 'interview_meetings', 'resumes']:
    if t in tables:
        count = cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
        print(f"{t}: {count} rows")

users = cur.execute("SELECT id, email, role, status FROM users").fetchall()
print("Users:", users)
conn.close()
