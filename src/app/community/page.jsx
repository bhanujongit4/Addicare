"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from "../components/Mainnavnar"
import { useSession } from "next-auth/react";
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import PostCreationForm from '../post/page';
import { 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  Avatar,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { UserCircleIcon } from '@heroicons/react/solid';

// Import the UserScoreDisplay component
import UserScoreDisplay from '../components/scores';
export default function CommunityPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPosts();
      fetchTopUsers();
      fetchUserProfile();
    }
  }, [status]);

  const fetchPosts = async () => {
    try {
      const postCollection = collection(db, 'posts');
      const postSnapshot = await getDocs(query(postCollection, orderBy('createdAt', 'desc'), limit(10)));
      const postList = postSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const postsWithUserNames = await Promise.all(postList.map(async (post) => {
        const userName = await fetchUserName(post.userId);
        return {
          ...post,
          userName
        };
      }));

      setPosts(postsWithUserNames);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  const fetchTopUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('LibertyPoints', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTopUsers(usersList);
    } catch (error) {
      console.error("Error fetching top users: ", error);
    }
  };

  const fetchUserProfile = async () => {
    if (session?.user?.id) {
      try {
        const userDoc = await getDoc(doc(db, 'users', session.user.id));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user profile: ", error);
      }
    }
  };

  const fetchUserName = async (userId) => {
    try {
      let userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          userDoc = querySnapshot.docs[0];
        } else {
          return 'Unknown User';
        }
      }
      
      return userDoc.data().name;
    } catch (error) {
      console.error("Error fetching user data: ", error);
      return 'Unknown User';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      <Navbar></Navbar>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-2">
            <nav aria-label="Sidebar" className="sticky top-4 divide-y divide-gray-300">
              <div className="pb-8 space-y-1">
                {['Posts', 'Create Post', 'Leaderboards', 'Liberty Score'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === item.toLowerCase() ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab(item.toLowerCase())}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </nav>
          </div>

          {/* Main content area */}
          <main className="lg:col-span-9 xl:col-span-7">
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Posts" value="posts" />
                <Tab label="Create Post" value="create post" />
                <Tab label="Leaderboards" value="leaderboards" />
                <Tab label="Liberty Score" value="tokens" />
              </Tabs>
            </Box>

            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} sx={{ mb: 2 }}>
                    {post.imageUrls && post.imageUrls.length > 0 && (
                      <CardMedia
                        component="img"
                        sx={{ height: 200 }}
                        image={post.imageUrls[0]}
                        alt={post.title || 'Post image'}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        By: {post.userName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Posted on: {new Date(post.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        {post.content.substring(0, 100)}...
                      </Typography>
                      <Button size="small" sx={{ mt: 1 }}>
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'create post' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Create a New Post</h2>
                <PostCreationForm></PostCreationForm>
              </div>
            )}

            {activeTab === 'leaderboards' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Top Users  <Link href="/leaderboard" className="mt-4 block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                      View Entire Page
                    </Link></h2>
                {topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center mb-4">
                    <span className="mr-4 font-bold">{index + 1}</span>
                    {user.profilePictureUrl ? (
                      <img src={user.profilePictureUrl} alt={user.name} className="w-10 h-10 rounded-full mr-4" />
                    ) : (
                      <UserCircleIcon className="w-10 h-10 text-gray-300 mr-4" />
                    )}
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-500">Liberty Score: {user.LibertyPoints}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tokens' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Tokens and Purchases</h2>
                <UserScoreDisplay></UserScoreDisplay>
              </div>
            )}
          </main>

          {/* Right column */}
          <aside className="hidden xl:block xl:col-span-3">
            <div className="sticky top-4 space-y-4">
              {userProfile ? (
                <section aria-labelledby="user-profile-heading">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 id="user-profile-heading" className="text-xl font-bold mb-4">Your Profile</h2>
                    <div className="flex items-center mb-4">
                      {userProfile.profilePictureUrl ? (
                        <img 
  src={userProfile.profilePictureUrl} 
  alt={userProfile.name} 
  className="w-16 h-16 rounded-full mr-4 object-cover" 
/>

                      ) : (
                        <UserCircleIcon className="w-16 h-16 text-gray-300 mr-4" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{userProfile.name}</h3>
                      </div>
                    </div>
                    <UserScoreDisplay />
                    <Link href="/profile" className="mt-4 block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                      View Full Profile
                    </Link>
                  </div>
                </section>
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <p>Please log in to view your profile.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}