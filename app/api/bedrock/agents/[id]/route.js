import { BedrockAgentClient, GetAgentCommand, ListAgentActionGroupsCommand, ListAgentKnowledgeBasesCommand, ListTagsForResourceCommand } from "@aws-sdk/client-bedrock-agent";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";

const bedrockAgentClient = new BedrockAgentClient({
    region: process.env.AWS_REGION || "us-east-1",
});

/**
 * SECURITY: Verify agent ownership via AWS resource tags
 * Agents must have a 'userId' tag matching the requesting user's ID
 * This prevents IDOR attacks where users access other users' agents
 */
async function verifyAgentOwnership(agentArn, userId) {
    try {
        const listTagsCommand = new ListTagsForResourceCommand({
            resourceArn: agentArn,
        });
        const tagsResponse = await bedrockAgentClient.send(listTagsCommand);
        const tags = tagsResponse.tags || {};
        
        // Check if the agent has a userId tag matching the requesting user
        return tags.userId === userId;
    } catch (error) {
        console.error("Error checking agent tags:", error?.message || String(error));
        // Fail closed - if we can't verify ownership, deny access
        return false;
    }
}

// GET - Get detailed agent information including action groups and knowledge bases
export async function GET(request, { params }) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } });
        }

        // Rate limiting - 60 requests per minute
        const rl = await rateLimit({
            key: `bedrock:agent:get:${session.user.id}`,
            limit: 60,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
                { status: 429, headers: { ...securityHeaders, 'x-request-id': requestId } }
            );
        }

        const id = params?.id;

        // Conservative id validation: agent ids are typically opaque but URL-safe.
        if (!id || typeof id !== 'string' || id.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            return NextResponse.json(
                { error: "Agent ID is required", requestId },
                { status: 400, headers: { ...securityHeaders, 'x-request-id': requestId } }
            );
        }

        // Get basic agent details
        const getAgentCommand = new GetAgentCommand({
            agentId: id,
        });
        
        let agentResponse;
        try {
            agentResponse = await bedrockAgentClient.send(getAgentCommand);
        } catch (error) {
            // SECURITY: Return generic 404 for non-existent agents to prevent enumeration
            if (error?.name === 'ResourceNotFoundException' || error?.$metadata?.httpStatusCode === 404) {
                return NextResponse.json(
                    { error: "Agent not found", requestId },
                    { status: 404, headers: { ...securityHeaders, 'x-request-id': requestId } }
                );
            }
            throw error;
        }

        const agent = agentResponse.agent;

        // SECURITY: Verify agent ownership before returning details
        // This prevents IDOR attacks where users access other users' agents
        const agentArn = agent.agentArn;
        const isOwner = await verifyAgentOwnership(agentArn, session.user.id);
        
        if (!isOwner) {
            // SECURITY: Return 404 instead of 403 to prevent agent enumeration
            // Don't reveal whether the agent exists if the user doesn't own it
            return NextResponse.json(
                { error: "Agent not found", requestId },
                { status: 404, headers: { ...securityHeaders, 'x-request-id': requestId } }
            );
        }

        // Get action groups
        const listActionGroupsCommand = new ListAgentActionGroupsCommand({
            agentId: id,
            agentVersion: 'DRAFT',
        });

        let actionGroups = [];
        try {
            const actionGroupsResponse = await bedrockAgentClient.send(listActionGroupsCommand);
            actionGroups = actionGroupsResponse.actionGroupSummaries || [];
        } catch (error) {
            console.warn("Could not fetch action groups:", error?.message || String(error));
        }

        // Get knowledge bases
        const listKnowledgeBasesCommand = new ListAgentKnowledgeBasesCommand({
            agentId: id,
            agentVersion: 'DRAFT',
        });

        let knowledgeBases = [];
        try {
            const knowledgeBasesResponse = await bedrockAgentClient.send(listKnowledgeBasesCommand);
            knowledgeBases = knowledgeBasesResponse.agentKnowledgeBaseSummaries || [];
        } catch (error) {
            console.warn("Could not fetch knowledge bases:", error?.message || String(error));
        }

        const agent = agentResponse.agent;

        return NextResponse.json({
            agent: {
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
                memoryConfiguration: agent.memoryConfiguration,
                promptOverrideConfiguration: agent.promptOverrideConfiguration,
            },
            actionGroups: actionGroups.map(ag => ({
                id: ag.actionGroupId,
                name: ag.actionGroupName,
                description: ag.description,
                state: ag.actionGroupState,
                updatedDate: ag.updatedAt,
            })),
            knowledgeBases: knowledgeBases.map(kb => ({
                id: kb.knowledgeBaseId,
                name: kb.description,
                state: kb.knowledgeBaseState,
                updatedDate: kb.updatedAt,
            })),
        }, { headers: { ...securityHeaders, 'x-request-id': requestId } });
    } catch (error) {
        console.error("Error fetching agent details:", error);
        return NextResponse.json(
            { error: "Failed to fetch agent details from AWS Bedrock", requestId },
            { status: 500, headers: { ...securityHeaders, 'x-request-id': requestId } }
        );
    }
}
