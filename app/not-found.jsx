import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 p-4">
        <h1 className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-neutral-300">
          Page not found
        </h2>
        <p className="text-neutral-400 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <Link href="/">
          <Button variant="outline" className="mt-4">
            Go back home
          </Button>
        </Link>
      </div>
    </div>
  );
}
