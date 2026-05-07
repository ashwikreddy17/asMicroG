import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const emptyVariant = { name: "", sku: "", price_adjustment: 0, stock: 0 };
const emptyForm = {
  name: "", description: "", category: "", price: "", sale_price: "", stock: 0,
  sku: "", brand: "", is_active: true, is_featured: false, weight: "", meta_title: "", meta_description: "",
};

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const fileRef = useRef();

  useEffect(() => {
    api.get("/products/admin/categories/").then(({ data }) => setCategories(data.results || data));
    if (isEdit) {
      api.get(`/products/admin/products/${id}/`).then(({ data }) => {
        setForm({
          name: data.name || "", description: data.description || "",
          category: data.category?.id || data.category || "",
          price: data.price || "", sale_price: data.sale_price || "",
          stock: data.stock || 0, is_active: data.is_active ?? true,
          is_featured: data.is_featured ?? false, weight: data.weight || "",
          meta_title: data.meta_title || "", meta_description: data.meta_description || "",
        });
        setVariants(data.variants || []);
        setExistingImages(data.images || []);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const onFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const deleteExistingImage = async (imgId) => {
    await api.delete(`/products/admin/product-images/${imgId}/`);
    setExistingImages((prev) => prev.filter((x) => x.id !== imgId));
  };

  const addVariant = () => setVariants((v) => [...v, { ...emptyVariant, _key: Date.now() }]);

  const updateVariant = (i, field, value) => {
    setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  };

  const removeVariant = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });
      images.forEach((img) => fd.append("uploaded_images", img));

      let productId = id;
      if (isEdit) {
        await api.patch(`/products/admin/products/${id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const { data } = await api.post("/products/admin/products/", fd, { headers: { "Content-Type": "multipart/form-data" } });
        productId = data.id;
      }

      // Save variants
      for (const v of variants) {
        const payload = { product: productId, name: v.name, sku: v.sku, price_adjustment: v.price_adjustment, stock: v.stock };
        if (v.id) await api.patch(`/products/admin/variants/${v.id}/`, payload);
        else await api.post("/products/admin/variants/", payload);
      }

      toast.success(isEdit ? "Product updated." : "Product created.");
      navigate("/products");
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === "string" ? msg : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner-admin" /></div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="btn-admin" style={{ padding: "6px 12px" }} onClick={() => navigate("/products")}>← Back</button>
        <h1>{isEdit ? "Edit Product" : "New Product"}</h1>
      </div>

      <form onSubmit={save}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Basic Info */}
            <div className="card-admin" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Basic Info</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Product Name *</label>
                  <input className="input-admin" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Description</label>
                  <textarea className="input-admin" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={5} style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Price (₹) *</label>
                    <input className="input-admin" type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Sale Price (₹)</label>
                    <input className="input-admin" type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Stock</label>
                    <input className="input-admin" type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>SKU <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(leave blank to auto-generate)</span></label>
                    <input className="input-admin" value={form.sku} placeholder="e.g. TOM-001" onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Brand</label>
                    <input className="input-admin" value={form.brand} placeholder="e.g. Organic Farm" onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Category</label>
                    <select className="input-admin" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                      <option value="">— Select Category —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Weight (g)</label>
                    <input className="input-admin" type="number" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="card-admin" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3>Images</h3>
                <button type="button" className="btn-admin" style={{ fontSize: "0.8rem", padding: "4px 12px" }} onClick={() => fileRef.current?.click()}>+ Add Images</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onFilesChange} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {existingImages.map((img) => (
                  <div key={img.id} style={{ position: "relative" }}>
                    <img src={img.image} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8 }} />
                    <button type="button"
                      style={{ position: "absolute", top: 3, right: 3, background: "#ef5350", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => deleteExistingImage(img.id)}>✕</button>
                    {img.is_primary && <span style={{ position: "absolute", bottom: 3, left: 3, background: "var(--primary)", color: "white", fontSize: "0.6rem", padding: "1px 5px", borderRadius: 4 }}>Primary</span>}
                  </div>
                ))}
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={src} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, opacity: 0.85 }} />
                    <button type="button"
                      style={{ position: "absolute", top: 3, right: 3, background: "#ef5350", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => removeNewImage(i)}>✕</button>
                    <span style={{ position: "absolute", bottom: 3, left: 3, background: "#555", color: "white", fontSize: "0.6rem", padding: "1px 5px", borderRadius: 4 }}>New</span>
                  </div>
                ))}
                {existingImages.length === 0 && imagePreviews.length === 0 && (
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{ width: 90, height: 90, border: "2px dashed var(--border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.5rem" }}>+</div>
                )}
              </div>
            </div>

            {/* Variants */}
            <div className="card-admin" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3>Variants</h3>
                <button type="button" className="btn-admin" style={{ fontSize: "0.8rem", padding: "4px 12px" }} onClick={addVariant}>+ Add Variant</button>
              </div>
              {variants.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No variants. Product will use base stock and price.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {variants.map((v, i) => (
                    <div key={v.id || v._key || i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 8, alignItems: "end" }}>
                      {[["name", "Name"], ["sku", "SKU"]].map(([field, label]) => (
                        <div key={field}>
                          <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 3 }}>{label}</label>
                          <input className="input-admin" style={{ padding: "6px 10px", fontSize: "0.82rem" }} value={v[field]} onChange={(e) => updateVariant(i, field, e.target.value)} />
                        </div>
                      ))}
                      {[["price_adjustment", "Price Adj (₹)"], ["stock", "Stock"]].map(([field, label]) => (
                        <div key={field}>
                          <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 3 }}>{label}</label>
                          <input className="input-admin" type="number" style={{ padding: "6px 10px", fontSize: "0.82rem" }} value={v[field]} onChange={(e) => updateVariant(i, field, e.target.value)} />
                        </div>
                      ))}
                      <button type="button" className="btn-admin btn-danger-admin" style={{ padding: "6px 10px", fontSize: "0.8rem", marginBottom: 0 }} onClick={() => removeVariant(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="card-admin" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 14 }}>SEO</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Meta Title</label>
                  <input className="input-admin" value={form.meta_title} onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Meta Description</label>
                  <textarea className="input-admin" value={form.meta_description} onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))} rows={2} style={{ resize: "none" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card-admin" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 14 }}>Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                  <span style={{ fontSize: "0.88rem" }}>Active (visible in store)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
                  <span style={{ fontSize: "0.88rem" }}>Featured (shown on homepage)</span>
                </label>
              </div>
            </div>

            <div className="card-admin" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 14 }}>Pricing Summary</h3>
              {form.price ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Base Price</span>
                    <span>₹{Number(form.price).toLocaleString("en-IN")}</span>
                  </div>
                  {form.sale_price && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Sale Price</span>
                        <span style={{ color: "var(--primary-light)" }}>₹{Number(form.sale_price).toLocaleString("en-IN")}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Discount</span>
                        <span style={{ color: "#ef5350" }}>
                          {Math.round((1 - form.sale_price / form.price) * 100)}% off
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Enter price to see summary.</p>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="submit" className="btn-admin btn-primary-admin" style={{ padding: "12px 0", fontSize: "1rem" }} disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
              </button>
              <button type="button" className="btn-admin" style={{ padding: "10px 0" }} onClick={() => navigate("/products")}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
