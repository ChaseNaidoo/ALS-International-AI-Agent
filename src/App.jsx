import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import "./App.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("loginTime", Date.now());
        sessionStorage.setItem("userEmail", email);
        onLogin(email);
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
        <h1>ALS International</h1>
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
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="powered-by">Powered by InLogic</p>
      </div>
    </div>
  );
};

const Chatbot = ({ userEmail, onLogout }) => {
  const initialMessages = [
    {
      text: "Welcome to ALS International Recruitment Assistant! Upload a client brief (PDF) or type a message to get started.",
      sender: "bot",
    },
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [userInput, setUserInput] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch(
          "https://charliebessell.app.n8n.cloud/webhook/e3f02125-19bd-4c15-94bb-f18752e3c25a",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail }),
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
  }, [userEmail]);

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
            body: JSON.stringify({ email: userEmail, messages }),
          }
        );
      } catch (error) {
        console.error("Failed to save chat history:", error);
      }
    };
    saveChatHistory();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, userEmail, isHistoryLoaded]);

  const sendToN8N = async (formData) => {
    const response = await fetch(
      "https://charliebessell.app.n8n.cloud/webhook-test/2bcbf8d5-b648-4ef2-9fd6-b7526f0bac63",
      { method: "POST", body: formData }
    );
    return response.json();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = { text: userInput, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");

    const formData = new FormData();
    formData.append("message", userInput);
    formData.append("email", userEmail);

    try {
      const response = await fetch(
        "https://charliebessell.app.n8n.cloud/webhook-test/2bcbf8d5-b648-4ef2-9fd6-b7526f0bac63",
        { method: "POST", body: formData }
      );
      const data = await response.json();

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { text: data.response, sender: "bot" },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Error processing your message. Please try again.", sender: "bot" },
      ]);
    }
  };

  const handleFileSelect = async (selectedFile) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setMessages((prev) => [
        ...prev,
        {
          text: "PDF file uploaded successfully! Click 'Upload PDF' to continue.",
          sender: "bot",
          showUploadButton: true,
        },
      ]);

      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const pdfData = new Uint8Array(fileReader.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        const thumbnailUrl = canvas.toDataURL("image/png");
        setPdfThumbnail(thumbnailUrl);
      };
      fileReader.readAsArrayBuffer(selectedFile);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: "Please upload a valid PDF file.", sender: "bot" },
      ]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setMessages((prev) => [...prev, { text: "Uploading file...", sender: "bot" }]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await sendToN8N(formData);
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { text: "File uploaded successfully! Generating InMail draft...", sender: "bot" },
        ]);
      }
      if (data.draft) {
        setMessages((prev) => [
          ...prev,
          { text: `Here is your LinkedIn InMail draft:\n\n${data.draft}`, sender: "bot" },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Error uploading file. Please try again.", sender: "bot" },
      ]);
    }
    setIsUploading(false);
    setFile(null);
    setPdfThumbnail(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const droppedFile = event.dataTransfer.files[0];
    handleFileSelect(droppedFile);
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
    onLogout();
  };

  return (
    <div className="chat-container">
      <img src="/als-logo-retina.jpg" alt="ALS International Logo" className="chat-logo" />
      <h1>Recruitment Assistant</h1>
      <div className="chat-box">
        <div className="messages">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="message bot-message"
          >
            {initialMessages[0].text}
          </motion.div>
          <motion.div
            className={`file-upload-container ${dragOver ? "drag-over" : ""}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p>Drag and drop a PDF here, or click below to browse for the file</p>
            {pdfThumbnail && (
              <div className="file-preview">
                <img src={pdfThumbnail} alt="PDF Thumbnail" />
              </div>
            )}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              id="file-input"
              style={{ display: "none" }}
            />
            <div className="browse_files_container">
              <label htmlFor="file-input" className="browse_files_button">
                Browse Files
              </label>
              {file && <p className="file-name">{file.name}</p>}
            </div>
          </motion.div>
          {messages.slice(1).map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${msg.sender === "bot" ? "bot-message" : "user-message"}`}
            >
              {msg.text}
              {msg.showUploadButton && !isUploading && (
                <button
                  className="send-button"
                  onClick={handleFileUpload}
                  disabled={!file || isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload PDF"}
                </button>
              )}
            </motion.div>
          ))}
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
          <button type="submit" className="send-message-button" disabled={!userInput.trim()}>
            Send
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
      <p className="powered-by">Powered by</p>
      <img src="/inlogic_logo_white.png" alt="inlogic_logo" className="inlogic_logo"/>
    </div>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem("isLoggedIn") === "true"
  );
  const [userEmail, setUserEmail] = useState(sessionStorage.getItem("userEmail"));

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
        setIsLoggedIn(false);
        setUserEmail(null);
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

  const handleLogin = (email) => {
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail(null);
  };

  return isLoggedIn ? (
    <Chatbot userEmail={userEmail} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
};

export default App;