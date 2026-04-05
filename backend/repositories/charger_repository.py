from database import get_db


class ChargerRepository:

    def get_all_filtered(self, filters: dict):
        q = """SELECT c.*, u1.full_name as creator, u2.full_name as updater
               FROM chargers c
               LEFT JOIN users u1 ON c.created_by=u1.id
               LEFT JOIN users u2 ON c.updated_by=u2.id
               WHERE 1=1"""
        params = []
        ct = filters.get('charger_type')
        if ct:
            q += " AND c.charger_type LIKE ?"
            params.append(f'%{ct}%')
        cp = filters.get('charger_place')
        if cp:
            q += " AND c.place LIKE ?"
            params.append(f'%{cp}%')
        with get_db() as db:
            rows = db.execute(q, params).fetchall()
        return [dict(r) for r in rows]

    def get_all_for_export(self):
        with get_db() as db:
            rows = db.execute("""
                SELECT c.*, u1.full_name as created_by_name, u2.full_name as updated_by_name
                FROM chargers c
                LEFT JOIN users u1 ON c.created_by=u1.id
                LEFT JOIN users u2 ON c.updated_by=u2.id
                ORDER BY c.charger_type
            """).fetchall()
        return [dict(r) for r in rows]

    def find_by_barcode(self, barcode):
        with get_db() as db:
            row = db.execute("SELECT * FROM chargers WHERE barcode=?", (barcode,)).fetchone()
        return dict(row) if row else None

    def create_many(self, count, barcode, charger_type, place, now, user_id):
        with get_db() as db:
            for _ in range(count):
                db.execute(
                    "INSERT INTO chargers(barcode,charger_type,place,created_at,created_by) VALUES(?,?,?,?,?)",
                    (barcode, charger_type, place, now, user_id)
                )
            db.commit()

    def create_one(self, barcode, charger_type, place, now, user_id):
        with get_db() as db:
            db.execute(
                "INSERT INTO chargers(barcode,charger_type,place,created_at,created_by) VALUES(?,?,?,?,?)",
                (barcode, charger_type, place, now, user_id)
            )
            db.commit()

    def update(self, item_id, barcode, charger_type, place, now, user_id):
        with get_db() as db:
            db.execute(
                "UPDATE chargers SET barcode=?,charger_type=?,place=?,updated_at=?,updated_by=? WHERE id=?",
                (barcode, charger_type, place, now, user_id, item_id)
            )
            db.commit()

    def delete(self, item_id):
        with get_db() as db:
            db.execute("DELETE FROM chargers WHERE id=?", (item_id,))
            db.commit()

    def get_stats(self):
        with get_db() as db:
            stats = {
                'total': db.execute("SELECT COUNT(*) c FROM chargers").fetchone()['c'],
                'charger_types': [dict(r) for r in db.execute("SELECT charger_type, COUNT(*) c FROM chargers GROUP BY charger_type").fetchall()],
                'usba_chargers': db.execute("SELECT COUNT(*) c FROM chargers WHERE charger_type IN ('USB-A','USB-C+USB-A')").fetchone()['c'],
                'usbc_chargers': db.execute("SELECT COUNT(*) c FROM chargers WHERE charger_type IN ('USB-C','USB-C+USB-A')").fetchone()['c'],
            }
        return stats