/**
 * Debug API for Knowledge Base
 * GET /api/debug/knowledge-base
 */

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // Get all use cases with their PDFs and folders
        const useCases = await prisma.knowledgeBaseCategory.findMany({
            include: {
                pdfs: {
                    select: {
                        id: true,
                        title: true,
                        size: true,
                        s3Key: true,
                        folderId: true,
                        createdAt: true,
                    },
                },
                folders: {
                    select: {
                        id: true,
                        name: true,
                        parentId: true,
                        createdAt: true,
                        _count: {
                            select: {
                                pdfs: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        pdfs: true,
                        folders: true,
                    },
                },
            },
        });

        // Get all groups
        const groups = await prisma.useCaseGroup.findMany({
            include: {
                _count: {
                    select: {
                        useCases: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                useCases,
                groups,
                summary: {
                    totalUseCases: useCases.length,
                    totalGroups: groups.length,
                    totalPdfs: useCases.reduce((sum, uc) => sum + uc._count.pdfs, 0),
                    totalFolders: useCases.reduce((sum, uc) => sum + uc._count.folders, 0),
                },
            },
        });
    } catch (error) {
        console.error('[Debug] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
