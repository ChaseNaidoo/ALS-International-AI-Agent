// App.jsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import "./App.css";

// Utility to generate a unique session ID
const generateSessionId = () => {
  return "session_" + Math.random().toString(36).substring(2, 15) + Date.now();
};

// Utility to generate a chat ID
const generateChatId = () => {
  return "chat_" + Math.random().toString(36).substring(2, 15) + Date.now();
};

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const response = await fetch(
        "https://charliebessell.app.n8n.cloud/webhook/5ff43181-90e7-4b8a-b562-4b6d928d1798",
        { method: "POST", body: formData }
      );
      const data = await response.json();

      if (data.response === "yes") {
        const sessionId = generateSessionId();
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("loginTime", Date.now());
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("sessionId", sessionId);
        setSuccess("Login successful!");
        onLogin(email, sessionId);
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/als-logo-retina.jpg" alt="ALS International Logo" className="chat-logo-login" />
        <p className="subheading">Staff Login</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
            aria-label="Email"
            aria-describedby={error ? "error-message" : success ? "success-message" : undefined}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
            aria-label="Password"
            aria-describedby={error ? "error-message" : success ? "success-message" : undefined}
          />
          {error && (
            <p id="error-message" className="error-message">
              {error}
            </p>
          )}
          {success && (
            <p id="success-message" className="success-message">
              {success}
            </p>
          )}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="powered-by-login">Powered by InLogic</p>
        <p className="switch-link" onClick={onSwitchToSignup}>
          Don't have an account? Sign up here
        </p>
      </div>
    </div>
  );
};

const Signup = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const response = await fetch(
        "https://charliebessell.app.n8n.cloud/webhook/bdf05aca-69e0-463d-a767-a2e3f39a226d",
        { method: "POST", body: formData }
      );
      const data = await response.json();

      if (data.response === "yes") {
        setSuccess("Signup successful! Please login.");
        setEmail("");
        setPassword("");
      } else if (data.response === "already") {
        setError("This email is already registered. Please login instead.");
      } else {
        setError("Signup failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <img src="/als-logo-retina.jpg" alt="ALS International Logo" className="chat-logo-signup" />
        <p className="subheading-signup">Staff Signup</p>
        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signup-input"
            aria-label="Email"
            aria-describedby={error ? "error-message" : success ? "success-message" : undefined}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="signup-input"
            aria-label="Password"
            aria-describedby={error ? "error-message" : success ? "success-message" : undefined}
          />
          {error && (
            <p id="error-message" className="error-message">
              {error}
            </p>
          )}
          {success && (
            <p id="success-message" className="success-message">
              {success}
            </p>
          )}
          <button type="submit" className="signup-button" disabled={isLoading}>
            {isLoading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <p className="powered-by-login">Powered by InLogic</p>
        <p className="switch-link" onClick={onSwitchToLogin}>
          Already have an account? Login here
        </p>
      </div>
    </div>
  );
};

const Chatbot = ({ userEmail, sessionId, onLogout }) => {
  const initialMessages = [
    {
      text: "Welcome to ALS International Recruitment Assistant! Type a message or upload a client brief (PDF) or CV (PDF) to get started.",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString(),
    },
  ];

  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(generateChatId());
  const [messages, setMessages] = useState(initialMessages);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768); // Default to true on larger screens
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Webhook URLs
  const AI_AGENT_WEBHOOK = "https://charliebessell.app.n8n.cloud/webhook/3acb8d3b-c821-4cce-8a54-d59082f246be/chat";

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle window resize to toggle sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch(
          "https://charliebessell.app.n8n.cloud/webhook/e3f02125-19bd-4c15-94bb-f18752e3c25a",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, sessionId }),
          }
        );
        const data = await response.json();
        if (data.messages && Array.isArray(data.messages)) {
          const loadedChats = data.messages.map((chat) => ({
            id: chat.id || generateChatId(),
            messages: chat.messages || initialMessages,
            title: chat.messages[0]?.text.slice(0, 30) + "..." || "New Chat",
          }));
          setChatHistory(loadedChats);
          if (loadedChats.length > 0) {
            setCurrentChatId(loadedChats[0].id);
            setMessages(loadedChats[0].messages);
          } else {
            setMessages(initialMessages);
          }
        } else {
          setChatHistory([{ id: currentChatId, messages: initialMessages, title: "New Chat" }]);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        setChatHistory([{ id: currentChatId, messages: initialMessages, title: "New Chat" }]);
      } finally {
        setIsHistoryLoaded(true);
      }
    };
    fetchChatHistory();
  }, [userEmail, sessionId]);

  // Save chat history when messages change
  useEffect(() => {
    if (!isHistoryLoaded) return;

    const saveChatHistory = async () => {
      const updatedChatHistory = chatHistory.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages } : chat
      );
      try {
        await fetch(
          "https://charliebessell.app.n8n.cloud/webhook/a1317ced-5acf-4f47-82da-50db3e9c53d4",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, sessionId, messages: updatedChatHistory }),
          }
        );
      } catch (error) {
        console.error("Failed to save chat history:", error);
      }
    };
    saveChatHistory();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, userEmail, sessionId, currentChatId, chatHistory, isHistoryLoaded]);

  // Generate a random filename
  const generateRandomFilename = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `client_brief_${randomString}.pdf`;
  };

  // Start a new chat
  const startNewChat = () => {
    const newChatId = generateChatId();
    const newChat = {
      id: newChatId,
      messages: initialMessages,
      title: "New Chat",
    };
    setChatHistory([newChat, ...chatHistory]);
    setCurrentChatId(newChatId);
    setMessages(initialMessages);
    setFile(null);
    setUserInput("");
  };

  // Select a chat from history
  const selectChat = (chatId) => {
    const selectedChat = chatHistory.find((chat) => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setMessages(selectedChat.messages);
      setFile(null);
      setUserInput("");
    }
  };

  // Send message to AI agent webhook
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = {
      text: userInput,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId && chat.title === "New Chat"
          ? { ...chat, title: userInput.slice(0, 30) + "..." }
          : chat
      )
    );

    setUserInput("");
    setIsTyping(true);

    const formData = new FormData();
    formData.append("chatInput", userInput);
    formData.append("email", userEmail);
    formData.append("sessionId", sessionId);

    try {
      const response = await fetch(AI_AGENT_WEBHOOK, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.output) {
        setMessages((prev) => [
          ...prev,
          { text: data.output, sender: "bot", timestamp: new Date().toLocaleTimeString() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "No response from the AI agent.", sender: "bot", timestamp: new Date().toLocaleTimeString() },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Error processing your message. Please try again.", sender: "bot", timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle file selection and upload
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || selectedFile.type !== "application/pdf") {
      setMessages((prev) => [
        ...prev,
        { text: "Please upload a valid PDF file.", sender: "bot", timestamp: new Date().toLocaleTimeString() },
      ]);
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    setIsTyping(true);
    setMessages((prev) => [
      ...prev,
      { text: `Uploading ${selectedFile.name}...`, sender: "bot", timestamp: new Date().toLocaleTimeString() },
    ]);

    const randomFilename = generateRandomFilename();

    try {
      const fileReader = new FileReader();
      const fileData = await new Promise((resolve) => {
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.readAsArrayBuffer(selectedFile);
      });

      const formData = new FormData();
      formData.append("file", new Blob([fileData], { type: "application/pdf" }), randomFilename);
      formData.append("email", userEmail);
      formData.append("sessionId", sessionId);
      formData.append("message", "Parse");

      const response = await fetch(AI_AGENT_WEBHOOK, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.output) {
        setMessages((prev) => [
          ...prev,
          { text: "File processed successfully!", sender: "bot", timestamp: new Date().toLocaleTimeString() },
          { text: data.output, sender: "bot", timestamp: new Date().toLocaleTimeString() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "No response from the AI agent for parsing.", sender: "bot", timestamp: new Date().toLocaleTimeString() },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error processing file. Please try again.", sender: "bot", timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setIsUploading(false);
      setIsTyping(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("loginTime");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("sessionId");
    setSuccess("Logged out successfully!");
    onLogout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">
        ☰
      </button>
      <motion.div
        className={`sidebar ${sidebarOpen ? "" : "sidebar-hidden"}`}
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <img src="/als-logo-retina.jpg" alt="ALS International Logo" className="chat-logo" />
        <h1>Recruitment Assistant</h1>
        <button className="restart_button" onClick={startNewChat}>
          New Chat
        </button>
        <div className="chat-history">
          <h2>History</h2>
          {chatHistory.length > 0 ? (
            <ul>
              {chatHistory.map((chat) => (
                <li
                  key={chat.id}
                  className={`chat-history-item ${chat.id === currentChatId ? "active" : ""}`}
                  onClick={() => selectChat(chat.id)}
                >
                  {chat.title}
                </li>
              ))}
            </ul>
          ) : (
            <p>No chat history yet.</p>
          )}
        </div>
        <button className="logout_button" onClick={handleLogout}>
          Logout
        </button>
        <p className="poweredby">Powered by</p>
        <img src="/inlogic_logo_white.png" alt="InLogic Logo" className="inlogic_logo" />
      </motion.div>
      <div className="chat-container">
        <div className="chat-box">
          <div className="messages" role="log" aria-live="polite">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`message ${msg.sender === "bot" ? "bot-message" : "user-message"}`}
              >
                {msg.text}
                <small>{msg.timestamp}</small>
              </motion.div>
            ))}
            {success && <p className="success-message">{success}</p>}
            {file && <p className="file-upload-feedback">Selected: {file.name}</p>}
            <div ref={messagesEndRef} style={{ height: "1px" }} />
          </div>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="typing-indicator"
            >
              <span></span>
              <span></span>
              <span></span>
            </motion.div>
          )}
          <form onSubmit={handleSendMessage} className="input-container">
            <div className="input-wrapper">
              {userInput === "" && (
                <span className="input-placeholder">Message Recruitment Assistant...</span>
              )}
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="input-box"
                aria-label="Message input"
                ref={inputRef}
              />
            </div>
            <div className="input-buttons">
              <button type="button" onClick={handlePaperclipClick} className="attach-button" aria-label="Upload file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2]">
                  <path d="M10 9V15C10 16.1046 10.8954 17 12 17V17C13.1046 17 14 16.1046 14 15V7C14 4.79086 12.2091 3 10 3V3C7.79086 3 6 4.79086 6 7V15C6 18.3137 8.68629 21 12 21V21C15.3137 21 18 18.3137 18 15V8" stroke="currentColor" />
                </svg>
              </button>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                ref={fileInputRef}
                style={{ display: "none" }}
                aria-hidden="true"
              />
              <button type="submit" className="send-message-button" disabled={!userInput.trim()} aria-label="Send message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2]">
                  <path d="M5 11L12 4M12 4L19 11M12 4V21" stroke="currentColor" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem("isLoggedIn") === "true"
  );
  const [userEmail, setUserEmail] = useState(sessionStorage.getItem("userEmail"));
  const [sessionId, setSessionId] = useState(sessionStorage.getItem("sessionId"));
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const timeout = 30 * 60 * 1000; // 30 minutes
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("loginTime");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("sessionId");
        setIsLoggedIn(false);
        setUserEmail(null);
        setSessionId(null);
      }, timeout);
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isLoggedIn]);

  const handleLogin = (email, sessionId) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setSessionId(sessionId);
    setShowSignup(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail(null);
    setSessionId(null);
    setShowSignup(false);
  };

  const handleSwitchToSignup = () => {
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
  };

  return isLoggedIn ? (
    <Chatbot userEmail={userEmail} sessionId={sessionId} onLogout={handleLogout} />
  ) : showSignup ? (
    <Signup onSwitchToLogin={handleSwitchToLogin} />
  ) : (
    <Login onLogin={handleLogin} onSwitchToSignup={handleSwitchToSignup} />
  );
};

export default App;