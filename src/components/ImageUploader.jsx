import { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, Trash2, Check, Sparkles, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { resolveImageUrl } from '../utils/imageUrl.js'

// Curated high-res Champion Horse Avatars for 1-click presets
const PRESET_HORSE_AVATARS = [
  {
    id: 'stallion-black',
    name: 'Midnight Stallion',
    url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'arabian-white',
    name: 'Royal Arabian',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'chestnut-thunder',
    name: 'Golden Chestnut',
    url: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'wild-mustang',
    name: 'Wild Mustang',
    url: 'https://images.unsplash.com/photo-1588693951525-6b9b32cfa8a6?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'thunder-bolt',
    name: 'Thunder Bolt',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'flame-runner',
    name: 'Flame Runner',
    url: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=300&auto=format&fit=crop&q=80'
  }
]

export default function ImageUploader({
  value = "",
  onChange,
  badgeNumber,
  badgeColor = '#3B82F6',
  label = "Horse Image / Avatar"
}) {
  const [activeTab, setActiveTab] = useState("upload") // 'upload' | 'url' | 'presets'
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : "")
  const fileInputRef = useRef(null)

  // Smart compression helper to keep base64 ultra-light (~20-40KB) and fast
  const processImageFile = (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError("Kripya valid image file chunein (PNG, JPG, JPEG, WEBP, SVG).")
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File size 15MB se badi hai. Kripya choti image upload karein.")
      return
    }

    setUploadError("")
    setFileName(file.name)
    setFileSize((file.size / 1024).toFixed(1) + " KB")

    const reader = new FileReader()
    reader.onerror = () => {
      setUploadError("Image read karne me error aayi.")
    }

    reader.onload = (e) => {
      const rawDataUrl = e.target.result
      if (!rawDataUrl) {
        setUploadError("Image data generate nahi ho payi.")
        return
      }

      // Optimize image through HTML5 canvas
      try {
        const img = new Image()
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            const MAX_SIZE = 360 // optimal for avatars and fast network transfer
            let width = img.width
            let height = img.height

            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width)
                width = MAX_SIZE
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height)
                height = MAX_SIZE
              }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            const optimizedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)
            onChange(optimizedDataUrl, file)
          } catch (canvasErr) {
            // Fallback to raw data url if canvas security or context fails
            onChange(rawDataUrl, file)
          }
        }
        img.onerror = () => {
          onChange(rawDataUrl, file)
        }
        img.src = rawDataUrl
      } catch (err) {
        onChange(rawDataUrl, file)
      }
    }

    reader.readAsDataURL(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
    // Reset input so same file can be re-selected if needed
    e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleRemoveImage = (e) => {
    e?.stopPropagation()
    onChange("", null)
    setFileName("")
    setFileSize("")
    setUrlInput("")
  }

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim(), null)
      setFileName("Online URL")
      setFileSize("Web")
      setUploadError("")
    }
  }

  return (
    <div className="flex flex-col gap-3 bg-surface border border-line rounded-2xl p-4 shadow-sm">
      {/* Header with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-primary" />
          <span className="font-bold text-ink text-xs uppercase tracking-wider">
            {label}
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-surface2 border border-line rounded-xl p-1 text-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === "upload"
              ? "bg-primary text-white shadow-sm"
              : "text-mute hover:text-ink"
              }`}
          >
            <UploadCloud size={14} />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === "presets"
              ? "bg-primary text-white shadow-sm"
              : "text-mute hover:text-ink"
              }`}
          >
            <Sparkles size={14} />
            <span>Presets Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === "url"
              ? "bg-primary text-white shadow-sm"
              : "text-mute hover:text-ink"
              }`}
          >
            <LinkIcon size={14} />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Left: Preview Box with Horse Number Badge */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 rounded-2xl border-2 border-line bg-surface2 overflow-hidden shadow-inner flex items-center justify-center relative">
            {value ? (
              <img
                src={resolveImageUrl(value)}
                alt="Horse Preview"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&auto=format&fit=crop&q=80'
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-mute gap-1 p-2 text-center">
                <ImageIcon size={28} className="opacity-40" />
                <span className="text-[10px] font-bold uppercase text-mute">No Image</span>
              </div>
            )}
          </div>

          {/* Horse Gate Serial Badge */}
          {badgeNumber && (
            <div
              className="absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center font-display text-xs font-bold text-white shadow-lg border border-white/20"
              style={{ backgroundColor: badgeColor }}
            >
              {badgeNumber}
            </div>
          )}

          {/* Delete Image Button */}
          {value && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-danger/90 hover:bg-danger text-white shadow-md transition-transform hover:scale-110"
              title="Remove Current Image"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Right Tab 1: File Upload (Drag & Drop + Native File Picker) */}
        {activeTab === "upload" && (
          <div className="flex-1 w-full flex flex-col gap-2">
            <input
              id="horse-image-upload-input"
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />

            <label
              htmlFor="horse-image-upload-input"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all ${isDragging
                ? "border-primary bg-primary/10 scale-[0.99]"
                : "border-line hover:border-primary hover:bg-surface2/60"
                }`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UploadCloud size={22} />
              </div>

              <div>
                <span className="text-xs font-bold text-ink block">
                  {fileName ? fileName : "Click to Browse or Drag Image Here"}
                </span>
                <span className="text-[11px] text-mute block mt-0.5">
                  {fileSize ? `File size: ${fileSize}` : "Supports PNG, JPG, JPEG, WEBP (Instant Auto-Crop)"}
                </span>
              </div>

              <span className="px-3 py-1 bg-primary text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-primary-hover transition-colors">
                Choose Image File
              </span>
            </label>

            {value && value.startsWith('data:image') && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-turf bg-turf/10 px-3 py-1.5 rounded-xl border border-turf/20">
                <Check size={14} />
                <span>Image successfully loaded and ready to save!</span>
              </div>
            )}
          </div>
        )}

        {/* Right Tab 2: Curated 3D Presets */}
        {activeTab === "presets" && (
          <div className="flex-1 w-full flex flex-col gap-2">
            <div className="text-[11px] font-semibold text-mute">Select any Champion Stallion:</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_HORSE_AVATARS.map((preset) => {
                const isSelected = value === preset.url
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onChange(preset.url)
                      setFileName(preset.name)
                      setFileSize("HD Preset")
                      setUploadError("")
                    }}
                    className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-square p-0.5 ${isSelected
                      ? "border-primary shadow-glow-primary scale-105"
                      : "border-line hover:border-primary/50 opacity-85 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/40 backdrop-blur-[1px] flex items-center justify-center text-white">
                        <Check size={18} className="drop-shadow font-bold" />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-white text-center py-0.5 truncate px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {preset.name}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Right Tab 3: Custom URL */}
        {activeTab === "url" && (
          <div className="flex-1 w-full flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-mute">Paste direct image link:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/horse.png"
                className="flex-1 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary font-mono"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Apply
              </button>
            </div>
            <span className="text-[10px] text-mute">Paste any external image URL and click Apply.</span>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  )
}
