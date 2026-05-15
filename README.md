# 🐔 نظام الدواجن الذكي - Smart Poultry System

## المتطلبات
- Python 3.8 أو أحدث (مجاني من python.org)
- اتصال إنترنت (لميزة الذكاء الاصطناعي فقط)

---

## 🚀 تشغيل الموقع (3 خطوات فقط)

### المتطلبات الأساسية للذكاء الاصطناعي:
يجب توفير مفتاح **OpenAI API** ليعمل المساعد الذكي وتحليل الصور.
قم بتعيين المفتاح في بيئة التشغيل:
```bash
export OPENAI_API_KEY='your-api-key-here'
```

### Windows:
1. ثبّت Python من: https://www.python.org/downloads/
   - **مهم**: ضع علامة على "Add Python to PATH" أثناء التثبيت
2. افتح مجلد المشروع
3. قم بتثبيت المكتبات: `pip install flask openai`
4. **انقر مرتين على ملف `start.bat`**
5. افتح المتصفح واكتب: **http://localhost:5000**

### Mac / Linux:
```bash
pip install flask openai
chmod +x start.sh
./start.sh
```
ثم افتح: **http://localhost:5000**

### تثبيت يدوي:
```bash
pip install flask openai
python server.py
```

---

## 📂 هيكل الملفات
```
poultry-system/
├── server.py          ← السيرفر الرئيسي (Python + Flask)
├── server.js          ← سيرفر بديل (Node.js)
├── index.html         ← واجهة الموقع الرئيسية
├── poultry.db         ← قاعدة البيانات (تُنشأ تلقائياً)
├── start.bat          ← تشغيل Windows
└── start.sh           ← تشغيل Mac/Linux
```

---

## 🌐 رابط لوحة التحكم
بعد التشغيل: **http://localhost:5000**

## 📡 روابط API
| الوظيفة | الرابط |
|---------|--------|
| فحص الاتصال | http://localhost:5000/api/health |
| العنابر | http://localhost:5000/api/sheds |
| المهام | http://localhost:5000/api/tasks |
| التنبيهات | http://localhost:5000/api/alerts |
| المستشعرات | http://localhost:5000/api/sensors |
| الإنتاج | http://localhost:5000/api/production |
| لوحة التحكم | http://localhost:5000/api/dashboard |

---

## ✨ الميزات المتصلة بقاعدة البيانات
- ✅ **المهام اليومية** - إضافة، تعديل، حذف، وإنجاز المهام
- 🔔 **التنبيهات** - تنبيهات تلقائية عند ارتفاع الحرارة أو الأمونيا
- 🌡️ **المستشعرات** - تسجيل قراءات الحرارة والرطوبة والأمونيا
- 📈 **سجل الإنتاج** - تسجيل يومي للبيض والعلف والنفوق
- 🏗️ **العنابر** - إدارة معلومات الحظائر
- 🤖 **الذكاء الاصطناعي** - دردشة مع مشرف AI متخصص
- 📷 **تحليل الصور** - تحليل صور المزرعة بالذكاء الاصطناعي

---

## 🌍 النشر على الإنترنت (Netlify للواجهة فقط)

### الواجهة على Netlify (مجاني):
1. اذهب إلى https://netlify.com
2. اسحب مجلد `frontend` إلى صفحة Netlify
3. ستحصل على رابط مثل: `https://yoursite.netlify.app`
4. **ملاحظة**: الواجهة ستعمل بدون قاعدة البيانات (بيانات وهمية)

### السيرفر الكامل على الإنترنت (Railway - مجاني):
1. اذهب إلى https://railway.app
2. ارفع مجلد المشروع
3. Railway سيكتشف Python تلقائياً ويشغل `server.py`
4. ستحصل على رابط مثل: `https://poultry.railway.app`

---

## 🆘 مشاكل شائعة

**"python ليس أمراً معروفاً"**
→ ثبّت Python من python.org وتأكد من تفعيل "Add to PATH"

**"Port 5000 is in use"**
→ غيّر PORT في `server.py` من 5000 إلى 5001

**الواجهة لا تتصل بالـ API**
→ تأكد أن `server.py` يعمل أولاً ثم افتح http://localhost:5000
