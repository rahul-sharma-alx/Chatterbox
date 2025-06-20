// ChatMessageBubble.jsx – Smart ticks, reactions, and visibility-based 'seen' 🔥
import React, { useState, useEffect, useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { Check, CheckCheck } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const emojiList = ['❤️', '😂', '😮', '😢', '👍', '👎'];

const ChatMessageBubble = ({ msg, isOwn, onReply, onReact, currentUserId, otherUserId }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [statusState, setStatusState] = useState('sent');
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (!isOwn) {
      if (!msg.seen && bubbleRef.current) {
        const observer = new IntersectionObserver(
          async ([entry]) => {
            if (entry.isIntersecting) {
              const receiverRef = doc(
                db,
                'users',
                currentUserId,
                'messages',
                otherUserId,
                'chats',
                msg.id
              );
              await updateDoc(receiverRef, { seen: true });
              observer.disconnect();
            }
          },
          { threshold: 0.9 }
        );
        observer.observe(bubbleRef.current);
      }
    }
  }, [msg.seen, isOwn, currentUserId, otherUserId, msg.id]);

  useEffect(() => {
    if (!isOwn) return;
    if (msg.seen) setStatusState('seen');
    else if (msg.delivered) setStatusState('delivered');
    else setStatusState('sent');
  }, [msg.seen, msg.delivered, isOwn]);

  const bind = useGesture({
    onDrag: ({ direction: [x] }) => {
      if (x === -1 && !isOwn) onReply(msg);
    },
    onClick: () => setShowReactions(prev => !prev)
  });

  const handleReaction = (emoji) => {
    onReact(msg, emoji);
    setShowReactions(false);
  };

  const renderStatusTick = () => {
    if (!isOwn) return null;
    return (
      <span className="transition-opacity duration-300 ease-in-out opacity-100 ml-1 flex items-center">
        {statusState === 'seen' ? (
          <CheckCheck size={14} className="text-blue-500" />
        ) : statusState === 'delivered' ? (
          <CheckCheck size={14} className="text-gray-500" />
        ) : (
          <Check size={14} className="text-gray-400" />
        )}
      </span>
    );
  };

  return (
    <div
      ref={bubbleRef}
      {...bind()}
      style={{ touchAction: 'none' }}
      className={`relative p-3 rounded-xl max-w-[85%] sm:max-w-[75%] break-words shadow-sm transition-all duration-200 ${
        isOwn ? 'bg-blue-100 self-end ml-auto' : 'bg-gray-200 self-start mr-auto'
      }`}
    >
      {msg.replyTo && (
        <div className="text-xs italic text-gray-600 border-l-2 border-blue-400 pl-2 mb-1">
          {msg.replyTo.text || `[${msg.replyTo.type} message]`}
        </div>
      )}

      {msg.type === 'text' && <p className="whitespace-pre-line">{msg.text}</p>}
      {msg.type === 'image' && <img src={msg.mediaUrl} alt="media" className="rounded-lg mt-1 max-h-64 object-contain" />}
      {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg mt-1 max-h-64" />}
      {msg.type === 'audio' && <audio src={msg.mediaUrl} controls className="mt-1" />}

      <div className="flex items-center justify-end mt-1 text-xs text-gray-500 gap-1">
        <span>{msg.timestamp?.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
        {renderStatusTick()}
      </div>

      {msg.reaction && <div className="absolute -bottom-4 left-2 text-xl">{msg.reaction}</div>}

      {showReactions && (
        <div className="absolute -top-9 left-0 flex gap-2 bg-white border border-gray-200 shadow-md px-3 py-2 rounded-lg z-50">
          {emojiList.map((emoji) => (
            <button key={emoji} onClick={() => handleReaction(emoji)} className="text-xl hover:scale-125 transition-transform">
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessageBubble;