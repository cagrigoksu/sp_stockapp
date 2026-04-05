from werkzeug.security import generate_password_hash
from repositories.user_repository import UserRepository
from services.auth_service import gen_password

user_repo = UserRepository()

def get_all_users():
    return user_repo.get_all()

def create_user(email, full_name, is_admin, created_by):
    email = email.strip().lower()
    full_name = full_name.strip()
    if not email or not full_name:
        raise ValueError('Email and full name required')
    temp_pw = gen_password()
    h = generate_password_hash(temp_pw)
    user_repo.create(email, full_name, h, is_admin, created_by)
    return temp_pw

def delete_user(uid, current_user_id):
    if uid == current_user_id:
        raise ValueError('Cannot delete yourself')
    user_repo.delete(uid)

def reset_user_password(uid):
    temp_pw = gen_password()
    from werkzeug.security import generate_password_hash
    user_repo.update_password(uid, generate_password_hash(temp_pw), must_change=True)
    return temp_pw