'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal,
    Database,
    Search,
    AlertTriangle,
    FileCode,
    Loader2,
    CheckCircle2,
    Play,
    Beaker,
    FileText,
    ClipboardCheck,
    MousePointer2,
    ShieldAlert,
    Bug,
    GitBranch,
    X,
    Minus,
    Square
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for Tailwind ---
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- Components ---

const Badge = ({
                   children,
                   variant = 'default',
                   className
               }) => {
    const variants = {
        default: 'bg-slate-800 text-slate-400 border-slate-700',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider shadow-sm', variants[variant], className)}>
            {children}
        </span>
    );
};

// --- Agent Pointer (unchanged logic, refined visual) ---
const AgentPointer = ({ x, y, label, color = 'blue', isVisible, icon: Icon }) => {
    if (!isVisible) return null;

    const colors = {
        blue: 'text-blue-500', red: 'text-red-500', emerald: 'text-emerald-500',
        purple: 'text-purple-500', orange: 'text-orange-500', green: 'text-emerald-500',
    };
    const bgColors = {
        blue: 'bg-blue-600', red: 'bg-red-600', emerald: 'bg-emerald-600',
        purple: 'bg-purple-600', orange: 'bg-orange-600', green: 'bg-emerald-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, x, y }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="absolute top-0 left-0 z-50 pointer-events-none filter drop-shadow-lg"
        >
            <MousePointer2 className={cn('h-5 w-5 fill-current stroke-white', colors[color])} />
            <div className={cn('ml-4 mt-1 px-2 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap flex items-center gap-1.5 shadow-lg', bgColors[color])}>
                {Icon && <Icon size={10} />}
                {label}
            </div>
        </motion.div>
    );
};

// --- Timing Constants ---
const TYPING_SPEED = 20; // Faster for better UX
const POST_TYPING_PAUSE = 1000;
const SCANNING_DURATION = 2500;
const FLAGGING_DURATION = 2500;
const FIXING_DURATION = 3000;
const TESTING_DURATION = 5000;
const REPORTING_DURATION = 5000;
const FINAL_SUCCESS_PAUSE = 8000;

// --- Mock Code ---

// This string simulates a classic SQL Injection vulnerability (CWE-89)
// where user input is directly concatenated into a query string.

const VULNERABLE_CODE_STRING = `export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  // ⚠️ SQL injection risk: string interpolation
  const query = \`SELECT id, email, password_hash FROM users WHERE email = '\${email}' LIMIT 1\`;
  const [rows] = await db.execute(query);
  const user = (rows as any[])[0];
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  return res.json({ token: signJwt({ userId: user.id }) });
}`;

const PATCHED_CODE_STRING = `export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  // ✅ Fixed: use parameterized query
  const query = 'SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1';
  const [rows] = await db.execute(query, [email]);
  const user = (rows as any[])[0];
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  return res.json({ token: signJwt({ userId: user.id }) });
}`;

// --- Internal Hook ---
const useTypewriter = (text, start) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        if (!start) return;
        let i = 0;
        let timer;
        setIsDone(false);
        setDisplayedText('');

        timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.substring(0, i + 1));
                i++;
            } else {
                if (timer) clearInterval(timer);
                setIsDone(true);
            }
        }, TYPING_SPEED);
        return () => { if (timer) clearInterval(timer); };
    }, [text, start]);
    return { displayedText, isDone, setDisplayedText };
};

export const SecurityCodeDemo = () => {
    const [step, setStep] = useState(0);
    const { displayedText, isDone: typingFinished, setDisplayedText } = useTypewriter(VULNERABLE_CODE_STRING, step === 1);

    useEffect(() => {
        let timeout;
        const runSequence = () => {
            if (step === 0) { setDisplayedText(''); timeout = setTimeout(() => setStep(1), 1000); }
            if (step === 1 && typingFinished) timeout = setTimeout(() => setStep(2), POST_TYPING_PAUSE);
            if (step === 2) timeout = setTimeout(() => setStep(3), SCANNING_DURATION);
            if (step === 3) timeout = setTimeout(() => setStep(4), FLAGGING_DURATION);
            if (step === 4) timeout = setTimeout(() => setStep(5), FIXING_DURATION);
            if (step === 5) timeout = setTimeout(() => setStep(6), TESTING_DURATION);
            if (step === 6) timeout = setTimeout(() => setStep(7), REPORTING_DURATION);
            if (step === 7) timeout = setTimeout(() => setStep(0), FINAL_SUCCESS_PAUSE);
        };
        runSequence();
        return () => { if (timeout) clearTimeout(timeout); };
    }, [step, typingFinished, setDisplayedText]);

    const codeContent = step === 1 ? displayedText : step >= 2 && step < 4 ? VULNERABLE_CODE_STRING : step >= 4 ? PATCHED_CODE_STRING : '';

    const getStatusBadge = () => {
        if (step < 2) return <Badge variant="default">IDLE</Badge>;
        if (step === 2) return <Badge variant="blue">RAG SCANNING</Badge>;
        if (step === 3) return <Badge variant="red">VULNERABLE</Badge>;
        if (step === 4) return <Badge variant="green">PATCHING</Badge>;
        if (step === 5) return <Badge variant="purple">AI TESTING</Badge>;
        return <Badge variant="green">SECURE</Badge>;
    };

    // Improved Syntax Highlighting for "Midnight Pro" Theme
    const renderCodeTokenized = (text) => {
        const parts = text.split(/([a-zA-Z0-9_]+|[^a-zA-Z0-9_\s]+|\s+)/).filter(Boolean);
        return parts.map((chunk, i) => {
            if (['export', 'async', 'function', 'const', 'return', 'if', 'await'].includes(chunk)) return <span key={i} className="text-purple-400 font-medium">{chunk}</span>;
            if (['Request', 'Response'].includes(chunk)) return <span key={i} className="text-yellow-200">{chunk}</span>;
            if (['login', 'execute', 'compare', 'signJwt', 'json', 'status'].includes(chunk)) return <span key={i} className="text-blue-300">{chunk}</span>;
            if (['db', 'bcrypt', 'req', 'res'].includes(chunk)) return <span key={i} className="text-cyan-200">{chunk}</span>;
            if (chunk.includes('SELECT') || chunk.includes('FROM') || chunk.includes('WHERE') || chunk.includes('LIMIT')) return <span key={i} className="text-orange-300 font-bold">{chunk}</span>;
            if (chunk.startsWith('//')) return <span key={i} className="text-slate-500 italic">{chunk}</span>;
            if (["'", "`", "?"].includes(chunk) || (chunk.startsWith("'") && chunk.endsWith("'"))) return <span key={i} className="text-emerald-300">{chunk}</span>;
            if (['{', '}', '(', ')', ';', '=', '.', ':', '!', '[', ']', ','].includes(chunk)) return <span key={i} className="text-slate-500">{chunk}</span>;
            return <span key={i} className="text-slate-300">{chunk}</span>;
        });
    };

    // Line 8 offset: (8 - 1) * 28px = 196px
    const VULNERABLE_ROW_TOP_OFFSET = 196;

    return (
        <div className="w-full font-sans max-w-5xl mx-auto select-none relative z-10 my-10 lg:my-0">
            {/* Main Window Container */}
            <div className="rounded-xl border border-slate-800 bg-[#0f1117] shadow-2xl overflow-hidden ring-4 ring-slate-900/40 relative backdrop-blur-sm h-[680px] flex flex-col">

                {/* 1. Header / Window Chrome */}
                <div className="flex items-center justify-between px-4 h-12 border-b border-slate-800 bg-[#0f1117]">
                    <div className="flex items-center gap-20">
                        {/* Traffic Lights */}
                        <div className="flex space-x-2 group">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 group-hover:bg-red-500 border border-red-500/30 transition-colors flex items-center justify-center"><X size={6} className="text-red-900 opacity-0 group-hover:opacity-100"/></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 group-hover:bg-amber-500 border border-amber-500/30 transition-colors flex items-center justify-center"><Minus size={6} className="text-amber-900 opacity-0 group-hover:opacity-100"/></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 border border-emerald-500/30 transition-colors flex items-center justify-center"><Square size={6} className="text-emerald-900 opacity-0 group-hover:opacity-100 fill-current"/></div>
                        </div>
                        {/* Tab */}
                        <div className="relative h-12 flex items-center">
                            <div className="px-6 h-full flex items-center gap-2 bg-[#161a23] border-t-2 border-blue-500 text-slate-200 text-xs font-medium min-w-[180px]">
                                <FileCode size={13} className="text-blue-400" />
                                <span>auth_service.ts</span>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300"><X size={12}/></div>
                            </div>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>

                {/* 2. Editor Area */}
                <div className="relative flex-1 font-mono text-[13px] overflow-hidden bg-[#0f1117] flex">

                    {/* Gutter / Line Numbers */}
                    <div className="w-16 flex flex-col items-end gap-0 pr-4 pt-6 text-slate-600 border-r border-slate-800/50 bg-[#0f1117] z-10 shrink-0">
                        {Array.from({ length: 19 }).map((_, i) => (
                            <div key={i} className="leading-[28px] h-[28px]">
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    {/* Code Canvas */}
                    <div className="relative flex-1 pt-6 pl-6">

                        {/* Floating Notification (Dynamic Island Style) */}
                        <AnimatePresence>
                            {step >= 4 && step < 6 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                    className="absolute top-0 right-10 z-40 pointer-events-none"
                                >
                                    <div className="bg-emerald-950/40 backdrop-blur-xl border border-emerald-500/30 pl-3 pr-4 py-2 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] flex items-center gap-3 rounded-full">
                                        <div className="bg-emerald-500/20 p-1.5 rounded-full">
                                            <CheckCircle2 size={14} className="text-emerald-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-emerald-100 font-semibold text-xs">Vulnerability Patched</span>
                                            <span className="text-emerald-400/70 text-[10px]">Parameterized Query Applied</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Vulnerable Highlight Box */}
                        <AnimatePresence>
                            {step === 3 && (
                                <motion.div
                                    layoutId="highlight-box"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: '100%' }}
                                    exit={{ opacity: 0 }}
                                    style={{ top: VULNERABLE_ROW_TOP_OFFSET }}
                                    className="absolute left-0 h-[28px] bg-red-500/10 border-y border-red-500/20 pointer-events-none z-0 shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]"
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500/50" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Code Text */}
                        <div className="whitespace-pre-wrap relative z-10 leading-[28px]">
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={step >= 4 ? 'patched' : 'vulnerable'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {codeContent && renderCodeTokenized(codeContent)}
                                    {step === 1 && !typingFinished && (
                                        <span className="inline-block w-2 h-4 align-middle bg-blue-500 animate-pulse ml-1 rounded-[1px]" />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* 3. Testing Terminal Panel */}
                <AnimatePresence>
                    {step === 5 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-800 bg-[#0d0f14] z-30"
                        >
                            <div className="p-1 w-full relative overflow-hidden">
                                {/* Terminal Header */}
                                <div className="flex items-center gap-2 px-4 py-2 text-purple-400/80 text-[10px] font-bold uppercase tracking-wider">
                                    <Terminal size={12} />
                                    <span>Terminal</span>
                                    <span className="text-slate-600 mx-2">|</span>
                                    <span className="text-slate-500 lowercase font-normal">zsh — 80x24</span>
                                </div>

                                {/* Content */}
                                <div className="px-4 pb-6 space-y-2 font-mono text-xs text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-500">➜</span>
                                        <span className="text-cyan-400">~/project</span>
                                        <span className="text-slate-500">$</span>
                                        <span className="text-slate-200">npm run security:audit -- --target=auth_service</span>
                                    </div>

                                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="pl-4 border-l border-slate-800 ml-1">
                                        <span className="text-blue-400">ℹ</span> Targeting: <span className="text-slate-200 underline decoration-slate-700">auth_service.ts:login</span>
                                    </motion.div>

                                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }} className="pl-4 border-l border-slate-800 ml-1">
                                        <span className="text-orange-400">⚠</span> Injecting Payload: <span className="text-yellow-200">"' OR '1'='1"</span>
                                    </motion.div>

                                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5 }} className="pl-4 border-l border-slate-800 ml-1 flex items-center gap-2">
                                        <ShieldAlert size={12} className="text-emerald-500" />
                                        <span className="text-slate-300">Response: 401 Unauthorized (Expected)</span>
                                    </motion.div>

                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.5 }} className="pl-4 pt-2 flex items-center gap-2 text-emerald-400 font-bold">
                                        <CheckCircle2 size={14} />
                                        <span>VERIFIED: Vulnerability neutralized.</span>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. Status Bar (Footer) */}
                <div className="h-7 bg-[#161a23] border-t border-slate-800 flex items-center justify-between px-3 text-[10px] text-slate-500 font-medium select-none z-40">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 hover:text-slate-300 transition-colors cursor-pointer">
                            <GitBranch size={10} />
                            <span>main</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-slate-300 transition-colors cursor-pointer">
                            <AlertTriangle size={10} className={step === 3 ? "text-red-500" : "text-slate-600"} />
                            <span>{step === 3 ? "1 Problem" : "0 Problems"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline">Ln 8, Col 42</span>
                        <span className="hidden sm:inline">UTF-8</span>
                        <div className="flex items-center gap-1.5 text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                            TypeScript
                        </div>
                    </div>
                </div>

                {/* Overlays (Scanning, Success, etc) */}

                {/* RAG Scanning Overlay */}
                <AnimatePresence>
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                            className="absolute top-16 right-6 z-20"
                        >
                            <div className="w-72 rounded-xl border border-slate-700 bg-[#0f1117]/90 shadow-2xl backdrop-blur-md overflow-hidden">
                                <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Database size={12} className="text-blue-400" />
                                        {/* RAG (Retrieval Augmented Generation) uses vector databases to find context relevant to the code */}

                                        <span className="text-[11px] font-bold text-slate-200">RAG Context Retrieval</span>
                                    </div>
                                    <Loader2 size={12} className="text-blue-400 animate-spin" />
                                </div>
                                <div className="p-3 space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                                            <span>Vector Match</span>
                                            <span className="text-blue-400">98%</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div className="h-full bg-blue-500" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: (SCANNING_DURATION / 1000) * 0.8, ease: 'easeInOut' }} />
                                        </div>
                                    </div>
                                    <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }} className="bg-red-500/10 rounded border border-red-500/20 p-2">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                                            <div className="text-[10px] leading-relaxed text-slate-300">
                                                <span className="text-red-300 font-bold">CWE-89 Detected</span>
                                                <div className="text-slate-500 mt-0.5">Unsanitized SQL interpolation.</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Final Success Overlay */}
                <AnimatePresence>
                    {step >= 6 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-[380px] bg-[#0f1117] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden relative ring-1 ring-white/10"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-white/10">
                                        <ClipboardCheck size={32} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Secure & Verified</h3>
                                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                        The SQL injection vulnerability has been patched and validated against regression tests.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 text-left hover:border-slate-700 transition-colors">
                                            <div className="text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider font-bold text-[10px]">
                                                <Bug size={10} /> Remediation
                                            </div>
                                            <div className="text-slate-200 font-medium">Auto-Patched</div>
                                        </div>
                                        <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 text-left hover:border-slate-700 transition-colors">
                                            <div className="text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider font-bold text-[10px]">
                                                <Beaker size={10} /> Tests
                                            </div>
                                            <div className="text-emerald-400 font-medium">Passed (1/1)</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Animated Cursors/Pointers */}
                <AgentPointer isVisible={step === 2} x={420} y={80} label="AI Scanner" color="blue" icon={Search} />
                <AgentPointer isVisible={step === 3} x={60} y={110} label="Linter" color="red" icon={AlertTriangle} />
                <AgentPointer isVisible={step === 4} x={280} y={150} label="Auto-Fixer" color="emerald" icon={FileCode} />
                <AgentPointer isVisible={step === 5} x={150} y={450} label="QA Runner" color="purple" icon={Play} />
                <AgentPointer isVisible={step === 6} x={350} y={250} label="Auditor" color="green" icon={FileText} />
            </div>
        </div>
    );
};