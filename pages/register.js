import Link from "next/link";
import React, { useState, useEffect } from "react";
import { FaEnvelope, FaImage, FaKey, FaUser } from "react-icons/fa";

function Register() {
  // State variables
  const [formData, setFormData] = useState({
    name: "", // Username
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: null,
  });
  const [showVerification, setShowVerification] = useState(false); // Whether to show verification form
  const [verificationCode, setVerificationCode] = useState(""); // Verification code input

  // Effect to set meta tags on component mount
  useEffect(() => {
    // Set document title for better SEO
    document.title = "Register | Youtube Tool";
    // Add meta description for better SEO
    const metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content = 'Register to access exclusive features on Youtube Tool.';
    document.querySelector('head').appendChild(metaDesc);
    // Add Open Graph meta tags for social sharing
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

  // Function to handle input change
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Function to handle file input change
  const handleFileChange = (event) => {
    setFormData((prevState) => ({
      ...prevState,
      profileImage: event.target.files[0],
    }));
  };

  // Function to handle form submission for registration
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
    formDataToSend.append("profileImage", formData.profileImage);

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register");
      }
      const result = await response.json();
      console.log(result);
      alert("Registration successful!");
      setShowVerification(true); // Show verification form
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error.message);
    }
  };

  // Function to handle email verification
  const handleVerification = async (event) => {
    event.preventDefault();
    if (!verificationCode.trim()) {
      alert("Please enter the verification code.");
      return;
    }

    try {
      // Assuming verificationCode is the token the backend expects
      const response = await fetch("http://localhost:5000/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }), // Send the token as expected by backend
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Verification successful:", data);
        alert("Email verified successfully!");
        setShowVerification(false); // Hide the verification form
        // Optionally redirect the user or perform further actions
      } else {
        throw new Error(data.message || "Failed to verify email");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      alert(error.message || "Verification failed");
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div
        className="card p-4 shadow"
        style={{ width: "90%", maxWidth: "600px", border: "1px solid #ccc" }}
      >
        <h1 className="text-center">Register</h1>
        {!showVerification ? (
          <form className="" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">
                <FaUser className="me-2 fs-5 text-danger" />
                Name:
              </label>
              <input
                className="form-control"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email">
                <FaEnvelope className="me-2 fs-5 text-danger" />
                Email:
              </label>
              <input
                className="form-control"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password">
                <FaKey className="me-2 fs-5 text-danger" />
                Password:
              </label>
              <input
                className="form-control"
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword">
                <FaKey className="me-2 fs-5 text-danger" />
                Confirm Password:
              </label>
              <input
                className="form-control"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="profileImage">
                <FaImage className="me-2 fs-5 text-danger" />
                Profile Image:
              </label>
              <input
                className="form-control"
                type="file"
                id="profileImage"
                name="profileImage"
                onChange={handleFileChange}
              />
            </div>
            <div className="mt-3">
              <button className="btn btn btn-danger" type="submit">Register</button>
            </div>
            <div className="mt-3">
              <h6>
                If You Are Registered, Please <Link className="text-danger fw-bold" href="/login">Login</Link>
              </h6>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerification}>
            <h2>Verify Email</h2>
            <input
              className="form-control"
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <div className="mt-3">
              <button className="btn btn btn-danger" type="submit">Verify Email</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Register;
