// PostPage.jsx - Dedicated page for viewing shared posts
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import PostItem from '../Utilities/PostItem';
import LoadingAni from '../components/LoadingAni';

const PostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) return <LoadingAni />;
  if (!post) return <div className="text-center mt-10">Post not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <PostItem post={post} />
    </div>
  );
};

export default PostPage;
