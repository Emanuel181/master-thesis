'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Database, Search, AlertTriangle, FileCode, Loader2,
    CheckCircle2, Play, Beaker, FileText, ClipboardCheck, Check
} from 'lucide-react';
import { Badge } from '@/components/landing-page/badge';
import { AgentPointer } from '@/components/landing-page/agent-pointer';

// --- Constants ---
const TYPING_SPEED = 50;
const POST_TYPING_PAUSE = 2500;
const SCANNING_DURATION = 5000;
const FLAGGING_DURATION = 4000;
const FIXING_DURATION = 4000;
const TESTING_DURATION = 5000;
const REPORTING_DURATION = 6000;
const FINAL_SUCCESS_PAUSE = 3000;

const VULNERABLE_CODE_STRING = `async function login(req, res) {
  const { user, pass } = req.body;
  // ⚠️ TODO: Check security docs...
  const query = \`SELECT * FROM users WHERE user = '\${user}'\`;
  return await db.execute(query);
}`;

// --- Internal Hook ---
const useTypewriter = (text: string, start: boolean) => {
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
    const { displayedText, isDone: typingFinished, setDisplayedText } = useTypewriter(VULNERABLE_CODE_STRING, step === 1);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const runSequence = async () => {
            if (step === 0) {
                setDisplayedText('');
                timeout = setTimeout(() => setStep(1), 1000);
            }
            if (step === 1 && typingFinished) timeout = setTimeout(() => setStep(2), POST_TYPING_PAUSE);
            if (step === 2) timeout = setTimeout(() => setStep(3), SCANNING_DURATION);
            if (step === 3) timeout = setTimeout(() => setStep(4), FLAGGING_DURATION);
            if (step === 4) timeout = setTimeout(() => setStep(5), FIXING_DURATION);
            if (step === 5) timeout = setTimeout(() => setStep(6), TESTING_DURATION);
            if (step === 6) timeout = setTimeout(() => setStep(7), REPORTING_DURATION);
            if (step === 7) timeout = setTimeout(() => setStep(0), FINAL_SUCCESS_PAUSE);
        };
        runSequence();
        return () => clearTimeout(timeout);
    }, [step, typingFinished, setDisplayedText]);

    const codeContent = step === 1 ? displayedText : VULNERABLE_CODE_STRING;

    const getStatusBadge = () => {
        if (step < 2) return <Badge variant="default">IDLE</Badge>;
        if (step === 2) return <Badge variant="blue">RAG SCANNING</Badge>;
        if (step === 3) return <Badge variant="red">VULNERABLE</Badge>;
        if (step === 4) return <Badge variant="green">PATCHING</Badge>;
        if (step === 5) return <Badge variant="purple">AI TESTING</Badge>;
        if (step >= 6) return <Badge variant="green">SECURE & VERIFIED</Badge>;
    };

    return (
        <div className="w-full font-sans max-w-4xl mx-auto select-none relative z-10 my-8 lg:my-0">
            <div className="rounded-xl border border-zinc-800 bg-[#09090b]/80 shadow-2xl overflow-hidden ring-1 ring-white/10 relative backdrop-blur-md h-[550px]">

                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium font-mono">
                        <FileCode size={14} className="text-blue-500/80" />
                        <span>auth_service.ts</span>
                        {step >= 4 && <span className="text-emerald-500/80 transition-opacity"> — Fixed</span>}
                    </div>
                    {getStatusBadge()}
                </div>

                {/* Editor Body */}
                <div className="relative p-6 h-full bg-[#09090b]/40 font-mono text-sm leading-7 text-zinc-300 overflow-hidden">
                    <div className="absolute left-0 top-6 bottom-0 w-12 flex flex-col items-end gap-0 pr-4 text-zinc-800 text-xs border-r border-zinc-800/30 font-mono select-none">
                        {Array.from({length: 15}).map((_, i) => <div key={i} className="leading-7">{i+1}</div>)}
                    </div>

                    <div className="pl-10 relative h-full">
                        {step < 4 && (
                            <div className="whitespace-pre-wrap">
                                {codeContent.split(/(\s+)/).map((chunk, i) => {
                                    if (['async', 'function', 'const', 'return', 'await'].includes(chunk))
                                        return <span key={i} className="text-purple-400">{chunk}</span>;
                                    if (['login', 'execute'].includes(chunk))
                                        return <span key={i} className="text-blue-400">{chunk}</span>;
                                    if (chunk.includes('SELECT'))
                                        return <span key={i} className="text-orange-300">{chunk}</span>;
                                    if (chunk.includes('//'))
                                        return <span key={i} className="text-zinc-500 italic">{chunk}</span>;
                                    return <span key={i}>{chunk}</span>;
                                })}
                                {step === 1 && !typingFinished && (
                                    <span className="inline-block w-2 h-5 align-middle bg-blue-500 animate-pulse ml-1" />
                                )}
                            </div>
                        )}

                        {step >= 4 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <span className="text-purple-400">async function</span> <span className="text-blue-400">login</span>(req, res) {'{'}
                                {'\n'}
                                {'  '}<span className="text-purple-400">const</span> {'{'} user, pass {'}'} = req.body;
                                {'\n'}
                                <motion.div
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="bg-emerald-950/30 -mx-4 px-4 py-2 my-2 border-l-2 border-emerald-500/50 rounded-r-md"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                        <span className="text-emerald-400/90 font-bold text-[11px] tracking-wider uppercase">RAG Patch Applied (OWASP A03:2021)</span>
                                    </div>
                                    {'  '}<span className="text-purple-400">const</span> query = <span className="text-emerald-200">&quot;SELECT * FROM users WHERE user = ?&quot;</span>;
                                </motion.div>
                                {'  '}<span className="text-purple-400">return</span> <span className="text-blue-400">await</span> db.execute(query, [user]);
                                {'\n'}
                                {'}'}
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {step === 3 && (
                                <motion.div
                                    layoutId="highlight-box"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: '100%' }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-[84px] left-0 h-[56px] bg-red-500/10 border border-red-500/40 rounded-sm pointer-events-none"
                                />
                            )}
                        </AnimatePresence>

                        {/* Overlays */}
                        <AnimatePresence>
                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}
                                    className="absolute top-6 right-6 z-20"
                                >
                                    <div className="w-80 rounded-xl border border-blue-500/20 bg-[#09090b]/95 shadow-2xl backdrop-blur-md overflow-hidden">
                                        <div className="bg-blue-950/30 px-4 py-3 border-b border-blue-500/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Database size={14} className="text-blue-400" />
                                                <span className="text-xs font-bold text-zinc-100">RAG Context Retrieval</span>
                                            </div>
                                            <Loader2 size={12} className="text-blue-400 animate-spin" />
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                                                    <span>Vector DB Search</span>
                                                    <span className="text-blue-400">Running...</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-blue-500"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: "100%" }}
                                                        transition={{ duration: SCANNING_DURATION / 1000 * 0.8, ease: "easeInOut" }}
                                                    />
                                                </div>
                                            </div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 2 }}
                                                className="bg-red-950/20 rounded-lg border border-red-900/30 p-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                                    <div className="text-[11px] leading-relaxed text-zinc-300">
                                                        <span className="text-zinc-100 font-bold block mb-1">Critical Match Found:</span>
                                                        Pattern matches <span className="text-red-300">CWE-89 (SQL Injection)</span>.
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {step === 5 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="absolute bottom-0 left-0 right-0 z-20"
                                >
                                    <div className="border-t border-purple-500/30 bg-[#0c0c0e]/95 backdrop-blur-md p-4 rounded-b-xl font-mono text-xs">
                                        <div className="flex items-center gap-2 mb-3 text-purple-400 font-bold uppercase tracking-wider">
                                            <Terminal size={12} /> AI Test Runner Output
                                        </div>
                                        <div className="space-y-1.5 text-zinc-400">
                                            <div>$ run-security-tests --target=auth_service.ts</div>
                                            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 1}}>
                                                Running Test Suite: <span className="text-zinc-300">SQL Injection Patterns</span>
                                            </motion.div>
                                            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 2.5}} className="flex items-center gap-2 text-emerald-400">
                                                <CheckCircle2 size={12} /> [PASS] Isolate malicious payload
                                            </motion.div>
                                            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 4.5}} className="text-purple-300 font-bold mt-2">
                                                RESULT: 2/2 Tests Passed.
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {step >= 6 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                                >
                                    <div className="w-[400px] bg-zinc-900 border border-orange-500/20 rounded-2xl shadow-2xl overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500/0 via-orange-500/50 to-orange-500/0 animate-shimmer" style={{backgroundSize: '200% auto'}}/>
                                        <div className="p-6 text-center">
                                            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-orange-500/30">
                                                <ClipboardCheck size={32} className="text-orange-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Security Remediation Report</h3>
                                            <p className="text-zinc-400 text-sm mb-6">Automated fix applied and verified.</p>
                                            <div className="bg-zinc-950/50 rounded-lg border border-zinc-800 p-4 text-sm space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500 flex items-center gap-2"><AlertTriangle size={12}/> Vulnerability</span>
                                                    <span className="text-red-300 font-medium">SQL Injection</span>
                                                </div>
                                                <div className="h-px bg-zinc-800/50 w-full" />
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500 flex items-center gap-2"><Beaker size={12}/> QA Status</span>
                                                    <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={12}/> Verified Safe</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AgentPointer isVisible={step === 2} x={450} y={80} label="Retrieving Context..." color="blue" icon={Search} />
                    <AgentPointer isVisible={step === 3} x={60} y={150} label="VULNERABILITY DETECTED" color="red" icon={AlertTriangle} />
                    <AgentPointer isVisible={step === 4} x={280} y={180} label="Applying Patch..." color="emerald" icon={FileCode} />
                    <AgentPointer isVisible={step === 5} x={150} y={350} label="AI QA Agent running tests..." color="purple" icon={Play} />
                    <AgentPointer isVisible={step === 6} x={350} y={250} label="Generating Compliance Report" color="orange" icon={FileText} />
                </div>
            </div>
        </div>
    );
};