"use client"
import React, { useState ,useEffect } from 'react';
import { UserIcon, CalendarIcon, SparklesIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/navigation';
import { db } from '../../firebaseconfig'; // Adjust the import path as needed
import { collection, addDoc } from 'firebase/firestore';
import { useSession } from "next-auth/react";

export default function EnhancedGeminiPrompt() {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    exerciseLevel: '',
    addictions: '',
    struggles: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/authentication/login");
      console.log(session)
    }
  }, [status, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const prompt = `Analyze and provide advice for a ${formData.age} year old ${formData.gender} 
    with an exercise level of ${formData.exerciseLevel}. 
    They are dealing with addictions to ${formData.addictions} 
    and are struggling with ${formData.struggles}. 
    Provide a step-by-step plan to improve their situation. For each step, provide exactly 3 tasks to improve at that step. Do not use asterisks or any other special characters. Number each step and task.`;
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const parsedPlan = parseOutput(data.output);
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'userPlans'), {
        formData,
        plan: parsedPlan,
        createdAt: new Date(),
        userId: session.user.id,
        userEmail: session.user.email,
      });

      router.push(`/planandstory?planId=${docRef.id}`);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const parseOutput = (rawOutput) => {
    const cleanOutput = rawOutput.replace(/\*/g, '');
    const steps = cleanOutput.split(/Step \d+:/).filter(step => step.trim() !== '');
    return steps.map(step => {
      const [title, ...tasks] = step.split(/\d+\./).filter(task => task.trim() !== '');
      return {
        title: title.trim(),
        tasks: tasks.map(task => task.trim())
      };
    });
  };

  return (
<div className="flex justify-center items-center min-h-screen bg-gray-50">
<div className="w-1/2 h-1/2 p-6 bg-white shadow-md rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block mb-2 text-gray-700">Age</label>
                <div className="relative">
                  <CalendarIcon className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block mb-2 text-gray-700">Gender</label>
                <div className="relative">
                  <UserIcon className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block mb-2 text-gray-700">Exercise Level</label>
              <div className="relative">
                <SparklesIcon className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                <select
                  name="exerciseLevel"
                  value={formData.exerciseLevel}
                  onChange={handleChange}
                  className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="very active">Very Active</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block mb-2 text-gray-700">Challenges (comma-separated)</label>
              <textarea
                name="addictions"
                value={formData.addictions}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows="2"
                required
                placeholder="e.g., smoking, procrastination"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700">Current Struggles</label>
              <textarea
                name="struggles"
                value={formData.struggles}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows="3"
                required
                placeholder="Describe your current difficulties"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-300"
            >
              {loading ? 'Processing...' : 'Generate Your Plan'}
            </button>
          </form>
         </div>
         </div>
  );
}