import sqlite3
from config.settings import Config
from werkzeug.security import generate_password_hash


def get_db():
    conn = sqlite3.connect(Config.DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            must_change_password INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            created_by INTEGER
        );
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            internal_barcode TEXT UNIQUE NOT NULL,
            device_type TEXT NOT NULL CHECK(device_type IN ('phone','tablet')),
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            connector TEXT NOT NULL CHECK(connector IN ('USB-C','micro-USB','lightning')),
            is_engraved INTEGER DEFAULT 0,
            is_distributed INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Good' CHECK(status IN ('Good','Broken')),
            place TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            created_by INTEGER,
            updated_at TEXT,
            updated_by INTEGER
        );
        CREATE TABLE IF NOT EXISTS chargers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT,
            charger_type TEXT NOT NULL CHECK(charger_type IN ('USB-A','USB-C','USB-C+USB-A')),
            place TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            created_by INTEGER,
            updated_at TEXT,
            updated_by INTEGER
        );
        CREATE TABLE IF NOT EXISTS cables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT,
            cable_type TEXT NOT NULL CHECK(cable_type IN ('USB-C to USB-C','USB-A to USB-C','USB-C to Lightning','USB-A to Lightning','USB-A to micro-USB')),
            place TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            created_by INTEGER,
            updated_at TEXT,
            updated_by INTEGER
        );
        CREATE TABLE IF NOT EXISTS stock_count_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            created_by INTEGER,
            completed_at TEXT,
            notes TEXT
        );
        CREATE TABLE IF NOT EXISTS stock_count_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER REFERENCES stock_count_sessions(id),
            item_type TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            found INTEGER DEFAULT 0,
            notes TEXT
        );
        """)
        admin = db.execute("SELECT id FROM users WHERE email='admin@stockapp.com'").fetchone()
        if not admin:
            h = generate_password_hash('Admin1234!')
            db.execute(
                "INSERT INTO users(email,full_name,password_hash,is_admin,must_change_password) VALUES(?,?,?,1,1)",
                ('admin@stockapp.com', 'Administrator', h)
            )
            db.commit()