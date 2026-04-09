import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import {
  X, Calendar, Edit, Trash2, Search, Filter, Plus,
  Package, Eye, EyeOff, Upload, Check,
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
const formatCurrency = (v) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(v || 0);

const STATUS_META = {
  pending:    { label: "Pending",    cls: "apre-badge-pending" },
  contacted:  { label: "Contacted",  cls: "apre-badge-contacted" },
  processing: { label: "Processing", cls: "apre-badge-processing" },
  fulfilled:  { label: "Fulfilled",  cls: "apre-badge-fulfilled" },
  cancelled:  { label: "Cancelled",  cls: "apre-badge-cancelled" },
};
const statusMeta = (s) => STATUS_META[s] || { label: s || "Pending", cls: "apre-badge-default" };

/* ─────────────────────────────────────
   VariantImagePreview (customer preorders tab)
───────────────────────────────────── */
const VIP = ({ imagePath, colorHex, size = 56 }) => {
  const [err, setErr] = useState(false);
  const url = imagePath && !err
    ? (imagePath.startsWith("http") ? imagePath : `${API_BASE}/${imagePath}`) : null;
  return (
    <div className="apre-vip" style={{ width: size, height: size }}>
      {url
        ? <img src={url} alt="" onError={() => setErr(true)} />
        : <div className="apre-vip-ph" style={{ background: colorHex || "rgba(255,255,255,0.06)" }}>
            <Package size={size > 44 ? 18 : 13} />
          </div>
      }
    </div>
  );
};

/* ─────────────────────────────────────
   ImageVariantCard - Images are optional, just show placeholder if missing
───────────────────────────────────── */
const ImageVariantCard = ({ entry, index, onUpdate, onRemove }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const field = (key, val) => onUpdate(index, { [key]: val });

  const handleColorSelect = (colors) => {
    if (colors?.length) {
      const last = colors[colors.length - 1];
      onUpdate(index, { 
        color: last.name || last.hex, 
        color_hex: last.hex 
      });
    }
    setPickerOpen(false);
  };

  return (
    <div className={`apre-ivc${entry.confirmed ? " apre-ivc--confirmed" : ""}`}>

      {/* Image thumbnail - shows placeholder if no image */}
      <div className="apre-ivc-img-wrap">
        {entry.localUrl ? (
          <img src={entry.localUrl} alt={`variant ${index + 1}`} />
        ) : (
          <div className="apre-ivc-img-placeholder" style={{ backgroundColor: entry.color_hex || "rgba(255,255,255,0.05)" }}>
            <Package size={20} />
          </div>
        )}
        {entry.serverPath && (
          <button type="button" className="apre-ivc-remove" onClick={() => onRemove(index)}>
            <X size={11} />
          </button>
        )}
        {entry.confirmed && (
          <div className="apre-ivc-confirmed-overlay"><Check size={14} /></div>
        )}
      </div>

      {/* Fields */}
      <div className="apre-ivc-body">

        {/* Color row with editable text inputs */}
        <div className="apre-ivc-color-row">
          <button
            type="button"
            className="apre-ivc-color-btn"
            style={{ background: entry.color_hex || "rgba(255,255,255,0.1)" }}
            onClick={() => setPickerOpen(true)}
            title="Pick color from picker"
          />
          <input 
            type="text"
            className="apre-ivc-color-input"
            placeholder="Color name (e.g., Midnight Black)"
            value={entry.color || ""}
            onChange={(e) => field("color", e.target.value)}
          />
          <input 
            type="text"
            className="apre-ivc-hex-input"
            placeholder="#HEX code"
            value={entry.color_hex || ""}
            onChange={(e) => field("color_hex", e.target.value)}
          />
          <button type="button" className="apre-btn-ghost apre-ivc-pick" onClick={() => setPickerOpen(true)}>
            Pick
          </button>
        </div>

        {/* Storage, RAM, ETA in a row */}
        <div className="apre-ivc-specs-row">
          <input 
            className="apre-form-input apre-ivc-input" 
            placeholder="Storage e.g. 256GB"
            value={entry.storage || ""} 
            onChange={(e) => field("storage", e.target.value)} 
          />
          <input 
            className="apre-form-input apre-ivc-input" 
            placeholder="RAM e.g. 12GB"
            value={entry.ram || ""} 
            onChange={(e) => field("ram", e.target.value)} 
          />
          <input 
            className="apre-form-input apre-ivc-input" 
            placeholder="ETA (days)" 
            type="number"
            value={entry.preorder_eta_days || 14} 
            onChange={(e) => field("preorder_eta_days", e.target.value)} 
          />
        </div>

        {/* Confirm button */}
        <button
          type="button"
          className={`apre-ivc-add-btn${entry.confirmed ? " apre-ivc-add-btn--done" : ""}`}
          onClick={() => {
            if (!entry.color) { 
              toast.error("Please enter a color name or pick one"); 
              return; 
            }
            onUpdate(index, { confirmed: !entry.confirmed });
          }}
        >
          {entry.confirmed ? <><Check size={12} /> In List</> : <><Plus size={12} /> Add as Variant</>}
        </button>
      </div>

      {/* Color picker portal */}
      {pickerOpen && (
        <div className="apre-picker-portal" onClick={() => setPickerOpen(false)}>
          <div className="apre-picker-portal-inner" onClick={(e) => e.stopPropagation()}>
            <ColorPickerModal
              isOpen={true}
              onClose={() => setPickerOpen(false)}
              onColorSelect={handleColorSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────
   ProductModal - Images are optional
───────────────────────────────────── */
const ProductModal = ({ isOpen, onClose, editingProduct, token, onSaved }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  // Seed form data when editing
  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setTitle(editingProduct.title || "");
      setDescription(editingProduct.description || "");
      setEntries((editingProduct.variants || []).map((v) => ({
        localUrl: v.image ? (v.image.startsWith("http") ? v.image : `${API_BASE}/${v.image}`) : null,
        serverPath: v.image || null,
        color: v.color || "",
        color_hex: v.color_hex || "",
        storage: v.storage || "",
        ram: v.ram || "",
        preorder_eta_days: v.preorder_eta_days || 14,
        confirmed: true,
        variant_id: v.variant_id,
      })));
    } else {
      setTitle("");
      setDescription("");
      // Start with one empty variant entry so user can add without uploading image
      setEntries([{
        localUrl: null,
        serverPath: null,
        color: "",
        color_hex: "",
        storage: "",
        ram: "",
        preorder_eta_days: 14,
        confirmed: false,
        variant_id: Date.now(),
      }]);
    }
  }, [isOpen, editingProduct]);

  // Body lock when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const y = window.scrollY;
    document.body.style.cssText = `position:fixed;top:-${y}px;width:100%;overflow-y:scroll`;
    return () => {
      document.body.style.cssText = "";
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));
      const { data } = await axios.post(`${API_BASE}/api/upload/images`, form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        setEntries((prev) => [
          ...prev,
          ...data.files.map((f) => ({
            localUrl: `${API_BASE}/${f.path}`,
            serverPath: f.path,
            color: "",
            color_hex: "",
            storage: "",
            ram: "",
            preorder_eta_days: 14,
            confirmed: false,
            variant_id: Date.now() + Math.random(),
          })),
        ]);
        toast.success(`${data.files.length} image${data.files.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const updateEntry = useCallback((i, patch) =>
    setEntries((p) => p.map((e, idx) => idx === i ? { ...e, ...patch } : e)), []);
  const removeEntry = useCallback((i) =>
    setEntries((p) => p.filter((_, idx) => idx !== i)), []);

  const addEmptyVariant = () => {
    setEntries(prev => [...prev, {
      localUrl: null,
      serverPath: null,
      color: "",
      color_hex: "",
      storage: "",
      ram: "",
      preorder_eta_days: 14,
      confirmed: false,
      variant_id: Date.now(),
    }]);
  };

  const confirmedCount = entries.filter((e) => e.confirmed && e.color).length;

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!title.trim()) { 
      toast.error("Title required"); 
      return; 
    }
    const variants = entries.filter((e) => e.confirmed && e.color);
    if (!variants.length) { 
      toast.error("Confirm at least one variant"); 
      return; 
    }
    
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category_id: 127,
        variants: variants.map((v) => ({
          color: v.color,
          color_hex: v.color_hex || null,
          storage: v.storage || null,
          ram: v.ram || null,
          price: 0,
          preorder_price: 0,
          preorder_eta_days: parseInt(v.preorder_eta_days) || 14,
          product_code: null,
          image: v.serverPath || null,
        })),
      };
      
      if (editingProduct) {
        await axios.put(`${API_BASE}/api/products/${editingProduct.product_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Product updated");
      } else {
        await axios.post(`${API_BASE}/api/preorder-products`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Product created!");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="apre-modal-overlay">
      <div className="apre-modal-backdrop" onClick={onClose} />
      <div className="apre-modal-content apre-modal-large">
        <button className="apre-modal-close" onClick={onClose}><X size={16} /></button>

        <div className="apre-modal-header">
          <h3>{editingProduct ? "Edit Preorder Product" : "New Preorder Product"}</h3>
          <p>Add variants (images optional) → fill color, specs → Add as Variant</p>
        </div>

        <form className="apre-form" onSubmit={handleSubmit}>

          {/* Basic info */}
          <div className="apre-form-section">
            <div className="apre-form-section-title">Basic Info</div>
            <div className="apre-form-field">
              <label className="apre-form-label">Title <span className="required">*</span></label>
              <input
                className="apre-form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Samsung Galaxy S26 Ultra"
                required
              />
            </div>
            <div className="apre-form-field">
              <label className="apre-form-label">Description</label>
              <textarea
                className="apre-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key specs, features…"
                rows={3}
              />
            </div>
          </div>

          {/* Image-variant builder */}
          <div className="apre-form-section">
            <div className="apre-form-section-title">
              Variants
              {entries.length > 0 && (
                <span className="apre-section-count">
                  {entries.length} total · {confirmedCount} confirmed
                </span>
              )}
            </div>

            {/* Upload zone - OPTIONAL */}
            <div
              className={`apre-drop-zone${uploading ? " apre-drop-zone--busy" : ""}`}
              onClick={() => !uploading && fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleUpload}
                disabled={uploading}
              />
              {uploading
                ? <><div className="apre-spinner apre-spinner-sm" /><span>Uploading…</span></>
                : <><Upload size={18} /><span>Upload images (optional)</span><small>Each image becomes a variant</small></>
              }
            </div>

            {/* Add empty variant button */}
            <button
              type="button"
              className="apre-add-variant-btn"
              onClick={addEmptyVariant}
            >
              <Plus size={14} />
              Add Empty Variant (No Image)
            </button>

            {/* Variant Cards */}
            {entries.length > 0 ? (
              <div className="apre-ivc-grid">
                {entries.map((e, i) => (
                  <ImageVariantCard
                    key={e.variant_id || i}
                    entry={e}
                    index={i}
                    onUpdate={updateEntry}
                    onRemove={removeEntry}
                  />
                ))}
              </div>
            ) : (
              <p className="apre-ivc-hint">Click "Add Empty Variant" or upload images to start.</p>
            )}
          </div>

          <div className="apre-form-footer">
            <button type="button" className="apre-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="apre-btn-submit"
              disabled={submitting || confirmedCount === 0}
            >
              {submitting ? "Saving…"
                : editingProduct ? "Update Product"
                : `Create (${confirmedCount} variant${confirmedCount !== 1 ? "s" : ""})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────
   Main Component
───────────────────────────────────── */
const AdminPreorders = () => {
  const { user, token } = useUser();
  const [activeTab, setActiveTab] = useState("preorders");
  const [preorders, setPreorders] = useState([]);
  const [preordersLoading, setPreordersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState("");
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
      const { data } = await axios.get(`${API_BASE}/api/preorders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreorders(data);
    } catch {
      toast.error("Failed to load preorders");
    } finally {
      setPreordersLoading(false);
    }
  };

  const fetchPreorderProducts = async () => {
    try {
      setProductsLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/preorder-products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreorderProducts(data);
    } catch {
      toast.error("Failed to load preorder products");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleStatusChange = async (id, s) => {
    try {
      await axios.patch(`${API_BASE}/api/preorders/${id}/status`, { status: s }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Status updated");
      fetchPreorders();
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleSaveNotes = async (id) => {
    try {
      const p = preorders.find((o) => o.preorder_id === id);
      await axios.patch(`${API_BASE}/api/preorders/${id}/status`,
        { status: p.status, notes: notesText },
        { headers: { Authorization: `Bearer ${token}` } });
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
        headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Product deleted");
      fetchPreorderProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const toggleVisibility = async (id, current) => {
    try {
      await axios.put(`${API_BASE}/api/products/${id}/toggle-visibility`,
        { is_visible: !current },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Product ${!current ? "visible" : "hidden"}`);
      fetchPreorderProducts();
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  const filteredPreorders = useMemo(() => {
    let f = statusFilter !== "all"
      ? preorders.filter((p) => p.status?.toLowerCase() === statusFilter)
      : preorders;
    if (!searchQuery.trim()) return f;
    const q = searchQuery.toLowerCase();
    return f.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
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
      <div className="admin-preorders-page-header">
        <h2>Preorders</h2>
        <p>Manage customer preorders and preorderable products</p>
      </div>

      <div className="admin-preorders-tabs">
        {[
          { key: "preorders", label: "Customer Preorders", count: preorders.length },
          { key: "products", label: "Preorder Products", count: preorderProducts.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            className={`admin-preorders-tab-btn${activeTab === key ? " active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <Package size={15} />{label}
            <span className="apre-badge apre-badge-default" style={{ marginLeft: "0.35rem" }}>{count}</span>
          </button>
        ))}
      </div>

      {/* Customer Preorders Tab */}
      {activeTab === "preorders" && (
        <>
          <div className="admin-preorders-toolbar">
            <div className="admin-preorders-toolbar-left">
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
            <div className="apre-loading"><div className="apre-spinner" /></div>
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
                    <div className="apre-card-top">
                      <div className="apre-card-title-block">
                        <div className="apre-card-name">{preorder.name}</div>
                        <div className="apre-card-contact">
                          <div className="apre-card-contact-row"><span>{preorder.email}</span></div>
                          <div className="apre-card-contact-row"><span>{preorder.phone}</span></div>
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

                    <div className="apre-card-meta">
                      <span className={`apre-badge ${sm.cls}`}>{sm.label}</span>
                      <span className="apre-card-date">
                        <Calendar size={10} style={{ display: "inline", marginRight: 3 }} />
                        {formatDate(preorder.created_at)}
                      </span>
                    </div>

                    <div className="apre-info-block">
                      <div className="apre-info-block-label">Selected Items</div>
                      {preorder.products?.length > 0 ? (
                        <div className="apre-selected-items">
                          {preorder.products.map((product, idx) => (
                            <div key={idx} className="apre-selected-item">
                              <VIP
                                imagePath={product.variant_image || product.image}
                                colorHex={product.color_hex}
                                size={52}
                              />
                              <div className="apre-selected-item-details">
                                <div className="apre-selected-item-title">{product.product_name}</div>
                                <div className="apre-selected-item-specs">
                                  {product.color && <span>{product.color}</span>}
                                  {product.storage && <span>{product.storage}</span>}
                                  {product.ram && <span>{product.ram}</span>}
                                </div>
                                <div className="apre-selected-item-price">
                                  Qty: {product.quantity} × {formatCurrency(product.price_at_preorder)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", margin: 0 }}>
                          {preorder.product_summary || "No products"}
                        </p>
                      )}
                    </div>

                    {preorder.total_amount > 0 && (
                      <div className="apre-info-block total">
                        <div className="apre-info-block-label">Total</div>
                        <p>{formatCurrency(preorder.total_amount)}</p>
                      </div>
                    )}

                    {editingNotes === preorder.preorder_id ? (
                      <div className="apre-notes-editor">
                        <div className="apre-notes-editor-header">
                          <span>Admin Notes</span>
                          <div className="apre-notes-editor-actions">
                            <button
                              className="apre-btn-ghost"
                              style={{ height: 30, fontSize: "0.8rem" }}
                              onClick={() => handleSaveNotes(preorder.preorder_id)}
                            >
                              Save
                            </button>
                            <button className="apre-icon-btn" onClick={() => setEditingNotes(null)}>
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
                    ) : preorder.notes ? (
                      <div className="apre-info-block notes">
                        <div className="apre-info-block-label">Notes</div>
                        <p>{preorder.notes}</p>
                      </div>
                    ) : null}

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

      {/* Preorder Products Tab */}
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
              <Plus size={15} /> Create Preorder Product
            </button>
          </div>

          {productsLoading ? (
            <div className="apre-loading"><div className="apre-spinner" /></div>
          ) : preorderProducts.length === 0 ? (
            <div className="apre-empty">
              <Package />
              <h3>No Preorder Products</h3>
              <p>Create your first product for customers to preorder.</p>
              <button
                className="apre-btn-primary"
                style={{ marginTop: "0.75rem" }}
                onClick={() => {
                  setEditingProduct(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={14} /> Create Product
              </button>
            </div>
          ) : (
            <div className="apre-grid">
              {preorderProducts.map((product) => (
                <div key={product.product_id} className="apre-product-card">
                  <div className="apre-product-card-header">
                    <div>
                      <div className="apre-product-card-title">{product.title}</div>
                      <span className="apre-badge apre-badge-variant" style={{ marginTop: 4 }}>
                        {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="apre-card-actions">
                      <button
                        className={`apre-icon-btn${product.is_visible !== false ? " vis-on" : " vis-off"}`}
                        title={product.is_visible !== false ? "Visible" : "Hidden"}
                        onClick={() => toggleVisibility(product.product_id, product.is_visible !== false)}
                      >
                        {product.is_visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        className="apre-icon-btn"
                        title="Edit"
                        onClick={() => {
                          setEditingProduct(product);
                          setModalOpen(true);
                        }}
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

                  {product.description && <p className="apre-product-desc">{product.description}</p>}

                  {/* Variant image strip */}
                  <div className="apre-variant-strip">
                    {product.variants.map((v) => (
                      <div key={v.variant_id} className="apre-variant-strip-item" title={v.color}>
                        <VIP imagePath={v.image} colorHex={v.color_hex} size={40} />
                        <span className="apre-variant-strip-label">{v.color}</span>
                        {(v.storage || v.ram) && (
                          <span className="apre-variant-strip-specs">
                            {[v.storage, v.ram].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

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