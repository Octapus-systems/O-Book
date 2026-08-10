'use client'

import React, { useState, useEffect } from 'react'
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Code2,
  Terminal,
  ExternalLink,
  Lock,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'

interface ApiKeyItem {
  id: string
  name: string
  displayKey: string
  permissions: string[]
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

const PERMISSION_OPTIONS = [
  { id: '*', label: 'Full Access (All Permissions)', desc: 'Complete access to all REST endpoints' },
  { id: 'transactions:read', label: 'Read Transactions', desc: 'Query and view cash-in / cash-out records' },
  { id: 'transactions:write', label: 'Create/Edit Transactions', desc: 'Create, update, and manage transactions' },
  { id: 'categories:read', label: 'Read Categories', desc: 'Fetch income & expense categories' },
  { id: 'categories:write', label: 'Manage Categories', desc: 'Create and manage financial categories' },
  { id: 'reports:read', label: 'Read Reports', desc: 'Access financial summaries and analytics' },
]

export default function ApiSettingsPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys')
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['*'])
  const [expiresInDays, setExpiresInDays] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Secret Key Revealed Modal state
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  // API Docs state
  const [docEndpoint, setDocEndpoint] = useState<'transactions' | 'categories' | 'reports'>('transactions')
  const [docLang, setDocLang] = useState<'curl' | 'js' | 'python'>('curl')
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true)
      setErrorMsg('')
      const res = await fetch('/api/v1/api-keys')
      const json = await res.json()
      if (json.success) {
        setApiKeys(json.data ?? [])
      } else {
        setErrorMsg(json.message || 'Failed to load API keys')
      }
    } catch (err) {
      setErrorMsg('Failed to connect to API keys endpoint')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyName.trim()) return

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyName.trim(),
          permissions: selectedPermissions,
          expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
        }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        setCreatedSecretKey(json.data.key)
        setIsCreateModalOpen(false)
        setKeyName('')
        setSelectedPermissions(['*'])
        setExpiresInDays(0)
        fetchApiKeys()
      } else {
        setErrorMsg(json.message || 'Failed to create API key')
      }
    } catch (err) {
      setErrorMsg('Error creating API key')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      const json = await res.json()
      if (json.success) {
        setApiKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, isActive: !currentStatus } : k))
        )
      }
    } catch (err) {
      setErrorMsg('Failed to update API key status')
    }
  }

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? External apps using this key will immediately lose access.')) {
      return
    }

    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id))
        setSuccessMsg('API key revoked successfully')
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        setErrorMsg(json.message || 'Failed to revoke API key')
      }
    } catch (err) {
      setErrorMsg('Failed to revoke API key')
    }
  }

  const copyToClipboard = (text: string, type: 'key' | 'code') => {
    navigator.clipboard.writeText(text)
    if (type === 'key') {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const togglePermission = (permId: string) => {
    if (permId === '*') {
      setSelectedPermissions(['*'])
      return
    }

    let updated = selectedPermissions.filter((p) => p !== '*')
    if (updated.includes(permId)) {
      updated = updated.filter((p) => p !== permId)
    } else {
      updated.push(permId)
    }

    if (updated.length === 0) {
      updated = ['*']
    }
    setSelectedPermissions(updated)
  }

  // Code Snippet Generators
  const getCodeSnippet = () => {
    const activeKeySample = apiKeys.find((k) => k.isActive)?.displayKey || 'obook_live_your_api_key_here'

    if (docEndpoint === 'transactions') {
      if (docLang === 'curl') {
        return `# Fetch All Transactions
curl -X GET "http://localhost:3000/api/v1/transactions" \\
  -H "Authorization: Bearer ${activeKeySample}" \\
  -H "Content-Type: application/json"

# Create a New Transaction
curl -X POST "http://localhost:3000/api/v1/transactions" \\
  -H "Authorization: Bearer ${activeKeySample}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "CASH_IN",
    "amount": 2500.00,
    "currency": "AED",
    "categoryId": "cat_sales_123",
    "paymentMethodId": "pm_bank_transfer",
    "description": "Invoice #1042 Payment"
  }'`
      } else if (docLang === 'js') {
        return `// Fetch Transactions in Node.js / JavaScript
const response = await fetch('http://localhost:3000/api/v1/transactions', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${activeKeySample}',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log('Transactions:', data);`
      } else {
        return `# Python integration using requests
import requests

url = "http://localhost:3000/api/v1/transactions"
headers = {
    "Authorization": "Bearer ${activeKeySample}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()
print("Transactions:", data)`
      }
    } else if (docEndpoint === 'categories') {
      if (docLang === 'curl') {
        return `curl -X GET "http://localhost:3000/api/v1/categories?type=CASH_IN" \\
  -H "Authorization: Bearer ${activeKeySample}"`
      } else if (docLang === 'js') {
        return `const res = await fetch('http://localhost:3000/api/v1/categories', {
  headers: { 'Authorization': 'Bearer ${activeKeySample}' }
});
const categories = await res.json();`
      } else {
        return `import requests

res = requests.get(
    "http://localhost:3000/api/v1/categories",
    headers={"Authorization": "Bearer ${activeKeySample}"}
)
print(res.json())`
      }
    } else {
      if (docLang === 'curl') {
        return `curl -X GET "http://localhost:3000/api/v1/reports" \\
  -H "Authorization: Bearer ${activeKeySample}"`
      } else if (docLang === 'js') {
        return `const res = await fetch('http://localhost:3000/api/v1/reports', {
  headers: { 'Authorization': 'Bearer ${activeKeySample}' }
});
const report = await res.json();`
      } else {
        return `import requests

res = requests.get(
    "http://localhost:3000/api/v1/reports",
    headers={"Authorization": "Bearer ${activeKeySample}"}
)
print(res.json())`
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 p-6 rounded-2xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Developer & API Integration</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Generate API keys to grant third-party applications secure access to O-Book
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New API Key</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 pb-3 pt-1 px-2 font-medium border-b-2 transition ${
              activeTab === 'keys'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>API Keys ({apiKeys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 pb-3 pt-1 px-2 font-medium border-b-2 transition ${
              activeTab === 'docs'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>API Documentation & Snippets</span>
          </button>
        </div>

        <button
          onClick={fetchApiKeys}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Refresh Keys"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: API KEYS LIST */}
      {activeTab === 'keys' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
              <p>Loading API Keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No API Keys Generated</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Create an API key to seamlessly integrate mobile apps, ERPs, or custom external workflows with O-Book.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition"
              >
                Generate API Key Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name & Key</th>
                    <th className="px-6 py-4 font-semibold">Permissions</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Last Used</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{key.name}</div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block">
                          {key.displayKey}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {key.permissions.map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
                            >
                              {p === '*' ? 'Full Access (*)' : p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(key.id, key.isActive)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                            key.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${key.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {key.isActive ? 'Active' : 'Revoked'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Revoke / Delete Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: API DOCUMENTATION & SNIPPETS */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Docs Navigation */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <span>Base URL & Headers</span>
              </h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-400 font-sans mb-1">Base Endpoint</div>
                  <div className="text-indigo-600 dark:text-indigo-400 select-all font-semibold">
                    http://localhost:3000/api/v1
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-400 font-sans mb-1">Authentication Header</div>
                  <div className="text-slate-700 dark:text-slate-300 select-all">
                    Authorization: Bearer &lt;YOUR_API_KEY&gt;
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Select Endpoint</h3>
              <div className="space-y-1">
                {[
                  { id: 'transactions', label: 'Transactions API', path: '/api/v1/transactions' },
                  { id: 'categories', label: 'Categories API', path: '/api/v1/categories' },
                  { id: 'reports', label: 'Reports API', path: '/api/v1/reports' },
                ].map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => setDocEndpoint(ep.id as any)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-between ${
                      docEndpoint === ep.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{ep.label}</span>
                    <span className="text-xs font-mono opacity-70">{ep.path}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Code Viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Snippet Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-slate-400 text-xs font-mono ml-2">
                    {docEndpoint}.{docLang}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Language Selector */}
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {(['curl', 'js', 'python'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setDocLang(lang)}
                        className={`px-3 py-1 rounded-md text-xs font-medium uppercase transition ${
                          docLang === lang ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => copyToClipboard(getCodeSnippet(), 'code')}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              {/* Snippet Body */}
              <div className="p-5 font-mono text-xs text-emerald-400 bg-slate-950 overflow-x-auto leading-relaxed whitespace-pre">
                {getCodeSnippet()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE API KEY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-500" />
                <span>Generate New API Key</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Key Name / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile App Integration, Zapier, Webhook Sync"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Permissions Scope
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {PERMISSION_OPTIONS.map((perm) => (
                    <label
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        selectedPermissions.includes(perm.id)
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{perm.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{perm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expiration
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Never Expire</option>
                  <option value={7}>Expire in 7 Days</option>
                  <option value={30}>Expire in 30 Days</option>
                  <option value={90}>Expire in 90 Days</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECRET REVEALED MODAL */}
      {createdSecretKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">API Key Generated!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Copy your key now. It won't be shown again.</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Please copy your API key and store it securely in your environment variables. For security reasons, O-Book cannot display this key to you again.
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Your Secret API Key
              </label>
              <div className="flex items-center gap-2 p-3 bg-slate-950 text-emerald-400 font-mono text-sm rounded-xl border border-slate-800 break-all select-all">
                <span>{createdSecretKey}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => copyToClipboard(createdSecretKey, 'key')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30"
              >
                {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'Copied to Clipboard!' : 'Copy Key'}</span>
              </button>

              <button
                onClick={() => setCreatedSecretKey(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
