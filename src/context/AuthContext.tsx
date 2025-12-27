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
  loginUser: (nameOrEmail: string, pass: string) => boolean;
  logout: () => void;
  // Admin functions
  getAllUsers: () => User[];
  addUser: (name: string, email: string, pass: string) => void;
  deleteUser: (email: string) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Load user from session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("mail_maven_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsAdmin(parsed.role === "admin");
      } catch (e) {
        localStorage.removeItem("mail_maven_user");
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
      localStorage.setItem("mail_maven_user", JSON.stringify(adminUser));
      toast.success("Welcome back, Admin!");
      return true;
    }
    toast.error("Invalid Admin Credentials");
    return false;
  };

  const loginUser = (nameOrEmail: string, pass: string) => {
    const cleanIdentifier = nameOrEmail.trim();
    const cleanPass = pass.trim();

    // Check if it's the Admin trying to login through the main user login
    if (cleanIdentifier === "ikoteksolutions@gmail.com" && cleanPass === "09876543") {
      return loginAdmin(cleanIdentifier, cleanPass);
    }

    // Check against LocalStorage "DB" for normal users
    const storedUsersStr = localStorage.getItem("mail_maven_db_users");
    const storedUsers: any[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];

    const foundUser = storedUsers.find(
      (u) => (u.name === cleanIdentifier || u.email === cleanIdentifier) && u.password === cleanPass
    );

    if (foundUser) {
      const sessionUser: User = {
        name: foundUser.name,
        email: foundUser.email,
        role: "user"
      };
      setUser(sessionUser);
      setIsAdmin(false);
      localStorage.setItem("mail_maven_user", JSON.stringify(sessionUser));
      toast.success(`Welcome, ${foundUser.name}!`);
      return true;
    }

    toast.error("Invalid Username or Password");
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("mail_maven_user");
    navigate("/");
    toast.success("Logged out successfully");
  };

  // Admin Tools
  const getAllUsers = () => {
    const storedUsersStr = localStorage.getItem("mail_maven_db_users");
    return storedUsersStr ? JSON.parse(storedUsersStr) : [];
  };

  const addUser = (name: string, email: string, pass: string) => {
    const currentUsers = getAllUsers();
    if (currentUsers.some((u: any) => u.email === email)) {
      toast.error("User with this email already exists");
      return;
    }
    const newUser = { name, email, password: pass };
    const updatedUsers = [...currentUsers, newUser];
    localStorage.setItem("mail_maven_db_users", JSON.stringify(updatedUsers));
    toast.success("User added successfully");
  };

  const deleteUser = (email: string) => {
    const currentUsers = getAllUsers();
    const updatedUsers = currentUsers.filter((u: any) => u.email !== email);
    localStorage.setItem("mail_maven_db_users", JSON.stringify(updatedUsers));
    toast.success("User deleted successfully");
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
