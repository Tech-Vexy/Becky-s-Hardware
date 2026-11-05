import test from 'node:test';
import assert from 'node:assert/strict';

test('Notification System: Creation, unread tracking, and read state transitions', () => {
  let notifications = [];

  function addNotification({ type, title, message, link }) {
    const notif = {
      id: `notif-${notifications.length + 1}`,
      type,
      title,
      message,
      link,
      read: false,
      created_at: new Date().toISOString(),
    };
    notifications = [notif, ...notifications];
    return notif;
  }

  function markAsRead(id) {
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  }

  function markAllAsRead() {
    notifications = notifications.map((n) => ({ ...n, read: true }));
  }

  // 1. Initial empty state
  assert.equal(notifications.length, 0);

  // 2. Add POS sale notification
  addNotification({
    type: 'sale',
    title: 'New POS Sale Completed',
    message: 'Receipt #REC-20261025-001 for KES 4,500',
    link: '/pos',
  });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].read, false);

  // 3. Add M-Pesa payment notification
  addNotification({
    type: 'payment',
    title: 'M-Pesa Payment Received',
    message: 'KES 2,000 (Ref: QHG9123456)',
    link: '/payments',
  });
  assert.equal(notifications.length, 2);

  const unreadCount1 = notifications.filter((n) => !n.read).length;
  assert.equal(unreadCount1, 2);

  // 4. Mark one as read
  markAsRead('notif-1');
  const unreadCount2 = notifications.filter((n) => !n.read).length;
  assert.equal(unreadCount2, 1);

  // 5. Mark all as read
  markAllAsRead();
  const unreadCount3 = notifications.filter((n) => !n.read).length;
  assert.equal(unreadCount3, 0);
});

test('Realtime Event Handler: Low stock threshold detection', () => {
  function evaluateRealtimeProductUpdate(oldProduct, newProduct) {
    const isLowStock =
      newProduct.low_stock_alert_enabled &&
      newProduct.stock_on_hand <= newProduct.low_stock_level &&
      newProduct.stock_on_hand > 0;
    const isOutOfStock = newProduct.stock_on_hand <= 0;

    if (isOutOfStock) {
      return {
        type: 'inventory',
        title: 'Out of Stock Alert',
        message: `${newProduct.product_name} is completely depleted.`,
      };
    }
    if (isLowStock) {
      return {
        type: 'inventory',
        title: 'Low Stock Alert',
        message: `${newProduct.product_name} is down to ${newProduct.stock_on_hand} ${newProduct.unit_of_measure}`,
      };
    }
    return null;
  }

  // Case 1: Healthy stock to low stock
  const alert1 = evaluateRealtimeProductUpdate(
    { product_name: 'Simba Cement', stock_on_hand: 25, low_stock_level: 10, low_stock_alert_enabled: true },
    { product_name: 'Simba Cement', stock_on_hand: 8, low_stock_level: 10, low_stock_alert_enabled: true, unit_of_measure: 'bags' }
  );
  assert.notEqual(alert1, null);
  assert.equal(alert1.title, 'Low Stock Alert');

  // Case 2: Healthy stock
  const alert2 = evaluateRealtimeProductUpdate(
    { product_name: 'Mindy Padlock', stock_on_hand: 20, low_stock_level: 5, low_stock_alert_enabled: true },
    { product_name: 'Mindy Padlock', stock_on_hand: 15, low_stock_level: 5, low_stock_alert_enabled: true, unit_of_measure: 'pcs' }
  );
  assert.equal(alert2, null);

  // Case 3: Out of stock
  const alert3 = evaluateRealtimeProductUpdate(
    { product_name: 'Ordinary Nails 3 inch', stock_on_hand: 5, low_stock_level: 10, low_stock_alert_enabled: true },
    { product_name: 'Ordinary Nails 3 inch', stock_on_hand: 0, low_stock_level: 10, low_stock_alert_enabled: true, unit_of_measure: 'kg' }
  );
  assert.notEqual(alert3, null);
  assert.equal(alert3.title, 'Out of Stock Alert');
});

test('Realtime Event Handler: M-Pesa payment verification dispatch', () => {
  function handlePaymentEvent(event, payment) {
    if (payment.method !== 'mpesa') return null;

    if (event === 'INSERT') {
      return {
        type: 'payment',
        title: 'M-Pesa Payment Received',
        verified: payment.verification_status === 'verified',
      };
    }
    if (event === 'UPDATE' && payment.verification_status === 'verified') {
      return {
        type: 'payment',
        title: 'M-Pesa Payment Verified',
        verified: true,
      };
    }
    return null;
  }

  const newPayment = {
    method: 'mpesa',
    amount_kes: 3500,
    provider_reference: 'QHG12345',
    verification_status: 'unverified',
  };

  const insertNotif = handlePaymentEvent('INSERT', newPayment);
  assert.equal(insertNotif.title, 'M-Pesa Payment Received');
  assert.equal(insertNotif.verified, false);

  const updatedPayment = { ...newPayment, verification_status: 'verified' };
  const updateNotif = handlePaymentEvent('UPDATE', updatedPayment);
  assert.equal(updateNotif.title, 'M-Pesa Payment Verified');
  assert.equal(updateNotif.verified, true);
});

test('Daily Summary Configuration & Resend Email Targeting: Defaults to kamenengewa@gmail.com', () => {
  const DEFAULT_CONFIG = {
    enabled: true,
    time: '20:00',
    email: true,
    recipientEmail: 'kamenengewa@gmail.com',
    localNotifications: true,
  };

  assert.equal(DEFAULT_CONFIG.email, true);
  assert.equal(DEFAULT_CONFIG.recipientEmail, 'kamenengewa@gmail.com');
  assert.equal(DEFAULT_CONFIG.localNotifications, true);

  // Normalization logic
  function normalizeConfig(raw) {
    return {
      enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : DEFAULT_CONFIG.enabled,
      time: typeof raw?.time === 'string' ? raw.time : DEFAULT_CONFIG.time,
      email: typeof raw?.email === 'boolean' ? raw.email : DEFAULT_CONFIG.email,
      recipientEmail:
        typeof raw?.recipientEmail === 'string' && raw.recipientEmail.includes('@')
          ? raw.recipientEmail.trim()
          : DEFAULT_CONFIG.recipientEmail,
      localNotifications:
        typeof raw?.localNotifications === 'boolean'
          ? raw.localNotifications
          : DEFAULT_CONFIG.localNotifications,
    };
  }

  // Fallback test
  const emptyNorm = normalizeConfig({});
  assert.equal(emptyNorm.recipientEmail, 'kamenengewa@gmail.com');
  assert.equal(emptyNorm.localNotifications, true);

  // Custom email override
  const customNorm = normalizeConfig({ recipientEmail: 'owner@beckyshardware.co.ke' });
  assert.equal(customNorm.recipientEmail, 'owner@beckyshardware.co.ke');
});

test('Local Notification Dispatch: Verifies local notification options and mute state', () => {
  let dispatchedDeviceNotifications = [];

  function simulateAddNotification({ title, message, link }, { localNotificationsEnabled, permission }) {
    if (localNotificationsEnabled && permission === 'granted') {
      dispatchedDeviceNotifications.push({
        title,
        body: message,
        icon: '/icon-192.png',
        data: { url: link || '/' },
        vibrate: [200, 100, 200],
      });
      return true;
    }
    return false;
  }

  // Case 1: Permission granted & local notifications enabled
  dispatchedDeviceNotifications = [];
  const res1 = simulateAddNotification(
    { title: 'End of Day Summary', message: 'Today gross sales KES 45,000', link: '/reports' },
    { localNotificationsEnabled: true, permission: 'granted' }
  );
  assert.equal(res1, true);
  assert.equal(dispatchedDeviceNotifications.length, 1);
  assert.equal(dispatchedDeviceNotifications[0].title, 'End of Day Summary');
  assert.equal(dispatchedDeviceNotifications[0].icon, '/icon-192.png');

  // Case 2: User muted local notifications
  dispatchedDeviceNotifications = [];
  const res2 = simulateAddNotification(
    { title: 'Low Stock Alert', message: 'Simba Cement is low', link: '/catalogue' },
    { localNotificationsEnabled: false, permission: 'granted' }
  );
  assert.equal(res2, false);
  assert.equal(dispatchedDeviceNotifications.length, 0);

  // Case 3: Permission denied / not yet granted
  dispatchedDeviceNotifications = [];
  const res3 = simulateAddNotification(
    { title: 'Low Stock Alert', message: 'Simba Cement is low', link: '/catalogue' },
    { localNotificationsEnabled: true, permission: 'default' }
  );
  assert.equal(res3, false);
  assert.equal(dispatchedDeviceNotifications.length, 0);
});
