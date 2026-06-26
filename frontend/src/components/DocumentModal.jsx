import { X, FileText } from "lucide-react";

function DocumentModal({ isOpen, onClose, documentName, content }) {
  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(15,15,26,0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            border: "1.5px solid #e0e7ff",
            boxShadow: "0 20px 60px rgba(99,102,241,0.2)",
            maxWidth: 640,
            width: "100%",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              borderBottom: "1.5px solid #f0f4ff",
              background: "linear-gradient(135deg, #fff7ed, #fce7f3)",
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                flexShrink: 0,
                background: "linear-gradient(135deg, #f97316, #ec4899)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={17} style={{ color: "#fff" }} />
            </div>
            <h3
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 600,
                color: "#be185d",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              {documentName}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "rgba(236,72,153,0.1)",
                border: "1px solid rgba(236,72,153,0.2)",
                borderRadius: 8,
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#ec4899",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(236,72,153,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(236,72,153,0.1)")
              }
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 13,
                lineHeight: 1.7,
                color: "#374151",
                fontFamily: "inherit",
                margin: 0,
              }}
            >
              {content || "Aucun contenu disponible."}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}

export default DocumentModal;
