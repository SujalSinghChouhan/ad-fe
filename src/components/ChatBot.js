import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SOCKET_URL = "http://localhost:5002";

// Bot responses
const BOT_RESPONSES = {
  en: {
    welcome: (name) => `👋 Hi ${name}! Welcome to **Apni Dukann** support.\n\nHow can I help you today?`,
    options: ["📦 Track My Order", "🎟️ Show Coupons", "🚚 Delivery Info", "❌ Cancel Order", "💳 Payment Methods", "🔄 Return Policy", "🏪 Talk to Shopkeeper", "🌐 Switch to Hindi"],
    order: (orders) => orders.length === 0 ? "You have no recent orders. Start shopping! 🛒" :
      orders.map(o => `📦 Order #${o._id.slice(0,8).toUpperCase()}\nStatus: ${o.status.replace("_"," ").toUpperCase()}\nTotal: ₹${o.total}\nItems: ${o.items.map(i => i.productName).join(", ")}`).join("\n\n"),
    coupons: (coupons) => coupons.length === 0 ? "No active coupons right now." :
      "🎟️ **Active Coupons:**\n\n" + coupons.map(c => `**${c.code}** — ${c.discountType === "percent" ? `${c.discountValue}% off` : `₹${c.discountValue} off`} (min order ₹${c.minOrder})`).join("\n"),
    delivery: "🚚 **Delivery Info:**\n\n• Free delivery on orders above ₹500\n• ₹40 delivery charge below ₹500\n• Delivery within 1-3 hours\n• Track your order in My Orders page",
    cancel: "❌ **Cancel Order:**\n\n• Go to My Orders page\n• Click Cancel Order button\n• Orders can be cancelled before delivery\n• ⚠️ Cancelling after pickup = ₹30 penalty",
    payment: "💳 **Payment Methods:**\n\n• 💵 Cash on Delivery (COD)\n• 📱 UPI (GPay, PhonePe, Paytm)\n• 💳 Credit/Debit Card\n\nAll payments are 100% secure!",
    returns: "🔄 **Return Policy:**\n\n• 7 days easy return\n• Contact shopkeeper for return\n• Refund within 3-5 business days\n• Product must be unused",
    shopkeeper: "🏪 Connecting you to a shopkeeper...\n\nPlease wait, a shopkeeper will join shortly. You can type your message below.",
    unknown: "🤔 I didn't understand that. Please choose from the options below or type your question.",
    rating: "⭐ How would you rate this chat?\n\nTap a star to rate:",
    thanks: "Thank you for your rating! 😊\n\nIs there anything else I can help you with?",
    offline: "😴 Our team is currently offline.\n\nLeave your message and we'll get back to you soon!",
  },
  hi: {
    welcome: (name) => `👋 नमस्ते ${name}! **अपनी दुकान** सपोर्ट में आपका स्वागत है।\n\nमैं आपकी कैसे मदद कर सकता हूं?`,
    options: ["📦 मेरा ऑर्डर ट्रैक करें", "🎟️ कूपन दिखाएं", "🚚 डिलीवरी जानकारी", "❌ ऑर्डर रद्द करें", "💳 भुगतान तरीके", "🔄 वापसी नीति", "🏪 दुकानदार से बात करें", "🌐 Switch to English"],
    delivery: "🚚 **डिलीवरी जानकारी:**\n\n• ₹500 से ऊपर के ऑर्डर पर मुफ्त डिलीवरी\n• ₹500 से कम पर ₹40 डिलीवरी शुल्क\n• 1-3 घंटे में डिलीवरी",
    cancel: "❌ **ऑर्डर रद्द करें:**\n\n• मेरे ऑर्डर पेज पर जाएं\n• ऑर्डर रद्द करें बटन दबाएं\n• ⚠️ पिकअप के बाद रद्द करने पर ₹30 जुर्माना",
    payment: "💳 **भुगतान तरीके:**\n\n• 💵 कैश ऑन डिलीवरी\n• 📱 UPI (GPay, PhonePe, Paytm)\n• 💳 क्रेडिट/डेबिट कार्ड",
    returns: "🔄 **वापसी नीति:**\n\n• 7 दिन आसान वापसी\n• दुकानदार से संपर्क करें\n• 3-5 दिन में रिफंड",
    unknown: "🤔 मुझे समझ नहीं आया। कृपया नीचे से विकल्प चुनें।",
  }
};

let socket;

export default function ChatBot() {
  const { user } = useAuth();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [shopkeeperTyping, setShopkeeperTyping] = useState(false);
  const [lang, setLang] = useState("en");
  const [chatStatus, setChatStatus] = useState("bot"); // bot, live, closed
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [unread, setUnread] = useState(0);
  const [onlineAgents, setOnlineAgents] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const t = BOT_RESPONSES[lang] || BOT_RESPONSES.en;
  const customerId = user?.id || "guest_" + Math.random().toString(36).slice(2);

  useEffect(() => {
    // Init socket
    socket = io(SOCKET_URL);
    socket.emit("join", { customerId, name: user?.name || "Guest", role: user?.role || "guest" });

    socket.on("receive_message", (msg) => {
      if (msg.sender !== "user") {
        setMessages((prev) => [...prev, msg]);
        if (!open) setUnread((u) => u + 1);
      }
    });

    socket.on("typing", ({ sender, isTyping }) => {
      if (sender !== "user") setShopkeeperTyping(isTyping);
    });

    socket.on("online_users", (users) => {
      const agents = Object.values(users).filter(u => u.role === "shopkeeper" && u.online).length;
      setOnlineAgents(agents);
    });

    socket.on("user_online", ({ role, online }) => {
      if (role === "shopkeeper") setOnlineAgents(prev => online ? prev + 1 : Math.max(0, prev - 1));
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  // Send welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => {
        addBotMessage(t.welcome(user?.name || "Guest"));
        setTimeout(() => addQuickReplies(t.options), 800);
      }, 500);
    }
  }, [open]);

  const addBotMessage = (text, extra = {}) => {
    setMessages((prev) => [...prev, { sender: "bot", senderName: "Apni Dukann Bot", text, time: new Date(), ...extra }]);
  };

  const addQuickReplies = (options) => {
    setMessages((prev) => [...prev, { sender: "bot", senderName: "Apni Dukann Bot", text: "", type: "quickreply", options, time: new Date() }]);
  };

  const addUserMessage = (text) => {
    const msg = { sender: "user", senderName: user?.name || "Guest", text, time: new Date() };
    setMessages((prev) => [...prev, msg]);
    socket.emit("send_message", { customerId, message: msg });
    saveMessage(msg);
  };

  const saveMessage = async (msg) => {
    await fetch(`/api/chat/message/${customerId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
  };

  const handleBotResponse = async (text) => {
    const lower = text.toLowerCase();
    setTyping(true);
    await new Promise(r => setTimeout(r, 800));
    setTyping(false);

    if (lower.includes("hindi") || lower.includes("हिंदी")) {
      setLang("hi");
      addBotMessage("🌐 भाषा हिंदी में बदल दी गई है!");
      addQuickReplies(BOT_RESPONSES.hi.options);
    } else if (lower.includes("english")) {
      setLang("en");
      addBotMessage("🌐 Language switched to English!");
      addQuickReplies(BOT_RESPONSES.en.options);
    } else if (lower.includes("track") || lower.includes("order") || lower.includes("ऑर्डर")) {
      if (user?.id) {
        const res = await fetch(`/api/chat/order-status/${user.id}`);
        const orders = await res.json();
        addBotMessage(t.order ? t.order(orders) : BOT_RESPONSES.en.order(orders));
      } else addBotMessage("Please login to track your orders.");
      addQuickReplies(t.options);
    } else if (lower.includes("coupon") || lower.includes("कूपन")) {
      const res = await fetch("/api/chat/coupons");
      const coupons = await res.json();
      addBotMessage(t.coupons ? t.coupons(coupons) : BOT_RESPONSES.en.coupons(coupons));
      addQuickReplies(t.options);
    } else if (lower.includes("delivery") || lower.includes("डिलीवरी")) {
      addBotMessage(t.delivery);
      addQuickReplies(t.options);
    } else if (lower.includes("cancel") || lower.includes("रद्द")) {
      addBotMessage(t.cancel);
      addQuickReplies(t.options);
    } else if (lower.includes("payment") || lower.includes("भुगतान")) {
      addBotMessage(t.payment);
      addQuickReplies(t.options);
    } else if (lower.includes("return") || lower.includes("वापसी")) {
      addBotMessage(t.returns);
      addQuickReplies(t.options);
    } else if (lower.includes("shopkeeper") || lower.includes("दुकानदार") || lower.includes("talk") || lower.includes("live")) {
      setChatStatus("live");
      addBotMessage(t.shopkeeper || BOT_RESPONSES.en.shopkeeper);
    } else if (lower.includes("hi") || lower.includes("hello") || lower.includes("नमस्ते")) {
      addBotMessage(t.welcome(user?.name || "Guest"));
      addQuickReplies(t.options);
    } else if (lower.includes("bye") || lower.includes("thanks") || lower.includes("thank")) {
      addBotMessage("Thank you for contacting Apni Dukann! 😊\n\nHave a great day! 🛒");
      setTimeout(() => setShowRating(true), 1000);
    } else {
      addBotMessage(t.unknown || BOT_RESPONSES.en.unknown);
      addQuickReplies(t.options);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    addUserMessage(text);
    if (chatStatus === "bot") await handleBotResponse(text);
  };

  const handleQuickReply = (option) => {
    addUserMessage(option);
    if (chatStatus === "bot") handleBotResponse(option);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket.emit("typing", { customerId, sender: "user", isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { customerId, sender: "user", isTyping: false });
    }, 1000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const msg = { sender: "user", senderName: user?.name || "Guest", text: `📎 ${file.name}`, type: file.type.startsWith("image") ? "image" : "file", fileUrl: reader.result, time: new Date() };
      setMessages((prev) => [...prev, msg]);
      socket.emit("send_message", { customerId, message: msg });
    };
    reader.readAsDataURL(file);
  };

  const submitRating = async (r) => {
    setRating(r);
    await fetch(`/api/chat/rate/${customerId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: r }),
    });
    setShowRating(false);
    addBotMessage(BOT_RESPONSES.en.thanks);
  };

  const emojis = ["😊", "😂", "❤️", "👍", "🙏", "😍", "🎉", "😢", "😡", "🤔", "👋", "✅", "❌", "🛒", "📦"];

  const handleQuickReplyClick = (opt) => () => handleQuickReply(opt);

  const bg = theme.dark ? "#1a1a2e" : "#fff";
  const cardBg = theme.dark ? "#16213e" : "#f9f9f9";
  const textColor = theme.dark ? "#e0e0e0" : "#232f3e";
  const borderColor = theme.dark ? "#2a2a4a" : "#eee";
  const inputBg = theme.dark ? "#0f3460" : "#fff";

  return (
    <>
      {/* Chat Bubble */}
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
        {unread > 0 && !open && (
          <div style={{ position: "absolute", top: "-6px", right: "-6px", background: "#e74c3c", color: "#fff", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", zIndex: 1 }}>
            {unread}
          </div>
        )}
        <button onClick={() => setOpen(!open)} style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #ff9900, #e67e00)", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(255,153,0,0.5)", fontSize: "28px", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}>
          {open ? "✕" : "💬"}
        </button>
      </div>

      {/* Chat Window */}
      {open && (
        <div style={{ position: "fixed", bottom: "100px", right: "24px", width: "360px", height: "560px", background: bg, borderRadius: "20px", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", zIndex: 9998, overflow: "hidden", border: `1px solid ${borderColor}` }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #232f3e, #ff9900)", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🛒</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: "bold", color: "#fff", fontSize: "15px" }}>Apni Dukann Support</p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
                {onlineAgents > 0 ? `🟢 ${onlineAgents} agent${onlineAgents > 1 ? "s" : ""} online` : "🤖 Bot is active"}
                {chatStatus === "live" && " • Live Chat"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setLang(lang === "en" ? "hi" : "en")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}>
                {lang === "en" ? "हिं" : "EN"}
              </button>
              <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "14px" }}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.type === "quickreply" ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {msg.options?.map((opt, j) => (
                      <button key={j} onClick={handleQuickReplyClick(opt)}
                        style={{ background: "linear-gradient(135deg, #ff9900, #e67e00)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "16px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: msg.sender === "user" ? "row-reverse" : "row", gap: "8px", alignItems: "flex-end" }}>
                    {msg.sender !== "user" && (
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: msg.sender === "bot" ? "#ff9900" : "#27ae60", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                        {msg.sender === "bot" ? "🤖" : "🏪"}
                      </div>
                    )}
                    <div style={{ maxWidth: "75%", background: msg.sender === "user" ? "linear-gradient(135deg, #ff9900, #e67e00)" : cardBg, color: msg.sender === "user" ? "#fff" : textColor, padding: "10px 14px", borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: "13px", lineHeight: "1.5", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", whiteSpace: "pre-wrap" }}>
                      {msg.type === "image" ? <img src={msg.fileUrl} alt="shared" style={{ maxWidth: "100%", borderRadius: "8px" }} /> : msg.text}
                      <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", textAlign: msg.sender === "user" ? "right" : "left" }}>
                        {new Date(msg.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {msg.sender === "user" && " ✓✓"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {(typing || shopkeeperTyping) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#ff9900", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🤖</div>
                <div style={{ background: cardBg, padding: "10px 14px", borderRadius: "18px 18px 18px 4px", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff9900", animation: `bounce 1s ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}

            {/* Rating */}
            {showRating && (
              <div style={{ background: cardBg, borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                <p style={{ margin: "0 0 10px", fontSize: "13px", color: textColor }}>⭐ Rate this conversation</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                  {[1,2,3,4,5].map(r => (
                    <span key={r} onClick={() => submitRating(r)} style={{ fontSize: "28px", cursor: "pointer", opacity: r <= rating ? 1 : 0.4, transition: "opacity 0.2s" }}>⭐</span>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker */}
          {showEmoji && (
            <div style={{ background: cardBg, padding: "8px", display: "flex", flexWrap: "wrap", gap: "6px", borderTop: `1px solid ${borderColor}` }}>
              {emojis.map((e, i) => (
                <span key={i} onClick={() => { setInput(input + e); setShowEmoji(false); }} style={{ fontSize: "20px", cursor: "pointer" }}>{e}</span>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "12px", borderTop: `1px solid ${borderColor}`, display: "flex", gap: "8px", alignItems: "center", background: bg }}>
            <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>😊</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>📎</button>
            <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileUpload} accept="image/*,.pdf,.doc" />
            <input
              style={{ flex: 1, padding: "10px 14px", border: `1px solid ${borderColor}`, borderRadius: "20px", fontSize: "13px", background: inputBg, color: textColor, outline: "none" }}
              placeholder="Type a message..."
              value={input}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} style={{ background: "linear-gradient(135deg, #ff9900, #e67e00)", border: "none", borderRadius: "50%", width: "38px", height: "38px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              ➤
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "6px", fontSize: "10px", color: "#aaa", background: bg }}>
            Powered by 🛒 Apni Dukann
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
