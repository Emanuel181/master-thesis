import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { securityHeaders, getClientIp, isSameOrigin, readJsonBody } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";

// Normalize and validate human-entered text fields.
// - Removes NUL and most control chars
// - Rejects angle brackets to reduce persistent XSS risk if a future UI renders HTML
//   (defense-in-depth; output encoding is still required in UI).
const normalizeText = (value, { allowNewlines = false } = {}) => {
  if (typeof value !== 'string') return value;
  const removedControls = allowNewlines
    ? value.replace(/[\0\x08\x09\x1a\x0b\x0c]/g, '')
    : value.replace(/[\0-\x1F\x7F]/g, ' ');
  return removedControls.trim();
};

const zText = (label, max, { allowNewlines = false } = {}) =>
  z
    .string()
    .max(max, `${label} must be less than ${max} characters`)
    .transform((v) => normalizeText(v, { allowNewlines }))
    .refine((v) => !/[<>]/.test(v), { message: `${label} must not contain '<' or '>'` });

// Input validation schema for profile updates
const phoneRegex = /^\+?[0-9\s\-()]+$/;

const updateProfileSchema = z.object({
  firstName: zText('First name', 100).nullable().optional(),
  lastName: zText('Last name', 100).nullable().optional(),
  phone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .transform((v) => normalizeText(v))
    .refine((v) => !v || phoneRegex.test(v), { message: 'Invalid phone number format' })
    .nullable()
    .optional(),
  jobTitle: zText('Job title', 100).nullable().optional(),
  company: zText('Company name', 100).nullable().optional(),
  bio: zText('Bio', 1000, { allowNewlines: true }).nullable().optional(),
  location: zText('Location', 100).nullable().optional(),
  // Enforce HTTPS to prevent mixed content; do not server-fetch this URL without allowlisting.
  image: z
    .string()
    .url('Image must be a valid URL')
    .startsWith('https://', 'Image URL must use HTTPS')
    .max(2048, 'Image URL must be less than 2048 characters')
    .nullable()
    .optional(),
}).strict();

export async function GET(request) {
  // SECURITY: Block demo mode from accessing production profile API
  const demoBlock = requireProductionMode(request);
  if (demoBlock) return demoBlock;
  
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: securityHeaders }
      );
    }

    // Rate limiting - 60 requests per minute for profile reads
    const clientIp = getClientIp(request);
    const rl = await rateLimit({
      key: `profile:get:${session.user.id}:${clientIp}`,
      limit: 60,
      windowMs: 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429, headers: securityHeaders }
      );
    }

    // Use ID for lookup (Immutable & Secure)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        { status: 404, headers: securityHeaders }
      );
    }

    return NextResponse.json({ user }, { headers: securityHeaders });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching profile:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500, headers: securityHeaders }
    );
  }
}

export async function PUT(request) {
  // SECURITY: Block demo mode from accessing production profile API
  const demoBlock = requireProductionMode(request);
  if (demoBlock) return demoBlock;
  
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: securityHeaders }
      );
    }

    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: securityHeaders }
      );
    }

    const clientIp = getClientIp(request);
    const rl = await rateLimit({
      key: `profile:put:${session.user.id}:${clientIp}`,
      limit: 20,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429, headers: securityHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: securityHeaders }
      );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: securityHeaders }
      );
    }

    const validationResult = updateProfileSchema.safeParse(parsed.body);
    if (!validationResult.success) {
      // Return a minimal field->message map to avoid leaking internal structures
      const fields = {};
      for (const issue of validationResult.error.issues) {
        const key = issue.path?.[0];
        if (typeof key === 'string' && !fields[key]) {
          fields[key] = issue.message;
        }
      }

      return NextResponse.json(
        { error: "Validation failed", fields },
        { status: 400, headers: securityHeaders }
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
      where: { id: session.user.id },
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

    return NextResponse.json({ user: updatedUser }, { headers: securityHeaders });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error updating profile:", error);
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500, headers: securityHeaders }
    );
  }
}
