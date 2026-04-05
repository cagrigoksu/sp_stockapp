from datetime import datetime
from repositories.charger_repository import ChargerRepository

charger_repo = ChargerRepository()

def get_chargers_filtered(filters):
    return charger_repo.get_all_filtered(filters)

def add_charger(data, user_id):
    count = int(data.get('count', 1))
    now = datetime.utcnow().isoformat()
    charger_repo.create_many(count, data.get('barcode', ''), data['charger_type'], data.get('place', ''), now, user_id)
    return count

def update_charger(item_id, data, user_id):
    now = datetime.utcnow().isoformat()
    charger_repo.update(item_id, data.get('barcode', ''), data['charger_type'], data.get('place', ''), now, user_id)

def delete_charger(item_id):
    charger_repo.delete(item_id)