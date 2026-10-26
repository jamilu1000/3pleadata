/**
 * @file index.ts
 * @description Provider Factory and Centralized Registry for 3PLE A.
 * Strictly enforces that all registered providers adhere to ProviderInterface.
 */

import { ProviderInterface, BaseProvider } from './base.js';
import { ProviderConfig, ProviderServiceCategory } from './types.js';
import { PaystackProvider } from './paystack.js';
import { ClubKonnectProvider } from './clubkonnect.js';

// Re-export all type definitions and implementations
export * from './types.js';
export * from './base.js';
export * from './paystack.js';
export * from './clubkonnect.js';
export * from './registry.js';

/**
 * Type-safe constructor signature for any class implementing ProviderInterface
 */
export type ProviderConstructor<T extends ProviderInterface = ProviderInterface> = new (
  config: ProviderConfig
) => T;

/**
 * Factory class acting as a registry for all fintech, telecom, and utility providers.
 * Enforces that every provider strictly implements ProviderInterface.
 */
export class ProviderFactory {
  private static instance: ProviderFactory;
  private readonly instances: Map<string, ProviderInterface> = new Map();
  private readonly constructors: Map<string, ProviderConstructor> = new Map();

  public constructor() {
    // Register standard provider constructors
    this.registerConstructor('PAYSTACK', PaystackProvider);
    this.registerConstructor('CLUBKONNECT', ClubKonnectProvider);

    // Bootstrap default ready-to-use instances
    this.initDefaultInstances();
  }

  /**
   * Singleton accessor for global provider registry
   */
  public static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  /**
   * Register a provider constructor class ensuring it adheres to ProviderInterface
   */
  public registerConstructor<T extends ProviderInterface>(
    code: string,
    constructorFn: ProviderConstructor<T>
  ): void {
    this.constructors.set(code.toUpperCase(), constructorFn);
  }

  /**
   * Register a pre-instantiated provider object, validating all required ProviderInterface methods
   */
  public registerProvider<T extends ProviderInterface>(provider: T): T {
    this.assertValidProvider(provider);
    this.instances.set(provider.code.toUpperCase(), provider);
    return provider;
  }

  /**
   * Factory method: Create and register a provider instance from configuration
   */
  public createProvider<T extends ProviderInterface = ProviderInterface>(
    providerCode: string,
    config: ProviderConfig
  ): T {
    const code = providerCode.toUpperCase();
    const Constructor = this.constructors.get(code);

    if (!Constructor) {
      throw new Error(
        `[ProviderFactory] Unknown provider code: "${providerCode}". Ensure its constructor is registered.`
      );
    }

    const providerInstance = new Constructor(config) as T;
    return this.registerProvider(providerInstance);
  }

  /**
   * Retrieve an active provider instance by code
   */
  public getProvider<T extends ProviderInterface = ProviderInterface>(
    code: string
  ): T | undefined {
    return this.instances.get(code.toUpperCase()) as T | undefined;
  }

  /**
   * Retrieve all registered providers strictly implementing ProviderInterface
   */
  public getAllProviders(): ProviderInterface[] {
    return Array.from(this.instances.values());
  }

  /**
   * Filter providers supporting a specific digital service (e.g. 'AIRTIME', 'WALLET_FUNDING')
   */
  public getProvidersForService(service: ProviderServiceCategory): ProviderInterface[] {
    return this.getAllProviders().filter((p) => p.supportedServices.includes(service));
  }

  /**
   * Check if a provider is registered
   */
  public hasProvider(code: string): boolean {
    return this.instances.has(code.toUpperCase());
  }

  /**
   * Unregister a provider
   */
  public unregisterProvider(code: string): boolean {
    return this.instances.delete(code.toUpperCase());
  }

  /**
   * Runtime verification asserting that an object strictly fulfills the ProviderInterface
   */
  private assertValidProvider(provider: unknown): asserts provider is ProviderInterface {
    if (!provider || typeof provider !== 'object') {
      throw new TypeError('[ProviderFactory] Provider must be an object.');
    }

    const candidate = provider as Record<string, unknown>;

    if (typeof candidate.name !== 'string' || !candidate.name) {
      throw new TypeError('[ProviderFactory] Provider must define a valid "name" property.');
    }
    if (typeof candidate.code !== 'string' || !candidate.code) {
      throw new TypeError('[ProviderFactory] Provider must define a valid "code" property.');
    }
    if (!Array.isArray(candidate.supportedServices)) {
      throw new TypeError('[ProviderFactory] Provider must define a "supportedServices" array.');
    }

    // Strictly enforce the 4 standardized methods
    const requiredMethods = [
      'getBalance',
      'getProducts',
      'validateTransaction',
      'initiateTransaction',
    ] as const;

    for (const method of requiredMethods) {
      if (typeof candidate[method] !== 'function') {
        throw new TypeError(
          `[ProviderFactory] Provider "${candidate.name}" (${candidate.code}) fails ProviderInterface: missing required method "${method}()".`
        );
      }
    }
  }

  /**
   * Initialize default provider instances with pre-configured sandbox credentials
   */
  private initDefaultInstances(): void {
    // Paystack default
    this.createProvider('PAYSTACK', {
      providerId: 'prov_paystack',
      name: 'Paystack Payments NG',
      code: 'PAYSTACK',
      baseUrl: 'https://api.paystack.co',
      environment: 'LIVE',
      authMethod: 'BEARER_TOKEN',
      credentials: {
        publicKey: 'pk_live_45a90918bd23441890',
        secretKey: 'sk_live_9000181293a18e0018',
        webhookSecret: 'whsec_paystack_3plea_2026',
      },
      timeoutMs: 10000,
      rateLimitPerMin: 300,
    });

    // ClubKonnect default
    this.createProvider('CLUBKONNECT', {
      providerId: 'prov_clubkonnect',
      name: 'ClubKonnect VTU & Bill Engine',
      code: 'CLUBKONNECT',
      baseUrl: 'https://www.clubkonnect.com',
      environment: 'LIVE',
      authMethod: 'API_KEY_SECRET',
      credentials: {
        userId: 'CK109284',
        apiKey: 'CK_API_998877665544',
      },
      timeoutMs: 12000,
      rateLimitPerMin: 60,
    });
  }
}

/**
 * Singleton instance of the ProviderFactory
 */
export const providerFactory = ProviderFactory.getInstance();

/**
 * Factory helper function to create or look up a provider adhering to ProviderInterface
 */
export function createProvider<T extends ProviderInterface = ProviderInterface>(
  code: string,
  config?: ProviderConfig
): T {
  if (config) {
    return providerFactory.createProvider<T>(code, config);
  }
  const existing = providerFactory.getProvider<T>(code);
  if (!existing) {
    throw new Error(`[createProvider] No provider registered under code: "${code}"`);
  }
  return existing;
}

/**
 * Factory helper function to register any custom provider adhering to ProviderInterface
 */
export function registerProvider<T extends ProviderInterface>(provider: T): T {
  return providerFactory.registerProvider(provider);
}
