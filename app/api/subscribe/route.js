import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Please provide a valid email address" },
                { status: 400 }
            );
        }

        const BREVO_API_KEY = process.env.BREVO_API_KEY;
        const BREVO_BASE_URL = process.env.NEXT_PUBLIC_BREVO_BASE_URL || "https://api.brevo.com/v3";

        if (!BREVO_API_KEY) {
            console.error("BREVO_API_KEY is not configured");
            return NextResponse.json(
                { error: "Subscription service is not configured" },
                { status: 500 }
            );
        }

        // Add contact to Brevo
        const response = await fetch(`${BREVO_BASE_URL}/contacts`, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify({
                email: email,
                updateEnabled: true,
                attributes: {
                    SOURCE: "VulnIQ Landing Page",
                    SUBSCRIBED_DATE: new Date().toISOString(),
                },
            }),
        });

        if (response.ok) {
            return NextResponse.json(
                { message: "Successfully subscribed!" },
                { status: 200 }
            );
        }

        // Handle already existing contact (which is fine)
        if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.code === "duplicate_parameter") {
                return NextResponse.json(
                    { message: "You're already subscribed!" },
                    { status: 200 }
                );
            }
            return NextResponse.json(
                { error: errorData.message || "Failed to subscribe" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to subscribe. Please try again later." },
            { status: response.status }
        );
    } catch (error) {
        console.error("Subscription error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again later." },
            { status: 500 }
        );
    }
}

