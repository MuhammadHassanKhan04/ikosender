import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type User = {
  name: string;
  email: string;
  password?: string; // stored for checking, but usually shouldn't be exposed
  role: "user" | "admin";
};

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loginAdmin: (email: string, pass: string) => boolean;
  loginUser: (nameOrEmail: string, pass: string) => Promise<boolean>;
  logout: () => void;
  // Admin functions
  getAllUsers: () => Promise<User[]>;
  addUser: (name: string, email: string, pass: string) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { supabase } from "@/integrations/supabase/client";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Load user from session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("ikosender_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsAdmin(parsed.role === "admin");
      } catch (e) {
        localStorage.removeItem("ikosender_user");
      }
    }
  }, []);

  const loginAdmin = (email: string, pass: string) => {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    // Hardcoded Admin Credentials
    if (cleanEmail === "ikoteksolutions@gmail.com" && cleanPass === "09876543") {
      const adminUser: User = { name: "Admin", email: cleanEmail, role: "admin" };
      setUser(adminUser);
      setIsAdmin(true);
      localStorage.setItem("ikosender_user", JSON.stringify(adminUser));
      toast.success("Welcome back, Admin!");
      return true;
    }
    toast.error("Invalid Admin Credentials");
    return false;
  };

  const loginUser = async (nameOrEmail: string, pass: string) => {
    const cleanIdentifier = nameOrEmail.trim();
    const cleanPass = pass.trim();

    // Check if it's the Admin trying to login through the main user login
    if (cleanIdentifier === "ikoteksolutions@gmail.com" && cleanPass === "09876543") {
      return loginAdmin(cleanIdentifier, cleanPass);
    }

    // Check against Supabase for normal users
    const { data: foundUser, error } = await supabase
      .from("user_registry" as any)
      .select("*")
      .or(`name.eq.${cleanIdentifier},email.eq.${cleanIdentifier}`)
      .eq("password", cleanPass)
      .single();

    if (foundUser) {
      const sessionUser: User = {
        name: foundUser.name,
        email: foundUser.email,
        role: "user"
      };
      setUser(sessionUser);
      setIsAdmin(false);
      localStorage.setItem("ikosender_user", JSON.stringify(sessionUser));
      toast.success(`Welcome back, ${foundUser.name}!`);
      return true;
    }

    if (error && error.code !== "PGRST116") {
      console.error("Supabase Auth Error:", error);
    }

    // Fallback to LocalStorage for backward compatibility
    const storedUsersStr = localStorage.getItem("ikosender_db_users");
    const storedUsers: any[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];

    const foundUserLocal = storedUsers.find(
      (u) => (u.name === cleanIdentifier || u.email === cleanIdentifier) && u.password === cleanPass
    );

    if (foundUserLocal) {
      const sessionUser: User = {
        name: foundUserLocal.name,
        email: foundUserLocal.email,
        role: "user"
      };
      setUser(sessionUser);
      setIsAdmin(false);
      localStorage.setItem("ikosender_user", JSON.stringify(sessionUser));
      toast.success(`Welcome back, ${foundUserLocal.name}!`);
      return true;
    }

    toast.error("Invalid Username or Password");
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("ikosender_user");
    navigate("/");
    toast.success("Logged out successfully");
  };

  // Admin Tools
  const getAllUsers = async () => {
    const { data, error } = await supabase
      .from("user_registry" as any)
      .select("*");

    if (error) {
      console.error("Fetch Users Error:", error);
      // Fallback
      const storedUsersStr = localStorage.getItem("ikosender_db_users");
      const users = storedUsersStr ? JSON.parse(storedUsersStr) : [];
      return users.map((u: any) => ({
        name: u.name,
        email: u.email,
        role: "user" as const
      }));
    }

    return (data || []).map((u: any) => ({
      name: u.name,
      email: u.email,
      role: "user" as const
    }));
  };

  const addUser = async (name: string, email: string, pass: string) => {
    const { data: existing } = await supabase
      .from("user_registry" as any)
      .select("email")
      .eq("email", email)
      .single();

    if (existing) {
      toast.error("User with this email already exists in Global DB");
      return;
    }

    const { error } = await supabase
      .from("user_registry" as any)
      .insert([{ name, email, password: pass }]);

    if (!error) {
      toast.success("User added successfully to Global DB");
    } else {
      console.error("Add User Error:", error);
      toast.error("Failed to add user to Global DB. Check console for details.");
    }
  };

  const deleteUser = async (email: string) => {
    const { error } = await supabase
      .from("user_registry" as any)
      .delete()
      .eq("email", email);

    if (!error) {
      toast.success("User deleted globally");
    } else {
      console.error("Delete User Error:", error);
      toast.error("Failed to delete user globally");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loginAdmin,
        loginUser,
        logout,
        getAllUsers,
        addUser,
        deleteUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
