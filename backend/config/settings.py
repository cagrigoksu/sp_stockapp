import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Config:
    SECRET_KEY = 'stockapp-super-secret-2024'
    DB = os.path.join(BASE_DIR, 'stock.db')