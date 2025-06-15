"use client"
import React, { useState, useEffect } from 'react';
import { EmojiHappyIcon, EmojiSadIcon, FireIcon, ThumbUpIcon, HeartIcon, ThumbDownIcon } from '@heroicons/react/solid';
import { getSession } from "next-auth/react";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from "../../firebaseconfig"; 
import { useSession } from "next-auth/react";
import {useRouter} from 'next/navigation';
import Navbar from "../components/Mainnavnar"
import { Card, CardContent, Typography, Button, Slider } from '@mui/material';


const moodEmojis = [
  { emoji: '😊', name: 'Happy', icon: EmojiHappyIcon, color: 'bg-yellow-400' },
  { emoji: '😢', name: 'Sad', icon: EmojiSadIcon, color: 'bg-blue-400' },
  { emoji: '😡', name: 'Angry', icon: FireIcon, color: 'bg-red-400' },
  { emoji: '😌', name: 'Relaxed', icon: ThumbUpIcon, color: 'bg-green-400' },
  { emoji: '😟', name: 'Uncomfortable', icon: ThumbDownIcon, color: 'bg-pink-400' },
  { emoji: '🫡', name: 'Submissive', icon: HeartIcon, color: 'bg-pink-400' },
];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [suggestion, setSuggestion] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [libertyScore, setLibertyScore] = useState(0);
  const { data:session ,status } = useSession();
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
    const storedHistory = localStorage.getItem('moodHistory');
    if (storedHistory) {
      setMoodHistory(JSON.parse(storedHistory));
    }
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const session = await getSession();
      if (session && session.user) {
        const userRef = doc(db, "users", session.user.id);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setStreak(userData.Streak || 0);
          setLibertyScore(userData.LibertyPoints || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const handleIntensityChange = (e) => {
    setMoodIntensity(parseInt(e.target.value));
  };

  const updateUserStreak = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const today = new Date();
      const lastMoodLog = userData.lastMoodLog ? new Date(userData.lastMoodLog) : null;
      
      let newStreak = userData.Streak || 0;
      if (lastMoodLog && isYesterday(lastMoodLog)) {
        newStreak++;
      } else if (!lastMoodLog || !isToday(lastMoodLog)) {
        newStreak = 1;
      }
      let newLibertyPoints = userData.LibertyPoints || 0;
      newLibertyPoints += 10; // Add 10 LibertyPoints on every mood log
      
      // Update user document in Firestore
      await updateDoc(userRef, {
        Streak: newStreak,
        LibertyPoints: newLibertyPoints,
        lastMoodLog: today.toISOString()
      });
      
      setStreak(newStreak);
      setLibertyScore(newLibertyPoints);
      
      console.log("User streak and LibertyPoints updated");
    } else {
      console.error("User document not found");
    }
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) return;

    const newMoodEntry = { mood: selectedMood, intensity: moodIntensity, timestamp: new Date().toISOString() };
    const updatedHistory = [...moodHistory, newMoodEntry];
    setMoodHistory(updatedHistory);
    localStorage.setItem('moodHistory', JSON.stringify(updatedHistory));

    try {
      const session = await getSession();
      if (session && session.user) {
          await updateUserStreak(session.user.id);}
        else{
          console.log("session error")
        }
      

      const moodTrend = getMoodTrend(updatedHistory);
      
      const suggestionPrompt = `Based on a person feeling ${selectedMood.name.toLowerCase()} with an intensity of ${moodIntensity} out of 10, provide a short suggestion to improve or maintain their mood. Consider the trend in their mood over time: ${moodTrend}`;
      
      const affirmationPrompt = `Create a brief, powerful affirmation to boost the emotional well-being of someone feeling ${selectedMood.name.toLowerCase()} with an intensity of ${moodIntensity} out of 10. Consider their recent mood trend: ${moodTrend}`;
      
      const insightPrompt = `Provide a brief insight or reflection about the emotional state of someone feeling ${selectedMood.name.toLowerCase()} with an intensity of ${moodIntensity} out of 10, considering their recent mood trend: ${moodTrend}`;

      const [suggestionResponse, affirmationResponse, insightResponse] = await Promise.all([
        fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: suggestionPrompt }),
        }),
        fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: affirmationPrompt }),
        }),
        fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: insightPrompt }),
        })
      ]);

      if (!suggestionResponse.ok || !affirmationResponse.ok || !insightResponse.ok) 
        throw new Error('API request failed');

      const [suggestionData, affirmationData, insightData] = await Promise.all([
        suggestionResponse.json(),
        affirmationResponse.json(),
        insightResponse.json()
      ]);

      setSuggestion(suggestionData.output.trim());
      setAffirmation(affirmationData.output.trim());
      // You can use the insight data if needed
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while generating suggestions.');
    }
  };

  const getMoodTrend = (history) => {
    if (history.length < 2) return "Not enough data to determine a trend.";
    const recentMoods = history.slice(-5);
    const moodNames = recentMoods.map(entry => entry.mood.name);
    const intensities = recentMoods.map(entry => entry.intensity);
    return `Recent moods: ${moodNames.join(', ')}. Intensities: ${intensities.join(', ')}.`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-2">
            <nav aria-label="Sidebar" className="sticky top-4 divide-y divide-gray-300">
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Affirmation</Typography>
                  <Typography variant="body2">{affirmation || "Log your mood to get an affirmation"}</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Suggestion</Typography>
                  <Typography variant="body2">{suggestion || "Log your mood to get a suggestion"}</Typography>
                </CardContent>
              </Card>
            </nav>
          </div>

          {/* Main content area */}
          <main className="lg:col-span-6 xl:col-span-7">
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Mood Tracker</Typography>
                <div className="mb-6 flex justify-between items-center">
                  <Typography variant="subtitle1" color="primary">Streak: {streak} days</Typography>
                  <Typography variant="subtitle1" color="secondary">Liberty Score: {libertyScore}</Typography>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Typography variant="h6" gutterBottom>How are you feeling?</Typography>
                    <div className="flex justify-center space-x-4">
                      {moodEmojis.map((mood) => (
                        <Button
                          key={mood.name}
                          onClick={() => handleMoodSelect(mood)}
                          variant={selectedMood?.name === mood.name ? "contained" : "outlined"}
                          style={{ minWidth: '60px', height: '60px' }}
                        >
                          {mood.emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedMood && (
                    <div className="mt-6">
                      <Typography variant="h6" gutterBottom>
                        How strongly do you feel {selectedMood.name.toLowerCase()}?
                      </Typography>
                      <Slider
                        value={moodIntensity}
                        onChange={handleIntensityChange}
                        aria-labelledby="mood-intensity-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={1}
                        max={10}
                      />
                      <Typography variant="body1" align="center">{moodIntensity}/10</Typography>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={!selectedMood}
                  >
                    Log Mood
                  </Button>
                </form>
              </CardContent>
            </Card>
          </main>

          {/* Right column */}
          <aside className="hidden xl:block xl:col-span-3">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Mood History</Typography>
                  {moodHistory.slice(-5).reverse().map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{entry.mood.emoji}</span>
                      <Typography variant="body2">
                        {entry.mood.name} ({entry.intensity}/10)
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}