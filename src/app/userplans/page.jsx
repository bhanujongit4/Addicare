"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { db } from '../../firebaseconfig'; // Adjust the import path as needed
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from "../components/Mainnavnar";
import Prompt from '../prompt/page';

const lightGreen = '#e8f5e9';
const mediumGreen = '#66bb6a';
const darkGreen = '#2e7d32';

export default function UserPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/authentication/login");
    } else if (status === "authenticated") {
      fetchUserPlans();
    }
  }, [status, router]);

  const fetchUserPlans = async () => {
    try {
      const q = query(collection(db, 'userPlans'), where('userId', '==', session.user.id));
      const querySnapshot = await getDocs(q);
      const userPlans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlans(userPlans);
    } catch (error) {
      console.error("Error fetching user plans:", error);
      alert('An error occurred while fetching your plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setShowPrompt(true);
  };

  const handlePlanClick = (planId) => {
    router.push(`/planandstory?planId=${planId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showPrompt) {
    return <Prompt />;
  }

  return (
    <section className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          {/* Text and Button Section */}
          <div className="lg:pr-8">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Your Plans</h2>
            <p className="text-gray-500 mb-6">
              {plans.length === 0
                ? "You haven't created any plans yet. Click the button below to create your first plan!"
                : "Here are your plans. Click on any plan to view or edit it."}
            </p>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition"
              onClick={handleCreatePlan}
            >
              Create New Plan
            </button>
          </div>

          {/* Image Section */}
          <div className="mt-8 lg:mt-0">
            <img
              src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/cta/cta-dashboard-mockup.svg"
              alt="Dashboard Mockup"
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Plans List */}
        {plans.length > 0 && (
          <div className="mt-8 space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-100 cursor-pointer transition"
                onClick={() => handlePlanClick(plan.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 text-green-500 flex items-center justify-center rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Plan created on {new Date(plan.createdAt.toDate()).toLocaleDateString()}
                    </h3>
                    <p className="text-gray-600">Challenges: {plan.formData.addictions}</p>
                  </div>
                  <div className="text-green-500 font-medium">Click to Access</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
