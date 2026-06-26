import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  X,
  Pencil,
  Check,
} from "lucide-react";

function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const startEdit = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const confirmEdit = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) onRenameConversation(id, editTitle.trim());
    setEditingId(null);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      <style>{`
        @keyframes sidebarIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .conv-item { transition: background 0.15s, transform 0.12s; cursor: pointer; }
        .conv-item:hover { transform: translateX(3px); }
        .conv-item:hover .conv-actions { opacity: 1 !important; }
        .conv-actions { transition: opacity 0.15s; }
        .action-icon-btn { transition: background 0.13s, transform 0.13s; }
        .action-icon-btn:hover { transform: scale(1.12); }
        .new-conv-btn { transition: background 0.15s, transform 0.12s, box-shadow 0.15s; }
        .new-conv-btn:hover {
          background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6) !important;
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(236,72,153,0.35);
        }
        .search-input::placeholder { color: rgba(255,255,255,0.3); }
        .search-input:focus { outline: none; border-color: rgba(139,92,246,0.6) !important; }
        .edit-input { outline: none; }
        .edit-input:focus { border-color: #8b5cf6 !important; }
      `}</style>

      <div
        style={{
          width: 256,
          background: "#0f0f1a",
          display: "flex",
          flexDirection: "column",
          padding: 12,
          gap: 8,
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* New conversation button */}
        <button
          onClick={onNewConversation}
          className="new-conv-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Plus size={17} />
          Nouvelle conversation
        </button>

        {/* Search bar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.35)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher…"
            className="search-input"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px 32px 8px 32px",
              color: "#fff",
              fontSize: 13,
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Count label */}
        {searchQuery && (
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              paddingLeft: 4,
              flexShrink: 0,
            }}
          >
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Conversations list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >
          {filtered.length === 0 && (
            <p
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 13,
                textAlign: "center",
                marginTop: 24,
                fontStyle: "italic",
              }}
            >
              {searchQuery ? "Aucun résultat" : "Aucune conversation encore."}
            </p>
          )}

          {filtered.map((conv, i) => {
            const active = conv._id === currentConversationId;
            const isEditing = editingId === conv._id;

            return (
              <div
                key={conv._id}
                className="conv-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 8px 9px 10px",
                  borderRadius: 10,
                  fontSize: 13,
                  color: active ? "#fff" : "rgba(255,255,255,0.6)",
                  background: active
                    ? "linear-gradient(135deg, rgba(249,115,22,0.22), rgba(236,72,153,0.18), rgba(139,92,246,0.22))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(236,72,153,0.22)"
                    : "1px solid transparent",
                  animation: `sidebarIn 0.3s ease ${Math.min(i * 0.03, 0.3)}s both`,
                }}
                onClick={() => !isEditing && onSelectConversation(conv._id)}
              >
                <MessageSquare
                  size={14}
                  style={{
                    flexShrink: 0,
                    color: active ? "#ec4899" : "rgba(255,255,255,0.3)",
                  }}
                />

                {/* Title or edit input */}
                {isEditing ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmEdit(e, conv._id);
                      if (e.key === "Escape") cancelEdit(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="edit-input"
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(139,92,246,0.5)",
                      borderRadius: 6,
                      padding: "2px 7px",
                      color: "#fff",
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {/* Highlight search match */}
                    {searchQuery
                      ? highlightMatch(conv.title, searchQuery)
                      : conv.title}
                  </span>
                )}

                {/* Action buttons */}
                <div
                  className="conv-actions"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    opacity: isEditing ? 1 : 0,
                    flexShrink: 0,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isEditing ? (
                    <>
                      <button
                        className="action-icon-btn"
                        onClick={(e) => confirmEdit(e, conv._id)}
                        title="Confirmer"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "rgba(74,222,128,0.15)",
                          border: "1px solid rgba(74,222,128,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#4ade80",
                        }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        className="action-icon-btn"
                        onClick={cancelEdit}
                        title="Annuler"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="action-icon-btn"
                        onClick={(e) => startEdit(e, conv)}
                        title="Renommer"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "rgba(139,92,246,0.12)",
                          border: "1px solid rgba(139,92,246,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#a78bfa",
                        }}
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        className="action-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv._id);
                        }}
                        title="Supprimer"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#f87171",
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* Highlight matching substring in title */
function highlightMatch(title, query) {
  const idx = title.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx)}
      <mark
        style={{
          background: "rgba(249,115,22,0.35)",
          color: "#fff",
          borderRadius: 3,
          padding: "0 2px",
        }}
      >
        {title.slice(idx, idx + query.length)}
      </mark>
      {title.slice(idx + query.length)}
    </>
  );
}

export default Sidebar;
