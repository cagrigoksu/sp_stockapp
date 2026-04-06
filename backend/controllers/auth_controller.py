from flask import Blueprint, request, redirect, url_for, session, jsonify
from services.auth_service import authenticate, change_password, verify_current_password
from decorators import login_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = authenticate(data.get('email', ''), data.get('password', ''))
    if user:
        session['user_id'] = user.id
        session['user_name'] = user.full_name
        session['is_admin'] = user.is_admin
        return jsonify({
            'success': True,
            'must_change_password': user.must_change_password,
            'user': {'id': user.id, 'full_name': user.full_name, 'is_admin': user.is_admin}
        })
    return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@auth_bp.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    return jsonify({
        'user_id': session['user_id'],
        'user_name': session['user_name'],
        'is_admin': session.get('is_admin', False)
    })

@auth_bp.route('/api/auth/change-password-first', methods=['POST'])
@login_required
def change_password_first():
    data = request.json
    print("girdiiiiii")
    pw = data.get('password', '')
    pw2 = data.get('password2', '')
    if len(pw) < 8:
        return jsonify({'success': False, 'error': 'Password must be at least 8 characters.'}), 400
    if pw != pw2:
        return jsonify({'success': False, 'error': 'Passwords do not match.'}), 400
    change_password(session['user_id'], pw, must_change=False)
    return jsonify({'success': True})

@auth_bp.route('/api/auth/change-password', methods=['POST'])
@login_required
def change_password_route():
    data = request.json
    current = data.get('current_password', '')
    pw = data.get('password', '')
    pw2 = data.get('password2', '')
    if not verify_current_password(session['user_id'], current):
        return jsonify({'success': False, 'error': 'Current password is incorrect.'}), 400
    if len(pw) < 8:
        return jsonify({'success': False, 'error': 'New password must be at least 8 characters.'}), 400
    if pw != pw2:
        return jsonify({'success': False, 'error': 'Passwords do not match.'}), 400
    change_password(session['user_id'], pw)
    return jsonify({'success': True})