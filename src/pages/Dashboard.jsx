import { useMemo } from 'react'
import {
  TrendingUp, TrendingDown, Clock, FilePlus,
  UserPlus, ReceiptText, AlertCircle, UserCheck, Layers,
} from 'lucide-react'
import { setNavFilter } from '../context/navFilter'
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useApp } from '../context/AppContext'
import InvoiceModal from './InvoiceModal'
import { CustomerModal } from './Customers'
import { ExpenseModal }  from './Expenses'

const MONTH_LBL = ['Jan','Shk','Mar','Pri','Maj','Qer','Kor','Gus','Sht','Tet','Nën','Dhj']


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
              onClick={() => { setNavFilter({ monthFilt: thisYear }); navigate('payments') }}
            />
            <KpiCard icon={TrendingDown} iconBg="#fef2f2" iconColor="#dc2626" accent
              label={`Shpenzime ${thisYear}`} value={fmt(yearExpenses)}
              sub="Shpenzime të regjistruara" subColor="text-red-400"
              onClick={() => { setNavFilter({ yearFilt: thisYear }); navigate('expenses') }}
            />
            <KpiCard icon={Clock}        iconBg="#fffbeb" iconColor="#d97706" accent
              label="Pritje — Klient" value={fmt(pendingKlientAmt)}
              sub={`${pendingKlient.length} fatura`} subColor="text-amber-500"
              onClick={() => { setNavFilter({ statusFilter: 'unpaid', typeFilter: 'individual' }); navigate('invoices') }}
            />
            <KpiCard icon={Layers}       iconBg="#f5f3ff" iconColor="#7c3aed" accent
              label="Pritje — Reseller" value={fmt(pendingResellerAmt)}
              sub={`${pendingReseller.length} fatura`} subColor="text-purple-500"
              onClick={() => { setNavFilter({ statusFilter: 'unpaid', typeFilter: 'reseller' }); navigate('invoices') }}
            />
            <KpiCard icon={AlertCircle}  iconBg="#fff7ed" iconColor="#ea580c" accent
              label="Pritje — Total" value={fmt(pendingTotalAmt)}
              sub={`${pendingInvoices.length} fatura gjithsej`} subColor="text-orange-500"
              onClick={() => { setNavFilter({ statusFilter: 'unpaid', typeFilter: 'all' }); navigate('invoices') }}
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
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{background:'#6366f1'}}/>Shitje {thisYear}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{background:'#e2e8f0'}}/>Shitje {prevYear}</span>
              </div>
            </div>
            <div className="px-2 py-5">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={salesComparison} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCurr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? v/1000+'k' : v} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="salesPrev" name={`Shitje ${prevYear}`} fill="#e2e8f0" radius={[4,4,0,0]} maxBarSize={20} />
                  <Bar dataKey="sales"     name={`Shitje ${thisYear}`} fill="url(#gradCurr)" radius={[4,4,0,0]} maxBarSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
