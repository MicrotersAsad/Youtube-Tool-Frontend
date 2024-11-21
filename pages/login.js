import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { FaEnvelope, FaKey, FaEye, FaEyeSlash, FaArrowCircleRight, FaUserCircle } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";

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
  const [isTokenSent, setIsTokenSent] = useState(false);
  const [sitekey, setSiteKey] = useState(null);
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const protocol =
          window.location.protocol === "https:" ? "https" : "http";
        const host = window.location.host;

        const response = await fetch(`${protocol}://${host}/api/extensions`);
        const result = await response.json();

        if (result.success) {
          // capctha.to configuration
          const capcthaExtension = result.data.find(
            (ext) => ext.key === "google_recaptcha_2" && ext.status === "Enabled"
          );
          if (capcthaExtension && capcthaExtension.config.appKey) {
            setSiteKey(capcthaExtension.config);
            console.log(sitekey);
            
          }

        
        }
      } catch (error) {
        console.error("Error fetching configurations:", error);
      }
    };

    fetchConfigs();
  }, []);
  // Check if running on localhost
  const isLocalhost =
    typeof window !== "undefined" &&
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
        body: JSON.stringify({
          email,
          password,
          recaptchaToken: isLocalhost ? null : recaptchaToken,
        }),
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
    } catch (error) {
      toast.error(error.message);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>Login or Reset Password | Ytubetools</title>
        <meta
          name="description"
          content="Log in to Ytubetools to access your account and manage your YouTube tools. Reset your password easily if you've forgotten it."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen flex flex-col md:flex-row items-stretch">
        <ToastContainer />
        <div className="w-full md:w-1/2 bg-red-500 text-white p-8 md:p-16 flex flex-col justify-center items-start space-y-4">
          <h1 className="text-3xl md:text-5xl text-white font-bold leading-tight">
            Create YouTube Content Faster with Ytubetools Advanced AI Tool
          </h1>
          <ul className="space-y-2 md:space-y-3 text-base md:text-lg pt-4 md:pt-8">
            <li className="list-none">
              <FaArrowCircleRight /> 2,000 free credits every month
            </li>
            <li className="list-none">
              <FaArrowCircleRight /> 18+ tools available
            </li>
            <li className="list-none">
              <FaArrowCircleRight /> Generate engaging titles, descriptions, and more
            </li>
            <li className="list-none">
              <FaArrowCircleRight /> Super easy to use
            </li>
          </ul>
        </div>

        <div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center">
          <div className="w-full max-w-md">
            {!isResettingPassword ? (
              <form onSubmit={handleSubmitLogin}>
                <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">
                  Login
                </h2>
                <div className="mb-4">
                  <label className="block text-gray-600 mb-2">Email</label>
                  <input
                    className="w-full px-4 py-2 border rounded-md"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4 relative">
                  <label className="block text-gray-600 mb-2">Password</label>
                  <input
                    className="w-full px-4 py-2 border rounded-md"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="absolute right-3 top-10 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {!isLocalhost && (
                  <ReCAPTCHA
                    sitekey={sitekey?.sitekey}
                    onChange={onRecaptchaChange}
                  />
                )}
                 <div className="text-right mb-4">
                 <p className="mt-4 text-center">
                  Forgot Password?{" "}
                  <a
                    href="#"
                    className="text-red-500"
                    onClick={() => setIsResettingPassword(true)}
                  >
                    Reset Here
                  </a>
                </p>
                  </div>
                <button
                  type="submit"
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-md mt-4"
                >
                  Login
                </button>
                <p className="mt-4 text-center text-gray-600">
                  Do not have an account? <Link href="/register" className="text-red-500 hover:underline">Create an account</Link>.
                </p>
                
              </form>
            ) : isTokenSent ? (
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-gray-700 mb-6">
                  Check Your Email!
                </h2>
                <p className="text-gray-600 mb-4">
                  A reset link has been sent to your email. Follow the instructions to reset your password.
                </p>
                <img
                  src="https://app.writerbuddy.ai/build/assets/Email-Carh2xnc.gif"
                  alt="Email Sent"
                  className="mx-auto w-64 h-auto"
                />
                <button
                  onClick={() => setIsResettingPassword(false)}
                  className="mt-6 bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetToken}>
                <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">
                  Reset Password
                </h2>
                <div className="mb-4">
                  <label className="block text-gray-600 mb-2">Email</label>
                  <input
                    className="w-full px-4 py-2 border rounded-md"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-md mt-4"
                >
                  Send Reset Link
                </button>
                <p className="mt-4 text-center">
                  Back to{" "}
                  <a
                    href="#"
                    className="text-red-500"
                    onClick={() => setIsResettingPassword(false)}
                  >
                    Login
                  </a>
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
