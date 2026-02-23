import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setLoading(false)
  }

  return (
    <div id="screen-login" className="screen active">
      <div className="login-glow"></div>
      <div className="login-grid-bg"></div>
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon">📅</div>
          <div className="login-logo-text">MR <span>TALQUE</span></div>
        </div>
        <h2 className="login-title">Bem-vindo de volta</h2>
        <p className="login-sub">Entre para gerenciar sua equipe e operações</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>E-mail</label>
            <input className="input" type="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input className="input" type="password" placeholder="••••••••"
              value={senha} onChange={e => setSenha(e.target.value)} required />
          </div>
          {erro && <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{erro}</p>}
          <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no sistema'}
          </button>
        </form>
        <div className="login-divider"></div>
        <div className="login-footer">MR TALQUE v1.0 · Gestão de Equipes de Campo</div>
      </div>
    </div>
  )
}