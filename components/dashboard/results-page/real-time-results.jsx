'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrchestrator } from '@/hooks/use-orchestrator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Code, 
  Bug,
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
} from 'lucide-react';
import { getSeverityBadgeVariant, getSeverityColors } from '@/lib/severity-utils';

export function RealTimeResults({ runId, userId }) {
  const router = useRouter();
  const { events, runStatus, error, getStatus } = useOrchestrator();
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Initializing');
  const [useCasesProcessed, setUseCasesProcessed] = useState(0);
  const [totalUseCases, setTotalUseCases] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Process events to extract vulnerabilities and update progress
  useEffect(() => {
    events.forEach((event) => {
      switch (event.type) {
        case 'run_started':
          setTotalUseCases(event.detail?.totalUseCases || 0);
          setCurrentPhase('Analyzing');
          setProgress(10);
          break;

        case 'usecase_started':
          setCurrentPhase(`Processing: ${event.detail?.useCaseName || 'Use Case'}`);
          break;

        case 'usecase_finished':
          setUseCasesProcessed(prev => {
            const updated = prev + 1;
            // Update progress using the fresh count
            if (totalUseCases > 0) {
              setProgress(Math.min(90, 10 + (updated / totalUseCases) * 80));
            }
            return updated;
          });
          // Extract vulnerabilities from the event
          if (event.detail?.vulnerabilities) {
            setVulnerabilities(prev => [...prev, ...event.detail.vulnerabilities]);
          }
          break;

        case 'run_finished':
          setCurrentPhase('Complete');
          setProgress(100);
          break;

        case 'run_failed':
          setCurrentPhase('Failed');
          break;
      }
    });
  }, [events, totalUseCases]);


  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <XCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low':
        return <Shield className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const handleExport = () => {
    const data = {
      runId,
      timestamp: new Date().toISOString(),
      vulnerabilities,
      summary: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-analysis-${runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const summary = {
        totalVulnerabilities: vulnerabilities.length,
        criticalCount: vulnerabilities.filter(v => v.severity?.toLowerCase() === 'critical').length,
        highCount: vulnerabilities.filter(v => v.severity?.toLowerCase() === 'high').length,
        mediumCount: vulnerabilities.filter(v => v.severity?.toLowerCase() === 'medium').length,
        lowCount: vulnerabilities.filter(v => v.severity?.toLowerCase() === 'low').length,
      };

      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          runId,
          vulnerabilities: vulnerabilities.map(v => ({
            id: v.id,
            title: v.title || v.name || '',
            severity: v.severity,
            type: v.type || v.category || '',
            details: v.description || v.details || '',
            fileName: v.filePath || v.fileName || '',
          })),
          summary,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${runId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Failed to generate PDF report');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Analysis Results</h1>
          <p className="text-muted-foreground mt-1">
            Run ID: <code className="text-xs">{runId}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          {runStatus === 'completed' && vulnerabilities.length > 0 && (
            <>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button onClick={handleExportPdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                {isGeneratingPdf ? 'Generating...' : 'Download PDF Report'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analysis Progress</CardTitle>
              <CardDescription>{currentPhase}</CardDescription>
            </div>
            <Badge variant={
              runStatus === 'completed' ? 'success' :
              runStatus === 'failed' ? 'destructive' :
              'default'
            }>
              {runStatus === 'RUNNING' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {runStatus === 'completed' && <CheckCircle2 className="mr-2 h-4 w-4" />}
              {runStatus === 'failed' && <XCircle className="mr-2 h-4 w-4" />}
              {runStatus || 'Running'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          {totalUseCases > 0 && (
            <div className="text-sm text-muted-foreground">
              Processed {useCasesProcessed} of {totalUseCases} use cases
            </div>
          )}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vulnerabilities Summary */}
      {vulnerabilities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vulnerabilities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-destructive">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {vulnerabilities.filter(v => v.severity === 'critical').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-severity-high">High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-severity-high">
                {vulnerabilities.filter(v => v.severity === 'high').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-severity-medium">Medium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-severity-medium">
                {vulnerabilities.filter(v => v.severity === 'medium').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vulnerabilities List */}
      <Card>
        <CardHeader>
          <CardTitle>Discovered Vulnerabilities</CardTitle>
          <CardDescription>
            {vulnerabilities.length === 0 
              ? 'Waiting for analysis results...' 
              : `Found ${vulnerabilities.length} potential security issues`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[32rem] w-full">
            {vulnerabilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {runStatus === 'completed' ? (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 mb-4">
                      <Shield className="h-7 w-7 text-success" />
                    </div>
                    <p className="text-base font-medium">No vulnerabilities found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your code looks secure! No security issues were detected.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{currentPhase}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Security agents are analyzing your code…
                        </p>
                      </div>
                      {/* Phase indicators */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span className={progress >= 5 ? 'text-primary font-medium' : ''}>Connecting</span>
                        <span>→</span>
                        <span className={progress >= 10 ? 'text-primary font-medium' : ''}>Analyzing</span>
                        <span>→</span>
                        <span className={progress >= 90 ? 'text-primary font-medium' : ''}>Reporting</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {vulnerabilities.map((vuln, index) => {
                  const sevColors = getSeverityColors(vuln.severity?.charAt(0).toUpperCase() + vuln.severity?.slice(1));
                  return (
                  <Card key={index} className={`border-l-4 ${sevColors.borderLeft}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(vuln.severity)}
                          <CardTitle className="text-base">{vuln.title || '—'}</CardTitle>
                        </div>
                        <Badge variant={getSeverityBadgeVariant(vuln.severity)}>
                          {vuln.severity || '—'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {vuln.description || '—'}
                      </p>
                      {vuln.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <Code className="h-4 w-4" />
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {vuln.location}
                          </code>
                        </div>
                      )}
                      {vuln.recommendation && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Recommendation:</p>
                          <p className="text-sm text-muted-foreground">{vuln.recommendation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Completion CTA */}
      {runStatus === 'completed' && vulnerabilities.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold">Analysis Complete</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Found {vulnerabilities.length} potential {vulnerabilities.length === 1 ? 'issue' : 'issues'}. View the full results for detailed analysis, attack paths, and fix suggestions.
              </p>
            </div>
            <Button onClick={() => router.push(`/dashboard?page=Results`)} className="gap-2 shrink-0 ml-4">
              View Full Results
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
