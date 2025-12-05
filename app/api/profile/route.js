import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
    console.error("Error fetching profile:", error);
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
    const {
      firstName,
      lastName,
      phone,
      jobTitle,
      company,
      bio,
      location,
      image,
    } = body;

    // Validate input
    if (firstName && firstName.length > 100) {
      return NextResponse.json(
        { error: "First name must be less than 100 characters" },
        { status: 400 }
      );
    }

    if (lastName && lastName.length > 100) {
      return NextResponse.json(
        { error: "Last name must be less than 100 characters" },
        { status: 400 }
      );
    }

    if (phone && phone.length > 20) {
      return NextResponse.json(
        { error: "Phone number must be less than 20 characters" },
        { status: 400 }
      );
    }

    if (jobTitle && jobTitle.length > 100) {
      return NextResponse.json(
        { error: "Job title must be less than 100 characters" },
        { status: 400 }
      );
    }

    if (company && company.length > 100) {
      return NextResponse.json(
        { error: "Company name must be less than 100 characters" },
        { status: 400 }
      );
    }

    if (bio && bio.length > 1000) {
      return NextResponse.json(
        { error: "Bio must be less than 1000 characters" },
        { status: 400 }
      );
    }

    if (location && location.length > 100) {
      return NextResponse.json(
        { error: "Location must be less than 100 characters" },
        { status: 400 }
      );
    }

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
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
