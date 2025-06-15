"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/solid';
import { Typography, Card, CardContent, Button, Box, CircularProgress } from '@mui/material';
import { BookOpen, Info } from 'lucide-react';
import Navbar from "../components/Mainnavnar";
import { db } from '../../firebaseconfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const lightGreen = '#e8f5e9';
const mediumGreen = '#66bb6a';
const darkGreen = '#2e7d32';

const cardStyles = {
  border: '1px solid #ddd',
  borderRadius: 8,
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  padding: '16px',
  marginBottom: '16px',
  backgroundColor: '#ffffff',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
  },
};

const buttonStyles = {
  padding: '8px 16px',
  borderRadius: 4,
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease, color 0.2s ease',
};

const transitionDuration = '0.6s';

export default function UnifiedStoryAndPlanPage() {
  const [storyData, setStoryData] = useState(null);
  const [plan, setPlan] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const planId = searchParams.get('planId');
    if (!planId) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const docRef = doc(db, 'userPlans', planId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPlan(data.plan);
          const formData = data.formData;

          if (data.story && data.info) {
            setStoryData({
              story: data.story,
              info: data.info,
              affirmation: await generateAffirmation(formData.addictions)
            });
          } else {
            const generatedContent = await generateContent(formData);
            setStoryData({
              ...generatedContent,
              affirmation: await generateAffirmation(formData.addictions)
            });

            await updateDoc(docRef, {
              story: generatedContent.story,
              info: generatedContent.info
            });
          }
        } else {
          console.log("No such document!");
          router.push('/');
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        alert('An error occurred while fetching the data.');
      }
    };

    fetchData();
  }, []);

  const generateContent = async (formData) => {
    try {
      const storyPrompt = `Create a compelling and deep story (300 words) about a fictional character overcoming ${formData.addictions} addiction and ${formData.struggles}.`;
      const infoPrompt = `Provide information about how ${formData.addictions} addiction forms, how it grows, and general solutions to combat it.`;

      const [storyResponse, infoResponse] = await Promise.all([
        fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: storyPrompt }) }),
        fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: infoPrompt }) })
      ]);

      const [storyData, infoData] = await Promise.all([
        storyResponse.json(),
        infoResponse.json()
      ]);

      const cleanText = (text) => text.replace(/[^\w\s.,!?]/g, '').trim();

      return {
        story: cleanText(storyData.output),
        info: cleanText(infoData.output)
      };
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while generating the content.');
      return { story: '', info: '' };
    }
  };

  const generateAffirmation = async (addictions) => {
    try {
      const affirmationPrompt = `Create a confidence-boosting affirmation related to overcoming ${addictions} addiction.`;
      const affirmationResponse = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: affirmationPrompt }) });
      const affirmationData = await affirmationResponse.json();
      return affirmationData.output.replace(/[^\w\s.,!?]/g, '').trim();
    } catch (error) {
      console.error('Error generating affirmation:', error);
      return "You are strong and capable of overcoming any challenge.";
    }
  };

  const nextTask = () => {
    const currentStep = plan[currentStepIndex];
    if (currentTaskIndex < currentStep.tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else if (currentStepIndex < plan.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setCurrentTaskIndex(0);
    }
  };

  const prevTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      const prevStep = plan[currentStepIndex - 1];
      setCurrentTaskIndex(prevStep.tasks.length - 1);
    }
  };

  const isFirstTask = currentStepIndex === 0 && currentTaskIndex === 0;
  const isLastTask = currentStepIndex === plan.length - 1 && 
                    currentTaskIndex === plan[currentStepIndex]?.tasks.length - 1;

  // Calculate total progress
  const getTotalProgress = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    
    plan.forEach((step, stepIndex) => {
      totalTasks += step.tasks.length;
      if (stepIndex < currentStepIndex) {
        completedTasks += step.tasks.length;
      } else if (stepIndex === currentStepIndex) {
        completedTasks += currentTaskIndex;
      }
    });
    
    return { completed: completedTasks, total: totalTasks };
  };

  if (!storyData || plan.length === 0) return (
    <Box className="flex justify-center items-center h-screen bg-gray-100">
      <CircularProgress size={64} thickness={4} style={{ color: darkGreen }} />
    </Box>
  );

  const currentStep = plan[currentStepIndex];
  const currentTask = currentStep.tasks[currentTaskIndex];
  const progress = getTotalProgress();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Box className="flex flex-col gap-6">
          {/* Daily Affirmation */}
          <Box
            sx={cardStyles}
            className="transition-all duration-[transitionDuration] ease-in-out"
          >
            <Typography variant="h5" gutterBottom align="center">
              <h5 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-pink-500">
                Daily Affirmation
              </h5>
            </Typography>
            <p className="font-normal text-gray-700 text-center">
              "{storyData.affirmation}"
            </p>
          </Box>

          {/* Your Personalized Plan */}
          <Card
            sx={cardStyles}
            className="transition-all duration-[transitionDuration] ease-in-out"
          >
            <CardContent className="flex flex-col h-full items-center justify-between">
              {/* Header */}
              <div className="mb-4 text-center">
                <Typography variant="h3" gutterBottom>
                  <h1 className='text-gray-600 text-5xl font-bold'>
                    Your Personalized Plan
                  </h1>
                </Typography>
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-3 w-80 mx-auto">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Progress: {progress.completed} of {progress.total} tasks completed
                  </p>
                </div>
              </div>

              {/* Body - Single Task Display */}
              <div className="flex justify-center w-full mb-5">
                <div className="w-3/4 max-w-3xl rounded-lg flex flex-col items-center p-8 bg-white border border-gray-300 shadow-md">
                  <div className="flex items-start mb-6 gap-3">
                    <CheckCircleIcon style={{ color: mediumGreen }} className="h-8 w-8" />
                    <Typography variant="h5" style={{ color: darkGreen }} className="text-center">
                      {`Step ${currentStepIndex + 1}: ${currentStep.title}`}
                    </Typography>
                  </div>
                  
                  {/* Current Task */}
                  <div className="text-center mb-6">
                    <Typography variant="h6" className="text-gray-700 mb-4">
                      Task {currentTaskIndex + 1} of {currentStep.tasks.length}
                    </Typography>
                    <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                      <Typography variant="body1" className="text-lg text-gray-800 leading-relaxed">
                        {currentTask}
                      </Typography>
                    </div>
                  </div>

                  {/* Task completion indicator */}
                  <div className="flex space-x-2 mb-4">
                    {currentStep.tasks.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full ${
                          index < currentTaskIndex 
                            ? 'bg-green-500' 
                            : index === currentTaskIndex 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex w-full justify-around">
                <Button
                  onClick={prevTask}
                  disabled={isFirstTask}
                  variant="contained"
                  sx={{ 
                    ...buttonStyles, 
                    backgroundColor: isFirstTask ? '#ccc' : mediumGreen, 
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: isFirstTask ? '#ccc' : darkGreen
                    }
                  }}
                >
                  Previous Task
                </Button>
                <Button
                  onClick={nextTask}
                  disabled={isLastTask}
                  variant="contained"
                  sx={{ 
                    ...buttonStyles, 
                    backgroundColor: isLastTask ? '#ccc' : mediumGreen, 
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: isLastTask ? '#ccc' : darkGreen
                    }
                  }}
                >
                  {isLastTask ? 'Completed!' : 'Next Task'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Your Inspiring Story and Understanding Your Challenge */}
          <Box className="flex justify-between gap-6">
            <Card sx={cardStyles} className="transition-all duration-[transitionDuration] ease-in-out flex-1">
              <CardContent>
                <Box className="flex items-center mb-4">
                  <BookOpen style={{ color: mediumGreen }} className="mr-2" size={24} />
                  <Typography variant="h6" style={{ color: darkGreen }}>
                    <h5 className="mb-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-600">
                      Your Inspiring Story
                    </h5>
                  </Typography>
                </Box>
                <Typography variant="body2" className='text-gray-800'>
                  {storyData.story}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={cardStyles} className="transition-all duration-[transitionDuration] ease-in-out flex-1">
              <CardContent>
                <Box className="flex items-center mb-4">
                  <Info style={{ color: mediumGreen }} className="mr-2" size={24} />
                  <Typography variant="h6" style={{ color: darkGreen }}>
                    <h5 className="mb-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-600">
                      Understanding Your Challenge
                    </h5>
                  </Typography>
                </Box>
                <Typography variant="body2" className='text-gray-800'>
                  {storyData.info}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </main>
    </div>
  );
}