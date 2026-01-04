import { NextResponse } from "next/server";
import { auth } from "@/auth";

// List of allowed admin emails - supports both ADMIN_EMAILS (comma-separated) and ADMIN_EMAIL (single)
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : [])
].filter(Boolean);

// GET /api/auth/admin-check - Check if current user is an admin
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false });
    }

    const userEmail = session.user.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false });
  }
}
