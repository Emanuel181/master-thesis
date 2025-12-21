import { BedrockClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const bedrockClient = new BedrockClient({
    region: process.env.AWS_REGION || "us-east-1",
});

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

        const command = new ListFoundationModelsCommand({});
        const response = await bedrockClient.send(command);

        // Filter and format models for the workflow configurator
        const models = response.modelSummaries
            .filter(model => model.modelLifecycle?.status === "ACTIVE")
            .map(model => ({
                id: model.modelId,
                name: model.modelName,
                provider: model.providerName,
                inputModalities: model.inputModalities,
                outputModalities: model.outputModalities,
                customizationsSupported: model.customizationsSupported,
                inferenceTypesSupported: model.inferenceTypesSupported,
            }));

        return NextResponse.json({ models });
    } catch (error) {
        console.error("Error fetching Bedrock models:", error);

        // Provide specific error messages for common issues
        let errorMessage = "Failed to fetch models from AWS Bedrock";
        if (error.name === "AccessDeniedException") {
            errorMessage = "AWS Bedrock access denied. Please check your IAM permissions. You need bedrock:ListFoundationModels permission.";
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
                    ? "Attach AmazonBedrockReadOnly policy or create a custom policy with bedrock:ListFoundationModels permission to your IAM user."
                    : "Check your AWS credentials and region configuration."
            },
            { status: 500 }
        );
    }
}
