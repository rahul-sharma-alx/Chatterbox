//src/Utilities/PostFeed
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import PostItem from './PostItem';
import LoadingAni from '../components/LoadingAni';

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const getPosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const postRef = collection(db, 'posts');
      const postQuery = lastDoc
        ? query(postRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(10))
        : query(postRef, orderBy('timestamp', 'desc'), limit(10));

      const snap = await getDocs(postQuery);
      const newPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filtered = newPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });

      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
        if (snap.docs.length < 10) setHasMore(false); // No more posts
      } else {
        setHasMore(false); // No more posts
      }

    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [lastDoc, loading, hasMore]); // ✅ dependency array

  useEffect(() => {
    getPosts();
  }, [getPosts]);

  useEffect(() => {
    const currentRef = loaderRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        getPosts();
      }
    }, { threshold: 1 });

    observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [getPosts, loading, hasMore]);

   // 🔥 Skeleton component
  const SkeletonPost = () => (
    <div className="bg-white p-4 rounded-lg shadow animate-pulse space-y-3">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1 h-4 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-60 bg-gray-200 rounded" />
    </div>
  );

  return (
    <div className="space-y-6">
      {initialLoading ? (
        Array(5).fill(0).map((_, i) => <SkeletonPost key={i} />)
      ) : (
        posts.map(post => (
          <PostItem key={post.id} post={post} />
        ))
      )}

      <div ref={loaderRef} className="text-center py-6 text-gray-500">
        {loading && !initialLoading ? (
          <LoadingAni text="Loading Feed" size={25} />
        ) : hasMore ? (
          'Scroll to load more'
        ) : (
          'No more posts'
        )}
      </div>
    </div>
  );
};

export default PostFeed;
