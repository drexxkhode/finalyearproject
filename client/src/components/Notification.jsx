export default function Notification({ notif }) {
  if (!notif) return null
  return (
    <div className={`tf-toast ${notif.type === 's' ? 'tf-toast-success' : 'tf-toast-error'}`}>
      {notif.msg}
    </div>
  )
}
