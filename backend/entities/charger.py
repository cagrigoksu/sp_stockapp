class Charger:
    def __init__(self, id, barcode, charger_type, place, created_at=None,
                 created_by=None, updated_at=None, updated_by=None,
                 creator=None, updater=None):
        self.id = id
        self.barcode = barcode
        self.charger_type = charger_type
        self.place = place
        self.created_at = created_at
        self.created_by = created_by
        self.updated_at = updated_at
        self.updated_by = updated_by
        self.creator = creator
        self.updater = updater

    @staticmethod
    def from_row(row):
        d = dict(row)
        return Charger(
            id=d.get('id'),
            barcode=d.get('barcode', ''),
            charger_type=d.get('charger_type'),
            place=d.get('place', ''),
            created_at=d.get('created_at'),
            created_by=d.get('created_by'),
            updated_at=d.get('updated_at'),
            updated_by=d.get('updated_by'),
            creator=d.get('creator'),
            updater=d.get('updater'),
        )

    def to_dict(self):
        return {
            'id': self.id,
            'barcode': self.barcode,
            'charger_type': self.charger_type,
            'place': self.place,
            'created_at': self.created_at,
            'created_by': self.created_by,
            'updated_at': self.updated_at,
            'updated_by': self.updated_by,
            'creator': self.creator,
            'updater': self.updater,
        }