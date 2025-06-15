"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebaseconfig";
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ExclamationCircleIcon, UserCircleIcon } from "@heroicons/react/solid";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    bio: "",
    organization: "",
    twitter: "",
    linkedin: "",
    github: "",
    profilePicture: null,
    LibertyPoints: "",
    Streak: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const db = getFirestore();
  const storage = getStorage();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, profilePicture: file }));
  };

  const uploadImage = async () => {
    if (!formData.profilePicture) return null;

    const fileExtension = formData.profilePicture.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `profilePictures/${fileName}`);

    await uploadBytes(storageRef, formData.profilePicture);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const profilePictureUrl = await uploadImage();

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.name,
        photoURL: profilePictureUrl
      });

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        location: formData.location,
        bio: formData.bio,
        organization: formData.organization,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
        github: formData.github,
        profilePictureUrl,
        createdAt: new Date(),
        uid: user.uid,
        LibertyPoints: formData.LibertyPoints,
        Streak: formData.Streak,
      });

      router.push("/");
    } catch (error) {
      console.error(error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src="/images/logo-no-background.png" className="h-20 mx-auto mb-8" alt="Addicare" />
          <h1 className="text-4xl font-bold">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join us and start your journey</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              value={formData.bio}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="organization" className="block text-sm font-medium">Organization</label>
              <input
                id="organization"
                name="organization"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                value={formData.organization}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="twitter" className="block text-sm font-medium">Twitter</label>
              <input
                id="twitter"
                name="twitter"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                value={formData.twitter}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium">LinkedIn</label>
              <input
                id="linkedin"
                name="linkedin"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                value={formData.linkedin}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="github" className="block text-sm font-medium">GitHub</label>
              <input
                id="github"
                name="github"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                value={formData.github}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Profile Picture</label>
            <div className="mt-1 flex items-center space-x-5">
              <div className="flex-shrink-0">
                {formData.profilePicture ? (
                  <img
                    src={URL.createObjectURL(formData.profilePicture)}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-16 w-16 text-gray-300" />
                )}
              </div>
              <input
                id="profile-picture"
                name="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 cursor-pointer text-gray-500"
              />
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
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/authentication/login" className="font-medium text-gray-600 hover:text-gray-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
