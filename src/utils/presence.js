// utils/presence.js
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Updates a user's presence status in Firestore.
 *
 * @param {string} uid - Authenticated user ID.
 * @param {boolean} [isTyping=false] - Whether the user is currently typing.
 */
export const updatePresence = async (uid, isTyping = false) => {
  if (!uid) {
    console.warn('⚠️ updatePresence called without a valid UID');
    return;
  }

  try {
    const statusRef = doc(db, 'status', uid);
    await setDoc(
      statusRef,
      {
        online: true,
        isTyping,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.debug(`🔥 updatePresence failed for ${uid}:`, err.message);
  }
};

/**
 * Subscribes to a user's presence updates.
 *
 * @param {string} uid - UID of the user to track.
 * @param {(data: { online: boolean, isTyping: boolean, lastSeen: Date|null }) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export const subscribeToPresence = (uid, callback) => {
  if (!uid || typeof callback !== 'function') {
    console.warn('⚠️ subscribeToPresence: invalid arguments');
    return () => {};
  }

  try {
    const statusRef = doc(db, 'status', uid);
    const unsubscribe = onSnapshot(statusRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback({
          online: false,
          isTyping: false,
          lastSeen: null,
        });
      }
    });
    return unsubscribe;
  } catch (err) {
    console.debug(`❌ subscribeToPresence failed for ${uid}:`, err.message);
    return () => {};
  }
};
