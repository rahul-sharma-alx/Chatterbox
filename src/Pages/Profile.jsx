// src/pages/Profile.jsx
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
import { Pencil, Trash2, Lock, LogOut, Globe, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingAni from '../components/LoadingAni';

const Profile = () => {
  const { currentUser, logout, resetPassword } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPostId, setEditPostId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [bio, setBio] = useState("");
  const [visibilityMap, setVisibilityMap] = useState({});
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const fetchProfileData = async () => {
      // Get bio and visibility
      const profileRef = doc(db, 'users', currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        setBio(profileData.bio || "");
      }

      // Get user posts
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
    const confirm = window.confirm("Are you sure you want to delete this post?");
    if (!confirm) return;
    await deleteDoc(doc(db, 'posts', postId));
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success("Post deleted");
  };

  const handleEdit = async (postId) => {
    await updateDoc(doc(db, 'posts', postId), { caption: editCaption });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, caption: editCaption } : p));
    setEditPostId(null);
    toast.success("Post updated");
  };

  const toggleVisibility = async (postId) => {
    const newVisibility = visibilityMap[postId] === 'public' ? 'private' : 'public';
    await updateDoc(doc(db, 'posts', postId), { visibility: newVisibility });
    setVisibilityMap(prev => ({ ...prev, [postId]: newVisibility }));
    toast.success(`Post is now ${newVisibility}`);
  };

  const updateBio = async () => {
    await setDoc(doc(db, 'users', currentUser.uid), { bio }, { merge: true });
    toast.success("Bio updated");
  };

  const postCount = posts.length;

  if (!currentUser) return <div className="text-center mt-10">Please log in.</div>;
  if (loading) return <div className="text-center mt-10"><LoadingAni text="Loading Profile" size={28} />
</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <img src={currentUser.photoURL} alt="avatar" className="w-16 h-16 rounded-full" />
          <div>
            <h2 className="text-xl font-semibold">{currentUser.displayName}</h2>
            <p className="text-gray-500 text-sm">@{currentUser.displayName?.toLowerCase().replace(/\s/g, "")}</p>
            <textarea
              className="mt-2 w-full text-sm border p-2 rounded"
              placeholder="Write your bio..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onBlur={updateBio}
            />
          </div>
        </div>
        <div className="flex space-x-8 mt-4 text-gray-600">
          <span>{postCount} Posts</span>
          <span>{followers} Followers</span>
          <span>{following} Following</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
        <button
          className="flex items-center space-x-2 mb-2 text-red-600 hover:text-red-800"
          onClick={() => resetPassword(currentUser.email)}
        >
          <Lock size={18} /> <span>Reset Password</span>
        </button>
        <button
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          onClick={logout}
        >
          <LogOut size={18} /> <span>Logout</span>
        </button>
      </div>

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
