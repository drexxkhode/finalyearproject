// pages/ProfileRouter.js
import Profile from "./Layout/TurfManager/Profile";
import SuperAdminProfile from "./Layout/SuperAdmin/Profile";

const ProfileRouter = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.role === "Super_admin" ? <SuperAdminProfile /> : <Profile />;
};

export default ProfileRouter;