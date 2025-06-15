'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from '../../firebaseconfig'; // Adjust path as needed

const PostCreationForm = () => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/authentication/login");
    }
  }, [status, router]);

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session || !session.user) return;

    try {
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const storageRef = ref(getStorage(), `post-images/${image.name}`);
          await uploadBytes(storageRef, image);
          return getDownloadURL(storageRef);
        })
      );

      const postData = {
        content,
        imageUrls,
        createdAt: new Date().toISOString(),
        userId: session.user.id,
        userEmail: session.user.email,
      };

      await addDoc(collection(db, 'posts'), postData);
      router.push('/posts'); // Adjust route as needed
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (status !== "authenticated") return null;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white rounded-lg shadow">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do you want to talk about?"
          className="w-full p-2 mb-4 border rounded"
          rows={4}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="mb-4"
        />
        {images.length > 0 && (
          <div className="flex flex-wrap mb-4">
            {images.map((image, index) => (
              <img 
                key={index} 
                src={URL.createObjectURL(image)} 
                alt={`Selected ${index}`} 
                className="w-24 h-24 object-cover m-1"
              />
            ))}
          </div>
        )}
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Post
        </button>
      </form>
    </div>
  );
};

export default PostCreationForm;