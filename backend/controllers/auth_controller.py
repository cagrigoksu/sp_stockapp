from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from services.auth_service import authenticate, change_password, verify_current_password
from decorators import login_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))
    error = None
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = authenticate(email, password)
        if user:
            session['user_id'] = user.id
            session['user_name'] = user.full_name
            session['is_admin'] = user.is_admin
            if user.must_change_password:
                return redirect(url_for('auth.change_password_first'))
            return redirect(url_for('dashboard.dashboard'))
        error = 'Invalid email or password.'
    return render_template('login.html', error=error)

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))

@auth_bp.route('/change-password-first', methods=['GET', 'POST'])
@login_required
def change_password_first():
    error = None
    if request.method == 'POST':
        pw = request.form['password']
        pw2 = request.form['password2']
        if len(pw) < 8:
            error = 'Password must be at least 8 characters.'
        elif pw != pw2:
            error = 'Passwords do not match.'
        else:
            change_password(session['user_id'], pw, must_change=False)
            flash('Password changed successfully!', 'success')
            return redirect(url_for('dashboard.dashboard'))
    return render_template('change_password_first.html', error=error)

@auth_bp.route('/change-password', methods=['GET', 'POST'])
@login_required
def change_password():
    error = None
    if request.method == 'POST':
        current = request.form['current_password']
        pw = request.form['password']
        pw2 = request.form['password2']
        if not verify_current_password(session['user_id'], current):
            error = 'Current password is incorrect.'
        elif len(pw) < 8:
            error = 'New password must be at least 8 characters.'
        elif pw != pw2:
            error = 'Passwords do not match.'
        else:
            change_password(session['user_id'], pw)
            flash('Password changed successfully!', 'success')
            return redirect(url_for('dashboard.dashboard'))
    return render_template('change_password.html', error=error)