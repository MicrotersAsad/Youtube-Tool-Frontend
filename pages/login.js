import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { FaEnvelope, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import ReCAPTCHA from "react-google-recaptcha";

function LoginOrResetPassword() {
  const router = useRouter();
  const [recaptchaToken, setRecaptchaToken] = useState("");
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

  const isLocalhost = typeof window !== "undefined" &&
                      (window.location.hostname === "localhost" ||
                       window.location.hostname === "127.0.0.1" ||
                       window.location.hostname === "::1");

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleSubmitLogin = async (event) => {
    event.preventDefault();

    if (!isLocalhost && !recaptchaToken) {
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
        body: JSON.stringify({ email, password, recaptchaToken: isLocalhost ? null : recaptchaToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error logging in");
      }

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
      setMessage("Reset link sent to your email.");
    } catch (error) {
      toast.error(error.message);
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
      toast.error(error.message);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>Login | Ytubetools</title>
        <meta name="description" content="Log in to Ytubetools to access your account and manage your YouTube tools." />
      </Head>

      <div className="min-h-screen flex flex-col md:flex-row items-stretch">
        <ToastContainer />
        <div className="w-full md:w-1/2 bg-red-500 text-white p-8 md:p-16 flex flex-col justify-center items-start space-y-4">
          <h1 className="text-3xl md:text-5xl text-white font-bold leading-tight">Welcome to Ytubetools</h1>
        </div>

        <div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center">
          <div className="w-full max-w-md">
            {!isResettingPassword ? (
              <>
                <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Login</h2>
                <form onSubmit={handleSubmitLogin}>
                  <div className="mb-4">
                    <label className="block text-gray-600 mb-2">Email</label>
                    <input className="w-full px-4 py-2 border rounded-md" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="mb-4 relative">
                    <label className="block text-gray-600 mb-2">Password</label>
                    <input className="w-full px-4 py-2 border rounded-md" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  <ReCAPTCHA sitekey="6LfAPX4qAAAAAIO7NZ2OxvSL2V05TLXckrzdn_OQ" onChange={onRecaptchaChange} />
                  <button type="submit" className="w-full bg-red-500 text-white px-4 py-2 rounded-md mt-4">Login</button>
                  <p className="mt-4 text-center">
                    Forgot Password?{" "}
                    <a href="#" className="text-red-500" onClick={() => setIsResettingPassword(true)}>Reset Here</a>
                  </p>
                </form>
              </>
            ) : (
              <form onSubmit={handleSendResetToken}>
                <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Reset Password</h2>
                <div className="mb-4">
                  <label className="block text-gray-600 mb-2">Email</label>
                  <input className="w-full px-4 py-2 border rounded-md" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                </div>
                <button type="submit" className="w-full bg-red-500 text-white px-4 py-2 rounded-md mt-4">Send Reset Link</button>
                <p className="mt-4 text-center">
                  Back to <a href="#" className="text-red-500" onClick={() => setIsResettingPassword(false)}>Login</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginOrResetPassword;
