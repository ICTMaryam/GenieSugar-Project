import logoImage from "@assets/nan_1766531466891.jpg";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const textSizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoImage}
        alt="GenieSugar Logo"
        className={`${sizeMap[size]} object-contain rounded-lg`}
        data-testid="img-logo"
      />
      {showText && (
        <span className={`font-bold ${textSizeMap[size]} text-primary`} data-testid="text-logo-name">
          GenieSugar
        </span>
      )}
    </div>
  );
}
