'use client'

import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, Cookie, RefreshCw, Gavel, Mail, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";

export default function TermsPage() {
    const sections = [
        { id: 'general', title: 'General Terms', icon: FileText },
        { id: 'license', title: 'License', icon: Scale },
        { id: 'meanings', title: 'Meanings', icon: FileText },
        { id: 'restrictions', title: 'Restrictions', icon: Shield },
        { id: 'refund', title: 'Return and Refund Policy', icon: RefreshCw },
        { id: 'suggestions', title: 'Your Suggestions', icon: FileText },
        { id: 'consent', title: 'Your Consent', icon: FileText },
        { id: 'links', title: 'Links to Other Websites', icon: FileText },
        { id: 'cookies', title: 'Cookies', icon: Cookie },
        { id: 'changes', title: 'Changes To Our Terms', icon: RefreshCw },
        { id: 'modifications', title: 'Modifications to Our App', icon: RefreshCw },
        { id: 'updates', title: 'Updates to Our App', icon: RefreshCw },
        { id: 'third-party', title: 'Third-Party Services', icon: FileText },
        { id: 'termination', title: 'Term and Termination', icon: AlertTriangle },
        { id: 'copyright', title: 'Copyright Infringement', icon: Scale },
        { id: 'indemnification', title: 'Indemnification', icon: Shield },
        { id: 'warranties', title: 'No Warranties', icon: AlertTriangle },
        { id: 'liability', title: 'Limitation of Liability', icon: AlertTriangle },
        { id: 'severability', title: 'Severability', icon: Scale },
        { id: 'waiver', title: 'Waiver', icon: Scale },
        { id: 'amendments', title: 'Amendments', icon: RefreshCw },
        { id: 'entire', title: 'Entire Agreement', icon: FileText },
        { id: 'updates-terms', title: 'Updates to Our Terms', icon: RefreshCw },
        { id: 'intellectual', title: 'Intellectual Property', icon: Shield },
        { id: 'arbitrate', title: 'Agreement to Arbitrate', icon: Gavel },
        { id: 'dispute', title: 'Notice of Dispute', icon: Mail },
        { id: 'binding', title: 'Binding Arbitration', icon: Gavel },
        { id: 'submissions', title: 'Submissions and Privacy', icon: Shield },
        { id: 'promotions', title: 'Promotions', icon: FileText },
        { id: 'errors', title: 'Typographical Errors', icon: AlertTriangle },
        { id: 'miscellaneous', title: 'Miscellaneous', icon: FileText },
        { id: 'disclaimer', title: 'Disclaimer', icon: AlertTriangle },
        { id: 'contact', title: 'Contact Us', icon: Mail },
    ];

    const scrollRef = useRef(null);

    const scrollToTop = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                                Back to Home
                            </Link>
                        </Button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
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
                        <div id="terms-top" className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-accent)]/10 mb-6">
                                <Scale className="w-8 h-8 text-[var(--brand-accent)]" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                                Terms & Conditions
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Updated at 2025-12-23
                            </p>
                        </div>

                        {/* Table of Contents */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-12 p-6 rounded-lg border border-border bg-muted/30"
                    >
                        <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
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
                        {/* General Terms */}
                        <Section id="general" title="General Terms" icon={FileText}>
                            <p>
                                By accessing and placing an order with VulnIQ, you confirm that you are in agreement with and bound by the terms of service contained in the Terms & Conditions outlined below. These terms apply to the entire website and any email or other type of communication between you and VulnIQ.
                            </p>
                            <p>
                                Under no circumstances shall VulnIQ team be liable for any direct, indirect, special, incidental or consequential damages, including, but not limited to, loss of data or profit, arising out of the use, or the inability to use, the materials on this site, even if VulnIQ team or an authorized representative has been advised of the possibility of such damages. If your use of materials from this site results in the need for servicing, repair or correction of equipment or data, you assume any costs thereof.
                            </p>
                            <p>
                                VulnIQ will not be responsible for any outcome that may occur during the course of usage of our resources. We reserve the rights to change prices and revise the resources usage policy in any moment.
                            </p>
                        </Section>

                        {/* License */}
                        <Section id="license" title="License" icon={Scale}>
                            <p>
                                VulnIQ grants you a revocable, non-exclusive, non-transferable, limited license to download, install and use the app strictly in accordance with the terms of this Agreement.
                            </p>
                            <p>
                                These Terms & Conditions are a contract between you and VulnIQ (referred to in these Terms & Conditions as "VulnIQ", "us", "we" or "our"), the provider of the VulnIQ website and the services accessible from the VulnIQ website (which are collectively referred to in these Terms & Conditions as the "VulnIQ Service").
                            </p>
                            <p>
                                You are agreeing to be bound by these Terms & Conditions. If you do not agree to these Terms & Conditions, please do not use the VulnIQ Service. In these Terms & Conditions, "you" refers both to you as an individual and to the entity you represent. If you violate any of these Terms & Conditions, we reserve the right to cancel your account or block access to your account without notice.
                            </p>
                        </Section>

                        {/* Meanings */}
                        <Section id="meanings" title="Meanings" icon={FileText}>
                            <p>For this Terms & Conditions:</p>
                            <ul className="space-y-3">
                                <li><strong>Cookie:</strong> small amount of data generated by a website and saved by your web browser. It is used to identify your browser, provide analytics, remember information about you such as your language preference or login information.</li>
                                <li><strong>Company:</strong> when this policy mentions "Company," "we," "us," or "our," it refers to VulnIQ, that is responsible for your information under this Terms & Conditions.</li>
                                <li><strong>Country:</strong> where VulnIQ or the owners/founders of VulnIQ are based, in this case is Romania.</li>
                                <li><strong>Device:</strong> any internet connected device such as a phone, tablet, computer or any other device that can be used to visit VulnIQ and use the services.</li>
                                <li><strong>Service:</strong> refers to the service provided by VulnIQ as described in the relative terms (if available) and on this platform.</li>
                                <li><strong>Third-party service:</strong> refers to advertisers, contest sponsors, promotional and marketing partners, and others who provide our content or whose products or services we think may interest you.</li>
                                <li><strong>Website:</strong> VulnIQ's site.</li>
                                <li><strong>You:</strong> a person or entity that is registered with VulnIQ to use the Services.</li>
                            </ul>
                        </Section>

                        {/* Restrictions */}
                        <Section id="restrictions" title="Restrictions" icon={Shield}>
                            <p>You agree not to, and you will not permit others to:</p>
                            <ul className="space-y-3">
                                <li>License, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose or otherwise commercially exploit the app or make the platform available to any third party.</li>
                                <li>Modify, make derivative works of, disassemble, decrypt, reverse compile or reverse engineer any part of the app.</li>
                                <li>Remove, alter or obscure any proprietary notice (including any notice of copyright or trademark) of VulnIQ or its affiliates, partners, suppliers or the licensors of the app.</li>
                            </ul>
                        </Section>

                        {/* Return and Refund Policy */}
                        <Section id="refund" title="Return and Refund Policy" icon={RefreshCw}>
                            <p>
                                Thanks for shopping at VulnIQ. We appreciate the fact that you like to buy the stuff we build. We also want to make sure you have a rewarding experience while you're exploring, evaluating, and purchasing our products.
                            </p>
                            <p>
                                As with any shopping experience, there are terms and conditions that apply to transactions at VulnIQ. We'll be as brief as our attorneys will allow. The main thing to remember is that by placing an order or making a purchase at VulnIQ, you agree to the terms along with VulnIQ's Privacy Policy.
                            </p>
                            <p>
                                If, for any reason, You are not completely satisfied with any good or service that we provide, don't hesitate to contact us and we will discuss any of the issues you are going through with our product.
                            </p>
                        </Section>

                        {/* Your Suggestions */}
                        <Section id="suggestions" title="Your Suggestions" icon={FileText}>
                            <p>
                                Any feedback, comments, ideas, improvements or suggestions (collectively, "Suggestions") provided by you to VulnIQ with respect to the app shall remain the sole and exclusive property of VulnIQ.
                            </p>
                            <p>
                                VulnIQ shall be free to use, copy, modify, publish, or redistribute the Suggestions for any purpose and in any way without any credit or any compensation to you.
                            </p>
                        </Section>

                        {/* Your Consent */}
                        <Section id="consent" title="Your Consent" icon={FileText}>
                            <p>
                                We've updated our Terms & Conditions to provide you with complete transparency into what is being set when you visit our site and how it's being used. By using our app, registering an account, or making a purchase, you hereby consent to our Terms & Conditions.
                            </p>
                        </Section>

                        {/* Links to Other Websites */}
                        <Section id="links" title="Links to Other Websites" icon={FileText}>
                            <p>
                                This Terms & Conditions applies only to the Services. The Services may contain links to other websites not operated or controlled by VulnIQ. We are not responsible for the content, accuracy or opinions expressed in such websites, and such websites are not investigated, monitored or checked for accuracy or completeness by us.
                            </p>
                            <p>
                                Please remember that when you use a link to go from the Services to another website, our Terms & Conditions are no longer in effect. Your browsing and interaction on any other website, including those that have a link on our platform, is subject to that website's own rules and policies. Such third parties may use their own cookies or other methods to collect information about you.
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

                        {/* Changes To Our Terms & Conditions */}
                        <Section id="changes" title="Changes To Our Terms & Conditions" icon={RefreshCw}>
                            <p>
                                You acknowledge and agree that VulnIQ may stop (permanently or temporarily) providing the Service (or any features within the Service) to you or to users generally at VulnIQ's sole discretion, without prior notice to you.
                            </p>
                            <p>
                                You may stop using the Service at any time. You do not need to specifically inform VulnIQ when you stop using the Service. You acknowledge and agree that if VulnIQ disables access to your account, you may be prevented from accessing the Service, your account details or any files or other materials which is contained in your account.
                            </p>
                            <p>
                                If we decide to change our Terms & Conditions, we will post those changes on this page, and/or update the Terms & Conditions modification date below.
                            </p>
                        </Section>

                        {/* Modifications to Our app */}
                        <Section id="modifications" title="Modifications to Our App" icon={RefreshCw}>
                            <p>
                                VulnIQ reserves the right to modify, suspend or discontinue, temporarily or permanently, the app or any service to which it connects, with or without notice and without liability to you.
                            </p>
                        </Section>

                        {/* Updates to Our app */}
                        <Section id="updates" title="Updates to Our App" icon={RefreshCw}>
                            <p>
                                VulnIQ may from time to time provide enhancements or improvements to the features/functionality of the app, which may include patches, bug fixes, updates, upgrades and other modifications ("Updates").
                            </p>
                            <p>
                                Updates may modify or delete certain features and/or functionalities of the app. You agree that VulnIQ has no obligation to (i) provide any Updates, or (ii) continue to provide or enable any particular features and/or functionalities of the app to you.
                            </p>
                            <p>
                                You further agree that all Updates will be (i) deemed to constitute an integral part of the app, and (ii) subject to the terms and conditions of this Agreement.
                            </p>
                        </Section>

                        {/* Third-Party Services */}
                        <Section id="third-party" title="Third-Party Services" icon={FileText}>
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

                        {/* Term and Termination */}
                        <Section id="termination" title="Term and Termination" icon={AlertTriangle}>
                            <p>
                                This Agreement shall remain in effect until terminated by you or VulnIQ.
                            </p>
                            <p>
                                VulnIQ may, in its sole discretion, at any time and for any or no reason, suspend or terminate this Agreement with or without prior notice.
                            </p>
                            <p>
                                This Agreement will terminate immediately, without prior notice from VulnIQ, in the event that you fail to comply with any provision of this Agreement. You may also terminate this Agreement by deleting the app and all copies thereof from your computer.
                            </p>
                            <p>
                                Upon termination of this Agreement, you shall cease all use of the app and delete all copies of the app from your computer. Termination of this Agreement will not limit any of VulnIQ's rights or remedies at law or in equity in case of breach by you (during the term of this Agreement) of any of your obligations under the present Agreement.
                            </p>
                        </Section>

                        {/* Copyright Infringement Notice */}
                        <Section id="copyright" title="Copyright Infringement Notice" icon={Scale}>
                            <p>
                                If you are a copyright owner or such owner's agent and believe any material on our app constitutes an infringement on your copyright, please contact us setting forth the following information:
                            </p>
                            <ul className="space-y-2">
                                <li>(a) a physical or electronic signature of the copyright owner or a person authorized to act on his behalf;</li>
                                <li>(b) identification of the material that is claimed to be infringing;</li>
                                <li>(c) your contact information, including your address, telephone number, and an email;</li>
                                <li>(d) a statement by you that you have a good faith belief that use of the material is not authorized by the copyright owners; and</li>
                                <li>(e) a statement that the information in the notification is accurate, and, under penalty of perjury you are authorized to act on behalf of the owner.</li>
                            </ul>
                        </Section>

                        {/* Indemnification */}
                        <Section id="indemnification" title="Indemnification" icon={Shield}>
                            <p>
                                You agree to indemnify and hold VulnIQ and its parents, subsidiaries, affiliates, officers, employees, agents, partners and licensors (if any) harmless from any claim or demand, including reasonable attorneys' fees, due to or arising out of your:
                            </p>
                            <ul className="space-y-2">
                                <li>(a) use of the app;</li>
                                <li>(b) violation of this Agreement or any law or regulation; or</li>
                                <li>(c) violation of any right of a third party.</li>
                            </ul>
                        </Section>

                        {/* No Warranties */}
                        <Section id="warranties" title="No Warranties" icon={AlertTriangle}>
                            <p>
                                The app is provided to you "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, VulnIQ, on its own behalf and on behalf of its affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the app, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise out of course of dealing, course of performance, usage or trade practice.
                            </p>
                            <p>
                                Without limitation to the foregoing, VulnIQ provides no warranty or undertaking, and makes no representation of any kind that the app will meet your requirements, achieve any intended results, be compatible or work with any other software, systems or services, operate without interruption, meet any performance or reliability standards or be error free or that any errors or defects can or will be corrected.
                            </p>
                            <p>
                                Without limiting the foregoing, neither VulnIQ nor any VulnIQ's provider makes any representation or warranty of any kind, express or implied: (i) as to the operation or availability of the app, or the information, content, and materials or products included thereon; (ii) that the app will be uninterrupted or error-free; (iii) as to the accuracy, reliability, or currency of any information or content provided through the app; or (iv) that the app, its servers, the content, or e-mails sent from or on behalf of VulnIQ are free of viruses, scripts, trojan horses, worms, malware, timebombs or other harmful components.
                            </p>
                            <p>
                                Some jurisdictions do not allow the exclusion of or limitations on implied warranties or the limitations on the applicable statutory rights of a consumer, so some or all of the above exclusions and limitations may not apply to you.
                            </p>
                        </Section>

                        {/* Limitation of Liability */}
                        <Section id="liability" title="Limitation of Liability" icon={AlertTriangle}>
                            <p>
                                Notwithstanding any damages that you might incur, the entire liability of VulnIQ and any of its suppliers under any provision of this Agreement and your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by you for the app.
                            </p>
                            <p>
                                To the maximum extent permitted by applicable law, in no event shall VulnIQ or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, for loss of data or other information, for business interruption, for personal injury, for loss of privacy arising out of or in any way related to the use of or inability to use the app, third-party software and/or third-party hardware used with the app, or otherwise in connection with any provision of this Agreement), even if VulnIQ or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.
                            </p>
                            <p>
                                Some states/jurisdictions do not allow the exclusion or limitation of incidental or consequential damages, so the above limitation or exclusion may not apply to you.
                            </p>
                        </Section>

                        {/* Severability */}
                        <Section id="severability" title="Severability" icon={Scale}>
                            <p>
                                If any provision of this Agreement is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.
                            </p>
                            <p>
                                This Agreement, together with the Privacy Policy and any other legal notices published by VulnIQ on the Services, shall constitute the entire agreement between you and VulnIQ concerning the Services. If any provision of this Agreement is deemed invalid by a court of competent jurisdiction, the invalidity of such provision shall not affect the validity of the remaining provisions of this Agreement, which shall remain in full force and effect.
                            </p>
                            <p>
                                No waiver of any term of this Agreement shall be deemed a further or continuing waiver of such term or any other term, and VulnIQ's failure to assert any right or provision under this Agreement shall not constitute a waiver of such right or provision.
                            </p>
                            <p className="font-semibold">
                                YOU AND VulnIQ AGREE THAT ANY CAUSE OF ACTION ARISING OUT OF OR RELATED TO THE SERVICES MUST COMMENCE WITHIN ONE (1) YEAR AFTER THE CAUSE OF ACTION ACCRUES. OTHERWISE, SUCH CAUSE OF ACTION IS PERMANENTLY BARRED.
                            </p>
                        </Section>

                        {/* Waiver */}
                        <Section id="waiver" title="Waiver" icon={Scale}>
                            <p>
                                Except as provided herein, the failure to exercise a right or to require performance of an obligation under this Agreement shall not effect a party's ability to exercise such right or require such performance at any time thereafter nor shall be the waiver of a breach constitute waiver of any subsequent breach.
                            </p>
                            <p>
                                No failure to exercise, and no delay in exercising, on the part of either party, any right or any power under this Agreement shall operate as a waiver of that right or power. Nor shall any single or partial exercise of any right or power under this Agreement preclude further exercise of that or any other right granted herein.
                            </p>
                            <p>
                                In the event of a conflict between this Agreement and any applicable purchase or other terms, the terms of this Agreement shall govern.
                            </p>
                        </Section>

                        {/* Amendments to this Agreement */}
                        <Section id="amendments" title="Amendments to this Agreement" icon={RefreshCw}>
                            <p>
                                VulnIQ reserves the right, at its sole discretion, to modify or replace this Agreement at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                            </p>
                            <p>
                                By continuing to access or use our app after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use VulnIQ.
                            </p>
                        </Section>

                        {/* Entire Agreement */}
                        <Section id="entire" title="Entire Agreement" icon={FileText}>
                            <p>
                                The Agreement constitutes the entire agreement between you and VulnIQ regarding your use of the app and supersedes all prior and contemporaneous written or oral agreements between you and VulnIQ.
                            </p>
                            <p>
                                You may be subject to additional terms and conditions that apply when you use or purchase other VulnIQ's services, which VulnIQ will provide to you at the time of such use or purchase.
                            </p>
                        </Section>

                        {/* Updates to Our Terms */}
                        <Section id="updates-terms" title="Updates to Our Terms" icon={RefreshCw}>
                            <p>
                                We may change our Service and policies, and we may need to make changes to these Terms so that they accurately reflect our Service and policies. Unless otherwise required by law, we will notify you (for example, through our Service) before we make changes to these Terms and give you an opportunity to review them before they go into effect.
                            </p>
                            <p>
                                Then, if you continue to use the Service, you will be bound by the updated Terms. If you do not want to agree to these or any updated Terms, you can delete your account.
                            </p>
                        </Section>

                        {/* Intellectual Property */}
                        <Section id="intellectual" title="Intellectual Property" icon={Shield}>
                            <p>
                                The app and its entire contents, features and functionality (including but not limited to all information, software, text, displays, images, video and audio, and the design, selection and arrangement thereof), are owned by VulnIQ, its licensors or other providers of such material and are protected by Romania and international copyright, trademark, patent, trade secret and other intellectual property or proprietary rights laws.
                            </p>
                            <p>
                                The material may not be copied, modified, reproduced, downloaded or distributed in any way, in whole or in part, without the express prior written permission of VulnIQ, unless and except as is expressly provided in these Terms & Conditions. Any unauthorized use of the material is prohibited.
                            </p>
                        </Section>

                        {/* Agreement to Arbitrate */}
                        <Section id="arbitrate" title="Agreement to Arbitrate" icon={Gavel}>
                            <p>
                                This section applies to any dispute EXCEPT IT DOESN'T INCLUDE A DISPUTE RELATING TO CLAIMS FOR INJUNCTIVE OR EQUITABLE RELIEF REGARDING THE ENFORCEMENT OR VALIDITY OF YOUR OR VulnIQ's INTELLECTUAL PROPERTY RIGHTS.
                            </p>
                            <p>
                                The term "dispute" means any dispute, action, or other controversy between you and VulnIQ concerning the Services or this agreement, whether in contract, warranty, tort, statute, regulation, ordinance, or any other legal or equitable basis. "Dispute" will be given the broadest possible meaning allowable under law.
                            </p>
                        </Section>

                        {/* Notice of Dispute */}
                        <Section id="dispute" title="Notice of Dispute" icon={Mail}>
                            <p>
                                In the event of a dispute, you or VulnIQ must give the other a Notice of Dispute, which is a written statement that sets forth the name, address, and contact information of the party giving it, the facts giving rise to the dispute, and the relief requested.
                            </p>
                            <p>
                                You must send any Notice of Dispute via email to: <a href="mailto:emanuel.rusu03@e-uvt.ro" className="text-[var(--brand-accent)] hover:underline">emanuel.rusu03@e-uvt.ro</a>. VulnIQ will send any Notice of Dispute to you by mail to your address if we have it, or otherwise to your email address.
                            </p>
                            <p>
                                You and VulnIQ will attempt to resolve any dispute through informal negotiation within sixty (60) days from the date the Notice of Dispute is sent. After sixty (60) days, you or VulnIQ may commence arbitration.
                            </p>
                        </Section>

                        {/* Binding Arbitration */}
                        <Section id="binding" title="Binding Arbitration" icon={Gavel}>
                            <p>
                                If you and VulnIQ don't resolve any dispute by informal negotiation, any other effort to resolve the dispute will be conducted exclusively by binding arbitration as described in this section. You are giving up the right to litigate (or participate in as a party or class member) all disputes in court before a judge or jury.
                            </p>
                            <p>
                                The dispute shall be settled by binding arbitration in accordance with the commercial arbitration rules of the American Arbitration Association. Either party may seek any interim or preliminary injunctive relief from any court of competent jurisdiction, as necessary to protect the party's rights or property pending the completion of arbitration.
                            </p>
                            <p>
                                Any and all legal, accounting, and other costs, fees, and expenses incurred by the prevailing party shall be borne by the non-prevailing party.
                            </p>
                        </Section>

                        {/* Submissions and Privacy */}
                        <Section id="submissions" title="Submissions and Privacy" icon={Shield}>
                            <p>
                                In the event that you submit or post any ideas, creative suggestions, designs, photographs, information, advertisements, data or proposals, including ideas for new or improved products, services, features, technologies or promotions, you expressly agree that such submissions will automatically be treated as non-confidential and non-proprietary and will become the sole property of VulnIQ without any compensation or credit to you whatsoever.
                            </p>
                            <p>
                                VulnIQ and its affiliates shall have no obligations with respect to such submissions or posts and may use the ideas contained in such submissions or posts for any purposes in any medium in perpetuity, including, but not limited to, developing, manufacturing, and marketing products and services using such ideas.
                            </p>
                        </Section>

                        {/* Promotions */}
                        <Section id="promotions" title="Promotions" icon={FileText}>
                            <p>
                                VulnIQ may, from time to time, include contests, promotions, sweepstakes, or other activities ("Promotions") that require you to submit material or information concerning yourself. Please note that all Promotions may be governed by separate rules that may contain certain eligibility requirements, such as restrictions as to age and geographic location.
                            </p>
                            <p>
                                You are responsible to read all Promotions rules to determine whether or not you are eligible to participate. If you enter any Promotion, you agree to abide by and to comply with all Promotions Rules.
                            </p>
                            <p>
                                Additional terms and conditions may apply to purchases of goods or services on or through the Services, which terms and conditions are made a part of this Agreement by this reference.
                            </p>
                        </Section>

                        {/* Typographical Errors */}
                        <Section id="errors" title="Typographical Errors" icon={AlertTriangle}>
                            <p>
                                In the event a product and/or service is listed at an incorrect price or with incorrect information due to typographical error, we shall have the right to refuse or cancel any orders placed for the product and/or service listed at the incorrect price.
                            </p>
                            <p>
                                We shall have the right to refuse or cancel any such order whether or not the order has been confirmed and your credit card charged. If your credit card has already been charged for the purchase and your order is canceled, we shall immediately issue a credit to your credit card account or other payment account in the amount of the charge.
                            </p>
                        </Section>

                        {/* Miscellaneous */}
                        <Section id="miscellaneous" title="Miscellaneous" icon={FileText}>
                            <p>
                                If for any reason a court of competent jurisdiction finds any provision or portion of these Terms & Conditions to be unenforceable, the remainder of these Terms & Conditions will continue in full force and effect. Any waiver of any provision of these Terms & Conditions will be effective only if in writing and signed by an authorized representative of VulnIQ.
                            </p>
                            <p>
                                VulnIQ will be entitled to injunctive or other equitable relief (without the obligations of posting any bond or surety) in the event of any breach or anticipatory breach by you. VulnIQ operates and controls the VulnIQ Service from its offices in Romania. The Service is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation.
                            </p>
                            <p>
                                Accordingly, those persons who choose to access the VulnIQ Service from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.
                            </p>
                            <p>
                                These Terms & Conditions (which include and incorporate the VulnIQ Privacy Policy) contains the entire understanding, and supersedes all prior understandings, between you and VulnIQ concerning its subject matter, and cannot be changed or modified by you. The section headings used in this Agreement are for convenience only and will not be given any legal import.
                            </p>
                        </Section>

                        {/* Disclaimer */}
                        <Section id="disclaimer" title="Disclaimer" icon={AlertTriangle}>
                            <p>
                                VulnIQ is not responsible for any content, code or any other imprecision.
                            </p>
                            <p>
                                VulnIQ does not provide warranties or guarantees.
                            </p>
                            <p>
                                In no event shall VulnIQ be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in connection with the use of the Service or the contents of the Service. VulnIQ reserves the right to make additions, deletions, or modifications to the contents on the Service at any time without prior notice.
                            </p>
                            <p>
                                The VulnIQ Service and its contents are provided "as is" and "as available" without any warranty or representations of any kind, whether express or implied. VulnIQ is a distributor and not a publisher of the content supplied by third parties; as such, VulnIQ exercises no editorial control over such content and makes no warranty or representation as to the accuracy, reliability or currency of any information, content, service or merchandise provided through or accessible via the VulnIQ Service.
                            </p>
                            <p>
                                Without limiting the foregoing, VulnIQ specifically disclaims all warranties and representations in any content transmitted on or in connection with the VulnIQ Service or on sites that may appear as links on the VulnIQ Service, or in the products provided as a part of, or otherwise in connection with, the VulnIQ Service, including without limitation any warranties of merchantability, fitness for a particular purpose or non-infringement of third party rights.
                            </p>
                            <p>
                                No oral advice or written information given by VulnIQ or any of its affiliates, employees, officers, directors, agents, or the like will create a warranty. Price and availability information is subject to change without notice. Without limiting the foregoing, VulnIQ does not warrant that the VulnIQ Service will be uninterrupted, uncorrupted, timely, or error-free.
                            </p>
                        </Section>

                        {/* Contact Us */}
                        <Section id="contact" title="Contact Us" icon={Mail}>
                            <p>
                                Don't hesitate to contact us if you have any questions.
                            </p>
                            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
                                <p className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <strong>Via Email:</strong>{' '}
                                    <a href="mailto:emanuel.rusu03@e-uvt.ro" className="text-primary hover:underline">
                                        emanuel.rusu03@e-uvt.ro
                                    </a>
                                </p>
                            </div>
                        </Section>
                    </div>

                    {/* Back to top button */}
                    <div className="mt-12 flex justify-center">
                        <Button variant="outline" onClick={scrollToTop}>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Back to Top
                        </Button>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-muted/30 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} VulnIQ. All rights reserved.</p>
                    <div className="mt-2 flex justify-center gap-4">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Terms & Conditions
                        </Link>
                    </div>
                </div>
            </footer>
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

