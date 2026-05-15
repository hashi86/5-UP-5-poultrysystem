#!/bin/bash
echo "=========================================="
echo "  نظام الدواجن الذكي - Smart Poultry"
echo "=========================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 غير مثبت!"
    echo "Linux: sudo apt install python3"
    echo "Mac: brew install python3"
    exit 1
fi

# Install Flask if needed
echo "[1/3] التحقق من المتطلبات..."
python3 -c "import flask, openai" 2>/dev/null || pip3 install flask openai

echo "[2/3] تشغيل قاعدة البيانات..."
echo "[3/3] تشغيل السيرفر..."
echo ""
echo "=========================================="
echo " الموقع يعمل على:"
echo " http://localhost:5000"
echo " افتح هذا الرابط في متصفحك الآن!"
echo "=========================================="
echo ""

cd "$(dirname "$0")"
python3 server.py
