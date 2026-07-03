import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import Login from "./components/login";
import Signup from "./components/signup";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileMenu from "./components/ProfileMenu";

const API_URL = "http://localhost:3000/api";

// ─── Page Chat (tout ton code existant) ──────────────────────
function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documentName, setDocumentName] = useState(null);
  const [documentContext, setDocumentContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 769) setSidebarOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversation = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCurrentConversationId(id);
      setMessages(data.messages || []);
      setDocumentName(data.documentName || null);
      setDocumentContext(data.documentContext || null);
      setSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const createNewConversation = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setConversations([data, ...conversations]);
      setCurrentConversationId(data._id);
      setMessages([]);
      setDocumentName(null);
      setDocumentContext(null);
      setSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteConversation = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
        setDocumentName(null);
        setDocumentContext(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renameConversation = async (id, newTitle) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/conversations/${id}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error("Rename failed");
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, title: newTitle } : c)),
      );
    } catch {
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, title: newTitle } : c)),
      );
      console.warn("Rename: backend route not found, updated locally only.");
    }
  };

  const ensureConversation = async () => {
    if (currentConversationId) return currentConversationId;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setCurrentConversationId(data._id);
    setConversations((prev) => [data, ...prev]);
    return data._id;
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "_Génération interrompue._" },
    ]);
  };

  const sendMessage = async (text) => {
    const conversationId = await ensureConversation();
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, _optimistic: true },
    ]);
    setLoading(true);
    abortRef.current = new AbortController();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      setMessages(data.messages || []);
      fetchConversations();
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev.filter((m) => !m._optimistic),
        { role: "user", content: text },
        {
          role: "assistant",
          content: "⚠️ Erreur : impossible de contacter le serveur.",
        },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const uploadFile = async (file) => {
    const conversationId = await ensureConversation();
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `📎 Envoi de "${file.name}"…`,
        _optimistic: true,
      },
    ]);
    const formData = new FormData();
    formData.append("file", file);
    abortRef.current = new AbortController();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/conversations/${conversationId}/upload`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
          signal: abortRef.current.signal,
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'upload.");
      setMessages(data.conversation.messages || []);
      setDocumentName(
        data.conversation.documentName || data.documentName || null,
      );
      setDocumentContext(data.conversation.documentContext || null);
      fetchConversations();
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev.filter((m) => !m._optimistic),
        {
          role: "assistant",
          content: `⚠️ Erreur lors de l'analyse du fichier : ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .sidebar-overlay {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(0,0,0,0.55);
          animation: fadeIn 0.2s ease;
          backdrop-filter: blur(2px);
        }
        .sidebar-mobile-panel {
          position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;
          animation: slideInLeft 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .sidebar-static { display: flex; flex-shrink: 0; }
        .hamburger-btn {
          position: absolute; top: 13px; left: 14px; z-index: 10;
          width: 34px; height: 34px; border-radius: 9px; border: none;
          background: rgba(28, 149, 102, 0.22); backdrop-filter: blur(4px);
          color: #fff; font-size: 18px; cursor: pointer;
          display: none; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .hamburger-btn:hover { background: rgba(255,255,255,0.32); }
       .ProfileMenu {
  position: absolute; top: 13px; right: 14px; z-index: 10;
  padding: 6px 14px; border-radius: 9px; border: none;
  background: rgba(233, 30, 140, 0.2); backdrop-filter: blur(4px);
  color: #e91e8c; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.ProfileMenu:hover { background: rgba(233, 30, 140, 0.35); }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "100dvh",
          background: "#0f0f1a",
          overflow: "hidden",
        }}
      >
        {/* Static sidebar (desktop) */}
        <div className="sidebar-static">
          <Sidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={loadConversation}
            onNewConversation={createNewConversation}
            onDeleteConversation={deleteConversation}
            onRenameConversation={renameConversation}
          />
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <>
            <div
              className="sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="sidebar-mobile-panel">
              <Sidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onSelectConversation={loadConversation}
                onNewConversation={createNewConversation}
                onDeleteConversation={deleteConversation}
                onRenameConversation={renameConversation}
              />
            </div>
          </>
        )}

        {/* Main chat area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            title="Menu"
          >
            ☰
          </button>

          {/* Bouton déconnexion */}
          <ProfileMenu />

          <ChatWindow
            messages={messages}
            loading={loading}
            documentName={documentName}
            documentContext={documentContext}
          />
          <ChatInput
            onSend={sendMessage}
            onUpload={uploadFile}
            loading={loading}
            onStop={handleStop}
          />
        </div>
      </div>
    </>
  );
}

// ─── App principale avec routing ─────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
