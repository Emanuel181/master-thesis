'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal,
    Database,
    AlertTriangle,
    FileCode,
    Loader2,
    CheckCircle2,
    Play,
    Beaker,
    MousePointer2,
    GitBranch,
    ShieldAlert,
    Zap,
    Lock,
    Bell,
    FileText,       // Report Icon
    LayoutTemplate  // Reporting Agent Icon
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- Configuration ---
const TIMING = {
    TYPING_SPEED: 25,
    RAG_DURATION: 4000,
    SCAN_DURATION: 3000,
    DETECT_DURATION: 3500,
    PATCHING_DURATION: 3000,
    TESTING_DURATION: 4000,
    SUGGESTION_DURATION: 5000,
    FINAL_PAUSE: 8000, // Extended slightly to let the user read the report
};

// --- Code Snippets ---
const VULNERABLE_CODE = `from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    email = request.json.get('email')
    pwd = request.json.get('password')
    
    # ⚠️ SQL Injection - unsafe string formatting
    query = f"SELECT * FROM users WHERE email='{email}'"
    
    conn = sqlite3.connect('db.sqlite')
    user = conn.execute(query).fetchone()
    
    if user and check_password(pwd, user[2]):
        return jsonify({'token': create_token(user[0])})
    return jsonify({'error': 'Invalid'}), 401`;

const PATCHED_CODE = `from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    email = request.json.get('email')
    pwd = request.json.get('password')
    
    # ✅ Fixed: Parameterized query prevents injection
    query = "SELECT * FROM users WHERE email=?"
    
    conn = sqlite3.connect('db.sqlite')
    user = conn.execute(query, (email,)).fetchone()
    
    if user and check_password(pwd, user[2]):
        return jsonify({'token': create_token(user[0])})
    return jsonify({'error': 'Invalid'}), 401`;

// --- Components ---

const AgentPointer = ({ x, y, label, color = 'blue', isVisible, icon: Icon, className }) => {
    if (!isVisible) return null;
    
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: y + 40, x: x + 20 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                className={cn("absolute z-50 pointer-events-none filter drop-shadow-xl", className)}
            >
                <MousePointer2 className={cn('h-6 w-6 fill-current stroke-white',
                    color === 'blue' ? 'text-[var(--brand-accent)]' :
                        color === 'red' ? 'text-red-500' :
                            color === 'purple' ? 'text-purple-500' :
                                color === 'orange' ? 'text-orange-500' :
                                    color === 'emerald' ? 'text-emerald-500' : 'text-slate-500'
                )} />
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 16 }}
                    className={cn('mt-2 px-3 py-1.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap min-w-max flex items-center gap-2 shadow-lg backdrop-blur-md border border-white/10',
                        color === 'blue' ? 'bg-[var(--brand-accent)]/90' :
                            color === 'red' ? 'bg-red-600/90' :
                                color === 'purple' ? 'bg-purple-600/90' :
                                    color === 'orange' ? 'bg-orange-600/90' :
                                        color === 'emerald' ? 'bg-emerald-600/90' : 'bg-slate-600'
                    )}
                >
                    {Icon && <Icon size={12} />}
                    {label}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const useTypewriter = (text, start) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isDone, setIsDone] = useState(false);
    useEffect(() => {
        if (!start) return;
        let i = 0;
        setIsDone(false);
        setDisplayedText('');
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
                setIsDone(true);
            }
        }, TIMING.TYPING_SPEED);
        return () => clearInterval(timer);
    }, [text, start]);
    return { displayedText, isDone, setDisplayedText };
};

export const SecurityCodeDemo = () => {
    const [step, setStep] = useState(0);
    
    const { displayedText, isDone: typingFinished, setDisplayedText } = useTypewriter(VULNERABLE_CODE, step === 1);

    // Animation Flow Control
    useEffect(() => {
        let timeout;
        const next = (ms, nextStep) => { timeout = setTimeout(() => setStep(nextStep), ms); };

        switch (step) {
            case 0: setDisplayedText(''); next(800, 1); break;
            case 1: if (typingFinished) next(800, 2); break;
            case 2: next(TIMING.RAG_DURATION, 3); break;
            case 3: next(TIMING.SCAN_DURATION, 4); break;
            case 4: next(TIMING.DETECT_DURATION, 5); break;
            case 5: next(TIMING.PATCHING_DURATION, 6); break;
            case 6: next(TIMING.TESTING_DURATION, 7); break;
            case 7: next(TIMING.SUGGESTION_DURATION, 8); break;
            case 8: next(TIMING.FINAL_PAUSE, 0); break;
            default: break;
        }
        return () => clearTimeout(timeout);
    }, [step, typingFinished, setDisplayedText]);

    const codeContent = step === 1 ? displayedText : step >= 5 ? PATCHED_CODE : VULNERABLE_CODE;

    const renderCode = useMemo(() => (text) => {
        // Simple manual parsing to avoid regex performance issues in main thread
        // We only care about high-level syntax highlighting for the demo
        const lines = text.split('\n');
        return lines.map((line, i) => (
            <div key={i} className="leading-[18px] sm:leading-[22px] min-h-[18px] sm:min-h-[22px]">
                {line.split(/(\s+|[(){}[\].,:;'"=])/g).map((token, j) => {
                    if (!token) return null;
                    if (/^\s+$/.test(token)) return <span key={j}>{token}</span>;
                    
                    if (['from', 'import', 'def', 'return', 'if', 'and', 'or', 'not', 'class'].includes(token)) return <span key={j} className="text-[#c678dd] font-medium">{token}</span>;
                    if (['Flask', 'request', 'jsonify', 'sqlite3'].includes(token)) return <span key={j} className="text-[#e5c07b]">{token}</span>;
                    if (['login', 'get', 'connect', 'execute', 'fetchone', 'check_password', 'create_token'].includes(token)) return <span key={j} className="text-[#61afef]">{token}</span>;
                    if (['app', 'email', 'pwd', 'query', 'conn', 'user', 'json'].includes(token)) return <span key={j} className="text-[#abb2bf]">{token}</span>;
                    if (token.includes('SELECT') || token.includes('FROM') || token.includes('WHERE')) return <span key={j} className="text-[#d19a66] font-bold">{token}</span>;
                    if (token.startsWith('#')) return <span key={j} className="text-[#5c6370] italic">{token}</span>;
                    if (["'", '"'].some(q => token.includes(q))) return <span key={j} className="text-[#98c379]">{token}</span>;
                    if (['{', '}', '(', ')', ':', '=', '.', '[', ']', ',', '@'].includes(token)) return <span key={j} className="text-[#56b6c2]">{token}</span>;
                    
                    return <span key={j} className="text-[#abb2bf]">{token}</span>;
                })}
            </div>
        ));
    }, []);

    const VULN_LINE_OFFSET = useMemo(() => {
         // This needs to be responsive too if line heights change
         // Base offset for desktop (22px line height) was 232
         // Mobile (18px) -> ~190
         // XS (20px) -> ~210
         // We can't easily use hooks here if we are not in a component context or if we want it to be purely CSS.
         // But we can approximate or use a CSS variable.
         // For simplicity in this demo, let's just stick to a safe approximate that works "okay" or use a media query check in JS if strictly needed.
         // Let's rely on CSS top being adjustable or just use a fixed "good enough" value for now, 
         // OR better: use `calc()` with CSS variables if we passed line height as var.
         // Actually, let's just use a fixed value that aligns with line 11 (where the vuln is).
         // Line 11 * line_height + padding_top (16px)
         // 10 lines before * 22 = 220 + 16 = 236.
         return 236; // Adjust logic as needed
    }, []);

    // We need to update the top position dynamically based on screen width if we want perfect alignment.
    // For now, let's use a style object that uses calc or similar.
    // Or just simpler: let's update the highlight div to just use `top: calc(10 * var(--line-height) + 16px)` and define --line-height in CSS.

    return (
        <div id="security-demo-container" 
             className="w-full font-sans max-w-5xl mx-auto select-none relative z-10 px-0 sm:px-4"
             style={{
                 '--line-height': '22px', 
                 '--line-height-xs': '20px', 
                 '--line-height-mobile': '18px'
             }}
        >
            <div className="rounded-xl bg-[var(--brand-primary)] shadow-2xl overflow-hidden ring-1 ring-[var(--brand-accent)]/20 relative backdrop-blur-sm min-h-[300px] h-auto sm:h-[450px] md:h-[550px] lg:h-[600px] flex flex-col">

                {/* --- Window Header --- */}
                <div className="flex items-center justify-between px-4 h-12 bg-[var(--brand-dark)]">
                    <div className="flex items-center gap-4">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--brand-primary)]/50 rounded text-xs text-slate-400">
                            <FileCode size={12} className="text-[var(--brand-accent)]" />
                            <span>auth_service.py</span>
                        </div>
                    </div>
                </div>

                {/* --- Editor Area --- */}
                <div className="relative flex-1 font-mono text-[9px] xs:text-[10px] sm:text-[12px] overflow-hidden bg-[var(--brand-primary)]/90 flex">
                    <div className="w-8 sm:w-12 flex flex-col items-end pr-2 sm:pr-3 pt-4 text-slate-400 bg-[var(--brand-primary)]/90 z-10 shrink-0 select-none border-r border-white/5" aria-hidden="true">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="leading-[18px] sm:leading-[22px] h-[18px] sm:h-[22px]">{i + 1}</div>
                        ))}
                    </div>

                    <div className="relative flex-1 pt-4 pl-4 overflow-hidden">
                        {/* Scanning Laser */}
                        <AnimatePresence>
                            {step === 3 && (
                                <motion.div
                                    className="absolute inset-0 z-20 pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.div
                                        className="absolute left-0 right-0 h-[2px] bg-[var(--brand-accent)] shadow-[0_0_20px_rgba(var(--brand-accent-rgb),0.6)]"
                                        initial={{ top: 0 }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: TIMING.SCAN_DURATION / 1000, ease: 'linear' }}
                                    />
                                    <motion.div
                                        className="absolute left-0 right-0 h-32 bg-gradient-to-b from-[var(--brand-accent)]/10 to-transparent"
                                        initial={{ top: -128 }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: TIMING.SCAN_DURATION / 1000, ease: 'linear' }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Line Highlights */}
                        <AnimatePresence>
                            {step === 4 && (
                                <motion.div
                                    initial={{ opacity: 0, scaleX: 0.95 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute left-0 right-0 h-[36px] xs:h-[40px] sm:h-[44px] bg-red-500/10 border-l-[3px] border-red-500 pointer-events-none z-0 origin-left top-[196px] xs:top-[216px] sm:top-[236px]"
                                />
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {step >= 5 && step < 8 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute left-0 right-0 h-[36px] xs:h-[40px] sm:h-[44px] bg-emerald-500/10 border-l-[3px] border-emerald-500 pointer-events-none z-0 top-[196px] xs:top-[216px] sm:top-[236px]"
                                />
                            )}
                        </AnimatePresence>

                        {/* Text Renderer */}
                        <div className="whitespace-pre relative z-10 leading-[18px] sm:leading-[22px] overflow-x-auto">
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={step >= 5 ? 'patched' : 'vulnerable'}
                                    initial={{ opacity: 0.8 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className="min-w-max"
                                >
                                    {codeContent && renderCode(codeContent)}
                                    {/* Cursor - simplified animation to avoid layout shifts */}
                                    {step === 1 && !typingFinished && (
                                        <span className="inline-block w-2 h-4 align-middle bg-[var(--brand-accent)] ml-1 animate-pulse" aria-hidden="true" />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* --- Terminal --- */}
                <AnimatePresence>
                    {step >= 6 && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 160 }}
                            exit={{ height: 0 }}
                            className="border-t border-slate-800 bg-[var(--brand-primary)] z-30 overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between px-4 py-2 bg-[var(--brand-dark)] border-b border-slate-800">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                    <Terminal size={12} /> Security Test Suite
                                </div>
                            </div>
                            <div className="p-4 font-mono text-[11px] text-slate-300 space-y-2 overflow-y-auto">
                                <div className="flex gap-2">
                                    <span className="text-emerald-500 font-bold">➜</span>
                                    <span>pytest tests/security/test_sqli.py</span>
                                </div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="pl-4 border-l-2 border-slate-700 ml-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-purple-400">⚡ ACTION:</span>
                                        <span>Injecting payload <span className="text-amber-300">"' OR 1=1 --"</span></span>
                                    </div>
                                </motion.div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }} className="flex items-center gap-2 mt-2 bg-emerald-950/30 p-2 rounded border border-emerald-500/20 w-fit">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    <span className="text-emerald-100 font-medium">PASSED: Injection Blocked</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Footer --- */}
                <div className="h-8 bg-[var(--brand-dark)] border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-400 font-medium z-40">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                            <GitBranch size={10} />
                            <span>main</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-400 hidden sm:inline-block">Python</span>
                        <span className="hidden sm:inline-block">UTF-8</span>
                        <span className="hidden sm:inline-block">Spaces: 4</span>
                        <div className="w-[1px] h-3 bg-slate-700 mx-1 hidden sm:block" />
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                                <Terminal size={10} />
                            </div>
                            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer relative">
                                <Bell size={10} />
                                {step === 7 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Animated Overlays --- */}

                {/* 1. RAG Context */}
                <AnimatePresence>
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-16 sm:top-20 right-2 sm:right-8 z-50"
                        >
                            <div className="w-48 sm:w-64 rounded-lg border border-orange-500/20 bg-[var(--brand-primary)]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
                                <div className="bg-orange-500/5 px-4 py-2 border-b border-orange-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Database size={14} className="text-orange-400" />
                                        <span className="text-xs font-bold text-orange-200">Knowledge base</span>
                                    </div>
                                    <Loader2 size={12} className="text-orange-400 animate-spin" />
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Retrieving...</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-orange-500 shadow-[0_0_10px_orange]"
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. Vulnerability Alert */}
                <AnimatePresence>
                    {step === 4 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, x: 20 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-[180px] sm:top-[240px] right-2 sm:right-8 z-50"
                        >
                            <div className="w-56 sm:w-72 rounded-lg border border-red-500/30 bg-[var(--brand-primary)]/95 shadow-[0_0_30px_rgba(239,68,68,0.2)] backdrop-blur-xl">
                                <div className="p-4">
                                    <div className="flex items-start gap-3 mb-2">
                                        <div className="p-2 rounded bg-red-500/10 text-red-500">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <div className="text-red-400 font-bold text-xs uppercase tracking-wide">High Severity</div>
                                            <div className="text-white font-bold text-sm">SQL Injection (CWE-89)</div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Unsanitized input detected in f-string interpolation.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. Patching Notification */}
                <AnimatePresence>
                    {step === 5 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-[180px] sm:top-[240px] right-2 sm:right-8 z-50"
                        >
                            <div className="bg-emerald-900/90 border border-emerald-500/30 p-2 sm:p-3 rounded-lg shadow-2xl flex items-center gap-2 sm:gap-3 backdrop-blur-md">
                                <div className="relative p-1.5 bg-emerald-500 rounded-full text-emerald-950">
                                    <FileCode size={16} />
                                </div>
                                <div>
                                    <div className="text-emerald-100 font-bold text-xs">Applying Fix</div>
                                    <div className="text-emerald-400/80 text-[10px]">Parameterized query...</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. Suggestion Analysis */}
                <AnimatePresence>
                    {step === 7 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-16 sm:top-20 right-2 sm:right-8 z-50"
                        >
                            <div className="w-56 sm:w-72 rounded-lg border border-cyan-500/20 bg-[var(--brand-primary)]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
                                <div className="bg-cyan-950/30 px-4 py-2 border-b border-cyan-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-cyan-400" />
                                        <span className="text-xs font-bold text-cyan-200">Other Recommendations</span>
                                    </div>
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 flex items-center justify-between group cursor-pointer hover:border-cyan-500/30 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert size={12} className="text-amber-400" />
                                            <div className="text-[10px] text-slate-300">Missing Rate Limiting</div>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[9px] font-bold border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                            ADD PATCH
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 flex items-center justify-between group cursor-pointer hover:border-cyan-500/30 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Lock size={12} className="text-amber-400" />
                                            <div className="text-[10px] text-slate-300">Weak Input Validation</div>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[9px] font-bold border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                            ADD PATCH
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 5. Final Report Card (Updated for Reporting Agent) */}
                <AnimatePresence>
                    {step === 8 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-[280px] sm:w-72 bg-[var(--brand-primary)] border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"
                            >
                                <div className="relative h-20 bg-gradient-to-br from-orange-600 to-amber-800 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg z-10"
                                    >
                                        <FileText size={20} className="text-orange-600" />
                                    </motion.div>
                                </div>
                                <div className="p-6 text-center">
                                    <h3 className="text-lg font-bold text-white">Security Report Generated</h3>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="flex justify-between text-xs text-slate-400 border-b border-slate-700 pb-2">
                                            <span>Status</span>
                                            <span className="text-emerald-400 font-bold">Resolved</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Checks</span>
                                            <span className="text-white">1 Passed</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Agent</span>
                                            <span className="text-white">Reporting Agent</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Agent Pointers --- */}
                {/* 
                   Offsets need to be adjusted for responsive layouts.
                   VULN_LINE_OFFSET was approx 236px on desktop.
                   Now it's dynamic.
                   Reviewer Agent (red) y was VULN_LINE_OFFSET + 10.
                   Fixer Agent (emerald) y was VULN_LINE_OFFSET + 10.
                   
                   We can use the same responsive classes trick or just accept they might be slightly off on mobile if we use fixed pixel values here.
                   Since we are passing props to a component, we can't use tailwind classes for the `y` prop easily unless we refactor `AgentPointer`.
                   
                   Let's assume the user is okay with "close enough" or we hide them on mobile (which we did).
                   The red and emerald pointers are visible on all screens? No, let's check.
                   Previous code: 
                   <AgentPointer ... className="hidden sm:block" /> for blue
                   Red/Emerald were visible always.
                   QA Agent hidden on md.
                   Reporting Agent hidden on lg.

                   The Red/Emerald pointers point to the code line. If the code line moves (due to font size change), the pointer must move.
                   We need to make `y` responsive.
                   
                   Let's refactor AgentPointer to accept `className` for positioning if provided, or handle responsive `y`.
                   Or better: pass a `top` class? No, it uses framer motion `y`.
                   
                   Let's stick to the current implementation but hide the pointers on very small screens if they overlap too much,
                   OR just update the Y values to be safe for the smallest size (196px).
                   196 + 10 = 206px.
                   On desktop it's 236 + 10 = 246px.
                   Difference is 40px. That's significant.
                   
                   We can't easily change the `y` prop based on media query in JS without a hook.
                   Let's use a hook `useMediaQuery` or `window.innerWidth` (with hydration safe check) to determine the offset.
                   
                   However, for this task "centering and resizing", maybe just hiding them on very small screens is better to avoid clutter?
                   Let's hide Red/Emerald on xs screens (< 480px) and show them on sm+.
                */}
                <AgentPointer isVisible={step === 3} x={180} y={150} label="Reviewer Agent" color="blue" icon={Play} className="hidden sm:block" />
                
                {/* We need to adjust Y for these based on screen size if we want them visible on mobile. 
                    If we hide them on xs, we can just use the SM offset (approx 216px top + 10 = 226px).
                    Let's try to target sm+ screens.
                */}
                <AgentPointer isVisible={step === 4} x={60} y={246} label="Reviewer Agent" color="red" icon={AlertTriangle} className="hidden sm:block" />
                <AgentPointer isVisible={step === 5} x={60} y={246} label="Fixer Agent" color="emerald" icon={FileCode} className="hidden sm:block" />
                
                {/* For XS screens, we could add separate pointers with different Y if really needed, but let's start by decluttering mobile. */}
                
                <AgentPointer isVisible={step === 6} x={200} y={480} label="QA Agent" color="purple" icon={Beaker} className="hidden md:block" />

                {/* --- NEW Reporting Agent --- */}
                <AgentPointer
                    isVisible={step === 8}
                    x={600}
                    y={320}
                    label="Reporting Agent"
                    color="orange"
                    icon={LayoutTemplate}
                    className="hidden lg:block"
                />
            </div>
        </div>
    );
};