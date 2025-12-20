import { BedrockAgentClient, GetAgentCommand, ListAgentActionGroupsCommand, ListAgentKnowledgeBasesCommand } from "@aws-sdk/client-bedrock-agent";
import { NextResponse } from "next/server";

const bedrockAgentClient = new BedrockAgentClient({
    region: process.env.AWS_REGION || "us-east-1",
});

// GET - Get detailed agent information including action groups and knowledge bases
export async function GET(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: "Agent ID is required" },
                { status: 400 }
            );
        }

        // Get basic agent details
        const getAgentCommand = new GetAgentCommand({
            agentId: id,
        });
        const agentResponse = await bedrockAgentClient.send(getAgentCommand);

        // Get action groups
        const listActionGroupsCommand = new ListAgentActionGroupsCommand({
            agentId: id,
            agentVersion: 'DRAFT', // or '1' for published version
        });

        let actionGroups = [];
        try {
            const actionGroupsResponse = await bedrockAgentClient.send(listActionGroupsCommand);
            actionGroups = actionGroupsResponse.actionGroupSummaries || [];
        } catch (error) {
            console.warn("Could not fetch action groups:", error.message);
        }

        // Get knowledge bases
        const listKnowledgeBasesCommand = new ListAgentKnowledgeBasesCommand({
            agentId: id,
            agentVersion: 'DRAFT', // or '1' for published version
        });

        let knowledgeBases = [];
        try {
            const knowledgeBasesResponse = await bedrockAgentClient.send(listKnowledgeBasesCommand);
            knowledgeBases = knowledgeBasesResponse.agentKnowledgeBaseSummaries || [];
        } catch (error) {
            console.warn("Could not fetch knowledge bases:", error.message);
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
                name: kb.description, // Note: This might be different in the actual API
                state: kb.knowledgeBaseState,
                updatedDate: kb.updatedAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching agent details:", error);

        let errorMessage = "Failed to fetch agent details from AWS Bedrock";
        if (error.name === "AccessDeniedException") {
            errorMessage = "AWS Bedrock access denied. Please check your IAM permissions.";
        } else if (error.name === "ResourceNotFoundException") {
            errorMessage = "Agent not found.";
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: error.message,
            },
            { status: 500 }
        );
    }
}
