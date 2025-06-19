// utils/reactions.js
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Save a reaction to a message.
 * @param {string} fromUserId - ID of the user reacting
 * @param {string} toUserId - ID of the other user (chat partner)
 * @param {string} messageId - ID of the message being reacted to
 * @param {string} emoji - The emoji used for the reaction
 */
export const reactToMessage = async (fromUserId, toUserId, messageId, emoji) => {
  const reactionRef = doc(db, 'users', toUserId, 'messages', fromUserId, 'chats', messageId, 'reactions', fromUserId);

  await setDoc(reactionRef, {
    emoji,
    userId: fromUserId,
    timestamp: serverTimestamp(),
  });
};
