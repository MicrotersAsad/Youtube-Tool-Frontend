import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { FaEnvelope, FaKey, FaEye, FaEyeSlash, FaUserCircle, FaArrowCircleRight } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext"; // Custom hook for authentication context
import Image from "next/image";
import signIn from "../public/login.svg";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Head from "next/head";
import ReCAPTCHA from "react-google-recaptcha"; // Import Google reCAPTCHA
function LoginOrResetPassword() {
  const { login, isAuthenticated,user } = useAuth(); // Assume this hook provides login method and isAuthenticated status
  const [recaptchaToken, setRecaptchaToken] = useState(""); // New state for reCAPTCHA
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [isTokenSent, setIsTokenSent] = useState(false);
  useEffect(() => {
    if (user) {
      // Redirect to the main page if user is already logged in
      router.push("/");
    }
  }, [user, router]);
  // Handle reCAPTCHA response
  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };
  const handleSubmitLogin = async (event) => {
    event.preventDefault();
    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error logging in");
      }

      login(data.token);
      localStorage.setItem("token", data.token);
      toast.success("Login successful!");
      router.push("/");
    } catch (error) {
      toast.error("Login error: " + error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetToken = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/send-reset-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error sending reset token");
      }

      setIsTokenSent(true);
      setMessage("Reset token sent to your email.");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail, token, password: resetPassword, confirmPassword: resetConfirmPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error resetting password");
      }

      setMessage("Password reset successful! You can now login.");
      setIsResettingPassword(false);
      setIsTokenSent(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Head>
  {/* SEO Meta Tags for Login Page */}
  <title>Login | Ytubetools</title>
  <meta name="description" content="Log in to Ytubetools to access your account and manage your YouTube tools. Enhance your YouTube experience with our suite of tools designed for creators and viewers alike." />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="index, follow" /> 
  {/* Canonical URL */}
  <link rel="canonical" href="https://ytubetools.com/login" />

  {/* Open Graph Meta Tags */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://ytubetools.com/login" />
  <meta property="og:title" content="Login | Ytubetools" />
  <meta property="og:description" content="Log in to Ytubetools to access your account and manage your YouTube tools. Join now to get started with exclusive features for creators and viewers." />
  <meta property="og:image" content="https://ytubetools.com/static/images/login-og-image.jpg" />
  <meta property="og:image:secure_url" content="https://ytubetools.com/static/images/login-og-image.jpg" />
  <meta property="og:site_name" content="Ytubetools" />
  <meta property="og:locale" content="en_US" />

  {/* Twitter Meta Tags */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:domain" content="ytubetools.com" />
  <meta property="twitter:url" content="https://ytubetools.com/login" />
  <meta name="twitter:title" content="Login | Ytubetools" />
  <meta name="twitter:description" content="Log in to Ytubetools and unlock features to enhance your YouTube experience. Manage your account, access tools, and more." />
  <meta name="twitter:image" content="https://ytubetools.com/static/images/login-twitter-image.jpg" />
  <meta name="twitter:site" content="@ytubetools" />
  <meta name="twitter:image:alt" content="Ytubetools Login" />
   {/* JSON-LD Schema Markup */}
   <script type="application/ld+json">
          {JSON.stringify({
            "@context": "http://schema.org",
            "@type": "WebPage",
            "name": "Login | Ytubetools",
            "description": "Log in to Ytubetools to access your account and manage your YouTube tools. Join now to get started with exclusive features for creators and viewers.",
            "url": "https://ytubetools.com/login",
          })}
        </script>
</Head>

      
      <div className="min-h-screen flex flex-col md:flex-row items-stretch">
        <ToastContainer />
        {/* Illustration Section */}
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
        {/* Form Section */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          {!isResettingPassword ? (
            <>
              <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Welcome Back!</h2>
              <p className="text-center text-gray-600 mb-6">Sign in to continue to YTubeTool.</p>
              <form onSubmit={handleSubmitLogin}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-600 mb-2">
                    <FaEnvelope className="inline-block text-red-500 mr-2" /> Email
                  </label>
                  <input
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4 relative">
                  <label htmlFor="password" className="block text-gray-600 mb-2">
                    <FaKey className="inline-block text-red-500 mr-2" /> Password
                  </label>
                  <input
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="absolute right-3 pt-4 top-10 transform -translate-y-1/2 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <ReCAPTCHA
        sitekey="6LfAPX4qAAAAAIO7NZ2OxvSL2V05TLXckrzdn_OQ"
        onChange={onRecaptchaChange}
      />
                <div className="text-right mb-4">
                  <a
                    href="#"
                    className="text-sm text-red-500 hover:underline"
                    onClick={() => setIsResettingPassword(true)}
                  >
                    Forgot Password
                  </a>
                </div>
                {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
                <button
                  type="submit"
                  className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition duration-200 w-full mb-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </button>
              </form>
              <p className="mt-4 text-center text-gray-600">
                Do not have an account? <Link href="/register" className="text-red-500 hover:underline">Create an account</Link>.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Reset Password</h2>
              {!isTokenSent ? (
                <form onSubmit={handleSendResetToken}>
                  <div className="mb-4">
                    <label htmlFor="resetEmail" className="block text-gray-600 mb-2">
                      <FaEnvelope className="inline-block text-red-500 mr-2" /> Email
                    </label>
                    <input
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      type="email"
                      id="resetEmail"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  {message && <div className="text-green-500 mb-4">{message}</div>}
                  {error && <div className="text-red-500 mb-4">{error}</div>}
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition duration-200 w-full mb-4"
                  >
                    Send Reset Token
                  </button>
                  <button
                    className="w-full text-gray-600 py-2 rounded-md hover:underline transition duration-200"
                    onClick={() => setIsResettingPassword(false)}
                  >
                    Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="mb-4 relative">
                    <label htmlFor="resetPassword" className="block text-gray-600 mb-2">
                      <FaKey className="inline-block text-red-500 mr-2" /> New Password
                    </label>
                    <input
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      type={showPassword ? "text" : "password"}
                      id="resetPassword"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                    />
                    <span
                      className="absolute right-3 pt-4 top-10 transform -translate-y-1/2 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  <div className="mb-4 relative">
                    <label htmlFor="resetConfirmPassword" className="block text-gray-600 mb-2">
                      <FaKey className="inline-block text-red-500 mr-2" /> Confirm New Password
                    </label>
                    <input
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      type={showPassword ? "text" : "password"}
                      id="resetConfirmPassword"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                    />
                    <span
                      className="absolute right-3 top-10 pt-4 transform -translate-y-1/2 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="token" className="block text-gray-600 mb-2">
                      <FaKey className="inline-block text-red-500 mr-2" /> Token
                    </label>
                    <input
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      type="text"
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                  </div>
                  {message && <div className="text-green-500 mb-4">{message}</div>}
                  {error && <div className="text-red-500 mb-4">{error}</div>}
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition duration-200 w-full mb-4"
                  >
                    Reset Password
                  </button>
                  <button
                    className="w-full text-gray-600 py-2 rounded-md hover:underline transition duration-200"
                    onClick={() => setIsResettingPassword(false)}
                  >
                    Back to Login
                  </button>
                </form>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default LoginOrResetPassword;
