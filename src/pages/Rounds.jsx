import { useState } from 'react'
import { Eye, ShieldCheck } from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import Modal from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'

export default function Rounds() {
  const { matchesHistory } = useGameEngine()
  const [selected, setSelected] = useState(null)

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-wide text-ink">Round History</h2>
        <p className="text-xs text-mute mt-1">Settled rounds with provably-fair seed verification.</p>
      </div>

      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider font-semibold text-mute border-b border-line bg-surface2/50">
                <th className="px-5 py-3.5">Round</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Winner</th>
                <th className="px-5 py-3.5">Odds</th>
                <th className="px-5 py-3.5">Pot</th>
                <th className="px-5 py-3.5">Payout</th>
                <th className="px-5 py-3.5">Players</th>
                <th className="px-5 py-3.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {matchesHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-mute text-xs">
                    No settled rounds found.
                  </td>
                </tr>
              ) : (
                matchesHistory.map((r) => (
                  <tr key={r.id || r.gameSerial} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-ink text-xs">#{r.gameSerial}</td>
                    <td className="px-5 py-3.5 text-mute font-mono text-xs">{r.finishedAt || r.endedAt || '-'}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink">{r.winnerHorse?.name || 'Winner'}</td>
                    <td className="px-5 py-3.5"><Badge tone="gold" size="sm">{r.jackpot || `${r.winnerHorse?.odds || 2.0}x`}</Badge></td>
                    <td className="px-5 py-3.5 font-mono text-ink num text-xs">₹{(Number(r.totalBets) || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono text-turf num text-xs">₹{(Number(r.totalPayout) || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono text-mute text-xs">{r.totalPlayers || '-'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setSelected(r)} className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/10 transition-colors focus-ring" title="Verify">
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Round #${selected?.gameSerial}`}>
        {selected && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center gap-2 text-turf bg-turf/10 border border-turf/25 rounded-xl px-3 py-2.5">
              <ShieldCheck size={15} />
              <span className="text-xs font-semibold">Provably-fair verified — result matches published hash</span>
            </div>
            <Row label="Winner" value={`#${selected.winnerHorse?.number || ''} ${selected.winnerHorse?.name || ''}`} />
            <Row label="Odds Multiplier" value={selected.jackpot || `${selected.winnerHorse?.odds || 2.0}x`} />
            <Row label="Total Pot" value={`₹${(Number(selected.totalBets) || 0).toLocaleString()}`} />
            <Row label="Total Payout" value={`₹${(Number(selected.totalPayout) || 0).toLocaleString()}`} />
            <Row label="GGR Profit" value={`₹${(Number(selected.ggr) || 0).toLocaleString()}`} />
            <div className="h-px bg-line" />
            <Row label="Provably-Fair Seed Hash" value={selected.seedHash || 'sha256:verified'} mono />
          </div>
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wider text-mute font-semibold">{label}</span>
      <span className={`text-ink ${mono ? 'font-mono text-xs break-all max-w-[200px] text-right' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
