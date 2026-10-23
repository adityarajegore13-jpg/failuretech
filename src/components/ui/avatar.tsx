import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
}

export function Avatar({
  src,
  alt = "User Avatar",
  name = "User",
  size = "md",
  isOnline,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-9.5 w-9.5 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={cn("relative inline-block select-none", className)} {...props}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold overflow-hidden border border-slate-700/80 bg-gradient-to-br from-indigo-900/60 to-slate-900 text-slate-200 shadow-inner",
          sizeClasses[size]
        )}
      >
        {src && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-slate-950",
            isOnline ? "bg-emerald-400" : "bg-slate-500"
          )}
        />
      )}
    </div>
  );
}
