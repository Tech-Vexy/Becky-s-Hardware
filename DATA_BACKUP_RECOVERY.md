# Becky's Hardware Store - Data Backup & Recovery Guide

## Overview

Becky's Hardware Store uses **IndexedDB** (via Dexie.js) as a local offline-first database. This ensures the app works without internet connectivity. This guide explains how to backup and recover local data if a device is lost or browser storage is cleared.

---

## Local Database Architecture

### Database Name
- **HardwareStoreLocalDB**

### Stored Data Tables
- `storeSettings` - Store configuration (KRA PIN, phone, printer settings)
- `categories` - Product categories
- `products` - Product catalog with stock levels
- `customers` - Customer directory
- `suppliers` - Supplier directory
- `sales` - Completed sales transactions
- `stockMovements` - Stock adjustment history (audit trail)
- `purchases` - Purchase orders
- `expenses` - Store expenses
- `customerRepayments` - Credit customer repayments
- `returns` - Sales returns
- `invoices` - Tax invoices
- `draftCart` - In-progress POS cart (auto-restored on reload)
- `syncQueue` - Offline operations awaiting cloud sync
- `offlineReceipts` - Receipts for offline printing

---

## Automatic Cloud Backup

### Supabase PostgreSQL (Primary Cloud Backup)
- **Database**: `gikivrpwayzqrvrturyz`
- **Sync**: Automatic bi-directional sync when online
- **Frequency**: Every 30 seconds when online + manual sync via Sync Center
- **Coverage**: All sales, stock movements, products, customers, suppliers, invoices

**Critical**: Ensure regular syncs occur. If a device is lost, all data synced to Supabase can be recovered on a new device.

---

## Manual Local Backup (Export)

### Method 1: Browser DevTools Export

1. Open Becky's Hardware Store in Chrome/Edge/Firefox
2. Press `F12` to open Developer Tools
3. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
4. Expand **IndexedDB** → **HardwareStoreLocalDB**
5. Right-click on the database name
6. Select **Export** (Chrome) or use the export functionality
7. Save the `.json` file with timestamp: `backup_YYYY-MM-DD.json`

### Method 2: Console Script Export

Open DevTools Console (F12) and run:

```javascript
// Export entire IndexedDB to JSON
const exportDb = async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('HardwareStoreLocalDB');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const exportData = {};
  const tableNames = [
    'storeSettings', 'categories', 'products', 'customers', 'suppliers',
    'sales', 'stockMovements', 'purchases', 'expenses', 'customerRepayments',
    'returns', 'invoices', 'draftCart', 'syncQueue', 'offlineReceipts'
  ];

  for (const tableName of tableNames) {
    const transaction = db.transaction(tableName, 'readonly');
    const objectStore = transaction.objectStore(tableName);
    const records = await new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    exportData[tableName] = records;
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `becky_hardware_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

exportDb();
```

---

## Data Recovery (Import)

### Method 1: Browser DevTools Import

1. Open Becky's Hardware Store on the new device
2. Press `F12` to open Developer Tools
3. Go to **Application** tab → **IndexedDB**
4. Right-click on **HardwareStoreLocalDB**
5. Select **Import** (if available) or use console script below

### Method 2: Console Script Import

Open DevTools Console (F12) and run:

```javascript
// Import JSON backup to IndexedDB
const importDb = async (jsonData) => {
  const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

  // Delete existing database
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('HardwareStoreLocalDB');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // Recreate database and import data
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('HardwareStoreLocalDB', 3);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  for (const tableName of Object.keys(data)) {
    const transaction = db.transaction(tableName, 'readwrite');
    const objectStore = transaction.objectStore(tableName);

    for (const record of data[tableName]) {
      await new Promise((resolve, reject) => {
        const request = objectStore.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  console.log('Import completed successfully!');
  location.reload(); // Refresh to load imported data
};

// Paste your backup JSON here or load from file
const backupData = { /* PASTE BACKUP JSON HERE */ };
importDb(backupData);
```

---

## Disaster Recovery Scenarios

### Scenario 1: Device Lost with Offline Data Only

**Problem**: Device was offline for days, no sync to cloud occurred.

**Solution**:
1. If you have a manual backup JSON (see export above), import it on a new device
2. If no backup exists, data is **permanently lost** (critical: ensure regular syncing)
3. After recovery, force immediate sync to push data to Supabase

### Scenario 2: Browser Storage Cleared

**Problem**: User cleared browser data/cache.

**Solution**:
1. Check if data was synced to Supabase (most recent sync timestamp in Sync Center)
2. If synced, data will automatically pull from cloud on next login
3. If not synced, restore from manual backup JSON if available

### Scenario 3: Database Corruption

**Problem**: IndexedDB becomes corrupted/unreadable.

**Solution**:
1. Clear IndexedDB in DevTools: Application → IndexedDB → HardwareStoreLocalDB → Delete database
2. Refresh page (will re-seed with default catalogue)
3. Import from backup JSON if available
4. Sync with Supabase to restore cloud data

---

## Recommended Backup Schedule

### Daily (Manual)
- Before closing shop each day, export local backup JSON
- Save to USB drive or cloud storage (Google Drive, Dropbox)

### Weekly (Manual)
- Verify backup JSON files are valid (open and check structure)
- Test restore process on a secondary device

### Automatic (Cloud)
- Supabase provides automatic cloud backup
- Ensure sync happens at least once per day
- Monitor Sync Center for failed/conflicted items

---

## Best Practices

1. **Sync Before Closing**: Always ensure the app is online and synced before closing for the day
2. **Export Weekly**: Create manual JSON backups weekly as a safety net
3. **Monitor Sync Status**: Check the Sync Center (top-right badge) for pending/failed items
4. **Test Recovery**: Practice restore process quarterly to ensure backups work
5. **Multiple Locations**: Store backup JSONs in multiple locations (USB + cloud)

---

## Contact & Support

If you encounter data loss issues:
1. Check Supabase dashboard for cloud backup availability
2. Review sync queue for pending operations
3. Contact technical support with backup JSON files if available

**Store Contact**: sales@beckyshardware.co.ke | +254 712 345 678
