"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
    ChevronLeft,
    ChevronRight,
    X,
    Check,
    Code,
    BookOpen,
    Workflow,
    FileText,
    Github,
    Sparkles,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const OnboardingContext = React.createContext(null)

export function useOnboarding() {
    const context = React.useContext(OnboardingContext)
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider")
    }
    return context
}

// Onboarding steps configuration
const defaultSteps = [
    {
        id: "welcome",
        title: "Welcome to VulnIQ",
        description: "Let's take a quick tour to help you get started with security code analysis.",
        icon: Sparkles,
        content: (
            <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                    VulnIQ uses AI-powered agents to analyze your code for security vulnerabilities,
                    suggest fixes, and generate comprehensive reports.
                </p>
            </div>
        ),
    },
    {
        id: "import",
        title: "Import your code",
        description: "Connect GitHub or GitLab to import repositories for analysis.",
        icon: Github,
        content: (
            <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                    <Github className="h-5 w-5" />
                    <div>
                        <p className="font-medium text-sm">GitHub Integration</p>
                        <p className="text-xs text-muted-foreground">Import public and private repositories</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                    <Code className="h-5 w-5" />
                    <div>
                        <p className="font-medium text-sm">Paste Code Directly</p>
                        <p className="text-xs text-muted-foreground">Or paste code snippets for quick analysis</p>
                    </div>
                </div>
            </div>
        ),
        targetElement: "[data-onboarding='code-input']",
    },
    {
        id: "prompts",
        title: "Customize AI agents",
        description: "Add custom prompts to guide each agent's analysis.",
        icon: FileText,
        content: (
            <div className="py-4">
                <div className="grid grid-cols-2 gap-2">
                    {["Reviewer", "Implementation", "Tester", "Report"].map((agent) => (
                        <div key={agent} className="p-2 rounded-lg border bg-muted/30 text-center">
                            <p className="text-xs font-medium">{agent}</p>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    Each agent can be customized with specific prompts for your use case
                </p>
            </div>
        ),
        targetElement: "[data-onboarding='prompts']",
    },
    {
        id: "knowledge-base",
        title: "Build your knowledge base",
        description: "Upload security documentation and references for the AI to use.",
        icon: BookOpen,
        content: (
            <div className="py-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload PDFs</p>
                    <p className="text-xs text-muted-foreground">Security guidelines, best practices, compliance docs</p>
                </div>
            </div>
        ),
        targetElement: "[data-onboarding='knowledge-base']",
    },
    {
        id: "workflow",
        title: "Configure Your Workflow",
        description: "Set up the AI models and analysis pipeline.",
        icon: Workflow,
        content: (
            <div className="py-4">
                <div className="flex items-center justify-center gap-2">
                    {["Code", "→", "Review", "→", "Fix", "→", "Test", "→", "Report"].map((step, i) => (
                        <span key={i} className={cn(
                            "text-xs",
                            step === "→" ? "text-muted-foreground" : "px-2 py-1 rounded bg-muted"
                        )}>
                            {step}
                        </span>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                    Configure models for each stage of the analysis pipeline
                </p>
            </div>
        ),
        targetElement: "[data-onboarding='workflow']",
    },
    {
        id: "complete",
        title: "You're All Set!",
        description: "Start analyzing your code for security vulnerabilities.",
        icon: Check,
        content: (
            <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                    <Check className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-muted-foreground">
                    You're ready to start! Import a repository and run your first analysis.
                </p>
            </div>
        ),
    },
]

const ONBOARDING_STORAGE_KEY = "vulniq-onboarding-completed"

export function OnboardingProvider({ children, steps = defaultSteps }) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [currentStep, setCurrentStep] = React.useState(0)
    const [hasCompleted, setHasCompleted] = React.useState(true) // Default to true, will check storage

    // Check if onboarding was completed
    React.useEffect(() => {
        const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY)
        if (!completed) {
            setHasCompleted(false)
            // Auto-open for first-time users after a short delay
            setTimeout(() => setIsOpen(true), 1000)
        }
    }, [])

    const totalSteps = steps.length
    const progress = ((currentStep + 1) / totalSteps) * 100
    const currentStepData = steps[currentStep]
    const isFirstStep = currentStep === 0
    const isLastStep = currentStep === totalSteps - 1

    const nextStep = React.useCallback(() => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(c => c + 1)
        }
    }, [currentStep, totalSteps])

    const prevStep = React.useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1)
        }
    }, [currentStep])

    const skipOnboarding = React.useCallback(() => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")
        setHasCompleted(true)
        setIsOpen(false)
        setCurrentStep(0)
    }, [])

    const completeOnboarding = React.useCallback(() => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")
        setHasCompleted(true)
        setIsOpen(false)
        setCurrentStep(0)
    }, [])

    const restartOnboarding = React.useCallback(() => {
        setCurrentStep(0)
        setIsOpen(true)
    }, [])

    const value = React.useMemo(() => ({
        isOpen,
        setIsOpen,
        currentStep,
        setCurrentStep,
        hasCompleted,
        totalSteps,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        restartOnboarding,
    }), [
        isOpen,
        currentStep,
        hasCompleted,
        totalSteps,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        restartOnboarding,
    ])

    return (
        <OnboardingContext.Provider value={value}>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
                    <DialogHeader className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-2 -top-2 h-8 w-8"
                            onClick={skipOnboarding}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 mb-2">
                            {currentStepData.icon && (
                                <currentStepData.icon className="h-5 w-5 text-primary" />
                            )}
                            <DialogTitle>{currentStepData.title}</DialogTitle>
                        </div>
                        <DialogDescription>
                            {currentStepData.description}
                        </DialogDescription>
                    </DialogHeader>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {currentStepData.content}
                        </motion.div>
                    </AnimatePresence>

                    <div className="space-y-4 pt-2">
                        <Progress value={progress} className="h-1" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Step {currentStep + 1} of {totalSteps}</span>
                            <div className="flex gap-1">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-colors",
                                            i === currentStep ? "bg-primary" : i < currentStep ? "bg-primary/50" : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        {!isFirstStep && (
                            <Button variant="outline" onClick={prevStep}>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back
                            </Button>
                        )}
                        {isFirstStep && (
                            <Button variant="ghost" onClick={skipOnboarding}>
                                Skip tour
                            </Button>
                        )}
                        {isLastStep ? (
                            <Button onClick={completeOnboarding}>
                                Get started
                                <Check className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button onClick={nextStep}>
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </OnboardingContext.Provider>
    )
}

export default OnboardingProvider

