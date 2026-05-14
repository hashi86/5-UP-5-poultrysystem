const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const db = new Database(path.join(__dirname, 'poultry.db'));

db.exec(`
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

  CREATE TABLE IF NOT EXISTS hatchery_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bird_type TEXT DEFAULT 'broiler',
    eggs_set INTEGER DEFAULT 0,
    start_date TEXT,
    expected_hatch TEXT,
    temperature REAL DEFAULT 37.8,
    humidity REAL DEFAULT 62,
    status TEXT DEFAULT 'incubating',
    fertile_count INTEGER DEFAULT 0,
    hatched_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS feed_formulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bird_type TEXT,
    stage TEXT,
    total_kg REAL DEFAULT 100,
    protein_pct REAL,
    energy_kcal REAL,
    cost_per_ton REAL,
    rating TEXT,
    ai_analysis TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS feed_formula_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    formula_id INTEGER,
    ingredient TEXT NOT NULL,
    percentage REAL DEFAULT 0,
    kg_per_100 REAL DEFAULT 0,
    price_per_kg REAL DEFAULT 0,
    FOREIGN KEY(formula_id) REFERENCES feed_formulas(id)
  );

  CREATE TABLE IF NOT EXISTS farm_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shed TEXT,
    category TEXT DEFAULT 'general',
    note TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'قطعة',
    reorder_level REAL DEFAULT 5,
    cost_per_unit REAL DEFAULT 0,
    supplier TEXT,
    expiry_date TEXT,
    notes TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    type TEXT DEFAULT 'in',
    quantity REAL DEFAULT 0,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    shed TEXT,
    bird_type TEXT DEFAULT 'broiler',
    start_date TEXT,
    end_date TEXT,
    chicks_count INTEGER DEFAULT 0,
    chick_price REAL DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    sell_price_per_kg REAL DEFAULT 0,
    sell_weight_kg REAL DEFAULT 0,
    total_feed_kg REAL DEFAULT 0,
    feed_cost REAL DEFAULT 0,
    med_cost REAL DEFAULT 0,
    other_cost REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS market_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'feed',
    price REAL DEFAULT 0,
    unit TEXT DEFAULT 'كغ',
    trend TEXT DEFAULT 'stable',
    date TEXT DEFAULT (date('now')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'worker',
    phone TEXT,
    shed TEXT,
    salary REAL DEFAULT 0,
    join_date TEXT,
    active INTEGER DEFAULT 1,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const shedCount = db.prepare('SELECT COUNT(*) as count FROM sheds').get();
if (shedCount.count === 0) {
  db.prepare("INSERT INTO sheds (name, bird_type, capacity, current_birds, age_days) VALUES ('عنبر أ', 'broiler', 10000, 9800, 21)").run();
  db.prepare("INSERT INTO sheds (name, bird_type, capacity, current_birds, age_days) VALUES ('عنبر ب', 'broiler', 8000, 7800, 14)").run();
  db.prepare("INSERT INTO sheds (name, bird_type, capacity, current_birds, age_days) VALUES ('عنبر ج', 'layer', 6000, 5900, 180)").run();

  db.prepare("INSERT INTO tasks (title, priority, time, done, shed) VALUES ('إصلاح التهوية - عنبر ب (طارئ)', 'high', 'الآن', 0, 'عنبر ب')").run();
  db.prepare("INSERT INTO tasks (title, priority, time, done, shed) VALUES ('تحصين نيوكاسل - عنبر ب (8000 طير)', 'high', '8:00 ص', 0, 'عنبر ب')").run();
  db.prepare("INSERT INTO tasks (title, priority, time, done, shed) VALUES ('وزن عينة طيور - عنبر أ (50 طير)', 'med', '10:00 ص', 1, 'عنبر أ')").run();
  db.prepare("INSERT INTO tasks (title, priority, time, done, shed) VALUES ('جمع وتسجيل البيض - عنبر ج', 'med', '12:00 م', 0, 'عنبر ج')").run();
  db.prepare("INSERT INTO tasks (title, priority, time, done, shed) VALUES ('مراجعة مخزون العلف ووضع طلب', 'low', '2:00 م', 0, NULL)").run();

  db.prepare("INSERT INTO sensor_readings (shed, temperature, humidity, ammonia) VALUES ('عنبر أ', 28.0, 68.0, 12.0)").run();
  db.prepare("INSERT INTO sensor_readings (shed, temperature, humidity, ammonia) VALUES ('عنبر ب', 36.0, 72.0, 18.0)").run();
  db.prepare("INSERT INTO sensor_readings (shed, temperature, humidity, ammonia) VALUES ('عنبر ج', 27.5, 65.0, 10.0)").run();

  db.prepare("INSERT INTO alerts (type, title, message, severity) VALUES ('temperature', 'طارئ - حرارة مرتفعة عنبر ب', '36°م - يتجاوز الحد الأقصى. تصرف فوراً.', 'danger')").run();
  db.prepare("INSERT INTO alerts (type, title, message, severity) VALUES ('vaccine', 'موعد تحصين غامبورو - يوم 14', '8000 طير - عنبر ب. الوقت المثالي صباح الغد.', 'warning')").run();
  db.prepare("INSERT INTO alerts (type, title, message, severity) VALUES ('ammonia', 'أمونيا مرتفعة - عنبر ب', '18 جزء/مليون - قريب من الحد 20 ppm.', 'warning')").run();
  db.prepare("INSERT INTO alerts (type, title, message, severity) VALUES ('feed', 'تغيير وجبة العلف - يوم 22', 'انتقل من علف النامي إلى المنهي.', 'info')").run();
  db.prepare("INSERT INTO alerts (type, title, message, severity) VALUES ('weight', 'وزن اليوم - عنبر أ', '820 غ متوسط - 96.5% من المعيار. أداء ممتاز!', 'success')").run();

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    db.prepare("INSERT INTO production_log (shed, date, eggs, mortality, feed_kg, water_liters, avg_weight) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run('عنبر ج', dateStr, Math.floor(3000 + Math.random()*400), Math.floor(Math.random()*5),
           Math.round((2.3+Math.random()*0.3)*10)/10, Math.round((4.5+Math.random()*0.6)*10)/10, 0);
  }

  db.prepare("INSERT INTO farm_notes (shed, category, note) VALUES ('عنبر أ', 'health', 'الطيور تبدو بصحة جيدة. الحوصلة ممتلئة 95%')").run();
  db.prepare("INSERT INTO farm_notes (shed, category, note) VALUES ('عنبر ب', 'alert', 'لاحظت ضعفاً في التهوية من الجهة الغربية - تحتاج صيانة')").run();
}

// Seed inventory
const invCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get();
if (invCount.count === 0) {
  const inv = [
    ['لقاح نيوكاسل B1','vaccine',24,'جرعة',10,0.15,'مختبر الشرق','2026-12-01'],
    ['لقاح غامبورو IBD','vaccine',18,'جرعة',10,0.18,'مختبر الشرق','2026-11-15'],
    ['لقاح برونشيتيس IB','vaccine',30,'جرعة',10,0.12,'مختبر النيل','2026-10-20'],
    ['أموكسيسيلين 20%','medication',8,'كغ',3,12.5,'الدار البيطرية','2026-08-01'],
    ['فيتامينات A D E','medication',15,'لتر',5,8.0,'الدار البيطرية','2026-09-15'],
    ['الكتروليت + سكر','medication',20,'كغ',8,4.5,'مستلزمات الدواجن',null],
    ['كوكسيديا (أمبروليوم)','medication',4,'كغ',3,18.0,'الدار البيطرية','2026-07-30'],
    ['ذرة صفراء','feed',5200,'كغ',500,0.22,'المطحنة الكبرى',null],
    ['كسب فول الصويا 44%','feed',1800,'كغ',300,0.48,'مستورد مباشر',null],
    ['ردة القمح','feed',900,'كغ',200,0.15,'المطحنة الكبرى',null],
    ['مسحوق السمك 65%','feed',300,'كغ',50,0.85,'شركة البروتين',null],
    ['حصائر بلاستيك','equipment',45,'قطعة',20,3.5,'معدات المزارع',null],
    ['مسرات شرب نيبل','equipment',12,'قطعة',10,8.0,'معدات المزارع',null],
    ['مصابيح LED 15W','equipment',38,'قطعة',10,2.2,'الكهرباء والإنارة',null],
    ['أكياس فارغة 50كغ','other',200,'قطعة',50,0.3,'التعبئة والتغليف',null],
  ];
  inv.forEach(([name,cat,qty,unit,rl,cpu,sup,exp]) => {
    db.prepare("INSERT INTO inventory (name,category,quantity,unit,reorder_level,cost_per_unit,supplier,expiry_date) VALUES (?,?,?,?,?,?,?,?)").run(name,cat,qty,unit,rl,cpu,sup,exp);
  });
}

// Seed batches
const batchCount = db.prepare('SELECT COUNT(*) as count FROM batches').get();
if (batchCount.count === 0) {
  const d1s = new Date(); d1s.setDate(d1s.getDate()-42);
  const d1e = new Date(); d1e.setDate(d1e.getDate()-2);
  const d2s = new Date(); d2s.setDate(d2s.getDate()-35);
  const d2e = new Date(); d2e.setDate(d2e.getDate()-3);
  const d3s = new Date(); d3s.setDate(d3s.getDate()-21);
  db.prepare("INSERT INTO batches (name,shed,bird_type,start_date,end_date,chicks_count,chick_price,sold_count,sell_price_per_kg,sell_weight_kg,total_feed_kg,feed_cost,med_cost,other_cost,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run('دفعة أبريل - عنبر أ','عنبر أ','broiler',d1s.toISOString().split('T')[0],d1e.toISOString().split('T')[0],10000,0.28,9750,2.20,2.10,38500,8470,420,280,'completed');
  db.prepare("INSERT INTO batches (name,shed,bird_type,start_date,end_date,chicks_count,chick_price,sold_count,sell_price_per_kg,sell_weight_kg,total_feed_kg,feed_cost,med_cost,other_cost,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run('دفعة أبريل - عنبر ب','عنبر ب','broiler',d2s.toISOString().split('T')[0],d2e.toISOString().split('T')[0],8000,0.28,7820,2.18,2.05,29800,6556,310,220,'completed');
  db.prepare("INSERT INTO batches (name,shed,bird_type,start_date,end_date,chicks_count,chick_price,sold_count,sell_price_per_kg,sell_weight_kg,total_feed_kg,feed_cost,med_cost,other_cost,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run('دفعة مايو - عنبر أ','عنبر أ','broiler',d3s.toISOString().split('T')[0],null,9800,0.30,0,2.20,0,18200,4004,180,120,'active');
  db.prepare("INSERT INTO batches (name,shed,bird_type,start_date,end_date,chicks_count,chick_price,sold_count,sell_price_per_kg,sell_weight_kg,total_feed_kg,feed_cost,med_cost,other_cost,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run('دفعة مايو - عنبر ب','عنبر ب','broiler',d3s.toISOString().split('T')[0],null,7800,0.30,0,2.20,0,14600,3212,140,90,'active');
}

// Seed market prices
const mpCount = db.prepare('SELECT COUNT(*) as count FROM market_prices').get();
if (mpCount.count === 0) {
  const prices = [
    ['ذرة صفراء','feed',0.22,'كغ','up'],
    ['كسب فول الصويا 44%','feed',0.48,'كغ','stable'],
    ['ردة القمح','feed',0.15,'كغ','down'],
    ['مسحوق السمك','feed',0.85,'كغ','up'],
    ['كعكة القطن','feed',0.18,'كغ','stable'],
    ['دجاج لاحم حي','bird',2.20,'كغ','up'],
    ['دجاج بياض إسكارت','bird',0.90,'كغ','stable'],
    ['بيضة طازجة L','egg',0.12,'بيضة','up'],
    ['بيضة طازجة M','egg',0.10,'بيضة','stable'],
    ['سمان حي','bird',1.80,'كغ','stable'],
    ['صوص لاحم (كتكوت)','chick',0.30,'قطعة','up'],
    ['صوص بياض','chick',0.45,'قطعة','stable'],
  ];
  prices.forEach(([name,cat,price,unit,trend]) => {
    db.prepare("INSERT INTO market_prices (item_name,category,price,unit,trend) VALUES (?,?,?,?,?)").run(name,cat,price,unit,trend);
  });
}

// Seed employees
const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
if (empCount.count === 0) {
  db.prepare("INSERT INTO employees (name,role,phone,shed,salary,join_date) VALUES (?,?,?,?,?,?)").run('أحمد محمد','supervisor','0501234567','الكل',2800,'2023-01-15');
  db.prepare("INSERT INTO employees (name,role,phone,shed,salary,join_date) VALUES (?,?,?,?,?,?)").run('محمد علي','worker','0507654321','عنبر أ',1800,'2023-06-01');
  db.prepare("INSERT INTO employees (name,role,phone,shed,salary,join_date) VALUES (?,?,?,?,?,?)").run('عبدالله حسن','worker','0509876543','عنبر ب',1800,'2024-02-10');
  db.prepare("INSERT INTO employees (name,role,phone,shed,salary,join_date) VALUES (?,?,?,?,?,?)").run('خالد أحمد','vet','0503456789','الكل',3200,'2022-09-20');
}

// Fix: separate seed for hatchery batches
const hatchCount = db.prepare('SELECT COUNT(*) as count FROM hatchery_batches').get();
if (hatchCount.count === 0) {
  const s1 = new Date(); s1.setDate(s1.getDate() - 10);
  const e1 = new Date(); e1.setDate(e1.getDate() + 11);
  const s2 = new Date(); s2.setDate(s2.getDate() - 7);
  const e2 = new Date(); e2.setDate(e2.getDate() + 10);
  db.prepare("INSERT INTO hatchery_batches (name, bird_type, eggs_set, start_date, expected_hatch, temperature, humidity, status, fertile_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run('دفعة مايو - روس 308', 'broiler', 500, s1.toISOString().split('T')[0], e1.toISOString().split('T')[0], 37.8, 62, 'incubating', 470);
  db.prepare("INSERT INTO hatchery_batches (name, bird_type, eggs_set, start_date, expected_hatch, temperature, humidity, status, fertile_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run('سمان يونيو', 'quail', 300, s2.toISOString().split('T')[0], e2.toISOString().split('T')[0], 37.5, 60, 'incubating', 285);
}

// ==================== HEALTH ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Poultry System API Running', time: new Date().toISOString() });
});

// ==================== SHEDS ====================
app.get('/api/sheds', (req, res) => {
  res.json(db.prepare('SELECT * FROM sheds WHERE active = 1 ORDER BY name').all());
});

app.post('/api/sheds', (req, res) => {
  const { name, bird_type, capacity, current_birds, age_days } = req.body;
  const result = db.prepare('INSERT INTO sheds (name, bird_type, capacity, current_birds, age_days) VALUES (?,?,?,?,?)')
    .run(name, bird_type, capacity, current_birds, age_days);
  res.json({ id: result.lastInsertRowid, message: 'Shed created' });
});

app.put('/api/sheds/:id', (req, res) => {
  const { name, bird_type, capacity, current_birds, age_days, active } = req.body;
  if (active === 0) {
    db.prepare('UPDATE sheds SET active=0 WHERE id=?').run(req.params.id);
  } else {
    db.prepare('UPDATE sheds SET name=?, bird_type=?, capacity=?, current_birds=?, age_days=? WHERE id=?')
      .run(name, bird_type, capacity, current_birds, age_days, req.params.id);
  }
  res.json({ message: 'Shed updated' });
});
app.delete('/api/sheds/:id', (req, res) => {
  db.prepare('UPDATE sheds SET active=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/sheds/tick-age', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const setting = db.prepare("SELECT value FROM settings WHERE key='last_age_tick'").get();
  if (setting && setting.value === today) return res.json({ skipped: true, date: today });
  db.prepare('UPDATE sheds SET age_days = age_days + 1 WHERE active=1').run();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_age_tick', ?)").run(today);
  res.json({ updated: true, date: today });
});

// ==================== TASKS ====================
app.get('/api/tasks', (req, res) => {
  res.json(db.prepare("SELECT * FROM tasks ORDER BY done ASC, CASE priority WHEN 'high' THEN 1 WHEN 'med' THEN 2 ELSE 3 END").all());
});

app.post('/api/tasks', (req, res) => {
  const { title, priority, time, shed } = req.body;
  const result = db.prepare('INSERT INTO tasks (title, priority, time, shed) VALUES (?,?,?,?)')
    .run(title, priority || 'med', time, shed);
  res.json({ id: result.lastInsertRowid, message: 'Task created' });
});

app.put('/api/tasks/:id/toggle', (req, res) => {
  const task = db.prepare('SELECT done FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  db.prepare('UPDATE tasks SET done=? WHERE id=?').run(task.done ? 0 : 1, req.params.id);
  res.json({ message: 'Task toggled', done: !task.done });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

// ==================== SENSORS ====================
app.get('/api/sensors', (req, res) => {
  const sensors = db.prepare(`
    SELECT s1.* FROM sensor_readings s1
    INNER JOIN (SELECT shed, MAX(recorded_at) as max_time FROM sensor_readings GROUP BY shed) s2
    ON s1.shed = s2.shed AND s1.recorded_at = s2.max_time ORDER BY shed
  `).all();
  res.json(sensors);
});

app.get('/api/sensors/history', (req, res) => {
  const { shed, limit: lim = 20 } = req.query;
  let q = 'SELECT * FROM sensor_readings';
  const p = [];
  if (shed) { q += ' WHERE shed=?'; p.push(shed); }
  q += ' ORDER BY recorded_at DESC LIMIT ?'; p.push(parseInt(lim));
  res.json(db.prepare(q).all(...p));
});

app.post('/api/sensors', (req, res) => {
  const { shed, temperature, humidity, ammonia } = req.body;
  const result = db.prepare('INSERT INTO sensor_readings (shed, temperature, humidity, ammonia) VALUES (?,?,?,?)')
    .run(shed, temperature, humidity, ammonia);
  if (temperature > 35) {
    db.prepare('INSERT INTO alerts (type, title, message, severity) VALUES (?,?,?,?)')
      .run('temperature', `تنبيه حرارة - ${shed}`, `درجة الحرارة ${temperature}°م تجاوزت الحد الأقصى`, 'danger');
  }
  if (ammonia > 18) {
    db.prepare('INSERT INTO alerts (type, title, message, severity) VALUES (?,?,?,?)')
      .run('ammonia', `تنبيه أمونيا - ${shed}`, `مستوى الأمونيا ${ammonia} ppm قريب من الحد`, 'warning');
  }
  res.json({ id: result.lastInsertRowid, message: 'Reading saved' });
});

// ==================== ALERTS ====================
app.get('/api/alerts', (req, res) => {
  res.json(db.prepare('SELECT * FROM alerts ORDER BY read ASC, created_at DESC LIMIT 50').all());
});

app.put('/api/alerts/:id/read', (req, res) => {
  db.prepare('UPDATE alerts SET read=1 WHERE id=?').run(req.params.id);
  res.json({ message: 'Alert marked as read' });
});

app.put('/api/alerts/read-all', (req, res) => {
  db.prepare('UPDATE alerts SET read=1').run();
  res.json({ message: 'All alerts marked as read' });
});

app.delete('/api/alerts/:id', (req, res) => {
  db.prepare('DELETE FROM alerts WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/alerts', (req, res) => {
  db.prepare('DELETE FROM alerts WHERE read=1').run();
  res.json({ ok: true });
});

app.post('/api/alerts', (req, res) => {
  const { type, title, message, severity } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'type and title required' });
  const dup = db.prepare("SELECT id FROM alerts WHERE title=? AND read=0 AND created_at >= datetime('now','-1 day')").get(title);
  if (dup) return res.json({ id: dup.id, duplicate: true });
  const r = db.prepare('INSERT INTO alerts (type,title,message,severity) VALUES (?,?,?,?)').run(type, title, message||'', severity||'info');
  res.json({ id: r.lastInsertRowid });
});

app.get('/api/alerts/inventory-check', (req, res) => {
  const low = db.prepare('SELECT * FROM inventory WHERE active=1 AND quantity <= reorder_level').all();
  let created = 0;
  for (const item of low) {
    const title = `مخزون منخفض: ${item.name}`;
    const dup = db.prepare("SELECT id FROM alerts WHERE title=? AND read=0 AND created_at >= datetime('now','-1 day')").get(title);
    if (!dup) {
      db.prepare('INSERT INTO alerts (type,title,message,severity) VALUES (?,?,?,?)').run(
        'inventory', title,
        `الكمية الحالية ${item.quantity} ${item.unit} — أقل من حد إعادة الطلب (${item.reorder_level})`,
        item.quantity === 0 ? 'danger' : 'warning'
      );
      created++;
    }
  }
  res.json({ checked: low.length, created });
});

// ==================== PRODUCTION ====================
app.get('/api/production', (req, res) => {
  const { shed, days } = req.query;
  let query = 'SELECT * FROM production_log WHERE 1=1';
  const params = [];
  if (shed) { query += ' AND shed=?'; params.push(shed); }
  if (days) { query += ` AND date >= date('now', '-${parseInt(days)} days')`; }
  query += ' ORDER BY date DESC LIMIT 30';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/production', (req, res) => {
  const { shed, date, eggs, mortality, feed_kg, water_liters, avg_weight, notes } = req.body;
  const result = db.prepare(`INSERT INTO production_log (shed, date, eggs, mortality, feed_kg, water_liters, avg_weight, notes) VALUES (?,?,?,?,?,?,?,?)`)
    .run(shed, date, eggs||0, mortality||0, feed_kg||0, water_liters||0, avg_weight||0, notes);

  const mort = parseInt(mortality)||0;
  if (mort > 0) {
    const shedRow = db.prepare('SELECT current_birds FROM sheds WHERE name=? AND active=1').get(shed);
    const birds = shedRow?.current_birds || 1000;
    const pct = (mort / birds) * 100;
    if (pct >= 0.5) {
      const severity = pct >= 2 ? 'danger' : 'warning';
      const title = `نفوق مرتفع في ${shed} - ${date}`;
      const dup = db.prepare("SELECT id FROM alerts WHERE title=? AND created_at >= datetime('now','-1 day')").get(title);
      if (!dup) {
        db.prepare('INSERT INTO alerts (type,title,message,severity) VALUES (?,?,?,?)').run(
          'mortality', title,
          `${mort} طير (${pct.toFixed(2)}% من الإجمالي) — ${pct >= 2 ? 'مستوى خطر! تصرف فوراً' : 'يتجاوز الحد الطبيعي 0.5%'}`,
          severity
        );
      }
    }
  }
  res.json({ id: result.lastInsertRowid, message: 'Production log saved', autoAlert: mort > 0 });
});
app.delete('/api/production/:id', (req, res) => {
  db.prepare('DELETE FROM production_log WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ==================== HATCHERY ====================
app.get('/api/hatchery', (req, res) => {
  res.json(db.prepare('SELECT * FROM hatchery_batches ORDER BY created_at DESC').all());
});

app.post('/api/hatchery', (req, res) => {
  const { name, bird_type, eggs_set, start_date, expected_hatch, temperature, humidity, notes } = req.body;
  const result = db.prepare(`INSERT INTO hatchery_batches (name, bird_type, eggs_set, start_date, expected_hatch, temperature, humidity, notes) VALUES (?,?,?,?,?,?,?,?)`)
    .run(name, bird_type, eggs_set, start_date, expected_hatch, temperature||37.8, humidity||62, notes);
  res.json({ id: result.lastInsertRowid, message: 'Batch created' });
});

app.put('/api/hatchery/:id', (req, res) => {
  const { temperature, humidity, fertile_count, hatched_count, status, notes } = req.body;
  db.prepare('UPDATE hatchery_batches SET temperature=?, humidity=?, fertile_count=?, hatched_count=?, status=?, notes=? WHERE id=?')
    .run(temperature, humidity, fertile_count, hatched_count, status, notes, req.params.id);
  res.json({ message: 'Batch updated' });
});
app.delete('/api/hatchery/:id', (req, res) => {
  db.prepare('DELETE FROM hatchery_batches WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ==================== FEED FORMULAS ====================
app.get('/api/feed-formulas', (req, res) => {
  const formulas = db.prepare('SELECT * FROM feed_formulas ORDER BY created_at DESC').all();
  for (const f of formulas) {
    f.ingredients = db.prepare('SELECT * FROM feed_formula_ingredients WHERE formula_id=?').all(f.id);
  }
  res.json(formulas);
});

app.post('/api/feed-formulas', (req, res) => {
  const { name, bird_type, stage, total_kg, protein_pct, energy_kcal, cost_per_ton, ingredients } = req.body;
  const result = db.prepare(`INSERT INTO feed_formulas (name, bird_type, stage, total_kg, protein_pct, energy_kcal, cost_per_ton) VALUES (?,?,?,?,?,?,?)`)
    .run(name, bird_type, stage, total_kg||100, protein_pct, energy_kcal, cost_per_ton);
  const fid = result.lastInsertRowid;
  if (ingredients && ingredients.length) {
    const ins = db.prepare('INSERT INTO feed_formula_ingredients (formula_id, ingredient, percentage, kg_per_100, price_per_kg) VALUES (?,?,?,?,?)');
    for (const ing of ingredients) {
      ins.run(fid, ing.ingredient, ing.percentage, ing.kg_per_100, ing.price_per_kg||0);
    }
  }
  res.json({ id: fid, message: 'Formula saved' });
});

app.put('/api/feed-formulas/:id/analysis', (req, res) => {
  const { rating, ai_analysis } = req.body;
  db.prepare('UPDATE feed_formulas SET rating=?, ai_analysis=? WHERE id=?').run(rating, ai_analysis, req.params.id);
  res.json({ message: 'Analysis saved' });
});

app.delete('/api/feed-formulas/:id', (req, res) => {
  db.prepare('DELETE FROM feed_formula_ingredients WHERE formula_id=?').run(req.params.id);
  db.prepare('DELETE FROM feed_formulas WHERE id=?').run(req.params.id);
  res.json({ message: 'Formula deleted' });
});

// ==================== NOTES ====================
app.get('/api/notes', (req, res) => {
  res.json(db.prepare('SELECT * FROM farm_notes ORDER BY created_at DESC LIMIT 50').all());
});
app.post('/api/notes', (req, res) => {
  const { shed, category, note } = req.body;
  const result = db.prepare('INSERT INTO farm_notes (shed, category, note) VALUES (?,?,?)').run(shed, category||'general', note);
  res.json({ id: result.lastInsertRowid });
});
app.delete('/api/notes/:id', (req, res) => {
  db.prepare('DELETE FROM farm_notes WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ==================== DASHBOARD ====================
app.get('/api/dashboard', (req, res) => {
  const sheds = db.prepare('SELECT * FROM sheds WHERE active=1').all();
  const totalBirds = sheds.reduce((sum, s) => sum + s.current_birds, 0);
  const latestSensors = db.prepare(`
    SELECT s1.* FROM sensor_readings s1
    INNER JOIN (SELECT shed, MAX(recorded_at) as max_time FROM sensor_readings GROUP BY shed) s2
    ON s1.shed = s2.shed AND s1.recorded_at = s2.max_time
  `).all();
  const todayProd = db.prepare(`SELECT SUM(eggs) as eggs, SUM(feed_kg) as feed, SUM(water_liters) as water, SUM(mortality) as mortality FROM production_log WHERE date = date('now')`).get();
  const unreadAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE read=0').get();
  const pendingTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE done=0').get();
  const prod7 = db.prepare(`SELECT date, SUM(eggs) as eggs, SUM(mortality) as mortality, SUM(feed_kg) as feed FROM production_log WHERE date >= date('now', '-7 days') GROUP BY date ORDER BY date`).all();
  const hatcheryActive = db.prepare("SELECT COUNT(*) as count FROM hatchery_batches WHERE status='incubating'").get();

  res.json({
    total_birds: totalBirds,
    sheds_count: sheds.length,
    sheds,
    sensors: latestSensors,
    today_production: todayProd,
    unread_alerts: unreadAlerts.count,
    pending_tasks: pendingTasks.count,
    production_7days: prod7,
    hatchery_active: hatcheryActive.count
  });
});

// ==================== INVENTORY ====================
app.get('/api/inventory', (req, res) => {
  res.json(db.prepare('SELECT * FROM inventory WHERE active=1 ORDER BY category, name').all());
});
app.post('/api/inventory', (req, res) => {
  const { name, category, quantity, unit, reorder_level, cost_per_unit, supplier, expiry_date, notes } = req.body;
  const r = db.prepare('INSERT INTO inventory (name,category,quantity,unit,reorder_level,cost_per_unit,supplier,expiry_date,notes) VALUES (?,?,?,?,?,?,?,?,?)').run(name, category||'other', quantity||0, unit||'قطعة', reorder_level||5, cost_per_unit||0, supplier||null, expiry_date||null, notes||null);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/inventory/:id', (req, res) => {
  const { name, category, quantity, unit, reorder_level, cost_per_unit, supplier, expiry_date, notes } = req.body;
  db.prepare('UPDATE inventory SET name=?,category=?,quantity=?,unit=?,reorder_level=?,cost_per_unit=?,supplier=?,expiry_date=?,notes=? WHERE id=?').run(name, category, quantity, unit, reorder_level, cost_per_unit, supplier, expiry_date, notes, req.params.id);
  res.json({ ok: true });
});
app.post('/api/inventory/:id/adjust', (req, res) => {
  const { delta, reason } = req.body;
  const item = db.prepare('SELECT quantity FROM inventory WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const newQty = Math.max(0, item.quantity + delta);
  db.prepare('UPDATE inventory SET quantity=? WHERE id=?').run(newQty, req.params.id);
  db.prepare('INSERT INTO inventory_transactions (item_id,type,quantity,reason) VALUES (?,?,?,?)').run(req.params.id, delta > 0 ? 'in' : 'out', Math.abs(delta), reason||null);
  res.json({ quantity: newQty });
});
app.delete('/api/inventory/:id', (req, res) => {
  db.prepare('UPDATE inventory SET active=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ==================== BATCHES ====================
app.get('/api/batches', (req, res) => {
  res.json(db.prepare('SELECT * FROM batches ORDER BY created_at DESC').all());
});
app.post('/api/batches', (req, res) => {
  const { name, shed, bird_type, start_date, chicks_count, chick_price } = req.body;
  const r = db.prepare('INSERT INTO batches (name,shed,bird_type,start_date,chicks_count,chick_price) VALUES (?,?,?,?,?,?)').run(name, shed, bird_type||'broiler', start_date, chicks_count||0, chick_price||0);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/batches/:id', (req, res) => {
  const { name, shed, bird_type, start_date, end_date, chicks_count, chick_price, sold_count, sell_price_per_kg, sell_weight_kg, total_feed_kg, feed_cost, med_cost, other_cost, status, notes } = req.body;
  db.prepare('UPDATE batches SET name=?,shed=?,bird_type=?,start_date=?,end_date=?,chicks_count=?,chick_price=?,sold_count=?,sell_price_per_kg=?,sell_weight_kg=?,total_feed_kg=?,feed_cost=?,med_cost=?,other_cost=?,status=?,notes=? WHERE id=?').run(name, shed, bird_type, start_date, end_date, chicks_count, chick_price, sold_count, sell_price_per_kg, sell_weight_kg, total_feed_kg, feed_cost, med_cost, other_cost, status, notes, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/batches/:id', (req, res) => {
  db.prepare('DELETE FROM batches WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ==================== MARKET PRICES ====================
app.get('/api/market-prices', (req, res) => {
  res.json(db.prepare('SELECT * FROM market_prices ORDER BY category, item_name').all());
});
app.put('/api/market-prices/:id', (req, res) => {
  const { price, trend, notes } = req.body;
  db.prepare('UPDATE market_prices SET price=?,trend=?,notes=?,date=date("now") WHERE id=?').run(price, trend, notes, req.params.id);
  res.json({ ok: true });
});
app.post('/api/market-prices', (req, res) => {
  const { item_name, category, price, unit, trend, notes } = req.body;
  const r = db.prepare('INSERT INTO market_prices (item_name,category,price,unit,trend,notes) VALUES (?,?,?,?,?,?)').run(item_name, category||'feed', price||0, unit||'كغ', trend||'stable', notes||null);
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/market-prices/:id', (req, res) => {
  db.prepare('DELETE FROM market_prices WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ==================== EMPLOYEES ====================
app.get('/api/employees', (req, res) => {
  res.json(db.prepare('SELECT * FROM employees WHERE active=1 ORDER BY role, name').all());
});
app.post('/api/employees', (req, res) => {
  const { name, role, phone, shed, salary, join_date, notes } = req.body;
  const r = db.prepare('INSERT INTO employees (name,role,phone,shed,salary,join_date,notes) VALUES (?,?,?,?,?,?,?)').run(name, role||'worker', phone||null, shed||null, salary||0, join_date||null, notes||null);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/employees/:id', (req, res) => {
  const { name, role, phone, shed, salary, join_date, notes } = req.body;
  db.prepare('UPDATE employees SET name=?,role=?,phone=?,shed=?,salary=?,join_date=?,notes=? WHERE id=?').run(name, role, phone, shed, salary, join_date, notes, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/employees/:id', (req, res) => {
  db.prepare('UPDATE employees SET active=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ==================== AI PROXY ====================
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

app.post('/api/ai/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt || `أنت خبير دواجن متخصص ومساعد ذكي لإدارة مزارع الدواجن. تجيب بالعربية بشكل احترافي ودقيق ومفصّل.

## خلفيتك العلمية (مستمدة من كتاب Poultry Production):

### التصنيف والمصطلحات:
- الدواجن: دجاج، رومي (ديك الحبش)، بط، أوز، سمان، حمام. الدجاج ينتمي لـ Gallus domesticus.
- DOC = كتكوت يوم واحد، FCR = نسبة التحويل الغذائي (علف ÷ لحم)، Broiler = لاحم، Layer = بياض.
- أنظمة الإنتاج: مفتوح (Free Range)، شبه مكثف (Semi-Intensive)، مكثف (Intensive: أرضية أو بطاريات).

### الإسكان ومعايير الحظائر:
- الاتجاه: شرق-غرب لتجنب الشمس المباشرة. ارتفاع السقف 3.5-5م.
- الكثافة: لاحم 10-12 طير/م²، بياض في بطاريات 450-550 سم²/طير.
- الفرشة: نشارة خشب أو قش بسمك 5-10 سم، تمتص الرطوبة وتقلل الأمونيا.

### المعدات:
- المشارب: حلمة واحدة لـ 10 طيور، أو مشرب دائري لـ 100 كتكوت.
- المعالف: أسطوانية 30-35 طير، خطية 2.5 سم/طير (لاحم)، 10 سم/طير (بياض).
- الحضانات (Brooders): غاز أو كهرباء - 34°م أسبوع 1 ثم تخفيض تدريجي.
- الأعشاش: 1 عش لكل 5 دجاجات بياض، توضع في الجانب المظلم.
- قاطع المناقير (Debeaker): يستخدم عند عمر 7-10 أيام لمنع الافتراس.

### إنتاج البيض والجهاز التناسلي:
- تستغرق تكوين البيضة الواحدة 25-27 ساعة.
- مراحل القناة البيضية: Infundibulum (تخصيب) ← Magnum (البياض الأبيض، 3 ساعات) ← Isthmus (الأغشية، 75 دقيقة) ← Uterus/Shell Gland (القشرة، 20 ساعة) ← Vagina ← Cloaca.
- المبيض يحتوي 4000 بويضة. الإستروجين: يحفز نمو القناة البيضية، يزيد Ca وP في الدم.
- الدجاجة البياضة: 280-340 بيضة/سنة، ذروة الإنتاج عند 30 أسبوع.

### اللاحم (Broiler):
- يُذبح عند 5-6 أسابيع بوزن 2.5-3 كغ.
- التسليم يتم بعد حجب العلف ساعات. الصعق الكهربائي ثم ذبح بالرقبة.
- السلب بالماء الساخن (50-55°م) ثم نزع الريش ثم التفريغ.

### التهوية والإضاءة:
- الغازات الضارة: CO, CO₂, NH₃ (أمونيا). التهوية تبدأ من اليوم الأول.
- مراوح التقليب (Stirring fans) تضمن توزيع الهواء على مستوى الكتاكيت.
- اللاحم: 23 ساعة ضوء + 1 ساعة ظلام. شدة 20-25 لوكس أول أسبوع ثم 3-5 لوكس.
- قبل وصول الكتاكيت: تسخين الحظيرة مسبقاً لضمان 34°م في الفرشة.

### الجهاز الهضمي:
- المسار: فم (منقار، حساس للحرارة) → مريء → حوصلة (تخزين) → قانصة (هضم كيميائي، HCl + بيبسين) → قوانص/جزارة (طحن ميكانيكي، بديل الأسنان) → أمعاء دقيقة (هضم وامتصاص: duodenum, jejunum, ileum) → بنكرياس+كبد(مساعدة) → أعور (تخمير، امتصاص ماء) → أمعاء غليظة → مجمع (Cloaca).

### التغذية والاحتياجات الغذائية:
- 6 مجموعات: كربوهيدرات، دهون، بروتين، ألياف (أقل من 10%)، فيتامينات، معادن (Ca وP أهمها).
- الماء: أهم مغذٍ. ساعات قليلة بدونه تؤثر على إنتاج البيض. يجب أن يكون بين 18-24°م.
- اللاحم: مبتدئ (1-14 يوم): بروتين 23%، طاقة 3100 kcal. نامٍ (3-6 أسابيع): بروتين 21%، 3200 kcal. ناهٍ (7-8 أسابيع): بروتين 20%، 3200 kcal.
- البياض: كتكوت (0-8 أسابيع): بروتين 21-23%. نامٍ (9-20 أسبوع): 19%. بياض (21-72 أسبوع): 16-18%، 2800 kcal.
- مصادر البروتين: نباتية (فول الصويا، كسب الزيتون) وحيوانية (مسحوق السمك 2-10%).
- الأحماض الأمينية: 22 في الجسم، 10 أساسية لا يصنعها الجسم ويجب توفيرها بالعلف.
- الدهون: تُرفع بالعلف لتحسين الطاقة، مهمة لامتصاص فيتامينات A,D,E,K.
- عوامل تؤثر على الأكل: مستوى الطاقة، الحرارة البيئية، الصحة، الجينات، شكل العلف، التوازن الغذائي.

### التسويق والذبح:
- التجميع → النقل (مراعاة الطقس) → التخدير الكهربائي → الذبح → النزف → السلق → نزع الريش → التفريغ → التنظيف → التدريج → الوزن → التبريد (2°م للأيام القليلة أو -18°م للتجميد).

### الأمراض:
**نيوكاسل (Newcastle Disease):**
- فيروس Paramyxovirus (عائلة Paramyxoviridae، جنس Avulavirus).
- أعراض: أعراض تنفسية، عصبية (التواء الرقبة)، إسهال أصفر-أخضر.
- لا علاج - الوقاية بالتحصين الإجباري. وُصفت أول مرة 1926 في نيوكاسل بإنجلترا.

**مرض ماريك (Marek's Disease):**
- فيروس Alphaherpesvirus. يُصيب 12-25 أسبوع. 4 أشكال: جلدية، عصبية، عينية، حشوية.
- لا علاج - تحصين في يوم الفقس ضروري.

**كوليرا الطيور (Fowl Cholera):**
- بكتيريا Pasteurella multocida. يصيب كل الطيور.
- أعراض: إسهال أصفر، وفيات مفاجئة، تورم المفاصل. تنخفض البيضة 5-15%.
- علاج: سلفاميدات ومضادات حيوية (ستربتومايسين، بنسيلين، أوكسي تتراسيكلين).

**إنفلونزا الطيور (Avian Influenza):**
- فيروس Orthomyxovirus. الأنماط المهمة: H5, H7, H9. HPAI (عالية الفتك) وLPAI (منخفضة).
- أعراض: توقف البياض، عطش شديد، إسهال مائي، نفوق مرتفع.
- لا علاج - إعدام القطيع المصاب، تعقيم، تحصين.

### الأمن الحيوي والتحصينات:
- البيوسكيورتي: منع دخول الأمراض وانتشارها. أرخص وأفضل من العلاج.
- مكونات: إدارة القطيع، عزل، مراقبة حركة السيارات والأشخاص، تنظيف وتطهير.
- المسافة بين المزارع: لا تقل عن 25م.
- 5 خطوات تطهير: نظافة جافة → صابون → شطف → تجفيف → مطهر.
- اللقاحات: حية (مُعدَّلة) أو ميتة (مُعطَّلة) أو توكسويد. عناصر البرنامج: عمر أول تحصين، الفترات، عدد الجرعات، نوع اللقاح، طريقة التطبيق.

## أسلوب الإجابة:
- استخدم أرقاماً وإحصاءات دقيقة من الكتاب دائماً
- أجب بنقاط منظمة وعناوين واضحة
- أضف توصيات عملية في نهاية كل إجابة
- إذا كان السؤال عن مرض، اذكر: التعريف، المسبب، الأعراض، الوقاية، العلاج`,
      messages
    });
    res.json({ text: response.content?.[0]?.text || 'لم أتمكن من الإجابة' });
  } catch (e) {
    res.status(500).json({ error: 'AI service error: ' + e.message });
  }
});

app.post('/api/ai/analyze-image', async (req, res) => {
  const { imageBase64, mediaType, prompt } = req.body;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: prompt }
        ]
      }]
    });
    res.json({ text: response.content?.[0]?.text || 'لم أتمكن من التحليل' });
  } catch (e) {
    res.status(500).json({ error: 'AI service error: ' + e.message });
  }
});

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐔 Poultry System running on port ${PORT}`);
});
