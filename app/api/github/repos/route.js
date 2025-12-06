import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get GitHub account
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'github',
            },
        })

        if (!account?.access_token) {
            return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
        }

        // Fetch repos from GitHub
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch repos' }, { status: response.status })
        }

        const repos = await response.json()

        return NextResponse.json({ repos })
    } catch (error) {
        console.error('Error fetching GitHub repos:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}