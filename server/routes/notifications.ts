import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TRANSACTION' | 'PROMO' | 'ADVISORY' | 'SECURITY';
  channels: {
    inApp: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  emailSentTo?: string;
  whatsappSentTo?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// In-memory notifications store
const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_01',
    userId: 'usr_customer_1',
    title: 'Wallet Funded Successfully (₦5,000.00)',
    message: 'Your 3PLE A DATA LIMITED stored-value wallet was credited with ₦5,000 via Monnify Card Gateway. Reference: 3PA-FND-1793022589565.',
    type: 'TRANSACTION',
    channels: { inApp: true, email: true, whatsapp: true },
    emailSentTo: 'amina.bello@gmail.com',
    whatsappSentTo: '+2348021234567',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actionUrl: 'wallet'
  },
  {
    id: 'notif_02',
    userId: 'usr_customer_1',
    title: 'KEDCO Prepaid Meter Token Generated',
    message: 'Token: 4829-1029-4820-9182-3841 (124.6 kWh) for Meter 45029184712 (Amina Bello, Nassarawa GRA). Receipt sent to Email & WhatsApp.',
    type: 'TRANSACTION',
    channels: { inApp: true, email: true, whatsapp: true },
    emailSentTo: 'amina.bello@gmail.com',
    whatsappSentTo: '+2348021234567',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actionUrl: 'utilities'
  },
  {
    id: 'notif_03',
    userId: 'usr_customer_1',
    title: 'Special Ramadan & Festive SME Data Slash!',
    message: 'MTN 1GB SME now ₦245 for 30 Days. Wholesale pricing automatically active on your account. Instant delivery in seconds.',
    type: 'PROMO',
    channels: { inApp: true, email: true, whatsapp: false },
    emailSentTo: 'amina.bello@gmail.com',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    actionUrl: 'vtu'
  },
  {
    id: 'notif_04',
    userId: 'usr_customer_1',
    title: 'Kano DisCo (KEDCO) Grid Advisory',
    message: 'Kano Transmission substation maintenance completed. All 33kV feeders in Tarauni, Nassarawa, and Bompai GRA operating normally.',
    type: 'ADVISORY',
    channels: { inApp: true, email: false, whatsapp: false },
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  }
];

// User Notification Preferences
const userPreferences: Record<string, any> = {
  usr_customer_1: {
    emailNotifications: true,
    emailAddress: 'amina.bello@gmail.com',
    emailReceipts: true,
    emailLowBalanceAlert: true,
    emailPromotions: true,
    whatsappNotifications: true,
    whatsappNumber: '+2348021234567',
    whatsappTokenDelivery: true,
    whatsappFlightAlerts: true,
    homepagePopups: true,
  }
};

// 1. Get notifications for active user
router.get('/', (req, res) => {
  const userId = (req.query.userId as string) || 'usr_customer_1';
  const list = mockNotifications.filter(n => n.userId === userId || n.userId === 'all');
  const unreadCount = list.filter(n => !n.read).length;
  res.json({
    notifications: list,
    unreadCount,
    company: '3PLE A DATA LIMITED',
    rcNumber: '9746103'
  });
});

// 2. Mark notification as read
router.post('/:id/read', (req, res) => {
  const { id } = req.params;
  const item = mockNotifications.find(n => n.id === id);
  if (item) {
    item.read = true;
  }
  res.json({ success: true, id });
});

// 3. Mark all as read
router.post('/read-all', (req, res) => {
  const userId = req.body.userId || 'usr_customer_1';
  mockNotifications.forEach(n => {
    if (n.userId === userId || n.userId === 'all') n.read = true;
  });
  res.json({ success: true });
});

// 4. Get preferences
router.get('/preferences', (req, res) => {
  const userId = (req.query.userId as string) || 'usr_customer_1';
  const prefs = userPreferences[userId] || {
    emailNotifications: true,
    emailAddress: 'amina.bello@gmail.com',
    emailReceipts: true,
    emailLowBalanceAlert: true,
    emailPromotions: true,
    whatsappNotifications: true,
    whatsappNumber: '+2348021234567',
    whatsappTokenDelivery: true,
    whatsappFlightAlerts: true,
    homepagePopups: true,
  };
  res.json({ preferences: prefs });
});

// 5. Update preferences
router.put('/preferences', (req, res) => {
  const userId = req.body.userId || 'usr_customer_1';
  userPreferences[userId] = {
    ...(userPreferences[userId] || {}),
    ...req.body.preferences
  };
  res.json({ success: true, preferences: userPreferences[userId] });
});

// 6. Test Email Dispatch Simulation
router.post('/test-email', (req, res) => {
  const { email = 'amina.bello@gmail.com', subject = '3PLE A DATA LIMITED — Transaction Receipt' } = req.body;
  const dispatchId = `eml_${Date.now()}`;
  
  const newNotif: NotificationItem = {
    id: `notif_${Date.now()}`,
    userId: req.body.userId || 'usr_customer_1',
    title: 'Test Email Notification Dispatched',
    message: `Official transaction email dispatch simulated to ${email}. Delivered with 3PLE A DATA LIMITED (RC 9746103) legal credentials.`,
    type: 'TRANSACTION',
    channels: { inApp: true, email: true, whatsapp: false },
    emailSentTo: email,
    read: false,
    createdAt: new Date().toISOString()
  };
  mockNotifications.unshift(newNotif);

  res.json({
    success: true,
    dispatchId,
    recipient: email,
    subject,
    status: 'DELIVERED',
    timestamp: new Date().toISOString(),
    preview: `From: 3PLE A DATA LIMITED <notifications@3plea.com.ng>\nTo: ${email}\nSubject: ${subject}\n\nDear Amina Bello,\nYour transaction with 3PLE A DATA LIMITED (RC: 9746103) has been verified. Ref: 3PA-TEST-${Date.now().toString().slice(-6)}. Headquarters: Karkasara Road, Tarauni, Kano State.`
  });
});

// 7. Test WhatsApp Dispatch Simulation
router.post('/test-whatsapp', (req, res) => {
  const { phone = '+2348021234567', message } = req.body;
  const dispatchId = `wa_${Date.now()}`;
  
  const defaultMsg = `🟢 *3PLE A DATA LIMITED (RC: 9746103)*\n\nSalam Amina Bello!\nYour test WhatsApp alert was successfully dispatched to ${phone}.\n\n• Service: VTU & Utilities Automated Alerts\n• Office: Karkasara Road, Tarauni, Kano\n• Status: Active & Synced\n\nThank you for choosing 3PLE A DATA LIMITED!`;

  const newNotif: NotificationItem = {
    id: `notif_${Date.now()}`,
    userId: req.body.userId || 'usr_customer_1',
    title: 'WhatsApp Alert Dispatched',
    message: `Instant WhatsApp notification sent to ${phone}. Verified gateway status: DELIVERED.`,
    type: 'TRANSACTION',
    channels: { inApp: true, email: false, whatsapp: true },
    whatsappSentTo: phone,
    read: false,
    createdAt: new Date().toISOString()
  };
  mockNotifications.unshift(newNotif);

  res.json({
    success: true,
    dispatchId,
    phone,
    status: 'DELIVERED',
    timestamp: new Date().toISOString(),
    content: message || defaultMsg,
    supportLink: `https://wa.me/2348030000001?text=${encodeURIComponent('Salam 3PLE A DATA LIMITED, I need assistance with my account.')}`
  });
});

export default router;
