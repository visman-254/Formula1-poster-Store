// components/AdminPreorders.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import {
  X, Calendar, Edit, Trash2,
  Search, Filter, Plus, Package, Eye, EyeOff,
  DollarSign, Palette
} from "lucide-react";
import ColorPickerModal from "./ColorPickerModal";
import API_BASE from "../config";
import "./AdminPreorders.css";
import { toast } from "sonner";

/* ─────────────────────────────────────
   Helpers
───────────────────────────────────── */
const formatDate = (d) =>
  new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);

const STATUS_META = {
  pending:    { label: "Pending",    cls: "apre-badge-pending" },
  contacted:  { label: "Contacted",  cls: "apre-badge-contacted" },
  processing: { label: "Processing", cls: "apre-badge-processing" },
  fulfilled:  { label: "Fulfilled",  cls: "apre-badge-fulfilled" },
  cancelled:  { label: "Cancelled",  cls: "apre-badge-cancelled" },
};

const statusMeta = (s) => STATUS_META[s] || { label: s || "Pending", cls: "apre-badge-default" };

/* ─────────────────────────────────────
   Create / Edit Product Modal
───────────────────────────────────── */
const ProductModal = ({
  isOpen, onClose, editingProduct,
  token,
  onSaved,
}) => {
  const overlayRef = useRef(null);

  const blankVariant = {
    color: "", color_hex: "", storage: "", ram: "",
    price: "", preorder_price: "", preorder_eta_days: 14,
    image: null, product_code: "",
  };

  const [formData, setFormData] = useState({
    title: "", description: "", category_id: "", variants: [],
  });

  const [currentVariant, setCurrentVariant] = useState(blankVariant);
  const [selectedColorHex, setSelectedColorHex] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        title: editingProduct.title,
        description: editingProduct.description || "",
        category_id: editingProduct.category_id || "",
        variants: editingProduct.variants.map((v) => ({
          ...v,
          preorder_eta_days: v.preorder_eta_days || 14,
          price: v.price.toString(),
          preorder_price: v.preorder_price?.toString() || v.price.toString(),
        })),
      });
      setSelectedColorHex("");
    } else {
      setFormData({ title: "", description: "", category_id: "", variants: [] });
      setCurrentVariant(blankVariant);
      setSelectedColorHex("");
    }
  }, [editingProduct, isOpen]);

  // Body lock (same pattern as AddProductModal)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY) * -1);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY) * -1);
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Helper: Determine if color is light or dark for adaptive border
  const getBorderColor = (color) => {
    if (!color) return 'rgba(255,255,255,0.2)';
    const hex = color.replace('#', '');
    if (hex.length < 6) return 'rgba(255,255,255,0.2)';
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)';
  };

  const handleColorSelect = (colors) => {
    if (colors?.length) {
      const last = colors[colors.length - 1];
      setSelectedColorHex(last.hex);
      setCurrentVariant((p) => ({ ...p, color: last.name || last.hex, color_hex: last.hex }));
    }
    setShowColorPicker(false);
  };

  const handleAddVariant = () => {
    if (!currentVariant.color) { toast.error("Please select a color"); return; }
    setFormData((p) => ({
      ...p,
      variants: [...p.variants, { ...currentVariant, variant_id: Date.now() }],
    }));
    setCurrentVariant(blankVariant);
    setSelectedColorHex("");
  };

  const handleRemoveVariant = (id) =>
    setFormData((p) => ({ ...p, variants: p.variants.filter((v) => v.variant_id !== id) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) { toast.error("Product title is required"); return; }
    if (!formData.variants.length) { toast.error("At least one variant is required"); return; }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id || 127,
        variants: formData.variants.map((v) => ({
          color: v.color,
          color_hex: v.color_hex || null,
          storage: v.storage || null,
          ram: v.ram || null,
          price: parseFloat(v.price),
          preorder_price: parseFloat(v.preorder_price) || parseFloat(v.price),
          preorder_eta_days: parseInt(v.preorder_eta_days) || 14,
          product_code: v.product_code || null,
        })),
      };

      if (editingProduct) {
        await axios.put(`${API_BASE}/api/products/${editingProduct.product_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Preorder product updated");
      } else {
        await axios.post(`${API_BASE}/api/preorder-products`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Preorder product created!");
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="apre-modal-overlay"
    >
      {/* invisible backdrop behind the card — clicking it closes the modal */}
      <div
        className="apre-modal-backdrop"
        onClick={onClose}
      />
      <div className="apre-modal-content">
        <button className="apre-modal-close" onClick={onClose}>
          <X size={16} />
        </button>

        <div className="apre-modal-header">
          <h3>{editingProduct ? "Edit Preorder Product" : "Create Preorder Product"}</h3>
          <p>
            {editingProduct
              ? "Update the product details and variants below."
              : "Fill in the details and add variants to list a preorderable product."}
          </p>
        </div>

        <form className="apre-form" onSubmit={handleSubmit}>
          {/* Basic info */}
          <div className="apre-form-section">
            <div className="apre-form-section-title">Basic Info</div>

            <div className="apre-form-row full">
              <div className="apre-form-field">
                <label className="apre-form-label">
                  Product Title <span className="required">*</span>
                </label>
                <input
                  className="apre-form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Samsung Galaxy S26 Ultra"
                  required
                />
              </div>
            </div>

            <div className="apre-form-row full">
              <div className="apre-form-field">
                <label className="apre-form-label">Description</label>
                <textarea
                  className="apre-form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the product features..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Variants builder */}
          <div className="apre-form-section">
            <div className="apre-form-section-title">Product Variants</div>

            <div className="apre-variant-builder">
              {/* Color picker row */}
              <div className="apre-form-field">
                <label className="apre-form-label">
                  Color <span className="required">*</span>
                </label>
                <div className="apre-color-row">
                  <div
                    className="apre-color-swatch"
                    style={{ backgroundColor: selectedColorHex || currentVariant.color_hex || "rgba(255,255,255,0.08)" }}
                  />
                  <button
                    type="button"
                    className="apre-btn-ghost"
                    onClick={() => setShowColorPicker(true)}
                  >
                    <Palette size={14} />
                    Pick Color
                  </button>
                </div>
                {(selectedColorHex || currentVariant.color) && (
                  <div className="apre-color-selected-text">
                    Selected: <strong>{currentVariant.color}</strong> {selectedColorHex && `(${selectedColorHex})`}
                  </div>
                )}
              </div>

              <div className="apre-form-row">
                <div className="apre-form-field">
                  <label className="apre-form-label">Storage</label>
                  <input
                    className="apre-form-input"
                    value={currentVariant.storage}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, storage: e.target.value })}
                    placeholder="e.g., 256GB"
                  />
                </div>
                <div className="apre-form-field">
                  <label className="apre-form-label">RAM</label>
                  <input
                    className="apre-form-input"
                    value={currentVariant.ram}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, ram: e.target.value })}
                    placeholder="e.g., 12GB"
                  />
                </div>
                {/* Price fields hidden - preorders don't need pricing */}
                {/*
                <div className="apre-form-field">
                  <label className="apre-form-label">
                    Regular Price <span className="required">*</span>
                  </label>
                  <input
                    className="apre-form-input"
                    type="number"
                    value={currentVariant.price}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, price: e.target.value })}
                    placeholder="KES"
                  />
                </div>
                <div className="apre-form-field">
                  <label className="apre-form-label">Preorder Price</label>
                  <input
                    className="apre-form-input"
                    type="number"
                    value={currentVariant.preorder_price}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, preorder_price: e.target.value })}
                    placeholder="Leave empty to use regular"
                  />
                </div>
                */}
                <div className="apre-form-field">
                  <label className="apre-form-label">ETA (Days)</label>
                  <input
                    className="apre-form-input"
                    type="number"
                    value={currentVariant.preorder_eta_days}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, preorder_eta_days: e.target.value })}
                    placeholder="14"
                  />
                </div>
              </div>

              <button
                type="button"
                className="apre-add-variant-btn"
                onClick={handleAddVariant}
              >
                <Plus size={14} />
                Add Variant
              </button>
            </div>

            {/* Added variants */}
            {formData.variants.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {formData.variants.map((v) => (
                  <div key={v.variant_id} className="apre-variant-list-item">
                    <div className="apre-variant-list-item-info">
                      <div className="apre-variant-list-item-name">
                        <span
                          className="apre-color-dot"
                          style={{ backgroundColor: v.color_hex || "#888" }}
                        />
                        {v.color}
                      </div>
                      <div className="apre-variant-list-item-specs">
                        {v.storage && <span>{v.storage}</span>}
                        {v.ram && <span>{v.ram}</span>}
                        {/* Price hidden for preorders */}
                        {/*
                        <span>{formatCurrency(v.price)}</span>
                        {v.preorder_price && v.preorder_price !== v.price && (
                          <span className="green">Preorder: {formatCurrency(v.preorder_price)}</span>
                        )}
                        */}
                        <span className="blue">ETA: {v.preorder_eta_days}d</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="apre-icon-btn danger"
                      onClick={() => handleRemoveVariant(v.variant_id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="apre-form-footer">
            <button type="button" className="apre-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="apre-btn-submit" disabled={submitting}>
              {submitting ? "Saving…" : editingProduct ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>

      <ColorPickerModal
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        onColorSelect={handleColorSelect}
      />
    </div>
  );
};

/* ─────────────────────────────────────
   Main Component
───────────────────────────────────── */
const AdminPreorders = () => {
  const { user, token } = useUser();
  const [activeTab, setActiveTab] = useState("preorders");

  // Preorders
  const [preorders, setPreorders] = useState([]);
  const [preordersLoading, setPreordersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState("");

  // Products
  const [preorderProducts, setPreorderProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPreorders();
      fetchPreorderProducts();
    }
  }, [user, token]);

  const fetchPreorders = async () => {
    try {
      setPreordersLoading(true);
      const res = await axios.get(`${API_BASE}/api/preorders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreorders(res.data);
    } catch {
      toast.error("Failed to load preorders");
    } finally {
      setPreordersLoading(false);
    }
  };

  const fetchPreorderProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await axios.get(`${API_BASE}/api/preorder-products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreorderProducts(res.data);
    } catch {
      toast.error("Failed to load preorder products");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/api/preorders/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Status updated");
      fetchPreorders();
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleSaveNotes = async (id) => {
    try {
      const p = preorders.find((o) => o.preorder_id === id);
      await axios.patch(
        `${API_BASE}/api/preorders/${id}/status`,
        { status: p.status, notes: notesText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingNotes(null);
      setNotesText("");
      toast.success("Notes saved");
      fetchPreorders();
    } catch {
      toast.error("Error saving notes");
    }
  };

  const handleDeletePreorder = async (id) => {
    if (!window.confirm("Delete this preorder?")) return;
    try {
      await axios.delete(`${API_BASE}/api/preorders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Preorder deleted");
      fetchPreorders();
    } catch {
      toast.error("Error deleting preorder");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this preorder product? Customers won't see it anymore.")) return;
    try {
      await axios.delete(`${API_BASE}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product deleted");
      fetchPreorderProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const toggleVisibility = async (id, current) => {
    try {
      await axios.put(
        `${API_BASE}/api/products/${id}/toggle-visibility`,
        { is_visible: !current },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Product ${!current ? "visible" : "hidden"}`);
      fetchPreorderProducts();
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  const filteredPreorders = useMemo(() => {
    let f = preorders;
    if (statusFilter !== "all")
      f = f.filter((p) => p.status?.toLowerCase() === statusFilter);
    if (!searchQuery.trim()) return f;
    const q = searchQuery.toLowerCase();
    return f.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.product_summary?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
    );
  }, [preorders, searchQuery, statusFilter]);

  if (!user || user.role !== "admin") {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h2 style={{ color: "#f87171" }}>Access Denied</h2>
        <p style={{ opacity: 0.5 }}>Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="admin-preorders-container">
      {/* ── Page Header ── */}
      <div className="admin-preorders-page-header">
        <h2>Preorders</h2>
        <p>Manage customer preorders and the products available to preorder</p>
      </div>

      {/* ── Tab Bar ── */}
      <div className="admin-preorders-tabs">
        <button
          className={`admin-preorders-tab-btn ${activeTab === "preorders" ? "active" : ""}`}
          onClick={() => setActiveTab("preorders")}
        >
          <Package size={15} />
          Customer Preorders
          <span className="apre-badge apre-badge-default" style={{ marginLeft: "0.35rem" }}>
            {preorders.length}
          </span>
        </button>
        <button
          className={`admin-preorders-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Plus size={15} />
          Preorder Products
          <span className="apre-badge apre-badge-default" style={{ marginLeft: "0.35rem" }}>
            {preorderProducts.length}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════
          TAB 1 — Customer Preorders
      ══════════════════════════════════════ */}
      {activeTab === "preorders" && (
        <>
          <div className="admin-preorders-toolbar">
            <div className="admin-preorders-toolbar-left">
              {/* Search */}
              <div className="apre-search-wrap">
                <Search className="search-icon" />
                <input
                  className="apre-search-input"
                  placeholder="Search name, email, phone, products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="apre-search-clear" onClick={() => setSearchQuery("")}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="apre-filter-wrap">
                <Filter size={15} />
                <select
                  className="apre-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="processing">Processing</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {preordersLoading ? (
            <div className="apre-loading">
              <div className="apre-spinner" />
            </div>
          ) : filteredPreorders.length === 0 ? (
            <div className="apre-empty">
              <Package />
              <h3>No Preorders Found</h3>
              <p>{searchQuery ? "No matching preorders." : "No customer preorders yet."}</p>
            </div>
          ) : (
            <div className="apre-grid">
              {filteredPreorders.map((preorder) => {
                const sm = statusMeta(preorder.status);
                return (
                  <div key={preorder.preorder_id} className="apre-card">
                    {/* Top row */}
                    <div className="apre-card-top">
                      <div className="apre-card-title-block">
                        <div className="apre-card-name">
                          {preorder.name}
                        </div>
                        <div className="apre-card-contact">
                          <div className="apre-card-contact-row">
                            <span>{preorder.email}</span>
                          </div>
                          <div className="apre-card-contact-row">
                            <span>{preorder.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="apre-card-actions">
                        <button
                          className="apre-icon-btn"
                          title="Edit notes"
                          onClick={() => {
                            setEditingNotes(preorder.preorder_id);
                            setNotesText(preorder.notes || "");
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="apre-icon-btn danger"
                          title="Delete"
                          onClick={() => handleDeletePreorder(preorder.preorder_id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Status + date */}
                    <div className="apre-card-meta">
                      <span className={`apre-badge ${sm.cls}`}>{sm.label}</span>
                      <span className="apre-card-date">
                        <Calendar size={10} style={{ display: "inline", marginRight: "3px" }} />
                        {formatDate(preorder.created_at)}
                      </span>
                    </div>

                    {/* Products */}
                    <div className="apre-info-block">
                      <div className="apre-info-block-label">Products</div>
                      <p>{preorder.product_summary || "No products"}</p>
                    </div>

                    {/* Total */}
                    {preorder.total_amount && (
                      <div className="apre-info-block total">
                        <div className="apre-info-block-label">Total</div>
                        <p>{formatCurrency(preorder.total_amount)}</p>
                      </div>
                    )}

                    {/* Notes editor / display */}
                    {editingNotes === preorder.preorder_id ? (
                      <div className="apre-notes-editor">
                        <div className="apre-notes-editor-header">
                          <span>Admin Notes</span>
                          <div className="apre-notes-editor-actions">
                            <button
                              className="apre-btn-ghost"
                              style={{ height: "30px", fontSize: "0.8rem" }}
                              onClick={() => handleSaveNotes(preorder.preorder_id)}
                            >
                              Save
                            </button>
                            <button
                              className="apre-icon-btn"
                              onClick={() => setEditingNotes(null)}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                        <textarea
                          className="apre-notes-textarea"
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Add notes…"
                          rows={3}
                        />
                      </div>
                    ) : (
                      preorder.notes && (
                        <div className="apre-info-block notes">
                          <div className="apre-info-block-label">Notes</div>
                          <p>{preorder.notes}</p>
                        </div>
                      )
                    )}

                    {/* Status update */}
                    <div className="apre-status-section">
                      <span className="apre-status-label">Update Status</span>
                      <select
                        className="apre-status-select"
                        defaultValue={preorder.status || "pending"}
                        onChange={(e) => handleStatusChange(preorder.preorder_id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="processing">Processing</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          TAB 2 — Preorder Products
      ══════════════════════════════════════ */}
      {activeTab === "products" && (
        <>
          <div className="admin-preorders-toolbar">
            <div style={{ flex: 1 }} />
            <button
              className="apre-btn-primary"
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
            >
              <Plus size={15} />
              Create Preorder Product
            </button>
          </div>

          {productsLoading ? (
            <div className="apre-loading">
              <div className="apre-spinner" />
            </div>
          ) : preorderProducts.length === 0 ? (
            <div className="apre-empty">
              <Package />
              <h3>No Preorder Products</h3>
              <p>Create your first product for customers to preorder.</p>
              <button
                className="apre-btn-primary"
                style={{ marginTop: "0.75rem" }}
                onClick={() => { setEditingProduct(null); setModalOpen(true); }}
              >
                <Plus size={14} />
                Create Product
              </button>
            </div>
          ) : (
            <div className="apre-grid">
              {preorderProducts.map((product) => (
                <div key={product.product_id} className="apre-product-card">
                  <div className="apre-product-card-header">
                    <div>
                      <div className="apre-product-card-title">{product.title}</div>
                      <span className="apre-badge apre-badge-variant">
                        {product.variants.length}{" "}
                        {product.variants.length === 1 ? "variant" : "variants"}
                      </span>
                    </div>
                    <div className="apre-card-actions">
                      <button
                        className={`apre-icon-btn ${product.is_visible !== false ? "vis-on" : "vis-off"}`}
                        title={product.is_visible !== false ? "Visible to customers" : "Hidden"}
                        onClick={() => toggleVisibility(product.product_id, product.is_visible !== false)}
                      >
                        {product.is_visible !== false
                          ? <Eye size={14} />
                          : <EyeOff size={14} />}
                      </button>
                      <button
                        className="apre-icon-btn"
                        title="Edit"
                        onClick={() => { setEditingProduct(product); setModalOpen(true); }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="apre-icon-btn danger"
                        title="Delete"
                        onClick={() => handleDeleteProduct(product.product_id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {product.description && (
                    <p className="apre-product-desc">{product.description}</p>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {product.variants.slice(0, 2).map((v) => (
                      <div key={v.variant_id} className="apre-variant-row">
                        <div className="apre-variant-main">
                          <span className="apre-variant-color-name">
                            <span
                              className="apre-color-dot"
                              style={{ backgroundColor: v.color_hex || "#888" }}
                            />
                            {v.color}
                          </span>
                          {/* Price hidden for preorders */}
                          {/* <span>{formatCurrency(v.price)}</span> */}
                        </div>
                        <div className="apre-variant-meta">
                          {v.storage && (
                            <span className="apre-variant-meta-item">{v.storage}</span>
                          )}
                          {v.ram && (
                            <span className="apre-variant-meta-item">{v.ram} RAM</span>
                          )}
                          <span className="apre-variant-meta-item">
                            {v.preorder_eta_days || 14}d ETA
                          </span>
                          {/* Preorder price hidden */}
                          {/*
                          {v.preorder_price && v.preorder_price !== v.price && (
                            <span className="apre-variant-meta-item preorder-price">
                              <DollarSign size={11} />
                              {formatCurrency(v.preorder_price)}
                            </span>
                          )}
                          */}
                        </div>
                      </div>
                    ))}
                    {product.variants.length > 2 && (
                      <p className="apre-more-variants">
                        +{product.variants.length - 2} more variant
                        {product.variants.length - 2 !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Product Create/Edit Modal ── */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingProduct={editingProduct}
        token={token}
        onSaved={fetchPreorderProducts}
      />
    </div>
  );
};

export default AdminPreorders;