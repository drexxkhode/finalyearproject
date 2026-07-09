import SuperAdminDashboard from "./Layout/SuperAdmin/SuperAdminDasboard";
import ManagerDashboard from "./Layout/TurfManager/ManagerDashboard";

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    switch (user?.role) {
        case "Super_admin":
            return <SuperAdminDashboard />;

        case "Manager":
            return <ManagerDashboard />;

        case "Staff":
            return <ManagerDashboard />;

        default:
            return <h3>Unauthorized</h3>;
    }
};

export default Dashboard;