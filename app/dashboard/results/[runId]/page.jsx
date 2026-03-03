import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Results } from '@/components/dashboard/results-page/results';

export const metadata = {
  title: 'Analysis Results | VulnIQ',
  description: 'Real-time security analysis results',
};

export default async function ResultsPage({ params }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { runId } = params;

  return (
    <div className="h-full flex flex-col">
      <Results runId={runId} userId={session.user.id} />
    </div>
  );
}
