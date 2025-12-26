'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from 'next/image'

function VerifyRequestContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    // Helper to get email provider details
    const getEmailProviders = (email) => {
        const providers = [
            {
                name: 'Gmail',
                url: 'https://mail.google.com/mail/u/0/#search/from%3Anoreply%40hfhackathon.com+in%3Aanywhere',
                icon: (props) => (
                    <Image 
                        src="https://img.icons8.com/?size=100&id=P7UIlhbpWzZm&format=png&color=000000"
                        alt="Gmail"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                        unoptimized
                    />
                ),
                domains: ['gmail.com', 'googlemail.com']
            },
            {
                name: 'Outlook',
                url: 'https://outlook.live.com/mail/0/inbox',
                icon: (props) => (
                    <Image 
                        src="https://img.icons8.com/?size=100&id=RUIFhdJm8fbJ&format=png&color=000000"
                        alt="Outlook"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                        unoptimized
                    />
                ),
                domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com']
            },
            {
                name: 'Yahoo Mail',
                url: 'https://mail.yahoo.com',
                icon: (props) => (
                    <Image 
                        src="https://img.icons8.com/?size=100&id=G3F1h1aX2vpT&format=png&color=000000"
                        alt="Yahoo"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                        unoptimized
                    />
                ),
                domains: ['yahoo.com', 'ymail.com']
            },
            {
                name: 'iCloud Mail',
                url: 'https://www.icloud.com/mail',
                icon: (props) => (
                    <Image 
                        src="https://www.freeiconspng.com/uploads/icloud-logos-revision-wikia-iphone-png-images-4.png"
                        alt="iCloud"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                        unoptimized
                    />
                ),
                domains: ['icloud.com', 'me.com', 'mac.com']
            },
            {
                name: 'Proton Mail',
                url: 'https://mail.proton.me',
                icon: (props) => (
                    <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/0/0c/ProtonMail_icon.svg"
                        alt="Proton"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                        unoptimized
                    />
                ),
                domains: ['protonmail.com', 'proton.me']
            },
            {
                name: 'AOL Mail',
                url: 'https://mail.aol.com',
                icon: (props) => (
                    <Image 
                        src="https://img.icons8.com/?size=100&id=113644&format=png&color=000000"
                        alt="AOL"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                        unoptimized
                    />
                ),
                domains: ['aol.com']
            }
        ];

        if (!email) return providers; // Return all if no email
        
        const domain = email.split('@')[1]?.toLowerCase();
        
        // Find the matching provider first
        const matchedProvider = providers.find(p => p.domains.includes(domain));
        
        // If match found, put it first, otherwise just return list
        if (matchedProvider) {
            return [matchedProvider, ...providers.filter(p => p !== matchedProvider)];
        }
        
        return providers;
    }

    const providers = getEmailProviders(email);

    return (
        <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
            {/* Left Side: Content */}
            <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10 bg-background">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 font-semibold text-xl sm:text-2xl group">
                        <Image src="/web-app-manifest-512x512.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" width={40} height={40} />
                        <span className="font-bold text-foreground">VulnIQ</span>
                    </Link>
                    <ThemeToggle />
                </div>
                
                <div className="flex flex-1 items-center justify-center py-8 sm:py-0">
                    <motion.div
                        className="w-full max-w-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="border-border/50 shadow-xl">
                            <CardHeader className="text-center space-y-4 pb-2">
                                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
                                <CardDescription className="text-base text-balance">
                                    A sign in link has been sent to <br />
                                    <span className="font-medium text-foreground">{email || "your email address"}</span>
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="grid gap-4 pt-4">
                                {/* Primary Action: Open Email App (System Default) */}
                                <Button asChild className="w-full h-12 text-base mb-2" size="lg" variant="default">
                                    <Link href="#" onClick={(e) => {
                                        e.preventDefault();
                                        window.location.href = "mailto:";
                                    }}>
                                        Open Default Email App
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-muted" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">Or open directly</span>
                                    </div>
                                </div>

                                {/* List of Providers */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {providers.map((provider) => (
                                        <Button
                                            key={provider.name}
                                            variant="outline"
                                            className="h-20 flex flex-col gap-2 items-center justify-center p-2 hover:bg-muted/50 transition-colors"
                                            asChild
                                        >
                                            <Link href={provider.url} target="_blank" rel="noopener noreferrer">
                                                <provider.icon className="w-8 h-8" />
                                                <span className="text-xs font-medium">{provider.name}</span>
                                            </Link>
                                        </Button>
                                    ))}
                                </div>

                                <div className="text-center text-sm text-muted-foreground mt-2">
                                    <p>Can't find the email? Check your spam folder.</p>
                                </div>
                            </CardContent>
                            
                            <CardFooter className="flex flex-col gap-2 border-t pt-6">
                                <Button variant="ghost" asChild className="w-full">
                                    <Link href="/login">
                                        Back to login
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Background (Same as Login) */}
            <motion.div
                className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden border-l border-border bg-[length:400%_400%]"
                style={{
                    backgroundColor: '#0f1117',
                    backgroundImage: 'linear-gradient(45deg, hsla(220,60%,10%,1), hsla(180,70%,25%,1), hsla(200,80%,30%,1), hsla(170,60%,35%,1), hsla(190,70%,20%,1))'
                }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity }}
            >
                {/* Noise overlay */}
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                
                <div className="z-10 flex flex-col items-center gap-4 text-center px-8">
                     <div className="p-4 rounded-full bg-background/10 backdrop-blur-md border border-white/10">
                        <CheckCircle2 className="w-12 h-12 text-primary" />
                     </div>
                     <h2 className="text-3xl font-bold text-white tracking-tight">One step closer</h2>
                     <p className="text-white/70 max-w-md text-lg">
                        Secure passwordless authentication keeps your account safe. Click the link in your email to continue.
                     </p>
                </div>
            </motion.div>
        </div>
    )
}

export default function VerifyRequestPage() {
    return (
        <Suspense>
            <VerifyRequestContent />
        </Suspense>
    )
}
