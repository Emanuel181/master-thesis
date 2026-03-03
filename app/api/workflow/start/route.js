import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { vectorizeAndWait } from "@/lib/vectorization";

// AWS SDK imports
import { SFNClient, StartExecutionCommand, DescribeExecutionCommand, GetExecutionHistoryCommand } from "@aws-sdk/client-sfn";
import { BedrockAgentRuntimeClient } from "@aws-sdk/client-bedrock-agent-runtime";
import { BedrockAgentClient, StartIngestionJobCommand } from "@aws-sdk/client-bedrock-agent";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize AWS clients with explicit credentials from environment
const awsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const sfnClient = new SFNClient(awsConfig);
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient(awsConfig);
const bedrockAgentClient = new BedrockAgentClient(awsConfig);
const s3Client = new S3Client(awsConfig);

const startWorkflowSchema = z.object({
  useCaseIds: z.array(z.string()).min(1, "At least one use case must be selected"),
  selectedDocuments: z.array(z.string()).min(1, "At least one knowledge base document must be selected for RAG-enabled security review"), // Array of PDF IDs - REQUIRED for RAG
  agentConfigurations: z.object({
    reviewer: z.object({
      enabled: z.boolean().default(true),
      modelId: z.string().optional(),
      customPrompt: z.string().optional(), // Predefined prompt text
      promptId: z.string().optional(), // Prompt ID for tracking
    }).optional(),
    implementer: z.object({
      enabled: z.boolean().default(false),
      modelId: z.string().optional(),
      customPrompt: z.string().optional(),
      promptId: z.string().optional(),
    }).optional(),
    tester: z.object({
      enabled: z.boolean().default(false),
      modelId: z.string().optional(),
      customPrompt: z.string().optional(),
      promptId: z.string().optional(),
    }).optional(),
    reporter: z.object({
      enabled: z.boolean().default(true),
      modelId: z.string().optional(),
      customPrompt: z.string().optional(),
      promptId: z.string().optional(),
    }).optional(),
  }).optional(),
  metadata: z.object({
    code: z.union([
      z.string(), // Single file: just the code string
      z.object({  // Multi-file project
        type: z.literal('project'),
        files: z.array(z.object({
          path: z.string(),
          content: z.string(),
          language: z.string(),
        })),
        projectName: z.string().optional(),
      }),
      z.object({  // Single file with metadata
        type: z.literal('single'),
        content: z.string(),
        fileName: z.string().optional(),
      }),
    ]),
    codeType: z.string(),
    timestamp: z.string().optional(),
  }).optional(),
});

/**
 * SECURITY CONSTRAINTS for Reviewer Agent:
 * 1. Analysis MUST be strictly limited to submitted source code
 * 2. ONLY explicitly selected PDF documents can be referenced
 * 3. ONLY the predefined prompt assigned to the agent can be used
 * 4. NO inference or use of external knowledge beyond provided inputs
 *
 * These constraints are enforced both here and in the Step Functions workflow
 */

/**
 * POST /api/workflow/start
 * Start a new workflow run with RAG-enabled agents
 */
export async function POST(request) {
  try {
    console.log('[workflow/start] Request received');

    const session = await auth();
    if (!session?.user?.email) {
      console.log('[workflow/start] Unauthorized - no session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('[workflow/start] Request body:', JSON.stringify(body, null, 2));

    const validatedData = startWorkflowSchema.parse(body);
    console.log('[workflow/start] Validation passed');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, bedrockDataSourceId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch use cases with their documents
    // CRITICAL: Only include documents that are in the selectedDocuments array (RAG requirement)
    const useCases = await prisma.knowledgeBaseCategory.findMany({
      where: {
        id: { in: validatedData.useCaseIds },
        userId: user.id,
      },
      include: {
        pdfs: {
          where: { id: { in: validatedData.selectedDocuments } },
          orderBy: { order: "asc" },
        },
      },
    });

    if (useCases.length === 0) {
      return NextResponse.json(
        { error: "No valid use cases found" },
        { status: 404 }
      );
    }

    // SECURITY: Log document selection for audit trail
    const totalSelectedDocs = useCases.reduce((sum, uc) => sum + uc.pdfs.length, 0);
    console.log(`[workflow/start] Security Audit: Using ${totalSelectedDocs} explicitly selected documents for analysis`);
    console.log(`[workflow/start] Selected document IDs:`, validatedData.selectedDocuments);

    // Log agent configuration for debugging
    const reviewerConfig = validatedData.agentConfigurations?.reviewer;
    console.log(`[workflow/start] Reviewer config:`, reviewerConfig);

    // Check if documents need vectorization — all documents MUST be vectorized for RAG
    const documentsToVectorize = [];
    for (const useCase of useCases) {
      for (const pdf of useCase.pdfs) {
        if (!pdf.vectorized || pdf.embeddingStatus !== "completed") {
          documentsToVectorize.push(pdf);
        }
      }
    }

    // Trigger vectorization for any un-vectorized documents
    let ragEnabled = true;
    if (documentsToVectorize.length > 0) {
      console.log(`[workflow/start] ${documentsToVectorize.length} document(s) need vectorization before RAG can work`);
      const docNames = documentsToVectorize.map(d => d.title).join(', ');
      console.log(`[workflow/start] Un-vectorized documents: ${docNames}`);

      try {
        // BLOCKING: wait for vectorization to finish before launching the workflow,
        // otherwise the Lambda will query Bedrock KB and get no results.
        // Uses the user's per-user data source for vector isolation.
        const vectorResult = await vectorizeAndWait(documentsToVectorize.map(d => d.id), user.id);

        if (vectorResult?.skipped) {
          // Bedrock KB not configured — proceed without vector search
          console.warn('[workflow/start] Vectorization skipped (Bedrock KB not configured). Documents will be used as raw context.');
          ragEnabled = false;
        } else {
          console.log(`[workflow/start] Vectorization complete for ${documentsToVectorize.length} document(s)`);
        }
      } catch (error) {
        console.error("[workflow/start] Vectorization failed:", error);
        return NextResponse.json(
          {
            error: "Failed to vectorize selected documents",
            details: `Could not vectorize: ${docNames}. ${error.message}`,
          },
          { status: 500 }
        );
      }
    }

    // Create workflow run record
    const workflowRun = await prisma.workflowRun.create({
      data: {
        userId: user.id,
        status: "pending",
        totalUseCases: useCases.length,
        completedUseCases: 0,
        metadata: validatedData.metadata || {}, // Store code and other metadata
      },
    });

    // Create use case run records
    await prisma.workflowUseCaseRun.createMany({
      data: useCases.map((useCase) => ({
        workflowRunId: workflowRun.id,
        useCaseId: useCase.id,
        useCaseTitle: useCase.title,
        status: "pending",
      })),
    });

    // Prepare Step Functions input with strict security constraints
    const stepFunctionsInput = {
      runId: workflowRun.id,
      userId: user.id,
      userDataSourceId: user.bedrockDataSourceId || null, // Per-user vector isolation
      ragEnabled, // Whether Bedrock KB vectorization is available for RAG queries
      // SECURITY CONSTRAINTS - These must be enforced by the Step Functions workflow
      securityConstraints: {
        strictDocumentScope: true, // Only use documents explicitly listed below
        noExternalKnowledge: true, // Do not infer or use knowledge outside provided inputs
        predefinedPromptsOnly: true, // Only use the prompts provided in agent configurations
        documentIds: validatedData.selectedDocuments, // Explicit list of allowed document IDs (required)
      },
      useCases: await Promise.all(useCases.map(async (useCase) => {
        // Extract code payload - handle both single file and project
        let codePayload = validatedData.metadata?.code || '';
        let codeType = validatedData.metadata?.codeType || 'Unknown';

        // If code is an object (project or single with metadata), keep it as is
        // If it's a string, convert to single file format for consistency
        if (typeof codePayload === 'string') {
          codePayload = {
            type: 'single',
            content: codePayload,
            fileName: 'main'
          };
        }

        // For large payloads (projects), store in S3 and pass reference
        let codeReference = codePayload;
        if (codePayload.type === 'project' && codePayload.files && codePayload.files.length > 0) {
          try {
            // Upload code to S3
            const s3Key = `workflow-runs/${workflowRun.id}/use-cases/${useCase.id}/code.json`;
            const uploadCommand = new PutObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: s3Key,
              Body: JSON.stringify(codePayload),
              ContentType: 'application/json',
            });

            await s3Client.send(uploadCommand);
            console.log(`[workflow/start] Uploaded code to S3: ${s3Key}`);

            // Replace with S3 reference
            codeReference = {
              type: 'project',
              s3Bucket: process.env.AWS_S3_BUCKET_NAME,
              s3Key: s3Key,
              projectName: codePayload.projectName,
              fileCount: codePayload.files.length,
            };
          } catch (s3Error) {
            console.error('[workflow/start] Error uploading to S3:', s3Error);
            // Fall back to inline code (may fail if too large)
            codeReference = codePayload;
          }
        }

        return {
          id: useCase.id,
          title: useCase.title,
          content: useCase.content,
          runId: workflowRun.id,  // Include runId in each use case
          userId: user.id,         // Include userId in each use case
          userDataSourceId: user.bedrockDataSourceId || null, // Per-user vector isolation
          code: codeReference,     // Include code (single, project, or S3 reference)
          codeType: codeType,      // Include codeType
          // SECURITY: Only include explicitly selected documents
          selectedDocuments: useCase.pdfs.map(pdf => ({
            id: pdf.id,
            title: pdf.title,
            s3Key: pdf.s3Key,
            vectorized: pdf.vectorized,
          })),
          // SECURITY: Agent configurations with prompt IDs for tracking
          enableReviewer: validatedData.agentConfigurations?.reviewer?.enabled ?? true,
          reviewerModel: validatedData.agentConfigurations?.reviewer?.modelId,
          reviewerPrompt: validatedData.agentConfigurations?.reviewer?.customPrompt,
          reviewerPromptId: validatedData.agentConfigurations?.reviewer?.promptId,
          enableImplementer: validatedData.agentConfigurations?.implementer?.enabled ?? false,
          implementerModel: validatedData.agentConfigurations?.implementer?.modelId,
          implementerPrompt: validatedData.agentConfigurations?.implementer?.customPrompt,
          implementerPromptId: validatedData.agentConfigurations?.implementer?.promptId,
          enableTester: validatedData.agentConfigurations?.tester?.enabled ?? false,
          testerModel: validatedData.agentConfigurations?.tester?.modelId,
          testerPrompt: validatedData.agentConfigurations?.tester?.customPrompt,
          testerPromptId: validatedData.agentConfigurations?.tester?.promptId,
          enableReporter: validatedData.agentConfigurations?.reporter?.enabled ?? true,
          reporterModel: validatedData.agentConfigurations?.reporter?.modelId,
          reporterPrompt: validatedData.agentConfigurations?.reporter?.customPrompt,
          reporterPromptId: validatedData.agentConfigurations?.reporter?.promptId,
          // SECURITY CONSTRAINTS
          analysisConstraints: {
            scopeToSubmittedCodeOnly: true,
            useOnlySelectedDocuments: true,
            noExternalReferences: true,
            documentCount: useCase.pdfs.length,
          },
        };
      })),
    };

    // Start Step Functions execution
    if (process.env.STEP_FUNCTIONS_ARN) {
      try {
        const command = new StartExecutionCommand({
          stateMachineArn: process.env.STEP_FUNCTIONS_ARN,
          input: JSON.stringify(stepFunctionsInput),
          name: `run-${workflowRun.id}-${Date.now()}`,
        });

        console.log('[workflow/start] Starting Step Functions execution...');
        console.log('[workflow/start] State Machine ARN:', process.env.STEP_FUNCTIONS_ARN);

        const execution = await sfnClient.send(command);

        console.log('[workflow/start] Execution started:', execution.executionArn);

        // Update workflow run with execution ARN and status
        try {
          await prisma.workflowRun.update({
            where: { id: workflowRun.id },
            data: {
              status: "running",
              sfnExecutionArn: execution.executionArn,
              startedAt: new Date(),
            },
          });
        } catch (dbError) {
          // If sfnExecutionArn field doesn't exist, try without it
          console.log('[workflow/start] Note: sfnExecutionArn field may not exist, updating without it');
          await prisma.workflowRun.update({
            where: { id: workflowRun.id },
            data: {
              status: "running",
              startedAt: new Date(),
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            runId: workflowRun.id,
            executionArn: execution.executionArn,
            status: "running",
            totalUseCases: useCases.length,
            documentsVectorizing: documentsToVectorize.length,
          },
        });
      } catch (error) {
        console.error("[workflow/start] Error starting Step Functions:", error);
        console.error("[workflow/start] Error name:", error.name);
        console.error("[workflow/start] Error message:", error.message);
        if (error.$response) {
          console.error("[workflow/start] AWS Response status:", error.$response.statusCode);
          console.error("[workflow/start] AWS Response headers:", error.$response.headers);
        }
        if (error.$metadata) {
          console.error("[workflow/start] AWS Metadata:", error.$metadata);
        }

        // Update status to failed
        await prisma.workflowRun.update({
          where: { id: workflowRun.id },
          data: { status: "failed" },
        });

        return NextResponse.json(
          {
            error: "Failed to start workflow execution",
            details: error.message,
            awsError: error.name,
          },
          { status: 500 }
        );
      }
    } else {
      // Development mode - return mock response
      return NextResponse.json({
        success: true,
        data: {
          runId: workflowRun.id,
          status: "running",
          totalUseCases: useCases.length,
          documentsVectorizing: documentsToVectorize.length,
          message: "Development mode - Step Functions not configured",
        },
      });
    }
  } catch (error) {
    console.error("[workflow/start] Error starting workflow:", error);
    console.error("[workflow/start] Error stack:", error.stack);

    if (error instanceof z.ZodError) {
      console.error("[workflow/start] Validation errors:", error.errors);
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflow/start?runId=xxx
 * Get workflow run status
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json({ error: "runId parameter is required" }, { status: 400 });
    }

    const cuidPattern = /^c[a-z0-9]{24,}$/;
    if (!cuidPattern.test(runId)) {
      return NextResponse.json({ error: "Invalid runId format" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let workflowRun = await prisma.workflowRun.findFirst({
      where: { id: runId, userId: user.id },
      include: {
        useCaseRuns: true,
        vulnerabilities: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!workflowRun) {
      return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });
    }

    // ──── Helper: fetch vulnerabilities from S3 ────
    async function fetchVulnerabilitiesFromS3() {
      const vulns = [];
      const bucket = process.env.AGENT_ARTIFACTS_BUCKET || `dev-security-agent-artifacts-650080740856`;
      const useCaseIds = workflowRun.useCaseRuns?.map(uc => uc.useCaseId) || [];
      for (const ucId of useCaseIds) {
        try {
          const key = `runs/${runId}/reviewer/${ucId}/output.json`;
          const res = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
          const data = JSON.parse(await res.Body.transformToString());
          if (Array.isArray(data.vulnerabilities)) vulns.push(...data.vulnerabilities);
        } catch { /* file may not exist yet */ }
      }
      return vulns;
    }

    // ──── Helper: store vulnerabilities in Postgres ────
    async function storeVulnerabilities(vulns) {
      const defaultUseCaseId = workflowRun.useCaseRuns?.[0]?.useCaseId || runId;
      for (const vuln of vulns) {
        try {
          const vulnId = vuln.id || `vuln_${runId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await prisma.vulnerability.upsert({
            where: { id: vulnId },
            update: {},
            create: {
              id: vulnId,
              workflowRunId: runId,
              useCaseId: vuln.useCaseId || defaultUseCaseId,
              title: vuln.title || vuln.type || '',
              severity: vuln.severity || '',
              type: vuln.type || '',
              details: vuln.details || vuln.description || vuln.explanation || '',
              fileName: vuln.fileName || vuln.file || '',
              vulnerableCode: vuln.vulnerableCode || null,
              explanation: vuln.explanation || null,
              bestPractices: vuln.bestPractices || null,
              exploitExamples: vuln.exploitExamples || null,
              attackPath: vuln.attackPath || null,
              cweId: vuln.cweId || null,
              documentReferences: vuln.documentReferences || null,
              lineNumber: vuln.lineNumber || null,
            },
          });
        } catch { /* duplicate or other DB error, skip */ }
      }
    }

    // ──── Helper: mark workflow + all use-case runs as completed ────
    async function markWorkflowCompleted() {
      await prisma.workflowRun.updateMany({
        where: { id: runId, status: 'running' },
        data: { status: 'completed', completedAt: new Date(), completedUseCases: workflowRun.totalUseCases || 1 },
      });
      if (workflowRun.useCaseRuns?.length > 0) {
        await prisma.workflowUseCaseRun.updateMany({
          where: { workflowRunId: runId },
          data: { status: 'completed', reviewerCompleted: true, implementerCompleted: true, testerCompleted: true, reporterCompleted: true },
        });
      }
    }

    // ──── Helper: ensure vulns are in DB, fetch from S3 if missing ────
    async function ensureVulnerabilitiesLoaded() {
      if (workflowRun.vulnerabilities.length === 0) {
        const s3Vulns = await fetchVulnerabilitiesFromS3();
        if (s3Vulns.length > 0) {
          await storeVulnerabilities(s3Vulns);
        }
        // Refetch from DB
        workflowRun = await prisma.workflowRun.findFirst({
          where: { id: runId, userId: user.id },
          include: { useCaseRuns: true, vulnerabilities: { orderBy: { createdAt: "desc" } } },
        }) || workflowRun;
      }
    }

    // ──── Helper: refetch workflowRun from DB ────
    async function refetchWorkflowRun() {
      const fresh = await prisma.workflowRun.findFirst({
        where: { id: runId, userId: user.id },
        include: { useCaseRuns: true, vulnerabilities: { orderBy: { createdAt: "desc" } } },
      });
      if (fresh) workflowRun = fresh;
    }

    // ════════════════════════════════════════════════════════════════
    // Step 1: Sync with Step Functions if workflow is still "running"
    // ════════════════════════════════════════════════════════════════
    let executionArn = workflowRun.sfnExecutionArn;

    if (workflowRun.status === 'running') {
      // Try to find execution ARN if missing
      if (!executionArn && process.env.STEP_FUNCTIONS_ARN) {
        try {
          const { ListExecutionsCommand } = await import("@aws-sdk/client-sfn");
          const listResult = await sfnClient.send(new ListExecutionsCommand({
            stateMachineArn: process.env.STEP_FUNCTIONS_ARN,
            maxResults: 20,
          }));
          const match = listResult.executions?.find(e => e.name?.startsWith(`run-${runId}-`));
          if (match) {
            executionArn = match.executionArn;
            await prisma.workflowRun.update({ where: { id: runId }, data: { sfnExecutionArn: executionArn } }).catch(() => {});
          }
        } catch { /* ignore */ }
      }

      // Query SFN for real status
      if (executionArn) {
        try {
          const sfnResult = await sfnClient.send(new DescribeExecutionCommand({ executionArn }));

          if (sfnResult.status === 'RUNNING') {
            // Parse execution history to update per-agent completion flags in real time
            try {
              const historyResult = await sfnClient.send(new GetExecutionHistoryCommand({
                executionArn, reverseOrder: true, maxResults: 50,
              }));
              const completedAgents = new Set();
              for (const ev of (historyResult.events || [])) {
                if (ev.type === 'TaskStateExited') {
                  const n = ev.stateExitedEventDetails?.name;
                  if (n === 'ExecuteReviewer') completedAgents.add('reviewer');
                  if (n === 'ExecuteImplementer') completedAgents.add('implementer');
                  if (n === 'ExecuteTester') completedAgents.add('tester');
                  if (n === 'ExecuteReporter') completedAgents.add('reporter');
                }
              }
              if (workflowRun.useCaseRuns?.length > 0 && completedAgents.size > 0) {
                const update = {};
                if (completedAgents.has('reviewer')) update.reviewerCompleted = true;
                if (completedAgents.has('implementer')) update.implementerCompleted = true;
                if (completedAgents.has('tester')) update.testerCompleted = true;
                if (completedAgents.has('reporter')) update.reporterCompleted = true;
                await prisma.workflowUseCaseRun.updateMany({ where: { workflowRunId: runId }, data: update });
                for (const ucRun of workflowRun.useCaseRuns) Object.assign(ucRun, update);
              }
            } catch { /* history fetch failed, continue with DB state */ }

          } else if (sfnResult.status === 'SUCCEEDED') {
            await markWorkflowCompleted();
            await ensureVulnerabilitiesLoaded();
            await refetchWorkflowRun();

          } else if (['FAILED', 'TIMED_OUT', 'ABORTED'].includes(sfnResult.status)) {
            await prisma.workflowRun.update({
              where: { id: runId },
              data: { status: 'failed', completedAt: sfnResult.stopDate || new Date() },
            });
            workflowRun.status = 'failed';
          }
        } catch (sfnErr) {
          console.log('[workflow GET] SFN check error:', sfnErr.message);
        }
      }

      // Double-check: if all DB flags say agents completed, transition to completed
      if (workflowRun.status === 'running') {
        const allDone = workflowRun.useCaseRuns?.length > 0 &&
          workflowRun.useCaseRuns.every(uc => uc.reviewerCompleted && uc.implementerCompleted && uc.testerCompleted && uc.reporterCompleted);
        if (allDone) {
          await markWorkflowCompleted();
          await ensureVulnerabilitiesLoaded();
          await refetchWorkflowRun();
        }
      }
    }

    // ════════════════════════════════════════════════════
    // Step 2: For completed workflows, ensure vulns in DB
    // ════════════════════════════════════════════════════
    if (workflowRun.status === 'completed') {
      await ensureVulnerabilitiesLoaded();
    }

    // ════════════════════════════════════════════
    // Step 3: Compute severity counts
    // ════════════════════════════════════════════
    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    workflowRun.vulnerabilities.forEach(v => {
      if (severityCounts.hasOwnProperty(v.severity)) severityCounts[v.severity]++;
    });

    // ════════════════════════════════════════════
    // Step 4: Build UI response
    // ════════════════════════════════════════════
    const useCaseRuns = workflowRun.useCaseRuns || [];
    const totalSteps = (workflowRun.totalUseCases || 1) * 4;
    let currentAgent = null;
    let agentProgress = 0;
    let detailedStatus = { phase: 'initializing', message: 'Preparing workflow...', steps: [] };

    if (workflowRun.status === 'running') {
      let done = 0;
      let active = null;
      for (const ucRun of useCaseRuns) {
        if (ucRun.reviewerCompleted) done++;
        if (ucRun.implementerCompleted) done++;
        if (ucRun.testerCompleted) done++;
        if (ucRun.reporterCompleted) done++;
        if (!active) {
          if (!ucRun.reviewerCompleted) active = 'Reviewer Agent';
          else if (!ucRun.implementerCompleted) active = 'Implementer Agent';
          else if (!ucRun.testerCompleted) active = 'Tester Agent';
          else if (!ucRun.reporterCompleted) active = 'Reporter Agent';
        }
      }
      currentAgent = active || (useCaseRuns.length > 0 ? 'Reviewer Agent' : 'Initializing');
      agentProgress = totalSteps > 0 ? Math.round((done / totalSteps) * 100) : 5;

      const steps = [{ name: 'Workflow initialized', status: 'completed', timestamp: workflowRun.startedAt }];
      for (const ucRun of useCaseRuns) {
        const lbl = ucRun.useCaseTitle || ucRun.useCaseId;
        steps.push(
          { name: `[${lbl}] Reviewer`, status: ucRun.reviewerCompleted ? 'completed' : (active === 'Reviewer Agent' ? 'running' : 'pending'), timestamp: ucRun.reviewerCompleted ? ucRun.updatedAt : null },
          { name: `[${lbl}] Implementer`, status: ucRun.implementerCompleted ? 'completed' : (active === 'Implementer Agent' ? 'running' : 'pending'), timestamp: ucRun.implementerCompleted ? ucRun.updatedAt : null },
          { name: `[${lbl}] Tester`, status: ucRun.testerCompleted ? 'completed' : (active === 'Tester Agent' ? 'running' : 'pending'), timestamp: ucRun.testerCompleted ? ucRun.updatedAt : null },
          { name: `[${lbl}] Reporter`, status: ucRun.reporterCompleted ? 'completed' : (active === 'Reporter Agent' ? 'running' : 'pending'), timestamp: ucRun.reporterCompleted ? ucRun.updatedAt : null },
        );
      }
      const phaseMap = { 'Reviewer Agent': 'reviewing', 'Implementer Agent': 'implementing', 'Tester Agent': 'testing', 'Reporter Agent': 'reporting' };
      detailedStatus = { phase: phaseMap[currentAgent] || 'reviewing', message: `${currentAgent} processing...`, steps };

    } else if (workflowRun.status === 'completed') {
      currentAgent = 'Completed';
      agentProgress = 100;
      const steps = [{ name: 'Workflow initialized', status: 'completed', timestamp: workflowRun.startedAt }];
      for (const ucRun of useCaseRuns) {
        const lbl = ucRun.useCaseTitle || ucRun.useCaseId;
        steps.push(
          { name: `[${lbl}] Reviewer`, status: 'completed', timestamp: ucRun.updatedAt },
          { name: `[${lbl}] Implementer`, status: 'completed', timestamp: ucRun.updatedAt },
          { name: `[${lbl}] Tester`, status: 'completed', timestamp: ucRun.updatedAt },
          { name: `[${lbl}] Reporter`, status: 'completed', timestamp: ucRun.updatedAt },
        );
      }
      if (steps.length === 1) steps.push({ name: 'Workflow completed', status: 'completed', timestamp: workflowRun.completedAt });
      detailedStatus = { phase: 'completed', message: `Analysis complete! Found ${workflowRun.vulnerabilities.length} vulnerability(ies).`, steps };

    } else if (workflowRun.status === 'failed') {
      currentAgent = 'Failed';
      agentProgress = 0;
      detailedStatus = { phase: 'failed', message: 'Workflow execution failed. Please try again.', steps: [{ name: 'Error occurred', status: 'failed', timestamp: new Date() }] };
    }

    return NextResponse.json({
      success: true,
      data: {
        runId: workflowRun.id,
        status: workflowRun.status,
        startedAt: workflowRun.startedAt,
        completedAt: workflowRun.completedAt,
        totalUseCases: workflowRun.totalUseCases,
        completedUseCases: workflowRun.completedUseCases,
        currentAgent,
        agentProgress,
        detailedStatus,
        useCaseRuns: workflowRun.useCaseRuns,
        vulnerabilities: workflowRun.vulnerabilities,
        severityCounts,
        totalVulnerabilities: workflowRun.vulnerabilities.length,
      },
    });
  } catch (error) {
    console.error("Error fetching workflow status:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
