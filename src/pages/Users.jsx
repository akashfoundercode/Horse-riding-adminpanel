import { useState } from 'react'
import {
  Users as UsersIcon,
  Search,
  Wallet,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Plus,
  Coins,
  Shield,
  Smartphone,
  Trophy,
  History
} from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import Badge from '../components/Badge.jsx'
import Drawer from '../components/Drawer.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function Users() {
  const { users, allBets, setUserStatus, adjustUserWallet } = useGameEngine()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // 'all', 'active', 'banned', 'suspended'
  const [selectedUser, setSelectedUser] = useState(null)

  // Wallet adjustment state
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustType, setAdjustType] = useState("credit") // 'credit' or 'debit'
  const [adjustCategory, setAdjustCategory] = useState("manual")
  const [adjustNote, setAdjustNote] = useState("")

  // Ban confirmation
  const [banConfirmTarget, setBanConfirmTarget] = useState(null)

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.gameCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleOpenAdjust = (user, type = "credit") => {
    setAdjustTarget(user)
    setAdjustType(type)
    setAdjustAmount("")
    setAdjustNote("")
    setAdjustCategory("manual")
  }

  const handleConfirmAdjustment = async () => {
    if (!adjustAmount || Number(adjustAmount) <= 0 || !adjustTarget) return
    const desc = adjustNote.trim() || (adjustType === 'credit' ? 'Admin Topup / Deposit Bonus' : 'Admin Deduction / Penalty')
    await adjustUserWallet({
      userId: adjustTarget.id,
      username: adjustTarget.username,
      amount: Number(adjustAmount),
      type: adjustType,
      category: adjustCategory,
      description: desc,
    })
    setAdjustTarget(null)
    setAdjustAmount("")
  }

  const handleToggleBan = (user) => {
    const nextStatus = user.status === "active" ? "banned" : "active"
    setUserStatus(user.id, nextStatus)
    setBanConfirmTarget(null)
  }

  // Get user's recent bets
  const userRecentBets = selectedUser
    ? allBets.filter((b) => b.gameCode === selectedUser.gameCode).slice(0, 10)
    : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-wide text-ink">
            Users
          </h2>
          <p className="text-xs text-mute">
            Manage player accounts, wallets, and access controls.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line rounded-2xl p-3 shadow-card">
        <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs w-full sm:w-80">
          <Search size={15} className="text-mute shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search username, game code (GC...), email..."
            className="bg-transparent outline-none text-ink placeholder:text-mute w-full"
          />
        </div>

        <div className="flex bg-surface2 border border-line rounded-xl p-1 text-xs">
          {["all", "active", "banned", "suspended"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${statusFilter === st ? "bg-primary text-white shadow-sm" : "text-mute hover:text-ink"
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider font-semibold text-mute border-b border-line bg-surface2/50">
                <th className="px-5 py-3.5">User & Profile</th>
                <th className="px-5 py-3.5">Game Code</th>
                <th className="px-5 py-3.5">Wallet Balance (₹)</th>
                <th className="px-5 py-3.5">Total Bets</th>
                <th className="px-5 py-3.5">Total Winnings</th>
                <th className="px-5 py-3.5">VIP Tier</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-surface2/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary font-display">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-ink">{u.username}</div>
                        <div className="text-xs text-mute">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-primary">
                    {u.gameCode}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-base font-bold text-amber-600 dark:text-gold num">
                    ₹{u.walletBalance.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-mute font-mono num">
                    {u.totalBets}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-turf num">
                    ₹{u.totalWinnings.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone="violet" size="sm">
                      {u.vipTier}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      tone={
                        u.status === "active"
                          ? "turf"
                          : u.status === "banned"
                            ? "danger"
                            : "amber"
                      }
                      size="sm"
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenAdjust(u, "credit")}
                        className="p-1.5 rounded-lg text-mute hover:text-turf hover:bg-turf/10 transition-colors"
                        title="Quick Credit / Debit Wallet"
                      >
                        <Wallet size={15} />
                      </button>
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/10 transition-colors"
                        title="View Full Profile Drawer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setBanConfirmTarget(u)}
                        className={`p-1.5 rounded-lg transition-colors ${u.status === "active"
                          ? "text-mute hover:text-danger hover:bg-danger/10"
                          : "text-turf hover:bg-turf/10"
                          }`}
                        title={u.status === "active" ? "Ban User Account" : "Unban Account"}
                      >
                        {u.status === "active" ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Drawer */}
      <Drawer
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`User Profile — ${selectedUser?.username}`}
        subtitle={`Game Code: ${selectedUser?.gameCode}`}
      >
        {selectedUser && (
          <div className="space-y-6 text-sm">
            {/* User Overview Card */}
            <div className="p-4 rounded-2xl bg-surface2/60 border border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-base text-primary font-display">
                  {selectedUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-ink text-base">{selectedUser.username}</div>
                  <div className="text-xs text-mute font-mono">{selectedUser.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge tone="violet" size="sm">{selectedUser.vipTier} VIP</Badge>
                    <Badge tone={selectedUser.status === "active" ? "turf" : "danger"} size="sm">
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Balance & Quick Adjust */}
            <div className="p-4 rounded-2xl bg-panel border border-line shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-mute tracking-wider">Wallet Balance</span>
                <span className="font-display text-2xl text-amber-600 dark:text-gold font-bold num">
                  ₹{selectedUser.walletBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenAdjust(selectedUser, "credit")}
                  className="w-1/2 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary transition-all"
                >
                  + Credit
                </button>
                <button
                  onClick={() => handleOpenAdjust(selectedUser, "debit")}
                  className="w-1/2 py-2 rounded-xl bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 text-xs font-semibold transition-all"
                >
                  − Debit
                </button>
              </div>
            </div>

            {/* Lifetime Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface2 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-mute block">Total Wagered</span>
                <span className="font-bold font-mono text-ink text-sm">
                  ₹{selectedUser.totalWagered.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-surface2 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-mute block">Winnings</span>
                <span className="font-bold font-mono text-turf text-sm">
                  ₹{selectedUser.totalWinnings.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-surface2 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-mute block">Bets</span>
                <span className="font-bold font-mono text-ink text-sm">
                  {selectedUser.totalBets} bets
                </span>
              </div>
              <div className="p-3 bg-surface2 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-mute block">Last Device</span>
                <span className="font-semibold text-ink text-xs truncate block">
                  {selectedUser.lastLoginDevice}
                </span>
              </div>
            </div>

            {/* Recent Bets Log */}
            <div>
              <h4 className="font-display text-sm tracking-wide font-bold text-ink uppercase mb-3">
                Recent Bets
              </h4>
              {userRecentBets.length === 0 ? (
                <p className="text-xs text-mute py-4 text-center">No recent bets placed yet.</p>
              ) : (
                <div className="space-y-2">
                  {userRecentBets.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface2/50 border border-line text-xs"
                    >
                      <div>
                        <div className="font-bold text-ink">{b.horseName} ({b.odds}x)</div>
                        <div className="text-[11px] text-mute font-mono">{b.round} • {b.timestamp}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-ink">₹{b.amount}</div>
                        <Badge tone={b.result === "won" ? "turf" : "danger"} size="sm">
                          {b.result === "won" ? `+₹${b.payout}` : "Lost"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Manual Wallet Adjustment Modal */}
      <Modal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title={`Wallet — ${adjustTarget?.username}`}
        footer={
          <>
            <button
              onClick={() => setAdjustTarget(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAdjustment}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md ${adjustType === "credit"
                ? "bg-primary hover:bg-primary-hover shadow-glow-primary"
                : "bg-danger hover:bg-danger-hover shadow-glow-danger"
                }`}
            >
              Confirm {adjustType === "credit" ? "Credit" : "Debit"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface2 border border-line">
            <span className="text-mute font-semibold">Balance</span>
            <span className="font-display text-lg font-bold text-amber-600 dark:text-gold num">
              ₹{adjustTarget?.walletBalance.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjustType("credit")}
              className={`py-2 rounded-xl font-bold border transition-all ${adjustType === "credit"
                ? "bg-primary text-white border-primary shadow-glow-primary"
                : "bg-surface2 text-mute border-line"
                }`}
            >
              + Credit (Add Coins)
            </button>
            <button
              type="button"
              onClick={() => setAdjustType("debit")}
              className={`py-2 rounded-xl font-bold border transition-all ${adjustType === "debit"
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
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 1000"
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary font-mono"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Category
            </span>
            <select
              value={adjustCategory}
              onChange={(e) => setAdjustCategory(e.target.value)}
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary"
            >
              <option value="manual">Manual (Admin Adjustment)</option>
              <option value="deposit">Manual Deposit Credited</option>
              <option value="withdrawal">Manual Withdrawal Payout</option>
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
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder={adjustType === 'credit' ? 'Admin Topup / Deposit Bonus' : 'Admin Deduction / Penalty'}
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary"
            />
          </label>
        </div>
      </Modal>

      {/* Ban / Unban Confirmation Dialog */}
      <ConfirmDialog
        open={!!banConfirmTarget}
        onClose={() => setBanConfirmTarget(null)}
        onConfirm={() => handleToggleBan(banConfirmTarget)}
        title={banConfirmTarget?.status === "active" ? "Ban User Account" : "Unban User Account"}
        description={`Are you sure you want to ${banConfirmTarget?.status === "active" ? "ban" : "unban"
          } account "${banConfirmTarget?.username}" (${banConfirmTarget?.gameCode})? ${banConfirmTarget?.status === "active"
            ? "They will be immediately locked out from placing bets across all devices."
            : "Their betting and wallet privileges will be restored."
          }`}
        confirmLabel={banConfirmTarget?.status === "active" ? "Ban Account" : "Unban Account"}
        confirmTone={banConfirmTarget?.status === "active" ? "danger" : "primary"}
      />
    </div>
  )
}
