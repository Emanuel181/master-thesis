import { BedrockAgentClient, ListAgentsCommand, CreateAgentCommand, GetAgentCommand, ListTagsForResourceCommand, TagResourceCommand } from "@aws-sdk/client-bedrock-agent";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";
import { z } from "zod";
import { requireProductionMode } from "@/lib/api-middleware";

const bedrockAgentClient = new BedrockAgentClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
});

const createAgentSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional().nullable(),
    instruction: z.string().min(1).max(20000),
    foundationModel: z.string().min(1).max(200),
}).strict();

/** @type {HeadersInit} */
const headers = securityHeaders;

/**
 * SECURITY: Check if agent belongs to user via AWS resource tags
 */
async function getAgentUserId(agentArn) {
    try {
        const listTagsCommand = new ListTagsForResourceCommand({
            resourceArn: agentArn,
        });
        const tagsResponse = await bedrockAgentClient.send(listTagsCommand);
        return tagsResponse.tags?.userId || null;
    } catch (error) {
        console.warn("Could not fetch agent tags:", error?.message || String(error));
        return null;
    }
}

// GET - List all agents owned by the current user
export async function GET(request) {
    // SECURITY: Block demo mode from accessing production Bedrock agents API
    const demoBlock = requireProductionMode(request);
    if (demoBlock) return demoBlock;
    
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers }
            );
        }

        // Rate limiting - 30 requests per minute
        const rl = await rateLimit({
            key: `bedrock:agents:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers }
            );
        }

        const command = new ListAgentsCommand({});
        const response = await bedrockAgentClient.send(command);

        // SECURITY: Filter agents to only those owned by the current user
        // This prevents IDOR attacks where users see other users' agents
        const allAgents = (response.agentSummaries || [])
            .filter(agent => agent.agentStatus === "PREPARED" || agent.agentStatus === "NOT_PREPARED");
        
        // Check ownership for each agent via tags
        const ownedAgents = [];
        for (const agent of allAgents) {
            const agentArn = agent.agentArn;
            const ownerId = await getAgentUserId(agentArn);
            if (ownerId === session.user.id) {
                ownedAgents.push({
                    id: agent.agentId,
                    name: agent.agentName,
                    description: agent.description,
                    status: agent.agentStatus,
                    createdDate: agent.createdAt,
                    updatedDate: agent.updatedAt,
                    foundationModel: agent.foundationModel,
                    instruction: agent.instruction,
                    agentResourceRoleArn: agent.agentResourceRoleArn,
                    customerEncryptionKeyArn: agent.customerEncryptionKeyArn,
                    guardrailConfiguration: agent.guardrailConfiguration,
                    idleSessionTTLInSeconds: agent.idleSessionTTLInSeconds,
                });
            }
        }

        return NextResponse.json({ agents: ownedAgents }, { headers });
    } catch (error) {
        console.error("Error fetching Bedrock agents:", error);
        return NextResponse.json(
            { error: "Failed to fetch agents from AWS Bedrock" },
            { status: 500, headers }
        );
    }
}

// POST - Create a new agent
export async function POST(request) {
    // SECURITY: Block demo mode from accessing production Bedrock agents API
    const demoBlock = requireProductionMode(request);
    if (demoBlock) return demoBlock;
    
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers }
            );
        }

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403, headers }
            );
        }

        // Rate limiting - 10 agent creations per hour
        const rl = await rateLimit({
            key: `bedrock:agents:create:${session.user.id}`,
            limit: 10,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers }
            );
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400, headers }
            );
        }

        const validation = createAgentSchema.safeParse(parsed.body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed' },
                { status: 400, headers }
            );
        }

        const { name, description, instruction, foundationModel } = validation.data;

        const createCommand = new CreateAgentCommand({
            agentName: name,
            description: description ?? undefined,
            instruction,
            foundationModel,
            // SECURITY: Tag agent with user ID for ownership verification
            tags: {
                userId: session.user.id,
                createdBy: 'application',
                createdAt: new Date().toISOString(),
            },
        });

        const response = await bedrockAgentClient.send(createCommand);

        // SECURITY: Also explicitly tag the resource in case CreateAgentCommand tags aren't applied
        try {
            const tagCommand = new TagResourceCommand({
                resourceArn: response.agent.agentArn,
                tags: {
                    userId: session.user.id,
                    createdBy: 'application',
                    createdAt: new Date().toISOString(),
                },
            });
            await bedrockAgentClient.send(tagCommand);
        } catch (tagError) {
            console.warn("Could not tag agent:", tagError?.message || String(tagError));
            // Continue anyway - the agent was created, but ownership may not be verifiable
        }

        const getCommand = new GetAgentCommand({
            agentId: response.agent.agentId,
        });
        const agentDetails = await bedrockAgentClient.send(getCommand);

        return NextResponse.json({
            agent: {
                id: agentDetails.agent.agentId,
                name: agentDetails.agent.agentName,
                description: agentDetails.agent.description,
                status: agentDetails.agent.agentStatus,
                createdDate: agentDetails.agent.createdAt,
                updatedDate: agentDetails.agent.updatedAt,
                foundationModel: agentDetails.agent.foundationModel,
                instruction: agentDetails.agent.instruction,
            }
        }, { headers });
    } catch (error) {
        console.error("Error creating Bedrock agent:", error);

        // Avoid echoing AWS error.message to client.
        return NextResponse.json(
            { error: "Failed to create agent in AWS Bedrock" },
            { status: 500, headers }
        );
    }
}
