'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AuthShell } from '@/app/components/AuthShell'
import { AlertError, Field, PasswordField } from '@/app/components/Primitives'
import register from '@/app/actions/register'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(register, {
    success: false,
    data: {},
  })

  return (
    <AuthShell
      title="Create your account"
      subtitle="Create a project and start sending events."
      footer={
        <Link
          href="/login"
          className="font-medium text-ink hover:underline"
        >
          Have an account? Sign in
        </Link>
      }
    >
      <form action={formAction} className="space-y-4">
        <Field label="Full name" name="name" required placeholder="Ada Lovelace" autoComplete="name" />
        <Field label="Email" type="email" name="email" required placeholder="you@example.com" autoComplete="email" />
        <PasswordField label="Password" name="password" required placeholder="8+ characters" autoComplete="new-password" />

        {state.error && <AlertError>{state.error}</AlertError>}

        <button
          type="submit"
          disabled={pending}
          className="w-full cursor-pointer rounded-lg bg-primary-action px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover disabled:cursor-default disabled:opacity-50"
        >
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}