from repositories.device_repository import DeviceRepository
from repositories.charger_repository import ChargerRepository
from repositories.cable_repository import CableRepository

device_repo = DeviceRepository()
charger_repo = ChargerRepository()
cable_repo = CableRepository()

def get_overview():
    d = device_repo.get_stats()
    c = charger_repo.get_stats()
    l = cable_repo.get_stats()

    gap_lightning = d['lightning_devices'] - l['lightning_cables']
    gap_usbc = d['usbc_devices'] - l['usbc_cables']
    gap_microusb = d['microusb_devices'] - l['microusb_cables']
    gap_usba_charger = l['usba_cables'] - c['usba_chargers']
    gap_usbc_charger = l['usbc_cables_charger_side'] - c['usbc_chargers']

    return {
        'summary': {
            'phones': d['phones'], 'tablets': d['tablets'],
            'total_devices': d['phones'] + d['tablets'],
            'total_chargers': c['total'], 'total_cables': l['total']
        },
        'engraved': {'yes': d['engraved_yes'], 'no': d['engraved_no']},
        'status': {'good': d['good'], 'broken': d['broken']},
        'brands': d['brands'],
        'models': d['models'],
        'connectors': d['connectors'],
        'charger_types': c['charger_types'],
        'cable_types': l['cable_types'],
        'matching': {
            'lightning_devices': d['lightning_devices'],
            'lightning_cables': l['lightning_cables'],
            'gap_lightning': gap_lightning,
            'usbc_devices': d['usbc_devices'],
            'usbc_cables': l['usbc_cables'],
            'gap_usbc': gap_usbc,
            'microusb_devices': d['microusb_devices'],
            'microusb_cables': l['microusb_cables'],
            'gap_microusb': gap_microusb,
            'usba_cables': l['usba_cables'],
            'usba_chargers': c['usba_chargers'],
            'gap_usba_charger': gap_usba_charger,
            'usbc_cables_charger_side': l['usbc_cables_charger_side'],
            'usbc_chargers': c['usbc_chargers'],
            'gap_usbc_charger': gap_usbc_charger,
        }
    }