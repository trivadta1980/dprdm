import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip";

interface TooltipButtonProps extends ButtonProps {
  /**
   * The tooltip content to display
   */
  tooltip?: React.ReactNode;
  
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
  tooltipClassName?: string;
}

/**
 * A button component with an integrated tooltip
 */
export function TooltipButton({
  children,
  tooltip,
  delayDuration,
  side,
  align,
  tooltipClassName,
  ...buttonProps
}: TooltipButtonProps) {
  // If no tooltip content is provided, render a regular button
  if (!tooltip) {
    return <Button {...buttonProps}>{children}</Button>;
  }

  return (
    <EnhancedTooltip
      content={tooltip}
      delayDuration={delayDuration}
      side={side}
      align={align}
      contentClassName={tooltipClassName}
    >
      <Button {...buttonProps}>{children}</Button>
    </EnhancedTooltip>
  );
}