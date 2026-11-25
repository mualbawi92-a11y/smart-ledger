#!/usr/bin/env python3
"""
Ultra-Fast Official Client Edition Packager for Smart Ledger
Generates complete standalone Windows client edition packages in < 200ms using Python built-in zipfile (zero external dependencies).
"""

import sys
import os
import json
import zipfile

def package_client(edition_json_path, output_zip_path):
    with open(edition_json_path, 'r', encoding='utf-8') as f:
        edition = json.load(f)

    cwd = os.getcwd()
    candidates = [
        os.path.join(cwd, 'dist', 'Smart-Ledger-Portable.zip'),
        os.path.join(cwd, 'Smart-Ledger-Portable.zip'),
        os.path.join(cwd, 'Smart-Ledger-Setup.zip'),
        os.path.join(cwd, 'public', 'Smart-Ledger-Portable.zip'),
    ]
    base_zip = next((p for p in candidates if os.path.exists(p) and os.path.getsize(p) > 1000000), None)
    staging_dir = os.path.join(cwd, 'staging')

    company_name = edition.get("companyName", "").strip()
    official_key = edition.get("licenseKey", "").strip()

    client_config = {
        "isClientEdition": True,
        "edition": "client",
        "companyName": company_name,
        "clientName": edition.get("clientName", "").strip(),
        "phone": edition.get("phone", "").strip(),
        "city": edition.get("city", "").strip(),
        "officialLicenseKey": official_key,
        "licenseKey": "",
        "activationStatus": "pending_setup",
        "trialStartDate": None,
        "trialDays": 30,
        "lockCompanyName": True,
        "issueDate": edition.get("issueDate", ""),
        "duration": edition.get("duration", "lifetime"),
        "id": edition.get("id", "")
    }

    # دائماً ننشئ قاعدة بيانات نظيفة وفارغة 100% للعميل باسم شركته دون أي حركات سابقة
    initial_db = {
        "version": "3.0.0",
        "appName": "Smart Ledger Pro",
        "lastUpdated": edition.get("issueDate", ""),
        "companySettings": {
            "name": company_name,
            "phone": edition.get("phone", "").strip(),
            "address": edition.get("city", "").strip(),
            "logo": "",
            "systemUser": edition.get("clientName", "المدير العام")
        },
        "companyInfo": {
            "name": company_name,
            "phone": edition.get("phone", "").strip(),
            "address": edition.get("city", "").strip()
        },
        "accounts": [
            {
                "id": "acc-box-1",
                "code": "101",
                "name": "الصندوق الاول - رئيسي",
                "type": "cash_box",
                "phone": edition.get("phone", ""),
                "city": edition.get("city", "بغداد"),
                "balanceIQD": 0,
                "balanceUSD": 0,
                "linkedVaultId": "acc-vault-1"
            },
            {
                "id": "acc-vault-1",
                "code": "102",
                "name": "الخزنة - رئيسي",
                "type": "vault",
                "phone": edition.get("phone", ""),
                "city": edition.get("city", "بغداد"),
                "balanceIQD": 0,
                "balanceUSD": 0
            }
        ],
        "transactions": [],
        "currencies": [
            {"code": "USD", "nameAr": "دولار أمريكي", "nameEn": "US Dollar", "buyRate": 1515, "sellRate": 1525, "change24h": 0.0, "flag": "🇺🇸"},
            {"code": "IQD", "nameAr": "دينار عراقي", "nameEn": "Iraqi Dinar", "buyRate": 1, "sellRate": 1, "change24h": 0.0, "flag": "🇮🇶"},
            {"code": "EUR", "nameAr": "يورو أوروبي", "nameEn": "Euro", "buyRate": 1620, "sellRate": 1640, "change24h": 0.0, "flag": "🇪🇺"},
            {"code": "AED", "nameAr": "درهم إماراتي", "nameEn": "UAE Dirham", "buyRate": 412, "sellRate": 416, "change24h": 0.0, "flag": "🇦🇪"},
            {"code": "TRY", "nameAr": "ليرة تركية", "nameEn": "Turkish Lira", "buyRate": 42, "sellRate": 44, "change24h": 0.0, "flag": "🇹🇷"}
        ],
        "agents": [],
        "clientEdition": client_config
    }

    license_doc = f"""=====================================================================
نظام المحاسب الذكي (Smart Ledger Pro) - ترخيص نسخة العميل الرسمية
=====================================================================
اسم الشركة / المؤسسة: {edition.get('companyName', '')}
رمز التفعيل المعتمد (Activation Code): {edition.get('licenseKey', '')}
مدة الصلاحية: {'دائم مدى الحياة' if edition.get('duration') == 'lifetime' else edition.get('duration', '')}
تاريخ الإصدار: {edition.get('issueDate', '')[:10]}
نوع الإصدار: نسخة عميل مرخصة ومقفلة (Client Edition)
=====================================================================

تعليمات التشغيل وخيارات الترخيص:
1. قم بفك ضغط هذا المجلد في أي مكان ترغب به على جهاز الكمبيوتر.
2. انقر نقراً مزدوجاً على الملف: SmartLedger.exe
3. عند التشغيل لأول مرة، يتاح أمامك خياران:
   - الخيار الأول: بدء الاستخدام التجريبي المجاني لمدة 30 يوماً بكامل الصلاحيات.
   - الخيار الثاني: التفعيل المباشر والدائم مدى الحياة بإدخال رمز التفعيل المذكور أعلاه ({edition.get('licenseKey', '')}).
4. بعد انتهاء الـ 30 يوماً التجريبية، يمكن تفعيل النسخة في أي وقت من خلال:
   القائمة الجانبية -> الإعدادات -> تفعيل وترخيص النسخة -> إدخال رمز التفعيل.
ملاحظة: في حال انتهاء الفترة التجريبية، يظل البرنامج يفتح وتصفح كافة البيانات متاحاً مع قفل إضافة قيود جديدة لحين التفعيل.
====================================================================="""

    custom_files = {
        'client_config.json': json.dumps(client_config, ensure_ascii=False, indent=2).encode('utf-8'),
        'data/client_config.json': json.dumps(client_config, ensure_ascii=False, indent=2).encode('utf-8'),
        'data/database.json': json.dumps(initial_db, ensure_ascii=False, indent=2).encode('utf-8'),
        'معلومات_ترخيص_العميل.txt': license_doc.encode('utf-8')
    }

    abs_out = os.path.abspath(output_zip_path)
    os.makedirs(os.path.dirname(abs_out), exist_ok=True)

    if base_zip and os.path.exists(base_zip):
        with zipfile.ZipFile(base_zip, 'r') as zin, zipfile.ZipFile(abs_out, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            exclude = set()
            for key in custom_files.keys():
                exclude.add(key)
                exclude.add(key.replace('/', '\\'))
                exclude.add(key.replace('\\', '/'))

            for item in zin.infolist():
                norm = item.filename.replace('\\', '/')
                if norm in exclude:
                    continue
                zout.writestr(item, zin.read(item.filename))

            for fname, content in custom_files.items():
                zout.writestr(fname, content)
    elif os.path.exists(staging_dir):
        with zipfile.ZipFile(abs_out, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for root, _, files in os.walk(staging_dir):
                for f in files:
                    full_p = os.path.join(root, f)
                    rel_p = os.path.relpath(full_p, staging_dir).replace('\\', '/')
                    if rel_p in custom_files:
                        continue
                    zout.write(full_p, rel_p)
            for fname, content in custom_files.items():
                zout.writestr(fname, content)
    else:
        raise RuntimeError("Base zip or staging dir not found")

    print(f"SUCCESS:{os.path.getsize(abs_out)}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 package_client.py <edition_json_path> <output_zip_path>")
        sys.exit(1)
    package_client(sys.argv[1], sys.argv[2])

