import { useNavigate } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className = "", size = "md" }: LogoProps) => {
  const navigate = useNavigate();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <div
      onClick={() => navigate("/")}
      className={`cursor-pointer transition-transform hover:scale-105 flex items-center gap-2 ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        className={sizeClasses[size]}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circular border (blue gradient) */}
        <circle
          cx="100"
          cy="100"
          r="85"
          stroke="url(#blueGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="400 80"
          strokeDashoffset="50"
          fill="none"
        />

        {/* Bar chart bars (purple) */}
        <rect x="70" y="115" width="20" height="45" rx="3" fill="url(#purpleGradient)" />
        <rect x="100" y="95" width="20" height="65" rx="3" fill="url(#purpleGradient)" />
        <rect x="130" y="75" width="20" height="85" rx="3" fill="url(#purpleGradient)" />

        {/* Gradients */}
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(270, 75%, 65%)" />
            <stop offset="100%" stopColor="hsl(270, 75%, 55%)" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
        Vault
      </span>
    </div>
  );
};

export default Logo;
