// ✅ HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import SharePost from '../Utilities/SharePost';
import PostFeed from '../Utilities/PostFeed';

const HomeScreen = () => {
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) setLoading(false);
    }, [currentUser]);

    if (!currentUser) return <div className="text-center mt-10">Please log in to see the feed.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="md:col-span-4">
                <SharePost />
                <PostFeed />
                <p className="p-1 border-t border-gray-200 text-center w-full">
                    Made with 💖 |<a href='https://alxpaced.netlify.app/'> Alxpace</a>
                </p>
            </div>
        </div>
    );
};

export default HomeScreen;