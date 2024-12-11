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
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false); // Track if verifying the code

  useEffect(() => {
    const fetchConfigs = async () => {
      setIsLoading(true);
      try {
        const protocol = window.location.protocol === "https:" ? "https" : "http";
        const host = window.location.host;
        const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Assuming token is stored in localStorage
        
        if (!token) {
          console.error('No authentication token found!');
          return;
        }

        const response = await fetch(`${protocol}://${host}/api/extensions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const captchaExtension = result.data.find(
            (ext) => ext.key === "google_recaptcha_2" && ext.status === "Enabled"
          );

          if (captchaExtension?.config?.siteKey) {
            setSiteKey(captchaExtension.config.siteKey);
          } else {
            console.error("ReCAPTCHA configuration not found or disabled.");
            setError("ReCAPTCHA configuration is missing or disabled.");
          }
        } else {
          console.error('Error fetching extensions:', result.message || 'Unknown error');
          setError(result.message || "Error fetching extensions");
        }
      } catch (error) {
        console.error("Error fetching configurations:", error);
        setError(error.message || "Error fetching configurations");
      } finally {
        setIsLoading(false);
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

      // Navigate to the homepage
      router.push("/");

      // Once the page is loaded, reload it to update the login status
      router.events.on('routeChangeComplete', () => {
        window.location.reload(); // Reload the page after navigating
      });

    } catch (error) {
      toast.error("Login error: " + error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerificationEmail = async (event) => {
    event.preventDefault();
    setError("");
    setIsResendingVerification(true);

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error resending verification email");
      }

      setVerificationEmailSent(true);
      toast.success("A new verification email has been sent!");

      // Show the verification code input
      setIsVerifyingCode(true);

    } catch (error) {
      toast.error(error.message);
      setError(error.message);
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleVerification = async (event) => {
    event.preventDefault();
    if (!verificationCode.trim()) {
      toast.error("Please enter the verification code.");
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
        toast.success("Email verified successfully!");
        setVerificationEmailSent(false);

        // Log the user in after successful verification
        await handleSubmitLogin(event);  // This will login and redirect to the homepage

      } else {
        throw new Error(data.message || "Failed to verify email");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      toast.error(error.message || "Verification failed");
      setError(error.message || "Verification failed");
    }
  };

  const handleSendResetToken = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/reset-password", {
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
      toast.success("A reset link has been sent to your email!");
    } catch (error) {
      toast.error(error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
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
              <>
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Login</h2>
                <form onSubmit={handleSubmitLogin}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {!isLocalhost && sitekey && (
  <ReCAPTCHA
    sitekey={sitekey} 
    onChange={onRecaptchaChange}
  />
)}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-500 text-white py-2 rounded-md"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Log In"}
                  </button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                  Do not have an account? <Link href="/register" className="text-red-500 hover:underline">Create an account</Link>.
                </p>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setIsResettingPassword(true)}
                    className="text-red-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Resend Verification Email */}
                <div className="mt-4 text-center">
                  <button
                    onClick={handleResendVerificationEmail}
                    className="text-blue-600 hover:underline"
                    disabled={isResendingVerification}
                  >
                    {isResendingVerification ? "Resending..." : "Resend Verification Email"}
                  </button>
                </div>

                {verificationEmailSent && (
                  <div className="mt-4 text-center text-green-600">
                    A verification email has been sent. Please check your inbox.
                  </div>
                )}

                {isVerifyingCode && (
                  <form onSubmit={handleVerification} className="mt-6">
                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                      Enter Verification Code
                    </label>
                    <input
                      type="text"
                      id="verificationCode"
                      name="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-red-500 text-white py-2 rounded-md mt-4"
                    >
                      Verify Email
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Reset Your Password</h2>
                <form onSubmit={handleSendResetToken}>
                  <div className="mb-4">
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="reset-email"
                      name="reset-email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-500 text-white py-2 rounded-md"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                {isTokenSent && (
                  <div className="mt-4 text-center text-green-600">
                    A reset link has been sent to your email.
                  </div>
                )}

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setIsResettingPassword(false)}
                    className="text-blue-600 hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginOrResetPassword;
