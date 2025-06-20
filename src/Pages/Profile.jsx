// Enhanced Profile.jsx with Tabs, Follow Requests Modal, and Infinite Scroll
import React, { useEffect, useState, useRef } from 'react';
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
  setDoc,
  limit,
  orderBy,
  startAfter
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import ProfileSkeleton from '../components/ProfileSkeleton';
import {
  Pencil, Trash2, Lock, LogOut, Globe, EyeOff, X,
  MoreVertical, Settings, Film, Image as ImageIcon, List
} from 'lucide-react';
import { useParams } from 'react-router-dom';

const TABS = {
  all: 'All',
  photos: 'Photos',
  videos: 'Videos'
};

const LIMIT = 6;

const Profile = () => {
  const { currentUser, logout, resetPassword } = useAuth();
  const { uid } = useParams();
  const isOwnProfile = !uid || uid === currentUser?.uid;

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPostId, setEditPostId] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [visibilityMap, setVisibilityMap] = useState({});
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef();
  const bottomRef = useRef();

  useEffect(() => {
    const targetUid = uid || currentUser?.uid;
    if (!targetUid) return;

    const fetchProfileData = async () => {
      const profileRef = doc(db, 'users', targetUid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        setUserData(profileData);
        setBio(profileData.bio || '');
        setProfileVisibility(profileData.visibility || 'public');
      }
    };

    const fetchFollows = async () => {
      const followersSnap = await getDocs(collection(db, 'users', targetUid, 'followers'));
      const followingSnap = await getDocs(collection(db, 'users', targetUid, 'following'));
      setFollowers(followersSnap.size);
      setFollowing(followingSnap.size);

      if (!isOwnProfile && currentUser) {
        const followDoc = await getDoc(doc(db, 'users', targetUid, 'followers', currentUser.uid));
        setIsFollowing(followDoc.exists());
      }
    };

    fetchProfileData();
    fetchFollows();
    loadPosts(true);
  }, [uid, currentUser, activeTab]);

  const loadPosts = async (reset = false) => {
    const targetUid = uid || currentUser?.uid;
    if (!targetUid) return;

    const baseQuery = query(
      collection(db, 'posts'),
      where('userId', '==', targetUid),
      orderBy('timestamp', 'desc'),
      ...(reset ? [limit(LIMIT)] : [startAfter(lastVisible), limit(LIMIT)])
    );

    const snap = await getDocs(baseQuery);
    const newPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const visMap = {};
    newPosts.forEach(post => {
      visMap[post.id] = post.visibility || 'public';
    });
    setVisibilityMap(prev => ({ ...prev, ...visMap }));

    if (reset) setPosts(newPosts);
    else setPosts(prev => [...prev, ...newPosts]);

    setLastVisible(snap.docs[snap.docs.length - 1]);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (loading) return;
    const ob = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && lastVisible) {
          setLoadingMore(true);
          loadPosts();
        }
      },
      { threshold: 1.0 }
    );
    if (bottomRef.current) ob.observe(bottomRef.current);
    return () => ob.disconnect();
  }, [lastVisible, loading]);

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
    setEditCaption('');
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
    setEditingBio(false);
    toast.success('Bio updated');
  };

  const handleFollow = async () => {
    if (!currentUser || !uid) return;
    await setDoc(doc(db, 'users', uid, 'followers', currentUser.uid), {});
    await setDoc(doc(db, 'users', currentUser.uid, 'following', uid), {});
    setIsFollowing(true);
    toast.success('Followed user');
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'photos') return post.mediaType === 'image';
    if (activeTab === 'videos') return post.mediaType === 'video';
    return true;
  });

  const postCount = posts.length;

  if (!currentUser) return <div className="text-center mt-10">Please log in.</div>;
  if (loading) return <ProfileSkeleton />;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow p-6 mb-6 relative">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <img src={userData?.photoURL} alt="avatar" className="w-16 h-16 rounded-full" />
            <div>
              <h2 className="text-xl font-semibold">{userData?.displayName}</h2>
              <p className="text-gray-500 text-sm">@{userData?.displayName?.toLowerCase().replace(/\s/g, '')}</p>
              {isOwnProfile ? (
                editingBio ? (
                  <textarea
                    className="mt-2 w-full text-sm border p-2 rounded"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    onBlur={updateBio}
                    autoFocus
                  />
                ) : (
                  <p
                    onClick={() => setEditingBio(true)}
                    className="mt-2 text-sm cursor-pointer text-gray-600"
                  >{bio || 'Click to add bio'}</p>
                )
              ) : (
                <p className="mt-2 text-sm text-gray-600">{bio || 'No bio'}</p>
              )}
            </div>
          </div>
          {isOwnProfile ? (
            <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500 hover:text-black">
              <Settings size={22} />
            </button>
          ) : (
            <button
              onClick={handleFollow}
              disabled={isFollowing}
              className={`text-sm px-4 py-1 rounded ${isFollowing ? 'bg-gray-300' : 'bg-blue-500 text-white'}`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <div className="flex space-x-8 mt-4 text-gray-600">
          <span>{postCount} Posts</span>
          <span>{followers} Followers</span>
          <span>{following} Following</span>
        </div>
        {showSettings && isOwnProfile && (
          <div className="mt-4 border-t pt-4">
            <button className="flex items-center space-x-2 mb-2 text-blue-600 hover:text-blue-800" onClick={toggleProfileVisibility}>
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
        )}
      </div>

      <div className="mb-4 flex justify-center gap-4">
        {Object.keys(TABS).map(key => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setLoading(true);
              loadPosts(true);
            }}
            className={`text-sm font-medium px-3 py-1 rounded ${activeTab === key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
          >
            {TABS[key]}
          </button>
        ))}
      </div>

      <h3 className="text-lg font-semibold mb-4 ml-2 ml-4">User Posts</h3>
      {filteredPosts.length === 0 ? (
        <p className="text-gray-500 ml-2">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 ml-4">
          {filteredPosts.map(post => (
            <div key={post.id} className="relative group">
              {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} className="w-full h-full object-cover rounded" muted autoPlay loop />
              ) : (
                <img src={post.mediaUrl} alt="media" className="w-full h-full object-cover rounded" />
              )}
              {isOwnProfile && (
                <div className="absolute top-1 right-1 hidden group-hover:flex flex-col space-y-1 bg-white rounded shadow p-1">
                  <button onClick={() => toggleVisibility(post.id)} className="text-gray-500 hover:text-black">
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
              )}
              {editPostId === post.id && isOwnProfile && (
                <div className="absolute bottom-0 left-0 w-full bg-white p-2 z-10">
                  <input
                    type="text"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full border p-1 rounded text-sm"
                    placeholder="Edit caption"
                  />
                  <button
                    onClick={() => handleEdit(post.id)}
                    className="mt-1 bg-blue-500 text-white text-xs px-3 py-1 rounded"
                  >Save</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div ref={bottomRef} className="h-10 mt-6 flex items-center justify-center">
        {loadingMore && <p className="text-gray-500 text-sm">Loading more...</p>}
      </div>
    </div>
  );
};

export default Profile;
