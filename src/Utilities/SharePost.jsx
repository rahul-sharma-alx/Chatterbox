// ✅ SharePost.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ImagePlus, Send, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SharePost = () => {
  const { currentUser } = useAuth();
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'chatterbox_preset');
    formData.append('cloud_name', 'dw8nrffhv');

    const res = await fetch(`https://api.cloudinary.com/v1_1/dw8nrffhv/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return {
      url: data.secure_url,
      type: data.resource_type,
    };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image/video files allowed");
      return;
    }

    setMedia(file);
    setPreview(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    if (loading) return; 
    if (!media) return toast.error("Select a file");
    setLoading(true);
    toast.dismiss();
    toast.loading("Uploading...", { id: 'posting' });

    try {
      const { url, type } = await uploadToCloudinary(media);

      await addDoc(collection(db, 'posts'), {
        timestamp: serverTimestamp(),
        caption: caption.trim(),
        mediaUrl: url,
        mediaType: type,
        userId: currentUser.uid,
        username: currentUser.displayName,
        userAvatar: currentUser.photoURL,
        likes: [],
      });

      setCaption('');
      setMedia(null);
      setPreview(null);
      toast.success("Post uploaded!", { id: 'posting' });

    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload post", { id: 'posting' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6 relative">
      <Toaster position="top-center" />
      <div className="flex items-center space-x-3">
        <img src={currentUser?.photoURL || `https://i.pravatar.cc/150?u=${currentUser?.uid}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder={`What's on your mind, ${currentUser?.displayName}?`} rows="2" />
      </div>
      {preview && (
        <div className="mt-4 relative">
          {media?.type?.startsWith('video') ? <video controls className="w-full rounded-lg"><source src={preview} /></video> : <img src={preview} alt="Preview" className="w-full rounded-lg" />}
          <button onClick={() => { setMedia(null); setPreview(null); }} className="absolute top-2 right-2 bg-black text-white rounded-full p-1">&times;</button>
        </div>
      )}
      <div className="flex justify-between items-center mt-4">
        <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 flex items-center space-x-2">
          <ImagePlus /> <span>{media ? "Change Media" : "Add Media"}</span>
        </label>
        <input id="file-upload" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        <button onClick={handlePost} disabled={loading || !media} className="flex items-center space-x-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-indigo-300">
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-4 h-4" />}<span>{loading ? 'Posting...' : 'Post'}</span>
        </button>
      </div>
    </div>
  );
};

export default SharePost;