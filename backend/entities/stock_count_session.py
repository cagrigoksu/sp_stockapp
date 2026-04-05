class StockCountSession:
    def __init__(self, id, name, created_at, created_by, completed_at=None,
                 notes=None, creator_name=None):
        self.id = id
        self.name = name
        self.created_at = created_at
        self.created_by = created_by
        self.completed_at = completed_at
        self.notes = notes
        self.creator_name = creator_name

    @staticmethod
    def from_row(row):
        d = dict(row)
        return StockCountSession(
            id=d.get('id'),
            name=d.get('name'),
            created_at=d.get('created_at'),
            created_by=d.get('created_by'),
            completed_at=d.get('completed_at'),
            notes=d.get('notes'),
            creator_name=d.get('creator_name'),
        )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at,
            'created_by': self.created_by,
            'completed_at': self.completed_at,
            'notes': self.notes,
            'creator_name': self.creator_name,
        }