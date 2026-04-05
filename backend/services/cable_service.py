from datetime import datetime
from repositories.cable_repository import CableRepository

cable_repo = CableRepository()

def get_cables_filtered(filters):
    return cable_repo.get_all_filtered(filters)

def add_cable(data, user_id):
    count = int(data.get('count', 1))
    now = datetime.utcnow().isoformat()
    cable_repo.create_many(count, data.get('barcode', ''), data['cable_type'], data.get('place', ''), now, user_id)
    return count

def update_cable(item_id, data, user_id):
    now = datetime.utcnow().isoformat()
    cable_repo.update(item_id, data.get('barcode', ''), data['cable_type'], data.get('place', ''), now, user_id)

def delete_cable(item_id):
    cable_repo.delete(item_id)