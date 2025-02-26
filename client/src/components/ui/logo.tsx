import { cn } from "@/lib/utils";
import Image from "@/components/ui/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src="assets/blumetra-logo.jpeg"
        alt="Blumetra Logo"
        className={cn("object-contain", sizeClasses[size])}
        priority
      />
    </div>
  );
}