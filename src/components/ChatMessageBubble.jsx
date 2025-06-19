import React, { useState } from 'react';
import { useGesture } from '@use-gesture/react';

const emojiList = ['❤️', '😂', '😮', '😢', '👍', '👎'];

const ChatMessageBubble = ({ msg, isOwn, onReply, onReact }) => {
  const [showReactions, setShowReactions] = useState(false);

  const bind = useGesture({
    onDrag: ({ direction: [x] }) => {
      if (x === -1 && !isOwn) onReply(msg); // only allow reply for incoming messages
    },
    onClick: () => {
      setShowReactions((prev) => !prev); // tap toggles emoji list
    }
  });

  const handleReaction = (emoji) => {
    onReact(msg, emoji);
    setShowReactions(false);
  };

  return (
    <div
      {...bind()}
      style={{ touchAction: 'none' }}
      className={`relative p-3 rounded-xl max-w-[75%] break-words shadow-sm transition-all duration-200 ${
        isOwn ? 'bg-blue-100 self-end ml-auto' : 'bg-gray-200 self-start mr-auto'
      }`}
    >
      {/* Reply Preview */}
      {msg.replyTo && (
        <div className="text-xs italic text-gray-600 border-l-2 border-blue-400 pl-2 mb-1">
          {msg.replyTo.text || `[${msg.replyTo.type} message]`}
        </div>
      )}

      {/* Message Body */}
      {msg.type === 'text' && <p className="whitespace-pre-line">{msg.text}</p>}
      {msg.type === 'image' && (
        <img
          src={msg.mediaUrl}
          alt="sent media"
          className="rounded-lg mt-1 max-h-64 object-contain"
        />
      )}
      {msg.type === 'video' && (
        <video src={msg.mediaUrl} controls className="rounded-lg mt-1 max-h-64" />
      )}
      {msg.type === 'audio' && (
        <audio src={msg.mediaUrl} controls className="mt-1" />
      )}

      {/* Timestamp & Reaction */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500">
          {msg.timestamp?.toDate().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </span>
        {msg.reaction && (
          <span className="text-xl ml-2">{msg.reaction}</span>
        )}
      </div>

      {/* Reactions Panel */}
      {showReactions && (
        <div className="absolute -top-9 left-0 flex gap-2 bg-white border border-gray-200 shadow-md px-3 py-2 rounded-lg z-50">
          {emojiList.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessageBubble;
