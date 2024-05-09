import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <div className="container-fluid">
      <nav id="mynav" className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand headline fs-3 ps-3">
           YoutubeTool
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 text-uppercase">
              <li className="nav-item">
                <Link href="/" className="nav-link text-white" aria-current="page">Home</Link>
              </li>
              <li className="nav-item">
                <Link href="./tools/tagExtractor" className="nav-link text-white">Services</Link>
              </li>
              <li className="nav-item">
                <Link href="#review" className="nav-link text-white">Client Say</Link>
              </li>
              <li className="nav-item">
                <Link href="#faq" className="nav-link text-white">Faq</Link>
              </li>
              <li className="nav-item">
                <Link href="#contact" className="nav-link text-white">Contact Us</Link>
              </li>
              <li className="nav-item">
                <Link href="/register" className="nav-link text-white">Registration</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
