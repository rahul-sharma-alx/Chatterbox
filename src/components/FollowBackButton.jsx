import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const FollowBackButton = ({ senderId }) => {
  const { currentUser } = useAuth();
  const [alreadyFollowing, setAlreadyFollowing] = useState(false);

  useEffect(() => {
    const checkFollowing = async () => {
      if (!currentUser) return;
      const docRef = doc(db, 'users', currentUser.uid, 'following', senderId);
      const docSnap = await getDoc(docRef);
      setAlreadyFollowing(docSnap.exists());
    };

    checkFollowing();
  }, [currentUser, senderId]);

  const handleFollowBack = async () => {
    if (!currentUser) return;

    // Follow back
    await setDoc(doc(db, 'users', currentUser.uid, 'following', senderId), {
      followedAt: Date.now(),
    });

    await setDoc(doc(db, 'users', senderId, 'followers', currentUser.uid), {
      followedAt: Date.now(),
    });

    setAlreadyFollowing(true);
  };

  if (alreadyFollowing) return null;

  return (
    <button
      onClick={handleFollowBack}
      className="ml-3 text-sm text-blue-600 hover:underline"
    >
      Follow Back
    </button>
  );
};

export default FollowBackButton;
