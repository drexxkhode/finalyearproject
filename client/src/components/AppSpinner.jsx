export default function AppSpinner({
  small = false,
  color = 'var(--tf-blue)',
  fullScreen = false,
  overlay = false,
  className = '',
  label = '',
  size,
}) {
  const dotCount = 12
  const spinnerSize = size ?? (small ? 16 : 42)
  const dots = Array.from({ length: dotCount })
  const spinner = (
    <span
      className={`client-spinner-wrap ${small ? 'client-spinner-small' : ''} ${className}`}
      role="status"
      aria-label={label || 'Loading'}
      style={{ '--client-spinner-color': color }}
    >
      <span className="client-spinner-ring" style={{ width: spinnerSize, height: spinnerSize }} aria-hidden="true">
        {dots.map((_, index) => (
          <span
            key={index}
            className="client-spinner-dot"
            style={{
              transform: `rotate(${index * (360 / dotCount)}deg) translateY(-${spinnerSize * 0.36}px)`,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </span>
      {label && <span className="client-spinner-label">{label}</span>}
    </span>
  )

  if (small) return spinner
  if (fullScreen) return <div className="client-spinner-screen">{spinner}</div>
  if (overlay) return <div className="client-spinner-overlay">{spinner}</div>
  return <div className="client-spinner-box">{spinner}</div>
}
