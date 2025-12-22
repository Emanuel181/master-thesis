'use client';

import React, { useState, useEffect } from 'react';
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
    FileText,
    ClipboardCheck,
    MousePointer2,
    Bug,
    GitBranch,
    X,
    Minus,
    Square,
    Scan
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Badge = ({ children, variant = 'default', className }) => {
    const variants = {
        default: 'bg-slate-800 text-slate-400 border-slate-700',
        blue: 'bg-[#1fb6cf]/10 text-[#1fb6cf] border-[#1fb6cf]/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    };
    return (
        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider shadow-sm', variants[variant], className)}>
            {children}
        </span>
    );
};

const AgentPointer = ({ x, y, label, color = 'blue', isVisible, icon: Icon }) => {
    if (!isVisible) return null;
    const colors = { blue: 'text-[#1fb6cf]', red: 'text-red-500', emerald: 'text-emerald-500', purple: 'text-purple-500', orange: 'text-orange-500', green: 'text-emerald-500' };
    const bgColors = { blue: 'bg-[#1fb6cf]', red: 'bg-red-600', emerald: 'bg-emerald-600', purple: 'bg-purple-600', orange: 'bg-orange-600', green: 'bg-emerald-600' };
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

// --- Timing ---
const TYPING_SPEED = 12;
const SCAN_DURATION = 2000;
const DETECT_DURATION = 2500;
const FETCH_RAG_DURATION = 3000;
const PATCHING_DURATION = 2000;
const TESTING_DURATION = 3500;
const FINAL_PAUSE = 5000;

// --- Shorter Python code that fits without scrolling ---
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
        }, TYPING_SPEED);
        return () => clearInterval(timer);
    }, [text, start]);
    return { displayedText, isDone, setDisplayedText };
};

export const SecurityCodeDemo = () => {
    const [step, setStep] = useState(0);
    const { displayedText, isDone: typingFinished, setDisplayedText } = useTypewriter(VULNERABLE_CODE, step === 1);

    // Animation flow:
    // 0: Init → 1: Typing code → 2: Scanning → 3: Vulnerability detected → 4: Fetch RAG data → 5: Patching → 6: Testing → 7: Success
    useEffect(() => {
        let timeout;
        if (step === 0) { setDisplayedText(''); timeout = setTimeout(() => setStep(1), 800); }
        if (step === 1 && typingFinished) timeout = setTimeout(() => setStep(2), 600);
        if (step === 2) timeout = setTimeout(() => setStep(3), SCAN_DURATION);
        if (step === 3) timeout = setTimeout(() => setStep(4), DETECT_DURATION);
        if (step === 4) timeout = setTimeout(() => setStep(5), FETCH_RAG_DURATION);
        if (step === 5) timeout = setTimeout(() => setStep(6), PATCHING_DURATION);
        if (step === 6) timeout = setTimeout(() => setStep(7), TESTING_DURATION);
        if (step === 7) timeout = setTimeout(() => setStep(0), FINAL_PAUSE);
        return () => { if (timeout) clearTimeout(timeout); };
    }, [step, typingFinished, setDisplayedText]);

    const codeContent = step === 1 ? displayedText : step >= 5 ? PATCHED_CODE : VULNERABLE_CODE;

    const getStatusBadge = () => {
        if (step < 2) return <Badge variant="default">IDLE</Badge>;
        if (step === 2) return <Badge variant="blue">SCANNING</Badge>;
        if (step === 3) return <Badge variant="red">VULNERABLE</Badge>;
        if (step === 4) return <Badge variant="orange">FETCHING RAG</Badge>;
        if (step === 5) return <Badge variant="green">PATCHING</Badge>;
        if (step === 6) return <Badge variant="purple">TESTING</Badge>;
        return <Badge variant="green">SECURE</Badge>;
    };

    const renderCode = (text) => {
        const parts = text.split(/([a-zA-Z_][a-zA-Z0-9_]*|[^a-zA-Z0-9_\s]+|\s+)/).filter(Boolean);
        return parts.map((chunk, i) => {
            if (['from', 'import', 'def', 'return', 'if', 'and', 'or', 'not'].includes(chunk)) return <span key={i} className="text-purple-400 font-medium">{chunk}</span>;
            if (['Flask', 'request', 'jsonify', 'sqlite3'].includes(chunk)) return <span key={i} className="text-yellow-200">{chunk}</span>;
            if (['login', 'get', 'connect', 'execute', 'fetchone', 'check_password', 'create_token'].includes(chunk)) return <span key={i} className="text-[#1fb6cf]">{chunk}</span>;
            if (['app', 'email', 'pwd', 'query', 'conn', 'user', 'json'].includes(chunk)) return <span key={i} className="text-[#e6f4f7]">{chunk}</span>;
            if (chunk.includes('SELECT') || chunk.includes('FROM') || chunk.includes('WHERE')) return <span key={i} className="text-orange-300 font-bold">{chunk}</span>;
            if (chunk.startsWith('#')) return <span key={i} className="text-[#1fb6cf]/50 italic">{chunk}</span>;
            if (['{', '}', '(', ')', ':', '=', '.', '[', ']', ',', '@', '?', "'", '"'].includes(chunk)) return <span key={i} className="text-[#1fb6cf]/60">{chunk}</span>;
            return <span key={i} className="text-[#e6f4f7]/80">{chunk}</span>;
        });
    };

    const VULN_LINE_OFFSET = 280; // Line 12

    return (
        <div className="w-full font-sans max-w-5xl mx-auto select-none relative z-10 px-2 sm:px-0">
            <div className="rounded-xl border border-[#1fb6cf]/20 bg-[#0a1c27] shadow-2xl overflow-hidden ring-2 sm:ring-4 ring-[#0e2736]/40 relative backdrop-blur-sm h-[420px] sm:h-[480px] md:h-[520px] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-2 sm:px-4 h-10 sm:h-11 border-b border-[#1fb6cf]/10 bg-[#0a1c27]">
                    <div className="flex items-center gap-4 sm:gap-16">
                        <div className="flex space-x-1.5 sm:space-x-2 group">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/20 group-hover:bg-red-500 border border-red-500/30 transition-colors"><X size={6} className="text-red-900 opacity-0 group-hover:opacity-100 m-auto mt-0.5"/></div>
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/20 group-hover:bg-amber-500 border border-amber-500/30 transition-colors"><Minus size={6} className="text-amber-900 opacity-0 group-hover:opacity-100 m-auto mt-0.5"/></div>
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 border border-emerald-500/30 transition-colors"><Square size={5} className="text-emerald-900 opacity-0 group-hover:opacity-100 fill-current m-auto mt-0.5"/></div>
                        </div>
                        <div className="h-10 sm:h-11 flex items-center">
                            <div className="px-3 sm:px-5 h-full flex items-center gap-1.5 bg-[#0e2736] border-t-2 border-[#1fb6cf] text-[#e6f4f7] text-[10px] sm:text-xs font-medium">
                                <FileCode size={12} className="text-[#1fb6cf]" />
                                <span>auth.py</span>
                            </div>
                        </div>
                    </div>
                    <div className="scale-75 sm:scale-100 origin-right">{getStatusBadge()}</div>
                </div>

                {/* Editor */}
                <div className="relative flex-1 font-mono text-[9px] sm:text-[10px] md:text-[11px] overflow-hidden bg-[#0a1c27] flex">
                    {/* Line Numbers */}
                    <div className="w-7 sm:w-10 md:w-12 flex flex-col items-end pr-2 sm:pr-3 pt-3 text-[#1fb6cf]/40 border-r border-[#1fb6cf]/10 bg-[#0a1c27] z-10 shrink-0 text-[8px] sm:text-[9px] md:text-[10px]">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="leading-[18px] sm:leading-[20px] md:leading-[22px] h-[18px] sm:h-[20px] md:h-[22px]">{i + 1}</div>
                        ))}
                    </div>

                    {/* Code Canvas */}
                    <div className="relative flex-1 pt-3 pl-2 sm:pl-3 overflow-hidden">

                        {/* Scanning animation overlay */}
                        <AnimatePresence>
                            {step === 2 && (
                                <motion.div
                                    className="absolute inset-0 z-20 pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.div
                                        className="absolute left-0 right-0 h-6 bg-gradient-to-b from-[#1fb6cf]/20 to-transparent"
                                        initial={{ top: 0 }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: 1.8, ease: 'linear' }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Vulnerable line highlight */}
                        <AnimatePresence>
                            {(step === 3 || step === 4) && (
                                <motion.div
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ top: VULN_LINE_OFFSET }}
                                    className="absolute left-0 right-0 h-[22px] bg-red-500/15 border-l-2 border-red-500 pointer-events-none z-0 origin-left"
                                />
                            )}
                        </AnimatePresence>

                        {/* Patched line highlight */}
                        <AnimatePresence>
                            {step === 5 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ top: VULN_LINE_OFFSET }}
                                    className="absolute left-0 right-0 h-[22px] bg-emerald-500/15 border-l-2 border-emerald-500 pointer-events-none z-0"
                                />
                            )}
                        </AnimatePresence>

                        {/* Code */}
                        <div className="whitespace-pre relative z-10 leading-[18px] sm:leading-[20px] md:leading-[22px] pr-2">
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={step >= 5 ? 'patched' : 'vulnerable'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {codeContent && renderCode(codeContent)}
                                    {step === 1 && !typingFinished && (
                                        <span className="inline-block w-1.5 h-3.5 align-middle bg-[#1fb6cf] animate-pulse ml-0.5 rounded-[1px]" />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Terminal - Testing */}
                <AnimatePresence>
                    {step === 6 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 100, opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-[#1fb6cf]/10 bg-[#0e2736] z-30 overflow-hidden"
                        >
                            <div className="p-2 px-3">
                                <div className="flex items-center gap-2 text-[#1fb6cf]/80 text-[9px] font-bold uppercase tracking-wider mb-2">
                                    <Terminal size={10} /> Terminal
                                </div>
                                <div className="font-mono text-[10px] text-[#e6f4f7]/60 space-y-1">
                                    <div><span className="text-emerald-500">$</span> <span className="text-[#e6f4f7]/80">pytest test_auth.py -v</span></div>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                        <span className="text-orange-400">⚡</span> Testing: <span className="text-yellow-200">{`"' OR 1=1 --"`}</span>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="flex items-center gap-1.5">
                                        <CheckCircle2 size={10} className="text-emerald-400" />
                                        <span className="text-emerald-400 font-medium">PASSED - Injection blocked</span>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status Bar */}
                <div className="h-6 bg-[#0e2736] border-t border-[#1fb6cf]/10 flex items-center justify-between px-3 text-[9px] text-[#e6f4f7]/50 font-medium select-none z-40">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1"><GitBranch size={9} /><span>main</span></div>
                        <div className="flex items-center gap-1">
                            <AlertTriangle size={9} className={step === 3 ? "text-red-500" : "text-[#1fb6cf]/40"} />
                            <span>{step === 3 ? "1 Issue" : "0 Issues"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline">Ln 12</span>
                        <div className="flex items-center gap-1 text-yellow-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                            Python
                        </div>
                    </div>
                </div>

                {/* Overlay: Vulnerability Detection */}
                <AnimatePresence>
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-14 right-4 z-30"
                        >
                            <div className="w-64 rounded-lg border border-red-500/30 bg-[#0f1117]/95 shadow-xl backdrop-blur-md overflow-hidden">
                                <div className="bg-red-500/10 px-3 py-2 border-b border-red-500/20 flex items-center gap-2">
                                    <AlertTriangle size={12} className="text-red-400" />
                                    <span className="text-[10px] font-bold text-red-300">Vulnerability Detected</span>
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500">Type</span>
                                        <span className="text-red-400 font-mono font-bold">CWE-89</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500">Severity</span>
                                        <span className="text-red-400 font-bold">Critical</span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 bg-slate-900/50 rounded p-2 mt-2">
                                        SQL Injection via f-string interpolation at line 12
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlay: Fetching RAG Data for this specific vulnerability */}
                <AnimatePresence>
                    {step === 4 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-14 right-4 z-30"
                        >
                            <div className="w-72 rounded-lg border border-orange-500/30 bg-[#0f1117]/95 shadow-xl backdrop-blur-md overflow-hidden">
                                <div className="bg-orange-500/10 px-3 py-2 border-b border-orange-500/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Database size={12} className="text-orange-400" />
                                        <span className="text-[10px] font-bold text-orange-300">Fetching Remediation Data</span>
                                    </div>
                                    <Loader2 size={10} className="text-orange-400 animate-spin" />
                                </div>
                                <div className="p-3 space-y-2 text-[9px]">
                                    <div className="text-slate-500 mb-2">Retrieving RAG context for <span className="text-orange-400 font-mono">CWE-89</span></div>
                                    <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                        <CheckCircle2 size={9} className="text-emerald-400" />
                                        <span className="text-slate-400">OWASP SQL Injection Guide</span>
                                    </motion.div>
                                    <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                                        <CheckCircle2 size={9} className="text-emerald-400" />
                                        <span className="text-slate-400">Python sqlite3 Parameterization</span>
                                    </motion.div>
                                    <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
                                        <CheckCircle2 size={9} className="text-emerald-400" />
                                        <span className="text-slate-400">Flask Security Best Practices</span>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                                            <motion.div className="h-full bg-orange-500" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 0.8, delay: 2 }} />
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlay: Patching notification */}
                <AnimatePresence>
                    {step === 5 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-14 right-4 z-30"
                        >
                            <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <div className="text-[10px]">
                                    <div className="text-emerald-100 font-semibold">Applying Fix</div>
                                    <div className="text-emerald-400/70">Parameterized query</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Final Success */}
                <AnimatePresence>
                    {step >= 7 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-72 bg-[#0f1117] border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
                            >
                                <div className="h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
                                <div className="p-5 text-center">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <ClipboardCheck size={24} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-1">Secure & Verified</h3>
                                    <p className="text-slate-400 text-[10px] mb-4">Vulnerability patched and validated</p>
                                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                                        <div className="bg-slate-900 rounded p-2 text-left">
                                            <div className="text-slate-500 mb-1 flex items-center gap-1"><Bug size={8} /> Fix</div>
                                            <div className="text-slate-200 font-medium">Applied</div>
                                        </div>
                                        <div className="bg-slate-900 rounded p-2 text-left">
                                            <div className="text-slate-500 mb-1 flex items-center gap-1"><Beaker size={8} /> Tests</div>
                                            <div className="text-emerald-400 font-medium">Passed</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Agent Pointers */}
                <AgentPointer isVisible={step === 2} x={200} y={120} label="Scanner" color="blue" icon={Scan} />
                <AgentPointer isVisible={step === 3} x={60} y={VULN_LINE_OFFSET - 30} label="Detector" color="red" icon={AlertTriangle} />
                <AgentPointer isVisible={step === 4} x={400} y={100} label="RAG Retriever" color="orange" icon={Database} />
                <AgentPointer isVisible={step === 5} x={200} y={VULN_LINE_OFFSET - 30} label="Fixer" color="emerald" icon={FileCode} />
                <AgentPointer isVisible={step === 6} x={100} y={350} label="Tester" color="purple" icon={Play} />
                <AgentPointer isVisible={step === 7} x={250} y={180} label="Reporter" color="green" icon={FileText} />
            </div>
        </div>
    );
};
