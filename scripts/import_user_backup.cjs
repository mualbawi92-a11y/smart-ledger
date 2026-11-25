const fs = require('fs');
const path = require('path');

const rawFilePath = path.join(__dirname, '..', 'data', 'user_raw_backup.json');

function run() {
  if (!fs.existsSync(rawFilePath)) {
    console.error('File not found:', rawFilePath);
    return;
  }

  const rawContent = fs.readFileSync(rawFilePath, 'utf8');
  const backupObj = JSON.parse(rawContent);

  const rawAccounts = backupObj['@mohaseb_accounts'] ? JSON.parse(backupObj['@mohaseb_accounts']) : [];
  const rawTransactions = backupObj['@mohaseb_transactions'] ? JSON.parse(backupObj['@mohaseb_transactions']) : [];
  const rawSettings = backupObj['@mohaseb_settings'] ? JSON.parse(backupObj['@mohaseb_settings']) : {};
  const rawCommissions = backupObj['@mohaseb_commissions'] ? JSON.parse(backupObj['@mohaseb_commissions']) : [];

  console.log(`Parsed accounts count: ${rawAccounts.length}`);
  console.log(`Parsed transactions count: ${rawTransactions.length}`);

  const accounts = rawAccounts.map(acc => {
    let type = acc.type || 'client';
    if (acc.systemType === 'cash_box' || acc.id === 'sys_cash_box') type = 'cash_box';
    else if (acc.systemType === 'vault' || acc.id === 'sys_vault') type = 'vault';
    else if (acc.type === 'bank') type = 'bank';
    else if (acc.type === 'client') type = 'client';

    const balanceIQD = (acc.balances && typeof acc.balances.IQD === 'number') ? acc.balances.IQD : 0;
    const balanceUSD = (acc.balances && typeof acc.balances.USD === 'number') ? acc.balances.USD : 0;

    return {
      id: acc.id,
      name: acc.name,
      code: acc.code || '',
      type: type,
      phone: acc.phone || '',
      address: acc.address || '',
      balanceIQD,
      balanceUSD,
      city: acc.city || 'النجف الاشرف',
      notes: acc.notes || '',
      isSystem: !!acc.isEssential || !!acc.systemType || acc.id.startsWith('sys_'),
      currencies: acc.currencies || ['IQD', 'USD']
    };
  });

  if (!accounts.some(a => a.id === 'sys_cash_box' || a.type === 'cash_box')) {
    accounts.unshift({
      id: 'sys_cash_box',
      name: 'الصندوق الرئيسي',
      code: '101',
      type: 'cash_box',
      balanceIQD: 0,
      balanceUSD: 0,
      city: 'النجف الاشرف'
    });
  }

  if (!accounts.some(a => a.id === 'sys_vault' || a.type === 'vault')) {
    accounts.splice(1, 0, {
      id: 'sys_vault',
      name: 'الخزنة الرئيسية',
      code: '102',
      type: 'vault',
      balanceIQD: 0,
      balanceUSD: 0,
      city: 'النجف الاشرف'
    });
  }

  const transactions = rawTransactions.map(tx => {
    let txType = 'cash_in';
    if (tx.type === 'payment') txType = 'cash_out';
    else if (tx.type === 'receipt') txType = 'cash_in';
    else if (tx.type === 'bank_deposit') txType = 'bank_deposit';
    else if (tx.type === 'journal_entry' || tx.type === 'accounting_entry') txType = 'journal';
    else if (tx.type === 'currency_exchange') txType = 'exchange';
    else if (tx.type === 'outgoing_transfer') txType = 'transfer_outgoing';
    else if (tx.type === 'transfer' || tx.type === 'incoming_transfer') txType = 'transfer_incoming';

    return {
      id: tx.id || String(Math.random()),
      code: tx.code || tx.id || 'TX-' + Math.floor(Math.random() * 900000 + 100000),
      type: txType,
      titleAr: tx.notes || tx.type || 'حركة مالية',
      senderName: tx.senderName || tx.accountName || 'العميل',
      senderPhone: tx.senderPhone || '',
      receiverName: tx.beneficiaryName || tx.toAccountName || '',
      receiverPhone: tx.receiverPhone || '',
      accountId: tx.accountId,
      accountName: tx.accountName,
      toAccountId: tx.toAccountId,
      toAccountName: tx.toAccountName,
      amount: Number(tx.amount) || 0,
      currency: tx.currency || 'IQD',
      targetAmount: tx.toAmount || undefined,
      targetCurrency: tx.toCurrency || undefined,
      exchangeRate: tx.exchangeRate || undefined,
      fee: tx.commissionAmount || 0,
      commissionType: tx.commissionType === 'earned' ? 'collected' : (tx.commissionType === 'paid' ? 'on_us' : 'none'),
      notes: tx.notes || '',
      status: tx.status || 'completed',
      createdAt: tx.createdAt || new Date().toISOString()
    };
  });

  const companySettings = {
    name: rawSettings.company?.name || 'شركة البركة للصرافة والحسابات',
    phone: rawSettings.company?.phone || '07800894440',
    address: rawSettings.company?.address || 'النجف الاشرف',
    logo: '',
    systemUser: 'محمد علي الباوي (المدير العام)',
    theme: backupObj['@app_theme'] || 'light',
    font: backupObj['@font_family'] || 'Cairo'
  };

  const finalDatabase = {
    version: '1.4.0',
    appName: 'Smart Ledger - المحاسب الذكي',
    lastUpdated: new Date().toISOString(),
    companySettings,
    accounts,
    transactions,
    commissions: rawCommissions,
    rawMohasebBackup: backupObj
  };

  const dbPath = path.join(__dirname, '..', 'data', 'database.json');
  fs.writeFileSync(dbPath, JSON.stringify(finalDatabase, null, 2), 'utf8');
  console.log('Successfully updated data/database.json!');

  const publicExportPath = path.join(__dirname, '..', 'public', 'SmartLedger_Backup.json');
  fs.writeFileSync(publicExportPath, JSON.stringify(finalDatabase, null, 2), 'utf8');

  const rawPublicPath = path.join(__dirname, '..', 'public', 'mohaseb_raw_backup.json');
  fs.writeFileSync(rawPublicPath, rawContent, 'utf8');
}

run();
