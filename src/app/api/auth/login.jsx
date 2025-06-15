"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn ,getSession } from "next-auth/react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { ExclamationCircleIcon } from "@heroicons/react/solid";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const db = getFirestore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email,
        password: password,
      });

      if (result.error) {
        setError(result.error);
      } else {
        const session = await getSession();
        if (session && session.user) {
          await updateUserStreak(session.user.id);
          router.push("/");
        } else {
          setError("User session not found after login");
        }
      }
    } catch (error) {
      setError("Login error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStreak = async (uid) => {
    const userRef = doc(db, "users", uid);
    let userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error("User document not found");
      return;
    }

    try {
      const userData = userDoc.data();
      const today = new Date();
      const lastLogin = userData.lastLogin ? new Date(userData.lastLogin) : null;
      
      let newStreak = userData.Streak || 0;
      if (lastLogin && isYesterday(lastLogin)) {
        newStreak++;
      } else if (!lastLogin || !isToday(lastLogin)) {
        newStreak = 1;
      }
      let LibertyPoints = userData.LibertyPoints || 0;
      LibertyPoints += 50; // Add 50 LibertyPoints on every login
      
      await updateDoc(userRef, {
        Streak: newStreak,
        LibertyPoints: LibertyPoints,
        lastLogin: today.toISOString()
      });

      console.log("User streak and LibertyPoints updated");
    } catch (error) {
      console.error("Error updating user streak:", error);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/logo-no-background.png" className="h-20 mx-auto mb-8" alt="Addicare" />
          <h1 className="text-4xl font-bold">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue your journey</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-gray-600 hover:text-gray-500">
                Forgot password?
              </a>
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          <div>
            <button 
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/authentication/signup" className="font-medium text-gray-600 hover:text-gray-500">
              Sign up now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
