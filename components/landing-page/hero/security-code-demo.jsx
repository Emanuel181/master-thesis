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

const AgentPointer = ({ x, y, label, color = 'blue', isVisible, icon: Icon }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: y + 40, x: x + 20 }}
                    animate={{ opacity: 1, scale: 1, x, y }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="absolute z-50 pointer-events-none filter drop-shadow-xl"
                >
                    <MousePointer2 className={cn('h-6 w-6 fill-current stroke-white',
                        color === 'blue' ? 'text-cyan-500' :
                            color === 'red' ? 'text-red-500' :
                                color === 'purple' ? 'text-purple-500' :
                                    color === 'orange' ? 'text-orange-500' :
                                        color === 'emerald' ? 'text-emerald-500' : 'text-slate-500'
                    )} />
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 16 }}
                        className={cn('mt-2 px-3 py-1.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap min-w-max flex items-center gap-2 shadow-lg backdrop-blur-md border border-white/10',
                            color === 'blue' ? 'bg-cyan-600/90' :
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
            )}
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
        const parts = text.split(/([a-zA-Z_][a-zA-Z0-9_]*|[^a-zA-Z0-9_\s]+|\s+)/).filter(Boolean);
        return parts.map((chunk, i) => {
            if (['from', 'import', 'def', 'return', 'if', 'and', 'or', 'not'].includes(chunk)) return <span key={i} className="text-[#c678dd] font-medium">{chunk}</span>;
            if (['Flask', 'request', 'jsonify', 'sqlite3'].includes(chunk)) return <span key={i} className="text-[#e5c07b]">{chunk}</span>;
            if (['login', 'get', 'connect', 'execute', 'fetchone', 'check_password', 'create_token'].includes(chunk)) return <span key={i} className="text-[#61afef]">{chunk}</span>;
            if (['app', 'email', 'pwd', 'query', 'conn', 'user', 'json'].includes(chunk)) return <span key={i} className="text-[#abb2bf]">{chunk}</span>;
            if (chunk.includes('SELECT') || chunk.includes('FROM') || chunk.includes('WHERE')) return <span key={i} className="text-[#d19a66] font-bold">{chunk}</span>;
            if (chunk.startsWith('#')) return <span key={i} className="text-[#5c6370] italic">{chunk}</span>;
            if (['{', '}', '(', ')', ':', '=', '.', '[', ']', ',', '@'].includes(chunk)) return <span key={i} className="text-[#56b6c2]">{chunk}</span>;
            if (["'", '"'].includes(chunk) || (chunk.startsWith("'") || chunk.startsWith('"'))) return <span key={i} className="text-[#98c379]">{chunk}</span>;
            return <span key={i} className="text-[#abb2bf]">{chunk}</span>;
        });
    }, []);

    const VULN_LINE_OFFSET = 232;

    return (
        <div className="w-full font-sans max-w-5xl mx-auto select-none relative z-10 p-4">
            <div className="rounded-xl bg-[#1e222a] shadow-2xl overflow-hidden ring-1 ring-white/10 relative backdrop-blur-sm h-[600px] flex flex-col">

                {/* --- Window Header --- */}
                <div className="flex items-center justify-between px-4 h-12 bg-[#21252b]">
                    <div className="flex items-center gap-4">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#282c34] rounded text-xs text-slate-400">
                            <FileCode size={12} className="text-cyan-400" />
                            <span>auth_service.py</span>
                        </div>
                    </div>
                </div>

                {/* --- Editor Area --- */}
                <div className="relative flex-1 font-mono text-[11px] sm:text-[12px] overflow-hidden bg-[#282c34] flex">
                    <div className="w-12 flex flex-col items-end pr-3 pt-4 text-slate-600 bg-[#282c34] z-10 shrink-0 select-none">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="leading-[22px] h-[22px]">{i + 1}</div>
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
                                        className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                                        initial={{ top: 0 }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: TIMING.SCAN_DURATION / 1000, ease: 'linear' }}
                                    />
                                    <motion.div
                                        className="absolute left-0 right-0 h-32 bg-gradient-to-b from-cyan-500/10 to-transparent"
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
                                    style={{ top: VULN_LINE_OFFSET }}
                                    className="absolute left-0 right-0 h-[44px] bg-red-500/10 border-l-[3px] border-red-500 pointer-events-none z-0 origin-left"
                                />
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {step >= 5 && step < 8 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ top: VULN_LINE_OFFSET }}
                                    className="absolute left-0 right-0 h-[44px] bg-emerald-500/10 border-l-[3px] border-emerald-500 pointer-events-none z-0"
                                />
                            )}
                        </AnimatePresence>

                        {/* Text Renderer */}
                        <div className="whitespace-pre relative z-10 leading-[22px]">
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={step >= 5 ? 'patched' : 'vulnerable'}
                                    initial={{ opacity: 0.8, filter: 'blur(2px)' }}
                                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {codeContent && renderCode(codeContent)}
                                    {step === 1 && !typingFinished && (
                                        <motion.span
                                            animate={{ opacity: [1, 0, 1] }}
                                            transition={{ repeat: Infinity, duration: 0.8 }}
                                            className="inline-block w-2 h-4 align-middle bg-cyan-400 ml-1"
                                        />
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
                            className="border-t border-slate-800 bg-[#1e222a] z-30 overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between px-4 py-2 bg-[#21252b] border-b border-slate-800">
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
                <div className="h-8 bg-[#21252b] border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-500 font-medium z-40">
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
                            className="absolute top-20 right-8 z-50"
                        >
                            <div className="w-64 rounded-lg border border-orange-500/20 bg-[#1e222a]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
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
                            className="absolute top-[240px] right-8 z-50"
                        >
                            <div className="w-72 rounded-lg border border-red-500/30 bg-[#1e222a]/95 shadow-[0_0_30px_rgba(239,68,68,0.2)] backdrop-blur-xl">
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
                            className="absolute top-[240px] right-8 z-50"
                        >
                            <div className="bg-emerald-900/90 border border-emerald-500/30 p-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-md">
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
                            className="absolute top-20 right-8 z-50"
                        >
                            <div className="w-72 rounded-lg border border-cyan-500/20 bg-[#1e222a]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
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
                            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-72 bg-[#1e222a] border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"
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
                <AgentPointer isVisible={step === 3} x={180} y={150} label="Reviewer Agent" color="blue" icon={Play} />
                <AgentPointer isVisible={step === 4} x={60} y={VULN_LINE_OFFSET + 10} label="Reviewer Agent" color="red" icon={AlertTriangle} />
                <AgentPointer isVisible={step === 5} x={60} y={VULN_LINE_OFFSET + 10} label="Fixer Agent" color="emerald" icon={FileCode} />
                <AgentPointer isVisible={step === 6} x={200} y={480} label="QA Agent" color="purple" icon={Beaker} />

                {/* --- NEW Reporting Agent --- */}
                <AgentPointer
                    isVisible={step === 8}
                    x={600}
                    y={320}
                    label="Reporting Agent"
                    color="orange"
                    icon={LayoutTemplate}
                />
            </div>
        </div>
    );
};