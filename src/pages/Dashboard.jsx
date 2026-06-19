import { useState, useMemo } from 'react'
import {
  Users, TrendingUp, TrendingDown, Clock, FilePlus,
  UserPlus, ReceiptText, AlertCircle, UserCheck, Layers, X,
} from 'lucide-react'
import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { useApp } from '../context/AppContext'
import InvoiceModal from './InvoiceModal'
import { CustomerModal } from './Customers'
import { ExpenseModal }  from './Expenses'

const MONTH_LBL = ['Jan','Shk','Mar','Pri','Maj','Qer','Kor','Gus','Sht','Tet','Nën','Dhj']

/* ── Ngjyrat për kategorinë ── */
const CAT_COLORS = {
  'Shërbime': '#2563eb',
  'Software':  '#7c3aed',
  'Marketing': '#d97706',
  'Ushqim':    '#059669',
  'Pajisje':   '#dc2626',
  'Udhëtime':  '#be185d',
  'Tjera':     '#6b7280',
}

/* ── Stat card komponent ── */
function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor = 'text-gray-400', accent, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 transition-all duration-200 hover:shadow-md ${accent ? 'border-l-4' : ''} ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''}`}
      style={accent ? { borderLeftColor: iconColor } : {}}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className={`text-[11px] mt-0.5 font-medium truncate ${subColor}`}>{sub}</p>}
        {onClick && <p className="text-[10px] text-blue-400 mt-1 font-medium">Kliko për detaje →</p>}
      </div>
    </div>
  )
}

/* ── Drill-down drawer ── */
function DrillDrawer({ drill, onClose, fmt }) {
  if (!drill) return null
  const { title, rows, columns } = drill
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        {/* Count */}
        <div className="px-5 py-2 text-xs text-gray-400 border-b border-gray-50">
          {rows.length} rekorde
        </div>
        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Nuk ka të dhëna</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className={`px-4 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide text-[10px] ${col.right ? 'text-right' : ''}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className={`px-4 py-3 ${col.right ? 'text-right font-semibold' : ''} ${col.color ? col.color(row) : 'text-gray-700'}`}>
                        {col.render ? col.render(row, fmt) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Footer total */}
        {rows.length > 0 && drill.total != null && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</span>
            <span className="text-base font-bold text-gray-900">{fmt(drill.total)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Custom tooltip per grafin ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[160px]">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
            {p.name}
          </span>
          <span className="font-bold text-gray-800">€{Number(p.value).toLocaleString('de-DE')}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { invoices, customers, expenses, payments, navigate, setModal, closeModal, fmt, currentUser } = useApp()
  const [catFilter, setCatFilter] = useState('12m')

  const today    = new Date().toISOString().slice(0, 10)
  const thisYear = new Date().getFullYear().toString()
  const prevYear = (new Date().getFullYear() - 1).toString()
  const thisMonth = today.slice(0, 7)  // YYYY-MM

  /* ── Cash-flow: 12 muajt e fundit (dinamike) ── */
  const cashFlow = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d    = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yr   = d.getFullYear()
      const mo   = d.getMonth()              // 0-indexed
      const key  = `${yr}-${String(mo + 1).padStart(2, '0')}`
      const prev = `${yr - 1}-${String(mo + 1).padStart(2, '0')}`
      months.push({ key, prev, label: `${MONTH_LBL[mo]}'${String(yr).slice(2)}` })
    }
    return months.map(({ key, prev, label }) => ({
      month:    label,
      revenue:  payments.filter(p => p.date?.startsWith(key)).reduce((s, p) => s + (p.amount || 0), 0),
      expenses: expenses.filter(e => e.date?.startsWith(key)).reduce((s, e) => s + (e.amount || 0), 0),
      revPrev:  payments.filter(p => p.date?.startsWith(prev)).reduce((s, p) => s + (p.amount || 0), 0),
    }))
  }, [payments, expenses])

  /* ── Helpers ── */
  const getType = name => customers.find(c => c.name === name)?.type || 'individual'

  /* ── KPI 1: Klientë aktivë ── */
  // Fatura jo-void me subscriptionExpiry në të ardhmen (paguar ose jo)
  const activeClients = useMemo(() => {
    const names = new Set(
      invoices
        .filter(i =>
          i.status !== 'void' &&
          i.subscriptionExpiry &&
          i.subscriptionExpiry > today
        )
        .map(i => i.customer)
    )
    return names.size
  }, [invoices, today])

  /* ── KPI 2: Të ardhura totale viti aktual ── */
  // Përdor payments (datën e pagesës), jo datën e faturës
  const yearRevenue = useMemo(() =>
    payments
      .filter(p => p.date?.startsWith(thisYear))
      .reduce((s, p) => s + (p.amount || 0), 0),
    [payments, thisYear]
  )

  /* ── KPI 3: Shpenzime viti aktual ── */
  const yearExpenses = useMemo(() =>
    expenses
      .filter(e => e.date?.startsWith(thisYear))
      .reduce((s, e) => s + e.amount, 0),
    [expenses, thisYear]
  )

  /* ── KPI 4-6: Fatura në pritje ── */
  const pendingInvoices = useMemo(() =>
    invoices.filter(i => i.status === 'pending' || i.status === 'overdue'),
    [invoices]
  )
  const pendingKlient   = pendingInvoices.filter(i => getType(i.customer) !== 'reseller')
  const pendingReseller = pendingInvoices.filter(i => getType(i.customer) === 'reseller')

  const pendingKlientAmt   = pendingKlient.reduce((s, i) => s + i.amount, 0)
  const pendingResellerAmt = pendingReseller.reduce((s, i) => s + i.amount, 0)
  const pendingTotalAmt    = pendingInvoices.reduce((s, i) => s + i.amount, 0)

  /* ── Shpenzime sipas kategorisë (me filter) ── */
  const catData = useMemo(() => {
    let filtered = expenses
    if (catFilter === '1m')   filtered = expenses.filter(e => e.date?.startsWith(thisMonth))
    if (catFilter === '12m')  filtered = expenses.filter(e => e.date?.startsWith(thisYear))
    if (catFilter === 'prev') filtered = expenses.filter(e => e.date?.startsWith(prevYear))

    const groups = {}
    filtered.forEach(e => {
      const cat = e.category || 'Tjera'
      groups[cat] = (groups[cat] || 0) + e.amount
    })
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value, color: CAT_COLORS[name] || '#6b7280' }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, catFilter, thisMonth, thisYear, prevYear])

  const catTotal = catData.reduce((s, c) => s + c.value, 0)

  /* ── Shitje sipas muajit: krahasim me vitin 2025 ── */
  const salesComparison = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d    = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yr   = d.getFullYear()
      const mo   = d.getMonth()              // 0-indexed
      const key  = `${yr}-${String(mo + 1).padStart(2, '0')}`
      const prev = `${yr - 1}-${String(mo + 1).padStart(2, '0')}`
      months.push({ key, prev, label: `${MONTH_LBL[mo]}'${String(yr).slice(2)}` })
    }
    return months.map(({ key, prev, label }) => ({
      month:      label,
      sales:      invoices.filter(i => i.date?.startsWith(key) && i.status !== 'void').reduce((s, i) => s + (i.amount || 0), 0),
      salesPrev:  invoices.filter(i => i.date?.startsWith(prev) && i.status !== 'void').reduce((s, i) => s + (i.amount || 0), 0),
    }))
  }, [invoices])

  const openInvoiceModal  = () => setModal(<InvoiceModal />)
  const openCustomerModal = () => setModal(<CustomerModal onClose={closeModal} />)
  const openExpenseModal  = () => setModal(<ExpenseModal  onClose={closeModal} />)

  /* ── Drill state ── */
  const [drill, setDrill] = useState(null)

  const INV_COLS = [
    { key: 'customer', label: 'Klienti' },
    { key: 'date',     label: 'Data' },
    { key: 'status',   label: 'Statusi', render: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'overdue' ? 'bg-red-100 text-red-600' : r.status === 'partial' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
        {r.status === 'overdue' ? 'Vonesë' : r.status === 'partial' ? 'Pjesërisht' : 'Pritje'}
      </span>
    )},
    { key: 'amount', label: 'Shuma', right: true, render: (r, f) => f(r.amount) },
  ]

  const PAY_COLS = [
    { key: 'customer', label: 'Klienti' },
    { key: 'date',     label: 'Data' },
    { key: 'method',   label: 'Metoda' },
    { key: 'amount',   label: 'Shuma', right: true, render: (r, f) => f(r.amount) },
  ]

  const EXP_COLS = [
    { key: 'description', label: 'Përshkrimi' },
    { key: 'date',        label: 'Data' },
    { key: 'category',    label: 'Kategoria' },
    { key: 'amount',      label: 'Shuma', right: true, render: (r, f) => f(r.amount) },
  ]

  const openDrill = (title, rows, columns, total) => setDrill({ title, rows, columns, total })

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Përshëndetje, {currentUser?.name?.split(' ')[0] || 'Mirë se erdhe'} 👋</h2>
          <p className="text-sm text-gray-400 mt-0.5 hidden sm:block">Pasqyra financiare — {new Date().toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-sm text-gray-400 mt-0.5 sm:hidden">{new Date().toLocaleDateString('sq-AL', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {/* ── Layout kryesor: Content + Sidebar e ngushtë ── */}
      <div className="flex gap-5 items-start">

        {/* ── Kolona kryesore (e gjerë) ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Veprime të shpejta */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: FilePlus,    title: 'Krijo Faturë',  sub: 'Faturë e re',    action: openInvoiceModal },
              { icon: UserPlus,    title: 'Shto Klient',   sub: 'Klient i ri',    action: openCustomerModal },
              { icon: ReceiptText, title: 'Shpenzim i ri', sub: 'Regjistro',      action: openExpenseModal  },
            ].map(({ icon: Icon, title, sub, action }) => (
              <button key={title} onClick={action}
                className="text-left bg-white border border-gray-100 rounded-2xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50/60 transition-all duration-150 group flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Icon size={16} className="text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{title}</p>
                  <p className="text-[11px] text-gray-400 truncate">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* 6 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <KpiCard icon={UserCheck}   iconBg="#ecfdf5" iconColor="#059669" accent
              label="Klientë aktivë" value={activeClients}
              sub="Abonime aktive"
            />
            <KpiCard icon={TrendingUp}  iconBg="#eff6ff" iconColor="#2563eb" accent
              label={`Të ardhura ${thisYear}`} value={fmt(yearRevenue)}
              sub={`Pagesa ${thisYear}`}
              onClick={() => {
                const rows = payments.filter(p => p.date?.startsWith(thisYear)).sort((a,b) => b.date?.localeCompare(a.date))
                openDrill(`Të ardhura ${thisYear}`, rows, PAY_COLS, yearRevenue)
              }}
            />
            <KpiCard icon={TrendingDown} iconBg="#fef2f2" iconColor="#dc2626" accent
              label={`Shpenzime ${thisYear}`} value={fmt(yearExpenses)}
              sub="Shpenzime të regjistruara" subColor="text-red-400"
              onClick={() => {
                const rows = expenses.filter(e => e.date?.startsWith(thisYear)).sort((a,b) => b.date?.localeCompare(a.date))
                openDrill(`Shpenzime ${thisYear}`, rows, EXP_COLS, yearExpenses)
              }}
            />
            <KpiCard icon={Clock}        iconBg="#fffbeb" iconColor="#d97706" accent
              label="Pritje — Klient" value={fmt(pendingKlientAmt)}
              sub={`${pendingKlient.length} fatura`} subColor="text-amber-500"
              onClick={() => {
                const rows = [...pendingKlient].sort((a,b) => a.date?.localeCompare(b.date))
                openDrill('Fatura në pritje — Klientë individualë', rows, INV_COLS, pendingKlientAmt)
              }}
            />
            <KpiCard icon={Layers}       iconBg="#f5f3ff" iconColor="#7c3aed" accent
              label="Pritje — Reseller" value={fmt(pendingResellerAmt)}
              sub={`${pendingReseller.length} fatura`} subColor="text-purple-500"
              onClick={() => {
                const rows = [...pendingReseller].sort((a,b) => a.date?.localeCompare(b.date))
                openDrill('Fatura në pritje — Reseller', rows, INV_COLS, pendingResellerAmt)
              }}
            />
            <KpiCard icon={AlertCircle}  iconBg="#fff7ed" iconColor="#ea580c" accent
              label="Pritje — Total" value={fmt(pendingTotalAmt)}
              sub={`${pendingInvoices.length} fatura gjithsej`} subColor="text-orange-500"
              onClick={() => {
                const rows = [...pendingInvoices].sort((a,b) => a.date?.localeCompare(b.date))
                openDrill('Të gjitha faturat në pritje', rows, INV_COLS, pendingTotalAmt)
              }}
            />
          </div>

          {/* Cash-flow 12 muaj */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-gray-800">Fluksi i të hyrave &amp; shpenzimeve</p>
              <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Të ardhura {thisYear}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Shpenzime</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-px bg-blue-300 inline-block border-t border-dashed border-blue-300"/>Viti {prevYear}</span>
              </div>
            </div>
            <div className="px-2 py-5">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={cashFlow} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? v/1000+'k' : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue"  name={`Të ardhura ${thisYear}`} fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={20} />
                  <Bar dataKey="expenses" name={`Shpenzime ${thisYear}`}  fill="#f87171" radius={[4,4,0,0]} maxBarSize={20} />
                  <Line dataKey="revPrev" name={`T.ardhura ${prevYear}`} stroke="#93c5fd" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shitje sipas muajit */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-gray-800">Shitje sipas muajit — krahasim</p>
              <div className="flex gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Shitje {thisYear}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>Shitje {prevYear}</span>
              </div>
            </div>
            <div className="px-2 py-5">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={salesComparison} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? v/1000+'k' : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="sales"     name={`Shitje ${thisYear}`} fill="#10b981" radius={[4,4,0,0]} maxBarSize={20} />
                  <Bar dataKey="salesPrev" name={`Shitje ${prevYear}`} fill="#93c5fd" radius={[4,4,0,0]} maxBarSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      <DrillDrawer drill={drill} onClose={() => setDrill(null)} fmt={fmt} />

    </div>
  )
}
