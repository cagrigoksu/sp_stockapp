from database import get_db


class CableRepository:

    def get_all_filtered(self, filters: dict):
        q = """SELECT c.*, u1.full_name as creator, u2.full_name as updater
               FROM cables c
               LEFT JOIN users u1 ON c.created_by=u1.id
               LEFT JOIN users u2 ON c.updated_by=u2.id
               WHERE 1=1"""
        params = []
        lt = filters.get('cable_type')
        if lt:
            q += " AND c.cable_type LIKE ?"
            params.append(f'%{lt}%')
        lp = filters.get('cable_place')
        if lp:
            q += " AND c.place LIKE ?"
            params.append(f'%{lp}%')
        with get_db() as db:
            rows = db.execute(q, params).fetchall()
        return [dict(r) for r in rows]

    def get_all_for_export(self):
        with get_db() as db:
            rows = db.execute("""
                SELECT c.*, u1.full_name as created_by_name, u2.full_name as updated_by_name
                FROM cables c
                LEFT JOIN users u1 ON c.created_by=u1.id
                LEFT JOIN users u2 ON c.updated_by=u2.id
                ORDER BY c.cable_type
            """).fetchall()
        return [dict(r) for r in rows]

    def find_by_barcode(self, barcode):
        with get_db() as db:
            row = db.execute("SELECT * FROM cables WHERE barcode=?", (barcode,)).fetchone()
        return dict(row) if row else None

    def create_many(self, count, barcode, cable_type, place, now, user_id):
        with get_db() as db:
            for _ in range(count):
                db.execute(
                    "INSERT INTO cables(barcode,cable_type,place,created_at,created_by) VALUES(?,?,?,?,?)",
                    (barcode, cable_type, place, now, user_id)
                )
            db.commit()

    def create_one(self, barcode, cable_type, place, now, user_id):
        with get_db() as db:
            db.execute(
                "INSERT INTO cables(barcode,cable_type,place,created_at,created_by) VALUES(?,?,?,?,?)",
                (barcode, cable_type, place, now, user_id)
            )
            db.commit()

    def update(self, item_id, barcode, cable_type, place, now, user_id):
        with get_db() as db:
            db.execute(
                "UPDATE cables SET barcode=?,cable_type=?,place=?,updated_at=?,updated_by=? WHERE id=?",
                (barcode, cable_type, place, now, user_id, item_id)
            )
            db.commit()

    def delete(self, item_id):
        with get_db() as db:
            db.execute("DELETE FROM cables WHERE id=?", (item_id,))
            db.commit()

    def get_stats(self):
        with get_db() as db:
            stats = {
                'total': db.execute("SELECT COUNT(*) c FROM cables").fetchone()['c'],
                'cable_types': [dict(r) for r in db.execute("SELECT cable_type, COUNT(*) c FROM cables GROUP BY cable_type").fetchall()],
                'lightning_cables': db.execute("SELECT COUNT(*) c FROM cables WHERE cable_type IN ('USB-C to Lightning','USB-A to Lightning')").fetchone()['c'],
                'usbc_cables': db.execute("SELECT COUNT(*) c FROM cables WHERE cable_type IN ('USB-C to USB-C','USB-A to USB-C')").fetchone()['c'],
                'microusb_cables': db.execute("SELECT COUNT(*) c FROM cables WHERE cable_type='USB-A to micro-USB'").fetchone()['c'],
                'usba_cables': db.execute("SELECT COUNT(*) c FROM cables WHERE cable_type LIKE 'USB-A%'").fetchone()['c'],
                'usbc_cables_charger_side': db.execute("SELECT COUNT(*) c FROM cables WHERE cable_type LIKE 'USB-C to%'").fetchone()['c'],
            }
        return stats