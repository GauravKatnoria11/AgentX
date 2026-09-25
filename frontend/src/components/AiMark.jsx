import React from 'react';

export default function AiMark({ size = 20, className = '', ...props }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M24 1.5L29.2 18.8L46.5 24L29.2 29.2L24 46.5L18.8 29.2L1.5 24L18.8 18.8L24 1.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
