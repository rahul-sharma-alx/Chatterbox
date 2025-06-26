// Enhanced PostItem.jsx with refined video controls and stable comment view toggle
import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, CornerDownRight } from 'lucide-react';
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
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const MAX_COMMENT_DEPTH = 3;

const PostItem = ({ post }) => {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState([]);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

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

  useEffect(() => {
    const commentsRef = collection(db, 'posts', post.id, 'comments');
    const commentsQuery = query(commentsRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(commentsQuery, (querySnapshot) => {
      const allComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(allComments);
    });
    return () => unsubscribe();
  }, [post.id]);

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
      if (post.userId !== currentUser.uid) {
        await addDoc(notificationsRef, {
          type: 'like', senderId: currentUser.uid, senderName: currentUser.displayName,
          postId: post.id, mediaUrl: post.mediaUrl || null,
          timestamp: serverTimestamp(), read: false
        });
      }
    }
  };

  const postComment = async (parentId = null) => {
    if (!comment.trim()) return;
    const commentsRef = collection(db, 'posts', post.id, 'comments');
    await addDoc(commentsRef, {
      userId: currentUser.uid,
      username: currentUser.displayName,
      text: comment,
      parentId,
      timestamp: serverTimestamp(),
    });
    setComment('');
    setReplyTo(null);
  };

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

  const renderComments = (parentId = null, depth = 0) => {
    if (depth > MAX_COMMENT_DEPTH) return null;
    return comments.filter(c => c.parentId === parentId).map(c => (
      <div key={c.id} className={`ml-${depth * 4} mt-2 border-l pl-2`}>
        <div className="flex items-start space-x-2 text-sm">
          <span className="font-semibold">{c.username}:</span>
          <span>{c.text}</span>
        </div>
        <div className="flex items-center space-x-2 ml-6 mt-1">
          <button
            onClick={() => {
              setReplyTo(c);
              setShowAllComments(true);
            }}
            className="text-xs text-blue-500 hover:underline flex items-center"
          >
            <CornerDownRight size={12} className="mr-1" />Reply
          </button>
        </div>
        {renderComments(c.id, depth + 1)}
      </div>
    ));
  };

  const topComment = [...comments].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))[0];

  if (!currentUser) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center space-x-3 mb-2">
        <img src={post.userAvatar} alt="avatar" className="w-8 h-8 rounded-full" />
        <span className="font-semibold">{post.username}</span>
      </div>

      <p className="text-sm mb-2">{post.caption}</p>

      {post.mediaType === 'video' ? (
        <video
          src={post.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          controls
          controlsList="nodownload noplaybackrate"
          className="w-full rounded-lg [&::-webkit-media-controls]:hidden"
          onContextMenu={e => e.preventDefault()}
          style={{ WebkitMediaControlsPanel: 'none' }}
        />
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
            placeholder={`Reply${replyTo ? ` to @${replyTo.username}` : ''}...`}
            className="border p-1 rounded text-sm flex-1"
          />
          <button onClick={() => postComment(replyTo?.id || null)} className="text-blue-500 text-sm">Post</button>
        </div>

        <button onClick={shareInChat} className="flex items-center space-x-1">
          <Share2 size={20} /> <span>Share</span>
        </button>
      </div>

      {comments.length > 0 && !showAllComments && topComment && (
        <div className="mt-3 text-sm text-gray-700 border-t pt-2 cursor-pointer" onClick={() => setShowAllComments(true)}>
          <span className="font-semibold">{topComment.username}:</span> {topComment.text}
        </div>
      )}

      {showAllComments && (
        <div className="mt-3 text-sm text-gray-700 border-t pt-2">
          {renderComments()}
        </div>
      )}
    </div>
  );
};

export default PostItem;
