export type Language = 'en' | 'ha';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'customer' | 'retailer' | 'agent' | 'reseller' | 'finance' | 'admin' | 'superadmin';
  kycTier: 1 | 2 | 3;
  status: 'active' | 'pending' | 'suspended';
  businessName?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletInfo {
  balance: number;
  locked: number;
  currency: string;
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

export interface AirtimeProduct {
  id: string;
  network: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
  name: string;
  customerDiscountPercent: number;
  retailerDiscountPercent: number;
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
  origin: string;
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
    userId?: string;
    hasSecret?: boolean;
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
