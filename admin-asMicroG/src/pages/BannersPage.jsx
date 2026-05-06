import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const POSITIONS = ["hero", "mid", "popup", "sidebar"];

const ASPECT_RATIOS = [
  { value: "21/8", label: "Wide Hero (21:8)", css: "21/8" },
  { value: "16/9", label: "Landscape (16:9)", css: "16/9" },
  { value: "4/3",  label: "Standard (4:3)",  css: "4/3"  },
  { value: "1/1",  label: "Square (1:1)",    css: "1/1"  },
  { value: "3/4",  label: "Portrait (3:4)",  css: "3/4"  },
];

const empty = {
  title: "", subtitle: "", position: "hero", link: "", button_text: "Shop Now",
  valid_from: "", valid_until: "", is_active: true,
  aspect_ratio: "21/8", object_fit: "cover",
};

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = () => {
    api.get("/banners/admin/banners/")
      .then(({ data }) => setBanners(data.results || data))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const openEdit = (b) => {
    setForm({
      ...b,
      link: b.link || "",
      button_text: b.button_text || "Shop Now",
      valid_from: b.valid_from?.slice(0, 16) || "",
      valid_until: b.valid_until?.slice(0, 16) || "",
      aspect_ratio: b.aspect_ratio || "21/8",
      object_fit: b.object_fit || "cover",
    });
    setEditing(b.id);
    setImageFile(null);
    setImagePreview(b.image || null);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "" && v !== null) fd.append(k, v); });
      if (imageFile) fd.append("image", imageFile);
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (editing) {
        await api.patch(`/banners/admin/banners/${editing}/`, fd, config);
        toast.success("Banner updated.");
      } else {
        await api.post("/banners/admin/banners/", fd, config);
        toast.success("Banner created.");
      }
      setShowForm(false);
      setForm(empty);
      setEditing(null);
      setImageFile(null);
      setImagePreview(null);
      load();
    } catch {
      toast.error("Failed to save banner.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    await api.delete(`/banners/admin/banners/${id}/`);
    setBanners((b) => b.filter((x) => x.id !== id));
    toast.success("Banner deleted.");
  };

  const toggleActive = async (b) => {
    await api.patch(`/banners/admin/banners/${b.id}/`, { is_active: !b.is_active });
    setBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, is_active: !b.is_active } : x));
  };

  const selectedRatio = ASPECT_RATIOS.find((r) => r.value === form.aspect_ratio) || ASPECT_RATIOS[0];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Banners</h1>
        <button className="btn-admin btn-primary-admin" onClick={() => { setForm(empty); setEditing(null); setImageFile(null); setImagePreview(null); setShowForm(true); }}>
          + New Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card-admin" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{editing ? "Edit Banner" : "New Banner"}</h3>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            {/* Left: fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[["title", "Title *"], ["subtitle", "Subtitle"], ["link", "Link URL (e.g. /products)"], ["button_text", "Button Text"]].map(([k, l]) => (
                <div key={k}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</label>
                  <input className="input-admin" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} required={k === "title"} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Position</label>
                <select className="input-admin" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}>
                  {POSITIONS.map((p) => <option key={p} value={p} style={{ textTransform: "capitalize" }}>{p}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["valid_from", "Valid From"], ["valid_until", "Valid Until"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</label>
                    <input className="input-admin" type="datetime-local" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                <span style={{ fontSize: "0.85rem" }}>Active</span>
              </label>
            </div>

            {/* Right: image + size controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Aspect ratio chooser */}
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Banner Size / Aspect Ratio</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, aspect_ratio: r.value }))}
                      style={{
                        padding: "5px 12px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer",
                        border: form.aspect_ratio === r.value ? "2px solid var(--primary)" : "1px solid var(--border)",
                        background: form.aspect_ratio === r.value ? "var(--primary)" : "var(--bg-card)",
                        color: form.aspect_ratio === r.value ? "white" : "var(--text-primary)",
                        fontWeight: form.aspect_ratio === r.value ? 700 : 400,
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Object-fit toggle */}
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Image Fit</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["cover", "Fill (crop)"], ["contain", "Contain (full)"]].map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, object_fit: v }))}
                      style={{
                        padding: "5px 14px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer",
                        border: form.object_fit === v ? "2px solid var(--primary)" : "1px solid var(--border)",
                        background: form.object_fit === v ? "var(--primary)" : "var(--bg-card)",
                        color: form.object_fit === v ? "white" : "var(--text-primary)",
                        fontWeight: form.object_fit === v ? 700 : 400,
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image upload with live preview at chosen aspect ratio */}
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Banner Image — Preview ({selectedRatio.label})
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    aspectRatio: selectedRatio.css,
                    width: "100%",
                    border: "2px dashed var(--border)",
                    borderRadius: "var(--r-md)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", overflow: "hidden", background: "var(--bg)",
                    position: "relative",
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: form.object_fit, display: "block" }}
                    />
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: "2rem" }}>🖼️</div>
                      <p style={{ fontSize: "0.82rem", marginTop: 6 }}>Click to upload image</p>
                      <p style={{ fontSize: "0.75rem" }}>Preview updates when you choose size above</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
                {imagePreview && (
                  <button type="button" className="btn-admin" style={{ marginTop: 8, fontSize: "0.78rem", padding: "3px 10px" }}
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" className="btn-admin" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-admin btn-primary-admin" disabled={saving}>
              {saving ? "Saving…" : "Save Banner"}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {loading ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40 }}><div className="spinner-admin" style={{ margin: "auto" }} /></div>
        ) : banners.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No banners yet.</div>
        ) : banners.map((b) => (
          <div key={b.id} className="card-admin" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ aspectRatio: b.aspect_ratio || "16/9", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
              {b.image ? (
                <img src={b.image} alt={b.title} style={{ width: "100%", height: "100%", objectFit: b.object_fit || "cover" }} />
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "2.5rem" }}>🖼️</div>
              )}
              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                <span className={`badge-admin ${b.is_active ? "badge-success" : "badge-error"}`} style={{ fontSize: "0.7rem" }}>
                  {b.is_active ? "Active" : "Inactive"}
                </span>
                <span className="badge-admin badge-info" style={{ fontSize: "0.7rem", textTransform: "capitalize" }}>{b.position}</span>
              </div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 2 }}>{b.title}</p>
              {b.subtitle && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>{b.subtitle}</p>}
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>
                Size: {ASPECT_RATIOS.find(r => r.value === b.aspect_ratio)?.label || b.aspect_ratio || "—"} · Fit: {b.object_fit || "cover"}
              </p>
              {b.valid_until && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Expires: {new Date(b.valid_until).toLocaleDateString("en-IN")}
                </p>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <button className="btn-admin" style={{ flex: 1, padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => openEdit(b)}>Edit</button>
                <button className="btn-admin" style={{ flex: 1, padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => toggleActive(b)}>
                  {b.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="btn-admin btn-danger-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => deleteBanner(b.id)}>Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
