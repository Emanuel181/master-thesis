'use client'

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, FileText, Shield, Lock, Globe, Cookie, Users, Database, Mail, Eye, Server, Scale, PersonStanding } from "lucide-react";
import { Footer } from "@/components/landing-page/footer";
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

export default function PrivacyPage() {
    const { openPanel } = useAccessibility()

    const sections = [
        { id: 'definitions', title: 'Definitions and key terms', icon: FileText },
        { id: 'collect', title: 'What information do we collect?', icon: Database },
        { id: 'use', title: 'How do we use the information?', icon: Eye },
        { id: 'end-user', title: 'End user information from third parties', icon: Users },
        { id: 'customer', title: 'Customer information from third parties', icon: Users },
        { id: 'share', title: 'Do we share information with third parties?', icon: Globe },
        { id: 'where-when', title: 'Where and when is information collected?', icon: Server },
        { id: 'email', title: 'How do we use your email address?', icon: Mail },
        { id: 'retention', title: 'How long do we keep your information?', icon: Database },
        { id: 'protect', title: 'How do we protect your information?', icon: Shield },
        { id: 'transfer', title: 'International data transfers', icon: Globe },
        { id: 'secure', title: 'Is the information secure?', icon: Lock },
        { id: 'update', title: 'Can I update or correct my information?', icon: FileText },
        { id: 'sale', title: 'Sale of business', icon: Scale },
        { id: 'affiliates', title: 'Affiliates', icon: Users },
        { id: 'governing', title: 'Governing law', icon: Scale },
        { id: 'consent', title: 'Your consent', icon: FileText },
        { id: 'links', title: 'Links to other websites', icon: Globe },
        { id: 'cookies', title: 'Cookies', icon: Cookie },
        { id: 'blocking', title: 'Blocking and disabling cookies', icon: Cookie },
        { id: 'kids', title: "Kids' privacy", icon: Users },
        { id: 'changes', title: 'Changes to our privacy policy', icon: FileText },
        { id: 'third-party', title: 'Third-party services', icon: Globe },
        { id: 'tracking', title: 'Tracking technologies', icon: Eye },
        { id: 'gdpr', title: 'GDPR information', icon: Shield },
        { id: 'gdpr-what', title: 'What is GDPR?', icon: Shield },
        { id: 'personal-data', title: 'What is personal data?', icon: Database },
        { id: 'data-principles', title: 'Data protection principles', icon: Shield },
        { id: 'gdpr-important', title: 'Why is GDPR important?', icon: Shield },
        { id: 'rights', title: 'Individual data subject rights', icon: Users },
        { id: 'contact', title: 'Contact us', icon: Mail },
    ];

    const scrollRef = useRef(null);
    
    // Restore scroll position when returning to this page
    useScrollRestoration(scrollRef);

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden font-sans selection:bg-[var(--brand-accent)]/20">
            {/* Background effects */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-50" />
            <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

            {/* Floating Navbar - disabled for footer pages */}
            {/* <FloatingNavbar /> */}

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-xl group">
                            <Image src="/web-app-manifest-512x512.png" alt="Logo" className="w-8 h-8" width={32} height={32} />
                            <span className="font-bold text-foreground">VulnIQ</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)]">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                <span className="sm:hidden">Back</span>
                                <span className="hidden sm:inline">Back to home</span>
                            </Link>
                        </Button>
                        <button
                            onClick={openPanel}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2"
                            aria-label="Open accessibility menu"
                            title="Accessibility options"
                        >
                            <PersonStanding className="w-5 h-5 text-[var(--brand-accent)]" strokeWidth={2} />
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content with ScrollArea */}
            <ScrollArea className="flex-1" viewportRef={scrollRef}>
                <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Title Section */}
                        <div id="privacy-top" className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-accent)]/10 mb-6">
                                <Shield className="w-8 h-8 text-[var(--brand-accent)]" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                                Privacy Policy
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Updated at 2025-12-23
                            </p>
                    </div>

                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-12 p-6 rounded-lg border border-border bg-muted/30"
                    >
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            VulnIQ ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by VulnIQ.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            This Privacy Policy applies to our website, and its associated subdomains (collectively, our "Service") alongside our application, VulnIQ. By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy and our Terms of Service.
                        </p>
                    </motion.div>

                    {/* Table of Contents */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-12 p-6 rounded-lg border border-border bg-muted/30"
                    >
                        <h2 className="text-lg font-semibold mb-4">Table of contents</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {sections.map((section, index) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1"
                                >
                                    <span className="text-[var(--brand-accent)]">{index + 1}.</span>
                                    {section.title}
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Content Sections */}
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        {/* Definitions and Key Terms */}
                        <Section id="definitions" title="Definitions and key terms" icon={FileText}>
                            <p>To help explain things as clearly as possible in this Privacy Policy, every time any of these terms are referenced, are strictly defined as:</p>
                            <ul className="space-y-3">
                                <li><strong>Cookie:</strong> small amount of data generated by a website and saved by your web browser. It is used to identify your browser, provide analytics, remember information about you such as your language preference or login information.</li>
                                <li><strong>Company:</strong> when this policy mentions "Company," "we," "us," or "our," it refers to VulnIQ, that is responsible for your information under this Privacy Policy.</li>
                                <li><strong>Country:</strong> where VulnIQ or the owners/founders of VulnIQ are based, in this case is Romania.</li>
                                <li><strong>Customer:</strong> refers to the company, organization or person that signs up to use the VulnIQ Service to manage the relationships with your consumers or service users.</li>
                                <li><strong>Device:</strong> any internet connected device such as a phone, tablet, computer or any other device that can be used to visit VulnIQ and use the services.</li>
                                <li><strong>IP address:</strong> Every device connected to the Internet is assigned a number known as an Internet protocol (IP) address. These numbers are usually assigned in geographic blocks. An IP address can often be used to identify the location from which a device is connecting to the Internet.</li>
                                <li><strong>Personnel:</strong> refers to those individuals who are employed by VulnIQ or are under contract to perform a service on behalf of one of the parties.</li>
                                <li><strong>Personal Data:</strong> any information that directly, indirectly, or in connection with other information — including a personal identification number — allows for the identification or identifiability of a natural person.</li>
                                <li><strong>Service:</strong> refers to the service provided by VulnIQ as described in the relative terms (if available) and on this platform.</li>
                                <li><strong>Third-party service:</strong> refers to advertisers, contest sponsors, promotional and marketing partners, and others who provide our content or whose products or services we think may interest you.</li>
                                <li><strong>Website:</strong> VulnIQ's site.</li>
                                <li><strong>You:</strong> a person or entity that is registered with VulnIQ to use the Services.</li>
                            </ul>
                        </Section>

                        {/* What Information Do We Collect? */}
                        <Section id="collect" title="What information do we collect?" icon={Database}>
                            <p>We collect information from you when you visit our app, register on our site, place an order, subscribe to our newsletter, respond to a survey or fill out a form.</p>
                            <ul className="space-y-2">
                                <li>Name / Username</li>
                                <li>Phone Numbers</li>
                                <li>Email Addresses</li>
                                <li>Job Titles</li>
                            </ul>
                        </Section>

                        {/* How Do We Use The Information We Collect? */}
                        <Section id="use" title="How do we use the information we collect?" icon={Eye}>
                            <p>Any of the information we collect from you may be used in one of the following ways:</p>
                            <ul className="space-y-2">
                                <li>To personalize your experience (your information helps us to better respond to your individual needs)</li>
                                <li>To improve our app (we continually strive to improve our app offerings based on the information and feedback we receive from you)</li>
                                <li>To improve customer service (your information helps us to more effectively respond to your customer service requests and support needs)</li>
                                <li>To process transactions</li>
                                <li>To administer a contest, promotion, survey or other site feature</li>
                                <li>To send periodic emails</li>
                            </ul>
                        </Section>

                        {/* When does VulnIQ use end user information from third parties? */}
                        <Section id="end-user" title="When does VulnIQ use end user information from third parties?" icon={Users}>
                            <p>
                                VulnIQ will collect End User Data necessary to provide the VulnIQ services to our customers.
                            </p>
                            <p>
                                End users may voluntarily provide us with information they have made available on social media websites. If you provide us with any such information, we may collect publicly available information from the social media websites you have indicated. You can control how much of your information social media websites make public by visiting these websites and changing your privacy settings.
                            </p>
                        </Section>

                        {/* When does VulnIQ use customer information from third parties? */}
                        <Section id="customer" title="When does VulnIQ use customer information from third parties?" icon={Users}>
                            <p>
                                We receive some information from the third parties when you contact us. For example, when you submit your email address to us to show interest in becoming a VulnIQ customer, we receive information from a third party that provides automated fraud detection services to VulnIQ.
                            </p>
                            <p>
                                We also occasionally collect information that is made publicly available on social media websites. You can control how much of your information social media websites make public by visiting these websites and changing your privacy settings.
                            </p>
                        </Section>

                        {/* Do we share the information we collect with third parties? */}
                        <Section id="share" title="Do we share the information we collect with third parties?" icon={Globe}>
                            <p>
                                We may share the information that we collect, both personal and non-personal, with third parties such as advertisers, contest sponsors, promotional and marketing partners, and others who provide our content or whose products or services we think may interest you. We may also share it with our current and future affiliated companies and business partners, and if we are involved in a merger, asset sale or other business reorganization, we may also share or transfer your personal and non-personal information to our successors-in-interest.
                            </p>
                            <p>
                                We may engage trusted third party service providers to perform functions and provide services to us, such as hosting and maintaining our servers and the app, database storage and management, e-mail management, storage marketing, credit card processing, customer service and fulfilling orders for products and services you may purchase through the app. We will likely share your personal information, and possibly some non-personal information, with these third parties to enable them to perform these services for us and for you.
                            </p>
                            <p>
                                We may share portions of our log file data, including IP addresses, for analytics purposes with third parties such as web analytics partners, application developers, and ad networks. If your IP address is shared, it may be used to estimate general location and other technographics such as connection speed, whether you have visited the app in a shared location, and type of the device used to visit the app. They may aggregate information about our advertising and what you see on the app and then provide auditing, research and reporting for us and our advertisers.
                            </p>
                            <p>
                                We may also disclose personal and non-personal information about you to government or law enforcement officials or private parties as we, in our sole discretion, believe necessary or appropriate in order to respond to claims, legal process (including subpoenas), to protect our rights and interests or those of a third party, the safety of the public or any person, to prevent or stop any illegal, unethical, or legally actionable activity, or to otherwise comply with applicable court orders, laws, rules and regulations.
                            </p>
                        </Section>

                        {/* Where and when is information collected from customers and end users? */}
                        <Section id="where-when" title="Where and when is information collected from customers and end users?" icon={Server}>
                            <p>
                                VulnIQ will collect personal information that you submit to us. We may also receive personal information about you from third parties as described above.
                            </p>
                        </Section>

                        {/* How Do We Use Your Email Address? */}
                        <Section id="email" title="How do we use your email address?" icon={Mail}>
                            <p>
                                By submitting your email address on this app, you agree to receive emails from us. You can cancel your participation in any of these email lists at any time by clicking on the opt-out link or other unsubscribe option that is included in the respective email. We only send emails to people who have authorized us to contact them, either directly, or through a third party. We do not send unsolicited commercial emails, because we hate spam as much as you do.
                            </p>
                            <p>
                                By submitting your email address, you also agree to allow us to use your email address for customer audience targeting on sites like Facebook, where we display custom advertising to specific people who have opted-in to receive communications from us.
                            </p>
                            <p>
                                Email addresses submitted only through the order processing page will be used for the sole purpose of sending you information and updates pertaining to your order. If, however, you have provided the same email to us through another method, we may use it for any of the purposes stated in this Policy.
                            </p>
                            <p>
                                <strong>Note:</strong> If at any time you would like to unsubscribe from receiving future emails, we include detailed unsubscribe instructions at the bottom of each email.
                            </p>
                        </Section>

                        {/* How Long Do We Keep Your Information? */}
                        <Section id="retention" title="How long do we keep your information?" icon={Database}>
                            <p>
                                We keep your information only so long as we need it to provide VulnIQ to you and fulfill the purposes described in this policy. This is also the case for anyone that we share your information with and who carries out services on our behalf.
                            </p>
                            <p>
                                When we no longer need to use your information and there is no need for us to keep it to comply with our legal or regulatory obligations, we'll either remove it from our systems or depersonalize it so that we can't identify you.
                            </p>
                        </Section>

                        {/* How Do We Protect Your Information? */}
                        <Section id="protect" title="How do we protect your information?" icon={Shield}>
                            <p>
                                We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. We offer the use of a secure server. All supplied sensitive/credit information is transmitted via Secure Socket Layer (SSL) technology and then encrypted into our Payment gateway providers database only to be accessible by those authorized with special access rights to such systems, and are required to keep the information confidential.
                            </p>
                            <p>
                                After a transaction, your private information (credit cards, social security numbers, financials, etc.) is never kept on file. We cannot, however, ensure or warrant the absolute security of any information you transmit to VulnIQ or guarantee that your information on the Service may not be accessed, disclosed, altered, or destroyed by a breach of any of our physical, technical, or managerial safeguards.
                            </p>
                        </Section>

                        {/* Could my information be transferred to other countries? */}
                        <Section id="transfer" title="Could my information be transferred to other countries?" icon={Globe}>
                            <p>
                                VulnIQ is incorporated in Romania. Information collected via our website, through direct interactions with you, or from use of our help services may be transferred from time to time to our offices or personnel, or to third parties, located throughout the world, and may be viewed and hosted anywhere in the world, including countries that may not have laws of general applicability regulating the use and transfer of such data.
                            </p>
                            <p>
                                To the fullest extent allowed by applicable law, by using any of the above, you voluntarily consent to the trans-border transfer and hosting of such information.
                            </p>
                        </Section>

                        {/* Is the information collected through the VulnIQ Service secure? */}
                        <Section id="secure" title="Is the information collected through the VulnIQ dervice decure?" icon={Lock}>
                            <p>
                                We take precautions to protect the security of your information. We have physical, electronic, and managerial procedures to help safeguard, prevent unauthorized access, maintain data security, and correctly use your information.
                            </p>
                            <p>
                                However, neither people nor security systems are foolproof, including encryption systems. In addition, people can commit intentional crimes, make mistakes or fail to follow policies. Therefore, while we use reasonable efforts to protect your personal information, we cannot guarantee its absolute security.
                            </p>
                            <p>
                                If applicable law imposes any non-disclaimable duty to protect your personal information, you agree that intentional misconduct will be the standards used to measure our compliance with that duty.
                            </p>
                        </Section>

                        {/* Can I update or correct my information? */}
                        <Section id="update" title="Can I update or correct my information?" icon={FileText}>
                            <p>
                                The rights you have to request updates or corrections to the information VulnIQ collects depend on your relationship with VulnIQ. Personnel may update or correct their information as detailed in our internal company employment policies.
                            </p>
                            <p>
                                Customers have the right to request the restriction of certain uses and disclosures of personally identifiable information as follows. You can contact us in order to (1) update or correct your personally identifiable information, (2) change your preferences with respect to communications and other information you receive from us, or (3) delete the personally identifiable information maintained about you on our systems (subject to the following paragraph), by cancelling your account.
                            </p>
                            <p>
                                Such updates, corrections, changes and deletions will have no effect on other information that we maintain, or information that we have provided to third parties in accordance with this Privacy Policy prior to such update, correction, change or deletion. To protect your privacy and security, we may take reasonable steps (such as requesting a unique password) to verify your identity before granting you profile access or making corrections. You are responsible for maintaining the secrecy of your unique password and account information at all times.
                            </p>
                            <p>
                                You should be aware that it is not technologically possible to remove each and every record of the information you have provided to us from our system. The need to back up our systems to protect information from inadvertent loss means that a copy of your information may exist in a non-erasable form that will be difficult or impossible for us to locate. Promptly after receiving your request, all personal information stored in databases we actively use, and other readily searchable media will be updated, corrected, changed or deleted, as appropriate, as soon as and to the extent reasonably and technically practicable.
                            </p>
                            <p>
                                If you are an end user and wish to update, delete, or receive any information we have about you, you may do so by contacting the organization of which you are a customer.
                            </p>
                        </Section>

                        {/* Sale of Business */}
                        <Section id="sale" title="Sale of business" icon={Scale}>
                            <p>
                                We reserve the right to transfer information to a third party in the event of a sale, merger or other transfer of all or substantially all of the assets of VulnIQ or any of its Corporate Affiliates (as defined herein), or that portion of VulnIQ or any of its Corporate Affiliates to which the Service relates, or in the event that we discontinue our business or file a petition or have filed against us a petition in bankruptcy, reorganization or similar proceeding, provided that the third party agrees to adhere to the terms of this Privacy Policy.
                            </p>
                        </Section>

                        {/* Affiliates */}
                        <Section id="affiliates" title="Affiliates" icon={Users}>
                            <p>
                                We may disclose information (including personal information) about you to our Corporate Affiliates. For purposes of this Privacy Policy, "Corporate Affiliate" means any person or entity which directly or indirectly controls, is controlled by or is under common control with VulnIQ, whether by ownership or otherwise.
                            </p>
                            <p>
                                Any information relating to you that we provide to our Corporate Affiliates will be treated by those Corporate Affiliates in accordance with the terms of this Privacy Policy.
                            </p>
                        </Section>

                        {/* Governing Law */}
                        <Section id="governing" title="Governing law" icon={Scale}>
                            <p>
                                This Privacy Policy is governed by the laws of Romania without regard to its conflict of laws provision. You consent to the exclusive jurisdiction of the courts in connection with any action or dispute arising between the parties under or in connection with this Privacy Policy except for those individuals who may have rights to make claims under Privacy Shield, or the Swiss-US framework.
                            </p>
                            <p>
                                The laws of Romania, excluding its conflicts of law rules, shall govern this Agreement and your use of the app. Your use of the app may also be subject to other local, state, national, or international laws.
                            </p>
                            <p>
                                By using VulnIQ or contacting us directly, you signify your acceptance of this Privacy Policy. If you do not agree to this Privacy Policy, you should not engage with our website, or use our services. Continued use of the website, direct engagement with us, or following the posting of changes to this Privacy Policy that do not significantly affect the use or disclosure of your personal information will mean that you accept those changes.
                            </p>
                        </Section>

                        {/* Your Consent */}
                        <Section id="consent" title="Your consent" icon={FileText}>
                            <p>
                                We've updated our Privacy Policy to provide you with complete transparency into what is being set when you visit our site and how it's being used. By using our app, registering an account, or making a purchase, you hereby consent to our Privacy Policy and agree to its terms.
                            </p>
                        </Section>

                        {/* Links to Other Websites */}
                        <Section id="links" title="Links to other websites" icon={Globe}>
                            <p>
                                This Privacy Policy applies only to the Services. The Services may contain links to other websites not operated or controlled by VulnIQ. We are not responsible for the content, accuracy or opinions expressed in such websites, and such websites are not investigated, monitored or checked for accuracy or completeness by us.
                            </p>
                            <p>
                                Please remember that when you use a link to go from the Services to another website, our Privacy Policy is no longer in effect. Your browsing and interaction on any other website, including those that have a link on our platform, is subject to that website's own rules and policies. Such third parties may use their own cookies or other methods to collect information about you.
                            </p>
                        </Section>

                        {/* Cookies */}
                        <Section id="cookies" title="Cookies" icon={Cookie}>
                            <p>
                                VulnIQ uses "Cookies" to identify the areas of our website that you have visited. A Cookie is a small piece of data stored on your computer or mobile device by your web browser. We use Cookies to enhance the performance and functionality of our app but are non-essential to their use.
                            </p>
                            <p>
                                However, without these cookies, certain functionality like videos may become unavailable or you would be required to enter your login details every time you visit the app as we would not be able to remember that you had logged in previously.
                            </p>
                            <p>
                                Most web browsers can be set to disable the use of Cookies. However, if you disable Cookies, you may not be able to access functionality on our website correctly or at all. We never place Personally Identifiable Information in Cookies.
                            </p>
                        </Section>

                        {/* Blocking and disabling cookies and similar technologies */}
                        <Section id="blocking" title="Blocking and disabling cookies and similar technologies" icon={Cookie}>
                            <p>
                                Wherever you're located you may also set your browser to block cookies and similar technologies, but this action may block our essential cookies and prevent our website from functioning properly, and you may not be able to fully utilize all of its features and services.
                            </p>
                            <p>
                                You should also be aware that you may also lose some saved information (e.g. saved login details, site preferences) if you block cookies on your browser. Different browsers make different controls available to you. Disabling a cookie or category of cookie does not delete the cookie from your browser, you will need to do this yourself from within your browser, you should visit your browser's help menu for more information.
                            </p>
                        </Section>

                        {/* Kids' Privacy */}
                        <Section id="kids" title="Kids' privacy" icon={Users}>
                            <p>
                                We do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us.
                            </p>
                            <p>
                                If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers.
                            </p>
                        </Section>

                        {/* Changes To Our Privacy Policy */}
                        <Section id="changes" title="Changes to our privacy policy" icon={FileText}>
                            <p>
                                We may change our Service and policies, and we may need to make changes to this Privacy Policy so that they accurately reflect our Service and policies. Unless otherwise required by law, we will notify you (for example, through our Service) before we make changes to this Privacy Policy and give you an opportunity to review them before they go into effect.
                            </p>
                            <p>
                                Then, if you continue to use the Service, you will be bound by the updated Privacy Policy. If you do not want to agree to this or any updated Privacy Policy, you can delete your account.
                            </p>
                        </Section>

                        {/* Third-Party Services */}
                        <Section id="third-party" title="Third-party services" icon={Globe}>
                            <p>
                                We may display, include or make available third-party content (including data, information, applications and other products services) or provide links to third-party websites or services ("Third-Party Services").
                            </p>
                            <p>
                                You acknowledge and agree that VulnIQ shall not be responsible for any Third-Party Services, including their accuracy, completeness, timeliness, validity, copyright compliance, legality, decency, quality or any other aspect thereof. VulnIQ does not assume and shall not have any liability or responsibility to you or any other person or entity for any Third-Party Services.
                            </p>
                            <p>
                                Third-Party Services and links thereto are provided solely as a convenience to you and you access and use them entirely at your own risk and subject to such third parties' terms and conditions.
                            </p>
                        </Section>

                        {/* Tracking Technologies */}
                        <Section id="tracking" title="Tracking technologies" icon={Eye}>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Cookies</h3>
                                    <p>
                                        We use Cookies to enhance the performance and functionality of our app but are non-essential to their use. However, without these cookies, certain functionality like videos may become unavailable or you would be required to enter your login details every time you visit the app as we would not be able to remember that you had logged in previously.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Local Storage</h3>
                                    <p>
                                        Local Storage sometimes known as DOM storage, provides web apps with methods and protocols for storing client-side data. Web storage supports persistent data storage, similar to cookies but with a greatly enhanced capacity and no information stored in the HTTP request header.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Sessions</h3>
                                    <p>
                                        VulnIQ uses "Sessions" to identify the areas of our website that you have visited. A Session is a small piece of data stored on your computer or mobile device by your web browser.
                                    </p>
                                </div>
                            </div>
                        </Section>

                        {/* Information about General Data Protection Regulation (GDPR) */}
                        <Section id="gdpr" title="Information about General Data Protection Regulation (GDPR)" icon={Shield}>
                            <p>
                                We may be collecting and using information from you if you are from the European Economic Area (EEA), and in this section of our Privacy Policy we are going to explain exactly how and why is this data collected, and how we maintain this data under protection from being replicated or used in the wrong way.
                            </p>
                        </Section>

                        {/* What is GDPR? */}
                        <Section id="gdpr-what" title="What is GDPR?" icon={Shield}>
                            <p>
                                GDPR is an EU-wide privacy and data protection law that regulates how EU residents' data is protected by companies and enhances the control the EU residents have, over their personal data.
                            </p>
                            <p>
                                The GDPR is relevant to any globally operating company and not just the EU-based businesses and EU residents. Our customers' data is important irrespective of where they are located, which is why we have implemented GDPR controls as our baseline standard for all our operations worldwide.
                            </p>
                        </Section>

                        {/* What is personal data? */}
                        <Section id="personal-data" title="What is personal data?" icon={Database}>
                            <p>
                                Any data that relates to an identifiable or identified individual. GDPR covers a broad spectrum of information that could be used on its own, or in combination with other pieces of information, to identify a person. Personal data extends beyond a person's name or email address. Some examples include financial information, political opinions, genetic data, biometric data, IP addresses, physical address, sexual orientation, and ethnicity.
                            </p>
                        </Section>

                        {/* The Data Protection Principles */}
                        <Section id="data-principles" title="The data protection principles" icon={Shield}>
                            <p>The Data Protection Principles include requirements such as:</p>
                            <ul className="space-y-3">
                                <li>Personal data collected must be processed in a fair, legal, and transparent way and should only be used in a way that a person would reasonably expect.</li>
                                <li>Personal data should only be collected to fulfil a specific purpose and it should only be used for that purpose. Organizations must specify why they need the personal data when they collect it.</li>
                                <li>Personal data should be held no longer than necessary to fulfil its purpose.</li>
                                <li>People covered by the GDPR have the right to access their own personal data. They can also request a copy of their data, and that their data be updated, deleted, restricted, or moved to another organization.</li>
                            </ul>
                        </Section>

                        {/* Why is GDPR important? */}
                        <Section id="gdpr-important" title="Why is GDPR important?" icon={Shield}>
                            <p>
                                GDPR adds some new requirements regarding how companies should protect individuals' personal data that they collect and process. It also raises the stakes for compliance by increasing enforcement and imposing greater fines for breach.
                            </p>
                            <p>
                                Beyond these facts it's simply the right thing to do. At VulnIQ we strongly believe that your data privacy is very important and we already have solid security and privacy practices in place that go beyond the requirements of this new regulation.
                            </p>
                        </Section>

                        {/* Individual Data Subject's Rights - Data Access, Portability and Deletion */}
                        <Section id="rights" title="Individual data subject's rights - data access, portability and deletion" icon={Users}>
                            <p>
                                We are committed to helping our customers meet the data subject rights requirements of GDPR. VulnIQ processes or stores all personal data in fully vetted, DPA compliant vendors. We do store all conversation and personal data for up to 6 years unless your account is deleted. In which case, we dispose of all data in accordance with our Terms of Service and Privacy Policy, but we will not hold it longer than 60 days.
                            </p>
                            <p>
                                We are aware that if you are working with EU customers, you need to be able to provide them with the ability to access, update, retrieve and remove personal data. We got you! We've been set up as self service from the start and have always given you access to your data and your customers data. Our customer support team is here for you to answer any questions you might have about working with the API.
                            </p>
                        </Section>

                        {/* Contact Us */}
                        <Section id="contact" title="Contact us" icon={Mail}>
                            <p>
                                Don't hesitate to contact us if you have any questions.
                            </p>
                            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
                                <p className="flex flex-wrap items-center gap-2">
                                    <Mail className="h-4 w-4 text-[var(--brand-accent)] flex-shrink-0" />
                                    <strong>Via email:</strong>
                                    <a href="mailto:emanuel.rusu.secure@gmail.com" className="text-[var(--brand-accent)] hover:underline break-all">
                                        emanuel.rusu.secure@gmail.com
                                    </a>
                                </p>
                            </div>
                        </Section>
                    </div>

                </motion.div>
            </main>

            <Footer onScrollToTop={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
            </ScrollArea>
        </div>
    );
}

function Section({ id, title, icon: Icon, children }) {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-10 scroll-mt-24"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-accent)]/10">
                    <Icon className="h-4 w-4 text-[var(--brand-accent)]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-11">
                {children}
            </div>
        </motion.section>
    );
}

