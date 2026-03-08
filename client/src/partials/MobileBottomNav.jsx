import { useNavigate, useLocation } from "react-router-dom";

export default function MobileBottomNav({ TABS, activeTab, handleTabChange }) {
  const location = useLocation();

  // Only show on home route
  if (location.pathname !== "/") return null;

  return (
    <div className="tf-bottom-nav d-md-none">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`tf-bottom-btn${activeTab === t.key ? " active" : ""}`}
          onClick={() => handleTabChange(t.key)}
        >
          <i className={`bi ${t.icon} tf-bottom-btn-icon`}></i>
          {t.label.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}
