import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black text-white relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Gradient orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 p-6 max-w-lg mx-auto">
        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-[10rem] sm:text-[12rem] font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-300 to-zinc-600 select-none">
            404
          </h1>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Message */}
        <div className="space-y-3 -mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            This page doesn't exist
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-sm">
            The page you're looking for may have been moved, deleted, or never existed in the first place.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => typeof window !== 'undefined' && window.history.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mt-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}
