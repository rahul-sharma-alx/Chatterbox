// Full enhanced Profile.jsx with:
// - Profile visibility toggle
// - Clickable followers/following lists
// - Modal with profile preview
// - Ability to unfollow directly

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import LoadingAni from '../components/LoadingAni';
import { Pencil, Trash2, Lock, LogOut, Globe, EyeOff, X } from 'lucide-react';

const Profile = () => {
  const { currentUser, logout, resetPassword } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPostId, setEditPostId] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [bio, setBio] = useState('');
  const [visibilityMap, setVisibilityMap] = useState({});
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [followerList, setFollowerList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [showUserModal, setShowUserModal] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchProfileData = async () => {
      const profileRef = doc(db, 'users', currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        setBio(profileData.bio || '');
        setProfileVisibility(profileData.visibility || 'public');
      }

      const q = query(collection(db, 'posts'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const userPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const visMap = {};
      userPosts.forEach(post => {
        visMap[post.id] = post.visibility || 'public';
      });

      setVisibilityMap(visMap);
      setPosts(userPosts);
      setLoading(false);
    };

    const fetchFollows = async () => {
      const followersSnap = await getDocs(collection(db, 'users', currentUser.uid, 'followers'));
      const followingSnap = await getDocs(collection(db, 'users', currentUser.uid, 'following'));
      setFollowers(followersSnap.size);
      setFollowing(followingSnap.size);
    };

    fetchProfileData();
    fetchFollows();
  }, [currentUser]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    await deleteDoc(doc(db, 'posts', postId));
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Post deleted');
  };

  const handleEdit = async (postId) => {
    await updateDoc(doc(db, 'posts', postId), { caption: editCaption });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, caption: editCaption } : p));
    setEditPostId(null);
    toast.success('Post updated');
  };

  const toggleVisibility = async (postId) => {
    const newVisibility = visibilityMap[postId] === 'public' ? 'private' : 'public';
    await updateDoc(doc(db, 'posts', postId), { visibility: newVisibility });
    setVisibilityMap(prev => ({ ...prev, [postId]: newVisibility }));
    toast.success(`Post is now ${newVisibility}`);
  };

  const toggleProfileVisibility = async () => {
    const newVis = profileVisibility === 'public' ? 'private' : 'public';
    await setDoc(doc(db, 'users', currentUser.uid), { visibility: newVis }, { merge: true });
    setProfileVisibility(newVis);
    toast.success(`Profile is now ${newVis}`);
  };

  const updateBio = async () => {
    await setDoc(doc(db, 'users', currentUser.uid), { bio }, { merge: true });
    toast.success('Bio updated');
  };

  const fetchFollowersList = async () => {
    const snap = await getDocs(collection(db, 'users', currentUser.uid, 'followers'));
    const users = await Promise.all(snap.docs.map(async docSnap => {
      const userRef = doc(db, 'users', docSnap.id);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? { uid: docSnap.id, ...userDoc.data() } : null;
    }));
    console.log("log:", users.filter(Boolean));
    
    setFollowerList(users.filter(Boolean));
    setActiveTab('followers');
  };

  const fetchFollowingList = async () => {
    const snap = await getDocs(collection(db, 'users', currentUser.uid, 'following'));
    const users = await Promise.all(snap.docs.map(async docSnap => {
      const userRef = doc(db, 'users', docSnap.id);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? { uid: docSnap.id, ...userDoc.data() } : null;
    }));
    setFollowingList(users.filter(Boolean));
    setActiveTab('following');
  };

  const unfollowUser = async (targetUid) => {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'following', targetUid));
    toast.success(`Unfollowed ${targetUid}`);
    fetchFollowingList();
  };

  const postCount = posts.length;

  if (!currentUser) return <div className="text-center mt-10">Please log in.</div>;
  if (loading) return <div className="text-center mt-10"><LoadingAni text="Loading Profile" size={28} /></div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <img src={currentUser.photoURL} alt="avatar" className="w-16 h-16 rounded-full" />
          <div>
            <h2 className="text-xl font-semibold">{currentUser.displayName}</h2>
            <p className="text-gray-500 text-sm">@{currentUser.displayName?.toLowerCase().replace(/\s/g, '')}</p>
            <textarea
              className="mt-2 w-full text-sm border p-2 rounded"
              placeholder="Write your bio..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onBlur={updateBio}
            />
          </div>
        </div>
        <div className="flex space-x-8 mt-4 text-gray-600 cursor-pointer">
          <span>{postCount} Posts</span>
          <span onClick={fetchFollowersList}>{followers} Followers</span>
          <span onClick={fetchFollowingList}>{following} Following</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
        <button
          className="flex items-center space-x-2 mb-2 text-blue-600 hover:text-blue-800"
          onClick={toggleProfileVisibility}
        >
          {profileVisibility === 'private' ? <EyeOff size={18} /> : <Globe size={18} />}
          <span>Make Profile {profileVisibility === 'public' ? 'Private' : 'Public'}</span>
        </button>
        <button className="flex items-center space-x-2 mb-2 text-red-600 hover:text-red-800" onClick={() => resetPassword(currentUser.email)}>
          <Lock size={18} /> <span>Reset Password</span>
        </button>
        <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900" onClick={logout}>
          <LogOut size={18} /> <span>Logout</span>
        </button>
      </div>

      {activeTab && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-semibold mb-2">{activeTab === 'followers' ? 'Followers' : 'Following'}</h3>
          <ul className="space-y-2">
            {(activeTab === 'followers' ? followerList : followingList).map(user => (
              <li key={user.uid} className="flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowUserModal(user)}>
                  <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-gray-500">@{user.uid}</p>
                  </div>
                </div>
                {activeTab === 'following' && (
                  <button onClick={() => unfollowUser(user.uid)} className="text-red-500 text-xs">Unfollow</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowUserModal(null)}><X size={18} /></button>
            <div className="flex flex-col items-center">
              <img src={showUserModal.photoURL} alt="avatar" className="w-20 h-20 rounded-full mb-2" />
              <h2 className="text-lg font-semibold">{showUserModal.displayName}</h2>
              <p className="text-gray-500 text-sm">@{showUserModal.uid}</p>
              <p className="text-sm mt-2 text-center">{showUserModal.bio || 'No bio'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-2">Your Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500">You haven't posted anything yet.</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded shadow">
              {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} controls className="w-full rounded" />
              ) : (
                <img src={post.mediaUrl} alt="media" className="w-full rounded" />
              )}
              {editPostId === post.id ? (
                <div className="mt-2">
                  <input
                    type="text"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                  <button
                    onClick={() => handleEdit(post.id)}
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-700">{post.caption}</p>
              )}
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-4">
                  <button onClick={() => toggleVisibility(post.id)} className="text-gray-500 hover:text-black flex items-center">
                    {visibilityMap[post.id] === 'private' ? <EyeOff size={18} /> : <Globe size={18} />}
                  </button>
                  <button onClick={() => {
                    setEditPostId(post.id);
                    setEditCaption(post.caption);
                  }} className="text-blue-600 hover:text-blue-800">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </div>
                <span className="text-xs text-gray-400">{visibilityMap[post.id]}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;