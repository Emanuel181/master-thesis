import { BedrockAgentClient, ListAgentsCommand, CreateAgentCommand, GetAgentCommand } from "@aws-sdk/client-bedrock-agent";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const bedrockAgentClient = new BedrockAgentClient({
    region: process.env.AWS_REGION || "us-east-1",
});

// GET - List all agents
export async function GET() {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const command = new ListAgentsCommand({});
        const response = await bedrockAgentClient.send(command);

        // Format agents for the workflow configurator with full details
        const agents = response.agentSummaries
            .filter(agent => agent.agentStatus === "PREPARED" || agent.agentStatus === "NOT_PREPARED")
            .map(agent => ({
                id: agent.agentId,
                name: agent.agentName,
                description: agent.description,
                status: agent.agentStatus,
                createdDate: agent.createdAt,
                updatedDate: agent.updatedAt,
                foundationModel: agent.foundationModel,
                instruction: agent.instruction,
                // Additional metadata that might be available
                agentResourceRoleArn: agent.agentResourceRoleArn,
                customerEncryptionKeyArn: agent.customerEncryptionKeyArn,
                guardrailConfiguration: agent.guardrailConfiguration,
                idleSessionTTLInSeconds: agent.idleSessionTTLInSeconds,
                // Note: Action groups and knowledge bases would need separate API calls to get full details
                // For now, we'll get basic counts from the summary if available
            }));

        return NextResponse.json({ agents });
    } catch (error) {
        console.error("Error fetching Bedrock agents:", error);

        // Provide specific error messages for common issues
        let errorMessage = "Failed to fetch agents from AWS Bedrock";
        if (error.name === "AccessDeniedException") {
            errorMessage = "AWS Bedrock access denied. Please check your IAM permissions. You need bedrock:ListAgents permission.";
        } else if (error.name === "UnrecognizedClientException") {
            errorMessage = "AWS credentials are invalid or not configured properly.";
        } else if (error.name === "InvalidRegionException") {
            errorMessage = "AWS region is not valid for Bedrock service.";
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: error.message,
                suggestion: error.name === "AccessDeniedException"
                    ? "Attach AmazonBedrockFullAccess policy or create a custom policy with bedrock agent permissions to your IAM user."
                    : "Check your AWS credentials and region configuration."
            },
            { status: 500 }
        );
    }
}

// POST - Create a new agent
export async function POST(request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, description, instruction, foundationModel, actionGroups = [] } = body;

        if (!name || !instruction || !foundationModel) {
            return NextResponse.json(
                { error: "Missing required fields: name, instruction, and foundationModel are required" },
                { status: 400 }
            );
        }

        const createCommand = new CreateAgentCommand({
            agentName: name,
            description: description,
            instruction: instruction,
            foundationModel: foundationModel,
            // Note: Action groups would need to be created separately and associated
        });

        const response = await bedrockAgentClient.send(createCommand);

        // Get the created agent details
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
        });
    } catch (error) {
        console.error("Error creating Bedrock agent:", error);

        let errorMessage = "Failed to create agent in AWS Bedrock";
        if (error.name === "AccessDeniedException") {
            errorMessage = "AWS Bedrock access denied. Please check your IAM permissions. You need bedrock:CreateAgent permission.";
        } else if (error.name === "ValidationException") {
            errorMessage = "Invalid agent configuration. Please check your input parameters.";
        } else if (error.name === "ConflictException") {
            errorMessage = "An agent with this name already exists.";
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
