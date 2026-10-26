import { Router } from 'express';
import crypto from 'crypto';
import { db, Transaction } from '../db.js';

const router = Router();

// Get wallet balance and ledger statement
router.get('/balance', (req, res) => {
  const userId = (req.query.userId as string) || 'usr_customer_1';
  const wallet = db.getWalletByUserId(userId);
  const commWallet = db.getRetailerCommissionWallet(userId);

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  res.json({
    wallet: {
      id: wallet.id,
      balance: wallet.balance,
      available: wallet.balance - wallet.lockedBalance,
      locked: wallet.lockedBalance,
      currency: wallet.currency,
      updatedAt: wallet.updatedAt
    },
    commissionWallet: commWallet ? {
      id: commWallet.id,
      balance: commWallet.balance,
      currency: commWallet.currency
    } : null
  });
});

// Get user transactions with filters & pagination
router.get('/transactions', (req, res) => {
  const userId = req.query.userId as string;
  const status = req.query.status as string;
  const serviceType = req.query.serviceType as string;
  const search = (req.query.search as string || '').toLowerCase();
  const limit = parseInt(req.query.limit as string || '50', 10);

  let txns = db.getTransactions(1000);

  if (userId) {
    txns = txns.filter(t => t.userId === userId);
  }

  if (status && status !== 'ALL') {
    txns = txns.filter(t => t.status === status);
  }

  if (serviceType && serviceType !== 'ALL') {
    txns = txns.filter(t => t.serviceType === serviceType);
  }

  if (search) {
    txns = txns.filter(t =>
      t.reference.toLowerCase().includes(search) ||
      t.providerName.toLowerCase().includes(search) ||
      (t.metadata && JSON.stringify(t.metadata).toLowerCase().includes(search))
    );
  }

  res.json({
    total: txns.length,
    transactions: txns.slice(0, limit)
  });
});

// Get single transaction by reference (for receipts)
router.get('/transactions/:reference', (req, res) => {
  const { reference } = req.params;
  const txn = db.getTransactionByRef(reference);
  if (!txn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json({ transaction: txn });
});

// Fund Wallet (Sandbox / Live Paystack / Monnify payment simulation and verification)
router.post('/fund', (req, res) => {
  const { userId = 'usr_customer_1', amount, gateway = 'PAYSTACK', paymentMethod = 'CARD' } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 100) {
    return res.status(400).json({ error: 'Minimum wallet funding amount is ₦100.' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const wallet = db.getWalletByUserId(userId);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet account not found' });
  }

  const provider = db.getProviders().find(p => p.code === gateway) || db.getProviders().find(p => p.code === 'PAYSTACK')!;
  const reference = `3PA-FND-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  // Execute double-entry ledger entry: Debit Provider Escrow, Credit Customer Wallet
  const ledgerResult = db.executeDoubleEntryTransaction({
    reference,
    description: `Wallet funding via ${provider.name} (${paymentMethod})`,
    entries: [
      { accountId: 'wlt_sys_escrow', type: 'DEBIT', amount: numAmount },
      { accountId: wallet.id, userId, type: 'CREDIT', amount: numAmount }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error || 'Ledger transaction failed' });
  }

  const txn: Transaction = {
    id: `txn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    reference,
    userId,
    userName: user.fullName,
    serviceType: 'WALLET_FUNDING',
    providerId: provider.id,
    providerName: provider.name,
    amount: numAmount,
    fee: 0,
    discount: 0,
    netAmount: numAmount,
    status: 'SUCCESSFUL',
    metadata: {
      gateway: provider.name,
      paymentMethod,
      journalId: ledgerResult.journalId,
      settlementTime: now
    },
    providerReference: `${gateway.toLowerCase()}_ref_${crypto.randomBytes(6).toString('hex')}`,
    createdAt: now,
    updatedAt: now,
  };

  db.addTransaction(txn);

  db.addAuditLog({
    actorId: userId,
    actorName: user.fullName,
    action: 'WALLET_FUNDED',
    resource: 'Wallet',
    details: `Successfully funded wallet with ₦${numAmount.toLocaleString()} via ${gateway}. Reference: ${reference}`,
  });

  res.json({
    success: true,
    message: `Wallet funded successfully with ₦${numAmount.toLocaleString()}`,
    newBalance: wallet.balance,
    transaction: txn
  });
});

// Transfer commission to main balance (for retailers/agents)
router.post('/withdraw-commission', (req, res) => {
  const { userId = 'usr_retailer_1', amount } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid amount.' });
  }

  const user = db.getUserById(userId);
  const commWallet = db.getRetailerCommissionWallet(userId);
  const mainWallet = db.getWalletByUserId(userId);

  if (!commWallet || !mainWallet) {
    return res.status(404).json({ error: 'Wallets not found for this user.' });
  }

  if (commWallet.balance < numAmount) {
    return res.status(400).json({ error: `Insufficient commission balance. Available: ₦${commWallet.balance.toLocaleString()}` });
  }

  const reference = `3PA-COMM-${Date.now()}`;
  const ledgerResult = db.executeDoubleEntryTransaction({
    reference,
    description: 'Retailer commission transferred to main working wallet',
    entries: [
      { accountId: commWallet.id, userId, type: 'DEBIT', amount: numAmount },
      { accountId: mainWallet.id, userId, type: 'CREDIT', amount: numAmount }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  const txn: Transaction = {
    id: `txn_${Date.now()}`,
    reference,
    userId,
    userName: user?.fullName || 'Retailer',
    serviceType: 'COMMISSION_WITHDRAWAL',
    providerId: 'prov_internal',
    providerName: '3PLE A Commission Vault',
    amount: numAmount,
    fee: 0,
    discount: 0,
    netAmount: numAmount,
    status: 'SUCCESSFUL',
    metadata: { transferredAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addTransaction(txn);

  res.json({
    success: true,
    message: `₦${numAmount.toLocaleString()} commission credited to main wallet!`,
    commissionBalance: commWallet.balance,
    mainBalance: mainWallet.balance,
    transaction: txn
  });
});

export default router;
