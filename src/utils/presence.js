// utils/presence.js
import { doc, setDoc, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
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
console.log(`🔄 Updating presence for ${uid}: online=true, isTyping=${isTyping}`);

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
    console.warn('⚠️ subscribeToPresence: Invalid arguments →', { uid, callback });
    return () => {};
  }

  try {
    const statusRef = doc(db, 'status', uid);
    console.debug('📡 Subscribing to presence updates for UID:', uid);

    const unsubscribe = onSnapshot(statusRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('🔥 Presence snapshot data:', data); // 🔍 DEBUG LINE

        callback({
          online: Boolean(data?.online),
          isTyping: Boolean(data?.isTyping),
          lastSeen: data?.lastSeen?.toDate?.() || null
        });
      } else {
        console.info(`ℹ️ No presence data found for UID: ${uid}`);
        callback({
          online: false,
          isTyping: false,
          lastSeen: null
        });
      }
    }, (error) => {
      console.error(`❌ Firestore snapshot error for UID: ${uid}`, error);
      callback({
        online: false,
        isTyping: false,
        lastSeen: null
      });
    });

    return unsubscribe;
  } catch (err) {
    console.error(`❌ subscribeToPresence failed for ${uid}:`, err.message);
    return () => {};
  }
};

/**
 * Fetches a user's presence **once** — useful for polling.
 *
 * @param {string} uid - User ID of the other user.
 * @returns {Promise<{ online: boolean, lastSeen: Date | null }>}
 */
export const fetchPresenceOnce = async (uid) => {
  if (!uid) return { online: false, lastSeen: null };

  try {
    const statusRef = doc(db, 'status', uid);
    const snap = await getDoc(statusRef);
    if (snap.exists()) {
      const data = snap.data();
      const lastSeen = data?.lastSeen?.toDate?.() || null;

      const now = new Date();
      const isOnline = lastSeen && (now - lastSeen < 30000); // still counts as online if <30s old

      return { online: isOnline && !!data?.online, lastSeen };
    }
  } catch (err) {
    console.error(`❌ fetchPresenceOnce failed: ${err.message}`);
  }

  return { online: false, lastSeen: null };
};

