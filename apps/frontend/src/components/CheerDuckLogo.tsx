import React from 'react';

interface CheerDuckLogoProps {
  className?: string;
  size?: number;
}

export const CheerDuckLogo: React.FC<CheerDuckLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <img
      src="/logo.svg"
      alt="CheerDuck Logo"
      width={size}
      height={size}
      className={`rounded-xl object-contain shrink-0 ${className}`}
    />
  );
};
