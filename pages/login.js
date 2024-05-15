import { useRouter } from "next/router";
import React, { useState } from "react";
import { FaEnvelope, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import Image from "next/image";
import signIn from "../public/login.svg"
import Link from "next/link";
function LoginOrResetPassword() {
  const { login } = useAuth();
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
  const [message, setMessage] = useState("");

  const handleSubmitLogin = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error logging in");
      }

      login(data.token);
      localStorage.setItem("token", data.token); // Optionally store the token in localStorage
      alert("Login successful!");
      router.push("/"); // Redirect to the home page or dashboard
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail, password: resetPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error resetting password");
      }

      setMessage("Password reset successful! You can now login.");
      setIsResettingPassword(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl">
        {/* Illustration Section */}
        <div className="hidden md:block md:w-1/2">

        <Image 
                    src={signIn}
                    alt="Illustration" className="w-4/4 h-auto"
                /> 
          
        </div>
        {/* Form Section */}
        <div className="bg-white p-8 rounded-lg shadow-lg w-full md:w-1/2">
          {!isResettingPassword ? (
            <>
              <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Login</h2>
              <p className="text-center text-gray-600 mb-6">Welcome Back! Sign in to continue to YTubeTool.</p>
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
              <form onSubmit={handleForgotPassword}>
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
              
                 <div className="mb-4 relative">
                  <label htmlFor="password" className="block text-gray-600 mb-2">
                    <FaKey className="inline-block text-red-500 mr-2" /> New Password
                  </label>
                  <input
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    type={showPassword ? "text" : "password"}
                    id="password"
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
                  <label htmlFor="password" className="block text-gray-600 mb-2">
                    <FaKey className="inline-block text-red-500 mr-2" /> New Confrim Password
                  </label>
                  <input
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    type={showPassword ? "text" : "password"}
                    id="password"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginOrResetPassword;
