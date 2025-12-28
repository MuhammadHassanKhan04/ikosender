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

const MONGODB_DATA_API_URL = import.meta.env.VITE_MONGODB_DATA_API_URL || "";
const MONGODB_API_KEY = import.meta.env.VITE_MONGODB_API_KEY || "";
const MONGODB_CLUSTER = "Cluster0";
const MONGODB_DATABASE = "ikosender";
const MONGODB_COLLECTION = "users";

const mongoFetch = async (action: string, body: any) => {
  if (!MONGODB_DATA_API_URL || !MONGODB_API_KEY) {
    console.warn("MongoDB Credentials missing in .env. Login will use LocalDB fallback.");
    return null;
  }

  try {
    const response = await fetch(`${MONGODB_DATA_API_URL}/action/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": MONGODB_API_KEY,
      },
      body: JSON.stringify({
        dataSource: MONGODB_CLUSTER,
        database: MONGODB_DATABASE,
        collection: MONGODB_COLLECTION,
        ...body,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error(`MongoDB ${action} error:`, error);
    return null;
  }
};

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

    // Check against MongoDB Global DB
    const mongoRes = await mongoFetch("findOne", {
      filter: {
        $or: [{ name: cleanIdentifier }, { email: cleanIdentifier }],
        password: cleanPass
      }
    });

    if (mongoRes?.document) {
      const foundUser = mongoRes.document;
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
    const mongoRes = await mongoFetch("find", { filter: {} });
    let users = [];

    if (mongoRes?.documents) {
      users = mongoRes.documents;
    } else {
      // Local DB Fallback
      const storedUsersStr = localStorage.getItem("ikosender_db_users");
      users = storedUsersStr ? JSON.parse(storedUsersStr) : [];
    }

    return users.map((u: any) => ({
      name: u.name,
      email: u.email,
      role: "user" as const
    }));
  };

  const addUser = async (name: string, email: string, pass: string) => {
    // Check if exists in Global DB
    const existing = await mongoFetch("findOne", { filter: { email } });
    if (existing?.document) {
      toast.error("User with this email already exists in Global DB");
      return;
    }

    // Add to Global DB
    const mongoRes = await mongoFetch("insertOne", {
      document: { name, email, password: pass, created_at: new Date().toISOString() }
    });

    if (mongoRes?.insertedId) {
      toast.success("User added successfully to Global DB");
    } else {
      // Fallback to local
      const currentUsersStr = localStorage.getItem("ikosender_db_users");
      const currentUsers = currentUsersStr ? JSON.parse(currentUsersStr) : [];
      const newUserObj = { name, email, password: pass };
      const updatedUsers = [...currentUsers, newUserObj];
      localStorage.setItem("ikosender_db_users", JSON.stringify(updatedUsers));
      toast.success("Added to Local DB (Global Sync Failed)");
    }
  };

  const deleteUser = async (email: string) => {
    // Delete from Global DB
    await mongoFetch("deleteOne", { filter: { email } });

    // Delete from Local DB
    const currentUsersStr = localStorage.getItem("ikosender_db_users");
    const currentUsers = currentUsersStr ? JSON.parse(currentUsersStr) : [];
    const updatedUsers = currentUsers.filter((u: any) => u.email !== email);
    localStorage.setItem("ikosender_db_users", JSON.stringify(updatedUsers));
    toast.success("User deleted globally and locally");
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
