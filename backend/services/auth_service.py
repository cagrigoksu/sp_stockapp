import random
import string
from werkzeug.security import generate_password_hash, check_password_hash
from repositories.user_repository import UserRepository

user_repo = UserRepository()

def gen_password(length=10):
    chars = string.ascii_letters + string.digits + '!@#$'
    return ''.join(random.choices(chars, k=length))

def authenticate(email, password):
    user = user_repo.find_by_email(email.strip().lower())
    if user and check_password_hash(user.password_hash, password):
        return user
    return None

def change_password(user_id, new_password, must_change=False):
    h = generate_password_hash(new_password)
    user_repo.update_password(user_id, h, must_change)

def verify_current_password(user_id, current_password):
    user = user_repo.find_by_id(user_id)
    return check_password_hash(user.password_hash, current_password)