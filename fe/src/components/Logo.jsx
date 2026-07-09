import React from 'react';

export default function Logo({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="melodies-gradient-new" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id="glass-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
        </filter>
      </defs>
      
      {/* Stylized M Soundwave Icon */}
      <path d="M60 115V85M85 130V70M110 115V85M135 140V60M160 105V95" stroke="url(#melodies-gradient-new)" strokeWidth="10" strokeLinecap="round"/>
    </svg>
  );
}
