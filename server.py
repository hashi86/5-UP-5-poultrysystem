#!/usr/bin/env python3
"""
Smart Poultry System - Backend API
Built with Flask + SQLite (Python)
"""

import sqlite3
import json
import os
from datetime import datetime, date, timedelta
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='frontend')

DB_PATH = os.path.join(os.path.dirname(__file__), 'poultry.db')

# ==================== DATABASE ====================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    c.executescript('''
        CREATE TABLE IF NOT EXISTS sheds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            bird_type TEXT DEFAULT 'broiler',
            capacity INTEGER DEFAULT 0,
            current_birds INTEGER DEFAULT 0,
            age_days INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            priority TEXT DEFAULT 'med',
            time TEXT,
            done INTEGER DEFAULT 0,
            shed TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shed TEXT NOT NULL,
            temperature REAL,
            humidity REAL,
            ammonia REAL,
            recorded_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT,
            severity TEXT DEFAULT 'info',
            read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS production_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shed TEXT NOT NULL,
            date TEXT NOT NULL,
            eggs INTEGER DEFAULT 0,
            mortality INTEGER DEFAULT 0,
            feed_kg REAL DEFAULT 0,
            water_liters REAL DEFAULT 0,
            avg_weight REAL DEFAULT 0,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
    ''')
    
    # Seed data if empty
    if c.execute('SELECT COUNT(*) FROM sheds').fetchone()[0] == 0:
        c.executemany('INSERT INTO sheds (name, bird_type, capacity, current_birds, age_days) VALUES (?,?,?,?,?)', [
            ('عنبر أ', 'broiler', 10000, 9800, 21),
            ('عنبر ب', 'broiler', 8000, 7800, 14),
            ('عنبر ج', 'layer', 6000, 5900, 180),
        ])
        c.executemany('INSERT INTO tasks (title, priority, time, shed) VALUES (?,?,?,?)', [
            ('إصلاح التهوية - عنبر ب (طارئ)', 'high', 'الآن', 'عنبر ب'),
            ('تحصين نيوكاسل - عنبر ب (8000 طير)', 'high', '8:00 ص', 'عنبر ب'),
            ('جمع وتسجيل البيض - عنبر ج', 'med', '12:00 م', 'عنبر ج'),
            ('مراجعة مخزون العلف ووضع طلب', 'low', '2:00 م', None),
        ])
        c.execute('UPDATE tasks SET done=1 WHERE title LIKE "%وزن عينة%"')
        c.executemany('INSERT INTO sensor_readings (shed, temperature, humidity, ammonia) VALUES (?,?,?,?)', [
            ('عنبر أ', 28.0, 68.0, 12.0),
            ('عنبر ب', 36.0, 72.0, 18.0),
            ('عنبر ج', 27.5, 65.0, 10.0),
        ])
        c.executemany('INSERT INTO alerts (type, title, message, severity) VALUES (?,?,?,?)', [
            ('temperature', 'طارئ - حرارة مرتفعة عنبر ب', '36°م - يتجاوز الحد الأقصى. تصرف فوراً.', 'danger'),
            ('vaccine', 'موعد تحصين غامبورو - يوم 14', '8000 طير - عنبر ب. الوقت المثالي صباح الغد.', 'warning'),
            ('ammonia', 'أمونيا مرتفعة - عنبر ب', '18 جزء/مليون - قريب من الحد 20 ppm.', 'warning'),
            ('feed', 'تغيير وجبة العلف - يوم 22', 'انتقل من علف النامي إلى المنهي.', 'info'),
            ('weight', 'وزن اليوم - عنبر أ', '820 غ متوسط - 96.5% من المعيار. أداء ممتاز!', 'success'),
        ])
        import random
        for i in range(7, 0, -1):
            d = (date.today() - timedelta(days=i)).isoformat()
            c.execute('INSERT INTO production_log (shed, date, eggs, mortality, feed_kg, water_liters, avg_weight) VALUES (?,?,?,?,?,?,?)',
                ('عنبر ج', d, random.randint(3000,3400), random.randint(0,4),
                 round(2.3+random.random()*0.3,1), round(4.5+random.random()*0.6,1), 0))
    
    conn.commit()
    conn.close()

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

# ==================== CORS HEADERS ====================
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

# ==================== ROUTES ====================

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Poultry System API Running 🐔', 'time': datetime.now().isoformat()})

# DASHBOARD
@app.route('/api/dashboard')
def dashboard():
    conn = get_db()
    c = conn.cursor()
    sheds = rows_to_list(c.execute('SELECT * FROM sheds WHERE active=1').fetchall())
    total_birds = sum(s['current_birds'] for s in sheds)
    sensors = rows_to_list(c.execute('''
        SELECT s1.* FROM sensor_readings s1
        INNER JOIN (SELECT shed, MAX(recorded_at) as max_time FROM sensor_readings GROUP BY shed) s2
        ON s1.shed = s2.shed AND s1.recorded_at = s2.max_time
    ''').fetchall())
    today_prod = row_to_dict(c.execute('''
        SELECT COALESCE(SUM(eggs),0) as eggs, COALESCE(SUM(feed_kg),0) as feed,
               COALESCE(SUM(water_liters),0) as water, COALESCE(SUM(mortality),0) as mortality
        FROM production_log WHERE date = date('now')
    ''').fetchone())
    unread = c.execute('SELECT COUNT(*) as count FROM alerts WHERE read=0').fetchone()['count']
    pending = c.execute('SELECT COUNT(*) as count FROM tasks WHERE done=0').fetchone()['count']
    prod_7days = rows_to_list(c.execute('''
        SELECT date, SUM(eggs) as eggs FROM production_log
        WHERE date >= date('now', '-7 days') GROUP BY date ORDER BY date
    ''').fetchall())
    conn.close()
    return jsonify({
        'total_birds': total_birds, 'sheds_count': len(sheds),
        'sensors': sensors, 'today_production': today_prod,
        'unread_alerts': unread, 'pending_tasks': pending,
        'production_7days': prod_7days
    })

# SHEDS
@app.route('/api/sheds', methods=['GET'])
def get_sheds():
    conn = get_db()
    sheds = rows_to_list(conn.execute('SELECT * FROM sheds WHERE active=1 ORDER BY name').fetchall())
    conn.close()
    return jsonify(sheds)

@app.route('/api/sheds', methods=['POST'])
def create_shed():
    data = request.json
    conn = get_db()
    r = conn.execute('INSERT INTO sheds (name, bird_type, capacity, current_birds, age_days) VALUES (?,?,?,?,?)',
        (data['name'], data.get('bird_type','broiler'), data.get('capacity',0),
         data.get('current_birds',0), data.get('age_days',0)))
    conn.commit()
    conn.close()
    return jsonify({'id': r.lastrowid, 'message': 'Shed created'})

@app.route('/api/sheds/<int:shed_id>', methods=['PUT'])
def update_shed(shed_id):
    data = request.json
    conn = get_db()
    conn.execute('UPDATE sheds SET name=?, bird_type=?, capacity=?, current_birds=?, age_days=? WHERE id=?',
        (data['name'], data.get('bird_type'), data.get('capacity'), 
         data.get('current_birds'), data.get('age_days'), shed_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Shed updated'})

# TASKS
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    conn = get_db()
    tasks = rows_to_list(conn.execute('''
        SELECT * FROM tasks
        ORDER BY done ASC,
        CASE priority WHEN 'high' THEN 1 WHEN 'med' THEN 2 ELSE 3 END,
        created_at DESC
    ''').fetchall())
    conn.close()
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    conn = get_db()
    r = conn.execute('INSERT INTO tasks (title, priority, time, shed) VALUES (?,?,?,?)',
        (data['title'], data.get('priority','med'), data.get('time'), data.get('shed')))
    conn.commit()
    conn.close()
    return jsonify({'id': r.lastrowid, 'message': 'Task created'})

@app.route('/api/tasks/<int:task_id>/toggle', methods=['PUT'])
def toggle_task(task_id):
    conn = get_db()
    task = conn.execute('SELECT done FROM tasks WHERE id=?', (task_id,)).fetchone()
    if not task:
        return jsonify({'error': 'Not found'}), 404
    new_done = 0 if task['done'] else 1
    conn.execute('UPDATE tasks SET done=? WHERE id=?', (new_done, task_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Toggled', 'done': bool(new_done)})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db()
    conn.execute('DELETE FROM tasks WHERE id=?', (task_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'})

# SENSORS
@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    conn = get_db()
    sensors = rows_to_list(conn.execute('''
        SELECT s1.* FROM sensor_readings s1
        INNER JOIN (SELECT shed, MAX(recorded_at) as max_time FROM sensor_readings GROUP BY shed) s2
        ON s1.shed = s2.shed AND s1.recorded_at = s2.max_time
        ORDER BY shed
    ''').fetchall())
    conn.close()
    return jsonify(sensors)

@app.route('/api/sensors', methods=['POST'])
def add_sensor():
    data = request.json
    conn = get_db()
    r = conn.execute('INSERT INTO sensor_readings (shed, temperature, humidity, ammonia) VALUES (?,?,?,?)',
        (data['shed'], data.get('temperature'), data.get('humidity'), data.get('ammonia')))
    # Auto-alerts
    if data.get('temperature', 0) > 35:
        conn.execute('INSERT INTO alerts (type, title, message, severity) VALUES (?,?,?,?)',
            ('temperature', f"تنبيه حرارة - {data['shed']}", f"درجة الحرارة {data['temperature']}°م تجاوزت الحد", 'danger'))
    if data.get('ammonia', 0) > 18:
        conn.execute('INSERT INTO alerts (type, title, message, severity) VALUES (?,?,?,?)',
            ('ammonia', f"تنبيه أمونيا - {data['shed']}", f"مستوى الأمونيا {data['ammonia']} ppm", 'warning'))
    conn.commit()
    conn.close()
    return jsonify({'id': r.lastrowid, 'message': 'Reading saved'})

# ALERTS
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    conn = get_db()
    alerts = rows_to_list(conn.execute('SELECT * FROM alerts ORDER BY read ASC, created_at DESC LIMIT 50').fetchall())
    conn.close()
    return jsonify(alerts)

@app.route('/api/alerts/<int:alert_id>/read', methods=['PUT'])
def mark_read(alert_id):
    conn = get_db()
    conn.execute('UPDATE alerts SET read=1 WHERE id=?', (alert_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Marked as read'})

@app.route('/api/alerts/read-all', methods=['PUT'])
def mark_all_read():
    conn = get_db()
    conn.execute('UPDATE alerts SET read=1')
    conn.commit()
    conn.close()
    return jsonify({'message': 'All marked as read'})

# PRODUCTION LOG
@app.route('/api/production', methods=['GET'])
def get_production():
    shed = request.args.get('shed')
    days = request.args.get('days', 30)
    conn = get_db()
    query = 'SELECT * FROM production_log WHERE 1=1'
    params = []
    if shed:
        query += ' AND shed=?'
        params.append(shed)
    query += f" AND date >= date('now', '-{int(days)} days')"
    query += ' ORDER BY date DESC LIMIT 30'
    logs = rows_to_list(conn.execute(query, params).fetchall())
    conn.close()
    return jsonify(logs)

@app.route('/api/production', methods=['POST'])
def add_production():
    data = request.json
    conn = get_db()
    r = conn.execute('''
        INSERT INTO production_log (shed, date, eggs, mortality, feed_kg, water_liters, avg_weight, notes)
        VALUES (?,?,?,?,?,?,?,?)
    ''', (data['shed'], data.get('date', date.today().isoformat()),
          data.get('eggs',0), data.get('mortality',0), data.get('feed_kg',0),
          data.get('water_liters',0), data.get('avg_weight',0), data.get('notes')))
    conn.commit()
    conn.close()
    return jsonify({'id': r.lastrowid, 'message': 'Log saved'})

# SERVE FRONTEND
@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path='index.html'):
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    if os.path.exists(os.path.join(frontend_dir, path)):
        return send_from_directory(frontend_dir, path)
    return send_from_directory(frontend_dir, 'index.html')

# ==================== MAIN ====================
if __name__ == '__main__':
    print("🐔 Initializing Poultry System Database...")
    init_db()
    print("✅ Database ready!")
    print(f"🚀 Server starting on http://localhost:5000")
    print(f"📊 API Docs: http://localhost:5000/api/health")
    print(f"🌐 Frontend: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
