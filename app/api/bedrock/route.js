import { BedrockClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { securityHeaders } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";
import { withCircuitBreaker } from "@/lib/distributed-circuit-breaker";

const bedrockClient = new BedrockClient({
    region: process.env.AWS_REGION || "us-east-1",
});

export async function GET(request) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
    
    // SECURITY: Block demo mode from accessing production AWS Bedrock API
    const demoBlock = requireProductionMode(request);
    if (demoBlock) return demoBlock;
    
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized', requestId },
                { status: 401, headers: { ...securityHeaders, 'x-request-id': requestId } }
            );
        }

        // Rate limiting - 30 requests per minute
        const rl = await rateLimit({
            key: `bedrock:models:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
                { status: 429, headers: { ...securityHeaders, 'x-request-id': requestId } }
            );
        }

        // Use distributed circuit breaker for Bedrock API calls
        const models = await withCircuitBreaker('bedrock-api', async () => {
            const command = new ListFoundationModelsCommand({});
            const response = await bedrockClient.send(command);

            return (response.modelSummaries || [])
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
        });

        return NextResponse.json({ models, requestId }, { headers: { ...securityHeaders, 'x-request-id': requestId } });
    } catch (error) {
        // Handle circuit breaker open state
        if (error.code === 'CIRCUIT_OPEN') {
            return NextResponse.json(
                { error: 'Bedrock API is temporarily unavailable. Please try again later.', retryAfter: error.retryAfter, requestId },
                { status: 503, headers: { ...securityHeaders, 'x-request-id': requestId, 'Retry-After': Math.ceil((error.retryAfter || 30000) / 1000) } }
            );
        }
        console.error("[bedrock] Error fetching models:", error.message);

        // Safe, non-leaky error message
        return NextResponse.json(
            { error: "Failed to fetch models from AWS Bedrock", requestId },
            { status: 500, headers: { ...securityHeaders, 'x-request-id': requestId } }
        );
    }
}
