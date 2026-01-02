import { NextResponse } from "next/server";
import { securityHeaders, readJsonBody } from "@/lib/api-security";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updates
const updateSupporterSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
    occupation: z.string().min(1).max(100).optional(),
    company: z.string().max(100).optional().nullable().or(z.literal('')),
    companyUrl: z.string().url().optional().nullable().or(z.literal('')),
    contributionBio: z.string().min(1).max(500).optional(),
    personalBio: z.string().max(500).optional().nullable().or(z.literal('')),
    linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
    websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
    tier: z.enum(['sponsor', 'contributor', 'supporter']).optional(),
    featured: z.boolean().optional(),
    order: z.number().int().min(0).max(1000).optional(),
    visible: z.boolean().optional(),
});

/**
 * PUT /api/admin/supporters/[id]
 * Update a supporter in database
 */
export async function PUT(request, { params }) {
    try {
        const { id } = await params;

        // Check if supporter exists
        const existing = await prisma.supporter.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Supporter not found' },
                { status: 404, headers: securityHeaders }
            );
        }

        const bodyResult = await readJsonBody(request);
        if (!bodyResult.ok) {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400, headers: securityHeaders }
            );
        }

        const validation = updateSupporterSchema.safeParse(bodyResult.body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400, headers: securityHeaders }
            );
        }

        // Build update data (only include provided fields)
        const updateData = {};
        if (validation.data.name !== undefined) updateData.name = validation.data.name;
        if (validation.data.avatarUrl !== undefined) updateData.avatarUrl = validation.data.avatarUrl || null;
        if (validation.data.occupation !== undefined) updateData.occupation = validation.data.occupation;
        if (validation.data.company !== undefined) updateData.company = validation.data.company || null;
        if (validation.data.companyUrl !== undefined) updateData.companyUrl = validation.data.companyUrl || null;
        if (validation.data.contributionBio !== undefined) updateData.contributionBio = validation.data.contributionBio;
        if (validation.data.personalBio !== undefined) updateData.personalBio = validation.data.personalBio || null;
        if (validation.data.linkedinUrl !== undefined) updateData.linkedinUrl = validation.data.linkedinUrl || null;
        if (validation.data.websiteUrl !== undefined) updateData.websiteUrl = validation.data.websiteUrl || null;
        if (validation.data.tier !== undefined) updateData.tier = validation.data.tier;
        if (validation.data.featured !== undefined) updateData.featured = validation.data.featured;
        if (validation.data.order !== undefined) updateData.order = validation.data.order;
        if (validation.data.visible !== undefined) updateData.visible = validation.data.visible;

        const updatedSupporter = await prisma.supporter.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(
            { supporter: updatedSupporter, message: 'Supporter updated successfully' },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Admin Supporters PUT Error]', error);
        return NextResponse.json(
            { error: 'Failed to update supporter' },
            { status: 500, headers: securityHeaders }
        );
    }
}

/**
 * DELETE /api/admin/supporters/[id]
 * Delete a supporter from database
 */
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Check if supporter exists
        const existing = await prisma.supporter.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Supporter not found' },
                { status: 404, headers: securityHeaders }
            );
        }

        await prisma.supporter.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: 'Supporter deleted successfully' },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Admin Supporters DELETE Error]', error);
        return NextResponse.json(
            { error: 'Failed to delete supporter' },
            { status: 500, headers: securityHeaders }
        );
    }
}
