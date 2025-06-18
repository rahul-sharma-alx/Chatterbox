import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

const useUnreadNotifications = () => {
  const { currentUser } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const notifsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const q = query(notifsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasUnread(!snapshot.empty); // 🔴 if at least one unread
    });

    return () => unsubscribe();
  }, [currentUser]);

  return hasUnread;
};

export default useUnreadNotifications;
