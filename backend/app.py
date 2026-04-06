from flask import Flask
import os
from config.settings import Config
from database import init_db
from controllers.auth_controller import auth_bp
from controllers.device_controller import device_bp
from controllers.charger_controller import charger_bp
from controllers.cable_controller import cable_bp
from controllers.stock_count_controller import stock_count_bp
from controllers.export_controller import export_bp
from controllers.user_controller import user_bp
from controllers.overview_controller import overview_bp
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, template_folder=os.path.join(BASE_DIR, 'templates'))
app.secret_key = Config.SECRET_KEY

app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False
)

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

app.register_blueprint(auth_bp)
app.register_blueprint(device_bp)
app.register_blueprint(charger_bp)
app.register_blueprint(cable_bp)
app.register_blueprint(stock_count_bp)
app.register_blueprint(export_bp)
app.register_blueprint(user_bp)
app.register_blueprint(overview_bp)

if __name__ == '__main__':
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)