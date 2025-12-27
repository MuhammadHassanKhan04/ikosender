import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Trash2, UserPlus, LogOut, Shield, Mail,
    Search, Users as UsersIcon, Settings, ExternalLink,
    ShieldCheck, LayoutDashboard
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const { user, logout, getAllUsers, addUser, deleteUser } = useAuth();
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
    const navigate = useNavigate();
    const users = getAllUsers();

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUser.name && newUser.email && newUser.password) {
            addUser(newUser.name, newUser.email, newUser.password);
            setNewUser({ name: "", email: "", password: "" });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-600 selection:text-white">
            {/* Top Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">Admin Control</h1>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Mail Maven Enterprise</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate("/dashboard")} className="hidden md:flex items-center gap-2 border-2 rounded-xl h-11 font-bold">
                            <LayoutDashboard className="w-4 h-4" /> Go to Console
                        </Button>
                        <Button variant="ghost" onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 h-11 px-4 rounded-xl font-bold">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold text-gray-900">Management Overview</h2>
                        <p className="text-gray-500 font-medium">Configure system access and manage your active accounts.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">U{i}</div>
                            ))}
                            <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">+{users.length}</div>
                        </div>
                        <div className="pr-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">System Users</p>
                            <p className="text-xs font-bold">{users.length} Registered</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Add User Card */}
                    <Card className="lg:col-span-1 border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden h-fit animate-slide-in-up">
                        <CardHeader className="bg-gray-900 text-white p-8">
                            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                                <UserPlus className="h-6 w-6 text-blue-400" /> Grant Access
                            </CardTitle>
                            <CardDescription className="text-gray-400 font-medium pt-2">
                                Create a new user profile with secure credentials for their workspace.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleAddUser}>
                            <CardContent className="space-y-6 p-8">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-400">Full Workspace Name</Label>
                                    <Input
                                        id="name"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder="E.g. Marketing Lead"
                                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="u-email" className="text-xs font-bold uppercase tracking-widest text-gray-400">Login Email</Label>
                                    <Input
                                        id="u-email"
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="user@mail-maven.com"
                                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="u-password" className="text-xs font-bold uppercase tracking-widest text-gray-400">Entry Password</Label>
                                    <Input
                                        id="u-password"
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Secure Auth Code"
                                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all hover:scale-[1.02]">
                                    Authorize User
                                </Button>
                            </CardContent>
                        </form>
                    </Card>

                    {/* User List Card */}
                    <div className="lg:col-span-2 space-y-6 animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <UsersIcon className="h-5 w-5 text-blue-600" /> Active Registry
                            </h3>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input placeholder="Search registry..." className="pl-9 h-10 rounded-xl border-gray-100 text-sm" />
                            </div>
                        </div>

                        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                            <CardContent className="p-0">
                                {users.length === 0 ? (
                                    <div className="text-center py-20 bg-white">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                            <Shield className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">No Authorized Users</h3>
                                        <p className="text-gray-500 max-w-xs mx-auto text-sm">Your registry is currently empty. Authorize your first user to begin.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow className="border-gray-100">
                                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 h-14 px-8">Identity</TableHead>
                                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 h-14">Credentials</TableHead>
                                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 h-14 text-right px-8">Control</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((u, i) => (
                                                <TableRow key={i} className="border-gray-50 hover:bg-gray-50/30 transition-colors">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                                                                {u.name.substring(0, 2)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-900 truncate">{u.name}</p>
                                                                <p className="text-xs text-gray-400 font-medium truncate">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Auth Key</span>
                                                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono w-fit">{u.password}</code>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right px-8 py-5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                            onClick={() => deleteUser(u.email)}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">System Logs</h4>
                                    <p className="text-xs text-gray-400">Monitor all login and data activity.</p>
                                </div>
                                <Button variant="link" className="p-0 h-6 text-blue-600 font-bold text-xs gap-1">Open Logs <ExternalLink className="w-3 h-3" /></Button>
                            </div>
                            <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
                                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Newsletter Portal</h4>
                                    <p className="text-xs text-gray-400">Configure global mail templates.</p>
                                </div>
                                <Button variant="link" className="p-0 h-6 text-gray-900 font-bold text-xs gap-1">Manage Templates <ExternalLink className="w-3 h-3" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="max-w-7xl mx-auto p-10 text-center border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Mail Maven Enterprise • Secured By CloudAuth</p>
            </footer>
        </div>
    );
};

export default AdminDashboard;
