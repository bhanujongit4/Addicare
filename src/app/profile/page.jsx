"use client"

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where} from 'firebase/firestore';
import { db } from "../../firebaseconfig"; 
import { useSession } from "next-auth/react";
import {useRouter} from 'next/navigation';
import { UserCircleIcon, BriefcaseIcon, CalendarIcon, PencilIcon, TrashIcon } from '@heroicons/react/solid';

const ProfilePage = () => {
  const { data: session , status} = useSession();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const router = useRouter()

  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
    if (status === "authenticated") {
      console.log("gimme");
     
    } else if (status === "unauthenticated") {
      router.push("/authentication/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPostsAndEvents();
      console.log("session works")
    }
  }, [session]);

  const fetchUserPostsAndEvents = async () => {
    try {
      // Fetch user's details
      const userDoc = await getDoc(doc(db, 'users', session.user.id));
      if (userDoc.exists()) {
        setUser(userDoc.data());
        setEditedUser(userDoc.data());
      }

      // Fetch posts by this user
      const postCollection = collection(db, 'posts');
      const userPostsQuery = query(postCollection, where('userId', '==', session.user.id));
      const postSnapshot = await getDocs(userPostsQuery);
      const postList = postSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postList);
    } catch (error) {
      console.error("Error fetching user's details and posts: ", error);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleUserUpdate = async () => {
    try {
      await updateDoc(doc(db, 'users', session.user.id), editedUser);
      setUser(editedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user profile: ", error);
    }
  };

  const handleInputChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  const handlePostDelete = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
  };

  const formatDate = (dateField) => {
    if (!dateField) return 'Unknown date';
    
    let date;
    if (dateField instanceof Date) {
      date = dateField;
    } else if (dateField.toDate && typeof dateField.toDate === 'function') {
      date = dateField.toDate();
    } else if (dateField.seconds) {
      date = new Date(dateField.seconds * 1000);
    } else if (typeof dateField === 'string') {
      date = new Date(dateField);
    } else {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString();
  };

  if (!user) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto mt-8 mb-8 px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <button
            onClick={handleEditToggle}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <div className="w-32 h-32 mb-4 md:mb-0 md:mr-6">
            {user.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCircleIcon className="w-full h-full text-gray-300" />
            )}
          </div>
          <div className="flex-grow">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  name="name"
                  value={editedUser.name || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Name"
                />
                <input
                  type="text"
                  name="location"
                  value={editedUser.location || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Location"
                />
                <textarea
                  name="bio"
                  value={editedUser.bio || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Bio"
                  rows="3"
                />
                <input
                  type="text"
                  name="organization"
                  value={editedUser.organization || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Organization"
                />
                <input
                  type="text"
                  name="twitter"
                  value={editedUser.twitter || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Twitter handle"
                />
                <input
                  type="text"
                  name="linkedin"
                  value={editedUser.linkedin || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="LinkedIn URL"
                />
                <input
                  type="text"
                  name="github"
                  value={editedUser.github || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="GitHub username"
                />
                <button
                  onClick={handleUserUpdate}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
                {user.location && (
                  <p className="text-gray-600 mb-2 flex items-center">
                    {user.location}
                  </p>
                )}
                <p className="text-gray-800 mb-4">{user.bio}</p>
                {user.organization && (
                  <p className="text-gray-600 mb-2 flex items-center">
                    <BriefcaseIcon className="w-5 h-5 mr-2" />
                    {user.organization}
                  </p>
                )}
                <div className="flex space-x-4 mb-4">
                  {user.twitter && (
                    <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  )}
                  {user.linkedin && (
                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                  {user.github && (
                    <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Your Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {posts.map((post) => (
          <div key={post.id} className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="h-48 bg-cover bg-center" style={{backgroundImage: `url(${post.imageUrls[0]})`}} />
            )}
            <div className="p-6 flex-grow">
              <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-4">{post.content.substring(0, 100)}...</p>
              <p className="text-sm text-gray-500 mb-4">
                Posted on: {formatDate(post.createdAt)}
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {/* Implement edit functionality */}}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handlePostDelete(post.id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {posts.length === 0 && (
        <p className="text-center text-gray-600 mb-8">You haven't created any posts yet.</p>
      )}
    </div>
  );
};

export default ProfilePage;