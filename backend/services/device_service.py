import re
from datetime import datetime, date
from repositories.device_repository import DeviceRepository

device_repo = DeviceRepository()

BARCODE_PATTERN = re.compile(r'^\d{6}(S|T)\d+%?$', re.IGNORECASE)

def generate_barcode(device_type):
    prefix = 'S' if device_type == 'phone' else 'T'
    today = date.today().strftime('%y%m%d')
    pattern = f"{today}{prefix}%"
    barcodes = device_repo.get_barcodes_like(pattern)
    max_n = 0
    for bc in barcodes:
        try:
            n = int(bc[7:])
            if n > max_n:
                max_n = n
        except:
            pass
    return f"{today}{prefix}{max_n + 1}"

def validate_barcode_format(barcode, device_type):
    barcode = barcode.strip()
    if not BARCODE_PATTERN.match(barcode):
        return False, f"Barcode '{barcode}' does not match YYMMDDXN format (e.g. 260225S12)"
    expected_char = 'S' if device_type == 'phone' else 'T'
    actual_char = barcode[6].upper()
    if actual_char != expected_char:
        return False, (f"Barcode '{barcode}' has type marker '{barcode[6]}' but device_type is '{device_type}' "
                       f"(expected '{expected_char}' or '{expected_char.lower()}')")
    try:
        datetime.strptime(barcode[:6], '%y%m%d')
    except ValueError:
        return False, f"Barcode '{barcode}' has an invalid date portion '{barcode[:6]}'"
    return True, None

def get_devices_filtered(filters):
    return device_repo.get_all_filtered(filters)

def add_device(data, user_id):
    device_type = data.get('device_type')
    if device_type not in ('phone', 'tablet'):
        raise ValueError('Invalid device type')
    barcode = generate_barcode(device_type)
    now = datetime.utcnow().isoformat()
    device_repo.create(
        barcode, device_type, data['brand'], data['model'], data['connector'],
        1 if data.get('is_engraved') else 0,
        1 if data.get('is_distributed') else 0,
        data.get('status', 'Good'), data.get('place', ''), now, user_id
    )
    return barcode

def add_device_bulk(data, user_id):
    device_type = data.get('device_type')
    count = int(data.get('count', 1))
    if device_type not in ('phone', 'tablet'):
        raise ValueError('Invalid device type')
    if count < 1 or count > 500:
        raise ValueError('Count must be 1-500')
    now = datetime.utcnow().isoformat()
    barcodes = []
    records = []
    for _ in range(count):
        barcode = generate_barcode(device_type)
        records.append((
            barcode, device_type, data['brand'], data['model'], data['connector'],
            1 if data.get('is_engraved') else 0,
            1 if data.get('is_distributed') else 0,
            data.get('status', 'Good'), data.get('place', ''), now, user_id
        ))
        barcodes.append(barcode)
    device_repo.create_many(records)
    return barcodes

def update_device(item_id, data, user_id):
    now = datetime.utcnow().isoformat()
    device_repo.update(
        item_id, data['brand'], data['model'], data['connector'],
        1 if data.get('is_engraved') else 0,
        1 if data.get('is_distributed') else 0,
        data.get('status', 'Good'), data.get('place', ''), now, user_id
    )

def delete_device(item_id):
    device_repo.delete(item_id)