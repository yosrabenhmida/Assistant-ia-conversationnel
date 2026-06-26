import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileText, Eye, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import DocumentModal from "./DocumentModal";

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

/* ── Typing dots ── */
function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "10px 14px",
      }}
    >
      {["#f97316", "#ec4899", "#8b5cf6"].map((color, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
            animation: `chatJump 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── AI thinking label ── */
function ThinkingLabel() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "#a78bfa",
        fontStyle: "italic",
        paddingBottom: 4,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#8b5cf6",
          display: "inline-block",
          animation: "chatPulseDot 1s ease-in-out infinite",
        }}
      />
      L'IA réfléchit…
    </div>
  );
}

/* ── Code block ── */
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: "relative",
        margin: "10px 0",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1e1b4b",
          padding: "6px 12px",
        }}
      >
        <span
          style={{ fontSize: 11, color: "#a5b4fc", fontFamily: "monospace" }}
        >
          {language}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: copied
              ? "rgba(74,222,128,0.15)"
              : "rgba(255,255,255,0.08)",
            border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 6,
            padding: "3px 8px",
            color: copied ? "#4ade80" : "#a5b4fc",
            fontSize: 11,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneLight}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: "0 0 12px 12px",
          fontSize: 13,
          lineHeight: 1.6,
          border: "1.5px solid #e0e7ff",
          borderTop: "none",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

/* ── Message action bar (copy + like + dislike) ── */
function MessageActions({ content, isUser, reactions, onReact }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const liked = reactions === "like";
  const disliked = reactions === "dislike";

  const btnBase = {
    display: "flex",
    alignItems: "center",
    gap: 3,
    border: "1px solid",
    borderRadius: 7,
    padding: "3px 8px",
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.18s",
    fontFamily: "inherit",
  };

  return (
    <div
      className="msg-actions"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginTop: 5,
        opacity: 0,
        transition: "opacity 0.18s",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      {/* Copy */}
      <button
        onClick={handleCopy}
        style={{
          ...btnBase,
          background: copied
            ? "rgba(74,222,128,0.12)"
            : "rgba(139,92,246,0.08)",
          borderColor: copied
            ? "rgba(74,222,128,0.3)"
            : "rgba(139,92,246,0.18)",
          color: copied ? "#4ade80" : "#8b5cf6",
        }}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? "Copié" : "Copier"}
      </button>

      {/* Like — only on AI messages */}
      {!isUser && (
        <button
          onClick={() => onReact(liked ? null : "like")}
          style={{
            ...btnBase,
            background: liked
              ? "rgba(74,222,128,0.15)"
              : "rgba(255,255,255,0.06)",
            borderColor: liked
              ? "rgba(74,222,128,0.4)"
              : "rgba(255,255,255,0.12)",
            color: liked ? "#4ade80" : "rgba(255,255,255,0.5)",
          }}
        >
          <ThumbsUp size={11} fill={liked ? "#4ade80" : "none"} />
        </button>
      )}

      {/* Dislike — only on AI messages */}
      {!isUser && (
        <button
          onClick={() => onReact(disliked ? null : "dislike")}
          style={{
            ...btnBase,
            background: disliked
              ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.06)",
            borderColor: disliked
              ? "rgba(239,68,68,0.4)"
              : "rgba(255,255,255,0.12)",
            color: disliked ? "#f87171" : "rgba(255,255,255,0.5)",
          }}
        >
          <ThumbsDown size={11} fill={disliked ? "#f87171" : "none"} />
        </button>
      )}
    </div>
  );
}

/* ── Avatar ── */
function Avatar({ isUser }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: isUser ? 13 : 14,
        fontWeight: 700,
        color: "#fff",
        background: isUser
          ? "linear-gradient(135deg, #8b5cf6, #06b6d4)"
          : "linear-gradient(135deg, #f97316, #ec4899)",
        boxShadow: isUser
          ? "0 2px 8px rgba(139,92,246,0.35)"
          : "0 2px 8px rgba(249,115,22,0.35)",
        userSelect: "none",
      }}
    >
      {isUser ? "M" : "✦"}
    </div>
  );
}

/* ── Timestamp ── */
function Timestamp({ date }) {
  const d = date ? new Date(date) : new Date();
  return (
    <span
      style={{ fontSize: 10, color: "#c4b5fd", marginTop: 2, display: "block" }}
    >
      {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

/* ═══════════════════════════════════════════
   Main ChatWindow
═══════════════════════════════════════════ */
function ChatWindow({ messages, loading, documentName, documentContext }) {
  const bottomRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  // reactions[i] = "like" | "dislike" | null
  const [reactions, setReactions] = useState({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleReact = (index, value) => {
    setReactions((prev) => ({ ...prev, [index]: value }));
  };

  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      if (inline) {
        return (
          <code
            style={{
              background: "#f0f4ff",
              border: "1px solid #e0e7ff",
              borderRadius: 5,
              padding: "1px 5px",
              fontSize: "0.88em",
              fontFamily: "monospace",
              color: "#8b5cf6",
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return <CodeBlock className={className}>{children}</CodeBlock>;
    },
    table({ children }) {
      return (
        <div style={{ overflowX: "auto", margin: "10px 0" }}>
          <table
            style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}
          >
            {children}
          </table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th
          style={{
            background: "linear-gradient(135deg, #f0f4ff, #fce7f3)",
            border: "1px solid #e0e7ff",
            padding: "6px 12px",
            textAlign: "left",
            fontWeight: 600,
            color: "#1e1b4b",
            fontSize: 12,
          }}
        >
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td
          style={{
            border: "1px solid #e0e7ff",
            padding: "5px 12px",
            color: "#374151",
          }}
        >
          {children}
        </td>
      );
    },
    blockquote({ children }) {
      return (
        <blockquote
          style={{
            borderLeft: "3px solid #8b5cf6",
            margin: "8px 0",
            padding: "6px 12px",
            background: "#f5f3ff",
            borderRadius: "0 8px 8px 0",
            color: "#6b21a8",
            fontStyle: "italic",
          }}
        >
          {children}
        </blockquote>
      );
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#8b5cf6",
            textDecoration: "underline",
            textDecorationColor: "rgba(139,92,246,0.35)",
          }}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <>
      <style>{`
        @keyframes chatPopBounce {
          0%   { opacity: 0; transform: scale(0.75) translateY(14px); }
          70%  { transform: scale(1.03) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes chatJump {
          0%,60%,100% { transform: translateY(0) scale(1); }
          30%          { transform: translateY(-9px) scale(1.1); }
        }
        @keyframes chatSlideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatPulseDot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(1.4); }
        }
        .chat-bubble-pop { animation: chatPopBounce 0.32s cubic-bezier(0.34,1.56,0.64,1) both; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 4px; }
        .msg-row:hover .msg-actions { opacity: 1 !important; }
        .msg-ai-bubble p:first-child { margin-top: 0; }
        .msg-ai-bubble p:last-child { margin-bottom: 0; }
        .msg-ai-bubble ul,.msg-ai-bubble ol { padding-left: 20px; margin: 6px 0; }
        .msg-ai-bubble li { margin: 3px 0; }
        .msg-ai-bubble h1,.msg-ai-bubble h2,.msg-ai-bubble h3 {
          color: #1e1b4b; margin: 10px 0 5px; font-weight: 700;
        }
        .msg-ai-bubble h1 { font-size: 17px; }
        .msg-ai-bubble h2 { font-size: 15px; }
        .msg-ai-bubble h3 { font-size: 14px; }
        @media (max-width: 640px) {
          .msg-bubble { max-width: 84% !important; }
          .chat-header-title { font-size: 13px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          padding: "12px 16px",
          background: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            border: "2px solid rgba(255,255,255,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            color: "#fff",
            fontWeight: 700,
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          }}
        >
          ✦
        </div>
        <div style={{ flex: 1 }}>
          <div
            className="chat-header-title"
            style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}
          >
            Assistant IA
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: loading ? "#fbbf24" : "#4ade80",
                display: "inline-block",
                animation: "chatPulseDot 2s ease-in-out infinite",
                transition: "background 0.3s",
              }}
            />
            {loading ? "En train de répondre…" : "En ligne"}
          </div>
        </div>
        {messages.length > 0 && (
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 20,
              padding: "3px 10px",
            }}
          >
            {messages.length} msg
          </div>
        )}
      </div>

      {/* ── Document pill ── */}
      {documentName && (
        <div
          style={{
            margin: "10px 14px 0",
            background: "linear-gradient(135deg, #fff7ed, #fce7f3)",
            border: "1.5px solid #fbcfe8",
            borderRadius: 12,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            animation: "chatSlideDown 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: "#be185d",
              overflow: "hidden",
            }}
          >
            <FileText size={15} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Document actif : <strong>{documentName}</strong>
            </span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9333ea",
              background: "rgba(147,51,234,0.1)",
              border: "1px solid rgba(147,51,234,0.25)",
              borderRadius: 8,
              padding: "3px 10px",
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(147,51,234,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(147,51,234,0.1)")
            }
          >
            <Eye size={11} /> Voir
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        className="chat-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: "linear-gradient(180deg, #f0f4ff 0%, #f5f3ff 100%)",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              opacity: 0.5,
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#fff",
                boxShadow: "0 4px 20px rgba(236,72,153,0.25)",
              }}
            >
              ✦
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 15,
                  color: "#818cf8",
                  fontWeight: 600,
                  margin: "0 0 4px",
                }}
              >
                Bonjour ! Comment puis-je vous aider ?
              </p>
              <p style={{ fontSize: 12, color: "#a5b4fc", margin: 0 }}>
                Écris un message ou envoie un fichier PDF / image
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const arabic = isArabic(msg.content);
          const reaction = reactions[i] || null;

          return (
            <div
              key={i}
              className="chat-bubble-pop msg-row"
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                flexDirection: isUser ? "row-reverse" : "row",
                animationDelay: `${Math.min(i * 0.035, 0.25)}s`,
              }}
            >
              <Avatar isUser={isUser} />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                  maxWidth: "68%",
                }}
                className="msg-bubble"
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#a5b4fc",
                    marginBottom: 3,
                    fontWeight: 500,
                  }}
                >
                  {isUser ? "Vous" : "Assistant IA"}
                </span>

                {/* Bubble */}
                <div
                  className={isUser ? "" : "msg-ai-bubble"}
                  dir={arabic ? "rtl" : "ltr"}
                  style={{
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.65,
                    borderRadius: 18,
                    ...(isUser
                      ? {
                          background:
                            "linear-gradient(135deg, #8b5cf6, #6366f1)",
                          color: "#fff",
                          borderBottomRightRadius: 5,
                          boxShadow: "0 4px 16px rgba(99,102,241,0.28)",
                        }
                      : {
                          background: "#fff",
                          border: "1.5px solid #e0e7ff",
                          color: "#1e1b4b",
                          borderBottomLeftRadius: 5,
                          boxShadow: "0 2px 12px rgba(139,92,246,0.07)",
                        }),
                  }}
                >
                  {isUser ? (
                    <span style={{ whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </span>
                  ) : (
                    <ReactMarkdown components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Action bar */}
                <MessageActions
                  content={msg.content}
                  isUser={isUser}
                  reactions={reaction}
                  onReact={(val) => handleReact(i, val)}
                />

                <Timestamp date={msg.createdAt} />
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div
            className="chat-bubble-pop"
            style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
          >
            <Avatar isUser={false} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <ThinkingLabel />
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid #e0e7ff",
                  borderRadius: 18,
                  borderBottomLeftRadius: 5,
                  boxShadow: "0 2px 12px rgba(139,92,246,0.07)",
                }}
              >
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <DocumentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        documentName={documentName}
        content={documentContext}
      />
    </>
  );
}

export default ChatWindow;
