import { Router } from 'express';
import crypto from 'crypto';
import { db, ResellerApiKey, Transaction } from '../db.js';

const router = Router();

// Retailer pricing & margins matrix
router.get('/pricing-matrix', (req, res) => {
  const airtime = db.getAirtimeProducts().map(a => ({
    type: 'AIRTIME',
    name: a.name,
    network: a.network,
    customerDiscount: `${a.customerDiscountPercent}%`,
    retailerDiscount: `${a.retailerDiscountPercent}%`,
    retailerMargin: `${(a.retailerDiscountPercent - a.customerDiscountPercent).toFixed(1)}%`,
    example1000Profit: `₦${Math.round(1000 * ((a.retailerDiscountPercent - a.customerDiscountPercent) / 100))}`
  }));

  const data = db.getDataPlans().map(d => ({
    id: d.id,
    type: 'DATA',
    name: d.name,
    network: d.network,
    providerCost: d.providerCost,
    retailerPrice: d.retailerPrice,
    customerPrice: d.customerPrice,
    retailerProfit: d.customerPrice - d.retailerPrice,
    profitMarginPercent: `${(((d.customerPrice - d.retailerPrice) / d.retailerPrice) * 100).toFixed(1)}%`
  }));

  res.json({
    airtime,
    data
  });
});

// Bulk VTU transaction processing (for retailers/agents processing corporate or customer batches)
router.post('/bulk-vtu', (req, res) => {
  const { userId = 'usr_retailer_1', items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please supply a list of recharge orders.' });
  }

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wallet = db.getWalletByUserId(userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  // Calculate total batch cost
  let totalBatchCost = 0;
  const processedItems: Array<{
    network: string;
    phone: string;
    amount: number;
    cost: number;
    status: 'SUCCESS' | 'FAILED';
    reference?: string;
    error?: string;
  }> = [];

  for (const item of items) {
    const amount = parseFloat(item.amount);
    const network = (item.network || 'MTN').toUpperCase();
    const phone = item.phone ? item.phone.trim() : '';

    if (!phone || isNaN(amount) || amount < 50) {
      processedItems.push({
        network,
        phone,
        amount: isNaN(amount) ? 0 : amount,
        cost: 0,
        status: 'FAILED',
        error: 'Invalid phone or amount below ₦50'
      });
      continue;
    }

    const prod = db.getAirtimeProducts().find(p => p.network === network);
    const discount = prod ? prod.retailerDiscountPercent : 4.5;
    const cost = Math.round((amount * (1 - discount / 100)) * 100) / 100;

    totalBatchCost += cost;
    processedItems.push({
      network,
      phone,
      amount,
      cost,
      status: 'SUCCESS',
      reference: `3PA-BLK-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
    });
  }

  const validItems = processedItems.filter(i => i.status === 'SUCCESS');

  if (validItems.length === 0) {
    return res.status(400).json({ error: 'No valid recharge items found in batch.', items: processedItems });
  }

  if (wallet.balance < totalBatchCost) {
    return res.status(400).json({
      error: `Insufficient balance for entire batch. Total needed: ₦${totalBatchCost.toLocaleString()}, Available: ₦${wallet.balance.toLocaleString()}`
    });
  }

  const batchRef = `3PA-BATCH-${Date.now()}`;
  const now = new Date().toISOString();

  // Deduct from wallet using double-entry ledger
  const ledgerResult = db.executeDoubleEntryTransaction({
    reference: batchRef,
    description: `Bulk VTU execution: ${validItems.length} lines processed`,
    entries: [
      { accountId: wallet.id, userId, type: 'DEBIT', amount: totalBatchCost },
      { accountId: 'wlt_sys_escrow', type: 'CREDIT', amount: totalBatchCost }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  // Create transactions for each success
  for (const item of validItems) {
    const txn: Transaction = {
      id: `txn_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      reference: item.reference!,
      userId,
      userName: user.fullName,
      serviceType: 'AIRTIME',
      providerId: 'prov_pairgate',
      providerName: 'Pairgate Developers API',
      amount: item.amount,
      fee: 0,
      discount: item.amount - item.cost,
      netAmount: item.cost,
      status: 'SUCCESSFUL',
      metadata: {
        batchReference: batchRef,
        network: item.network,
        phone: item.phone,
        type: 'BULK_DISPATCH'
      },
      providerReference: `pg_bulk_${crypto.randomBytes(4).toString('hex')}`,
      createdAt: now,
      updatedAt: now,
    };
    db.addTransaction(txn);
  }

  db.addAuditLog({
    actorId: userId,
    actorName: user.fullName,
    action: 'BULK_VTU_EXECUTED',
    resource: 'Retailer Portal',
    details: `Processed batch of ${validItems.length} recharge lines total cost ₦${totalBatchCost.toLocaleString()}. Batch ref: ${batchRef}`,
  });

  res.json({
    success: true,
    message: `Batch complete: ${validItems.length} recharges dispatched successfully!`,
    totalDebited: totalBatchCost,
    batchReference: batchRef,
    results: processedItems,
    newBalance: wallet.balance
  });
});

// Reseller API keys
router.get('/api-keys', (req, res) => {
  const userId = req.query.userId as string || 'usr_retailer_1';
  const keys = db.getResellerApiKeys().filter(k => k.userId === userId);
  res.json({ keys });
});

router.post('/api-keys/generate', (req, res) => {
  const { userId = 'usr_retailer_1', keyName, environment = 'LIVE' } = req.body;

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const rawSecret = `3pa_sec_${environment.toLowerCase()}_${crypto.randomBytes(16).toString('hex')}`;
  const secretKeyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
  const publicKey = `3pa_pub_${environment.toLowerCase()}_${crypto.randomBytes(10).toString('hex')}`;
  const maskedSecret = `${rawSecret.slice(0, 10)}••••••••${rawSecret.slice(-4)}`;

  const newKey: ResellerApiKey = {
    id: `key_${Date.now()}`,
    userId,
    keyName: keyName || `${environment} Reseller API Key`,
    publicKey,
    secretKeyHash,
    maskedSecret,
    environment,
    rateLimitPerMin: 120,
    dailyUsageCount: 0,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  db.addResellerApiKey(newKey);

  db.addAuditLog({
    actorId: userId,
    actorName: user.fullName,
    action: 'API_KEY_GENERATED',
    resource: 'Developer Credentials',
    details: `Generated new ${environment} API key "${newKey.keyName}". Public key: ${publicKey}`,
  });

  // Return raw secret once for initial display
  res.status(201).json({
    success: true,
    message: 'API Key generated! Store the secret key securely; it will not be displayed again.',
    apiKey: newKey,
    rawSecretKey: rawSecret
  });
});

export default router;
