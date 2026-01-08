import { redirect } from 'next/navigation';

export const metadata = {
  title: "Demo",
  description: "Try VulnIQ's AI-powered security code review demo. Experience vulnerability detection and automated remediation without signing up.",
  openGraph: {
    title: "Demo | VulnIQ",
    description: "Try VulnIQ's AI-powered security code review demo. Experience vulnerability detection and automated remediation without signing up.",
  },
};

export default function DemoPage() {
    redirect('/demo/home');
}

