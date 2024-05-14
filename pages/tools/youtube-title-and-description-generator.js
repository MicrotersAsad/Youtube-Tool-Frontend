/* eslint-disable react/no-unescaped-entities */
import React from "react";
import TitleGenerator from "./Titlegenerator";
import DescriptionGenerator from "./DescriptionGenerator";

const TitleDescription = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h3 className="pt-5 text-3xl text-center p-5">YouTube Title and Description Generator</h3>
      



 
      <ul className="nav nav-pills mb-3 border rounded" id="pills-tab" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className="nav-link active"
            id="pills-home-tab"
            data-bs-toggle="pill"
            data-bs-target="#pills-home"
            type="button"
            role="tab"
            aria-controls="pills-home"
            aria-selected="true"
          >
            YouTube Title Generator
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            id="pills-profile-tab"
            data-bs-toggle="pill"
            data-bs-target="#pills-profile"
            type="button"
            role="tab"
            aria-controls="pills-profile"
            aria-selected="false"
          >
           YouTube Description Generator
          </button>
        </li>
        
      </ul>
    
      <div className="tab-content" id="pills-tabContent">
        <div
          className="tab-pane fade show active"
          id="pills-home"
          role="tabpanel"
          aria-labelledby="pills-home-tab"
        >
          
           <TitleGenerator/>

          
        </div>
        <div
          className="tab-pane fade"
          id="pills-profile"
          role="tabpanel"
          aria-labelledby="pills-profile-tab"
        >
         <DescriptionGenerator/>
        </div>
       
      </div>
    </div>
  );
};

export default TitleDescription;
