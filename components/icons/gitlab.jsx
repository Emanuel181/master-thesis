import * as React from "react";

export function GitlabIcon({
                               size = 24,
                               className,
                               ...props
                           }) {
    return (
        <svg
            role="img"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            <title>GitLab</title>
            <path d="M23.955 13.587l-1.336-4.108L19.946 1.35a.605.605 0 00-1.149 0l-2.673 8.13H7.876L5.203 1.35a.605.605 0 00-1.149 0L1.381 9.48.045 13.587a.87.87 0 00.316.978L12 23.055l11.639-8.49a.87.87 0 00.316-.978z" />
        </svg>
    );
}
