import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { Code2, Terminal, Shield, BookOpen, Key, Copy, Check, Play, Loader2, ExternalLink } from 'lucide-react';

interface DevelopersViewProps {
  language: Language;
}

export const DevelopersView: React.FC<DevelopersViewProps> = ({ language }) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'QUICKSTART' | 'ENDPOINTS' | 'SDKS' | 'WEBHOOKS' | 'ERRORS'>('QUICKSTART');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Interactive playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('airtime');
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify({ network: 'MTN', phone: '08031234567', amount: 1000 }, null, 2)
  );
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isExecutingTest, setIsExecutingTest] = useState<boolean>(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleRunPlayground = async () => {
    setIsExecutingTest(true);
    setTestResponse(null);

    let url = '/api/v1/vtu/airtime/purchase';
    if (selectedEndpoint === 'data') url = '/api/v1/vtu/data/purchase';
    if (selectedEndpoint === 'meter') url = '/api/v1/vtu/electricity/validate-meter';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testPayload
      });
      const data = await res.json();
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsExecutingTest(false);
    }
  };

  const endpointsList = [
    {
      id: 'airtime',
      method: 'POST',
      path: '/api/v1/vtu/airtime/purchase',
      desc: 'Purchase VTU airtime recharge for any Nigerian GSM line.',
      sampleBody: { network: 'MTN', phone: '08031234567', amount: 1000 }
    },
    {
      id: 'data',
      method: 'POST',
      path: '/api/v1/vtu/data/purchase',
      desc: 'Activate an instant SME or corporate gifting data plan.',
      sampleBody: { planId: 'dp_mtn_sme_2gb', phone: '08149876543' }
    },
    {
      id: 'meter',
      method: 'POST',
      path: '/api/v1/vtu/electricity/validate-meter',
      desc: 'Validate electricity meter number and retrieve consumer account name.',
      sampleBody: { discoCode: 'KEDCO', meterNumber: '45029184712', meterType: 'PREPAID' }
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-emerald-700" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              3PLE A Developer Portal & OpenAPI 3.1
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Integrate Nigerian VTU, KEDCO electricity, and school fee payments into your software
          </p>
        </div>

        <a
          href="/api/v1/docs/openapi.json"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <span>Raw OpenAPI JSON</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
        {[
          { id: 'QUICKSTART', label: 'Quickstart & Auth' },
          { id: 'ENDPOINTS', label: 'Interactive API Explorer' },
          { id: 'SDKS', label: 'SDK Code Snippets' },
          { id: 'WEBHOOKS', label: 'Webhooks & Signatures' },
          { id: 'ERRORS', label: 'Error Codes' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* QUICKSTART */}
      {activeTab === 'QUICKSTART' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">1. Authentication & Headers</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              All requests to the 3PLE A API must include your Reseller Public API Key in the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">X-API-KEY</code> header, or a session Bearer token in the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">Authorization: Bearer &lt;TOKEN&gt;</code> header.
            </p>

            <div className="p-4 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono relative overflow-x-auto">
              <button
                onClick={() => copyToClipboard('curl -X POST https://3ple-a.ng/api/v1/vtu/airtime/purchase \\\n  -H "X-API-KEY: 3pa_pub_live_danladi_88910248" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"network": "MTN", "phone": "08031234567", "amount": 1000}\'', 'curl')}
                className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                title="Copy cURL"
              >
                {copiedSnippet === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre>{`curl -X POST https://3ple-a.ng/api/v1/vtu/airtime/purchase \\
  -H "X-API-KEY: 3pa_pub_live_danladi_88910248" \\
  -H "Content-Type: application/json" \\
  -d '{"network": "MTN", "phone": "08031234567", "amount": 1000}'`}</pre>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Base URLs</h3>
              <div className="space-y-1.5 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Production Base:</span>
                  <code className="text-emerald-700 font-bold">https://3ple-a.ng/api/v1</code>
                </div>
                <div>
                  <span className="text-slate-500 block">Sandbox Mode:</span>
                  <code className="text-blue-700 font-bold">https://sandbox.3ple-a.ng/api/v1</code>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Rate Limits & SLAs</h3>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Reseller Standard Tier: <strong>120 requests / min</strong></li>
                <li>• Transaction Idempotency: Supported via <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">X-Idempotency-Key</code></li>
                <li>• Guaranteed response time: <strong>&lt; 350ms</strong> across all VTU routes</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ENDPOINTS PLAYGROUND */}
      {activeTab === 'ENDPOINTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Endpoints</h3>
            {endpointsList.map((ep) => (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id);
                  setTestPayload(JSON.stringify(ep.sampleBody, null, 2));
                  setTestResponse(null);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selectedEndpoint === ep.id
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    {ep.method}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 truncate">{ep.path}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{ep.desc}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">JSON Request Body</span>
                <button
                  onClick={handleRunPlayground}
                  disabled={isExecutingTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  {isExecutingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Execute Endpoint Test</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-300 rounded-lg focus:outline-none"
              />
            </div>

            {testResponse && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Live Server Response</span>
                <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-64">
                  {testResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SDKS TAB */}
      {activeTab === 'SDKS' && (
        <div className="space-y-6">
          {/* TypeScript / Node.js */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">TypeScript / Node.js Example</h3>
            <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto">{`import axios from 'axios';

const client = axios.create({
  baseURL: 'https://3ple-a.ng/api/v1',
  headers: {
    'X-API-KEY': process.env.THREEPLE_A_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Recharge MTN Airtime
export async function rechargeAirtime(phone: string, amount: number) {
  const { data } = await client.post('/vtu/airtime/purchase', {
    network: 'MTN',
    phone,
    amount
  });
  console.log('Transaction Ref:', data.transaction.reference);
  return data;
}`}</pre>
          </div>

          {/* PHP Example */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">PHP cURL Example</h3>
            <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto">{`<?php
$curl = curl_init();

$payload = json_encode([
  "network" => "MTN",
  "phone" => "08031234567",
  "amount" => 1000
]);

curl_setopt_array($curl, [
  CURLOPT_URL => "https://3ple-a.ng/api/v1/vtu/airtime/purchase",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_HTTPHEADER => [
    "X-API-KEY: " . getenv("THREEPLE_A_API_KEY"),
    "Content-Type: application/json"
  ],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`}</pre>
          </div>

          {/* Python Example */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Python requests Example</h3>
            <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto">{`import requests, os

headers = {
    "X-API-KEY": os.getenv("THREEPLE_A_API_KEY"),
    "Content-Type": "application/json"
}

payload = {
    "network": "MTN",
    "phone": "08031234567",
    "amount": 1000
}

response = requests.post("https://3ple-a.ng/api/v1/vtu/airtime/purchase", json=payload, headers=headers)
print(response.json())`}</pre>
          </div>
        </div>
      )}

      {/* WEBHOOKS TAB */}
      {activeTab === 'WEBHOOKS' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">HMAC-SHA256 Webhook Signatures</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            3PLE A signs all outgoing webhook payloads with HMAC-SHA256 using your secret key in the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">X-3PLE-A-Signature</code> header. Verify signatures before processing callbacks:
          </p>

          <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto">{`import crypto from 'crypto';

export function verifyWebhook(rawBody: string, signature: string, secretKey: string): boolean {
  const hash = crypto.createHmac('sha256', secretKey).update(rawBody).digest('hex');
  return hash === signature;
}`}</pre>
        </div>
      )}

      {/* ERROR CODES */}
      {activeTab === 'ERRORS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Standard API Error Codes</h3>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="p-3 px-6">Code</th>
                <th className="p-3">HTTP Status</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-3 px-6 font-bold text-rose-700">ERR_INSUFFICIENT_FUNDS</td>
                <td className="p-3">400 Bad Request</td>
                <td className="p-3 font-sans">Wallet balance is below required transaction cost.</td>
              </tr>
              <tr>
                <td className="p-3 px-6 font-bold text-rose-700">ERR_INVALID_METER</td>
                <td className="p-3">400 Bad Request</td>
                <td className="p-3 font-sans">Electricity DisCo meter number could not be resolved.</td>
              </tr>
              <tr>
                <td className="p-3 px-6 font-bold text-rose-700">ERR_PROVIDER_TIMEOUT</td>
                <td className="p-3">504 Gateway Timeout</td>
                <td className="p-3 font-sans">Upstream telecommunication carrier timeout. Transaction marked pending.</td>
              </tr>
              <tr>
                <td className="p-3 px-6 font-bold text-rose-700">ERR_RATE_LIMIT_EXCEEDED</td>
                <td className="p-3">429 Too Many Requests</td>
                <td className="p-3 font-sans">API key exceeded allotted per-minute throughput.</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
