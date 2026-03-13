'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  const callbackError = params.get('error')

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">

      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-brand-red rounded-full flex items-center justify-center">
              <span className="text-white font-black text-sm">JC</span>
            </div>
            <span className="text-white font-bold text-base">JC Tire Shop</span>
          </div>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-red/10 border border-brand-red/20 rounded-2xl mb-4">
            <Lock size={22} className="text-brand-red" />
          </div>
          <h1 className="text-2xl font-black text-white">Staff Login</h1>
          <p className="text-gray-500 text-sm mt-1">Admin access only</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-brand-gray rounded-2xl p-7 space-y-4 border border-white/10 shadow-2xl shadow-black/40"
        >
          {(error || callbackError) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
              {error || 'Authentication failed. Please try again.'}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5 font-medium">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm placeholder-gray-600
                         focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent
                         transition-colors"
              placeholder="admin@jctireshop.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5 font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 pr-11
                           text-white text-sm placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent
                           transition-colors"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red text-white font-bold py-3 rounded-xl
                       hover:bg-red-700 transition-colors disabled:opacity-60
                       disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          <a href="/" className="hover:text-gray-400 transition-colors">
            ← Back to website
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-dark" />}>
      <LoginForm />
    </Suspense>
  )
}
