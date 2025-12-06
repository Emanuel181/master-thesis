import React from "react";
import { Shield, Github, Twitter, Instagram, Youtube, ArrowRight } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-zinc-800 bg-[#020617] text-zinc-400">
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-white p-1 rounded-md">
                                <Shield className="w-5 h-5 text-black fill-black" />
                            </div>
                            <span className="font-bold text-white text-lg">SecureRAG</span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs">
                            An agentic system for the remediation of source code vulnerabilities using retrieval-augmented generation.
                            Built for security teams who demand precision.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <Github className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                            <Twitter className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                            <Instagram className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                            <Youtube className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Product</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Subscribe to newsletter</h4>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="email"
                                placeholder="Your email..."
                                className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-zinc-600"
                            />
                            <button className="bg-zinc-100 hover:bg-white text-black p-2 rounded-md transition-colors">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                        <p className="text-xs text-zinc-600">
                            Join 5,000+ developers receiving security insights weekly.
                        </p>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-zinc-800 mt-16 pt-8 text-center text-sm text-zinc-600">
                    <p>© 2025 SecureRAG System. Made with <span className="text-red-500">♥</span> for better code security.</p>
                </div>
            </div>
        </footer>
    );
}