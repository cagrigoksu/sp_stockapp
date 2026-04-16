from database import get_db


class DeviceRepository:

    def get_all_filtered(self, filters: dict):
        q = """SELECT d.*, u1.full_name as creator, u2.full_name as updater
               FROM devices d
               LEFT JOIN users u1 ON d.created_by=u1.id
               LEFT JOIN users u2 ON d.updated_by=u2.id
               WHERE 1=1"""
        params = []
        for f, col in [('type', 'd.device_type'), ('brand', 'd.brand'), ('model', 'd.model'),
                       ('connector', 'd.connector'), ('status', 'd.status'), ('place', 'd.place')]:
            val = filters.get(f)
            if val:
                q += f" AND {col} LIKE ?"
                params.append(f'%{val}%')
        engraved = filters.get('engraved')
        distributed = filters.get('distributed')
        if engraved in ('0', '1'):
            q += " AND d.is_engraved=?"
            params.append(int(engraved))
        if distributed in ('0', '1'):
            q += " AND d.is_distributed=?"
            params.append(int(distributed))
        barcode = filters.get('barcode')
        if barcode:
            q += " AND d.internal_barcode LIKE ?"
            params.append(f'%{barcode}%')
        with get_db() as db:
            rows = db.execute(q, params).fetchall()
        return [dict(r) for r in rows]

    def get_all_for_export(self):
        with get_db() as db:
            rows = db.execute("""
                SELECT d.*, u1.full_name as created_by_name, u2.full_name as updated_by_name
                FROM devices d
                LEFT JOIN users u1 ON d.created_by=u1.id
                LEFT JOIN users u2 ON d.updated_by=u2.id
                ORDER BY d.device_type, d.brand, d.model
            """).fetchall()
        return [dict(r) for r in rows]

    def find_by_barcode(self, barcode):
        with get_db() as db:
            row = db.execute("SELECT * FROM devices WHERE internal_barcode=?", (barcode,)).fetchone()
        return dict(row) if row else None

    def barcode_exists(self, barcode):
        with get_db() as db:
            row = db.execute("SELECT id FROM devices WHERE internal_barcode=?", (barcode,)).fetchone()
        return row is not None

    def get_barcodes_like(self, pattern):
        with get_db() as db:
            rows = db.execute("SELECT internal_barcode FROM devices WHERE internal_barcode LIKE ?", (pattern,)).fetchall()
        return [r['internal_barcode'] for r in rows]

    def create(self, barcode, device_type, brand, model, connector, is_engraved, is_distributed, status, place, now, user_id):
        with get_db() as db:
            db.execute("""INSERT INTO devices(internal_barcode,device_type,brand,model,connector,is_engraved,is_distributed,status,place,created_at,created_by)
                          VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                       (barcode, device_type, brand, model, connector, is_engraved, is_distributed, status, place, now, user_id))
            db.commit()

    def create_many(self, records):
        with get_db() as db:
            for r in records:
                db.execute("""INSERT INTO devices(internal_barcode,device_type,brand,model,connector,is_engraved,is_distributed, status,place,created_at,created_by)
                              VALUES(?,?,?,?,?,?,?,?,?,?,?)""", r)
            db.commit()

    def update(self, item_id, brand, model, connector, is_engraved, is_distributed, recipient_id, distribution_date, status, place, now, user_id):
        with get_db() as db:
            db.execute("""UPDATE devices SET brand=?,model=?,connector=?,is_engraved=?,is_distributed=?, recipient_id=?, distribution_date=?, status=?,place=?,updated_at=?,updated_by=?
                          WHERE id=?""",
                       (brand, model, connector, is_engraved, is_distributed, recipient_id, distribution_date, status, place, now, user_id, item_id))
            db.commit()

    def delete(self, item_id):
        with get_db() as db:
            db.execute("DELETE FROM devices WHERE id=?", (item_id,))
            db.commit()

    def get_stats(self):
        with get_db() as db:
            stats = {
                'phones': db.execute("SELECT COUNT(*) c FROM devices WHERE device_type='phone'").fetchone()['c'],
                'tablets': db.execute("SELECT COUNT(*) c FROM devices WHERE device_type='tablet'").fetchone()['c'],
                'brands': [dict(r) for r in db.execute("SELECT brand, COUNT(*) c FROM devices GROUP BY brand ORDER BY c DESC").fetchall()],
                'models': [dict(r) for r in db.execute("SELECT brand, model, device_type, COUNT(*) c FROM devices GROUP BY brand,model,device_type ORDER BY brand,model").fetchall()],
                'engraved_yes': db.execute("SELECT COUNT(*) c FROM devices WHERE is_engraved=1").fetchone()['c'],
                'engraved_no': db.execute("SELECT COUNT(*) c FROM devices WHERE is_engraved=0").fetchone()['c'],
                'distributed_yes': db.execute("SELECT COUNT(*) c FROM devices WHERE is_distributed=1").fetchone()['c'],
                'distributed_no': db.execute("SELECT COUNT(*) c FROM devices WHERE is_distributed=0").fetchone()['c'],
                'good': db.execute("SELECT COUNT(*) c FROM devices WHERE status='Good'").fetchone()['c'],
                'broken': db.execute("SELECT COUNT(*) c FROM devices WHERE status='Broken'").fetchone()['c'],
                'connectors': [dict(r) for r in db.execute("SELECT connector, COUNT(*) c FROM devices GROUP BY connector").fetchall()],
                'lightning_devices': db.execute("SELECT COUNT(*) c FROM devices WHERE connector='lightning'").fetchone()['c'],
                'usbc_devices': db.execute("SELECT COUNT(*) c FROM devices WHERE connector='USB-C'").fetchone()['c'],
                'microusb_devices': db.execute("SELECT COUNT(*) c FROM devices WHERE connector='micro-USB'").fetchone()['c'],
            }
        return stats