import { useState } from 'react'
import { TURF_PHOTOS } from '../data/turfs'

export default function Gallery({ turfId }) {
  const [idx, setIdx] = useState(0)
  const photos = TURF_PHOTOS[turfId] || []
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length)
  const next = () => setIdx(i => (i + 1) % photos.length)

  return (
    <div className="mb-3">
      <div className="tf-gallery-main">
        <img
          src={photos[idx]}
          alt="turf"
          onError={e => { e.target.src = TURF_PHOTOS[1][0] }}
        />
        <div className="tf-gallery-overlay" />
        {photos.length > 1 && (
          <>
            <button className="tf-gallery-btn tf-gallery-btn-prev" onClick={prev}>&#8249;</button>
            <button className="tf-gallery-btn tf-gallery-btn-next" onClick={next}>&#8250;</button>
          </>
        )}
        <div className="tf-gallery-counter">{idx + 1}/{photos.length}</div>
      </div>
      <div className="tf-thumb-strip">
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`thumb ${i + 1}`}
            className={`tf-thumb${i === idx ? ' active' : ''}`}
            onClick={() => setIdx(i)}
            onError={e => { e.target.style.display = 'none' }}
          />
        ))}
      </div>
    </div>
  )
}
