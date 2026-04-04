import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { safeFetch } from "../utils/safeFetch";

const SOCKET_URL = "http://localhost:5002";
let socket;

export default function ShopkeeperChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!user || user.role !== "shopkeeper") return navigate("/login");
    fetchChats();

    socket = io(SOCKET_URL);
    socket.emit("join_admin", { shopkeeperId: user.id, name: user.name });

    socket.on("receive_message", (msg) => {
      setChats((prev) => prev.map((c) =>
        c.customerId === msg.customerId ? { ...c, messages: [...(c.messages || []), msg] } : c
      ));
      fetchChats();
    });

    socket.on("typing", ({ customerId, sender, isTyping }) => {
      if (sender === "user") setTyping((prev) => ({ ...prev, [customerId]: isTyping }));
    });

    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected, chats]);

  const fetchChats = async () => {
    const res = await safeFetch("/api/chat/all");
    const data = await res.json();
    setChats(data);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected) return;
    const msg = { sender: "shopkeeper", senderName: user.name, text: input.trim(), time: new Date(), customerId: selected.customerId };
    socket.emit("send_message", { customerId: selected.customerId, message: msg });
    await safeFetch(`/api/chat/message/${selected.customerId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
    setInput("");
    fetchChats();
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket.emit("typing", { customerId: selected?.customerId, sender: "shopkeeper", isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { customerId: selected?.customerId, sender: "shopkeeper", isTyping: false });
    }, 1000);
  };

  const selectedChat = chats.find(c => c.customerId === selected?.customerId);

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>💬 Customer Chats</h3>
          <span style={styles.chatCount}>{chats.length}</span>
        </div>
        {chats.length === 0 ? (
          <p style={styles.noChats}>No chats yet</p>
        ) : chats.map((chat) => {
          const lastMsg = chat.messages?.[chat.messages.length - 1];
          const unread = chat.messages?.filter(m => m.sender === "user" && !m.read).length || 0;
          return (
            <div key={chat._id} onClick={() => setSelected(chat)}
              style={{ ...styles.chatItem, background: selected?.customerId === chat.customerId ? "#fff3e0" : "#fff", borderLeft: selected?.customerId === chat.customerId ? "3px solid #ff9900" : "3px solid transparent" }}>
              <div style={styles.chatAvatar}>{(chat.customerName || "G")[0].toUpperCase()}</div>
              <div style={styles.chatInfo}>
                <div style={styles.chatName}>
                  {chat.customerName || "Guest"}
                  {typing[chat.customerId] && <span style={styles.typingBadge}>typing...</span>}
                </div>
                <div style={styles.lastMsg}>{lastMsg?.text?.slice(0, 30) || "No messages"}</div>
              </div>
              {unread > 0 && <span style={styles.unreadBadge}>{unread}</span>}
            </div>
          );
        })}
      </div>

      <div style={styles.chatArea}>
        {!selected ? (
          <div style={styles.noSelected}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>💬</div>
            <h3>Select a chat to start</h3>
            <p style={{ color: "#888" }}>Choose a customer from the left panel</p>
          </div>
        ) : (
          <>
            <div style={styles.chatHeader}>
              <div style={styles.chatAvatar}>{(selectedChat?.customerName || "G")[0].toUpperCase()}</div>
              <div>
                <p style={styles.chatHeaderName}>{selectedChat?.customerName || "Guest"}</p>
                <p style={styles.chatHeaderSub}>
                  {typing[selected.customerId] ? "✍️ typing..." : selectedChat?.status === "live" ? "🟢 Live Chat" : "🤖 Bot Chat"}
                </p>
              </div>
              {selectedChat?.rating > 0 && (
                <div style={styles.ratingBadge}>{"⭐".repeat(selectedChat.rating)}</div>
              )}
            </div>

            <div style={styles.messages}>
              {selectedChat?.messages?.map((msg, i) => (
                <div key={i} style={{ display: "flex", flexDirection: msg.sender === "shopkeeper" ? "row-reverse" : "row", gap: "8px", marginBottom: "8px", alignItems: "flex-end" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: msg.sender === "bot" ? "#ff9900" : msg.sender === "shopkeeper" ? "#27ae60" : "#1565c0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0 }}>
                    {msg.sender === "bot" ? "🤖" : msg.sender === "shopkeeper" ? "🏪" : "👤"}
                  </div>
                  <div style={{ maxWidth: "70%", background: msg.sender === "shopkeeper" ? "#e8f5e9" : msg.sender === "bot" ? "#fff3e0" : "#e3f2fd", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#888", marginBottom: "4px" }}>{msg.senderName}</div>
                    {msg.type === "image" ? <img src={msg.fileUrl} alt="shared" style={{ maxWidth: "200px", borderRadius: "8px" }} /> : msg.text}
                    <div style={{ fontSize: "10px", color: "#aaa", marginTop: "4px" }}>
                      {new Date(msg.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputArea}>
              <input style={styles.input} placeholder="Type a message..." value={input}
                onChange={handleTyping} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
              <button style={styles.sendBtn} onClick={sendMessage}>➤</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", height: "calc(100vh - 60px)", background: "#f0f2f5" },
  sidebar: { width: "300px", background: "#fff", borderRight: "1px solid #eee", display: "flex", flexDirection: "column" },
  sidebarHeader: { padding: "16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sidebarTitle: { margin: 0, color: "#232f3e", fontSize: "16px" },
  chatCount: { background: "#ff9900", color: "#fff", borderRadius: "12px", padding: "2px 10px", fontSize: "12px", fontWeight: "bold" },
  noChats: { textAlign: "center", padding: "40px", color: "#888" },
  chatItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f5f5f5" },
  chatAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #ff9900, #e67e00)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px", flexShrink: 0 },
  chatInfo: { flex: 1, minWidth: 0 },
  chatName: { fontWeight: "bold", fontSize: "14px", color: "#232f3e", display: "flex", alignItems: "center", gap: "6px" },
  typingBadge: { fontSize: "11px", color: "#27ae60", fontWeight: "normal" },
  lastMsg: { fontSize: "12px", color: "#888", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  unreadBadge: { background: "#ff9900", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" },
  chatArea: { flex: 1, display: "flex", flexDirection: "column" },
  noSelected: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#232f3e" },
  chatHeader: { padding: "14px 20px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "12px" },
  chatHeaderName: { margin: 0, fontWeight: "bold", fontSize: "15px", color: "#232f3e" },
  chatHeaderSub: { margin: 0, fontSize: "12px", color: "#888" },
  ratingBadge: { marginLeft: "auto", fontSize: "14px" },
  messages: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column" },
  inputArea: { padding: "12px 16px", background: "#fff", borderTop: "1px solid #eee", display: "flex", gap: "10px" },
  input: { flex: 1, padding: "10px 16px", border: "1px solid #ddd", borderRadius: "20px", fontSize: "14px", outline: "none" },
  sendBtn: { background: "linear-gradient(135deg, #ff9900, #e67e00)", border: "none", borderRadius: "50%", width: "42px", height: "42px", cursor: "pointer", fontSize: "16px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
};
