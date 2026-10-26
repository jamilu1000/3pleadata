/**
 * @file registry.ts
 * @description Centralized ProviderRegistry managing provider instances and dynamic routing.
 */

import { BaseProvider, ProviderInterface } from './base.js';
import { ProviderServiceCategory, ProviderConfig } from './types.js';
import { PaystackProvider } from './paystack.js';
import { ClubKonnectProvider } from './clubkonnect.js';

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, ProviderInterface> = new Map();

  private constructor() {
    this.registerDefaultProviders();
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register default system providers with sandbox configurations
   */
  private registerDefaultProviders(): void {
    // 1. Paystack Gateway
    this.register(
      new PaystackProvider({
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
      })
    );

    // 2. ClubKonnect Telecom Engine
    this.register(
      new ClubKonnectProvider({
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
      })
    );
  }

  /**
   * Register a new provider instance
   */
  public register(provider: ProviderInterface): void {
    this.providers.set(provider.code.toUpperCase(), provider);
  }

  /**
   * Retrieve provider instance by code
   */
  public getProvider(code: string): ProviderInterface | undefined {
    return this.providers.get(code.toUpperCase());
  }

  /**
   * Get all registered providers
   */
  public getAllProviders(): ProviderInterface[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers supporting a specific service category
   */
  public getProvidersForService(service: ProviderServiceCategory): ProviderInterface[] {
    return this.getAllProviders().filter((p) => p.supportedServices.includes(service));
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
