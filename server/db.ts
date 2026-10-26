import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'customer' | 'retailer' | 'agent' | 'reseller' | 'finance' | 'admin' | 'superadmin';
  kycTier: 1 | 2 | 3;
  status: 'active' | 'pending' | 'suspended';
  passwordHash: string;
  pinHash?: string;
  avatarUrl?: string;
  businessName?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletAccount {
  id: string;
  userId: string;
  type: 'CUSTOMER_WALLET' | 'RETAILER_COMMISSION' | 'PLATFORM_REVENUE' | 'PROVIDER_ESCROW' | 'SETTLEMENT';
  balance: number;
  currency: 'NGN';
  lockedBalance: number;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  journalId: string;
  accountId: string;
  userId?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  reference: string;
  description: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  idempotencyKey?: string;
  userId: string;
  userName: string;
  serviceType: 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'CABLE_TV' | 'EDUCATION' | 'FLIGHT' | 'WALLET_FUNDING' | 'COMMISSION_WITHDRAWAL';
  providerId: string;
  providerName: string;
  amount: number;
  fee: number;
  discount: number;
  netAmount: number;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REVERSED' | 'REFUNDED';
  metadata: Record<string, any>;
  providerReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'sandbox' | 'disabled';
  baseUrl: string;
  docsUrl: string;
  authMethod: 'BEARER_TOKEN' | 'API_KEY_SECRET' | 'BASIC_AUTH' | 'CUSTOM_SIGNATURE';
  credentials: {
    apiKey?: string;
    secretKey?: string;
    publicKey?: string;
    webhookSecret?: string;
    userId?: string;
  };
  supportedServices: string[];
  priority: number;
  timeoutMs: number;
  rateLimitPerMin: number;
  balance: number;
  lastTestedAt?: string;
  lastTestStatus?: 'SUCCESS' | 'FAILED';
  lastErrorLog?: string;
}

export interface AirtimeProduct {
  id: string;
  network: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
  name: string;
  customerDiscountPercent: number; // e.g. 2%
  retailerDiscountPercent: number; // e.g. 4.5%
  minAmount: number;
  maxAmount: number;
  status: 'active' | 'inactive';
}

export interface DataPlan {
  id: string;
  network: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
  type: 'SME' | 'GIFTING' | 'CORPORATE';
  name: string;
  sizeMb: number;
  validity: string;
  customerPrice: number;
  retailerPrice: number;
  providerCost: number;
  status: 'active' | 'inactive';
}

export interface ElectricityDisCo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  fee: number;
  retailerCommissionPercent: number;
  status: 'active' | 'inactive';
}

export interface CableTVBouquet {
  id: string;
  provider: 'DSTV' | 'GOTV' | 'STARTIMES';
  code: string;
  name: string;
  customerPrice: number;
  retailerPrice: number;
  fee: number;
  status: 'active' | 'inactive';
}

export interface EducationInstitution {
  id: string;
  code: string;
  name: string;
  category: 'TERTIARY' | 'EXAMINATION' | 'SECONDARY';
  state: string;
  accountFee: number;
  supportedFees: string[];
  status: 'active' | 'inactive';
}

export interface FlightRoute {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string; // KAN, ABV, LOS, PHC
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cabinClass: 'ECONOMY' | 'ECONOMY_FLEX' | 'BUSINESS';
  price: number;
  baggageAllowance: string;
  availableSeats: number;
}

export interface FlightBooking {
  id: string;
  bookingReference: string;
  pnr: string;
  userId: string;
  flightId: string;
  airline: string;
  flightNumber: string;
  route: string;
  departureDate: string;
  passengers: Array<{
    title: string;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    ninOrPassport?: string;
  }>;
  cabinClass: string;
  amount: number;
  fee: number;
  status: 'CONFIRMED' | 'TICKETED' | 'CANCELLED' | 'REFUNDED';
  ticketNumber?: string;
  createdAt: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  category: 'DUPLEX' | 'FLAT_APARTMENT' | 'COMMERCIAL' | 'LAND_PLOT';
  transactionType: 'SALE' | 'RENT';
  location: string;
  address: string;
  city: string;
  state: string;
  price: number;
  period?: 'yearly' | 'outright';
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  description: string;
  features: string[];
  images: string[];
  agentName: string;
  agentPhone: string;
  agentId: string;
  isVerified: boolean;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface PropertyInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  inquirerName: string;
  inquirerEmail: string;
  inquirerPhone: string;
  preferredViewingDate?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'VIEWING_SCHEDULED' | 'CLOSED';
  createdAt: string;
}

export interface ResellerApiKey {
  id: string;
  userId: string;
  keyName: string;
  publicKey: string;
  secretKeyHash: string;
  maskedSecret: string;
  environment: 'SANDBOX' | 'LIVE';
  rateLimitPerMin: number;
  dailyUsageCount: number;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  wallets: WalletAccount[];
  ledgerEntries: LedgerEntry[];
  transactions: Transaction[];
  providers: Provider[];
  airtimeProducts: AirtimeProduct[];
  dataPlans: DataPlan[];
  electricityDisCos: ElectricityDisCo[];
  cableBouquets: CableTVBouquet[];
  educationInstitutions: EducationInstitution[];
  flights: FlightRoute[];
  flightBookings: FlightBooking[];
  properties: PropertyListing[];
  propertyInquiries: PropertyInquiry[];
  resellerApiKeys: ResellerApiKey[];
  auditLogs: AuditLog[];
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`3plea-salt-${password}`).digest('hex');
}

export class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(STORE_PATH)) {
      try {
        const fileContent = fs.readFileSync(STORE_PATH, 'utf-8');
        return JSON.parse(fileContent);
      } catch (e) {
        console.error('Failed to parse store.json, generating default seed database', e);
      }
    }
    const seed = this.createInitialSeed();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    const toSave = dataToSave || this.data;
    fs.writeFileSync(STORE_PATH, JSON.stringify(toSave, null, 2), 'utf-8');
  }

  private createInitialSeed(): DatabaseSchema {
    const now = new Date().toISOString();

    const users: User[] = [
      {
        id: 'usr_superadmin',
        email: 'admin@3ple-a.ng',
        phone: '+2348030000001',
        fullName: 'Super Administrator',
        role: 'superadmin',
        kycTier: 3,
        status: 'active',
        passwordHash: hashPassword('Admin3pleA@2026'),
        businessName: '3PLE A Enterprise Systems',
        address: 'Karkasara Road, Tarauni, Kano State, Nigeria',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_customer_1',
        email: 'amina.bello@gmail.com',
        phone: '+2348021234567',
        fullName: 'Amina Bello',
        role: 'customer',
        kycTier: 2,
        status: 'active',
        passwordHash: hashPassword('Pass1234!'),
        address: 'Nassarawa GRA, Kano State, Nigeria',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_retailer_1',
        email: 'danladi.vtu@gmail.com',
        phone: '+2348149876543',
        fullName: 'Danladi Garba (Danladi VTU Hub)',
        role: 'retailer',
        kycTier: 3,
        status: 'active',
        passwordHash: hashPassword('Retailer1234!'),
        businessName: 'Danladi VTU & Digital Resellers',
        address: 'Kanti Kwari Market, Kano State',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_agent_estate',
        email: 'mukhtar.estates@gmail.com',
        phone: '+2348065554321',
        fullName: 'Sani Mukhtar (Principal Broker)',
        role: 'agent',
        kycTier: 3,
        status: 'active',
        passwordHash: hashPassword('Estate1234!'),
        businessName: 'Mukhtar Premier Properties Kano',
        address: 'Zoo Road, Gidan Murtala, Kano',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_finance_officer',
        email: 'finance@3ple-a.ng',
        phone: '+2348098887766',
        fullName: 'Fatima Kabir (Chief Financial Controller)',
        role: 'finance',
        kycTier: 3,
        status: 'active',
        passwordHash: hashPassword('Finance1234!'),
        address: 'Karkasara Road, Tarauni, Kano',
        createdAt: now,
        updatedAt: now,
      }
    ];

    const wallets: WalletAccount[] = [
      {
        id: 'wlt_sys_revenue',
        userId: 'usr_superadmin',
        type: 'PLATFORM_REVENUE',
        balance: 1450200.50,
        currency: 'NGN',
        lockedBalance: 0,
        updatedAt: now,
      },
      {
        id: 'wlt_sys_escrow',
        userId: 'usr_superadmin',
        type: 'PROVIDER_ESCROW',
        balance: 5200000.00,
        currency: 'NGN',
        lockedBalance: 0,
        updatedAt: now,
      },
      {
        id: 'wlt_usr_customer_1',
        userId: 'usr_customer_1',
        type: 'CUSTOMER_WALLET',
        balance: 85450.00,
        currency: 'NGN',
        lockedBalance: 0,
        updatedAt: now,
      },
      {
        id: 'wlt_usr_retailer_1',
        userId: 'usr_retailer_1',
        type: 'CUSTOMER_WALLET',
        balance: 342150.00,
        currency: 'NGN',
        lockedBalance: 0,
        updatedAt: now,
      },
      {
        id: 'wlt_comm_retailer_1',
        userId: 'usr_retailer_1',
        type: 'RETAILER_COMMISSION',
        balance: 28400.00,
        currency: 'NGN',
        lockedBalance: 0,
        updatedAt: now,
      }
    ];

    const providers: Provider[] = [
      {
        id: 'prov_pairgate',
        name: 'Pairgate Developers API',
        code: 'PAIRGATE',
        status: 'active',
        baseUrl: 'https://pairgate.com/developers/home',
        docsUrl: 'https://pairgate.com/developers/home',
        authMethod: 'BEARER_TOKEN',
        credentials: {
          apiKey: 'pg_live_8f934c11b0e27a69',
          secretKey: 'pg_sec_live_9013ac99182348fe8'
        },
        supportedServices: ['AIRTIME', 'DATA', 'ELECTRICITY', 'CABLE_TV'],
        priority: 1,
        timeoutMs: 8000,
        rateLimitPerMin: 120,
        balance: 850000.00,
        lastTestedAt: now,
        lastTestStatus: 'SUCCESS',
      },
      {
        id: 'prov_paystack',
        name: 'Paystack Payments NG',
        code: 'PAYSTACK',
        status: 'active',
        baseUrl: 'https://api.paystack.co',
        docsUrl: 'https://paystack.com/docs',
        authMethod: 'BEARER_TOKEN',
        credentials: {
          publicKey: 'pk_live_45a90918bd23441890',
          secretKey: 'sk_live_9000181293a18e0018',
          webhookSecret: 'whsec_paystack_3plea_2026'
        },
        supportedServices: ['WALLET_FUNDING'],
        priority: 1,
        timeoutMs: 10000,
        rateLimitPerMin: 300,
        balance: 3120500.00,
        lastTestedAt: now,
        lastTestStatus: 'SUCCESS',
      },
      {
        id: 'prov_monnify',
        name: 'Monnify Reserved Accounts',
        code: 'MONNIFY',
        status: 'active',
        baseUrl: 'https://api.monnify.com',
        docsUrl: 'https://app.monnify.com/activate-business',
        authMethod: 'API_KEY_SECRET',
        credentials: {
          apiKey: 'MK_TEST_9901842890',
          secretKey: 'SK_TEST_0019283741827'
        },
        supportedServices: ['WALLET_FUNDING'],
        priority: 2,
        timeoutMs: 9000,
        rateLimitPerMin: 200,
        balance: 1420000.00,
        lastTestedAt: now,
        lastTestStatus: 'SUCCESS',
      },
      {
        id: 'prov_clubkonnect',
        name: 'ClubKonnect VTU & Bill Engine',
        code: 'CLUBKONNECT',
        status: 'active',
        baseUrl: 'https://www.clubkonnect.com/APIDocs.asp',
        docsUrl: 'https://www.clubkonnect.com/APIDocs.asp',
        authMethod: 'API_KEY_SECRET',
        credentials: {
          userId: 'CK109284',
          apiKey: 'CK_API_998877665544'
        },
        supportedServices: ['AIRTIME', 'DATA', 'ELECTRICITY'],
        priority: 2,
        timeoutMs: 12000,
        rateLimitPerMin: 60,
        balance: 410000.00,
        lastTestedAt: now,
        lastTestStatus: 'SUCCESS',
      },
      {
        id: 'prov_mysubwallet',
        name: 'MySubWallet Travel & Aviation',
        code: 'MYSUBWALLET',
        status: 'active',
        baseUrl: 'https://app.mysubwallet.ng/dashboard/flight',
        docsUrl: 'https://app.mysubwallet.ng/dashboard/flight',
        authMethod: 'BEARER_TOKEN',
        credentials: {
          apiKey: 'MSW_TRAVEL_LIVE_77812903'
        },
        supportedServices: ['FLIGHT'],
        priority: 1,
        timeoutMs: 15000,
        rateLimitPerMin: 50,
        balance: 920000.00,
        lastTestedAt: now,
        lastTestStatus: 'SUCCESS',
      },
      {
        id: 'prov_bigisub',
        name: 'BigiSub Direct SME Telecom',
        code: 'BIGISUB',
        status: 'active',
        baseUrl: 'https://bigisub.ng/dashboard/profile/',
        docsUrl: 'https://bigisub.ng/dashboard/profile/',
        authMethod: 'BEARER_TOKEN',
        credentials: {
          apiKey: 'BIGI_KEY_9921820491823'
        },
        supportedServices: ['DATA'],
        priority: 2,
        timeoutMs: 7000,
        rateLimitPerMin: 100,
        balance: 290000.00,
        lastTestedAt: now,
        lastTestStatus: 'SUCCESS',
      },
      {
        id: 'prov_payora',
        name: 'Payora Education & Utility Hub',
        code: 'PAYORA',
        status: 'active',
        baseUrl: 'https://www.payora.app/dashboard',
        docsUrl: 'https://www.payora.app/dashboard',
        authMethod: 'BEARER_TOKEN',
        credentials: {
          apiKey: 'PAYORA_SEC_9018247182903'
        },
        supportedServices: ['EDUCATION', 'ELECTRICITY'],
        priority: 1,
        timeoutMs: 8000,
        rateLimitPerMin: 120,
        balance: 540000.00,
        lastTestedAt: now,
        lastTestStatus: 'SUCCESS',
      }
    ];

    const airtimeProducts: AirtimeProduct[] = [
      { id: 'air_mtn', network: 'MTN', name: 'MTN Nigeria Airtime VTU', customerDiscountPercent: 2.0, retailerDiscountPercent: 4.5, minAmount: 50, maxAmount: 50000, status: 'active' },
      { id: 'air_airtel', network: 'AIRTEL', name: 'Airtel Smart Airtime Recharge', customerDiscountPercent: 2.5, retailerDiscountPercent: 5.0, minAmount: 50, maxAmount: 50000, status: 'active' },
      { id: 'air_glo', network: 'GLO', name: 'Glo Grandmasters Airtime', customerDiscountPercent: 3.5, retailerDiscountPercent: 6.0, minAmount: 50, maxAmount: 50000, status: 'active' },
      { id: 'air_9mobile', network: '9MOBILE', name: '9mobile 0809 VTU Airtime', customerDiscountPercent: 3.0, retailerDiscountPercent: 5.5, minAmount: 50, maxAmount: 50000, status: 'active' },
    ];

    const dataPlans: DataPlan[] = [
      // MTN
      { id: 'dp_mtn_sme_1gb', network: 'MTN', type: 'SME', name: 'MTN 1GB SME Data (30 Days)', sizeMb: 1024, validity: '30 Days', customerPrice: 290, retailerPrice: 260, providerCost: 245, status: 'active' },
      { id: 'dp_mtn_sme_2gb', network: 'MTN', type: 'SME', name: 'MTN 2GB SME Data (30 Days)', sizeMb: 2048, validity: '30 Days', customerPrice: 580, retailerPrice: 520, providerCost: 490, status: 'active' },
      { id: 'dp_mtn_sme_5gb', network: 'MTN', type: 'SME', name: 'MTN 5GB SME Data (30 Days)', sizeMb: 5120, validity: '30 Days', customerPrice: 1450, retailerPrice: 1300, providerCost: 1225, status: 'active' },
      { id: 'dp_mtn_sme_10gb', network: 'MTN', type: 'SME', name: 'MTN 10GB SME Data (30 Days)', sizeMb: 10240, validity: '30 Days', customerPrice: 2900, retailerPrice: 2600, providerCost: 2450, status: 'active' },
      // Airtel
      { id: 'dp_airtel_cg_1gb', network: 'AIRTEL', type: 'CORPORATE', name: 'Airtel 1GB Corporate Gifting (30 Days)', sizeMb: 1024, validity: '30 Days', customerPrice: 295, retailerPrice: 265, providerCost: 250, status: 'active' },
      { id: 'dp_airtel_cg_2gb', network: 'AIRTEL', type: 'CORPORATE', name: 'Airtel 2GB Corporate Gifting (30 Days)', sizeMb: 2048, validity: '30 Days', customerPrice: 590, retailerPrice: 530, providerCost: 500, status: 'active' },
      { id: 'dp_airtel_cg_5gb', network: 'AIRTEL', type: 'CORPORATE', name: 'Airtel 5GB Corporate Gifting (30 Days)', sizeMb: 5120, validity: '30 Days', customerPrice: 1475, retailerPrice: 1325, providerCost: 1250, status: 'active' },
      // Glo
      { id: 'dp_glo_cg_1gb', network: 'GLO', type: 'CORPORATE', name: 'Glo 1GB High Speed Data (30 Days)', sizeMb: 1024, validity: '30 Days', customerPrice: 260, retailerPrice: 235, providerCost: 220, status: 'active' },
      { id: 'dp_glo_cg_2gb', network: 'GLO', type: 'CORPORATE', name: 'Glo 2GB High Speed Data (30 Days)', sizeMb: 2048, validity: '30 Days', customerPrice: 520, retailerPrice: 470, providerCost: 440, status: 'active' },
      { id: 'dp_glo_cg_5gb', network: 'GLO', type: 'CORPORATE', name: 'Glo 5GB High Speed Data (30 Days)', sizeMb: 5120, validity: '30 Days', customerPrice: 1300, retailerPrice: 1175, providerCost: 1100, status: 'active' },
      // 9mobile
      { id: 'dp_9mob_sme_1gb', network: '9MOBILE', type: 'SME', name: '9mobile 1GB SME Data (30 Days)', sizeMb: 1024, validity: '30 Days', customerPrice: 250, retailerPrice: 225, providerCost: 210, status: 'active' },
      { id: 'dp_9mob_sme_2gb', network: '9MOBILE', type: 'SME', name: '9mobile 2GB SME Data (30 Days)', sizeMb: 2048, validity: '30 Days', customerPrice: 500, retailerPrice: 450, providerCost: 420, status: 'active' },
    ];

    const electricityDisCos: ElectricityDisCo[] = [
      { id: 'disco_kedco', code: 'KEDCO', name: 'Kano Electricity Distribution Company (KEDCO)', shortName: 'KEDCO Kano', fee: 100, retailerCommissionPercent: 1.2, status: 'active' },
      { id: 'disco_aedc', code: 'AEDC', name: 'Abuja Electricity Distribution Company (AEDC)', shortName: 'AEDC Abuja', fee: 100, retailerCommissionPercent: 1.2, status: 'active' },
      { id: 'disco_ekedc', code: 'EKEDC', name: 'Eko Electricity Distribution Company (EKEDC)', shortName: 'EKEDC Lagos', fee: 100, retailerCommissionPercent: 1.0, status: 'active' },
      { id: 'disco_ikedc', code: 'IKEDC', name: 'Ikeja Electric (IKEDC)', shortName: 'IKEDC Ikeja', fee: 100, retailerCommissionPercent: 1.0, status: 'active' },
      { id: 'disco_ibedc', code: 'IBEDC', name: 'Ibadan Electricity Distribution Company (IBEDC)', shortName: 'IBEDC Ibadan', fee: 100, retailerCommissionPercent: 1.2, status: 'active' },
      { id: 'disco_phedc', code: 'PHED', name: 'Port Harcourt Electricity Distribution (PHED)', shortName: 'PHED Rivers', fee: 100, retailerCommissionPercent: 1.2, status: 'active' },
      { id: 'disco_jedc', code: 'JEDC', name: 'Jos Electricity Distribution Company (JEDC)', shortName: 'JEDC Plateau', fee: 100, retailerCommissionPercent: 1.2, status: 'active' },
    ];

    const cableBouquets: CableTVBouquet[] = [
      { id: 'dstv_padi', provider: 'DSTV', code: 'D-PADI', name: 'DStv Padi (45+ Channels)', customerPrice: 3600, retailerPrice: 3550, fee: 100, status: 'active' },
      { id: 'dstv_yanga', provider: 'DSTV', code: 'D-YANGA', name: 'DStv Yanga (85+ Channels)', customerPrice: 5100, retailerPrice: 5020, fee: 100, status: 'active' },
      { id: 'dstv_confam', provider: 'DSTV', code: 'D-CONFAM', name: 'DStv Confam (105+ Channels)', customerPrice: 9300, retailerPrice: 9180, fee: 100, status: 'active' },
      { id: 'dstv_compact', provider: 'DSTV', code: 'D-COMPACT', name: 'DStv Compact (130+ Channels)', customerPrice: 15700, retailerPrice: 15500, fee: 100, status: 'active' },
      { id: 'gotv_smallie', provider: 'GOTV', code: 'G-SMALLIE', name: 'GOtv Smallie Monthly', customerPrice: 1575, retailerPrice: 1520, fee: 50, status: 'active' },
      { id: 'gotv_jolli', provider: 'GOTV', code: 'G-JOLLI', name: 'GOtv Jolli Package', customerPrice: 3950, retailerPrice: 3880, fee: 50, status: 'active' },
      { id: 'gotv_max', provider: 'GOTV', code: 'G-MAX', name: 'GOtv Max Super Package', customerPrice: 5700, retailerPrice: 5600, fee: 50, status: 'active' },
      { id: 'gotv_supa', provider: 'GOTV', code: 'G-SUPA', name: 'GOtv Supa Plus Entertainment', customerPrice: 9600, retailerPrice: 9450, fee: 50, status: 'active' },
      { id: 'startimes_nova', provider: 'STARTIMES', code: 'ST-NOVA', name: 'StarTimes Nova Bouquet', customerPrice: 1700, retailerPrice: 1650, fee: 50, status: 'active' },
      { id: 'startimes_basic', provider: 'STARTIMES', code: 'ST-BASIC', name: 'StarTimes Basic Bouquet', customerPrice: 3300, retailerPrice: 3200, fee: 50, status: 'active' },
      { id: 'startimes_classic', provider: 'STARTIMES', code: 'ST-CLASSIC', name: 'StarTimes Classic Bouquet', customerPrice: 5000, retailerPrice: 4850, fee: 50, status: 'active' },
    ];

    const educationInstitutions: EducationInstitution[] = [
      {
        id: 'edu_buk',
        code: 'BUK-KANO',
        name: 'Bayero University Kano (BUK)',
        category: 'TERTIARY',
        state: 'Kano',
        accountFee: 250,
        supportedFees: ['Tuition / Central Registration', 'Hostel Accommodation', 'Acceptance Fee', 'Transcript Processing', 'Post-UTME Screening'],
        status: 'active'
      },
      {
        id: 'edu_kanopoly',
        code: 'KANOPOLY',
        name: 'Kano State Polytechnic',
        category: 'TERTIARY',
        state: 'Kano',
        accountFee: 200,
        supportedFees: ['School Fees', 'Acceptance Fee', 'Late Registration Penalty'],
        status: 'active'
      },
      {
        id: 'edu_abu',
        code: 'ABU-ZARIA',
        name: 'Ahmadu Bello University (ABU) Zaria',
        category: 'TERTIARY',
        state: 'Kaduna',
        accountFee: 300,
        supportedFees: ['Undergraduate School Fees', 'Postgraduate Fees', 'Hostel Fee', 'Clearance Certificate'],
        status: 'active'
      },
      {
        id: 'edu_waec',
        code: 'WAEC-SCRATCH',
        name: 'WAEC Result Checker e-PIN / Scratch Card',
        category: 'EXAMINATION',
        state: 'National',
        accountFee: 100,
        supportedFees: ['e-PIN Scratch Card Token'],
        status: 'active'
      },
      {
        id: 'edu_jamb',
        code: 'JAMB-UTME',
        name: 'JAMB UTME / Direct Entry e-PIN Registration',
        category: 'EXAMINATION',
        state: 'National',
        accountFee: 150,
        supportedFees: ['UTME Registration PIN', 'Direct Entry PIN', 'Result Notification Slip'],
        status: 'active'
      },
      {
        id: 'edu_neco',
        code: 'NECO-TOKEN',
        name: 'NECO Result Verification e-Token',
        category: 'EXAMINATION',
        state: 'National',
        accountFee: 100,
        supportedFees: ['NECO Result Checker Token'],
        status: 'active'
      }
    ];

    const flights: FlightRoute[] = [
      {
        id: 'flt_kan_abv_01',
        airline: 'Max Air',
        airlineCode: 'VM',
        flightNumber: 'VM1642',
        origin: 'KAN (Mallam Aminu Kano Intl)',
        destination: 'ABV (Nnamdi Azikiwe Intl)',
        departureTime: '08:30 AM',
        arrivalTime: '09:25 AM',
        duration: '55m',
        cabinClass: 'ECONOMY',
        price: 94500,
        baggageAllowance: '20kg check-in + 7kg cabin',
        availableSeats: 14,
      },
      {
        id: 'flt_kan_los_01',
        airline: 'Air Peace',
        airlineCode: 'P4',
        flightNumber: 'P47120',
        origin: 'KAN (Mallam Aminu Kano Intl)',
        destination: 'LOS (Murtala Muhammed Intl)',
        departureTime: '10:45 AM',
        arrivalTime: '12:15 PM',
        duration: '1h 30m',
        cabinClass: 'ECONOMY',
        price: 118000,
        baggageAllowance: '20kg check-in + 7kg cabin',
        availableSeats: 9,
      },
      {
        id: 'flt_kan_los_02',
        airline: 'Air Peace',
        airlineCode: 'P4',
        flightNumber: 'P47122',
        origin: 'KAN (Mallam Aminu Kano Intl)',
        destination: 'LOS (Murtala Muhammed Intl)',
        departureTime: '03:15 PM',
        arrivalTime: '04:45 PM',
        duration: '1h 30m',
        cabinClass: 'BUSINESS',
        price: 245000,
        baggageAllowance: '30kg check-in + 10kg cabin',
        availableSeats: 4,
      },
      {
        id: 'flt_abv_kan_01',
        airline: 'Ibom Air',
        airlineCode: 'QI',
        flightNumber: 'QI0520',
        origin: 'ABV (Nnamdi Azikiwe Intl)',
        destination: 'KAN (Mallam Aminu Kano Intl)',
        departureTime: '01:00 PM',
        arrivalTime: '01:55 PM',
        duration: '55m',
        cabinClass: 'ECONOMY_FLEX',
        price: 105000,
        baggageAllowance: '23kg check-in + 7kg cabin',
        availableSeats: 18,
      },
      {
        id: 'flt_los_kan_01',
        airline: 'United Nigeria Airlines',
        airlineCode: 'U5',
        flightNumber: 'U50310',
        origin: 'LOS (Murtala Muhammed Intl)',
        destination: 'KAN (Mallam Aminu Kano Intl)',
        departureTime: '07:20 AM',
        arrivalTime: '08:50 AM',
        duration: '1h 30m',
        cabinClass: 'ECONOMY',
        price: 112000,
        baggageAllowance: '20kg check-in + 7kg cabin',
        availableSeats: 7,
      },
      {
        id: 'flt_kan_phc_01',
        airline: 'Aero Contractors',
        airlineCode: 'N2',
        flightNumber: 'N20194',
        origin: 'KAN (Mallam Aminu Kano Intl)',
        destination: 'PHC (Port Harcourt Intl)',
        departureTime: '11:10 AM',
        arrivalTime: '01:00 PM',
        duration: '1h 50m',
        cabinClass: 'ECONOMY',
        price: 135000,
        baggageAllowance: '20kg check-in + 7kg cabin',
        availableSeats: 11,
      }
    ];

    const properties: PropertyListing[] = [
      {
        id: 'prop_kano_tarauni_01',
        title: 'Contemporary 5-Bedroom Luxury Duplex with BQ',
        category: 'DUPLEX',
        transactionType: 'SALE',
        location: 'Tarauni GRA, Kano',
        address: 'Plot 42, Off Karkasara Road, Tarauni, Kano State',
        city: 'Kano',
        state: 'Kano State',
        price: 145000000,
        period: 'outright',
        bedrooms: 5,
        bathrooms: 6,
        sizeSqm: 850,
        description: 'Exquisitely finished luxury duplex featuring smart home automation, imported Spanish marble tiling, Olympic-grade private borehole with industrial filtration, fully fitted gourmet Italian kitchen, and 2-room staff quarters in prime Tarauni.',
        features: ['C of O Title', 'Borehole + Inverter', 'Security Post', 'Smart Lighting', 'Car Port (6 Cars)', 'Interlocked Paved Compound'],
        images: ['/src/assets/images/property_luxury_villa_1793020919834.jpg'],
        agentName: 'Sani Mukhtar',
        agentPhone: '+2348065554321',
        agentId: 'usr_agent_estate',
        isVerified: true,
        approvalStatus: 'APPROVED',
        createdAt: now,
      },
      {
        id: 'prop_kano_bompai_02',
        title: 'Serviced 3-Bedroom Executive Apartment Complex',
        category: 'FLAT_APARTMENT',
        transactionType: 'RENT',
        location: 'Bompai Industrial Area / GRA, Kano',
        address: 'Civic Towers, Bompai GRA, Kano State',
        city: 'Kano',
        state: 'Kano State',
        price: 3500000,
        period: 'yearly',
        bedrooms: 3,
        bathrooms: 4,
        sizeSqm: 240,
        description: 'Newly constructed executive serviced flat featuring 24/7 dedicated generator power, elevator, swimming pool, perimeter electric fencing, uniform armed security guard patrol, and ample dedicated parking.',
        features: ['24/7 Generator', 'Elevator', 'Swimming Pool', 'CCTV Surveillance', 'Fitted Wardrobes', 'Waste Disposal'],
        images: ['/src/assets/images/property_modern_apartment_1793020920236.jpg'],
        agentName: 'Sani Mukhtar',
        agentPhone: '+2348065554321',
        agentId: 'usr_agent_estate',
        isVerified: true,
        approvalStatus: 'APPROVED',
        createdAt: now,
      },
      {
        id: 'prop_kano_kanti_03',
        title: 'Multi-Floor Commercial Plaza Showroom & Warehouses',
        category: 'COMMERCIAL',
        transactionType: 'RENT',
        location: 'Kanti Kwari Market District, Kano',
        address: 'Baban Layi, Kanti Kwari Commercial Axis, Kano',
        city: 'Kano',
        state: 'Kano State',
        price: 8000000,
        period: 'yearly',
        sizeSqm: 620,
        description: 'High-visibility corner commercial complex designed for textile wholesalers, financial firms, or corporate showrooms. Features heavy-duty loading bays, fire hydrants, backup diesel power, and dedicated transformer.',
        features: ['Dedicated Transformer', 'Heavy Cargo Lift', 'Security Vault Room', 'Direct Road Frontage', 'Fire Suppression System'],
        images: ['/src/assets/images/property_modern_apartment_1793020920236.jpg'],
        agentName: 'Sani Mukhtar',
        agentPhone: '+2348065554321',
        agentId: 'usr_agent_estate',
        isVerified: true,
        approvalStatus: 'APPROVED',
        createdAt: now,
      },
      {
        id: 'prop_kano_danbare_04',
        title: 'Prime 1,200 Sqm Residential Plot near Bayero University (BUK)',
        category: 'LAND_PLOT',
        transactionType: 'SALE',
        location: 'Danbare / BUK New Campus Road, Kano',
        address: 'Sector 3, Danbare Layout, Kano State',
        city: 'Kano',
        state: 'Kano State',
        price: 28000000,
        period: 'outright',
        sizeSqm: 1200,
        description: '100% dry and level land strategically situated 3 minutes from BUK New Campus gate. Excellent for building modern student hostels or private family estates. Documented with clean Kano State Geographic Information System (KANGIS) survey plan.',
        features: ['KANGIS Registered Survey', 'Right of Occupancy (R of O)', 'Electricity Available', 'Dry Sandy Soil', 'Direct Road Access'],
        images: ['/src/assets/images/property_luxury_villa_1793020919834.jpg'],
        agentName: 'Sani Mukhtar',
        agentPhone: '+2348065554321',
        agentId: 'usr_agent_estate',
        isVerified: true,
        approvalStatus: 'APPROVED',
        createdAt: now,
      }
    ];

    const propertyInquiries: PropertyInquiry[] = [
      {
        id: 'inq_01',
        propertyId: 'prop_kano_tarauni_01',
        propertyTitle: 'Contemporary 5-Bedroom Luxury Duplex with BQ',
        inquirerName: 'Alhaji Bashir Umar',
        inquirerEmail: 'bashir.umar@yahoo.com',
        inquirerPhone: '+2348039988771',
        preferredViewingDate: '2026-11-02',
        message: 'I am interested in inspecting the property for purchase. Please confirm if viewing is available this Saturday.',
        status: 'NEW',
        createdAt: now,
      }
    ];

    const resellerApiKeys: ResellerApiKey[] = [
      {
        id: 'key_arewa_connect',
        userId: 'usr_retailer_1',
        keyName: 'Danladi VTU Production Key',
        publicKey: 'pk_live_danladi_88910248',
        secretKeyHash: hashPassword('sk_live_danladi_secret_9981248'),
        maskedSecret: 'sk_live_danladi_•••••••••9981',
        environment: 'LIVE',
        rateLimitPerMin: 120,
        dailyUsageCount: 42,
        lastUsedAt: now,
        isActive: true,
        createdAt: now,
      }
    ];

    const transactions: Transaction[] = [
      {
        id: 'txn_01_init',
        reference: '3PA-20261026-481920',
        userId: 'usr_customer_1',
        userName: 'Amina Bello',
        serviceType: 'WALLET_FUNDING',
        providerId: 'prov_paystack',
        providerName: 'Paystack Payments NG',
        amount: 50000,
        fee: 0,
        discount: 0,
        netAmount: 50000,
        status: 'SUCCESSFUL',
        metadata: { channel: 'Bank Transfer / Dedicated Account', providerRef: 'pstk_chg_8910248' },
        providerReference: 'pstk_chg_8910248',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'txn_02_vtu',
        reference: '3PA-20261026-901824',
        userId: 'usr_customer_1',
        userName: 'Amina Bello',
        serviceType: 'AIRTIME',
        providerId: 'prov_pairgate',
        providerName: 'Pairgate Developers API',
        amount: 2000,
        fee: 0,
        discount: 40,
        netAmount: 1960,
        status: 'SUCCESSFUL',
        metadata: { network: 'MTN', phone: '08031234567', discountPercent: 2.0 },
        providerReference: 'pg_air_89102914',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'txn_03_kedco',
        reference: '3PA-20261026-119284',
        userId: 'usr_customer_1',
        userName: 'Amina Bello',
        serviceType: 'ELECTRICITY',
        providerId: 'prov_pairgate',
        providerName: 'Pairgate Developers API',
        amount: 10000,
        fee: 100,
        discount: 0,
        netAmount: 10100,
        status: 'SUCCESSFUL',
        metadata: {
          disco: 'KEDCO',
          meterNumber: '45029184712',
          meterType: 'PREPAID',
          customerName: 'Amina Bello (Nassarawa GRA)',
          generatedToken: '4829-1029-4820-9182-3841',
          unitsKwh: 124.6
        },
        providerReference: 'pg_kdc_77810248',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ];

    const ledgerEntries: LedgerEntry[] = [
      {
        id: 'ledg_01',
        journalId: 'jrn_funding_01',
        accountId: 'wlt_sys_escrow',
        userId: 'usr_superadmin',
        type: 'DEBIT',
        amount: 50000,
        balanceAfter: 5200000.00,
        reference: '3PA-20261026-481920',
        description: 'Settlement inflow received via Paystack',
        createdAt: now,
      },
      {
        id: 'ledg_02',
        journalId: 'jrn_funding_01',
        accountId: 'wlt_usr_customer_1',
        userId: 'usr_customer_1',
        type: 'CREDIT',
        amount: 50000,
        balanceAfter: 85450.00,
        reference: '3PA-20261026-481920',
        description: 'Wallet credited from Paystack deposit',
        createdAt: now,
      }
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud_init_01',
        actorId: 'usr_superadmin',
        actorName: 'Super Administrator',
        action: 'SYSTEM_BOOTSTRAP',
        resource: 'Core Ledger & Provider Registry',
        details: 'Initial system configuration loaded with 7 Nigerian provider adapters and double-entry ledger verification.',
        ipAddress: '127.0.0.1',
        timestamp: now,
      }
    ];

    return {
      users,
      wallets,
      ledgerEntries,
      transactions,
      providers,
      airtimeProducts,
      dataPlans,
      electricityDisCos,
      cableBouquets,
      educationInstitutions,
      flights,
      flightBookings: [],
      properties,
      propertyInquiries,
      resellerApiKeys,
      auditLogs,
    };
  }

  // --- Double-entry Ledger Engine ---

  /**
   * Executes an atomic double-entry journal entry between two or more accounts.
   * Invariant: Total Debits must equal Total Credits.
   */
  public executeDoubleEntryTransaction(params: {
    reference: string;
    description: string;
    entries: Array<{
      accountId: string;
      userId?: string;
      type: 'DEBIT' | 'CREDIT';
      amount: number;
    }>;
  }): { success: boolean; journalId: string; error?: string } {
    const journalId = `jrn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    // Verify balance equality
    let totalDebits = 0;
    let totalCredits = 0;
    for (const e of params.entries) {
      if (e.amount <= 0) return { success: false, journalId: '', error: 'Ledger amounts must be strictly positive.' };
      if (e.type === 'DEBIT') totalDebits += Math.round(e.amount * 100);
      if (e.type === 'CREDIT') totalCredits += Math.round(e.amount * 100);
    }

    if (totalDebits !== totalCredits) {
      return {
        success: false,
        journalId: '',
        error: `Ledger out of balance: Debits (${totalDebits / 100}) do not match Credits (${totalCredits / 100}).`
      };
    }

    // Verify accounts exist and check debit sufficiency
    for (const e of params.entries) {
      const wallet = this.data.wallets.find(w => w.id === e.accountId);
      if (!wallet) {
        return { success: false, journalId: '', error: `Wallet account ${e.accountId} does not exist.` };
      }
      if (e.type === 'DEBIT' && wallet.type === 'CUSTOMER_WALLET' && (wallet.balance - wallet.lockedBalance) < e.amount) {
        return {
          success: false,
          journalId: '',
          error: `Insufficient available balance in account ${e.accountId}. Available: ₦${(wallet.balance - wallet.lockedBalance).toLocaleString()}`
        };
      }
    }

    // Apply journal entries atomically
    for (const e of params.entries) {
      const wallet = this.data.wallets.find(w => w.id === e.accountId)!;
      if (e.type === 'DEBIT') {
        wallet.balance = Math.round((wallet.balance - e.amount) * 100) / 100;
      } else {
        wallet.balance = Math.round((wallet.balance + e.amount) * 100) / 100;
      }
      wallet.updatedAt = now;

      this.data.ledgerEntries.unshift({
        id: `ledg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        journalId,
        accountId: wallet.id,
        userId: e.userId || wallet.userId,
        type: e.type,
        amount: e.amount,
        balanceAfter: wallet.balance,
        reference: params.reference,
        description: params.description,
        createdAt: now,
      });
    }

    this.saveData();
    return { success: true, journalId };
  }

  public verifyLedgerIntegrity(): { isBalanced: boolean; totalDebits: number; totalCredits: number; delta: number } {
    let debits = 0;
    let credits = 0;
    for (const e of this.data.ledgerEntries) {
      if (e.type === 'DEBIT') debits += Math.round(e.amount * 100);
      if (e.type === 'CREDIT') credits += Math.round(e.amount * 100);
    }
    const delta = (debits - credits) / 100;
    return {
      isBalanced: delta === 0,
      totalDebits: debits / 100,
      totalCredits: credits / 100,
      delta
    };
  }

  // --- Getters & Queries ---

  public getUsers() { return this.data.users; }
  public getUserById(id: string) { return this.data.users.find(u => u.id === id); }
  public getUserByEmail(email: string) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }

  public getWallets() { return this.data.wallets; }
  public getWalletByUserId(userId: string) { return this.data.wallets.find(w => w.userId === userId && w.type === 'CUSTOMER_WALLET'); }
  public getRetailerCommissionWallet(userId: string) { return this.data.wallets.find(w => w.userId === userId && w.type === 'RETAILER_COMMISSION'); }
  public getPlatformRevenueWallet() { return this.data.wallets.find(w => w.type === 'PLATFORM_REVENUE'); }
  public getProviderEscrowWallet() { return this.data.wallets.find(w => w.type === 'PROVIDER_ESCROW'); }

  public getLedgerEntries(limit = 100) { return this.data.ledgerEntries.slice(0, limit); }
  public getTransactions(limit = 100) { return this.data.transactions.slice(0, limit); }
  public getTransactionByRef(ref: string) { return this.data.transactions.find(t => t.reference === ref); }

  public getProviders() { return this.data.providers; }
  public getProviderById(id: string) { return this.data.providers.find(p => p.id === id); }
  public getAirtimeProducts() { return this.data.airtimeProducts; }
  public getDataPlans() { return this.data.dataPlans; }
  public getElectricityDisCos() { return this.data.electricityDisCos; }
  public getCableBouquets() { return this.data.cableBouquets; }
  public getEducationInstitutions() { return this.data.educationInstitutions; }
  public getFlights() { return this.data.flights; }
  public getFlightBookings() { return this.data.flightBookings; }
  public getProperties() { return this.data.properties; }
  public getPropertyInquiries() { return this.data.propertyInquiries; }
  public getResellerApiKeys() { return this.data.resellerApiKeys; }
  public getAuditLogs(limit = 100) { return this.data.auditLogs.slice(0, limit); }

  // --- Mutators ---

  public addTransaction(txn: Transaction) {
    this.data.transactions.unshift(txn);
    this.saveData();
    return txn;
  }

  public updateTransactionStatus(ref: string, status: Transaction['status']) {
    const txn = this.data.transactions.find(t => t.reference === ref);
    if (txn) {
      txn.status = status;
      txn.updatedAt = new Date().toISOString();
      this.saveData();
    }
    return txn;
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      ...entry,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.saveData();
    return log;
  }

  public addFlightBooking(booking: FlightBooking) {
    this.data.flightBookings.unshift(booking);
    this.saveData();
    return booking;
  }

  public addProperty(property: PropertyListing) {
    this.data.properties.unshift(property);
    this.saveData();
    return property;
  }

  public updatePropertyApproval(id: string, status: 'APPROVED' | 'REJECTED') {
    const prop = this.data.properties.find(p => p.id === id);
    if (prop) {
      prop.approvalStatus = status;
      prop.isVerified = status === 'APPROVED';
      this.saveData();
    }
    return prop;
  }

  public addPropertyInquiry(inquiry: PropertyInquiry) {
    this.data.propertyInquiries.unshift(inquiry);
    this.saveData();
    return inquiry;
  }

  public addProvider(provider: Provider) {
    this.data.providers.push(provider);
    this.saveData();
    return provider;
  }

  public updateProvider(id: string, updates: Partial<Provider>) {
    const p = this.data.providers.find(prov => prov.id === id);
    if (p) {
      Object.assign(p, updates);
      this.saveData();
    }
    return p;
  }

  public addResellerApiKey(key: ResellerApiKey) {
    this.data.resellerApiKeys.unshift(key);
    this.saveData();
    return key;
  }

  public updateAirtimeDiscount(id: string, customerDiscount: number, retailerDiscount: number) {
    const item = this.data.airtimeProducts.find(a => a.id === id);
    if (item) {
      item.customerDiscountPercent = customerDiscount;
      item.retailerDiscountPercent = retailerDiscount;
      this.saveData();
    }
    return item;
  }

  public updateDataPlanPrice(id: string, customerPrice: number, retailerPrice: number) {
    const item = this.data.dataPlans.find(d => d.id === id);
    if (item) {
      item.customerPrice = customerPrice;
      item.retailerPrice = retailerPrice;
      this.saveData();
    }
    return item;
  }

  public updateUserRole(userId: string, role: User['role']) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.role = role;
      user.updatedAt = new Date().toISOString();
      this.saveData();
    }
    return user;
  }

  public updateUserStatus(userId: string, status: User['status']) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      user.updatedAt = new Date().toISOString();
      this.saveData();
    }
    return user;
  }
}

export const db = new DatabaseStore();
