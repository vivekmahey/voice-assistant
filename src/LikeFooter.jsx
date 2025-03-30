import React from "react";
import "./LikeFooter.css";

const logos = [
  { id: 1, src: "../src/assets/logo1.avif", alt: "Logo 1" },
  { id: 2, src: "../src/assets/logo2.avif", alt: "Logo 2" },
  { id: 3, src: "../src/assets/logo3.avif", alt: "Logo 3" },
  { id: 4, src: "../src/assets/logo3.png", alt: "Logo 4" },
];

const LikeFooter = () => {
  return (
    <div className="like-footer">
      <h2 className="like-footer-title">Brands who trust me</h2>
      <p className="like-footer-subtitle">
        I work with a diverse range of clients, spanning from globally renowned
        entities with millions of users to innovative startups.
      </p>

      {/* 🎥 Row 1 - Right to Left */}
      <div className="logo-wrapper">
        <div className="logo-container marquee">
          {logos.map((logo) => (
            <div key={logo.id} className="logo-item">
              <img src={logo.src} alt={logo.alt} />
            </div>
          ))}
          {/* ✅ Duplicate for Smooth Loop */}
          {logos.map((logo) => (
            <div key={`dup-${logo.id}`} className="logo-item">
              <img src={logo.src} alt={logo.alt} />
            </div>
          ))}
        </div>
      </div>

      {/* 🎥 Row 2 - Left to Right */}
      <div className="logo-wrapper">
        <div className="logo-container marquee reverse">
          {logos.map((logo) => (
            <div key={logo.id} className="logo-item">
              <img src={logo.src} alt={logo.alt} />
            </div>
          ))}
          {/* ✅ Duplicate for Smooth Loop */}
          {logos.map((logo) => (
            <div key={`dup-${logo.id}`} className="logo-item">
              <img src={logo.src} alt={logo.alt} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LikeFooter;
