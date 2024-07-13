// components/ChatButton.js
import { useState } from 'react';
import Chat from './Chat';

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button onClick={toggleChat} className="chat-button">
        <img src="/chat-icon.png" alt="Chat" />
      </button>
      {isOpen && <Chat />}
      <style jsx>{`
        .chat-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #0070f3;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .chat-button img {
          width: 30px;
          height: 30px;
        }
      `}</style>
    </div>
  );
};

export default ChatButton;
