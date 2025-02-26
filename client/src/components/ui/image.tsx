import { cn } from "@/lib/utils";
import { useState } from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
}

export default function Image({ className, priority, alt, ...props }: ImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) {
    return <div className="bg-muted flex items-center justify-center p-4">Failed to load image</div>;
  }

  return (
    <img
      className={cn(
        "max-w-full h-auto transition-opacity duration-200",
        !loaded && "opacity-0",
        loaded && "opacity-100",
        className
      )}
      loading={priority ? "eager" : "lazy"}
      alt={alt || "Image"}
      onError={() => setError(true)}
      onLoad={() => setLoaded(true)}
      {...props}
    />
  );
}