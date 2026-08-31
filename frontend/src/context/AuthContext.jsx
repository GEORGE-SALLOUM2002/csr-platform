/**
 * سياق المصادقة: يحفظ بيانات المستخدم الحالي ويوفّر دوال الدخول/الخروج/التسجيل.
 * التوكنات تُحفظ في localStorage ويقرأها عميل axios تلقائياً.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../api/services";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("csr-access");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await AuthAPI.me();
      setUser(res.data);
    } catch (e) {
      // التوكن غير صالح — نتجاهل
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const res = await AuthAPI.login(email, password);
    localStorage.setItem("csr-access", res.data.access);
    localStorage.setItem("csr-refresh", res.data.refresh);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = (data) => AuthAPI.register(data);

  const logout = () => {
    localStorage.removeItem("csr-access");
    localStorage.removeItem("csr-refresh");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser: loadMe,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    isEditor: user?.role === "EDITOR",
    isDoctor: user?.role === "DOCTOR",
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
