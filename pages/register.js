import React, { useState, useEffect } from "react";
import { FaArrowCircleRight, FaCheckCircle, FaEnvelope, FaEye, FaEyeSlash, FaImage, FaKey, FaUser, FaUserCircle } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import ReCAPTCHA from "react-google-recaptcha";
import 'react-toastify/dist/ReactToastify.css';
import Head from "next/head";
import { useAuth } from "../contexts/AuthContext";

function Register() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // Default role is user
    profileImage: null,
    adminAnswer: "",
  });
  const [recaptchaToken, setRecaptchaToken] = useState(null); // Store reCAPTCHA token
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sitekey, setSiteKey] = useState(null);
  const [isLoading,setIsLoading]=useState(false)
  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const protocol =
          window.location.protocol === "https:" ? "https" : "http";
        const host = window.location.host;

        const response = await fetch(`${protocol}://${host}/api/extensions`);
        const result = await response.json();

        if (result.success) {
          // reCAPTCHA configuration
          const captchaExtension = result.data.find(
            (ext) => ext.key === "google_recaptcha_2" && ext.status === "Enabled"
          );
          if (captchaExtension && captchaExtension.config.siteKey) {
            setSiteKey(captchaExtension.config.siteKey);
          } else {
            console.error("ReCAPTCHA configuration not found or disabled.");
          }
        }
      } catch (error) {
        console.error("Error fetching configurations:", error);
      } finally {
        setIsLoading(false); // Data has been loaded
      }
    };

    fetchConfigs();
  }, []);
  // Check if running on localhost
  const isLocalhost = typeof window !== "undefined" && 
                      (window.location.hostname === "localhost" || 
                       window.location.hostname === "127.0.0.1" || 
                       window.location.hostname === "::1");
  useEffect(() => {
    if (user) {
      router.push("/"); // Redirect to main page if logged in
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

  const handleRecaptcha = (token) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    // Skip reCAPTCHA validation for localhost
    const captchaToken = isLocalhost ? "localhost-bypass" : recaptchaToken;

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          adminAnswer: formData.role === "admin" ? formData.adminAnswer : null,
          captchaToken,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to register");
      }
      toast.success("Registration successful! Please check your email to verify.");
      setShowVerification(true);
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error.message || "Registration failed");
      setError(error.message || "Registration failed");
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
        setShowVerification(false);
        setSuccess("Email verified successfully! You can now register.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to verify email");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      toast.error(error.message || "Verification failed");
      setError(error.message || "Verification failed");
    }
  }

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



      {/* Form Section */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center">
      
  <div className="w-full max-w-md">
    <h2 className="text-3xl md:text-4xl font-semibold text-gray-700 mb-6 text-center">Get Started for FREE</h2>

    {/* Added Section */}
    <div className="row">
    <div className="col-md-6">
      <FaCheckCircle/><span className="">100 free credit</span>
    </div>
    <div className="col-md-6">
    <FaCheckCircle/><span className="">No credit card requireds</span>
    </div>
    </div>
    {/* End of Added Section */}

          {!showVerification ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-gray-600 mb-2">
                  <FaUser className="inline-block text-red-500 mr-2" /> Name:
                </label>
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
                <label htmlFor="email" className="block text-gray-600 mb-2">
                  <FaEnvelope className="inline-block text-red-500 mr-2" /> Email:
                </label>
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
                <label htmlFor="password" className="block text-gray-600 mb-2">
                  <FaKey className="inline-block text-red-500 mr-2" /> Password:
                </label>
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
                <label htmlFor="confirmPassword" className="block text-gray-600 mb-2">
                  <FaKey className="inline-block text-red-500 mr-2" /> Confirm Password:
                </label>
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
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      name="terms"
      required
      className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
    />
    <span className="text-sm text-gray-600">
      I agree to WriterBuddy's{" "}
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-500 hover:underline"
      >
        Terms
      </a>{" "}
      and{" "}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-500 hover:underline"
      >
        Privacy Policy
      </a>.
    </span>
  </label>
</div>

              <div>
                
               
              </div>
              {!isLocalhost && sitekey && (
  <ReCAPTCHA
    sitekey={sitekey} // সঠিকভাবে `sitekey` পাঠানো
    onChange={onRecaptchaChange}
  />
)}
              <div className="flex justify-center mb-6">
                <button
                  className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 transition duration-200 w-full"
                  type="submit"
                  disabled={!isLocalhost && !recaptchaToken} // Disable button if reCAPTCHA is required but not completed
                >
                  Register
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerification} className="space-y-4">
             
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-gray-700 mb-6">
                  Check Your Email For Verify!
                </h2>
                <p className="text-gray-600 mb-4">
                We sent you an email. Please confirm your account by submit your verification code
                </p>
                <img
                  src="https://app.writerbuddy.ai/build/assets/Email-Carh2xnc.gif"
                  alt="Email Sent"
                  className="mx-auto w-64 h-auto"
                />
                 <input
                className="w-full px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <div className="flex justify-center mb-6">
                <button className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 transition duration-200 w-full" type="submit">
                  Verify Email
                </button>
              </div>
              </div>
             
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
