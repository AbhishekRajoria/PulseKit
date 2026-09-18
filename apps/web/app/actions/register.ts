'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ActionResponse } from '@/types'

export default async function register(
  _prevState: ActionResponse<Record<string, unknown>>,
  formData: FormData,
): Promise<ActionResponse<Record<string, unknown>>> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const regRes = await fetch(`${process.env.API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const regData = await regRes.json()

    if (!regData.success) {
      return {
        success: false,
        data: {},
        error: regData.error ?? 'Registration failed',
      }
    }

    // register sets no cookie — auto-login right after, then re-emit the
    // signed userId cookie on our domain (same pattern as actions/login.ts).
    const loginRes = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const loginData = await loginRes.json()

    if (!loginData.success) {
      return {
        success: false,
        data: {},
        error: loginData.error ?? 'Account created — please sign in',
      }
    }

    const header = loginRes.headers
      .getSetCookie()
      .find((c) => c.startsWith('userId='))

    if (!header) {
      return { success: false, data: {}, error: 'Authentication failed' }
    }

    const userIdValue = header.split(';')[0].split('=')[1]

    const cookieStore = await cookies()
    cookieStore.set('userId', userIdValue, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
  } catch {
    return {
      success: false,
      data: {},
      error: 'Failed to reach the API',
    }
  }

  redirect('/projects')
}