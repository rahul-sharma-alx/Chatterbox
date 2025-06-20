// utils/presence.js
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Updates a user's presence status in Firestore.
 * 
 * - Marks them online.
 * - Records if they're typing.
 * - Updates last seen timestamp.
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
    console.error(`🔥 updatePresence failed for ${uid}:`, err.message);
  }
};

/**
 * Subscribes to presence status of a user.
 *
 * @param {string} uid - UID of the user to observe.
 * @param {(data: { online: boolean, isTyping: boolean, lastSeen: Date|null }) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export const subscribeToPresence = (uid, callback) => {
  if (!uid || typeof callback !== 'function') {
    console.warn('⚠️ subscribeToPresence: Invalid arguments');
    return () => {};
  }

  try {
    const statusRef = doc(db, 'status', uid);
    const unsubscribe = onSnapshot(statusRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          online: !!data.online,
          isTyping: !!data.isTyping,
          lastSeen: data.lastSeen?.toDate?.() || null
        });
      } else {
        // Fallback in case no document exists
        callback({
          online: false,
          isTyping: false,
          lastSeen: null
        });
      }
    });

    return unsubscribe;
  } catch (err) {
    console.error(`❌ subscribeToPresence failed for ${uid}:`, err.message);
    return () => {};
  }
};
