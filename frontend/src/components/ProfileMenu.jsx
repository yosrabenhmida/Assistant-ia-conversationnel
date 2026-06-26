import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu() {
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}"),
  );
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ value: "", confirm: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const openModal = (type) => {
    setModal(type);
    setOpen(false);
    setForm({ value: "", confirm: "", password: "" });
    setMessage("");
    setError("");
  };

  const closeModal = () => {
    setModal(null);
    setMessage("");
    setError("");
  };

  const handleUpdate = async (endpoint, body, successMsg) => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/auth/${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur");
        return;
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      }
      setMessage(successMsg);
      setTimeout(() => closeModal(), 1500);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/auth/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Erreur lors de la suppression");
        return;
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/signup");
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const initials = (user.username || "U").slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        * { transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, opacity 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease; }

        .profile-wrapper {
          position: absolute; top: 10px; right: 14px; z-index: 10;
        }

        /* ── Bouton profil ── */
        .profile-btn {
          display: flex; align-items: center; gap: 9px;
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 22px; padding: 5px 14px 5px 5px;
          cursor: pointer; color: #fff; font-size: 13px; font-weight: 600;
          box-shadow: 0 2px 12px rgba(0,0,0,0.18);
        }
        .profile-btn:hover {
          background: rgba(0,0,0,0.32);
          border-color: rgba(255,255,255,0.32);
          box-shadow: 0 4px 20px rgba(233,30,140,0.18);
        }

        /* ── Avatar ── */
        .avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #ff6b35, #e91e8c);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: #fff;
          box-shadow: 0 2px 8px rgba(233,30,140,0.35);
          flex-shrink: 0;
        }

        /* ── Dropdown ── */
        .profile-dropdown {
          position: absolute; top: 48px; right: 0;
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 8px; min-width: 240px;
          box-shadow: 0 16px 50px rgba(0,0,0,0.55);
          transform-origin: top right;
          animation: dropdownOpen 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes dropdownOpen {
          from { opacity: 0; transform: scale(0.88) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Header du dropdown ── */
        .dropdown-header {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 12px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 6px;
        }
        .avatar-lg {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #ff6b35, #e91e8c);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 800; color: #fff;
          box-shadow: 0 3px 12px rgba(233,30,140,0.4);
        }
        .dropdown-user-info .d-name {
          color: #fff; font-weight: 700; font-size: 14px; line-height: 1.3;
        }
        .dropdown-user-info .d-email {
          color: #777; font-size: 12px; margin-top: 2px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 160px;
        }

        /* ── Items ── */
        .dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px; cursor: pointer;
          color: #bbb; font-size: 13px; font-weight: 500;
          border: none; background: none; width: 100%; text-align: left;
        }
        .dropdown-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .dropdown-item .item-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; background: rgba(255,255,255,0.06); flex-shrink: 0;
        }
        .dropdown-item.danger { color: #e74c3c; }
        .dropdown-item.danger:hover { background: rgba(231,76,60,0.1); }
        .dropdown-item.logout { color: #ff6b35; }
        .dropdown-item.logout:hover { background: rgba(255,107,53,0.1); }
        .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 6px 0; }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .modal-box {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 32px 28px;
          width: 100%; max-width: 390px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.6);
          animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(135deg, #ff6b35, #e91e8c);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 16px;
          box-shadow: 0 4px 16px rgba(233,30,140,0.3);
        }
        .modal-title {
          color: #fff; font-size: 20px; font-weight: 700; margin-bottom: 6px;
        }
        .modal-subtitle {
          color: #666; font-size: 13px; margin-bottom: 22px; line-height: 1.5;
        }
        .modal-input {
          width: 100%; background: #16213e;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 11px; padding: 13px 15px; color: #fff;
          font-size: 14px; outline: none; margin-bottom: 12px;
          box-sizing: border-box;
        }
        .modal-input:focus { border-color: #e91e8c; background: #1c2847; }
        .modal-input::placeholder { color: #444; }
        .modal-error {
          color: #e74c3c; font-size: 13px; margin-bottom: 14px;
          background: rgba(231,76,60,0.1); border-radius: 8px; padding: 9px 12px;
        }
        .modal-success {
          color: #2ecc71; font-size: 13px; margin-bottom: 14px;
          background: rgba(46,204,113,0.1); border-radius: 8px; padding: 9px 12px;
        }
        .modal-actions { display: flex; gap: 10px; margin-top: 6px; }
        .btn-cancel {
          flex: 1; padding: 13px; border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.1); background: none;
          color: #888; font-size: 14px; cursor: pointer; font-weight: 500;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .btn-confirm {
          flex: 1; padding: 13px; border-radius: 11px; border: none;
          background: linear-gradient(135deg, #ff6b35, #e91e8c);
          color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 16px rgba(233,30,140,0.3);
        }
        .btn-confirm:hover { opacity: 0.88; box-shadow: 0 6px 22px rgba(233,30,140,0.45); }
        .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-confirm.danger-btn {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          box-shadow: 0 4px 16px rgba(231,76,60,0.3);
        }
        .btn-confirm.danger-btn:hover { box-shadow: 0 6px 22px rgba(231,76,60,0.45); }
      `}</style>

      <div className="profile-wrapper" ref={menuRef}>
        {/* ── Bouton profil ── */}
        <button className="profile-btn" onClick={() => setOpen(!open)}>
          <div className="avatar">{initials}</div>
          {user.username || "Profil"}
          <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>
            {open ? "▲" : "▼"}
          </span>
        </button>

        {/* ── Menu déroulant ── */}
        {open && (
          <div className="profile-dropdown">
            {/* Header avec avatar + nom + email */}
            <div className="dropdown-header">
              <div className="avatar-lg">{initials}</div>
              <div className="dropdown-user-info">
                <div className="d-name">{user.username}</div>
                <div className="d-email">{user.email}</div>
              </div>
            </div>

            <button
              className="dropdown-item"
              onClick={() => openModal("username")}
            >
              <span className="item-icon">✏️</span>
              Changer le nom d'utilisateur
            </button>

            <div className="divider" />

            <button
              className="dropdown-item danger"
              onClick={() => openModal("delete")}
            >
              <span className="item-icon">🗑️</span>
              Supprimer le compte
            </button>

            <div className="divider" />

            <button className="dropdown-item logout" onClick={handleLogout}>
              <span className="item-icon">🚪</span>
              Déconnexion
            </button>
          </div>
        )}
      </div>

      {/* ── Modal username ── */}
      {modal === "username" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">✏️</div>
            <div className="modal-title">Nouveau nom</div>
            <div className="modal-subtitle">
              Choisis un nouveau nom d'utilisateur.
            </div>
            <input
              className="modal-input"
              placeholder="Nouveau nom d'utilisateur"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            {error && <div className="modal-error">{error}</div>}
            {message && <div className="modal-success">{message}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>
                Annuler
              </button>
              <button
                className="btn-confirm"
                disabled={loading}
                onClick={() =>
                  handleUpdate(
                    "update-username",
                    { username: form.value },
                    "Nom mis à jour ✓",
                  )
                }
              >
                {loading ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal email ── */}
      {modal === "email" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">📧</div>
            <div className="modal-title">Nouvel email</div>
            <div className="modal-subtitle">
              Entre ta nouvelle adresse email.
            </div>
            <input
              className="modal-input"
              type="email"
              placeholder="Nouvel email"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            {error && <div className="modal-error">{error}</div>}
            {message && <div className="modal-success">{message}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>
                Annuler
              </button>
              <button
                className="btn-confirm"
                disabled={loading}
                onClick={() =>
                  handleUpdate(
                    "update-email",
                    { email: form.value },
                    "Email mis à jour ✓",
                  )
                }
              >
                {loading ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal mot de passe ── */}
      {modal === "password" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🔒</div>
            <div className="modal-title">Nouveau mot de passe</div>
            <div className="modal-subtitle">
              Entre ton mot de passe actuel puis le nouveau.
            </div>
            <input
              className="modal-input"
              type="password"
              placeholder="Mot de passe actuel"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <input
              className="modal-input"
              type="password"
              placeholder="Nouveau mot de passe"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            <input
              className="modal-input"
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
            {error && <div className="modal-error">{error}</div>}
            {message && <div className="modal-success">{message}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>
                Annuler
              </button>
              <button
                className="btn-confirm"
                disabled={loading}
                onClick={() => {
                  if (form.value !== form.confirm) {
                    setError("Les mots de passe ne correspondent pas");
                    return;
                  }
                  if (form.value.length < 6) {
                    setError("Minimum 6 caractères");
                    return;
                  }
                  handleUpdate(
                    "update-password",
                    { oldPassword: form.password, newPassword: form.value },
                    "Mot de passe mis à jour ✓",
                  );
                }}
              >
                {loading ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal supprimer ── */}
      {modal === "delete" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-icon"
              style={{ background: "linear-gradient(135deg,#e74c3c,#c0392b)" }}
            >
              🗑️
            </div>
            <div className="modal-title">Supprimer le compte</div>
            <div className="modal-subtitle">
              Cette action est{" "}
              <strong style={{ color: "#e74c3c" }}>irréversible</strong>. Toutes
              tes conversations seront définitivement supprimées.
            </div>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>
                Annuler
              </button>
              <button
                className="btn-confirm danger-btn"
                disabled={loading}
                onClick={handleDelete}
              >
                {loading ? "..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
