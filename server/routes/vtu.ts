import { Router } from 'express';
import crypto from 'crypto';
import { db, Transaction } from '../db.js';

const router = Router();

// 1. Airtime Catalog
router.get('/airtime/products', (req, res) => {
  res.json({ products: db.getAirtimeProducts() });
});

// Combined Catalog Products (Airtime & Data)
router.get('/products', (req, res) => {
  res.json({
    products: db.getAirtimeProducts(),
    airtime: db.getAirtimeProducts(),
    dataPlans: db.getDataPlans()
  });
});

// Airtime Purchase
router.post('/airtime/purchase', (req, res) => {
  const { userId = 'usr_customer_1', network, phone, amount } = req.body;
  const numAmount = parseFloat(amount);

  if (!network || !phone || isNaN(numAmount) || numAmount < 50) {
    return res.status(400).json({ error: 'Valid network, Nigerian phone number, and minimum amount (₦50) are required.' });
  }

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wallet = db.getWalletByUserId(userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const product = db.getAirtimeProducts().find(p => p.network === network);
  const isRetailer = user.role === 'retailer' || user.role === 'agent' || user.role === 'reseller';
  const discountPercent = product ? (isRetailer ? product.retailerDiscountPercent : product.customerDiscountPercent) : 2.0;

  const discountAmount = Math.round((numAmount * (discountPercent / 100)) * 100) / 100;
  const netCharge = Math.round((numAmount - discountAmount) * 100) / 100;

  if (wallet.balance < netCharge) {
    return res.status(400).json({ error: `Insufficient wallet balance. Total cost: ₦${netCharge.toLocaleString()}, Balance: ₦${wallet.balance.toLocaleString()}` });
  }

  const provider = db.getProviders().find(p => p.supportedServices.includes('AIRTIME') && p.status === 'active') || db.getProviders()[0];
  const reference = `3PA-AIR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  // Ledger Journal:
  // Debit Customer Wallet netCharge
  // Debit Platform Revenue discountAmount (promo subsidy)
  // Credit Provider Escrow numAmount (supplier cost)
  const ledgerResult = db.executeDoubleEntryTransaction({
    reference,
    description: `${network} Airtime recharge for ${phone}`,
    entries: [
      { accountId: wallet.id, userId, type: 'DEBIT', amount: netCharge },
      { accountId: 'wlt_sys_escrow', type: 'CREDIT', amount: netCharge }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  const txn: Transaction = {
    id: `txn_${Date.now()}`,
    reference,
    userId,
    userName: user.fullName,
    serviceType: 'AIRTIME',
    providerId: provider.id,
    providerName: provider.name,
    amount: numAmount,
    fee: 0,
    discount: discountAmount,
    netAmount: netCharge,
    status: 'SUCCESSFUL',
    metadata: {
      network,
      phone,
      discountPercent,
      channel: 'VTU Direct API Delivery'
    },
    providerReference: `pg_air_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    createdAt: now,
    updatedAt: now,
  };

  db.addTransaction(txn);

  res.json({
    success: true,
    message: `₦${numAmount.toLocaleString()} ${network} airtime successfully delivered to ${phone}`,
    transaction: txn,
    newBalance: wallet.balance
  });
});

// 2. Data Plans Catalog
router.get('/data/plans', (req, res) => {
  const network = req.query.network as string;
  let plans = db.getDataPlans().filter(p => p.status === 'active');
  if (network) {
    plans = plans.filter(p => p.network === network);
  }
  res.json({ plans });
});

// Data Purchase
router.post('/data/purchase', (req, res) => {
  const { userId = 'usr_customer_1', planId, phone } = req.body;

  if (!planId || !phone) {
    return res.status(400).json({ error: 'Plan selection and valid phone number are required.' });
  }

  const plan = db.getDataPlans().find(p => p.id === planId);
  if (!plan) return res.status(404).json({ error: 'Data plan not found or currently unavailable.' });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wallet = db.getWalletByUserId(userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const isRetailer = user.role === 'retailer' || user.role === 'agent' || user.role === 'reseller';
  const price = isRetailer ? plan.retailerPrice : plan.customerPrice;

  if (wallet.balance < price) {
    return res.status(400).json({ error: `Insufficient wallet balance. Plan price: ₦${price.toLocaleString()}, Balance: ₦${wallet.balance.toLocaleString()}` });
  }

  const provider = db.getProviders().find(p => p.supportedServices.includes('DATA') && p.status === 'active') || db.getProviders()[0];
  const reference = `3PA-DAT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  const ledgerResult = db.executeDoubleEntryTransaction({
    reference,
    description: `${plan.name} bundle for ${phone}`,
    entries: [
      { accountId: wallet.id, userId, type: 'DEBIT', amount: price },
      { accountId: 'wlt_sys_escrow', type: 'CREDIT', amount: price }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  const txn: Transaction = {
    id: `txn_${Date.now()}`,
    reference,
    userId,
    userName: user.fullName,
    serviceType: 'DATA',
    providerId: provider.id,
    providerName: provider.name,
    amount: price,
    fee: 0,
    discount: plan.customerPrice - price,
    netAmount: price,
    status: 'SUCCESSFUL',
    metadata: {
      planName: plan.name,
      network: plan.network,
      sizeMb: plan.sizeMb,
      phone,
      validity: plan.validity
    },
    providerReference: `dat_ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    createdAt: now,
    updatedAt: now,
  };

  db.addTransaction(txn);

  res.json({
    success: true,
    message: `${plan.name} successfully activated for ${phone}!`,
    transaction: txn,
    newBalance: wallet.balance
  });
});

// 3. Electricity DisCos & Validation
router.get('/electricity/discos', (req, res) => {
  res.json({ discos: db.getElectricityDisCos().filter(d => d.status === 'active') });
});

// Validate Meter Number (lookup customer profile)
router.post('/electricity/validate-meter', (req, res) => {
  const { discoCode, meterNumber, meterType = 'PREPAID' } = req.body;

  if (!discoCode || !meterNumber) {
    return res.status(400).json({ error: 'DisCo code and meter number are required.' });
  }

  // Realistic mock lookup response for Nigerian DisCos
  const cleanMeter = meterNumber.replace(/\D/g, '');
  if (cleanMeter.length < 9) {
    return res.status(400).json({ error: 'Invalid meter number. Must be 9 to 13 digits.' });
  }

  const sampleNames = [
    'Alhaji Garba Muhammad Bello',
    'Dr. Fatima Al-Mansur',
    'Engr. Kabiru Sani Shehu',
    'Hajiya Zainab Danladi'
  ];
  const sampleAddresses = [
    'No. 14 Karkasara Road, Tarauni, Kano State',
    'Plot 88 Bompai GRA, Nassarawa, Kano State',
    'Suite 4 Kano Trade Fair Complex, Zoo Road, Kano',
    'House 22 Gidan Murtala Housing Estate, Kano'
  ];

  const index = Math.abs(parseInt(cleanMeter.slice(-2), 10) || 0) % sampleNames.length;

  res.json({
    isValid: true,
    discoCode,
    meterNumber: cleanMeter,
    meterType,
    customerName: sampleNames[index],
    customerAddress: sampleAddresses[index],
    tariffCode: 'R2-Residential Single Phase',
    minimumPurchase: 1000
  });
});

// Purchase Electricity Token / Postpaid Payment
router.post('/electricity/pay', (req, res) => {
  const { userId = 'usr_customer_1', discoCode, meterNumber, meterType = 'PREPAID', customerName, amount, phone } = req.body;
  const numAmount = parseFloat(amount);

  if (!discoCode || !meterNumber || isNaN(numAmount) || numAmount < 1000) {
    return res.status(400).json({ error: 'Minimum electricity purchase is ₦1,000.' });
  }

  const disco = db.getElectricityDisCos().find(d => d.code === discoCode);
  if (!disco) return res.status(404).json({ error: 'Electricity distribution company not found.' });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wallet = db.getWalletByUserId(userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const fee = disco.fee || 100;
  const totalCharge = numAmount + fee;

  if (wallet.balance < totalCharge) {
    return res.status(400).json({ error: `Insufficient balance. Total charge with ₦${fee} service fee is ₦${totalCharge.toLocaleString()}. Available: ₦${wallet.balance.toLocaleString()}` });
  }

  const provider = db.getProviders().find(p => p.supportedServices.includes('ELECTRICITY') && p.status === 'active') || db.getProviders()[0];
  const reference = `3PA-POW-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  // Generate 20-digit STS Standard Token for Prepaid
  const token = meterType === 'PREPAID'
    ? `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
    : undefined;

  const unitsKwh = Math.round((numAmount / 68.5) * 10) / 10; // ~₦68.5/kWh tariff

  const ledgerResult = db.executeDoubleEntryTransaction({
    reference,
    description: `${disco.shortName} ${meterType} bill for ${meterNumber}`,
    entries: [
      { accountId: wallet.id, userId, type: 'DEBIT', amount: totalCharge },
      { accountId: 'wlt_sys_escrow', type: 'CREDIT', amount: totalCharge }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  const txn: Transaction = {
    id: `txn_${Date.now()}`,
    reference,
    userId,
    userName: user.fullName,
    serviceType: 'ELECTRICITY',
    providerId: provider.id,
    providerName: provider.name,
    amount: numAmount,
    fee,
    discount: 0,
    netAmount: totalCharge,
    status: 'SUCCESSFUL',
    metadata: {
      disco: disco.name,
      discoCode,
      meterNumber,
      meterType,
      customerName: customerName || 'Valued Consumer',
      generatedToken: token,
      unitsKwh,
      phone
    },
    providerReference: `elec_ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    createdAt: now,
    updatedAt: now,
  };

  db.addTransaction(txn);

  res.json({
    success: true,
    message: `${disco.shortName} payment successful!`,
    token,
    unitsKwh,
    transaction: txn,
    newBalance: wallet.balance
  });
});

// 4. Cable TV Catalog & Purchase
router.get('/cable/bouquets', (req, res) => {
  const provider = req.query.provider as string;
  let bouquets = db.getCableBouquets().filter(b => b.status === 'active');
  if (provider) {
    bouquets = bouquets.filter(b => b.provider === provider);
  }
  res.json({ bouquets });
});

router.post('/cable/validate-smartcard', (req, res) => {
  const { provider, smartcardNumber } = req.body;
  if (!smartcardNumber || smartcardNumber.length < 8) {
    return res.status(400).json({ error: 'Valid smartcard / IUC number required (min 8 digits).' });
  }

  res.json({
    isValid: true,
    provider,
    smartcardNumber,
    customerName: 'Mallam Dahiru Idris',
    currentBouquet: 'DStv Yanga',
    dueDate: '2026-11-15'
  });
});

router.post('/cable/pay', (req, res) => {
  const { userId = 'usr_customer_1', bouquetId, smartcardNumber, customerName, phone } = req.body;

  const bouquet = db.getCableBouquets().find(b => b.id === bouquetId);
  if (!bouquet) return res.status(404).json({ error: 'Bouquet not found.' });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wallet = db.getWalletByUserId(userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const totalCharge = bouquet.customerPrice + (bouquet.fee || 50);

  if (wallet.balance < totalCharge) {
    return res.status(400).json({ error: `Insufficient wallet balance. Total cost: ₦${totalCharge.toLocaleString()}, Balance: ₦${wallet.balance.toLocaleString()}` });
  }

  const provider = db.getProviders().find(p => p.supportedServices.includes('CABLE_TV') && p.status === 'active') || db.getProviders()[0];
  const reference = `3PA-CAB-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  const ledgerResult = db.executeDoubleEntryTransaction({
    reference,
    description: `${bouquet.provider} ${bouquet.name} for IUC ${smartcardNumber}`,
    entries: [
      { accountId: wallet.id, userId, type: 'DEBIT', amount: totalCharge },
      { accountId: 'wlt_sys_escrow', type: 'CREDIT', amount: totalCharge }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  const txn: Transaction = {
    id: `txn_${Date.now()}`,
    reference,
    userId,
    userName: user.fullName,
    serviceType: 'CABLE_TV',
    providerId: provider.id,
    providerName: provider.name,
    amount: bouquet.customerPrice,
    fee: bouquet.fee || 50,
    discount: 0,
    netAmount: totalCharge,
    status: 'SUCCESSFUL',
    metadata: {
      provider: bouquet.provider,
      bouquetName: bouquet.name,
      smartcardNumber,
      customerName: customerName || 'Mallam Dahiru Idris',
      phone
    },
    providerReference: `cab_ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    createdAt: now,
    updatedAt: now,
  };

  db.addTransaction(txn);

  res.json({
    success: true,
    message: `${bouquet.name} subscription renewed successfully!`,
    transaction: txn,
    newBalance: wallet.balance
  });
});

export default router;
