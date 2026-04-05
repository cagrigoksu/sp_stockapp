from flask import Blueprint, request, jsonify, session
from decorators import login_required
from services.charger_service import add_charger, update_charger, delete_charger

charger_bp = Blueprint('charger', __name__)

@charger_bp.route('/api/charger', methods=['POST'])
@login_required
def api_add_charger():
    count = add_charger(request.json, session['user_id'])
    return jsonify({'success': True, 'count': count})

@charger_bp.route('/api/charger/<int:item_id>', methods=['PUT'])
@login_required
def api_update_charger(item_id):
    update_charger(item_id, request.json, session['user_id'])
    return jsonify({'success': True})

@charger_bp.route('/api/charger/<int:item_id>', methods=['DELETE'])
@login_required
def api_delete_charger(item_id):
    delete_charger(item_id)
    return jsonify({'success': True})