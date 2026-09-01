import './AppSpinner.css';

// Kept local to the admin frontend; this mirrors the client application's loader style.
export default function AppSpinner({ small = false, color = 'var(--admin-spinner-color)', label = '', className = '' }) {
  const size = small ? 16 : 38;
  return (
    <span className={`admin-spinner ${small ? 'admin-spinner--small' : ''} ${className}`} role="status" aria-label={label || 'Loading'} style={{ '--admin-spinner-ink': color }}>
      <span className="admin-spinner__ring" style={{ width: size, height: size }} aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <span key={index} className="admin-spinner__dot" style={{ transform: `rotate(${index * 30}deg) translateY(-${size * .36}px)`, animationDelay: `${index * .1}s` }} />)}
      </span>
      {label && <span className="admin-spinner__label">{label}</span>}
    </span>
  );
}
