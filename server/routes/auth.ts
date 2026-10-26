import { Router } from 'express';
import crypto from 'crypto';
import { db, User } from '../db.js';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`3plea-salt-${password}`).digest('hex');
}

// Current session user / demo user helper
router.get('/me', (req, res) => {
  const userId = (req.query.userId as string) || 'usr_customer_1';
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const wallet = db.getWalletByUserId(user.id);
  const commWallet = db.getRetailerCommissionWallet(user.id);

  const { passwordHash, pinHash, ...safeUser } = user;
  res.json({
    user: safeUser,
    wallet: wallet ? { balance: wallet.balance, locked: wallet.lockedBalance, currency: wallet.currency } : { balance: 0, locked: 0, currency: 'NGN' },
    commissionWallet: commWallet ? { balance: commWallet.balance, currency: commWallet.currency } : null
  });
});

// List demo users for quick role testing
router.get('/demo-users', (req, res) => {
  const users = db.getUsers().map(({ passwordHash, pinHash, ...safeUser }) => safeUser);
  res.json({ users });
});

// Switch active user (for rapid testing of all roles)
router.post('/switch-user', (req, res) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const wallet = db.getWalletByUserId(user.id);
  const commWallet = db.getRetailerCommissionWallet(user.id);
  const { passwordHash, pinHash, ...safeUser } = user;

  res.json({
    success: true,
    user: safeUser,
    wallet: wallet ? { balance: wallet.balance, locked: wallet.lockedBalance, currency: wallet.currency } : null,
    commissionWallet: commWallet ? { balance: commWallet.balance, currency: commWallet.currency } : null
  });
});

// Register
router.post('/register', (req, res) => {
  const { fullName, email, phone, password, role = 'customer', businessName, address } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const now = new Date().toISOString();
  const userId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const newUser: User = {
    id: userId,
    email,
    phone,
    fullName,
    role: ['customer', 'retailer', 'agent'].includes(role) ? role : 'customer',
    kycTier: 1,
    status: 'active',
    passwordHash: hashPassword(password),
    businessName,
    address,
    createdAt: now,
    updatedAt: now,
  };

  db.getUsers().push(newUser);

  // Create initial wallet
  const newWallet = {
    id: `wlt_${userId}`,
    userId,
    type: 'CUSTOMER_WALLET' as const,
    balance: 5000.00, // Welcome signup bonus credit for immediate interactive testing!
    currency: 'NGN' as const,
    lockedBalance: 0,
    updatedAt: now,
  };
  db.getWallets().push(newWallet);

  // If retailer, create commission wallet too
  if (role === 'retailer') {
    db.getWallets().push({
      id: `wlt_comm_${userId}`,
      userId,
      type: 'RETAILER_COMMISSION' as const,
      balance: 0,
      currency: 'NGN' as const,
      lockedBalance: 0,
      updatedAt: now,
    });
  }

  // Double-entry ledger entry for welcome credit
  db.executeDoubleEntryTransaction({
    reference: `3PA-WELCOME-${Date.now()}`,
    description: 'Welcome promotion credit to new account',
    entries: [
      { accountId: 'wlt_sys_escrow', type: 'DEBIT', amount: 5000 },
      { accountId: newWallet.id, userId, type: 'CREDIT', amount: 5000 }
    ]
  });

  db.addAuditLog({
    actorId: userId,
    actorName: fullName,
    action: 'USER_REGISTERED',
    resource: 'Auth',
    details: `User registered with role ${role} and received ₦5,000 onboarding balance.`,
  });

  const { passwordHash, pinHash, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    user: safeUser,
    wallet: { balance: newWallet.balance, locked: 0, currency: 'NGN' }
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended. Please contact 3PLE A compliance team.' });
  }

  const wallet = db.getWalletByUserId(user.id);
  const commWallet = db.getRetailerCommissionWallet(user.id);
  const { passwordHash, pinHash, ...safeUser } = user;

  res.json({
    success: true,
    token: `jwt_3plea_${user.id}_${Date.now()}`,
    user: safeUser,
    wallet: wallet ? { balance: wallet.balance, locked: wallet.lockedBalance, currency: wallet.currency } : null,
    commissionWallet: commWallet ? { balance: commWallet.balance, currency: commWallet.currency } : null
  });
});

export default router;
