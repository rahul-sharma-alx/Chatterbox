// src/utils/followUser.js
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";

export const followUser = async (targetUserId) => {
    const currentUser = getAuth().currentUser;
    console.log("Target User: ", targetUserId);
    
  if (!currentUser || currentUser.uid === targetUserId) return;

  const followRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
  const alreadyFollowing = await getDoc(followRef);

  if (!alreadyFollowing.exists()) {
    await setDoc(followRef, { followedAt: Date.now() });
    await setDoc(doc(db, 'users', currentUser.uid, 'following', targetUserId), {
      followedAt: Date.now(),
    });

    const notifRef = collection(db, 'users', targetUserId, 'notifications');
    await addDoc(notifRef, {
      type: 'follow',
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Someone',
      senderPhoto: currentUser.photoURL || '',
      timestamp: serverTimestamp(),
      read: false
    });

    toast.success('Follow request sent!');
  } else {
    // alert('You’re already following this user.');
    toast.success(`You're already following this user.`);
    console.log(`You're already following this user.`);
    
  }
};