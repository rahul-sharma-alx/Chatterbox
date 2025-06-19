// ChatMsg.jsx – Full-featured chat view with emoji, media, reactions, gesture replies, and presence
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import {
    collection,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import EmojiPicker from 'emoji-picker-react';
import { updatePresence, subscribeToPresence } from '../utils/presence';
import ChatMessageBubble from '../components/ChatMessageBubble';

const ChatMsg = ({ currentUserId, otherUser, onBack }) => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaType, setMediaType] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [otherPresence, setOtherPresence] = useState(null);
    const bottomRef = useRef(null);
    const [replyTo, setReplyTo] = useState(null);

    useEffect(() => {
        if (!currentUser || !otherUser) return;

        const q = query(
            collection(db, 'users', currentUser.uid, 'messages', otherUser.uid, 'chats'),
            orderBy('timestamp')
        );
        const unsubMessages = onSnapshot(q, (snap) => {
            setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubPresence = subscribeToPresence(otherUser.uid, setOtherPresence);

        updatePresence(currentUser.uid);
        const handleFocus = () => updatePresence(currentUser.uid);
        const handleBlur = () => updatePresence(currentUser.uid);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            unsubMessages();
            unsubPresence();
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [currentUser, otherUser]);

    const handleTyping = () => {
        updatePresence(currentUser.uid, true);
        if (typingTimeout) clearTimeout(typingTimeout);
        setTypingTimeout(setTimeout(() => updatePresence(currentUser.uid, false), 2000));
    };

    const handleSend = async () => {
        if (!newMessage && !selectedMedia) return;

        let messageData = {
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
        };

        if (newMessage) {
            messageData.type = 'text';
            messageData.text = newMessage;
        }

        if (replyTo) {
            messageData.replyTo = {
                text: replyTo.text || null,
                type: replyTo.type,
                senderId: replyTo.senderId,
            };
        }

        if (selectedMedia) {
            const url = await uploadToCloudinary(selectedMedia);
            messageData.type = mediaType;
            messageData.mediaUrl = url;
        }

        const chatRef1 = collection(db, 'users', currentUser.uid, 'messages', otherUser.uid, 'chats');
        const chatRef2 = collection(db, 'users', otherUser.uid, 'messages', currentUser.uid, 'chats');

        await addDoc(chatRef1, messageData);
        await addDoc(chatRef2, messageData);

        setNewMessage('');
        setSelectedMedia(null);
        setMediaType('');
        setReplyTo(null);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        updatePresence(currentUser.uid, false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedMedia(file);
        const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
        setMediaType(type);
    };

    const handleReact = async (msg, emoji) => {
        try {
            const reactionRef = doc(
                db,
                'users',
                currentUser.uid,
                'messages',
                otherUser.uid,
                'chats',
                msg.id,
                'reactions',
                currentUser.uid
            );
            await setDoc(reactionRef, {
                emoji,
                reactedAt: new Date(),
                by: currentUser.uid
            });
            console.log('Reacted:', emoji, 'to', msg.id);
        } catch (err) {
            console.error('🔥 Reaction failed:', err.message);
        }
    };

    const handleEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 border-b flex items-center justify-between">
                <button onClick={onBack} className="text-blue-500 font-semibold">← Back</button>
                <h3 className="text-lg font-bold">
                    {otherUser.displayName} {otherPresence?.online ? '🟢' : '⚪'}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map(msg => (
                    <ChatMessageBubble
                        key={msg.id}
                        msg={msg}
                        isOwn={msg.senderId === currentUser.uid}
                        onReply={() => setReplyTo(msg)}
                        onReact={handleReact}
                    />
                ))}
                <div ref={bottomRef}></div>
            </div>

            <div className="p-4 border-t flex flex-col space-y-2 relative">
                {replyTo && (
                    <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded shadow text-sm text-gray-700">
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-blue-600 text-xs">Replying to</span>
                            <span className="truncate max-w-xs">{replyTo.text || `[${replyTo.type} message]`}</span>
                        </div>
                        <button className="text-gray-400 hover:text-black ml-2" onClick={() => setReplyTo(null)}>✕</button>
                    </div>
                )}

                {showEmojiPicker && (
                    <div className="absolute bottom-20 left-2 z-10">
                        <EmojiPicker onEmojiClick={handleEmojiClick} height={300} width={250} />
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowEmojiPicker(prev => !prev)} className="text-xl">😊</button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                        placeholder="Type a message"
                        className="flex-grow border rounded p-2"
                    />
                    <input type="file" onChange={handleFileChange} className="hidden" id="media-upload" />
                    <label htmlFor="media-upload" className="cursor-pointer px-2 py-1 bg-gray-100 rounded">📎</label>
                    <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
                </div>
            </div>
        </div>
    );
};

export default ChatMsg;