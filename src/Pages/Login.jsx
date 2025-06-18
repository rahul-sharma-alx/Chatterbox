//Login.jsx
import React, { useState } from 'react'; 
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if a user with the same email already exists
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', user.email));
      const emailSnap = await getDocs(emailQuery);

      if (!emailSnap.empty) {
        // Update existing user's name and username if email matches
        const existingDoc = emailSnap.docs[0];
        await setDoc(doc(db, 'users', existingDoc.id), {
          displayName: user.displayName,
          username: user.displayName?.toLowerCase().replace(/\s+/g, ''),
          photoURL: user.photoURL,
          updatedAt: Date.now(),
        }, { merge: true });
      } else {
        // Save new user by uid if email not found
        await setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName,
          username: user.displayName?.toLowerCase().replace(/\s+/g, ''),
          email: user.email,
          photoURL: user.photoURL,
          createdAt: Date.now(),
        });
      }

      navigate('/');
    } catch (error) {
      alert(error.message);
    }
  };

  const loginWithEmail = async (e) => {
    e.preventDefault();
    setError('Temporarily Down');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-4 text-center">Login to ChatGram</h1>
        <form onSubmit={loginWithEmail} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border rounded focus:outline-none"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border rounded focus:outline-none"
            required
          />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Login with Email</button>
          {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
        </form>

        <div className="text-center my-4 text-gray-500">OR</div>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center bg-white border border-gray-300 py-2 rounded shadow hover:shadow-md transition"
        >
          <LogIn size={20} className="mr-2" /> Login with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
