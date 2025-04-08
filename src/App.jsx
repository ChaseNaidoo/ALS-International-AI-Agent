import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import "./App.css";

// Utility to generate a unique session ID
const generateSessionId = () => {
  return "session_" + Math.random().toString(36).substring(2, 15) + Date.now();
};

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Added success state
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(""); // Clear previous success

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
        setSuccess("Login successful!"); // Set success message
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
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="powered-by-login">Powered by InLogic</p>
        <p className="switch-link" onClick={onSwitchToSignup}>
          Don&apos;t have an account? Sign up here
        </p>
      </div>
    </div>
  );
};

const Signup = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Added success state
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(""); // Clear previous success

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
        setSuccess("Signup successful! Please login."); // Set success message
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
          />
          <input
            type="text"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="signup-input"
          />
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
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
    },
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [success, setSuccess] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Webhook URLs
  const AI_AGENT_WEBHOOK = "https://charliebessell.app.n8n.cloud/webhook/3acb8d3b-c821-4cce-8a54-d59082f246be/chat";

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
          setMessages(data.messages);
        } else {
          setMessages(initialMessages);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        setMessages(initialMessages);
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
      try {
        await fetch(
          "https://charliebessell.app.n8n.cloud/webhook/a1317ced-5acf-4f47-82da-50db3e9c53d4",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, sessionId, messages }),
          }
        );
      } catch (error) {
        console.error("Failed to save chat history:", error);
      }
    };
    saveChatHistory();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, userEmail, sessionId, isHistoryLoaded]);

  // Generate a random filename
  const generateRandomFilename = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `client_brief_${randomString}.pdf`;
  };

  // Send message to AI agent webhook
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = { text: userInput, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
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
          { text: data.output, sender: "bot" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "No response from the AI agent.", sender: "bot" },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Error processing your message. Please try again.", sender: "bot" },
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
        { text: "Please upload a valid PDF file.", sender: "bot" },
      ]);
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    setIsTyping(true);
    setMessages((prev) => [...prev, { text: "Processing file...", sender: "bot" }]);

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
          { text: "File processed successfully!", sender: "bot" },
          { text: data.output, sender: "bot" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "No response from the AI agent for parsing.", sender: "bot" },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error processing file. Please try again.", sender: "bot" },
      ]);
    } finally {
      setIsUploading(false);
      setIsTyping(false);
      setFile(null);
      setPdfThumbnail(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const resetChat = () => {
    setMessages(initialMessages);
    setFile(null);
    setPdfThumbnail(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("loginTime");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("sessionId");
    setSuccess("Logged out successfully!");
    onLogout();
  };

  return (
    <div className="chat-container">
      <img src="/als-logo-retina.jpg" alt="ALS International Logo" className="chat-logo" />
      <h1>Recruitment Assistant</h1>
      <div className="chat-box">
        <div className="messages">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${msg.sender === "bot" ? "bot-message" : "user-message"}`}
            >
              {msg.text}
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="message bot-message"
            >
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.div>
          )}
          {success && <p className="success-message">{success}</p>}
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </div>
        <form onSubmit={handleSendMessage} className="input-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message here..."
            className="input-box"
          />
          <button type="button" onClick={handlePaperclipClick}>
            <img src="/paperclip_icon_als.png" alt="Upload icon" className="paperclip-icon" />
          </button>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          <button type="submit" className="send-message-button" disabled={!userInput.trim()}>
            <img src="/send_icon_als.png" alt="Send icon" className="send-icon" />
          </button>
        </form>
        <div className="button-container">
          <button className="restart_button" onClick={resetChat}>
            Reset Chat
          </button>
          <button className="logout_button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <p className="poweredby">Powered by</p>
      <img src="/inlogic_logo_white.png" alt="inlogic_logo" className="inlogic_logo" />
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