"use client"
import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { doc, getDoc } from 'firebase/firestore';
import { db } from "../../firebaseconfig";

const UserScoreDisplay = () => {
  const [streak, setStreak] = useState(0);
  const [libertyScore, setLibertyScore] = useState(0);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && session.user) {
        try {
          const userRef = doc(db, "users", session.user.id);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setStreak(userData.Streak || 0);
            setLibertyScore(userData.LibertyPoints || 0);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [session, status]);

  if (status !== "authenticated") return null;

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center">
        <span className="font-semibold text-indigo-600">🔥 {streak}</span>
      </div>
      <div className="flex items-center">
        <span className="font-semibold text-green-600">🗽 {libertyScore}</span>
      </div>
    </div>
  );
};

export default UserScoreDisplay;