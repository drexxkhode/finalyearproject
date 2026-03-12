// Gallery.jsx
// Receives images array from API (turf_images table).
// Falls back to placeholder if no images uploaded yet.
import { useState } from 'react'

const FALLBACK = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80'

export default function Gallery({ images = [] }) {
  const [idx, setIdx] = useState(0)

  // Sort: cover first, then by sort_order
  const sorted = [...images].sort((a, b) => {
    if (b.is_cover !== a.is_cover) return b.is_cover - a.is_cover
    return a.sort_order - b.sort_order
  })

  const photos  = sorted.length > 0 ? sorted.map(i => i.url) : [FALLBACK]
  const prev    = () => setIdx(i => (i - 1 + photos.length) % photos.length)
  const next    = () => setIdx(i => (i + 1) % photos.length)
  // Reset index when images change (e.g. navigating between turfs)
  const safeIdx = Math.min(idx, photos.length - 1)

  return (
    <div className="mb-3">
      <div className="tf-gallery-main">
        <img
          src={photos[safeIdx]}
          alt="turf"
          onError={e => { e.target.src = FALLBACK }}
        />
        <div className="tf-gallery-overlay" />
        {photos.length > 1 && (
          <>
            <button className="tf-gallery-btn tf-gallery-btn-prev" onClick={prev}>&#8249;</button>
            <button className="tf-gallery-btn tf-gallery-btn-next" onClick={next}>&#8250;</button>
          </>
        )}
        <div className="tf-gallery-counter">{safeIdx + 1}/{photos.length}</div>
      </div>
      <div className="tf-thumb-strip">
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`thumb ${i + 1}`}
            className={`tf-thumb${i === safeIdx ? ' active' : ''}`}
            onClick={() => setIdx(i)}
            onError={e => { e.target.style.display = 'none' }}
          />
        ))}
      </div>
    </div>
  )
}