import { useState, useEffect, useMemo } from 'react'
import {
  Wallet as WalletIcon,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  RefreshCw,
  Radio,
  Zap,
  Sparkles
} from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import StatCard from '../components/StatCard.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import { exportToCSV } from '../utils/export.js'

export default function Wallet() {
  const {
    users,
    fetchUsers,
    transactions,
    transactionsLoading,
    fetchTransactions,
    socketStatus,
    kpiStats,
    adjustUserWallet
  } = useGameEngine()

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all") // 'all', 'credit', 'debit'
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [actionNotice, setActionNotice] = useState(null)

  // Auto-fetch fresh ledger and user balances on page load
  useEffect(() => {
    fetchTransactions()
    fetchUsers()
  }, [])

  // Adjustment Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [adjType, setAdjType] = useState("credit")
  const [category, setCategory] = useState("manual")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Update default selected user when users array changes
  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id || users[0].userId)
    }
  }, [users, selectedUserId])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (tx.id || "").toLowerCase().includes(q) ||
        (tx.username || "").toLowerCase().includes(q) ||
        (tx.name || "").toLowerCase().includes(q) ||
        (tx.gameCode || "").toLowerCase().includes(q) ||
        (tx.referenceId && String(tx.referenceId).toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q))

      const matchesType = typeFilter === "all" || tx.type === typeFilter
      const matchesCategory =
        categoryFilter === "all" ||
        tx.category === categoryFilter ||
        (categoryFilter === "manual_adjustment" && (tx.category === "manual" || tx.category === "adjustment" || tx.category === "manual_adjustment" || tx.category === "bonus")) ||
        (categoryFilter === "deposit" && (tx.category === "deposit" || (tx.type === "credit" && !tx.category))) ||
        (categoryFilter === "withdrawal" && (tx.category === "withdrawal" || (tx.type === "debit" && !tx.category))) ||
        (categoryFilter === "bet" && (tx.category === "bet" || tx.category === "bet_placed" || tx.category === "bet_debit")) ||
        (categoryFilter === "win" && (tx.category === "win" || tx.category === "bet_win" || tx.category === "payout" || tx.category === "winning"))
      return matchesSearch && matchesType && matchesCategory
    })
  }, [transactions, searchQuery, typeFilter, categoryFilter])

  const handleApplyAdjustment = async () => {
    if (!amount || Number(amount) <= 0 || !selectedUserId) return
    setSubmitting(true)
    try {
      const targetUser = users.find(u => String(u.id) === String(selectedUserId) || String(u.userId) === String(selectedUserId))
      const desc = note.trim() || (adjType === 'credit' ? 'Admin Topup / Deposit Bonus' : 'Admin Deduction / Penalty')
      const res = await adjustUserWallet({
        userId: selectedUserId,
        username: targetUser?.username,
        amount: Number(amount),
        type: adjType,
        category,
        description: desc
      })
      setActionNotice(res?.message || `Successfully recorded ${adjType.toUpperCase()} of ₹${Number(amount).toLocaleString()} for ${targetUser?.username || 'User'}`)
      setTimeout(() => setActionNotice(null), 4000)
      setModalOpen(false)
      setAmount("")
      setNote("")
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportTransactions = () => {
    const formatted = transactions.map((t) => ({
      txId: t.id,
      username: t.username,
      gameCode: t.gameCode,
      type: t.type,
      category: t.category,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      referenceId: t.referenceId,
      referenceType: t.referenceType,
      description: t.description,
      status: t.status,
      timestamp: t.timestamp
    }))
    exportToCSV(formatted, `turf_wallet_transactions_${Date.now()}.csv`)
  }

  const handleManualRefresh = () => {
    fetchTransactions()
    fetchUsers()
  }

  // Aggregate stats dynamically computed from APIs and real-time state
  const totalFloat = useMemo(() => {
    const userSum = users.reduce((sum, u) => {
      const b = Number(u.wallet?.balance ?? u.walletBalance ?? u.balance ?? 0)
      return sum + (isNaN(b) ? 0 : b)
    }, 0)
    return userSum > 0 ? userSum : (kpiStats?.platformLiability || 0)
  }, [users, kpiStats])

  const totalCredits = useMemo(() => {
    return transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [transactions])

  const totalDebits = useMemo(() => {
    return transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [transactions])

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 shadow-lg animate-fade-in">
          <Sparkles size={16} className="text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-2xl font-bold tracking-wide text-ink">
              Wallet & Ledger
            </h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${socketStatus.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-surface2 text-mute border-line'}`}>
              <span className={`w-2 h-2 rounded-full ${socketStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-mute'}`} />
              <span>{socketStatus.connected ? 'Socket Stream Live' : 'Offline / Local API'}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-mute mt-1">
            Real-time financial ledger via Socket.IO (<span className="font-mono text-primary">admin:wallet_transaction</span>) & REST APIs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={transactionsLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-line text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-all shadow-sm disabled:opacity-50"
            title="Refresh Ledger and Balances from API"
          >
            <RefreshCw size={14} className={transactionsLoading ? "animate-spin text-primary" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-glow-primary transition-all focus-ring shrink-0"
          >
            <Coins size={17} />
            <span>Adjust Balance</span>
          </button>
        </div>
      </div>

      {/* Financial Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Player Float (Liability)"
          value={`₹${totalFloat.toLocaleString()}`}
          sub="Aggregate wallet balances"
          tone="gold"
          icon={WalletIcon}
        />
        <StatCard
          label="Total Credits"
          value={`₹${totalCredits.toLocaleString()}`}
          sub="Winnings & deposits"
          tone="turf"
          icon={TrendingUp}
        />
        <StatCard
          label="Total Debits"
          value={`₹${totalDebits.toLocaleString()}`}
          sub="Bets & withdrawals"
          tone="blue"
          icon={TrendingDown}
        />
        <StatCard
          label="Ledger Records"
          value={transactions.length.toLocaleString()}
          sub="Audit entries"
          tone="violet"
          icon={Receipt}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line rounded-2xl p-3 shadow-card">
        <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs w-full sm:w-72">
          <Search size={15} className="text-mute shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Tx ID, user, game code, ref..."
            className="bg-transparent outline-none text-ink placeholder:text-mute w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Type Filter */}
          <div className="flex bg-surface2 border border-line rounded-xl p-1 text-xs">
            {["all", "credit", "debit"].map((tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${typeFilter === tp ? "bg-primary text-white shadow-sm" : "text-mute hover:text-ink"
                  }`}
              >
                {tp}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface2 border border-line rounded-xl px-3 py-1.5 text-xs text-ink outline-none focus:border-primary"
          >
            <option value="all">All Categories</option>
            <option value="bet_placed">Bets Placed</option>
            <option value="bet_win">Winning Payouts</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="manual_adjustment">Manual Adjustments</option>
            <option value="vip_bonus">VIP Bonus</option>
          </select>

          <button
            onClick={handleExportTransactions}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors focus-ring"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider font-semibold text-mute border-b border-line bg-surface2/50">
                <th className="px-5 py-3.5">Transaction ID</th>
                <th className="px-5 py-3.5">User & Game Code</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Amount (₹)</th>
                <th className="px-5 py-3.5">Balance Before</th>
                <th className="px-5 py-3.5">Balance After</th>
                <th className="px-5 py-3.5">Reference & Note</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-mute text-xs">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-surface2 flex items-center justify-center text-mute border border-line">
                        <Receipt size={22} className={transactionsLoading ? "animate-pulse text-primary" : ""} />
                      </div>
                      <span className="font-bold text-ink text-sm">
                        {transactionsLoading ? "Fetching Live Ledger from API..." : "No Ledger Transactions Found"}
                      </span>
                      <p className="text-xs text-mute">
                        {transactionsLoading
                          ? "Connecting to backend API & socket stream..."
                          : "Transactions will appear here in real-time as users deposit, withdraw, bet, win, or when admin manually adjusts balance."
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-ink font-semibold text-xs">
                      {tx.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-ink">{tx.username || tx.name || "User"}</div>
                      <div className="text-xs text-primary font-mono font-semibold">{tx.gameCode}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={tx.type === "credit" ? "turf" : "danger"} size="sm">
                        {tx.type === "credit" ? "+ CREDIT" : "− DEBIT"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-mute capitalize">
                      {(tx.category || "manual_adjustment").replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3.5 font-mono num font-bold text-base">
                      <span className={tx.type === "credit" ? "text-turf" : "text-danger"}>
                        {tx.type === "credit" ? `+₹${(Number(tx.amount) || 0).toLocaleString()}` : `−₹${(Number(tx.amount) || 0).toLocaleString()}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-mute num">
                      ₹{(Number(tx.balanceBefore) || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-ink num">
                      ₹{(Number(tx.balanceAfter) || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="text-xs font-semibold text-ink truncate">{tx.description}</div>
                      <div className="text-[11px] text-mute font-mono">{tx.referenceId}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-mute font-mono text-right">
                      {tx.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Wallet Adjustment Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Admin Wallet Adjustment Tool"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyAdjustment}
              disabled={submitting || !amount || Number(amount) <= 0}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md ${adjType === "credit"
                ? "bg-primary hover:bg-primary-hover shadow-glow-primary"
                : "bg-danger hover:bg-danger-hover shadow-glow-danger"
                } disabled:opacity-50`}
            >
              {submitting ? "Processing..." : `Confirm ${adjType === "credit" ? "Credit" : "Debit"}`}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Select User
            </span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-surface2 border border-line rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
            >
              {users.map((u) => {
                const bal = Number(u.wallet?.balance ?? u.walletBalance ?? 0)
                const uId = u.id || u.userId
                return (
                  <option key={uId} value={uId}>
                    {u.username} ({u.gameCode}) — Balance: ₹{bal.toLocaleString()}
                  </option>
                )
              })}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjType("credit")}
              className={`py-2 rounded-xl font-bold border transition-all ${adjType === "credit"
                ? "bg-primary text-white border-primary shadow-glow-primary"
                : "bg-surface2 text-mute border-line"
                }`}
            >
              + Credit (Add Coins)
            </button>
            <button
              type="button"
              onClick={() => setAdjType("debit")}
              className={`py-2 rounded-xl font-bold border transition-all ${adjType === "debit"
                ? "bg-danger text-white border-danger shadow-glow-danger"
                : "bg-surface2 text-mute border-line"
                }`}
            >
              − Debit (Deduct Coins)
            </button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Amount (₹)
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2000"
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary font-mono"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary"
            >
              <option value="manual">Manual (Admin Adjustment)</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="bonus">Bonus / Promotion</option>
              <option value="penalty">Penalty / Fine</option>
              <option value="fee_refund">Dispute Refund</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Audit Note / Description
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={adjType === 'credit' ? 'Admin Topup / Deposit Bonus' : 'Admin Deduction / Penalty'}
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary"
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
