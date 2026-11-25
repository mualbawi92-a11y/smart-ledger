import json
import glob
import os

with open('data/accounts_tmp.json', 'r', encoding='utf-8') as f:
    accounts = json.load(f)

# Combine all transaction parts
all_txs = []
for part_file in sorted(glob.glob('data/tx_part*.json')):
    with open(part_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        all_txs.extend(data)

print(f"Total raw transactions gathered: {len(all_txs)}")

# Format transactions into Smart Ledger standard format
formatted_txs = []
for tx in all_txs:
    tx_type = 'cash_in'
    raw_type = tx.get('type', '')
    if raw_type == 'payment': tx_type = 'cash_out'
    elif raw_type == 'receipt': tx_type = 'cash_in'
    elif raw_type == 'bank_deposit': tx_type = 'bank_deposit'
    elif raw_type in ['journal_entry', 'accounting_entry']: tx_type = 'journal'
    elif raw_type == 'currency_exchange': tx_type = 'exchange'
    elif raw_type == 'outgoing_transfer': tx_type = 'transfer_outgoing'
    elif raw_type in ['transfer', 'incoming_transfer']: tx_type = 'transfer_incoming'

    formatted_txs.append({
        "id": tx.get('id', ''),
        "code": tx.get('code') or tx.get('id') or ('TX-' + str(len(formatted_txs) + 1)),
        "type": tx_type,
        "titleAr": tx.get('notes') or tx.get('type') or 'حركة مالية',
        "senderName": tx.get('senderName') or tx.get('accountName') or 'العميل',
        "senderPhone": tx.get('senderPhone', ''),
        "receiverName": tx.get('beneficiaryName') or tx.get('toAccountName') or '',
        "receiverPhone": tx.get('receiverPhone', ''),
        "accountId": tx.get('accountId'),
        "accountName": tx.get('accountName'),
        "toAccountId": tx.get('toAccountId'),
        "toAccountName": tx.get('toAccountName'),
        "amount": float(tx.get('amount', 0)),
        "currency": tx.get('currency', 'IQD'),
        "targetAmount": float(tx['toAmount']) if 'toAmount' in tx else None,
        "targetCurrency": tx.get('toCurrency'),
        "exchangeRate": float(tx['exchangeRate']) if 'exchangeRate' in tx else None,
        "fee": float(tx.get('commissionAmount', 0)),
        "commissionType": 'collected' if tx.get('commissionType') == 'earned' else ('on_us' if tx.get('commissionType') == 'paid' else 'none'),
        "notes": tx.get('notes', ''),
        "status": tx.get('status', 'completed'),
        "createdAt": tx.get('createdAt', '')
    })

company_settings = {
    "name": "شركة البركة للصرافة والحسابات",
    "phone": "07800894440",
    "address": "النجف الاشرف",
    "logo": "",
    "systemUser": "محمد علي الباوي (المدير العام)",
    "theme": "light",
    "font": "Cairo"
}

final_db = {
    "version": "1.4.0",
    "appName": "Smart Ledger - المحاسب الذكي",
    "lastUpdated": "2026-10-12T11:45:00.000Z",
    "companySettings": company_settings,
    "accounts": accounts,
    "transactions": formatted_txs
}

with open('data/database.json', 'w', encoding='utf-8') as f:
    json.dump(final_db, f, ensure_ascii=False, indent=2)

with open('public/SmartLedger_Backup.json', 'w', encoding='utf-8') as f:
    json.dump(final_db, f, ensure_ascii=False, indent=2)

with open('public/albaraka_backup.json', 'w', encoding='utf-8') as f:
    json.dump(final_db, f, ensure_ascii=False, indent=2)

print(f"Successfully assembled database.json with {len(accounts)} accounts and {len(formatted_txs)} transactions!")
