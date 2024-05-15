/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { FaEnvelope, FaEye, FaEyeSlash, FaImage, FaKey, FaUser } from "react-icons/fa";
import Image from "next/image";
import signup from "../public/singup.svg";

function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // Default role is user
    profileImage: null,
    adminAnswer: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.title = "Register | Youtube Tool";
    const metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content = 'Register to access exclusive features on Youtube Tool.';
    document.querySelector('head').appendChild(metaDesc);

    const ogTitle = document.createElement('meta');
    ogTitle.property = 'og:title';
    ogTitle.content = 'Register | Youtube Tool';
    document.querySelector('head').appendChild(ogTitle);

    const ogDesc = document.createElement('meta');
    ogDesc.property = 'og:description';
    ogDesc.content = 'Register to access exclusive features on Youtube Tool.';
    document.querySelector('head').appendChild(ogDesc);

    const ogUrl = document.createElement('meta');
    ogUrl.property = 'og:url';
    ogUrl.content = window.location.href;
    document.querySelector('head').appendChild(ogUrl);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    setFormData((prevState) => ({
      ...prevState,
      profileImage: event.target.files[0],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("role", formData.role);
    formDataToSend.append("profileImage", formData.profileImage);
    if (formData.role === "admin") {
      formDataToSend.append("adminAnswer", formData.adminAnswer);
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register");
      }
      const result = await response.json();
      console.log(result);
      alert("Registration successful! Please check your email to verify.");
      setShowVerification(true);
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error.message || "Registration failed");
    }
  };

  const handleVerification = async (event) => {
    event.preventDefault();
    if (!verificationCode.trim()) {
      alert("Please enter the verification code.");
      return;
    }

    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Verification successful:", data);
        alert("Email verified successfully!");
        setShowVerification(false);
        setSuccess("Email verified successfully! You can now login.");
        router.push("/login"); // Navigate to the login page
      } else {
        throw new Error(data.message || "Failed to verify email");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setError(error.message || "Verification failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-5 pb-5">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl">
        {/* Illustration Section */}
        <div className="hidden md:block md:w-1/2">
          <Image 
            src={signup}
            alt="Illustration"
            className="w-full h-auto"
          /> 
        </div>
        {/* Form Section */}
        <div className="bg-white p-8 rounded-lg shadow-lg w-full md:w-1/2">
          <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Sign Up</h2>
          {!showVerification ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-600 mb-2">
                  <FaUser className="inline-block text-red-500 mr-2" /> Name:
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-600 mb-2">
                  <FaEnvelope className="inline-block text-red-500 mr-2" /> Email:
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-4 relative">
                <label htmlFor="password" className="block text-gray-600 mb-2">
                  <FaKey className="inline-block text-red-500 mr-2" /> Password:
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  className="absolute right-3 top-10 pt-4 transform -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div className="mb-4 relative">
                <label htmlFor="confirmPassword" className="block text-gray-600 mb-2">
                  <FaKey className="inline-block text-red-500 mr-2" /> Confirm Password:
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <span
                  className="absolute right-3 top-10 pt-4 transform -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div className="mb-4">
                <label htmlFor="role" className="block text-gray-600 mb-2">Role</label>
                <select
                  id="role"
                  name="role"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {formData.role === 'admin' && (
                <div className="mb-4">
                  <label htmlFor="adminAnswer" className="block text-gray-600 mb-2">Who is the owner of YTubeTool?</label>
                  <input
                    type="text"
                    id="adminAnswer"
                    name="adminAnswer"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.adminAnswer}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              <div className="mb-6">
                <label htmlFor="profileImage" className="block text-gray-600 mb-2">
                  <FaImage className="inline-block text-red-500 mr-2" /> Profile Image:
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  onChange={handleFileChange}
                  required
                />
              </div>
              <div className="flex justify-center mb-6">
                <button className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition duration-200" type="submit">
                  Register
                </button>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Already have an account? <Link href="/login" className="text-red-500">Login</Link></p>
              </div>
              {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
            </form>
          ) : (
            <form onSubmit={handleVerification}>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Verify Email</h2>
              <input
                className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <div className="flex justify-center mb-6">
                <button className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition duration-200" type="submit">
                  Verify Email
                </button>
              </div>
              {success && <div className="alert alert-success mt-3" role="alert">{success}</div>}
              {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
