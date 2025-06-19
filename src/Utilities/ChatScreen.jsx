import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import ChatMsg from '../Pages/ChatMsg';

const ChatScreen = () => {
  const { currentUser } = useAuth();
  const [mutualUsers, setMutualUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // 👈 New state

  useEffect(() => {
    if (!currentUser) return;

    const fetchMutualFollowers = async () => {
      const followersSnap = await getDocs(collection(db, 'users', currentUser.uid, 'followers'));
      const followingSnap = await getDocs(collection(db, 'users', currentUser.uid, 'following'));

      const followerIds = new Set(followersSnap.docs.map(doc => doc.id));
      const followingIds = new Set(followingSnap.docs.map(doc => doc.id));

      const mutualIds = [...followerIds].filter(uid => followingIds.has(uid));

      const mutualData = await Promise.all(
        mutualIds.map(async (uid) => {
          try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return null;

            const user = userSnap.data();

            const lastMsgQuery = query(
              collection(db, 'users', currentUser.uid, 'messages', uid, 'chats'),
              orderBy('timestamp', 'desc'),
              limit(1)
            );
            const lastMsgSnap = await getDocs(lastMsgQuery);
            const lastMessage = lastMsgSnap.docs[0]?.data();

            return {
              uid,
              displayName: user.displayName || 'Unknown',
              photoURL: user.photoURL || '',
              isActive: user.isActive || false,
              lastMessage: lastMessage?.text || 'No messages yet',
              lastTimestamp: lastMessage?.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--'
            };
          } catch (err) {
            console.error("Error fetching user/chat data for UID:", uid, err);
            return null;
          }
        })
      );

      const deduped = Array.from(
        new Map(
          mutualData.filter(Boolean).map(user => [user.uid, user])
        ).values()
      );

      setMutualUsers(deduped);
    };

    fetchMutualFollowers();
  }, [currentUser]);

  // 🔁 If user selected → Show ChatMsg, else show chat list
  if (selectedUser) {
    return (
      <ChatMsg
        currentUserId={currentUser.uid}
        otherUser={selectedUser}
        onBack={() => setSelectedUser(null)} // 👈 Add back button support
      />
    );
  }

  return (
    <div className="p-4 md:p-6 h-full bg-gray-50 rounded-lg">
      <div className="space-y-4">
        {mutualUsers.length > 0 ? (
          mutualUsers.map(user => (
            <div
              key={user.uid}
              className="flex items-center bg-white p-3 rounded-xl shadow-sm hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
              onClick={() => setSelectedUser(user)} // 👈 Click opens ChatMsg
            >
              <div className="relative">
                <img
                  src={user.photoURL || `https://placehold.co/48x48/E2E8F0/4A5568?text=${user.displayName.charAt(0)}`}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-gray-700">{user.displayName}</p>
                <p className="text-sm text-gray-500 truncate max-w-[200px]">{user.lastMessage}</p>
              </div>
              <span className="text-xs text-gray-400">{user.lastTimestamp}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm text-center">No mutual followers or messages found.</p>
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
