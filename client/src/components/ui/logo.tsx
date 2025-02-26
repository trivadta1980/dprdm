import { cn } from "@/lib/utils";
import Image from "@/components/ui/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "footer";
}

const sizeClasses = {
  sm: "h-8",    // Original size
  md: "h-12",   // Original size
  lg: "h-16",   // Original size
  footer: "h-5", // Small size for footer
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