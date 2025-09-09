import React from 'react';

interface LogoHeaderProps {
  className?: string;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-b border-gray-100 ${className}`}>
      {/* Koyeb Logo */}
      <div className="flex items-center">
        <img 
          src="/logos/koyeb-logo.svg" 
          alt="Koyeb - Serverless Platform"
          className="h-6 sm:h-8 w-auto"
          loading="eager"
        />
      </div>
      
      {/* AI Engineer Paris Logo */}
      <div className="flex items-center">
        <img 
          src="/logos/ai-engineer-paris-logo.svg" 
          alt="AI Engineer Paris Conference"
          className="h-6 sm:h-8 w-auto"
          loading="eager"
        />
      </div>
    </div>
  );
};