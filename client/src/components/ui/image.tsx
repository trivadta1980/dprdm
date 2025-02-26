import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
}

export default function Image({ className, priority, ...props }: ImageProps) {
  return (
    <img
      className={cn("max-w-full h-auto", className)}
      loading={priority ? "eager" : "lazy"}
      {...props}
    />
  );
}
