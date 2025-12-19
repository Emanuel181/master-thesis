import { NextResponse } from 'next/server'
import { auth } from '@/auth'

function maskToken(token) {
  if (!token) return null
  if (token.length <= 8) return token.replace(/.(?=.{4})/g, '*')
  return `${token.slice(0, 4)}...${token.slice(-4)}`
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ session: null })

    const masked = { ...session }
    if (masked.accessToken) masked.accessToken = maskToken(masked.accessToken)
    if (masked.user) masked.user = { ...masked.user, id: masked.user.id }

    return NextResponse.json({ session: masked })
  } catch (err) {
    console.error('[debug/session] error', err)
    return NextResponse.json({ error: err.message || 'error' }, { status: 500 })
  }
}

