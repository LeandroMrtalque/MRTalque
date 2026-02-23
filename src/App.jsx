import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cronograma from './pages/Cronograma'
import Operacao from './pages/Operacao'
import Clientes from './pages/Clientes'
import Funcionarios from './pages/Funcionarios'
import Layout from './components/Layout'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="cronograma" element={<Cronograma />} />
          <Route path="operacao/nova" element={<Operacao />} />
          <Route path="operacao/:id" element={<Operacao />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="funcionarios" element={<Funcionarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
