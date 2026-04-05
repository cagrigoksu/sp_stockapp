from flask import Blueprint, request, jsonify, session
from decorators import login_required
from services.device_service import (
    get_devices_filtered, add_device, add_device_bulk, update_device, delete_device
)

device_bp = Blueprint('device', __name__)

@device_bp.route('/api/stock')
@login_required
def api_stock():
    from services.charger_service import get_chargers_filtered
    from services.cable_service import get_cables_filtered
    filters = request.args.to_dict()
    devices = get_devices_filtered(filters)
    chargers = get_chargers_filtered(filters)
    cables = get_cables_filtered(filters)
    return jsonify({'devices': devices, 'chargers': chargers, 'cables': cables})

@device_bp.route('/api/device', methods=['POST'])
@login_required
def api_add_device():
    try:
        barcode = add_device(request.json, session['user_id'])
        return jsonify({'success': True, 'barcode': barcode})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@device_bp.route('/api/device/bulk', methods=['POST'])
@login_required
def api_add_device_bulk():
    try:
        barcodes = add_device_bulk(request.json, session['user_id'])
        return jsonify({'success': True, 'barcodes': barcodes, 'count': len(barcodes)})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@device_bp.route('/api/device/<int:item_id>', methods=['PUT'])
@login_required
def api_update_device(item_id):
    update_device(item_id, request.json, session['user_id'])
    return jsonify({'success': True})

@device_bp.route('/api/device/<int:item_id>', methods=['DELETE'])
@login_required
def api_delete_device(item_id):
    delete_device(item_id)
    return jsonify({'success': True})