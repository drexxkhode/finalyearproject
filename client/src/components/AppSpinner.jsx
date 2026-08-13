import {FadeLoader } from 'react-spinners'

// Keep spinner styling in one place so it can be changed globally.
const SPINNER_COLOR = 'var(--tf-blue)'

export default function AppSpinner({ small = false, color = SPINNER_COLOR, className = '' }) {
  return (
    <span className={`tf-spinner ${small ? 'tf-spinner-small' : ''} ${className}`} aria-label="Loading">
      <FadeLoader
        color={color}
        size={small ? 5 : 10}
        margin={small ? 2 : 4}
        speedMultiplier={small ? 1.2 : 1}
      />
    </span>
  )
}
