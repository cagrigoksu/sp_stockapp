from flask import Blueprint, request, jsonify, session
from decorators import login_required
from services.cable_service import add_cable, update_cable, delete_cable

cable_bp = Blueprint('cable', __name__)

@cable_bp.route('/api/cable', methods=['POST'])
@login_required
def api_add_cable():
    count = add_cable(request.json, session['user_id'])
    return jsonify({'success': True, 'count': count})

@cable_bp.route('/api/cable/<int:item_id>', methods=['PUT'])
@login_required
def api_update_cable(item_id):
    update_cable(item_id, request.json, session['user_id'])
    return jsonify({'success': True})

@cable_bp.route('/api/cable/<int:item_id>', methods=['DELETE'])
@login_required
def api_delete_cable(item_id):
    delete_cable(item_id)
    return jsonify({'success': True})