import * as React from "react";
import { Input, InputProps } from "@/components/ui/input";
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface TooltipInputProps extends InputProps {
  /**
   * Label for the input
   */
  label?: string;
  
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
  
  /**
   * Additional classes to apply to the container
   */
  containerClassName?: string;
  
  /**
   * Additional classes to apply to the label
   */
  labelClassName?: string;
  
  /**
   * Whether to display the tooltip on the label (with info icon) or the input itself
   * @default "label"
   */
  tooltipTarget?: "label" | "input";
}

/**
 * An input component with an integrated tooltip
 */
export function TooltipInput({
  label,
  tooltip,
  delayDuration,
  side,
  align,
  tooltipClassName,
  containerClassName,
  labelClassName,
  tooltipTarget = "label",
  ...inputProps
}: TooltipInputProps) {
  // If no tooltip content, render a regular input with optional label
  if (!tooltip) {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && <Label className={labelClassName}>{label}</Label>}
        <Input {...inputProps} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        tooltipTarget === "label" ? (
          <div className="flex items-center gap-1">
            <Label className={labelClassName}>{label}</Label>
            <EnhancedTooltip
              content={tooltip}
              delayDuration={delayDuration}
              side={side}
              align={align}
              contentClassName={tooltipClassName}
            >
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </EnhancedTooltip>
          </div>
        ) : (
          <Label className={labelClassName}>{label}</Label>
        )
      )}
      
      {tooltipTarget === "input" ? (
        <EnhancedTooltip
          content={tooltip}
          delayDuration={delayDuration}
          side={side}
          align={align}
          contentClassName={tooltipClassName}
        >
          <Input {...inputProps} />
        </EnhancedTooltip>
      ) : (
        <Input {...inputProps} />
      )}
    </div>
  );
}