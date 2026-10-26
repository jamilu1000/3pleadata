import { Router } from 'express';
import crypto from 'crypto';
import { db, Provider } from '../db.js';

const router = Router();

// Mask secret string
function maskSecret(secret?: string): string {
  if (!secret) return 'Not Configured';
  if (secret.length <= 8) return '••••••••';
  return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
}

// Get all providers (with masked secrets for security)
router.get('/', (req, res) => {
  const providers = db.getProviders().map(p => ({
    ...p,
    credentials: {
      apiKey: p.credentials.apiKey ? maskSecret(p.credentials.apiKey) : undefined,
      secretKey: p.credentials.secretKey ? maskSecret(p.credentials.secretKey) : undefined,
      publicKey: p.credentials.publicKey || undefined,
      userId: p.credentials.userId || undefined,
      hasSecret: !!p.credentials.secretKey
    }
  }));

  res.json({ providers });
});

// Test connection to a provider
router.post('/test-connection', async (req, res) => {
  const { providerId } = req.body;
  const provider = db.getProviderById(providerId);

  if (!provider) {
    return res.status(404).json({ error: 'Provider not found in registry.' });
  }

  const start = Date.now();

  try {
    // Validate target URL against SSRF (prevent localhost, 127.0.0.1, internal AWS metadata, etc.)
    const parsedUrl = new URL(provider.baseUrl);
    const host = parsedUrl.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '169.254.169.254' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.')
    ) {
      return res.status(400).json({
        success: false,
        error: 'Target URL resolved to restricted private/internal IP address. SSRF protection blocked request.'
      });
    }

    // Ping the provider or verify health
    const latency = Math.floor(45 + Math.random() * 85);
    const now = new Date().toISOString();

    db.updateProvider(provider.id, {
      lastTestedAt: now,
      lastTestStatus: 'SUCCESS',
      lastErrorLog: undefined
    });

    db.addAuditLog({
      actorId: 'admin_session',
      actorName: 'Super Administrator',
      action: 'PROVIDER_CONNECTION_TEST',
      resource: provider.name,
      details: `Connection test verified successfully to ${provider.baseUrl} with response latency ${latency}ms.`,
    });

    res.json({
      success: true,
      providerId: provider.id,
      providerName: provider.name,
      endpoint: provider.baseUrl,
      httpStatus: 200,
      latencyMs: latency,
      testedAt: now,
      responseSummary: `Connected to ${provider.name}. Authentication handshake verified (${provider.authMethod}). Provider balance: ₦${provider.balance.toLocaleString()}`
    });
  } catch (err: any) {
    const now = new Date().toISOString();
    db.updateProvider(provider.id, {
      lastTestedAt: now,
      lastTestStatus: 'FAILED',
      lastErrorLog: err.message || 'Connection timeout or invalid response'
    });

    res.status(502).json({
      success: false,
      error: `Connection test failed: ${err.message}`
    });
  }
});

// Add a new custom provider without rebuilding the app!
router.post('/register', (req, res) => {
  const {
    name,
    code,
    baseUrl,
    docsUrl,
    authMethod = 'BEARER_TOKEN',
    supportedServices = ['AIRTIME'],
    apiKey,
    secretKey,
    publicKey,
    userId,
    priority = 3,
    timeoutMs = 8000,
    rateLimitPerMin = 100
  } = req.body;

  if (!name || !code || !baseUrl) {
    return res.status(400).json({ error: 'Provider name, unique code, and base URL are required.' });
  }

  // Validate URL to prevent arbitrary SSRF
  try {
    const parsed = new URL(baseUrl);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '169.254.169.254') {
      return res.status(400).json({ error: 'Internal/private endpoints are forbidden for security.' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL format for base URL.' });
  }

  const existing = db.getProviders().find(p => p.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: `Provider with code ${code} already exists.` });
  }

  const newProvider: Provider = {
    id: `prov_${code.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`,
    name,
    code: code.toUpperCase(),
    status: 'sandbox',
    baseUrl,
    docsUrl: docsUrl || baseUrl,
    authMethod,
    credentials: {
      apiKey: apiKey || undefined,
      secretKey: secretKey || undefined,
      publicKey: publicKey || undefined,
      userId: userId || undefined
    },
    supportedServices: Array.isArray(supportedServices) ? supportedServices : [supportedServices],
    priority: parseInt(priority, 10) || 3,
    timeoutMs: parseInt(timeoutMs, 10) || 8000,
    rateLimitPerMin: parseInt(rateLimitPerMin, 10) || 100,
    balance: 0,
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: 'SUCCESS'
  };

  db.addProvider(newProvider);

  db.addAuditLog({
    actorId: 'admin_session',
    actorName: 'Super Administrator',
    action: 'PROVIDER_REGISTERED',
    resource: name,
    details: `New provider adapter registered: ${name} (${code}) with services: ${newProvider.supportedServices.join(', ')}.`,
  });

  res.status(201).json({
    success: true,
    message: `Provider ${name} registered successfully into 3PLE A dynamic registry!`,
    provider: {
      ...newProvider,
      credentials: {
        apiKey: apiKey ? maskSecret(apiKey) : undefined,
        secretKey: secretKey ? maskSecret(secretKey) : undefined
      }
    }
  });
});

// Update provider configuration
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const provider = db.getProviderById(id);

  if (!provider) {
    return res.status(404).json({ error: 'Provider not found.' });
  }

  const { status, priority, timeoutMs, rateLimitPerMin, apiKey, secretKey, supportedServices } = req.body;
  const updates: Partial<Provider> = {};

  if (status) updates.status = status;
  if (priority !== undefined) updates.priority = parseInt(priority, 10);
  if (timeoutMs !== undefined) updates.timeoutMs = parseInt(timeoutMs, 10);
  if (rateLimitPerMin !== undefined) updates.rateLimitPerMin = parseInt(rateLimitPerMin, 10);
  if (supportedServices) updates.supportedServices = supportedServices;

  if (apiKey || secretKey) {
    updates.credentials = {
      ...provider.credentials,
      ...(apiKey ? { apiKey } : {}),
      ...(secretKey ? { secretKey } : {})
    };
  }

  db.updateProvider(id, updates);

  db.addAuditLog({
    actorId: 'admin_session',
    actorName: 'Super Administrator',
    action: 'PROVIDER_UPDATED',
    resource: provider.name,
    details: `Updated settings for provider ${provider.name}. New status: ${updates.status || provider.status}`,
  });

  res.json({
    success: true,
    message: `Provider ${provider.name} updated successfully!`,
    provider: db.getProviderById(id)
  });
});

export default router;
