from flask import Blueprint, request, jsonify, session
from decorators import admin_required
from services.user_service import get_all_users, create_user, delete_user, reset_user_password

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/users', methods=['GET'])
@admin_required
def api_get_users():
    return jsonify(get_all_users())

@user_bp.route('/api/users', methods=['POST'])
@admin_required
def api_create_user():
    d = request.json
    try:
        temp_pw = create_user(d.get('email', ''), d.get('full_name', ''), d.get('is_admin'), session['user_id'])
        return jsonify({'success': True, 'temp_password': temp_pw})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@user_bp.route('/api/users/<int:uid>', methods=['DELETE'])
@admin_required
def api_delete_user(uid):
    try:
        delete_user(uid, session['user_id'])
        return jsonify({'success': True})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@user_bp.route('/api/users/<int:uid>/reset-password', methods=['POST'])
@admin_required
def api_reset_password(uid):
    temp_pw = reset_user_password(uid)
    return jsonify({'success': True, 'temp_password': temp_pw})