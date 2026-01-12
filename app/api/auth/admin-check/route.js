import { auth } from "@/auth";
import { successResponse } from "@/lib/api-handler";
import { checkAdminStatus } from "@/lib/admin-auth";

// GET /api/auth/admin-check - Check if current user is an admin
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return successResponse({ isAdmin: false, isMasterAdmin: false });
    }

    // Use database-backed admin check
    const adminStatus = await checkAdminStatus(session.user.email);

    return successResponse({ 
      isAdmin: adminStatus.isAdmin,
      isMasterAdmin: adminStatus.isMasterAdmin 
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return successResponse({ isAdmin: false, isMasterAdmin: false });
  }
}
