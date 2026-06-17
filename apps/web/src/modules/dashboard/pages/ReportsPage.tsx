'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  FileText,
} from 'lucide-react'
import { DEFAULT_CURRENCY, type SupportedCurrency, formatCurrencyAmount } from '@/modules/dashboard/constants/currency'

// ─── Types ───────────────────────────────────────────────────────────────────

type ChartType = 'balance' | 'cash-flow'

type DayPoint = {
  date: string
  cashIn: number
  cashOut: number
  net: number
  balance: number
}

type Summary = {
  totalCashIn: number
  totalCashOut: number
  netBalance: number
  transactionCount: number
  currency: string
}

type ReportData = {
  summary: Summary
  dailySeries: DayPoint[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toInputDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getDefaultDates(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: toInputDate(start), end: toInputDate(end) }
}

// Format amount without RTL symbol — use plain "AED" prefix for display safety
function safeFormat(amount: number, currency: string): string {
  const abs = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const sign = amount < 0 ? '-' : ''
  return `${sign}${currency} ${abs}`
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function BalanceChart({ data }: { data: DayPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DayPoint } | null>(null)
  const W = 860
  const H = 220
  const padX = 56
  const padY = 20
  const padBottom = 36

  if (!data.length) return null

  const values = data.map((d) => d.balance)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1

  const sx = (i: number) => padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2)
  const sy = (v: number) => padY + (1 - (v - minV) / range) * (H - padY - padBottom)

  const points = data.map((d, i) => `${sx(i)},${sy(d.balance)}`).join(' ')
  const area =
    `M ${sx(0)},${sy(data[0].balance)} ` +
    data.slice(1).map((d, i) => `L ${sx(i + 1)},${sy(d.balance)}`).join(' ') +
    ` L ${sx(data.length - 1)},${H - padBottom} L ${sx(0)},${H - padBottom} Z`

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    value: minV + t * range,
    y: padY + (1 - t) * (H - padY - padBottom),
  }))

  const step = Math.max(1, Math.floor(data.length / 8))
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((relX - padX) / (W - padX * 2)) * (data.length - 1))
    const clamped = Math.max(0, Math.min(data.length - 1, idx))
    setTooltip({ x: sx(clamped), y: sy(data[clamped].balance), point: data[clamped] })
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6D4AFF" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#6D4AFF" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padX} y1={t.y} x2={W - padX} y2={t.y} stroke="rgba(109,74,255,0.08)" strokeWidth="1" />
            <text x={padX - 8} y={t.y + 4} textAnchor="end" fill="#888888" fontSize="10">
              {t.value >= 1000 ? `${(t.value / 1000).toFixed(0)}k` : t.value.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={area} fill="url(#balanceGrad)" />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#6D4AFF"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* X labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d)
          return (
            <text key={i} x={sx(idx)} y={H - 8} textAnchor="middle" fill="#888888" fontSize="10">
              {formatDateLabel(d.date)}
            </text>
          )
        })}

        {/* Hover dot */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x} y1={padY}
              x2={tooltip.x} y2={H - padBottom}
              stroke="rgba(109,74,255,0.3)" strokeWidth="1" strokeDasharray="4 3"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#6D4AFF" stroke="white" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Tooltip box */}
      {tooltip && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-xl border border-primary/10 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{ left: `clamp(0px, ${(tooltip.x / 860) * 100}%, calc(100% - 160px))` }}
        >
          <p className="font-medium text-on-surface">{formatDateLabel(tooltip.point.date)}</p>
          <p className="text-outline">
            Balance: <span className="font-semibold text-primary">{tooltip.point.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

function CashFlowChart({ data }: { data: DayPoint[] }) {
  const W = 860
  const H = 220
  const padX = 56
  const padBottom = 36
  const padTop = 20

  if (!data.length) return null

  const activeDays = data.filter((d) => d.cashIn > 0 || d.cashOut > 0)
  const displayData = activeDays.length > 0 ? activeDays : data

  const maxV = Math.max(...displayData.map((d) => Math.max(d.cashIn, d.cashOut)), 1)
  const chartH = H - padTop - padBottom
  const n = displayData.length
  const barW = Math.max(4, Math.min(28, (W - padX * 2) / (n * 2.5)))
  const groupW = barW * 2 + 4
  const totalGroupsW = groupW * n
  const startX = padX + (W - padX * 2 - totalGroupsW) / 2

  const sy = (v: number) => padTop + (1 - v / maxV) * chartH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    value: maxV * t,
    y: padTop + (1 - t) * chartH,
  }))

  const step = Math.max(1, Math.floor(displayData.length / 8))

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padX} y1={t.y} x2={W - padX} y2={t.y} stroke="rgba(109,74,255,0.08)" strokeWidth="1" />
            <text x={padX - 8} y={t.y + 4} textAnchor="end" fill="#888888" fontSize="10">
              {t.value >= 1000 ? `${(t.value / 1000).toFixed(0)}k` : t.value.toFixed(0)}
            </text>
          </g>
        ))}

        {displayData.map((d, i) => {
          const gx = startX + i * groupW
          const inH = (d.cashIn / maxV) * chartH
          const outH = (d.cashOut / maxV) * chartH
          const showLabel = i % step === 0 || i === displayData.length - 1
          return (
            <g key={d.date}>
              <rect x={gx} y={sy(d.cashIn)} width={barW} height={Math.max(0, inH)} rx={3} fill="rgba(34,197,94,0.75)" />
              <rect x={gx + barW + 2} y={sy(d.cashOut)} width={barW} height={Math.max(0, outH)} rx={3} fill="rgba(239,68,68,0.70)" />
              {showLabel && (
                <text x={gx + barW} y={H - 8} textAnchor="middle" fill="#888888" fontSize="10">
                  {formatDateLabel(d.date)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
  variant,
}: {
  label: string
  value: string
  subLabel: string
  icon: React.ElementType
  variant: 'green' | 'red' | 'purple'
}) {
  const cfg = {
    green: {
      wrap: 'border-green-200 bg-green-50/50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700',
    },
    red: {
      wrap: 'border-red-200 bg-red-50/50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700',
    },
    purple: {
      wrap: 'border-primary/20 bg-primary-fixed/10',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor: 'text-on-surface',
    },
  }[variant]

  return (
    <div className={`squircle border p-5 ${cfg.wrap}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-label-sm font-bold uppercase tracking-wider text-outline">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${cfg.iconBg}`}>
          <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
        </div>
      </div>
      <p className={`font-title text-title-lg font-bold ${cfg.valueColor}`}>{value}</p>
      <p className="mt-1 text-label-sm text-outline">{subLabel}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const defaults = getDefaultDates()
  const [currency, setCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY)
  const [chartType, setChartType] = useState<ChartType>('balance')
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ currency, startDate, endDate })
      const res = await fetch(`/api/v1/reports?${params}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to load report')
        return
      }
      setData(json.data)
    } catch {
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [currency, startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const summary = data?.summary
  const series = data?.dailySeries ?? []

  return (
    <div className="min-w-0 flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Reports</h1>
          <p className="mt-0.5 text-body-sm text-outline">
            Separate AED and INR analytics — never mixed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="glass-surface rim-light squircle flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-outline transition-all hover:text-on-surface"
            onClick={() => {
              if (!series.length) return
              const header = 'Date,Cash In,Cash Out,Net,Balance'
              const rows = series.map((d) => `${d.date},${d.cashIn},${d.cashOut},${d.net},${d.balance}`)
              const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `report-${currency}-${startDate}-${endDate}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            className="squircle flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            onClick={() => window.print()}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="glass-surface rim-light squircle flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Currency toggle */}
        <div className="flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest p-1">
          {(['AED', 'INR'] as SupportedCurrency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all duration-200 ${
                currency === c
                  ? 'bg-primary text-white shadow-md'
                  : 'text-outline hover:bg-primary-fixed/20 hover:text-on-surface'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Chart type */}
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
          className="squircle border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none"
        >
          <option value="balance">Balance</option>
          <option value="cash-flow">Cash Flow</option>
        </select>

        {/* Date range */}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="squircle border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none"
          />
          <span className="text-outline">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="squircle border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none"
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Cash In"
          value={summary ? safeFormat(summary.totalCashIn, currency) : '—'}
          subLabel={`${currency} transactions only`}
          icon={TrendingUp}
          variant="green"
        />
        <StatCard
          label="Total Cash Out"
          value={summary ? safeFormat(summary.totalCashOut, currency) : '—'}
          subLabel={`${currency} transactions only`}
          icon={TrendingDown}
          variant="red"
        />
        <StatCard
          label="Net Balance"
          value={summary ? safeFormat(summary.netBalance, currency) : '—'}
          subLabel={`${summary?.transactionCount ?? 0} transactions`}
          icon={Wallet}
          variant="purple"
        />
      </div>

      {/* Chart card */}
      <div className="glass-surface rim-light squircle p-6">
        <p className="mb-4 text-label-sm font-bold uppercase tracking-wider text-outline">
          {chartType === 'balance' ? 'Balance' : 'Cash Flow'} — {currency}
        </p>

        {loading ? (
          <div className="flex h-56 items-center justify-center text-sm text-outline">
            Loading…
          </div>
        ) : error ? (
          <div className="flex h-56 items-center justify-center text-sm text-red-500">
            {error}
          </div>
        ) : series.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-outline">
            No data for this period
          </div>
        ) : chartType === 'balance' ? (
          <BalanceChart data={series} />
        ) : (
          <>
            <CashFlowChart data={series} />
            <div className="mt-3 flex items-center justify-end gap-5">
              <span className="flex items-center gap-1.5 text-xs text-outline">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" /> Cash In
              </span>
              <span className="flex items-center gap-1.5 text-xs text-outline">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" /> Cash Out
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
