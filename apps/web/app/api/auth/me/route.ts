import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }

  const apiUrl = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '')
  const res = await fetch(`${apiUrl}/auth/me`, {
    headers: { Cookie: `userId=${userId}` },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
