import * as React from "react";

export function SecurityScanTwotoneIcon({
  size = 32,
  color = "currentColor",
  strokeWidth = 2.5,
  className,
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}>
      <path d="M12 2L3.5 6v6c0 5.55 3.84 10.74 8.5 12 4.66-1.26 8.5-6.45 8.5-12V6L12 2z" />
      <path d="M12 2L3.5 6v6c0 5.55 3.84 10.74 8.5 12 4.66-1.26 8.5-6.45 8.5-12V6L12 2z" fillOpacity=".15" />
      <path d="M12 5a3 3 0 0 1 3 3c0 1.3-.84 2.4-2 2.83V12h-2v-1.17C9.84 10.4 9 9.3 9 8a3 3 0 0 1 3-3zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
    </svg>
  );
}
