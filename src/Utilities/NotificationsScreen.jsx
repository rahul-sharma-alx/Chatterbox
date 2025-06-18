import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import FollowBackButton from '../components/FollowBackButton'; // 🧠 make sure this exists

dayjs.extend(relativeTime);

const NotificationsScreen = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const notifsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const q = query(notifsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleClick = async (notif) => {
    const notifRef = doc(db, 'users', currentUser.uid, 'notifications', notif.id);
    await updateDoc(notifRef, { read: true });

    if (notif.postId) {
      navigate(`/post/${notif.postId}`);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp?.toDate ? dayjs(timestamp.toDate()).fromNow() : '';
  };

  return (
    <div className="p-4 md:p-6 h-full bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Notifications</h2>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => notif.type !== 'follow' && handleClick(notif)}
              className={`flex items-center p-3 rounded-xl shadow-sm transition-colors duration-200 cursor-pointer 
                ${notif.read ? 'bg-white hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100'}`}
            >
              <img
                src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${notif.senderName?.charAt(0) || 'U'}`}
                alt={notif.senderName}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div className="flex flex-col w-full text-gray-700">
                {notif.type === 'follow' ? (
                  <div className="flex items-center justify-between w-full">
                    <p>
                      <span className="font-semibold">{notif.senderName}</span> started following you.
                    </p>
                    <FollowBackButton senderId={notif.senderId} />
                  </div>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold">{notif.senderName}</span>{' '}
                      {notif.type === 'like'
                        ? 'liked your post.'
                        : notif.type === 'comment'
                        ? `commented: "${notif.commentText}"`
                        : 'did something.'}
                    </p>
                    <span className="text-xs text-gray-400">{formatTime(notif.timestamp)}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;
