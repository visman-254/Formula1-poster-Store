// components/AdminPreorders.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Phone, Mail, User, Calendar, Edit, Trash2, Search } from "lucide-react";
import API_BASE from "../config";
import "./AdminPreorders.css";


const AdminPreorders = () => {
  const { user, token } = useUser();
  const [preorders, setPreorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState("");

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPreorders();
    }
  }, [user, token]);

  const fetchPreorders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/preorders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPreorders(response.data);
    } catch (error) {
      console.error("Error fetching preorders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter preorders based on search query
  const filteredPreorders = useMemo(() => {
    if (!searchQuery.trim()) return preorders;
    
    const query = searchQuery.toLowerCase();
    return preorders.filter(preorder => {
      return (
        preorder.name.toLowerCase().includes(query) ||
        preorder.email.toLowerCase().includes(query) ||
        preorder.phone.toLowerCase().includes(query) ||
        (preorder.device && preorder.device.toLowerCase().includes(query)) ||
        (preorder.notes && preorder.notes.toLowerCase().includes(query)) ||
        (preorder.status && preorder.status.toLowerCase().includes(query))
      );
    });
  }, [preorders, searchQuery]);

  const handleStatusChange = async (preorderId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/api/preorders/${preorderId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchPreorders();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating status. Try again.");
    }
  };

  const handleSaveNotes = async (preorderId) => {
    try {
      const preorder = preorders.find(p => p.preorder_id === preorderId);
      await axios.patch(
        `${API_BASE}/api/preorders/${preorderId}/status`,
        { 
          status: preorder.status,
          notes: notesText 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setEditingNotes(null);
      setNotesText("");
      fetchPreorders();
    } catch (err) {
      console.error("Failed to save notes:", err);
      alert("Error saving notes. Try again.");
    }
  };

  const handleDelete = async (preorderId) => {
    if (!window.confirm("Are you sure you want to delete this preorder?")) {
      return;
    }
    
    try {
      await axios.delete(`${API_BASE}/api/preorders/${preorderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchPreorders();
    } catch (err) {
      console.error("Failed to delete preorder:", err);
      alert("Error deleting preorder. Try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "contacted":
        return "bg-blue-500";
      case "processing":
        return "bg-purple-500";
      case "fulfilled":
        return "bg-green-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "contacted":
        return "Contacted";
      case "processing":
        return "Processing";
      case "fulfilled":
        return "Fulfilled";
      case "cancelled":
        return "Cancelled";
      default:
        return status || "Pending";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">Admin privileges required to view preorders.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="admin-preorders-container p-4 md:p-6">
      <div className="admin-preorders-header mb-6">
        <h2 className="text-2xl font-bold">Preorders ({preorders.length})</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage customer device preorders</p>
      </div>

      {/* Search Bar - Real-time filtering */}
      <div className="search-section mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search preorders by name, email, phone, device, or status..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {searchQuery && filteredPreorders.length > 0 && (
            <span>Showing {filteredPreorders.length} of {preorders.length} preorders</span>
          )}
          {searchQuery && filteredPreorders.length === 0 && (
            <span>No preorders found for "{searchQuery}"</span>
          )}
          {!searchQuery && preorders.length > 0 && (
            <span>Type to filter {preorders.length} preorders</span>
          )}
        </div>
      </div>

      {filteredPreorders.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          {searchQuery ? (
            <>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Matching Preorders</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                No preorders found for "<span className="font-medium">{searchQuery}</span>"
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={clearSearch}
              >
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Preorders Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Customer preorders will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <ScrollArea className="preorders-scroll-area h-[calc(100vh-250px)]">
          <div className="preorders-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPreorders.map((preorder) => (
              <Card key={preorder.preorder_id} className="preorder-card hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 truncate">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{preorder.name}</span>
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{preorder.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{preorder.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingNotes(preorder.preorder_id);
                          setNotesText(preorder.notes || "");
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(preorder.preorder_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge className={`${getStatusColor(preorder.status)} text-white`}>
                      {getStatusText(preorder.status)}
                    </Badge>
                    <div className="flex flex-col items-end">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(preorder.created_at)}
                      </div>
                      <div className="text-sm font-semibold">
                        ID: #{preorder.preorder_id}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Device Request:</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <p className="whitespace-pre-wrap break-words text-sm">{preorder.device}</p>
                    </div>
                  </div>

                  {editingNotes === preorder.preorder_id ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-sm">Admin Notes:</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNotes(preorder.preorder_id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingNotes(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Add notes about this preorder..."
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  ) : (
                    preorder.notes && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Admin Notes:</h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                          <p className="whitespace-pre-wrap break-words text-sm">{preorder.notes}</p>
                        </div>
                      </div>
                    )
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">Update Status:</span>
                      <Select
                        onValueChange={(value) =>
                          handleStatusChange(preorder.preorder_id, value)
                        }
                        defaultValue={preorder.status || "pending"}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="fulfilled">Fulfilled</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {preorder.updated_at && preorder.updated_at !== preorder.created_at && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last updated: {formatDate(preorder.updated_at)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AdminPreorders;