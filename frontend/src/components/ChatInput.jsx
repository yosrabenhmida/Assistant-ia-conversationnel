import { useState, useRef } from "react";
import { Send, Paperclip, X, Square } from "lucide-react";

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function ChatInput({ onSend, onUpload, loading, onStop }) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "44px";
      ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  return (
    <>
      <style>{`
        @keyframes fileSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sendPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.88) rotate(-6deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes stopPulse {
          0%, 100% { box-shadow: 0 3px 14px rgba(239,68,68,0.3); }
          50% { box-shadow: 0 3px 24px rgba(239,68,68,0.6); }
        }
        .send-btn-anim:active { animation: sendPop 0.25s ease forwards; }
        .chat-textarea::placeholder { color: #a5b4fc; }
        .chat-textarea:focus { outline: none; border-color: #8b5cf6 !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important; }
        .chat-textarea { resize: none; overflow-y: auto; scrollbar-width: thin; }
        .file-pill-btn:hover { background: rgba(139,92,246,0.2) !important; }
        .attach-btn:hover { background: #ede9fe !important; transform: scale(1.12); }
        .stop-btn { animation: stopPulse 1.5s ease-in-out infinite; }
        .stop-btn:hover { transform: scale(1.1) !important; }
        .drop-zone-active { border-color: #8b5cf6 !important; background: #f5f3ff !important; }

        @media (max-width: 640px) {
          .chat-input-wrapper { padding: 8px 10px 10px !important; }
          .chat-textarea { font-size: 16px !important; } /* prevents zoom on iOS */
        }
      `}</style>

      <div
        className="chat-input-wrapper"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          padding: "10px 14px 14px",
          background: dragOver ? "#f5f3ff" : "#fff",
          borderTop: "1.5px solid #e0e7ff",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        {/* Drag hint */}
        {dragOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(139,92,246,0.08)",
              border: "2px dashed #8b5cf6",
              borderRadius: 12,
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#8b5cf6", fontWeight: 600, fontSize: 15 }}>
              📎 Dépose ton fichier ici
            </span>
          </div>
        )}

        {/* File preview pill */}
        {selectedFile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              background: "linear-gradient(135deg, #faf5ff, #fce7f3)",
              border: "1.5px solid #e9d5ff",
              borderRadius: 12,
              padding: "7px 12px",
              fontSize: 13,
              animation: "fileSlide 0.25s ease both",
            }}
          >
            <Paperclip size={14} style={{ color: "#9333ea", flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#6b21a8",
              }}
            >
              {selectedFile.name}
            </span>
            <span style={{ fontSize: 11, color: "#a78bfa", flexShrink: 0 }}>
              {(selectedFile.size / 1024).toFixed(0)} KB
            </span>
            <button
              onClick={handleFileUpload}
              disabled={loading}
              className="file-pill-btn"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#9333ea",
                background: "rgba(147,51,234,0.1)",
                border: "1px solid rgba(147,51,234,0.25)",
                borderRadius: 8,
                padding: "3px 10px",
                cursor: "pointer",
                transition: "background 0.15s",
                opacity: loading ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              Envoyer
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#c084fc",
                padding: 2,
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Shift+Enter hint */}
        <div
          style={{
            fontSize: 11,
            color: "#a5b4fc",
            marginBottom: 4,
            textAlign: "right",
            paddingRight: 2,
          }}
        >
          Shift + Entrée pour sauter une ligne
        </div>

        {/* Input row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Joindre un PDF ou une image"
            className="attach-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
              border: "1.5px solid #e0e7ff",
              background: "#f8f7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#8b5cf6",
              transition: "background 0.15s, transform 0.15s",
              opacity: loading ? 0.5 : 1,
              marginBottom: 3,
            }}
          >
            <Paperclip size={17} />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Écris ton message… (Shift+Entrée pour nouvelle ligne)"
            dir={isArabic(text) ? "rtl" : "ltr"}
            disabled={loading}
            rows={1}
            className="chat-textarea"
            style={{
              flex: 1,
              border: "1.5px solid #c7d2fe",
              borderRadius: 16,
              padding: "10px 16px",
              fontSize: 14,
              fontFamily: "inherit",
              background: loading ? "#f3f0ff" : "#eef0ff",
              color: "#1e1b4b",
              transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
              opacity: loading ? 0.7 : 1,
              lineHeight: 1.5,
              height: "44px",
              minHeight: "44px",
              maxHeight: "140px",
            }}
          />

          {/* Stop button when loading, Send button otherwise */}
          {loading ? (
            <button
              onClick={onStop}
              className="stop-btn"
              title="Arrêter la génération"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "none",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
                flexShrink: 0,
                transition: "transform 0.15s",
                marginBottom: 1,
              }}
            >
              <Square size={16} fill="#fff" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="send-btn-anim"
              title="Envoyer (Entrée)"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "none",
                background:
                  "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: !text.trim() ? "not-allowed" : "pointer",
                color: "#fff",
                flexShrink: 0,
                boxShadow: "0 3px 14px rgba(236,72,153,0.4)",
                transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
                opacity: !text.trim() ? 0.45 : 1,
                marginBottom: 1,
              }}
              onMouseEnter={(e) => {
                if (text.trim()) {
                  e.currentTarget.style.transform = "scale(1.1) rotate(8deg)";
                  e.currentTarget.style.boxShadow =
                    "0 5px 20px rgba(236,72,153,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                e.currentTarget.style.boxShadow =
                  "0 3px 14px rgba(236,72,153,0.4)";
              }}
            >
              <Send size={17} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default ChatInput;
