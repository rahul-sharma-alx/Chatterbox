//src/Pages/UserProfile.jsx
import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import LoadingAni from '../components/LoadingAni';

const UserProfile = ({ userId }) => {
    const [userData, setUserData] = useState(null);
    const [publicPosts, setPublicPosts] = useState([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            const followersSnap = await getDocs(collection(db, 'users', userId, 'followers'));
            setFollowersCount(followersSnap.size);

            const followingSnap = await getDocs(collection(db, 'users', userId, 'following'));
            setFollowingCount(followingSnap.size);
        };

        fetchCounts();
    }, [userId]);

    useEffect(() => {
        const fetchProfile = async () => {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) setUserData(userSnap.data());

            const postsRef = collection(db, 'posts');
            const q = query(postsRef, where('userId', '==', userId), where('visibility', '==', 'public'));
            const postSnap = await getDocs(q);
            const posts = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPublicPosts(posts);
        };

        fetchProfile();
    }, [userId]);

    if (!userId) return <div className="p-4">Invalid user.</div>;

    if (!userData) return <div className="p-4 text-center"><LoadingAni fullScreen />
</div>;

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen transition-all duration-500 ease-in-out">
            <div className="mb-6 flex items-center space-x-4">
                <img src={userData.photoURL} alt="avatar" className="w-16 h-16 rounded-full" />
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{userData.displayName}</h2>
                    <p className="text-sm text-gray-500">@{userData.username}</p>
                </div>
            </div>
            <div className="flex space-x-4 text-sm text-gray-600 mt-2">
                <span><strong>{followersCount}</strong> Followers</span>
                <span><strong>{followingCount}</strong> Following</span>
            </div>

            <h3 className="text-lg font-semibold mb-4">Public Posts</h3>
            {publicPosts.length === 0 ? (
                <p className="text-gray-500">No public posts yet.</p>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {publicPosts.map(post => (
                        <div key={post.id} className="aspect-square bg-gray-200 rounded overflow-hidden">
                            {post.mediaType === 'video' ? (
                                <video src={post.mediaUrl} className="w-full h-full object-cover" />
                            ) : (
                                <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserProfile;
