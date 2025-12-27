import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

    try {
      // Query Supabase for the user
      const { data: foundUser, error } = await supabase
        .from("app_users")
        .select("*")
        .or(`name.eq.${cleanIdentifier},email.eq.${cleanIdentifier}`)
        .eq("password", cleanPass)
        .single();

      if (error || !foundUser) {
        toast.error("Invalid Username or Password");
        return false;
      }

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
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
      return false;
    }
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
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error (getAllUsers):", error);
        throw error;
      }
      return (data || []).map(u => ({
        name: u.name,
        email: u.email,
        role: "user" as const
      }));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(`Database Error: ${error.message || "Table 'app_users' not found"}`);
      return [];
    }
  };

  const addUser = async (name: string, email: string, pass: string) => {
    console.log(`AuthContext: Attempting to add user ${email} to Supabase...`);
    try {
      const { error } = await supabase
        .from("app_users")
        .insert([{ name, email, password: pass }]);

      if (error) {
        console.error("Supabase Error (addUser):", error);
        if (error.code === "23505") { // Unique violation
          toast.error("User with this email already exists");
        } else {
          throw error;
        }
        return;
      }
      toast.success("User added successfully");
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error(`Database Error: ${error.message || "Could not reach database"}. Please check your Supabase SQL Editor.`);
    }
  };

  const deleteUser = async (email: string) => {
    try {
      const { error } = await supabase
        .from("app_users")
        .delete()
        .eq("email", email);

      if (error) throw error;
      toast.success("User deleted successfully");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(`Delete failed: ${error.message || "Unknown error"}`);
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
