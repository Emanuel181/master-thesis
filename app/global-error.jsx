'use client';

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center text-center space-y-4 p-4">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-neutral-400">
            A critical error occurred. Please try again later.
          </p>
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
