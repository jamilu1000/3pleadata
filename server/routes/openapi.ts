import { Router } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: '3PLE A Enterprise Fintech, VTU & Digital Services API',
    version: '1.0.0',
    description: 'Official API documentation for 3PLE A platform — Karkasara Road, Tarauni, Kano State, Nigeria. Provides automated endpoints for VTU Airtime & Data, Electricity DisCo bill payments, Cable TV subscriptions, School Fees validation, Flight booking, and Wallet ledger queries.',
    contact: {
      name: '3PLE A Developer Engineering',
      email: 'api-support@3ple-a.ng',
      url: 'https://3ple-a.ng/developers'
    },
    license: {
      name: 'Proprietary Commercial License',
      url: 'https://3ple-a.ng/terms'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary Production & Sandbox API Server'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: '3PLE A Reseller Public Key (e.g. 3pa_pub_live_...)'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Session bearer token for authenticated user actions'
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' }
        }
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          reference: { type: 'string', example: '3PA-AIR-20261026-901824' },
          serviceType: { type: 'string', enum: ['AIRTIME', 'DATA', 'ELECTRICITY', 'CABLE_TV', 'EDUCATION', 'FLIGHT', 'WALLET_FUNDING'] },
          amount: { type: 'number', example: 2000 },
          fee: { type: 'number', example: 0 },
          discount: { type: 'number', example: 40 },
          netAmount: { type: 'number', example: 1960 },
          status: { type: 'string', enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'REFUNDED'] },
          providerReference: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/vtu/airtime/purchase': {
      post: {
        summary: 'Purchase VTU Airtime',
        description: 'Recharges a Nigerian GSM line (MTN, Airtel, Glo, 9mobile) with instant discount applied to the wallet ledger.',
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['network', 'phone', 'amount'],
                properties: {
                  network: { type: 'string', enum: ['MTN', 'AIRTEL', 'GLO', '9MOBILE'], example: 'MTN' },
                  phone: { type: 'string', example: '08031234567' },
                  amount: { type: 'number', minimum: 50, example: 1000 }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Airtime recharge successful and wallet debited atomically.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '₦1,000 MTN airtime successfully delivered to 08031234567' },
                    transaction: { $ref: '#/components/schemas/Transaction' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Insufficient balance or validation failure.'
          }
        }
      }
    },
    '/vtu/data/purchase': {
      post: {
        summary: 'Purchase Data Bundle',
        description: 'Instant SME or Direct Corporate Gifting data subscription delivery.',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId', 'phone'],
                properties: {
                  planId: { type: 'string', example: 'dp_mtn_sme_2gb' },
                  phone: { type: 'string', example: '08149876543' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Data bundle activated.'
          }
        }
      }
    },
    '/vtu/electricity/validate-meter': {
      post: {
        summary: 'Validate Electricity Meter',
        description: 'Query DisCo gateway to retrieve consumer profile, registered name, and tariff code before payment.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['discoCode', 'meterNumber'],
                properties: {
                  discoCode: { type: 'string', example: 'KEDCO' },
                  meterNumber: { type: 'string', example: '45029184712' },
                  meterType: { type: 'string', enum: ['PREPAID', 'POSTPAID'], default: 'PREPAID' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Meter verified successfully.'
          }
        }
      }
    },
    '/flights/search': {
      get: {
        summary: 'Search Scheduled Flights',
        description: 'Query scheduled domestic and regional flight itineraries with baggage rules and live seat availability.',
        parameters: [
          { name: 'origin', in: 'query', schema: { type: 'string' }, example: 'KAN' },
          { name: 'destination', in: 'query', schema: { type: 'string' }, example: 'LOS' }
        ],
        responses: {
          '200': { description: 'Available flights list returned.' }
        }
      }
    },
    '/education/validate-invoice': {
      post: {
        summary: 'Validate Institution Invoice / Student ID',
        description: 'Queries school portal for verification before fees payment (e.g. Bayero University Kano, ABU, Kano Poly).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['institutionCode', 'identifier'],
                properties: {
                  institutionCode: { type: 'string', example: 'BUK-KANO' },
                  identifier: { type: 'string', example: 'CST/22/COM/00482' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Student and fee schedule validated.' }
        }
      }
    },
    '/wallet/balance': {
      get: {
        summary: 'Get Wallet Balance',
        description: 'Returns available and locked balance, and retailer commission balance.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Balance details' }
        }
      }
    }
  }
};

router.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

export default router;
