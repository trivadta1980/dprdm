import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EnhancedTooltipProps {
  /**
   * The content to display in the tooltip
   */
  content: React.ReactNode;
  
  /**
   * The element that triggers the tooltip
   */
  children: React.ReactNode;
  
  /**
   * How long to wait before showing the tooltip (in milliseconds)
   * @default 300
   */
  delayDuration?: number;
  
  /**
   * The side to display the tooltip
   * @default "top"
   */
  side?: "top" | "right" | "bottom" | "left";
  
  /**
   * Alignment of the tooltip
   * @default "center"
   */
  align?: "start" | "center" | "end";
  
  /**
   * Additional classes to apply to the tooltip content
   */
  contentClassName?: string;
  
  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Skip the tooltip provider (useful for nested tooltips)
   * @default false
   */
  skipProvider?: boolean;
}

/**
 * Enhanced tooltip component that provides a standardized interface for tooltips
 * throughout the application.
 */
export function EnhancedTooltip({
  content,
  children,
  delayDuration = 300,
  side = "top",
  align = "center",
  contentClassName,
  disabled = false,
  skipProvider = false,
}: EnhancedTooltipProps) {
  // If disabled, just render the children
  if (disabled || !content) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={cn("font-medium", contentClassName)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );

  // Skip provider if requested (useful for nested tooltips)
  if (skipProvider) {
    return tooltipContent;
  }

  return <TooltipProvider>{tooltipContent}</TooltipProvider>;
}

/**
 * Higher-order component that adds a tooltip to a button
 */
export function withTooltip<P extends object>(
  Component: React.ComponentType<P>,
  getTooltipContent: (props: P) => React.ReactNode,
  tooltipOptions?: Omit<EnhancedTooltipProps, "content" | "children">
) {
  return function WithTooltipComponent(props: P) {
    const content = getTooltipContent(props);
    
    return (
      <EnhancedTooltip content={content} {...tooltipOptions}>
        <Component {...props} />
      </EnhancedTooltip>
    );
  };
}