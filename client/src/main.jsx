import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

// StrictMode removed — it double-invokes effects in dev which breaks
// long-lived connections like Socket.io
ReactDOM.createRoot(document.getElementById('root')).render(<App />)