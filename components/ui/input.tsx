import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightIcon, type, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {label && (
          <label 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
              "!text-gray-900 dark:!text-gray-100",
              "dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-primary-500 dark:focus-visible:border-primary-500",
              "selection:bg-primary-500/20 selection:text-gray-900 dark:selection:text-gray-100",
              "[color-scheme:light] dark:[color-scheme:dark]",
              icon && "pl-10",
              rightIcon && "pr-10",
              error && "border-danger-500 focus-visible:ring-danger-500 focus-visible:border-danger-500 dark:border-danger-500 dark:focus-visible:ring-danger-500 dark:focus-visible:border-danger-500",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, type InputProps }; 