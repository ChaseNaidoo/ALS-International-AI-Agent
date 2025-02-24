import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";

const Chatbot = () => {
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("chatMessages")) || [
    { text: "Welcome to ALS International Recruitment Assistant! Upload a client brief (PDF) to get started.", sender: "bot" }
  ]);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendToN8N = async (formData) => {
    const response = await fetch("https://charliebessell.app.n8n.cloud/webhook-test/2bcbf8d5-b648-4ef2-9fd6-b7526f0bac63", {
      method: "POST",
      body: formData,
    });
    return response.json();
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
          { text: "File uploaded successfully! Generating InMail draft...", sender: "bot" }
        ]);
      }

      if (data.draft) {
        setMessages((prev) => [
          ...prev,
          { text: `Here is your LinkedIn InMail draft:\n\n${data.draft}`, sender: "bot" }
        ]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { text: "Error uploading file. Please try again.", sender: "bot" }]);
    }

    setIsUploading(false);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input field
    }
  };

  const handleRestartChat = () => {
    setMessages([{ text: "Welcome to ALS International Recruitment Assistant! Upload a client brief (PDF) to get started.", sender: "bot" }]);
    localStorage.removeItem("chatMessages");
  };

  return (
    <div className="chat-container">
      <h1>ALS International Recruitment Assistant</h1>
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
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </div>

        <div className="input-container">
          <input
            className="browse_files_button"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            ref={fileInputRef}
          />
          <button 
            className="send-button" 
            onClick={handleFileUpload} 
            disabled={!file || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload PDF"}
          </button>
        </div>
        <div className="restart_button_container">
        <button className="restart_button" onClick={handleRestartChat}>
          Restart Chat
        </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
