"use client"

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db } from "../../firebaseconfig";
import { UserCircleIcon } from '@heroicons/react/solid';
import Link from 'next/link';

const FindSimilarUsersPage = () => {
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState(null);
  const [similarUsers, setSimilarUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCurrentUserAndSimilarUsers();
    }
  }, [status]);

  const fetchCurrentUserAndSimilarUsers = async () => {
    try {
      // Fetch current user's data
      const userDoc = await getDoc(doc(db, 'users', session.user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUser(userData);

        // Fetch similar users
        const userLibertyScore = userData.LibertyPoints || 0;
        const lowerBound = userLibertyScore - 100;
        const upperBound = userLibertyScore + 100;

        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('LibertyPoints', '>=', lowerBound),
          where('LibertyPoints', '<=', upperBound),
          orderBy('LibertyPoints', 'desc'),
          limit(20)
        );

        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.id !== session.user.id); // Exclude current user

        setSimilarUsers(usersList);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users: ", error);
      setLoading(false);
    }
  };

  if (status === "unauthenticated") {
    return <div className="text-center mt-8">Please log in to view similar users.</div>;
  }

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto mt-8 mb-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Find Users Like You</h1>
      {currentUser && (
        <div className="mb-6 text-center">
          <p className="text-lg">Your Liberty Score: <span className="font-bold">{currentUser.LibertyPoints || 0}</span></p>
        </div>
      )}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liberty Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {similarUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.profilePictureUrl ? (
                        <img className="h-10 w-10 rounded-full" src={user.profilePictureUrl} alt={user.name} />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                    <div className="ml-4">
                      <Link href={`/user/${user.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        {user.name}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.LibertyPoints || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Math.abs((user.LibertyPoints || 0) - (currentUser?.LibertyPoints || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {similarUsers.length === 0 && (
        <p className="text-center mt-4 text-gray-600">No similar users found.</p>
      )}
    </div>
  );
};

export default FindSimilarUsersPage;