import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markNotificationAsRead } from "@/lib/notifications";

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await markNotificationAsRead(id, session.user.id);

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);

    if (error.message === "Notification not found or unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

