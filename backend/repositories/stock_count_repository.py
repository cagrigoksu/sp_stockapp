from database import get_db
from entities.stock_count_session import StockCountSession


class StockCountRepository:

    def get_all_sessions(self):
        with get_db() as db:
            rows = db.execute("""
                SELECT s.*, u.full_name as creator_name
                FROM stock_count_sessions s
                LEFT JOIN users u ON s.created_by=u.id
                ORDER BY s.created_at DESC
            """).fetchall()
        return [StockCountSession.from_row(r).to_dict() for r in rows]

    def create_session(self, name, notes, now, user_id):
        with get_db() as db:
            cur = db.execute(
                "INSERT INTO stock_count_sessions(name,created_at,created_by,notes) VALUES(?,?,?,?)",
                (name, now, user_id, notes)
            )
            sid = cur.lastrowid
            db.commit()
        return sid

    def complete_session(self, sid, now):
        with get_db() as db:
            db.execute(
                "UPDATE stock_count_sessions SET completed_at=? WHERE id=?",
                (now, sid)
            )
            db.commit()