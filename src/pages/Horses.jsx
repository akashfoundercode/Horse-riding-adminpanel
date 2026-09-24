import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  Trophy,
  LayoutGrid,
  List,
  Search,
  CheckCircle2,
  AlertCircle,
  Code2,
  Copy,
  Check
} from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import Modal from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ImageUploader from '../components/ImageUploader.jsx'
import { horseApi } from '../services/horseApi.js'
import { resolveImageUrl } from '../utils/imageUrl.js'

const defaultHorseForm = {
  number: "",
  name: "",
  hindiName: "",
  odds: "3.5",
  color: "#3B82F6",
  avatar: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80",
  file: null,
  jockey: "",
  status: "active"
}

const colorPalette = [
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  "#14B8A6", "#6366F1", "#84CC16", "#E11D48"
]

export default function Horses() {
  const { horses, addHorse, editHorse, toggleHorseStatus, deleteHorse } = useGameEngine()
  const [viewMode, setViewMode] = useState("grid") // 'grid' or 'table'
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // 'all', 'active', 'inactive'

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultHorseForm)
  const [errorMsg, setErrorMsg] = useState("")

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewJsonTarget, setViewJsonTarget] = useState(null)
  const [copied, setCopied] = useState(false)

  const [toastMessage, setToastMessage] = useState(null)

  function showToast(msg, type = 'success') {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtering
  const filteredHorses = horses.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(h.number).includes(searchQuery) ||
      (h.hindiName && h.hindiName.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || h.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function openCreateModal() {
    setEditingId(null)
    const nextAvailableNumber = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].find(n => !horses.some(h => h.number === n)) || (horses.length + 1)
    setForm({
      ...defaultHorseForm,
      number: String(nextAvailableNumber),
      color: colorPalette[(nextAvailableNumber - 1) % colorPalette.length] || "#3B82F6",
      status: "active",
      file: null
    })
    setErrorMsg("")
    setModalOpen(true)
  }

  function openEditModal(horse) {
    setEditingId(horse.id)
    setForm({
      number: String(horse.number || horse.serialNumber),
      name: horse.name,
      hindiName: horse.hindiName || "",
      odds: String(horse.odds || "3.5"),
      color: horse.color || "#3B82F6",
      avatar: horse.imageUrl || horse.image_url || horse.avatar || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80",
      file: null,
      jockey: horse.jockey || "",
      status: horse.status || "active"
    })
    setErrorMsg("")
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setErrorMsg("Please enter a horse name.")
      return
    }
    const num = Number(form.number)
    if (!num || num < 1 || num > 50) {
      setErrorMsg("Gate serial number must be a valid positive integer.")
      return
    }

    try {
      if (editingId) {
        const res = await editHorse(editingId, {
          name: form.name,
          hindiName: form.hindiName,
          serial_number: num,
          number: num,
          file: form.file,
          image_url: form.avatar,
          imageUrl: form.avatar,
          avatar: form.avatar,
          status: form.status,
          odds: Number(form.odds) || 3.5,
          color: form.color,
          jockey: form.jockey
        })
        showToast(res.message || `Horse #${num} updated successfully`)
      } else {
        const res = await addHorse({
          name: form.name,
          hindiName: form.hindiName,
          serial_number: num,
          number: num,
          file: form.file,
          image_url: form.avatar,
          imageUrl: form.avatar,
          avatar: form.avatar,
          status: form.status,
          odds: Number(form.odds) || 3.5,
          color: form.color,
          jockey: form.jockey
        })
        showToast(res.message || `Horse #${num} created successfully`)
      }
      setModalOpen(false)
    } catch (err) {
      setErrorMsg(err.message || "Failed to save horse")
    }
  }

  async function handleDelete(horse) {
    try {
      const res = await deleteHorse(horse.id)
      showToast(res.message || `Horse #${horse.number} deleted successfully`)
    } catch (err) {
      showToast(err.message || "Failed to delete horse", "error")
    }
    setDeleteTarget(null)
  }

  async function handleInspectHorse(horse) {
    try {
      const liveData = await horseApi.getById(horse.id)
      setViewJsonTarget({
        ...liveData,
        _endpoint: `GET /api/horses/${horse.id}`
      })
    } catch (e) {
      // Offline fallback
      setViewJsonTarget({
        id: horse.id,
        serialNumber: horse.number || horse.serialNumber,
        name: horse.name,
        imageUrl: horse.imageUrl || horse.avatar,
        status: horse.status,
        odds: horse.odds,
        createdAt: horse.createdAt || "2026-09-21T07:30:00.000Z",
        updatedAt: horse.updatedAt || "2026-09-21T07:30:00.000Z",
        _endpoint: `GET /api/horses/${horse.id}`
      })
    }
  }

  const handleCopyJson = (obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-bounce ${toastMessage.type === 'error'
            ? 'bg-danger/20 border-danger/40 text-danger'
            : 'bg-turf/20 border-turf/40 text-turf'
            }`}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-wide text-ink">Horses</h2>
          <p className="text-xs text-mute">Manage runners, odds, gate numbers, and status.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-glow-primary transition-all focus-ring shrink-0"
        >
          <Plus size={16} />
          <span>Add Horse</span>
        </button>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line rounded-2xl p-3 shadow-card">
        {/* Search */}
        <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs w-full sm:w-64">
          <Search size={14} className="text-mute shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, gate #..."
            className="bg-transparent outline-none text-ink placeholder:text-mute w-full"
          />
        </div>

        {/* Status Filter Tabs & View Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-surface2 border border-line rounded-xl p-1 text-xs">
            {["all", "active", "inactive"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${statusFilter === status
                  ? "bg-primary text-white shadow-sm"
                  : "text-mute hover:text-ink"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex bg-surface2 border border-line rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-white shadow-sm" : "text-mute hover:text-ink"
                }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? "bg-primary text-white shadow-sm" : "text-mute hover:text-ink"
                }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredHorses.map((h) => {
            const winRate = ((h.wins / (h.races || 1)) * 100).toFixed(1)
            const backendJson = {
              id: h.id,
              serialNumber: h.number || h.serialNumber,
              name: h.name,
              imageUrl: h.imageUrl || h.avatar,
              status: h.status,
              createdAt: h.createdAt || "2026-09-21T07:30:00.000Z",
              updatedAt: h.updatedAt || "2026-09-21T07:30:00.000Z"
            }

            return (
              <div
                key={h.id}
                className="bg-surface border border-line hover:border-primary/40 rounded-2xl p-5 shadow-card flex flex-col justify-between gap-4 transition-all duration-200 glow-hover relative overflow-hidden group"
              >
                {/* Card Top: Number, Avatar & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-line bg-surface2 shadow-sm flex items-center justify-center">
                        <img
                          src={resolveImageUrl(h.imageUrl || h.avatar)}
                          alt={h.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80'
                          }}
                        />
                      </div>
                      <div
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-lg flex items-center justify-center font-display text-xs font-bold text-white shadow-lg border border-white/20"
                        style={{ backgroundColor: h.color || '#3B82F6' }}
                      >
                        {h.number}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-ink text-sm group-hover:text-primary transition-colors truncate max-w-[140px]">
                        {h.name}
                      </h3>
                      <p className="text-xs text-mute font-mono">{h.status}</p>
                    </div>
                  </div>

                  <Badge tone={h.status === "active" ? "turf" : "danger"} size="sm">
                    {h.status}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 bg-surface2/70 dark:bg-surface2/50 border border-line p-2.5 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mute block">Odds</span>
                    <span className="font-display font-bold text-amber-600 dark:text-gold text-base num">
                      {h.odds || 3.5}x
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mute block">Win %</span>
                    <span className="font-display font-bold text-turf text-base num">
                      {winRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mute block">Wins</span>
                    <span className="font-display font-bold text-ink text-base num">
                      {h.wins}/{h.races}
                    </span>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-line">
                  <button
                    onClick={() => handleInspectHorse(h)}
                    className="flex items-center gap-1 text-[11px] text-mute hover:text-primary font-mono transition-colors"
                    title="View API payload"
                  >
                    <Code2 size={13} />
                    <span>JSON</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleHorseStatus(h.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${h.status === "active"
                        ? "border-line text-mute hover:text-amber-500 hover:bg-amber-500/10"
                        : "border-turf/30 text-turf hover:bg-turf/10"
                        }`}
                      title={h.status === "active" ? "Deactivate Horse" : "Activate Horse"}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => openEditModal(h)}
                      className="p-1.5 rounded-lg border border-line text-mute hover:text-ink hover:bg-surface2 transition-colors focus-ring"
                      title="Edit Horse Details"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(h)}
                      className="p-1.5 rounded-lg border border-line text-mute hover:text-danger hover:bg-danger/10 hover:border-danger/30 transition-colors focus-ring"
                      title="Delete Horse"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider font-semibold text-mute border-b border-line bg-surface2/50">
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Gate</th>
                  <th className="px-5 py-3.5">Runner</th>
                  <th className="px-5 py-3.5">Odds</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5">JSON</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredHorses.map((h) => {
                  const backendJson = {
                    id: h.id,
                    serialNumber: h.number || h.serialNumber,
                    name: h.name,
                    imageUrl: h.imageUrl || h.avatar,
                    status: h.status,
                    createdAt: h.createdAt || "2026-09-21T07:30:00.000Z",
                    updatedAt: h.updatedAt || "2026-09-21T07:30:00.000Z"
                  }

                  return (
                    <tr key={h.id} className="hover:bg-surface2/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-mute font-bold">
                        #{h.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white shadow-sm"
                          style={{ backgroundColor: h.color || '#3B82F6' }}
                        >
                          {h.number}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-line bg-surface2 shadow-sm shrink-0 flex items-center justify-center">
                            <img
                              src={resolveImageUrl(h.imageUrl || h.avatar)}
                              alt={h.name}
                              className="w-full h-full object-cover object-center"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80'
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-ink">{h.name}</div>
      
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-display font-bold text-amber-600 dark:text-gold text-base num">
                        {h.odds || 3.5}x
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={h.status === "active" ? "turf" : "danger"} size="sm">
                          {h.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-mute font-mono">
                        {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : "2026-09-21"}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleInspectHorse(h)}
                          className="px-2 py-1 rounded bg-surface2 hover:bg-surface3 border border-line text-[11px] font-mono text-mute hover:text-ink flex items-center gap-1"
                          title="Fetch live GET /api/horses/:id"
                        >
                          <Code2 size={12} />
                          <span>View</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleHorseStatus(h.id)}
                            className="p-1.5 rounded-lg text-mute hover:text-ink hover:bg-surface2 transition-colors"
                            title="Toggle Status"
                          >
                            <Power size={15} />
                          </button>
                          <button
                            onClick={() => openEditModal(h)}
                            className="p-1.5 rounded-lg text-mute hover:text-ink hover:bg-surface2 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(h)}
                            className="p-1.5 rounded-lg text-mute hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal (All JSON options) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? `Edit Runner #${editingId}` : 'Add New Horse'}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-glow-primary transition-all focus-ring"
            >
              {editingId ? 'Update Horse' : 'Create Horse'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Gate Number</span>
              <input
                type="number"
                min={1}
                max={50}
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary font-mono"
                placeholder="e.g. 13"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Status</span>
              <div className="flex bg-surface2 border border-line rounded-xl p-1 text-xs">
                {["active", "inactive"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setForm({ ...form, status: st })}
                    className={`flex-1 py-1.5 rounded-lg capitalize font-bold transition-colors ${form.status === st
                      ? st === 'active'
                        ? 'bg-turf text-white shadow-sm'
                        : 'bg-danger text-white shadow-sm'
                      : 'text-mute hover:text-ink'
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-xs">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Horse Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              placeholder="e.g. Chetak Pro"
            />
          </label>

          <ImageUploader
            value={form.avatar}
            onChange={(newImg, newFile) => setForm({ ...form, avatar: newImg, file: newFile })}
            badgeNumber={form.number}
            badgeColor={form.color}
            label="Horse Avatar Image (Upload / Presets)"
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Base Odds (Nx)</span>
              <input
                type="number"
                step="0.1"
                value={form.odds}
                onChange={(e) => setForm({ ...form, odds: e.target.value })}
                className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary font-mono"
                placeholder="e.g. 3.5"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Jockey</span>
              <input
                value={form.jockey}
                onChange={(e) => setForm({ ...form, jockey: e.target.value })}
                className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                placeholder="e.g. Vikram Rathore"
              />
            </label>
          </div>

          <div>
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px] block mb-2">Silk Color</span>
            <div className="flex flex-wrap gap-2">
              {colorPalette.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setForm({ ...form, color: col })}
                  className={`w-7 h-7 rounded-lg border-2 transition-transform ${form.color === col
                    ? "scale-110 border-white dark:border-slate-300 shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* View Raw JSON Payload Modal */}
      <Modal
        open={!!viewJsonTarget}
        onClose={() => setViewJsonTarget(null)}
        title="API Response Payload"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-mute font-mono">Endpoint: /api/horses/{viewJsonTarget?.id}</span>
            <button
              onClick={() => handleCopyJson(viewJsonTarget)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-all shadow-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy JSON"}</span>
            </button>
          </div>
        }
      >
        {viewJsonTarget && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-line leading-relaxed">
              <pre>{JSON.stringify(viewJsonTarget, null, 2)}</pre>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete / Retire Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
        title="Retire / Remove Runner"
        description={`Remove "${deleteTarget?.name}" (Gate #${deleteTarget?.number})? This action cannot be undone.`}
        confirmLabel="Remove Horse"
      />
    </div>
  )
}
