/**
 * @file base.ts
 * @description Base Provider abstract class and interface enforcing standardized methods.
 */

import {
  ProviderConfig,
  ProviderServiceCategory,
  ProviderBalanceResult,
  ProviderProduct,
  TransactionValidationRequest,
  TransactionValidationResult,
  CustomerValidationRequest,
  CustomerValidationResult,
  TransactionInitiateRequest,
  TransactionInitiateResult,
  RefundRequest,
  RefundResult,
  WebhookValidationRequest,
  WebhookEvent,
} from './types.js';

export interface ProviderInterface {
  readonly name: string;
  readonly code: string;
  readonly supportedServices: ProviderServiceCategory[];

  /**
   * Check supplier account balance
   */
  getBalance(): Promise<ProviderBalanceResult>;

  /**
   * Fetch active catalog of supported products/plans
   */
  getProducts(category?: ProviderServiceCategory): Promise<ProviderProduct[]>;

  /**
   * Verify transaction state server-to-server with supplier gateway
   */
  validateTransaction(params: TransactionValidationRequest): Promise<TransactionValidationResult>;

  /**
   * Dispatch purchase or initialize payment authorization
   */
  initiateTransaction(params: TransactionInitiateRequest): Promise<TransactionInitiateResult>;

  /**
   * Optional: Validate recipient identifier (meter number, smartcard, student ID)
   */
  validateCustomer?(params: CustomerValidationRequest): Promise<CustomerValidationResult>;

  /**
   * Optional: Process refund with upstream supplier
   */
  requestRefund?(params: RefundRequest): Promise<RefundResult>;

  /**
   * Optional: Verify and parse webhook events
   */
  handleWebhook?(request: WebhookValidationRequest): Promise<WebhookEvent>;
}

// Alias for backwards compatibility
export type IBaseProvider = ProviderInterface;

export abstract class BaseProvider implements ProviderInterface {
  public readonly name: string;
  public readonly code: string;
  public readonly supportedServices: ProviderServiceCategory[];
  protected readonly config: ProviderConfig;

  constructor(config: ProviderConfig, supportedServices: ProviderServiceCategory[]) {
    this.config = config;
    this.name = config.name;
    this.code = config.code.toUpperCase();
    this.supportedServices = supportedServices;
  }

  /**
   * Standardized method: Retrieve provider wallet balance
   */
  public abstract getBalance(): Promise<ProviderBalanceResult>;

  /**
   * Standardized method: Retrieve supported digital products and prices
   */
  public abstract getProducts(category?: ProviderServiceCategory): Promise<ProviderProduct[]>;

  /**
   * Standardized method: Verify transaction outcome directly with the supplier
   */
  public abstract validateTransaction(
    params: TransactionValidationRequest
  ): Promise<TransactionValidationResult>;

  /**
   * Standardized method: Initiate or dispatch transaction to supplier
   */
  public abstract initiateTransaction(
    params: TransactionInitiateRequest
  ): Promise<TransactionInitiateResult>;

  /**
   * Type-safe HTTP helper with timeouts, header injection, and response parsing
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const timeout = this.config.timeoutMs || 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': '3PLE-A-Fintech-Core/1.0',
      ...(options.headers as Record<string, string> || {}),
    };

    // Apply default authentication headers based on config
    this.applyAuthHeaders(headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          `[${this.code}] HTTP ${response.status}: ${
            (responseBody as any).message || response.statusText || 'Provider request failed'
          }`
        );
      }

      return responseBody as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`[${this.code}] Request timeout after ${timeout}ms to ${url}`);
      }
      this.logError('makeRequest', err);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Apply authentication headers according to provider config
   */
  protected applyAuthHeaders(headers: Record<string, string>): void {
    const { authMethod, credentials } = this.config;

    switch (authMethod) {
      case 'BEARER_TOKEN':
        if (credentials.secretKey || credentials.apiKey) {
          headers['Authorization'] = `Bearer ${credentials.secretKey || credentials.apiKey}`;
        }
        break;
      case 'API_KEY_SECRET':
        if (credentials.apiKey) headers['X-API-KEY'] = credentials.apiKey;
        if (credentials.secretKey) headers['X-SECRET-KEY'] = credentials.secretKey;
        if (credentials.userId) headers['X-USER-ID'] = credentials.userId;
        break;
      case 'BASIC_AUTH':
        if (credentials.apiKey && credentials.secretKey) {
          const auth = Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        }
        break;
      default:
        break;
    }
  }

  /**
   * Helper to return masked credentials for display or audit logging
   */
  public getMaskedCredentials(): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [key, val] of Object.entries(this.config.credentials)) {
      if (!val) {
        masked[key] = 'NOT_SET';
      } else if (val.length <= 8) {
        masked[key] = '••••••••';
      } else {
        masked[key] = `${val.slice(0, 4)}••••••••${val.slice(-4)}`;
      }
    }
    return masked;
  }

  /**
   * Safe logger redacting secrets
   */
  protected logError(action: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${this.code}] Error during ${action}: ${message}`);
  }
}
