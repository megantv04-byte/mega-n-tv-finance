import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Login({ users = [], onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const submit = (e) => {
    e?.preventDefault()
    if (!username || !password) { setError('Plotëso të gjitha fushat.'); return }
    setLoading(true)
    setError('')
    const user = users.find(u => u.username === username && u.password === password)
    if (!user) {
      setError('Emri i përdoruesit ose fjalëkalimi i pasaktë')
      setLoading(false)
      return
    }
    onLogin(user)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xs">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="MEGA N TV" className="w-14 h-14 rounded-2xl shadow mb-3" />
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">MEGA N TV Flow</h1>
          <p className="text-xs text-gray-400 mt-0.5">Menaxhimi Financiar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={submit} autoComplete="on" className="space-y-4">

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="u">
                Përdoruesi
              </label>
              <input
                id="u"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="p.sh. xpmx"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-gray-50 placeholder-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="p">
                Fjalëkalimi
              </label>
              <div className="relative">
                <input
                  id="p"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-gray-50 placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
                >
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Duke u kyçur...' : 'Kyçu'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
