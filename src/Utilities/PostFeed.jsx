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

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <PostItem key={post.id} post={post} />
      ))}
      <div ref={loaderRef} className="text-center py-6 text-gray-500">
        {loading
          ? <LoadingAni text="Loading Feed" size={25} />
          : hasMore
            ? 'Scroll to load more'
            : 'No more posts'}
      </div>
    </div>
  );
};

export default PostFeed;
