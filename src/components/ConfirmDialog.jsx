import Modal from './Modal.jsx'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description,
  confirmLabel = "Confirm",
  confirmTone = "danger",
}) {
  const toneClasses =
    confirmTone === "danger"
      ? "bg-danger hover:bg-danger-hover text-white shadow-glow-danger"
      : "bg-primary hover:bg-primary-hover text-white shadow-glow-primary"

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger shrink-0">
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm text-mute leading-relaxed pt-1">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-line">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-mute hover:text-ink hover:bg-surface2 transition-colors focus-ring"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all focus-ring ${toneClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
