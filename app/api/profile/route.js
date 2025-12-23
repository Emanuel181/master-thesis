import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// Input validation schema for profile updates
const updateProfileSchema = z.object({
  firstName: z.string().max(100, 'First name must be less than 100 characters').nullable().optional(),
  lastName: z.string().max(100, 'Last name must be less than 100 characters').nullable().optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').nullable().optional(),
  jobTitle: z.string().max(100, 'Job title must be less than 100 characters').nullable().optional(),
  company: z.string().max(100, 'Company name must be less than 100 characters').nullable().optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').nullable().optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').nullable().optional(),
  image: z.string().url('Image must be a valid URL').max(2048, 'Image URL must be less than 2048 characters').nullable().optional(),
});

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting - 60 requests per minute for profile reads
    const rl = rateLimit({
      key: `profile:get:${session.user.id}`,
      limit: 60,
      windowMs: 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        firstName: true,
        lastName: true,
        phone: true,
        jobTitle: true,
        company: true,
        bio: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    // Only log detailed errors in development to prevent information leakage
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching profile:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting - 20 profile updates per hour
    const rl = rateLimit({
      key: `profile:put:${session.user.id}`,
      limit: 20,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { firstName, lastName, phone, jobTitle, company, bio, location, image } = validationResult.data;

    // Build update data object with only provided fields
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName || null;
    if (lastName !== undefined) updateData.lastName = lastName || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle || null;
    if (company !== undefined) updateData.company = company || null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (location !== undefined) updateData.location = location || null;
    if (image !== undefined) updateData.image = image || null;

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        firstName: true,
        lastName: true,
        phone: true,
        jobTitle: true,
        company: true,
        bio: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    // Only log detailed errors in development to prevent information leakage
    if (process.env.NODE_ENV === 'development') {
      console.error("Error updating profile:", error);
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
