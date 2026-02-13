import React, { useState, useEffect } from "react";
import { X, Search, Users as UsersIcon } from "lucide-react";
import { getUsers } from "../api/users";
import { Badge } from "@/components/ui/badge";
import "./ViewUsersModal.css";

const roleColors = {
  admin: "bg-red-500 text-white",
  customer: "bg-blue-500 text-white",
  user: "bg-gray-500 text-white",
};

const ViewUsersModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      fetchUsers();
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      className={`view-users-modal-overlay ${isOpen && isVisible ? 'active' : ''}`}
      onClick={handleClose}
    >
      <div 
        className={`view-users-modal-content ${isOpen && isVisible ? 'active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="view-users-modal-container">
          <button 
            className="view-users-modal-close"
            onClick={handleClose}
          >
            <X size={24} />
          </button>
          
          <div className="view-users-modal-header">
            <div className="view-users-icon">
              <UsersIcon size={28} />
            </div>
            <h2>Registered Users</h2>
            <p>{users.length} total users</p>
          </div>
          
          <div className="view-users-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="view-users-list">
            {loading ? (
              <div className="view-users-loading">
                <div className="loading-spinner" />
                <p>Loading users...</p>
              </div>
            ) : error ? (
              <div className="view-users-error">
                <p>{error}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="view-users-empty">
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="view-user-item">
                  <div className="view-user-avatar">
                    {u.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="view-user-info">
                    <div className="view-user-name">{u.username}</div>
                    <div className="view-user-email">{u.email}</div>
                  </div>
                  <Badge className={`${roleColors[u.role] || "bg-gray-400 text-white"}`}>
                    {u.role || "user"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUsersModal;
