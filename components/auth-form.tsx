'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { ShieldCheck, LoaderCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

type AuthFormProps = { mode: 'sign-in' | 'sign-up' }

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nativeEvent = event.nativeEvent as KeyboardEvent
    if (nativeEvent.isComposing || nativeEvent.keyCode === 229) return
    setError('')
    setPending(true)
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(isSignUp ? 'Unable to create account. Check the details and try again.' : 'Email or password is incorrect.')
        return
      }
      router.replace('/')
      router.refresh()
    } catch {
      setError('Unable to reach the authentication service. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand"><span className="brand-mark"><ShieldCheck size={20} /></span><div><strong>Sentinel<span>OS</span></strong><small>security operations</small></div></div>
        <div className="auth-heading"><p className="eyebrow">SECURE ACCESS</p><h1 id="auth-title">{isSignUp ? 'Create your analyst account' : 'Welcome back, analyst'}</h1><p>{isSignUp ? 'Start monitoring your security environment.' : 'Sign in to continue to your security workspace.'}</p></div>
        <form onSubmit={submit} className="auth-form">
          {isSignUp && <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Arjun Khanna" autoComplete="name" /></label>}
          <label>Work email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" /></label>
          <label>Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={isSignUp ? 'new-password' : 'current-password'} /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary-btn auth-submit" disabled={pending}>{pending && <LoaderCircle className="spin" size={16} />}{pending ? 'Checking credentials...' : isSignUp ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">{isSignUp ? 'Already have an account?' : 'New to SentinelOS?'} <Link href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Sign in' : 'Create an account'}</Link></p>
      </section>
    </main>
  )
}
