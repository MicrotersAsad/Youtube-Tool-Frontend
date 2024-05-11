import { useRouter } from "next/router";
import React, { useState } from "react";
import { FaEnvelope, FaKey } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import login from "../public/login.svg"
import Image from "next/image";
// import { useAuth } from "../contexts/AuthContext"; // Adjust this path to where your AuthContext is located

function Login() {
    const { login } = useAuth(); // This hook must be defined in your AuthContext
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Simulate a login API call or replace this with your actual login logic
            const response = await fetch("http://localhost:5000/login", {
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

            login(data.token); // Assuming your login function expects a token and updates context
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

    return (
      <div className="container"> 
 <div className="row"> 
 <div className="col-md-6"> 
 <Image
      src="../public/login.svg"
      width={500}
      height={500}
      alt="Picture of the author"
    />
 </div>
 <div className="col-md-6"> 
 
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div className="card p-4 shadow" style={{ width: "90%", maxWidth: "400px" }}>
                <h2 className="text-center mb-3">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            <FaEnvelope className="me-2 fs-5 text-primary" /> Email
                        </label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                            <FaKey className="me-2 fs-5 text-primary" /> Password
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Log In"}
                    </button>
                </form>
            </div>
        </div>
        </div>
        </div>
        </div>
        
    );
    
}

export default Login;
