// src/pages/SearchScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../context/UserProfileContext';
import { followUser } from './followUser';

const SearchScreen = () => {
    const { setSelectedUserId } = useUserProfile();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [modalPost, setModalPost] = useState(null);
    const { currentUser } = useAuth();

    const handleSearch = useCallback(async () => {
        if (!searchTerm.trim()) return;

        // Search Users
        const usersRef = collection(db, 'users');
        const userSnap = await getDocs(usersRef);
        const matchedUsers = userSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user =>
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        setUsers(matchedUsers);

        // Search Posts
        const postsRef = collection(db, 'posts');
        const postSnap = await getDocs(postsRef);
        const matchedPosts = postSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(post =>
                post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.username?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        setPosts(matchedPosts);
    }, [searchTerm]);

    // const followUser = async (targetUserId) => {
    //     if (!currentUser || currentUser.uid === targetUserId) return;

    //     const followRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
    //     const alreadyFollowing = await getDoc(followRef);

    //     if (!alreadyFollowing.exists()) {
    //         // ✅ Add to followers + following
    //         await setDoc(followRef, { followedAt: Date.now() });
    //         await setDoc(doc(db, 'users', currentUser.uid, 'following', targetUserId), {
    //             followedAt: Date.now(),
    //         });

    //         // ✅ Send a follow notification
    //         const notifRef = collection(db, 'users', targetUserId, 'notifications');
    //         await addDoc(notifRef, {
    //             type: 'follow',
    //             senderId: currentUser.uid,
    //             senderName: currentUser.displayName || 'Someone',
    //             senderPhoto: currentUser.photoURL || '',
    //             timestamp: serverTimestamp(),
    //             read: false
    //         });

    //         alert('Follow request sent!');
    //     } else {
    //         alert('You’re already following this user.');
    //     }
    // };
    const handleFollow = async (targetUserId) => {
        console.log("clicked!");
        
        await followUser(targetUserId);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            handleSearch();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [handleSearch]);

    return (
        <div className="p-4 md:p-6 h-full bg-gray-50 rounded-lg">
            <div className="relative mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users or content..."
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="flex space-x-4 mb-6">
                <button onClick={() => setActiveTab('users')} className={`font-medium ${activeTab === 'users' ? 'text-blue-600' : 'text-gray-500'}`}>Users</button>
                <button onClick={() => setActiveTab('posts')} className={`font-medium ${activeTab === 'posts' ? 'text-blue-600' : 'text-gray-500'}`}>Posts</button>
            </div>

            {activeTab === 'users' && users.length > 0 && (
                <div className="mb-6">
                    <ul className="space-y-3">
                        {users.map(user => (
                            <li key={user.id} className="flex justify-between items-center bg-white shadow p-3 rounded">
                                <div className="flex items-center space-x-3">
                                    <img src={user.photoURL} alt="avatar" className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-medium">{user.displayName}</p>
                                        <p className="text-sm text-gray-500">@{user.username || user.displayName?.toLowerCase()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {/* <button onClick={() => followUser(user.id)} className="text-sm text-green-600 hover:underline flex items-center">
                                        <UserPlus size={16} className="mr-1" /> Follow
                                    </button> */}
                                    <button onClick={()=>handleFollow(user.id)} className="text-sm text-green-600 hover:underline flex items-center">
                                        <UserPlus size={16} className="mr-1" /> Follow
                                    </button>
                                    <button
                                        className="text-sm text-blue-600 hover:underline"
                                        onClick={() => setSelectedUserId(user.id, currentUser.id)}
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {activeTab === 'posts' && posts.length > 0 && (
                <div>
                    <div className="grid grid-cols-3 gap-2">
                        {posts.map(post => (
                            <div
                                key={post.id}
                                className="aspect-square bg-gray-200 rounded-md overflow-hidden cursor-pointer"
                                onClick={() => setModalPost(post)}
                            >
                                {post.mediaType === 'video' ? (
                                    <video src={post.mediaUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Preview */}
            {modalPost && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-4 max-w-md w-full relative">
                        <button onClick={() => setModalPost(null)} className="absolute top-2 right-2 text-gray-600 hover:text-black">
                            <X size={18} />
                        </button>
                        <div className="mb-3">
                            <p className="font-semibold text-gray-800">{modalPost.username}</p>
                            <p className="text-sm text-gray-500">{modalPost.caption}</p>
                        </div>
                        {modalPost.mediaType === 'video' ? (
                            <video controls src={modalPost.mediaUrl} className="w-full rounded" />
                        ) : (
                            <img src={modalPost.mediaUrl} alt="preview" className="w-full rounded" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchScreen;