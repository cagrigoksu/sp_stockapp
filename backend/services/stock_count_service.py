from datetime import datetime
from repositories.stock_count_repository import StockCountRepository
from repositories.device_repository import DeviceRepository
from repositories.charger_repository import ChargerRepository
from repositories.cable_repository import CableRepository

stock_repo = StockCountRepository()
device_repo = DeviceRepository()
charger_repo = ChargerRepository()
cable_repo = CableRepository()

def get_sessions():
    return stock_repo.get_all_sessions()

def create_session(name, notes, user_id):
    now = datetime.utcnow().isoformat()
    return stock_repo.create_session(name, notes, now, user_id)

def complete_session(sid):
    now = datetime.utcnow().isoformat()
    stock_repo.complete_session(sid, now)

def validate_barcode(barcode):
    barcode = barcode.strip()
    device = device_repo.find_by_barcode(barcode)
    if device:
        return {'found': True, 'type': 'device', 'item': device}
    charger = charger_repo.find_by_barcode(barcode)
    if charger:
        return {'found': True, 'type': 'charger', 'item': charger}
    cable = cable_repo.find_by_barcode(barcode)
    if cable:
        return {'found': True, 'type': 'cable', 'item': cable}
    return {'found': False, 'barcode': barcode}