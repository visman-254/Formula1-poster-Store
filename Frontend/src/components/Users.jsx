import React, { useState, useEffect } from "react";
import { getUsers, updateUserRole } from "../api/users";
import { useUser } from "../context/UserContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Crown, User, ShoppingBag, ChevronDown } from "lucide-react";
import "./Users.css";

const roleColors = {
  admin: "bg-red-500 text-white",
  cashier: "bg-amber-500 text-white",
  customer: "bg-blue-500 text-white",
  user: "bg-gray-500 text-white",
};

const roleOptions = [
  { value: "admin", label: "Admin", icon: <Crown size={14} /> },
  { value: "cashier", label: "Cashier", icon: <ShoppingBag size={14} /> },
  { value: "customer", label: "Customer", icon: <User size={14} /> },
  { value: "user", label: "User", icon: <User size={14} /> },
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  // UI states
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { user } = useUser();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getUsers();
        if (Array.isArray(usersData)) {
          setUsers(usersData);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingRole(true);
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setEditingUser(null);
    } catch (err) {
      console.error("Error updating user role:", err);
      alert("Failed to update user role");
    } finally {
      setUpdatingRole(false);
    }
  };

  // Start editing a user's role
  const startEditing = (userId) => {
    setEditingUser(userId);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
  };

  // Filtered & searched users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <p className="text-center text-gray-500 dark:text-gray-400">Loading users...</p>;
  if (error) return <p className="text-center text-red-500 dark:text-red-400">{error}</p>;

  return (
    <div className="min-h-screen bg-glass p-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
        Manage Users
      </h2>

      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:flex-1 bg-white dark:bg-black text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
        />

        <div className="w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter} className="bg-white dark:bg-black">
            <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-black text-white dark:text-white border-gray-300 dark:border-white">
              <SelectValue className="text-white bg-white dark:text-white" placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectItem value="all" className="text-white dark:text-white focus:bg-gray-100 dark:focus:bg-black">
                All Roles
              </SelectItem>
              <SelectItem value="admin" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-black">
                Admin
              </SelectItem>
              <SelectItem value="cashier" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-black">
                Cashier
              </SelectItem>
              <SelectItem value="customer" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-black">
                Customer
              </SelectItem>
              <SelectItem value="user" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-black">
                User
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No users found.</p>
      ) : (
        <Card className="glass shadow-xl border-none">

          <CardContent className="p-0 md:p-6">
            <div className="hidden md:block">
              <ScrollArea className="h-[600px]">
                <Table className="w-full">
                  <TableHeader className="glass-header">

                    <TableRow className="border-b border-white/10 glass-row transition">

                      <TableHead className="w-[60px] text-gray-900 dark:text-white font-semibold dark:bg-black">ID</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Username</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Email</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Role</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow 
                        key={u.id} 
                        className="border-b border-gray-200 dark:border-gray-200 hover:bg-gray-50 dark:hover:bg-stone-800"
                      >
                        <TableCell className="text-gray-900 dark:text-white font-medium">
                          {u.id}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {u.username}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          {editingUser === u.id ? (
                            <div className="flex items-center gap-2">
                              <Select 
                                value={u.role} 
                                onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
                                disabled={updatingRole}
                              >
                                <SelectTrigger className="w-[130px] bg-white dark:bg-gray-800 text-white dark:text-white border-gray-300 dark:border-gray-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 z-50">
                                  {roleOptions.map((option) => (
                                    <SelectItem 
                                      key={option.value} 
                                      value={option.value}
                                      className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-gray-700"
                                    >
                                      <span className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                onClick={cancelEditing}
                                disabled={updatingRole}
                                className="p-1.5 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                                title="Cancel"
                              >
                                <ChevronDown size={16} className="rotate-45" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity w-fit"
                              onClick={() => startEditing(u.id)}
                              title="Click to change role"
                            >
                              <Badge className={`${roleColors[u.role] || "bg-gray-400 text-white"} cursor-pointer flex items-center gap-1`}>
                                {u.role === 'admin' && <Crown size={12} />}
                                {u.role === 'cashier' && <ShoppingBag size={12} />}
                                {u.role !== 'admin' && u.role !== 'cashier' && <User size={12} />}
                                <span className="ml-1">{u.role || "user"}</span>
                                <ChevronDown size={10} className="ml-1 opacity-60" />
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              <div className="space-y-4 p-4">
                {filteredUsers.map((u) => (
                  <div 
                    key={u.id} 
                    className="bg-white dark:bg-black border border-black dark:border-black rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{u.username}</span>
                      <Badge className={`${roleColors[u.role] || "bg-gray-400 text-white"} text-xs`}>
                        {u.role || "user"}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">ID:</span>
                        <span className="text-gray-900 dark:text-white">{u.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Email:</span>
                        <span className="text-gray-900 dark:text-white text-right break-all">{u.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Created:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Users;
