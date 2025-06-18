// src/Utilities/PostItem.jsx
import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const PostItem = ({ post }) => {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState([]);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  // 🔄 Listen to likes in real-time
  useEffect(() => {
    const postRef = doc(db, 'posts', post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likeList = data.likes || [];
        setLikes(likeList);
        setLiked(currentUser && likeList.includes(currentUser.uid));
      }
    });
    return () => unsubscribe();
  }, [post.id, currentUser]);

  // 🔄 Listen to comments in real-time
  useEffect(() => {
    const commentsRef = collection(db, 'posts', post.id, 'comments');
    const commentsQuery = query(commentsRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(commentsQuery, (querySnapshot) => {
      const allComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(allComments);
    });
    return () => unsubscribe();
  }, [post.id]);

  // ❤️ Like/Unlike with notification
  const toggleLike = async () => {
    const postRef = doc(db, 'posts', post.id);
    const notificationsRef = collection(db, 'users', post.userId, 'notifications');

    if (liked) {
      await updateDoc(postRef, {
        likes: arrayRemove(currentUser.uid),
      });
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(currentUser.uid),
      });

      // 🔔 Notify post owner (except self)
      if (post.userId !== currentUser.uid) {
        await addDoc(notificationsRef, {
          type: 'like',
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          postId: post.id,
          mediaUrl: post.mediaUrl || null,
          timestamp: serverTimestamp(),
          read: false
        });
      }
    }
  };

  // 💬 Add comment with notification
  const postComment = async () => {
    if (!comment.trim()) return;

    const commentsRef = collection(db, 'posts', post.id, 'comments');
    const notificationsRef = collection(db, 'users', post.userId, 'notifications');

    await addDoc(commentsRef, {
      userId: currentUser.uid,
      username: currentUser.displayName,
      text: comment,
      timestamp: serverTimestamp(),
    });

    // 🔔 Notify post owner (except self)
    if (post.userId !== currentUser.uid) {
      await addDoc(notificationsRef, {
        type: 'comment',
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        postId: post.id,
        commentText: comment,
        mediaUrl: post.mediaUrl || null,
        timestamp: serverTimestamp(),
        read: false
      });
    }

    setComment('');
  };

  // 🔄 Share in chat
  const shareInChat = async () => {
    const msgRef = collection(db, 'chats', 'shared', 'messages');
    await addDoc(msgRef, {
      from: currentUser.uid,
      type: 'shared_post',
      postId: post.id,
      postUrl: post.mediaUrl,
      timestamp: serverTimestamp()
    });
    alert('Post shared in chat!');
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center space-x-3 mb-2">
        <img src={post.userAvatar} alt="avatar" className="w-8 h-8 rounded-full" />
        <span className="font-semibold">{post.username}</span>
      </div>

      <p className="text-sm mb-2">{post.caption}</p>

      {post.mediaType === 'video' ? (
        <video src={post.mediaUrl} controls className="w-full rounded-lg" />
      ) : (
        <img src={post.mediaUrl} alt="post" className="w-full rounded-lg" />
      )}

      <div className="flex justify-around text-gray-600 mt-4">
        <button onClick={toggleLike} className="flex items-center space-x-1 hover:text-red-500">
          <Heart fill={liked ? 'red' : 'none'} /> <span>{likes.length}</span>
        </button>

        <div className="flex items-center space-x-2 w-full">
          <MessageCircle size={20} />
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment..."
            className="border p-1 rounded text-sm flex-1"
          />
          <button onClick={postComment} className="text-blue-500 text-sm">Post</button>
        </div>

        <button onClick={shareInChat} className="flex items-center space-x-1">
          <Share2 size={20} /> <span>Share</span>
        </button>
      </div>

      {/* 🔄 Realtime Comments */}
      {comments.length > 0 && (
        <div className="mt-3 space-y-1 text-sm text-gray-700 border-t pt-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start space-x-2">
              <span className="font-semibold">{c.username}:</span>
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostItem;

