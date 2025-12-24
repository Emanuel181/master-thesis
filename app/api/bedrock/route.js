import { BedrockClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders } from "@/lib/api-security";

const bedrockClient = new BedrockClient({
    region: process.env.AWS_REGION || "us-east-1",
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: securityHeaders }
            );
        }

        // Rate limiting - 30 requests per minute
        const rl = rateLimit({
            key: `bedrock:models:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const command = new ListFoundationModelsCommand({});
        const response = await bedrockClient.send(command);

        const models = (response.modelSummaries || [])
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

        return NextResponse.json({ models }, { headers: securityHeaders });
    } catch (error) {
        console.error("Error fetching Bedrock models:", error);

        // Safe, non-leaky error message
        return NextResponse.json(
            { error: "Failed to fetch models from AWS Bedrock" },
            { status: 500, headers: securityHeaders }
        );
    }
}
