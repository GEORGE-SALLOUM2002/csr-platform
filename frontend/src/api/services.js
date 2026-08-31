/**
 * دوال الاتصال بالـ API مجمّعة حسب القسم — تُستدعى من الصفحات.
 * كل دالة تعيد وعد axios (response.data يحتوي البيانات).
 */
import client from "./client";

const form = { headers: { "Content-Type": "multipart/form-data" } };

// ---------------- المصادقة والحسابات ----------------
export const AuthAPI = {
  login: (email, password) => client.post("/auth/login/", { email, password }),
  register: (data) => client.post("/auth/register/", data),
  me: () => client.get("/auth/me/"),
  myProfile: () => client.get("/auth/me/profile/"),
  updateProfile: (data, isForm = false) =>
    client.patch("/auth/me/profile/", data, isForm ? form : {}),
  changePassword: (data) => client.post("/auth/change-password/", data),
};

// ---------------- دليل الأطباء ----------------
export const DoctorsAPI = {
  list: (params) => client.get("/doctors/", { params }),
  get: (id) => client.get(`/doctors/${id}/`),
};

// ---------------- المكتبة ----------------
export const LibraryAPI = {
  categories: () => client.get("/categories/"),
  resources: (params) => client.get("/resources/", { params }),
  resource: (id) => client.get(`/resources/${id}/`),
  create: (data) => client.post("/resources/", data, form),
  mine: () => client.get("/resources/mine/"),
  pending: () => client.get("/resources/pending/"),
  review: (id, action, reason = "") =>
    client.post(`/resources/${id}/review/`, { action, rejection_reason: reason }),
  remove: (id) => client.delete(`/resources/${id}/`),
};

// ---------------- المحتوى العام ----------------
export const ContentAPI = {
  news: (params) => client.get("/news/", { params }),
  createNews: (data) => client.post("/news/", data, form),
  updateNews: (id, data) => client.patch(`/news/${id}/`, data, form),
  deleteNews: (id) => client.delete(`/news/${id}/`),

  activities: (params) => client.get("/activities/", { params }),
  activity: (id) => client.get(`/activities/${id}/`),
  createActivity: (data) => client.post("/activities/", data, form),
  updateActivity: (id, data) => client.patch(`/activities/${id}/`, data, form),
  deleteActivity: (id) => client.delete(`/activities/${id}/`),
  createActivityFile: (data) => client.post("/activity-files/", data, form),
  deleteActivityFile: (id) => client.delete(`/activity-files/${id}/`),

  board: () => client.get("/board/"),
  createBoard: (data) => client.post("/board/", data, form),
  deleteBoard: (id) => client.delete(`/board/${id}/`),

  announcements: (params) => client.get("/announcements/", { params }),
  createAnnouncement: (data) => client.post("/announcements/", data),
  updateAnnouncement: (id, data) => client.patch(`/announcements/${id}/`, data),
  deleteAnnouncement: (id) => client.delete(`/announcements/${id}/`),

  patientTopics: (params) => client.get("/patient-topics/", { params }),
  createPatientTopic: (data) => client.post("/patient-topics/", data),
  deletePatientTopic: (id) => client.delete(`/patient-topics/${id}/`),

  sendContact: (data) => client.post("/contact/", data),

  siteSettings: () => client.get("/site-settings/"),
  updateSiteSettings: (data) => client.patch("/site-settings/", data),
};

// ---------------- إدارة الحسابات (مدير النظام) ----------------
export const AdminAPI = {
  users: (params) => client.get("/admin/users/", { params }),
  get: (id) => client.get(`/admin/users/${id}/`),
  approve: (id) => client.post(`/admin/users/${id}/approve/`, {}),
  reject: (id, reason = "") => client.post(`/admin/users/${id}/reject/`, { reason }),
  toggleActive: (id) => client.post(`/admin/users/${id}/toggle_active/`, {}),
  remove: (id) => client.delete(`/admin/users/${id}/`),
  createEditor: (data) => client.post("/admin/users/create_editor/", data),
};
