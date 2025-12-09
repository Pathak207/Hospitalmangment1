import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | "default" 
    | "primary" 
    | "gradient" 
    | "secondary" 
    | "outline" 
    | "ghost" 
    | "link" 
    | "success" 
    | "warning" 
    | "danger"
    | "glass";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  withRing?: boolean;
  withShadow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "md", 
    isLoading = false, 
    withRing = true,
    withShadow = false,
    children, 
    ...props 
  }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "primary":
          return "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500/50 shadow-primary-600/10";
        case "gradient":
          return "bg-gradient-to-br from-primary-500 to-primary-700 text-white hover:from-primary-600 hover:to-primary-800 active:from-primary-700 active:to-primary-900 focus-visible:ring-primary-500/50 shadow-primary-600/20";
        case "secondary":
          return "bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 focus-visible:ring-secondary-500/50 shadow-secondary-600/10";
        case "outline":
          return "bg-transparent border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400/50 text-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800/60 dark:active:bg-gray-700/70";
        case "ghost":
          return "bg-transparent hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400/50 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/60 dark:active:bg-gray-700/70";
        case "link":
          return "bg-transparent underline-offset-4 hover:underline text-primary-600 hover:text-primary-700 active:text-primary-800 focus-visible:ring-primary-500/50 p-0 h-auto";
        case "success":
          return "bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus-visible:ring-success-500/50 shadow-success-600/10";
        case "warning":
          return "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 focus-visible:ring-warning-400/50 shadow-warning-500/10";
        case "danger":
          return "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 focus-visible:ring-danger-500/50 shadow-danger-600/10";
        case "glass":
          return "bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-gray-900/80 active:bg-white/90 dark:active:bg-gray-900/90 focus-visible:ring-gray-400/30 shadow-white/10 dark:shadow-gray-900/10";
        default:
          return "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 focus-visible:ring-gray-500/50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200 dark:active:bg-gray-300 shadow-gray-900/10 dark:shadow-gray-200/5";
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case "xs":
          return "text-xs px-2.5 py-1 h-7 rounded-lg";
        case "sm":
          return "text-sm px-3.5 py-1.5 h-9 rounded-lg";
        case "lg":
          return "text-base px-5 py-2.5 h-12 rounded-xl";
        case "xl":
          return "text-lg px-6 py-3 h-14 rounded-xl";
        default: // md
          return "text-sm px-4 py-2 h-10 rounded-xl";
      }
    };

    return (
      <button
        className={cn(
          // Base styles
          "font-medium inline-flex items-center justify-center transition-all duration-200",
          // Focus and disabled states
          "focus-visible:outline-none",
          withRing && "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900",
          "disabled:opacity-60 disabled:pointer-events-none",
          // Add shadow if specified
          withShadow && "shadow-md",
          // Active state scale effect
          "active:scale-[0.98]",
          // Variant and size specific styles
          getVariantClasses(),
          getSizeClasses(),
          // Custom classnames
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
            <span>{children}</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

// Gradient button with animating background
const AnimatedGradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          className
        )}
        variant="gradient"
        withShadow
        {...props}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 animate-glow"></div>
        </div>
        
        {/* Content */}
        <span className="relative z-10">{children}</span>
      </Button>
    );
  }
);

AnimatedGradientButton.displayName = "AnimatedGradientButton";

Button.displayName = "Button";

export { Button, AnimatedGradientButton, type ButtonProps }; 