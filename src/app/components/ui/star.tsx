import * as React from "react";
import { cn } from "./utils";

type StarProps = React.SVGProps<SVGSVGElement> & {
  filled?: boolean;
};

function Star({ className, filled = true, ...props }: StarProps) {
  return (
    <svg
      data-slot="star"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24
           l-7.19-.61L12 2 9.19 8.63 2 9.24
           l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

export { Star };