import React, { useState, useEffect } from "react";
import { FaArrowCircleRight, FaEnvelope, FaEye, FaEyeSlash, FaImage, FaKey, FaUser, FaUserCircle } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import { useAuth } from "../contexts/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";

function Register() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    profileImage: null,
    adminAnswer: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null); // Captcha state
  const [error, setError] = useState("");

  const reCAPTCHASiteKey="6LfAPX4qAAAAAIO7NZ2OxvSL2V05TLXckrzdn_OQ"; // Your site key

  useEffect(() => {
    if (user) {
      router.push("/"); // Redirect if logged in
    }
  }, [user, router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.size > 100 * 1024) {
      toast.error("Profile image size should be less than 100 KB");
      event.target.value = "";
      return;
    }
    setFormData((prevState) => ({
      ...prevState,
      profileImage: file,
    }));
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token); // Update the token
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!captchaToken) {
      toast.error("Please complete the reCAPTCHA!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("role", formData.role);
    formDataToSend.append("profileImage", formData.profileImage);
    formDataToSend.append("captchaToken", captchaToken); // Send reCAPTCHA token
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
      toast.success(result.message || "Registration successful! Please verify your email.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error.message || "Registration failed");
      setError(error.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch">
      <Head>
  {/* SEO Meta Tags for Register Page */}
  <title>Register | Ytubetools</title>
  <meta name="description" content="Create an account with Ytubetools to access powerful tools for enhancing your YouTube experience. Join our community of creators and viewers and unlock exclusive features tailored to your needs." />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="index, follow" /> 

  {/* Canonical URL */}
  <link rel="canonical" href="https://ytubetools.com/register" />

  {/* Open Graph Meta Tags */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://ytubetools.com/register" />
  <meta property="og:title" content="Register | Ytubetools" />
  <meta property="og:description" content="Sign up for Ytubetools and get access to a suite of YouTube tools crafted for creators and viewers. Enhance your channel’s growth and engagement with our exclusive features." />
  <meta property="og:image" content="https://ytubetools.com/static/images/register-og-image.jpg" />
  <meta property="og:image:secure_url" content="https://ytubetools.com/static/images/register-og-image.jpg" />
  <meta property="og:site_name" content="Ytubetools" />
  <meta property="og:locale" content="en_US" />

  {/* Twitter Meta Tags */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:domain" content="ytubetools.com" />
  <meta property="twitter:url" content="https://ytubetools.com/register" />
  <meta name="twitter:title" content="Register | Ytubetools" />
  <meta name="twitter:description" content="Sign up with Ytubetools for exclusive access to YouTube tools designed for creators. Manage your account, enhance your reach, and take your channel to the next level." />
  <meta name="twitter:image" content="https://ytubetools.com/static/images/register-twitter-image.jpg" />
  <meta name="twitter:site" content="@ytubetools" />
  <meta name="twitter:image:alt" content="Ytubetools registration page banner" />
</Head>

      <ToastContainer />

      {/* Left Section with Text and Features */}
      <div className="w-full md:w-1/2 bg-red-500 text-white p-8 md:p-16 flex flex-col justify-center items-start space-y-4">
  <h1 className="text-3xl md:text-5xl text-white font-bold leading-tight">
    Create YouTube Content Faster with Ytubetools Advanced AI Tool
  </h1>
  <ul className="space-y-2 md:space-y-3 text-base md:text-lg pt-4 md:pt-8">
    <li className="list-none"><FaArrowCircleRight/> 2,000 free credits every month</li>
    <li className="list-none"><FaArrowCircleRight/> 18+ tools available</li>
    <li className="list-none"><FaArrowCircleRight/> Generate engaging titles, descriptions, and more</li>
    <li className="list-none"><FaArrowCircleRight/> Super easy to use</li>
  </ul>
  <blockquote className="mt-6 md:mt-12 p-6 md:p-8 bg-red-500 rounded-md  max-w-full border border-red-300">
    <p className="italic leading-relaxed">“Ytubetools has been a game-changer for me. As a startup founder, I need to create compelling YouTube content consistently, and Ytubetools helps me do it quickly and effectively. I highly recommend Ytubetools to anyone looking to improve their YouTube presence without spending a fortune.”</p>
    <div className="mt-4 flex items-center">
     <FaUserCircle className="w-12 h-12 me-3"/>
      <div>
        <p className="font-semibold">Oskar Torres Lam</p>
        <p className="text-sm">Founder and Interior Designer, oskartorres.com</p>
      </div>
    </div>
  </blockquote>
</div>



<div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-700 mb-6 text-center">Sign Up</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-600 mb-2">Name:</label>
              <input
                className="w-full px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-600 mb-2">Email:</label>
              <input
                className="w-full px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-gray-600 mb-2">Password:</label>
              <input
                className="w-full px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-gray-600 mb-2">Confirm Password:</label>
              <input
                className="w-full px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <div>
              <label htmlFor="profileImage" className="block text-gray-600 mb-2">Profile Image:</label>
              <input
                className="w-full px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                type="file"
                id="profileImage"
                name="profileImage"
                onChange={handleFileChange}
                required
              />
            </div>

            {/* Add reCAPTCHA */}
            <div className="mt-4">
              <ReCAPTCHA
                sitekey={reCAPTCHASiteKey}
                onChange={handleCaptchaChange}
              />
            </div>

            <div className="flex justify-center mb-6">
              <button
                className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 transition duration-200 w-full"
                type="submit"
              >
                Register
              </button>
            </div>
            {error && <div className="text-red-600 text-center">{error}</div>}
          </form>
        </div>
      </div>
    </div>
   
  );
}

export default Register;
