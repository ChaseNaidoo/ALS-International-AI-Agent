import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";

const Chatbot = () => {
  const initialMessages = [
    { text: "Welcome to ALS International Recruitment Assistant! Upload a client brief (PDF) to get started.", sender: "bot" }
  ];

  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("chatMessages")) || initialMessages);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);

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
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setMessages((prev) => [
        ...prev,
        { text: "PDF file dropped successfully! Click 'Upload PDF' to continue.", sender: "bot" }
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: "Please upload a valid PDF file.", sender: "bot" }
      ]);
    }
  };

  const resetChat = () => {
    setMessages(initialMessages);
    localStorage.setItem("chatMessages", JSON.stringify(initialMessages));
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

        {/* File Upload Section */}
        <motion.div
          className="file-upload-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p>Drag and drop a PDF here, or click below to browse for the file</p>
          
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            id="file-input"
            style={{ display: "none" }}
          />

          <div className="browse_files_container">
            <label htmlFor="file-input" className="browse_files_button">
              Browse Files
            </label>
          </div>
        </motion.div>

        {/* Upload Button */}
        {file && !isUploading && (
          <button className="send-button" onClick={handleFileUpload} disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload PDF"}
          </button>
        )}

        {/* Reset Chat Button */}
        <div className="restart_button_container">
          <button className="restart_button" onClick={resetChat}>
            Reset Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
