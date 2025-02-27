import { cn } from "@/lib/utils";
import Image from "@/components/ui/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "footer";
  onClick?: () => void;
}

const sizeClasses = {
  sm: "h-8",    
  md: "h-12",   
  lg: "h-16",   
  footer: "h-5", 
};

export function Logo({ className, size = "md", onClick }: LogoProps) {
  return (
    <div 
      className={cn(
        "relative flex items-center", 
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <Image
        src="/assets/blumetra-logo.jpeg"
        alt="Blumetra Logo"
        className={cn("object-contain", sizeClasses[size])}
        priority
      />
    </div>
  );
}