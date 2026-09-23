import sqlite3
import sys
sys.path.append('.')
from app.core.security import verify_password, hash_password

conn = sqlite3.connect('backend/ardhnarishwar_local.db')
cur = conn.cursor()
row = cur.execute("SELECT id, email, password_hash, role FROM users WHERE email='admin@ardhnarishwar.ai'").fetchone()
if row:
    print('Super Admin row:', row[0], row[1], row[3])
    print('Verify SuperAdmin2026!:', verify_password('SuperAdmin2026!', row[2]))
    if not verify_password('SuperAdmin2026!', row[2]):
        print('Updating password hash to SuperAdmin2026!...')
        new_hash = hash_password('SuperAdmin2026!')
        cur.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, row[0]))
        conn.commit()
        print('Updated. Re-verifying:', verify_password('SuperAdmin2026!', new_hash))
else:
    print('Creating Super Admin usr_super_root_master...')
    new_hash = hash_password('SuperAdmin2026!')
    cur.execute("""
        INSERT INTO users (id, email, password_hash, name, role, status, created_at)
        VALUES ('usr_super_root_master', 'admin@ardhnarishwar.ai', ?, 'Ardhnarishwar Super Admin', 'SUPER_ADMIN', 'ACTIVE', datetime('now'))
    """, (new_hash,))
    conn.commit()
    print('Created Super Admin user!')
conn.close()
