class User:
    def __init__(self, id, email, full_name, password_hash, is_admin,
                 must_change_password, created_at=None, created_by=None):
        self.id = id
        self.email = email
        self.full_name = full_name
        self.password_hash = password_hash
        self.is_admin = bool(is_admin)
        self.must_change_password = bool(must_change_password)
        self.created_at = created_at
        self.created_by = created_by

    @staticmethod
    def from_row(row):
        return User(
            id=row['id'],
            email=row['email'],
            full_name=row['full_name'],
            password_hash=row['password_hash'],
            is_admin=row['is_admin'],
            must_change_password=row['must_change_password'],
            created_at=row['created_at'],
            created_by=row['created_by'],
        )

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'is_admin': self.is_admin,
            'must_change_password': self.must_change_password,
            'created_at': self.created_at,
        }