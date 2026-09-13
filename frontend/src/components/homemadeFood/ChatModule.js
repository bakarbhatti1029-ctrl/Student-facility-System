import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from '../../utils/api';

const ChatModule = ({ orderId, kitchenId, orderStatus }) => { // Add orderStatus as a prop
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const userId = JSON.parse(atob(Cookies.get('token').split('.')[1])).id;

  useEffect(() => {
    const token = Cookies.get('token');

    // Initialize socket connection (authenticated — the backend rejects
    // connections without a valid token)
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
    });
    setSocket(newSocket);

    // Join order-specific chat room
    newSocket.emit('joinOrderRoom', { orderId });

    // Fetch chat history from the backend
    axios.get(`${API_BASE_URL}/api/chats/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setMessages(res.data);
    });

    // Listen for new incoming messages
    newSocket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup when component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, [orderId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const messageData = {
      orderId,
      userId,
      kitchenId,
      message: newMessage,
      timestamp: new Date().toISOString() // Set the timestamp locally
    };

    try {
      // Server derives userId/kitchenId from the order itself — only
      // orderId + message go over the wire.
      socket.emit('sendMessage', { orderId, message: newMessage });

      // Optimistically add the message to the chat (before posting to the server)
      setMessages((prevMessages) => [...prevMessages, messageData]);

      // Clear input field
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getSenderLabel = (msgUserId) => {
    if (String(msgUserId) === String(userId)) {
      return "You";
    } else if (String(msgUserId) === String(kitchenId)) {
      return "Chef";
    } else {
      return "Customer";
    }
  };

  // Check if the order is completed and disable the chat
  const isOrderCompleted = orderStatus === 'Completed';

  return (
    <div className="chat-container p-1">
      <div className="messages bg-[#25292e] rounded h-64 p-2 overflow-y-scroll">
        {messages.map((message, index) => (
          <div key={index} className="message p-1 border rounded m-1 shadow">
            <span className="font-bold">{getSenderLabel(message.userId)}: </span>
            <span>{message.message}</span>
            <p className='text-xs'>{new Date(message.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
      {/* Disable the input field and send button when the order is completed */}
      {!isOrderCompleted && (
        <div className="mt-2 flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="border text-black flex-grow p-2"
            placeholder="Type your message"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-2"
          >
            Send
          </button>
        </div>
      )}
      {isOrderCompleted && (
        <div className="text-red-500 pt-12 text-center">Chat is disabled for completed orders.</div>
      )}
    </div>
  );
};

export default ChatModule;
