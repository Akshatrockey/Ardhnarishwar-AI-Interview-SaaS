import sqlite3

def purge_database():
    conn = sqlite3.connect('backend/ardhnarishwar_local.db')
    cur = conn.cursor()
    
    # Disable foreign keys temporarily for truncation
    cur.execute("PRAGMA foreign_keys = OFF;")
    
    tables_to_truncate = [
        'candidate_answers',
        'ai_evaluation_reports',
        'interview_meetings',
        'interview_sessions',
        'resumes',
        'candidates',
        'round_questions',
        'interview_rounds',
        'jobs',
        'audit_logs'
    ]
    
    for table in tables_to_truncate:
        try:
            cur.execute(f"DELETE FROM {table};")
            print(f"Purged {table}")
        except Exception as e:
            print(f"Skipping {table}: {e}")
            
    # Remove non-super-admin users
    cur.execute("DELETE FROM users WHERE role != 'SUPER_ADMIN';")
    print("Purged non-super-admin users")
    
    # Remove all companies except maybe clean state
    cur.execute("DELETE FROM companies;")
    print("Purged demo companies")
    
    cur.execute("PRAGMA foreign_keys = ON;")
    conn.commit()
    
    # Verify remaining
    remaining_users = cur.execute("SELECT id, email, role FROM users").fetchall()
    print("Remaining users:", remaining_users)
    conn.close()

if __name__ == '__main__':
    purge_database()
