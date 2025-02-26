import { cn } from "@/lib/utils";
import Image from "@/components/ui/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-5",  // Reduced from h-8
  md: "h-8",  // Reduced from h-12
  lg: "h-12", // Reduced from h-16
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src="/assets/blumetra-logo.jpeg"
        alt="Blumetra Logo"
        className={cn("object-contain", sizeClasses[size])}
        priority
      />
    </div>
  );
}