from database import get_db
from entities.user import User


class UserRepository:

    def find_by_email(self, email):
        with get_db() as db:
            row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        return User.from_row(row) if row else None

    def find_by_id(self, user_id):
        with get_db() as db:
            row = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        return User.from_row(row) if row else None

    def get_all(self):
        with get_db() as db:
            rows = db.execute(
                "SELECT id, email, full_name, is_admin, must_change_password, created_at FROM users ORDER BY id"
            ).fetchall()
        return [dict(r) for r in rows]

    def create(self, email, full_name, password_hash, is_admin, created_by):
        with get_db() as db:
            db.execute(
                "INSERT INTO users(email,full_name,password_hash,is_admin,must_change_password,created_by) VALUES(?,?,?,?,1,?)",
                (email, full_name, password_hash, 1 if is_admin else 0, created_by)
            )
            db.commit()

    def update_password(self, user_id, password_hash, must_change=False):
        with get_db() as db:
            db.execute(
                "UPDATE users SET password_hash=?, must_change_password=? WHERE id=?",
                (password_hash, 1 if must_change else 0, user_id)
            )
            db.commit()

    def delete(self, user_id):
        with get_db() as db:
            db.execute("DELETE FROM users WHERE id=?", (user_id,))
            db.commit()