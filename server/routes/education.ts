import { Router } from 'express';
import crypto from 'crypto';
import { db, Transaction } from '../db.js';

const router = Router();

// List institutions
router.get('/institutions', (req, res) => {
  res.json({ institutions: db.getEducationInstitutions().filter(i => i.status === 'active') });
});

// Validate student invoice / matriculation number
router.post('/validate-invoice', (req, res) => {
  const { institutionCode, identifier, feeCategory } = req.body;

  if (!institutionCode || !identifier) {
    return res.status(400).json({ error: 'Institution code and Student ID / Invoice number are required.' });
  }

  const institution = db.getEducationInstitutions().find(i => i.code === institutionCode);
  if (!institution) {
    return res.status(404).json({ error: 'Educational institution not recognized.' });
  }

  // Realistic lookup response
  if (institution.category === 'EXAMINATION') {
    // WAEC, JAMB, NECO
    const prices: Record<string, number> = {
      'WAEC-SCRATCH': 3800,
      'JAMB-UTME': 6200,
      'NECO-TOKEN': 1200
    };
    const amount = prices[institution.code] || 2500;
    return res.json({
      isValid: true,
      institutionName: institution.name,
      studentName: identifier.toUpperCase(),
      feeCategory: feeCategory || institution.supportedFees[0],
      academicSession: '2026/2027 Examination Diet',
      invoiceNumber: `INV-${institution.code}-${Date.now().toString().slice(-6)}`,
      amount,
      serviceCharge: institution.accountFee || 100,
      totalPayable: amount + (institution.accountFee || 100)
    });
  }

  // Tertiary: BUK, Kano Poly, ABU
  const sampleStudents = [
    { name: 'Suleiman Abdullahi Umar', faculty: 'Faculty of Computer Science & Information Technology', regNo: 'CST/22/COM/00482', level: '300 Level' },
    { name: 'Khadija Mansur Ibrahim', faculty: 'Faculty of Clinical Sciences / Medicine', regNo: 'MED/23/MBBS/00192', level: '200 Level' },
    { name: 'Aliyu Danjuma Bello', faculty: 'Faculty of Engineering (Electrical)', regNo: 'ENG/21/ELE/00310', level: '400 Level' }
  ];

  const student = sampleStudents[Math.abs(identifier.length) % sampleStudents.length];
  const feeAmounts: Record<string, number> = {
    'Tuition / Central Registration': 78500,
    'Hostel Accommodation': 35000,
    'Acceptance Fee': 20000,
    'School Fees': 52000,
    'Undergraduate School Fees': 84000
  };

  const selectedCategory = feeCategory || institution.supportedFees[0];
  const amount = feeAmounts[selectedCategory] || 65000;
  const serviceCharge = institution.accountFee || 250;

  res.json({
    isValid: true,
    institutionName: institution.name,
    studentName: student.name,
    regNumber: identifier.toUpperCase(),
    faculty: student.faculty,
    academicSession: '2025/2026 Academic Session',
    feeCategory: selectedCategory,
    invoiceNumber: `BUK-INV-${Date.now().toString().slice(-7)}`,
    amount,
    serviceCharge,
    totalPayable: amount + serviceCharge
  });
});

// Pay school fees
router.post('/pay', (req, res) => {
  const { userId = 'usr_customer_1', institutionCode, identifier, feeCategory, studentName, invoiceNumber, amount, serviceCharge, phone } = req.body;

  const numAmount = parseFloat(amount);
  const numCharge = parseFloat(serviceCharge) || 200;
  const total = numAmount + numCharge;

  if (!institutionCode || !identifier || isNaN(total) || total <= 0) {
    return res.status(400).json({ error: 'Valid institution, student identifier, and invoice amount required.' });
  }

  const institution = db.getEducationInstitutions().find(i => i.code === institutionCode);
  if (!institution) return res.status(404).json({ error: 'Institution not found.' });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const wallet = db.getWalletByUserId(userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  if (wallet.balance < total) {
    return res.status(400).json({
      error: `Insufficient balance. Total payable is ₦${total.toLocaleString()}, Available: ₦${wallet.balance.toLocaleString()}`
    });
  }

  const provider = db.getProviders().find(p => p.supportedServices.includes('EDUCATION') && p.status === 'active') || db.getProviders()[0];
  const reference = `3PA-EDU-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const receiptNumber = `RCP-${institution.code}-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const now = new Date().toISOString();

  // Ledger Journal
  const ledgerResult = db.executeDoubleEntryTransaction({
    reference,
    description: `${institution.name} (${feeCategory}) for ${studentName || identifier}`,
    entries: [
      { accountId: wallet.id, userId, type: 'DEBIT', amount: total },
      { accountId: 'wlt_sys_escrow', type: 'CREDIT', amount: total }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  // Generate PIN if examination scratch card
  const generatedToken = institution.category === 'EXAMINATION'
    ? `PIN: ${Math.floor(100000000000 + Math.random() * 900000000000)} | Serial: ${institution.code.slice(0, 3)}-${Math.floor(10000000 + Math.random() * 90000000)}`
    : undefined;

  const txn: Transaction = {
    id: `txn_${Date.now()}`,
    reference,
    userId,
    userName: user.fullName,
    serviceType: 'EDUCATION',
    providerId: provider.id,
    providerName: provider.name,
    amount: numAmount,
    fee: numCharge,
    discount: 0,
    netAmount: total,
    status: 'SUCCESSFUL',
    metadata: {
      institutionName: institution.name,
      institutionCode,
      identifier,
      studentName: studentName || 'Student',
      feeCategory,
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      receiptNumber,
      generatedToken,
      phone
    },
    providerReference: `edu_ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    createdAt: now,
    updatedAt: now,
  };

  db.addTransaction(txn);

  db.addAuditLog({
    actorId: userId,
    actorName: user.fullName,
    action: 'EDUCATION_FEE_PAID',
    resource: 'Education Module',
    details: `Processed payment of ₦${total.toLocaleString()} for ${institution.name} receipt #${receiptNumber}. Reference: ${reference}`,
  });

  res.json({
    success: true,
    message: `Payment of ₦${total.toLocaleString()} confirmed for ${institution.name}!`,
    receiptNumber,
    generatedToken,
    transaction: txn,
    newBalance: wallet.balance
  });
});

export default router;
