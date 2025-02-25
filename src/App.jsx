import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry"; // Required for proper PDF parsing
import "./App.css";

const Chatbot = () => {
  const initialMessages = [
    { text: "Welcome to ALS International Recruitment Assistant! Upload a client brief (PDF) to get started.", sender: "bot" }
  ];

  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("chatMessages")) || initialMessages);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pdfThumbnail, setPdfThumbnail] = useState(null); // Store the thumbnail URL
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

  const handleFileSelect = async (selectedFile) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setMessages((prev) => [
        ...prev,
        { text: "PDF file uploaded successfully! Click 'Upload PDF' to continue.", sender: "bot", showUploadButton: true }
      ]);

      // Read the file as an ArrayBuffer
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const pdfData = new Uint8Array(fileReader.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1);

        // Render the first page to a canvas
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        // Convert the canvas to an image URL
        const thumbnailUrl = canvas.toDataURL("image/png");
        setPdfThumbnail(thumbnailUrl);
      };

      fileReader.readAsArrayBuffer(selectedFile);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: "Please upload a valid PDF file.", sender: "bot" }
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
    localStorage.setItem("chatMessages", JSON.stringify(initialMessages));
    setFile(null);
    setPdfThumbnail(null);
  };

  return (
    <div className="chat-container">
      <h1>ALS International Recruitment Assistant</h1>
      <div className="chat-box">
        <div className="messages">
          {/* First message displayed separately */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="message bot-message"
          >
            {initialMessages[0].text}
          </motion.div>

          {/* File Upload Section */}
          <motion.div
            className={`file-upload-container ${dragOver ? 'drag-over' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-label="Drag and drop a PDF here, or click below to browse for the file"
          >
            <p>Drag and drop a PDF here, or click below to browse for the file</p>

            {/* Display PDF Thumbnail between the text and the button */}
            {pdfThumbnail && (
              <div className="file-preview">
                <img
                  src={pdfThumbnail}
                  alt="PDF Thumbnail"
                  style={{
                    maxWidth: "150px",
                    maxHeight: "200px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    marginTop: "10px"
                  }}
                />
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
              {file && <p className="file-name">{file.name}</p>} {/* Show file name */}
            </div>
          </motion.div>

          {/* Render the rest of the messages */}
          {messages.slice(1).map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${msg.sender === "bot" ? "bot-message" : "user-message"}`}
            >
              {msg.text}

              {/* Conditionally render the "Upload PDF" button */}
              {msg.showUploadButton && !isUploading && (
                <button className="send-button" onClick={handleFileUpload} disabled={!file || isUploading}>
                  {isUploading ? "Uploading..." : "Upload PDF"}
                </button>
              )}
            </motion.div>
          ))}

          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </div>

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
