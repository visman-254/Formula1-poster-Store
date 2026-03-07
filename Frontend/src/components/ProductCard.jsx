import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MoreVertical, SquarePen, CookingPot, Trash2, X, Package, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import "./ProductCard.css";
import API_BASE from "../config";
import { lookupByBarcode } from "../api/importApi";

/* ─── shared style tokens (same system as BatchInventory) ─── */
const mono = "'JetBrains Mono', 'Fira Mono', monospace";
const sans = "'Inter', system-ui, sans-serif";

const s = {
  /* labels */
  sectionHead: { fontSize: 9, fontFamily: sans, fontWeight: 500, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' },
  fieldLabel:  { fontSize: 9, fontFamily: sans, fontWeight: 500, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 },

  /* inputs */
  input: { fontFamily: sans, fontSize: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 5, color: 'rgba(255,255,255,0.88)', padding: '6px 9px', width: '100%', outline: 'none', boxSizing: 'border-box' },

  /* buttons */
  btnPrimary:   { fontFamily: sans, fontSize: 12, padding: '6px 14px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.88)', cursor: 'pointer' },
  btnSecondary: { fontFamily: sans, fontSize: 12, padding: '6px 14px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' },
  btnSmall:     { fontFamily: sans, fontSize: 11, padding: '5px 10px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.16)', background: 'transparent', color: 'rgba(255,255,255,0.58)', cursor: 'pointer' },

  /* icon action btn */
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 27, height: 27, borderRadius: 5, background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: 0, flexShrink: 0 },

  /* modal */
  modal: { background: 'rgba(9,9,11,0.97)', borderRadius: 10, maxWidth: 860, width: '100%', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 64px rgba(0,0,0,0.85)', position: 'relative', fontFamily: sans, color: 'rgba(255,255,255,0.88)', padding: 28, maxHeight: '90vh', overflowY: 'auto' },
  modalClose: { position: 'absolute', top: 18, right: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 27, height: 27, borderRadius: 5, background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.50)', cursor: 'pointer' },
  modalTitle: { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.88)', margin: '0 0 22px', paddingRight: 36, letterSpacing: '-0.01em' },

  /* divider */
  divider: { borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0' },

  /* inner panel */
  panel: { padding: 12, borderRadius: 7, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' },

  /* table */
  th: { fontSize: 9, fontFamily: sans, fontWeight: 500, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' },
  td: { fontSize: 11, fontFamily: sans, color: 'rgba(255,255,255,0.65)', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  tdMono: { fontSize: 11, fontFamily: mono, color: 'rgba(255,255,255,0.60)', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  tdRight: { fontSize: 11, fontFamily: mono, color: 'rgba(255,255,255,0.72)', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' },

  /* toggle row */
  toggleRow: { display: 'flex', alignItems: 'center', gap: 5 },
  toggleLabel: { fontSize: 9, fontFamily: sans, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },

  /* variant pill */
  variantPill: (selected) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${selected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)'}`,
    background: selected ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
    transition: 'all 0.10s',
  }),
};

/* helpers */
const calculateSellingPrice = (bp, pm, disc) => (Number(bp)||0) + (Number(pm)||0) - (Number(disc)||0);

const getVariantDisplay = (product, variant) => {
  if (variant.color && variant.color !== 'Default') {
    let d = `${product.title} (${variant.color})`;
    if (variant.storage) d += ` ${variant.storage}`;
    if (variant.ram) d += ` / ${variant.ram}`;
    return d;
  }
  if (variant.storage || variant.ram) {
    let d = product.title;
    if (variant.storage) d += ` ${variant.storage}`;
    if (variant.ram) d += ` / ${variant.ram}`;
    return d;
  }
  return `${product.title} (Variant #${variant.variant_id})`;
};

/* ─────────────────────────────────────────────
   AdminImageGallery
───────────────────────────────────────────── */
const AdminImageGallery = ({ product }) => {
  const { user, token } = useUser();
  const [images, setImages]         = useState([]);
  const [newImages, setNewImages]   = useState([]);
  const [previews, setPreviews]     = useState([]);
  const [busy, setBusy]             = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!product?.product_id) return;
    axios.get(`${API_BASE}/api/gallery/${product.product_id}/images`)
      .then(r => setImages(r.data))
      .catch(() => {
        if (product.variants) setImages(
          product.variants.map(v => v.image).filter(Boolean)
            .map((url, i) => ({ image_id: `v-${i}`, image_url: url, isVariantImage: true }))
        );
      })
      .finally(() => setLoading(false));
  }, [product]);

  const handleFiles = e => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    setPreviews(files.map(f => ({ file: f, preview: URL.createObjectURL(f) })));
  };

  const handleUpload = async () => {
    if (!newImages.length || user?.role !== 'admin') return;
    const fd = new FormData();
    newImages.forEach(f => fd.append('images', f));
    try {
      setBusy(true);
      const r = await axios.post(`${API_BASE}/api/gallery/${product.product_id}/images`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setImages(r.data.images); setNewImages([]); setPreviews([]);
      toast.success('Images uploaded');
    } catch { toast.error('Upload failed'); } finally { setBusy(false); }
  };

  const handleDelete = async id => {
    if (user?.role !== 'admin' || !window.confirm('Delete image?')) return;
    try {
      await axios.delete(`${API_BASE}/api/gallery/images/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setImages(images.filter(i => i.image_id !== id));
    } catch { toast.error('Delete failed'); }
  };

  useEffect(() => () => previews.forEach(p => URL.revokeObjectURL(p.preview)), [previews]);

  if (loading) return <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: sans }}>Loading images…</p>;

  const all = images.length > 0 ? images :
    (product.variants?.map(v => v.image).filter(Boolean).map((url, i) => ({ image_id: `v-${i}`, image_url: url, isVariantImage: true })) || []);

  return (
    <div>
      <p style={s.sectionHead}>Image Gallery</p>
      {all.length === 0
        ? <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)', fontFamily: sans, fontStyle: 'italic' }}>No images.</p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 6, marginBottom: 12 }}>
            {all.map(img => (
              <div key={img.image_id} style={{ position: 'relative', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <img src={img.image_url} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                {user?.role === 'admin' && !img.isVariantImage && (
                  <button onClick={() => handleDelete(img.image_id)}
                    style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 3, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
      }
      {user?.role === 'admin' && (
        <div style={s.panel}>
          <input type="file" multiple accept="image/*" onChange={handleFiles}
            style={{ fontFamily: sans, fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 8, display: 'block', width: '100%' }} />
          {previews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(60px,1fr))', gap: 5, marginBottom: 8 }}>
              {previews.map((p, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden' }}>
                  <img src={p.preview} alt="" style={{ width: '100%', height: 50, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => { setPreviews(ps => ps.filter((_,j)=>j!==i)); setNewImages(ns=>ns.filter((_,j)=>j!==i)); }}
                    style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 2, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleUpload} disabled={busy || !newImages.length} style={s.btnSmall}>
              {busy ? 'Uploading…' : `Upload ${newImages.length || ''}`}
            </button>
            {newImages.length > 0 && (
              <button onClick={() => { setNewImages([]); setPreviews([]); }} style={s.btnSecondary}>Clear</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   EditProductModal
───────────────────────────────────────────── */
const EditProductModal = ({ product, onUpdated, setIsEditing, user, token }) => {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.variant_id || '');
  const [form, setForm] = useState({ name: product?.title || '', description: product?.description || '', categoryName: product?.category_name || '', image: null });
  const [categories, setCategories] = useState([]);
  const [busy, setBusy]             = useState(false);
  const [newStock, setNewStock]     = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);
  const [batches, setBatches]       = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const selectedVariant = product.variants?.find(v => v.variant_id.toString() === selectedVariantId.toString());
  const currentStock = Number(selectedVariant?.stock || 0);

  const [variantForm, setVariantForm] = useState({
    buying_price: selectedVariant?.buying_price || '',
    profit_margin: selectedVariant?.profit_margin || '',
    discount: selectedVariant?.discount || '',
    variant_image: null,
    color: selectedVariant?.color || '',
    final_price: selectedVariant?.price || 0,
  });

  useEffect(() => {
    axios.get(`${API_BASE}/api/products/categories`).then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedVariantId) return;
    setLoadingBatches(true);
    axios.get(`${API_BASE}/api/products/variants/${selectedVariantId}/batches`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setBatches(r.data || []))
      .catch(() => setBatches([]))
      .finally(() => setLoadingBatches(false));
  }, [selectedVariantId, token]);

  useEffect(() => {
    if (selectedVariant) {
      setVariantForm({ buying_price: selectedVariant.buying_price || '', profit_margin: selectedVariant.profit_margin || '', discount: selectedVariant.discount || '', variant_image: null, color: selectedVariant.color || '', final_price: selectedVariant.price || 0 });
      setNewStock(selectedVariant.stock || '');
    }
  }, [selectedVariantId]);

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (['buying_price','profit_margin','discount','color','final_price'].includes(name)) {
      setVariantForm(prev => {
        const n = { ...prev, [name]: value };
        if (name === 'final_price') n.profit_margin = Number(value) - (Number(n.buying_price)||0) + (Number(n.discount)||0);
        else if (['buying_price','profit_margin','discount'].includes(name)) n.final_price = calculateSellingPrice(n.buying_price, n.profit_margin, n.discount);
        return n;
      });
    } else if (name === 'variant_image') {
      setVariantForm(p => ({ ...p, variant_image: files[0] }));
    } else if (name === 'image') {
      setForm(p => ({ ...p, image: files[0] }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleUpdateStock = async () => {
    const qty = Number(newStock);
    if (isNaN(qty)) { toast.error('Invalid quantity'); return; }
    try {
      setUpdatingStock(true);
      const r = await axios.post(`${API_BASE}/api/products/variants/${selectedVariant.variant_id}/update-stock`, { newStockQuantity: qty }, { headers: { Authorization: `Bearer ${token}` } });
      onUpdated?.(r.data.product);
      toast.success('Stock updated');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setUpdatingStock(false); }
  };

  const handleUpdate = async e => {
    e.preventDefault();
    try {
      setBusy(true);
      const pFd = new FormData(); let hasP = false;
      if (form.name !== product.title) { pFd.append('title', form.name); hasP = true; }
      if (form.description !== product.description) { pFd.append('description', form.description); hasP = true; }
      if (form.categoryName) { pFd.append('categoryName', form.categoryName); hasP = true; }
      if (form.image) { pFd.append('image', form.image); hasP = true; }

      const vFd = new FormData(); let hasV = false;
      if (user?.role === 'admin' && selectedVariant) {
        if (Number(variantForm.buying_price) !== Number(selectedVariant.buying_price)) { vFd.append('buying_price', variantForm.buying_price); hasV = true; }
        if (Number(variantForm.profit_margin) !== Number(selectedVariant.profit_margin)) { vFd.append('profit_margin', variantForm.profit_margin); hasV = true; }
        if (Number(variantForm.discount) !== Number(selectedVariant.discount) || hasV) { vFd.append('discount', variantForm.discount); vFd.append('price', variantForm.final_price); hasV = true; }
        if (variantForm.variant_image) { vFd.append('image', variantForm.variant_image); hasV = true; }
      }

      let updated = product;
      if (hasP) { const r = await axios.put(`${API_BASE}/api/products/${product.product_id}`, pFd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }); updated = r.data.product; }
      if (hasV && selectedVariant) { const r = await axios.put(`${API_BASE}/api/products/variants/${selectedVariant.variant_id}`, vFd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }); updated = r.data.product || updated; }
      if (variantForm.color && variantForm.color !== selectedVariant?.color) { const r = await axios.put(`${API_BASE}/api/products/variants/${selectedVariant.variant_id}/color`, { color: variantForm.color }, { headers: { Authorization: `Bearer ${token}` } }); updated = r.data.product || updated; }

      onUpdated?.(updated); setIsEditing(false);
      toast.success(`"${product.title}" updated`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setBusy(false); }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div style={s.modal}>
        <button onClick={() => setIsEditing(false)} style={s.modalClose}><X size={13} /></button>
        <p style={s.modalTitle}>Edit Product</p>

        <form onSubmit={handleUpdate}>
          {/* ── top grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>

            {/* Product info */}
            <div>
              <p style={s.sectionHead}>Product Info</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><label style={s.fieldLabel}>Name</label>
                  <input name="name" value={form.name} onChange={handleChange} style={s.input} /></div>
                <div><label style={s.fieldLabel}>Description</label>
                  <input name="description" value={form.description} onChange={handleChange} style={s.input} /></div>
                <div><label style={s.fieldLabel}>Category</label>
                  <Select onValueChange={v => setForm(p => ({...p, categoryName: v}))} value={form.categoryName || product.category_name}>
                    <SelectTrigger style={{ ...s.input, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <React.Fragment key={cat.category_id}>
                          <SelectItem value={cat.category_name}>{cat.category_name}</SelectItem>
                          {cat.subcategories?.map(sub => <SelectItem key={sub.category_id} value={sub.category_name}>↳ {sub.category_name}</SelectItem>)}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><label style={s.fieldLabel}>Replace Image</label>
                  <input name="image" type="file" onChange={handleChange} style={{ ...s.input, padding: '5px 8px' }} /></div>
              </div>
            </div>

            {/* Variant selector */}
            <div>
              <p style={s.sectionHead}>Select Variant</p>
              <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {product.variants.map(v => {
                  const vStock = Number(v.stock || 0);
                  const isSel = selectedVariantId === v.variant_id;
                  return (
                    <div key={v.variant_id} onClick={() => setSelectedVariantId(v.variant_id)} style={s.variantPill(isSel)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, fontFamily: sans, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{getVariantDisplay(product, v)}</div>
                          <div style={{ fontSize: 10, fontFamily: mono, color: 'rgba(255,255,255,0.42)', marginTop: 1 }}>
                            {vStock < 0 ? `BO: ${vStock}` : `${vStock} in stock`}
                          </div>
                        </div>
                      </div>
                      {v.image && <img src={v.image} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.07)' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── variant editing ── */}
          {user?.role === 'admin' && selectedVariant && (
            <>
              <div style={s.divider} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ ...s.sectionHead, margin: 0 }}>Editing Variant</p>
                <span style={{ fontSize: 10, fontFamily: mono, color: 'rgba(255,255,255,0.28)' }}>Stock: {currentStock}</span>
              </div>

              {/* stock update */}
              <div style={{ ...s.panel, marginBottom: 16 }}>
                <p style={{ ...s.sectionHead, marginBottom: 8 }}>Update Stock</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" value={newStock} onChange={e => setNewStock(e.target.value)}
                    placeholder="New quantity" style={{ ...s.input, flex: 1 }} />
                  <button type="button" onClick={handleUpdateStock} disabled={updatingStock || newStock === ''} style={s.btnSmall}>
                    {updatingStock ? '…' : 'Update'}
                  </button>
                </div>
                {newStock !== '' && !isNaN(Number(newStock)) && (
                  <p style={{ fontSize: 10, fontFamily: mono, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                    {currentStock} → {Number(newStock)} ({Number(newStock) - currentStock > 0 ? '+' : ''}{Number(newStock) - currentStock})
                  </p>
                )}
              </div>

              {/* pricing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Buying Price', name: 'buying_price' },
                  { label: 'Profit Margin', name: 'profit_margin' },
                  { label: 'Discount', name: 'discount' },
                  { label: 'Final Price', name: 'final_price' },
                ].map(({ label, name }) => (
                  <div key={name}>
                    <label style={{ ...s.fieldLabel, color: name === 'final_price' ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.22)' }}>{label}</label>
                    <input name={name} type="number" value={variantForm[name]} onChange={handleChange}
                      style={{ ...s.input, fontFamily: mono, borderColor: name === 'final_price' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)' }} />
                  </div>
                ))}
              </div>

              {/* batches */}
              {loadingBatches && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: sans, marginBottom: 12 }}>Loading batches…</p>}
              {batches.length > 0 && (
                <div style={{ ...s.panel, marginBottom: 16 }}>
                  <p style={{ ...s.sectionHead, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                    <Package size={10} style={{ opacity: 0.5 }} /> Batches (FIFO)
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      {['#','Rcvd','Rem.','Cost','Value'].map((h, i) => (
                        <th key={h} style={{ ...s.th, textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {batches.map((b, i) => (
                        <tr key={b.batch_id || i}>
                          <td style={s.tdMono}>{i+1}</td>
                          <td style={s.tdRight}>{b.quantity_received}</td>
                          <td style={s.tdRight}>{b.remaining_quantity}</td>
                          <td style={s.tdRight}>Kshs {Number(b.buying_price).toFixed(0)}</td>
                          <td style={{ ...s.tdRight, color: 'rgba(255,255,255,0.55)' }}>Kshs {(b.remaining_quantity * b.buying_price).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* image + color */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={s.fieldLabel}>Replace Variant Image</label>
                  <input name="variant_image" type="file" onChange={handleChange} style={{ ...s.input, padding: '5px 8px' }} /></div>
                <div><label style={s.fieldLabel}>Variant Color</label>
                  <input name="color" type="color" value={variantForm.color} onChange={handleChange}
                    style={{ ...s.input, height: 34, padding: '2px 4px', cursor: 'pointer' }} /></div>
              </div>
            </>
          )}

          <div style={s.divider} />
          <AdminImageGallery product={product} />
          <div style={{ ...s.divider }} />

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={busy} style={s.btnPrimary}>{busy ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" onClick={() => setIsEditing(false)} style={s.btnSecondary}>Cancel</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ─────────────────────────────────────────────
   ReceiveStockModal
───────────────────────────────────────────── */
const ReceiveStockModal = ({ product, onUpdated, setIsReceivingStock, token }) => {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.variant_id || '');
  const [qty, setQty]           = useState('');
  const [bp, setBp]             = useState('');
  const [busy, setBusy]         = useState(false);
  const [batches, setBatches]   = useState([]);
  const [avgCost, setAvgCost]   = useState(0);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [imeiNumbers, setImeiNumbers] = useState([]);
  const [loadingBarcode, setLoadingBarcode] = useState(false);
  const [barcodeError, setBarcodeError] = useState(null);

  const selectedVariant = product.variants?.find(v => v.variant_id.toString() === selectedVariantId.toString());
  const stockValue = Number(selectedVariant?.stock || 0);

  useEffect(() => {
    if (!selectedVariantId) return;
    setLoadingBatches(true);
    Promise.all([
      axios.get(`${API_BASE}/api/products/variants/${selectedVariantId}/batches`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE}/api/products/variants/${selectedVariantId}/average-cost`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([bR, aR]) => { setBatches(bR.data || []); setAvgCost(aR.data.averageCost || 0); })
      .catch(() => { setBatches([]); setAvgCost(0); })
      .finally(() => setLoadingBatches(false));
  }, [selectedVariantId, token]);

  const handleBarcodeLookup = async () => {
    if (!barcodeInput.trim()) return;
    setLoadingBarcode(true); setBarcodeError(null);
    try {
      const result = await lookupByBarcode(barcodeInput.trim(), token);
      if (result.found) {
        const v = result.type === 'product_code' ? result.variant : result.imei;
        setScannedProduct(v); setSelectedVariantId(v.variant_id); setBp(v.buying_price || '');
      } else { setBarcodeError('Not found.'); }
    } catch { setBarcodeError('Lookup failed.'); } finally { setLoadingBarcode(false); }
  };

  const handleReceive = async e => {
    e.preventDefault();
    const qtyN = Number(qty), bpN = Number(bp);
    if (!selectedVariantId) { toast.error('Select a variant'); return; }
    if (qtyN <= 0 || isNaN(qtyN)) { toast.error('Invalid quantity'); return; }
    if (bpN <= 0 || isNaN(bpN)) { toast.error('Invalid price'); return; }
    try {
      setBusy(true);
      const r = await axios.post(`${API_BASE}/api/products/variants/${selectedVariantId}/receive-stock`,
        { quantityReceived: qtyN, buyingPrice: bpN, imeis: imeiNumbers }, { headers: { Authorization: `Bearer ${token}` } });
      if (imeiNumbers.length > 0) {
        await axios.post(`${API_BASE}/api/imei/${selectedVariantId}/bulk`, { imeiText: imeiNumbers.join('\n') }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }
      onUpdated?.(r.data.product); setIsReceivingStock(false);
      toast.success(`${qtyN} units received`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setBusy(false); }
  };

  if (!product.variants?.length) return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div style={{ ...s.modal, maxWidth: 400 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: sans }}>No variants available.</p>
        <button onClick={() => setIsReceivingStock(false)} style={{ ...s.btnSecondary, marginTop: 12 }}>Close</button>
      </div>
    </div>, document.body
  );

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div style={{ ...s.modal, maxWidth: 560 }}>
        <button onClick={() => setIsReceivingStock(false)} style={s.modalClose}><X size={13} /></button>
        <p style={s.modalTitle}>Receive Stock</p>

        <form onSubmit={handleReceive} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* barcode */}
          <div style={s.panel}>
            <p style={{ ...s.sectionHead, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <ScanBarcode size={10} style={{ opacity: 0.45 }} /> Scan IMEI (optional)
            </p>
            <div style={{ display: 'flex', gap: 7 }}>
              <input value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} placeholder="Enter or scan IMEI…"
                style={{ ...s.input, flex: 1 }} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleBarcodeLookup())} />
              <button type="button" onClick={handleBarcodeLookup} disabled={loadingBarcode || !barcodeInput.trim()} style={s.btnSmall}>
                {loadingBarcode ? '…' : 'Search'}
              </button>
            </div>
            {barcodeError && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 5, fontFamily: sans }}>{barcodeError}</p>}
            {scannedProduct && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.48)', marginTop: 5, fontFamily: sans }}>✓ {scannedProduct.product_name}</p>}
          </div>

          {/* variant list */}
          <div>
            <p style={s.sectionHead}>Select Variant</p>
            <div style={{ maxHeight: 190, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {product.variants.map(v => {
                const vStock = Number(v.stock || 0);
                const isSel = selectedVariantId === v.variant_id;
                return (
                  <div key={v.variant_id} onClick={() => setSelectedVariantId(v.variant_id)} style={s.variantPill(isSel)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontFamily: sans, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{getVariantDisplay(product, v)}</div>
                        <div style={{ fontSize: 10, fontFamily: mono, color: 'rgba(255,255,255,0.40)', marginTop: 1 }}>
                          {vStock < 0 ? `BO: ${vStock}` : `${vStock} in stock`}
                        </div>
                      </div>
                    </div>
                    {v.image && <img src={v.image} alt="" style={{ width: 26, height: 26, borderRadius: 4, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.07)' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* batches */}
          {loadingBatches && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: sans }}>Loading…</p>}
          {batches.length > 0 && (
            <div style={s.panel}>
              <p style={{ ...s.sectionHead, marginBottom: 8 }}>Existing Batches — Avg: Kshs {avgCost.toFixed(0)}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['#','Rem.','Cost','Total'].map((h, i) => (
                    <th key={h} style={{ ...s.th, textAlign: i >= 1 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{batches.map((b, i) => (
                  <tr key={b.batch_id || i}>
                    <td style={s.tdMono}>{i+1}</td>
                    <td style={s.tdRight}>{b.remaining_quantity}</td>
                    <td style={s.tdRight}>Kshs {Number(b.buying_price).toFixed(0)}</td>
                    <td style={{ ...s.tdRight, color: 'rgba(255,255,255,0.52)' }}>Kshs {(b.remaining_quantity * b.buying_price).toFixed(0)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* qty + price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={s.fieldLabel}>Quantity</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} required min="1"
                disabled={!selectedVariantId} placeholder="Units to add" style={{ ...s.input, fontFamily: mono }} /></div>
            <div><label style={s.fieldLabel}>Buying Price / Unit</label>
              <input type="number" value={bp} onChange={e => setBp(e.target.value)} required min="0.01" step="0.01"
                disabled={!selectedVariantId} placeholder="Cost per unit" style={{ ...s.input, fontFamily: mono }} /></div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={busy || !selectedVariantId} style={{ ...s.btnPrimary, flex: 1 }}>
              {busy ? 'Receiving…' : 'Receive Stock'}
            </button>
            <button type="button" onClick={() => setIsReceivingStock(false)} style={s.btnSecondary}>Cancel</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ─────────────────────────────────────────────
   ProductCard
───────────────────────────────────────────── */
const ProductCard = ({ product, onDeleted, onUpdated }) => {
  const { user, token } = useUser();
  const [isEditing, setIsEditing]             = useState(false);
  const [isReceivingStock, setIsReceivingStock] = useState(false);
  const [showMobileMenu, setShowMobileMenu]   = useState(false);
  const [busy, setBusy]                       = useState(false);
  const [isVisible, setIsVisible]             = useState(product.is_visible);
  const [isFeatured, setIsFeatured]           = useState(product.is_featured || false);

  const handleToggleVisibility = async () => {
    const next = !isVisible; setIsVisible(next);
    try { await axios.put(`${API_BASE}/api/products/${product.product_id}/toggle-visibility`, { is_visible: next }, { headers: { Authorization: `Bearer ${token}` } }); onUpdated?.({ ...product, is_visible: next }); }
    catch { setIsVisible(!next); toast.error('Failed'); }
  };
  const handleToggleFeatured = async () => {
    const next = !isFeatured; setIsFeatured(next);
    try { await axios.put(`${API_BASE}/api/products/${product.product_id}/toggle-featured`, { is_featured: next }, { headers: { Authorization: `Bearer ${token}` } }); onUpdated?.({ ...product, is_featured: next }); }
    catch { setIsFeatured(!next); toast.error('Failed'); }
  };
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.title}"?`)) return;
    try { setBusy(true); await axios.delete(`${API_BASE}/api/products/${product.product_id}`, { headers: { Authorization: `Bearer ${token}` } }); onDeleted?.(product.product_id); toast.success('Deleted'); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setBusy(false); }
  };

  const totalStock    = product.variants?.reduce((s, v) => s + (Number(v.stock) || 0), 0) || 0;
  const displayVariant = product.variants?.[0];

  if (!displayVariant) return (
    <tr><td colSpan="6" style={{ padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,0.20)', fontFamily: sans, fontStyle: 'italic' }}>No variants</td></tr>
  );

  const originalPrice   = calculateSellingPrice(displayVariant.buying_price, displayVariant.profit_margin, 0);
  const discountedPrice = Number(displayVariant.price) || 0;
  const hasDiscount     = Number(displayVariant.discount) > 0;
  const stockNum        = Number(totalStock);
  const isBackordered   = stockNum < 0;

  /* stock badge — monochrome pill */
  const stockBadge = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      height: 20, minWidth: 24, padding: '0 6px', borderRadius: 4,
      fontFamily: mono, fontSize: 10, fontWeight: 500,
      background: isBackordered ? 'rgba(255,255,255,0.04)' : stockNum <= 5 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.09)',
      color: isBackordered ? 'rgba(255,255,255,0.45)' : stockNum <= 5 ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.82)',
      border: '1px solid rgba(255,255,255,0.12)',
      textDecoration: isBackordered ? 'line-through' : 'none',
      textDecorationColor: 'rgba(255,255,255,0.30)',
    }}>
      {isBackordered ? `BO:${stockNum}` : stockNum}
    </span>
  );

  return (
    <>
      {/* ── MOBILE ── */}
      <tr className="lg:hidden product-card-mobile">
        <td colSpan="6" style={{ padding: '3px 4px', border: 'none' }}>
          <div style={{ padding: '10px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)', margin: '2px 0' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <img src={displayVariant.image || product.image} alt={product.title}
                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.88)', fontFamily: sans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</div>
                    <div style={{ fontSize: 10, fontFamily: mono, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>#{product.product_id}</div>
                  </div>
                  <button onClick={() => setShowMobileMenu(!showMobileMenu)} style={s.iconBtn}><MoreVertical size={13} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  {hasDiscount ? (
                    <span>
                      <span style={{ fontSize: 10, fontFamily: mono, color: 'rgba(255,255,255,0.38)', textDecoration: 'line-through' }}>Kshs {Number(originalPrice).toFixed(0)}</span>
                      <span style={{ fontSize: 12, fontFamily: mono, color: 'rgba(255,255,255,0.75)', marginLeft: 5 }}>Kshs {Number(discountedPrice).toFixed(0)}</span>
                    </span>
                  ) : <span style={{ fontSize: 12, fontFamily: mono, color: 'rgba(255,255,255,0.88)' }}>Kshs {Number(discountedPrice).toFixed(0)}</span>}
                  {stockBadge}
                </div>
              </div>
            </div>

            {showMobileMenu && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { icon: <SquarePen size={13} />, label: 'Update Details', action: () => { setIsEditing(true); setShowMobileMenu(false); } },
                  { icon: <CookingPot size={13} />, label: 'Receive Stock', action: () => { setIsReceivingStock(true); setShowMobileMenu(false); } },
                  { icon: <Trash2 size={13} />, label: busy ? '…' : 'Delete', action: handleDelete },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action} disabled={busy && label === 'Delete'}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(255,255,255,0.48)', fontSize: 12, fontFamily: sans, cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ opacity: 0.5 }}>{icon}</span>{label}
                  </button>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4 }}>
                  <div style={s.toggleRow}>
                    <Switch id={`vis-mob-${product.product_id}`} checked={isVisible} onCheckedChange={handleToggleVisibility} />
                    <label htmlFor={`vis-mob-${product.product_id}`} style={s.toggleLabel}>{isVisible ? 'Visible' : 'Hidden'}</label>
                  </div>
                  <div style={s.toggleRow}>
                    <Switch id={`feat-mob-${product.product_id}`} checked={isFeatured} onCheckedChange={handleToggleFeatured} />
                    <label htmlFor={`feat-mob-${product.product_id}`} style={s.toggleLabel}>{isFeatured ? 'Featured' : 'Normal'}</label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* ── DESKTOP ── */}
      <tr className="hidden lg:table-row product-card">
        {/* Product */}
        <td style={{ padding: '9px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src={displayVariant.image || product.image} alt={product.title}
              style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.92)', fontFamily: sans, letterSpacing: '-0.01em' }}>{product.title}</div>
              <div style={{ fontSize: 10, fontFamily: mono, color: 'rgba(255,255,255,0.40)', marginTop: 1 }}>#{product.product_id}</div>
            </div>
          </div>
        </td>

        {/* Price */}
        <td style={{ padding: '9px 12px' }}>
          {hasDiscount ? (
            <div>
              <div style={{ fontSize: 10, fontFamily: mono, color: 'rgba(255,255,255,0.40)', textDecoration: 'line-through' }}>Kshs {Number(originalPrice).toFixed(0)}</div>
              <div style={{ fontSize: 12, fontFamily: mono, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Kshs {Number(discountedPrice).toFixed(0)}</div>
            </div>
          ) : <span style={{ fontSize: 12, fontFamily: mono, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>Kshs {Number(discountedPrice).toFixed(0)}</span>}
        </td>

        {/* Stock */}
        <td style={{ padding: '9px 12px' }}>{stockBadge}</td>

        {/* WAC */}
        <td style={{ padding: '9px 12px' }}>
          <span style={{ fontSize: 11, fontFamily: mono, color: 'rgba(255,255,255,0.62)' }}>Kshs {displayVariant.wac ? Number(displayVariant.wac).toFixed(0) : '0'}</span>
        </td>

        {/* Stock Value */}
        <td style={{ padding: '9px 12px' }}>
          <span style={{ fontSize: 11, fontFamily: mono, color: 'rgba(255,255,255,0.62)' }}>
            Kshs {product.variants?.reduce((sum, v) => sum + (Number(v.stock_value)||0), 0).toFixed(0) || '0'}
          </span>
        </td>

        {/* Actions */}
        <td style={{ padding: '9px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            {/* icon row */}
            <div style={{ display: 'flex', gap: 3 }}>
              {[
                { icon: <SquarePen size={12} />, action: () => setIsEditing(true),        title: 'Edit' },
                { icon: <CookingPot size={12} />, action: () => setIsReceivingStock(true), title: 'Receive' },
                { icon: <Trash2 size={12} />,    action: handleDelete,                    title: 'Delete', disabled: busy },
              ].map(({ icon, action, title, disabled }) => (
                <button key={title} onClick={action} disabled={disabled} title={title}
                  style={s.iconBtn}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.92)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.50)'}>
                  {icon}
                </button>
              ))}
            </div>
            {/* toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
              <div style={s.toggleRow}>
                <Switch id={`vis-${product.product_id}`} checked={isVisible} onCheckedChange={handleToggleVisibility} />
                <label htmlFor={`vis-${product.product_id}`} style={s.toggleLabel}>{isVisible ? 'Visible' : 'Hidden'}</label>
              </div>
              <div style={s.toggleRow}>
                <Switch id={`feat-${product.product_id}`} checked={isFeatured} onCheckedChange={handleToggleFeatured} />
                <label htmlFor={`feat-${product.product_id}`} style={s.toggleLabel}>{isFeatured ? 'Featured' : 'Normal'}</label>
              </div>
            </div>
          </div>
        </td>
      </tr>

      {isEditing && <EditProductModal product={product} onUpdated={onUpdated} setIsEditing={setIsEditing} user={user} token={token} />}
      {isReceivingStock && <ReceiveStockModal product={product} onUpdated={onUpdated} setIsReceivingStock={setIsReceivingStock} token={token} />}
    </>
  );
};

export default ProductCard;