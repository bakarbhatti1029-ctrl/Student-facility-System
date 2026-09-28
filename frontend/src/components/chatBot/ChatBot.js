import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const SUGGESTIONS = [
  'Find a hostel',
  'Available beds',
  'Budget food',
  'How does booking work?',
];

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const messagesEndRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const toggleChatBot = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChatBot = (e) => {
    e.stopPropagation();
    setIsMinimized(true);
  };

  const sendMessage = async (text) => {
    const msgText = text || input;
    if (!msgText.trim()) return;

    setShowGreeting(false);
    setMessages((prev) => [...prev, { text: msgText, sender: 'user', time: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgText }) });
      const data = await response.json();
      setMessages((prev) => [...prev, { text: data.reply, sender: 'bot', time: new Date() }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          text: 'Could not reach the server. Please try again. Contact: +92-310-4693600',
          sender: 'bot', time: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const clearConversation = () => {
    setMessages([]);
    setShowGreeting(true);
  };

  // Format bot message: convert *bold* and newlines
  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*([^*]+)\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="chatbot-container">
      {isOpen ? (
        <div className={`chatbot ${isMinimized ? 'minimized' : ''}`} onClick={isMinimized ? toggleChatBot : undefined}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="flex items-center gap-2">
              <span className="assistant-avatar">S</span>
              <span><b>SFS Assistant</b><small>Online · here to help</small></span>
            </div>
            {!isMinimized && (
              <div className="header-controls">
                <button onClick={minimizeChatBot} className="minimize-button" title="Minimize">
                  &#8722;
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="close-button"
                  title="Close"
                >
                  &#10005;
                </button>
              </div>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* Greeting */}
              {showGreeting && (
                <div className="chatbot-greeting">
                  <p className="greeting-eyebrow">Your student helper</p>
                  <h2>Assalam-o-Alaikum! How can I help?</h2>
                  <p>I can help you find hostels, check beds, browse food, or explain bookings.</p>
                </div>
              )}

              {/* Messages */}
              <div className="chatbot-messages" onClick={(e) => e.stopPropagation()}>
                {messages.map((msg, index) => (
                  <div key={index} className={`message-row ${msg.sender}`}>
                    {msg.sender === 'bot' && <span className="bot-mini-avatar">S</span>}
                    <div className={`message ${msg.sender}`}>
                      {msg.sender === 'bot' ? formatMessage(msg.text) : msg.text}
                      <time>{msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                <div className="message-row bot"><span className="bot-mini-avatar">S</span><div className="message bot typing-indicator">
                    <span></span><span></span><span></span>
                  </div></div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion Chips */}
              {messages.length === 0 && (
                <div className="suggestion-chips" onClick={(e) => e.stopPropagation()}>
                  {SUGGESTIONS.map((chip) => (
                    <button
                      key={chip}
                      className="chip"
                      onClick={() => sendMessage(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {messages.length > 0 && !isLoading && (
                <button type="button" className="new-chat" onClick={clearConversation}>Start a new chat</button>
              )}

              {/* Input */}
              <div className="chatbot-input" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Ask about hostels, food or bookings…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <button onClick={() => sendMessage()} className="send-button" disabled={isLoading}>
                  <span aria-hidden="true">➤</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="chatbot-icon" onClick={toggleChatBot} title="Chat with SFS Assistant">
          <div className="icon-wrapper">
            <img src="/chat_icon.png" alt="Chat with SFS Assistant" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;
