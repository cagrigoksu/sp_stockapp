import csv
import io
from datetime import datetime
from services.device_service import generate_barcode, validate_barcode_format
from repositories.device_repository import DeviceRepository
from repositories.charger_repository import ChargerRepository
from repositories.cable_repository import CableRepository

device_repo = DeviceRepository()
charger_repo = ChargerRepository()
cable_repo = CableRepository()

def process_csv(file_content, item_type, user_id):
    reader = csv.DictReader(io.StringIO(file_content))
    rows = list(reader)
    now = datetime.utcnow().isoformat()
    errors = []
    count = 0

    for i, row in enumerate(rows, 1):
        try:
            if item_type == 'device':
                dt = row.get('device_type', '').strip().lower()
                if dt not in ('phone', 'tablet'):
                    errors.append(f"Row {i}: invalid device_type '{dt}' (must be 'phone' or 'tablet')")
                    continue

                provided_barcode = row.get('internal_barcode', '').strip()
                if provided_barcode:
                    ok, err = validate_barcode_format(provided_barcode, dt)
                    if not ok:
                        errors.append(f"Row {i}: {err}")
                        continue
                    if device_repo.barcode_exists(provided_barcode):
                        errors.append(f"Row {i}: barcode '{provided_barcode}' already exists in the database")
                        continue
                    barcode = provided_barcode
                else:
                    barcode = generate_barcode(dt)

                device_repo.create(
                    barcode, dt, row['brand'].strip(), row['model'].strip(),
                    row['connector'].strip(),
                    1 if row.get('is_engraved', '').strip().lower() in ('1', 'true', 'yes') else 0,
                    row.get('status', 'Good').strip(), row.get('place', '').strip(), now, user_id
                )
                count += 1

            elif item_type == 'charger':
                charger_repo.create_one(
                    row.get('barcode', '').strip(), row['charger_type'].strip(),
                    row.get('place', '').strip(), now, user_id
                )
                count += 1

            elif item_type == 'cable':
                cable_repo.create_one(
                    row.get('barcode', '').strip(), row['cable_type'].strip(),
                    row.get('place', '').strip(), now, user_id
                )
                count += 1

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    return count, errors