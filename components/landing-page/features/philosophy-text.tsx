"use client";
import { PointerHighlight } from "@/components/ui/pointer-highlight";

export function PhilosophyText() {
    return (
        <div className="flex justify-center bg-slate-950 py-24 px-4">
            <div className="max-w-4xl text-center text-3xl font-bold tracking-tight md:text-5xl text-zinc-100 leading-tight">
                Vulnerability management is critical. <br/> It &apos;s time for
                <span className="ml-3 relative inline-block">
          <PointerHighlight >
             agentic intelligent defense
          </PointerHighlight>
        </span>
            </div>
        </div>
    );
}