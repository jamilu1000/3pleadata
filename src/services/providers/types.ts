/**
 * @file types.ts
 * @description Standardized, type-safe provider interface contracts for 3PLE A.
 * Supports fintech gateways, VTU engines, utilities, education, and travel aggregators.
 */

export type ProviderServiceCategory =
  | 'AIRTIME'
  | 'DATA'
  | 'ELECTRICITY'
  | 'CABLE_TV'
  | 'EDUCATION'
  | 'FLIGHT'
  | 'WALLET_FUNDING';

export type ProviderEnvironment = 'LIVE' | 'SANDBOX';

export type ProviderAuthMethod =
  | 'BEARER_TOKEN'
  | 'API_KEY_SECRET'
  | 'BASIC_AUTH'
  | 'CUSTOM_SIGNATURE';

export type StandardTransactionStatus =
  | 'PENDING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'REVERSED'
  | 'REFUNDED';

/**
 * Standard configuration object passed to any provider adapter
 */
export interface ProviderConfig {
  providerId: string;
  name: string;
  code: string;
  baseUrl: string;
  environment: ProviderEnvironment;
  authMethod: ProviderAuthMethod;
  credentials: {
    apiKey?: string;
    secretKey?: string;
    publicKey?: string;
    webhookSecret?: string;
    userId?: string;
    [customKey: string]: string | undefined;
  };
  timeoutMs?: number;
  rateLimitPerMin?: number;
  retryAttempts?: number;
}

/**
 * Standardized response for getBalance()
 */
export interface ProviderBalanceResult {
  providerCode: string;
  balance: number;
  currency: string;
  timestamp: string;
  availableBalance?: number;
  rawResponse?: Record<string, unknown>;
}

/**
 * Standardized digital product definition for getProducts()
 */
export interface ProviderProduct {
  id: string;
  providerProductCode: string;
  name: string;
  category: ProviderServiceCategory;
  network?: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
  providerCost: number;
  sellingPrice?: number;
  isAvailable: boolean;
  metadata?: {
    validity?: string;
    dataSizeMb?: number;
    discoCode?: string;
    cableProvider?: string;
    [key: string]: unknown;
  };
}

/**
 * Request payload for validateTransaction()
 */
export interface TransactionValidationRequest {
  reference: string;
  providerReference?: string;
  serviceCategory?: ProviderServiceCategory;
  amount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Standardized result for validateTransaction()
 */
export interface TransactionValidationResult {
  transactionReference: string;
  providerReference: string;
  status: StandardTransactionStatus;
  amount: number;
  currency: string;
  fee?: number;
  verifiedAt: string;
  message: string;
  settlementDetails?: {
    gatewayResponse?: string;
    channel?: string;
    authCode?: string;
    token?: string; // e.g. electricity STS token or scratch card PIN
    pnr?: string;   // e.g. airline booking reference
  };
  rawResponse?: Record<string, unknown>;
}

/**
 * Customer validation request (e.g. meter lookup, smartcard validation, matric number)
 */
export interface CustomerValidationRequest {
  serviceCategory: 'ELECTRICITY' | 'CABLE_TV' | 'EDUCATION';
  identifier: string; // meter number, smartcard number, or student ID
  serviceCode: string; // e.g. 'KEDCO', 'DSTV', 'BUK-KANO'
  metadata?: Record<string, unknown>;
}

/**
 * Customer validation response
 */
export interface CustomerValidationResult {
  isValid: boolean;
  identifier: string;
  customerName: string;
  serviceAddress?: string;
  currentPackage?: string;
  outstandingBalance?: number;
  metadata?: Record<string, unknown>;
  rawResponse?: Record<string, unknown>;
}

/**
 * Request payload to initiate a transaction via provider
 */
export interface TransactionInitiateRequest {
  reference: string;
  serviceCategory: ProviderServiceCategory;
  amount: number;
  customerIdentifier: string; // phone number, meter number, or account ID
  productCode?: string;
  callbackUrl?: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Response when transaction is initiated
 */
export interface TransactionInitiateResult {
  success: boolean;
  reference: string;
  providerReference: string;
  status: StandardTransactionStatus;
  checkoutUrl?: string; // For payment collection gateways (Paystack/Monnify)
  generatedToken?: string; // For instant prepaid electricity or exam tokens
  message: string;
  rawResponse?: Record<string, unknown>;
}

/**
 * Refund request payload
 */
export interface RefundRequest {
  reference: string;
  providerReference: string;
  amount: number;
  reason: string;
}

/**
 * Refund result payload
 */
export interface RefundResult {
  success: boolean;
  refundReference: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  message: string;
  rawResponse?: Record<string, unknown>;
}

/**
 * Incoming webhook validation request
 */
export interface WebhookValidationRequest {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
  parsedBody: Record<string, unknown>;
}

/**
 * Standardized parsed webhook event
 */
export interface WebhookEvent {
  isValidSignature: boolean;
  eventType: string; // e.g. 'charge.success', 'vtu.completed'
  reference: string;
  providerReference?: string;
  status: StandardTransactionStatus;
  amount?: number;
  eventTimestamp: string;
  rawEvent: Record<string, unknown>;
}
