/** تعريف كل مسارات التطبيق داخل التخطيط ذي الشريط الجانبي. */
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// صفحات عامة
import Home from "./pages/Home";
import Library from "./pages/Library";
import ResourceDetail from "./pages/ResourceDetail";
import Doctors from "./pages/Doctors";
import DoctorDetail from "./pages/DoctorDetail";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import News from "./pages/News";
import Patients from "./pages/Patients";
import Board from "./pages/Board";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// مصادقة
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// لوحة التحكم
import DashboardHome from "./pages/dashboard/DashboardHome";
import DoctorProfilePage from "./pages/dashboard/DoctorProfilePage";
import ChangePassword from "./pages/dashboard/ChangePassword";
import UploadResource from "./pages/dashboard/UploadResource";
import MyResources from "./pages/dashboard/MyResources";
import ReviewContent from "./pages/dashboard/ReviewContent";
import ManageNews from "./pages/dashboard/ManageNews";
import ManageAnnouncements from "./pages/dashboard/ManageAnnouncements";
import ManageAccounts from "./pages/dashboard/ManageAccounts";
import ManageMembers from "./pages/dashboard/ManageMembers";
import ManageEditors from "./pages/dashboard/ManageEditors";
import ManagePatients from "./pages/dashboard/ManagePatients";
import ManageActivities from "./pages/dashboard/ManageActivities";
import ManageSiteSettings from "./pages/dashboard/ManageSiteSettings";

const STAFF = ["EDITOR", "ADMIN"];
const CONTRIB = ["DOCTOR", "EDITOR", "ADMIN"];

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* ------- عام ------- */}
        <Route index element={<Home />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<ResourceDetail />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="doctors/:id" element={<DoctorDetail />} />
        <Route path="activities" element={<Activities />} />
        <Route path="activities/:id" element={<ActivityDetail />} />
        <Route path="news" element={<News />} />
        <Route path="patients" element={<Patients />} />
        <Route path="board" element={<Board />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />

        {/* ------- مصادقة ------- */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* ------- لوحة التحكم ------- */}
        <Route path="dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
        <Route path="dashboard/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="dashboard/profile" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorProfilePage /></ProtectedRoute>} />
        <Route path="dashboard/upload" element={<ProtectedRoute roles={CONTRIB}><UploadResource /></ProtectedRoute>} />
        <Route path="dashboard/my-resources" element={<ProtectedRoute roles={CONTRIB}><MyResources /></ProtectedRoute>} />
        <Route path="dashboard/review" element={<ProtectedRoute roles={STAFF}><ReviewContent /></ProtectedRoute>} />
        <Route path="dashboard/news" element={<ProtectedRoute roles={STAFF}><ManageNews /></ProtectedRoute>} />
        <Route path="dashboard/announcements" element={<ProtectedRoute roles={STAFF}><ManageAnnouncements /></ProtectedRoute>} />
        <Route path="dashboard/accounts" element={<ProtectedRoute roles={STAFF}><ManageAccounts /></ProtectedRoute>} />
        <Route path="dashboard/members" element={<ProtectedRoute roles={["ADMIN"]}><ManageMembers /></ProtectedRoute>} />
        <Route path="dashboard/editors" element={<ProtectedRoute roles={["ADMIN"]}><ManageEditors /></ProtectedRoute>} />
        <Route path="dashboard/patients" element={<ProtectedRoute roles={STAFF}><ManagePatients /></ProtectedRoute>} />
        <Route path="dashboard/activities" element={<ProtectedRoute roles={STAFF}><ManageActivities /></ProtectedRoute>} />
        <Route path="dashboard/site-settings" element={<ProtectedRoute roles={STAFF}><ManageSiteSettings /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
