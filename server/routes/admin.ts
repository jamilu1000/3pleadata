import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// System overview stats
router.get('/overview', (req, res) => {
  const users = db.getUsers();
  const txns = db.getTransactions(10000);
  const providers = db.getProviders();
  const integrity = db.verifyLedgerIntegrity();

  const successfulTxns = txns.filter(t => t.status === 'SUCCESSFUL');
  const grossVolume = successfulTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = successfulTxns.reduce((sum, t) => sum + t.fee, 0);
  const totalDiscounts = successfulTxns.reduce((sum, t) => sum + t.discount, 0);

  // Volume by service category
  const serviceBreakdown: Record<string, { count: number; volume: number }> = {};
  for (const t of successfulTxns) {
    if (!serviceBreakdown[t.serviceType]) {
      serviceBreakdown[t.serviceType] = { count: 0, volume: 0 };
    }
    serviceBreakdown[t.serviceType].count += 1;
    serviceBreakdown[t.serviceType].volume += t.amount;
  }

  res.json({
    metrics: {
      totalUsers: users.length,
      activeRetailers: users.filter(u => u.role === 'retailer' || u.role === 'agent').length,
      totalTransactions: txns.length,
      successfulCount: successfulTxns.length,
      failedCount: txns.filter(t => t.status === 'FAILED').length,
      grossVolume,
      platformFeeRevenue: totalFees,
      discountsGiven: totalDiscounts,
      activeProviders: providers.filter(p => p.status === 'active').length,
      ledgerBalanced: integrity.isBalanced,
      ledgerDebits: integrity.totalDebits,
      ledgerCredits: integrity.totalCredits,
    },
    serviceBreakdown,
    recentTransactions: txns.slice(0, 10),
    recentAuditLogs: db.getAuditLogs(10)
  });
});

// Users management
router.get('/users', (req, res) => {
  const role = req.query.role as string;
  const status = req.query.status as string;
  const search = (req.query.search as string || '').toLowerCase();

  let users = db.getUsers().map(({ passwordHash, pinHash, ...safeUser }) => safeUser);

  if (role && role !== 'ALL') {
    users = users.filter(u => u.role === role);
  }

  if (status && status !== 'ALL') {
    users = users.filter(u => u.status === status);
  }

  if (search) {
    users = users.filter(u =>
      u.fullName.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.phone.toLowerCase().includes(search)
    );
  }

  // Attach user's wallet balances
  const usersWithWallets = users.map(u => {
    const wlt = db.getWalletByUserId(u.id);
    const comm = db.getRetailerCommissionWallet(u.id);
    return {
      ...u,
      walletBalance: wlt ? wlt.balance : 0,
      commissionBalance: comm ? comm.balance : 0
    };
  });

  res.json({ users: usersWithWallets });
});

// Update user role or status
router.patch('/users/:id', (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  if (role) db.updateUserRole(id, role);
  if (status) db.updateUserStatus(id, status);

  const updated = db.getUserById(id);
  if (!updated) return res.status(404).json({ error: 'User not found' });

  db.addAuditLog({
    actorId: 'admin_session',
    actorName: 'Super Administrator',
    action: 'USER_MODIFIED',
    resource: updated.fullName,
    details: `Updated user account. New Role: ${updated.role}, New Status: ${updated.status}`,
  });

  const { passwordHash, pinHash, ...safeUser } = updated;
  res.json({ success: true, user: safeUser });
});

// Ledger audit & verification
router.get('/ledger', (req, res) => {
  const integrity = db.verifyLedgerIntegrity();
  const entries = db.getLedgerEntries(100);
  const wallets = db.getWallets();

  res.json({
    integrity,
    wallets,
    entries
  });
});

// Pricing adjustments
router.post('/pricing/airtime', (req, res) => {
  const { id, customerDiscount, retailerDiscount } = req.body;
  const updated = db.updateAirtimeDiscount(id, parseFloat(customerDiscount), parseFloat(retailerDiscount));
  res.json({ success: true, updated });
});

router.post('/pricing/data', (req, res) => {
  const { id, customerPrice, retailerPrice } = req.body;
  const updated = db.updateDataPlanPrice(id, parseFloat(customerPrice), parseFloat(retailerPrice));
  res.json({ success: true, updated });
});

// Property approval moderation
router.patch('/estates/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'APPROVED' | 'REJECTED'

  const prop = db.updatePropertyApproval(id, status);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  db.addAuditLog({
    actorId: 'admin_session',
    actorName: 'Super Administrator',
    action: 'PROPERTY_MODERATED',
    resource: prop.title,
    details: `Property status set to ${status}.`,
  });

  res.json({ success: true, property: prop });
});

// Audit logs
router.get('/audit-logs', (req, res) => {
  res.json({ logs: db.getAuditLogs(100) });
});

// Transaction reversal / refund approval
router.post('/transactions/refund', (req, res) => {
  const { reference, reason } = req.body;
  const txn = db.getTransactionByRef(reference);

  if (!txn) return res.status(404).json({ error: 'Transaction not found.' });
  if (txn.status === 'REFUNDED' || txn.status === 'REVERSED') {
    return res.status(400).json({ error: 'Transaction is already reversed or refunded.' });
  }

  const wallet = db.getWalletByUserId(txn.userId);
  if (!wallet) return res.status(404).json({ error: 'Customer wallet not found for refund credit.' });

  const refundRef = `3PA-REV-${Date.now()}`;
  const now = new Date().toISOString();

  // Reverse journal: Debit Provider Escrow, Credit Customer Wallet
  const ledgerResult = db.executeDoubleEntryTransaction({
    reference: refundRef,
    description: `Refund/Reversal for ${txn.reference}: ${reason || 'Customer refund approved by Super Admin'}`,
    entries: [
      { accountId: 'wlt_sys_escrow', type: 'DEBIT', amount: txn.netAmount },
      { accountId: wallet.id, userId: txn.userId, type: 'CREDIT', amount: txn.netAmount }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  db.updateTransactionStatus(reference, 'REFUNDED');

  db.addAuditLog({
    actorId: 'admin_session',
    actorName: 'Super Administrator',
    action: 'TRANSACTION_REFUNDED',
    resource: txn.reference,
    details: `Authorized reversal of ₦${txn.netAmount.toLocaleString()} to ${txn.userName} (${wallet.id}). Reason: ${reason || 'Approved by Admin'}.`,
  });

  res.json({
    success: true,
    message: `Transaction ${reference} reversed! ₦${txn.netAmount.toLocaleString()} credited back to ${txn.userName}'s wallet.`,
    refundReference: refundRef,
    newBalance: wallet.balance
  });
});

export default router;
