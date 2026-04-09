class Device:
    def __init__(self, id, internal_barcode, device_type, brand, model, connector,
                 is_engraved, is_distributed, status, place, created_at=None, created_by=None,
                 updated_at=None, updated_by=None, creator=None, updater=None):
        self.id = id
        self.internal_barcode = internal_barcode
        self.device_type = device_type
        self.brand = brand
        self.model = model
        self.connector = connector
        self.is_engraved = bool(is_engraved)
        self.is_distributed = bool(is_distributed)
        self.status = status
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
        return Device(
            id=d.get('id'),
            internal_barcode=d.get('internal_barcode'),
            device_type=d.get('device_type'),
            brand=d.get('brand'),
            model=d.get('model'),
            connector=d.get('connector'),
            is_engraved=d.get('is_engraved', 0),
            is_distributed=d.get('is_distributed', 0),
            status=d.get('status', 'Good'),
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
            'internal_barcode': self.internal_barcode,
            'device_type': self.device_type,
            'brand': self.brand,
            'model': self.model,
            'connector': self.connector,
            'is_engraved': self.is_engraved,
            'is_distributed': self.is_distributed,
            'status': self.status,
            'place': self.place,
            'created_at': self.created_at,
            'created_by': self.created_by,
            'updated_at': self.updated_at,
            'updated_by': self.updated_by,
            'creator': self.creator,
            'updater': self.updater,
        }