from flask import Blueprint, request, jsonify, session
from decorators import login_required
from services.stock_count_service import get_sessions, create_session, complete_session, validate_barcode

stock_count_bp = Blueprint('stock_count', __name__)

@stock_count_bp.route('/api/count/sessions', methods=['GET'])
@login_required
def api_get_sessions():
    return jsonify(get_sessions())

@stock_count_bp.route('/api/count/sessions', methods=['POST'])
@login_required
def api_create_session():
    d = request.json
    sid = create_session(d['name'], d.get('notes', ''), session['user_id'])
    return jsonify({'success': True, 'id': sid})

@stock_count_bp.route('/api/count/sessions/<int:sid>/complete', methods=['POST'])
@login_required
def api_complete_session(sid):
    complete_session(sid)
    return jsonify({'success': True})

@stock_count_bp.route('/api/count/validate', methods=['POST'])
@login_required
def api_validate_barcode():
    result = validate_barcode(request.json.get('barcode', ''))
    return jsonify(result)