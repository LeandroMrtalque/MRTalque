import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ operacoes: 0, lojas: 0, funcionarios: 0, pendentes: 0 })
  const [proximas, setProximas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const [
        { count: totalOps },
        { count: totalLojas },
        { count: totalFuncs },
        { count: pendentes },
        { data: proximasOps }
      ] = await Promise.all([
        supabase.from("operacoes").select("*", { count: "exact", head: true }),
        supabase.from("lojas").select("*", { count: "exact", head: true }),
        supabase.from("funcionarios").select("*", { count: "exact", head: true }),
        supabase.from("operacoes").select("*", { count: "exact", head: true }).eq("status", "Pendente"),
        supabase.from("operacoes")
          .select("*, lojas(razao_social, cidade)")
          .gte("data", new Date().toISOString().split("T")[0])
          .order("data", { ascending: true })
          .limit(5)
      ])
      setStats({ operacoes: totalOps || 0, lojas: totalLojas || 0, funcionarios: totalFuncs || 0, pendentes: pendentes || 0 })
      setProximas(proximasOps || [])
      setLoading(false)
    }
    carregar()
  }, [])

  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

  function formatarData(dateStr) {
    if (!dateStr) return { dia: "--", mes: "---" }
    const d = new Date(dateStr + "T00:00:00")
    return { dia: d.getDate(), mes: meses[d.getMonth()] }
  }

  function badgeStatus(status) {
    const map = { "Confirmado": "badge-green", "Pendente": "badge-orange", "Concluido": "badge-muted", "Cancelado": "badge-red" }
    return map[status] || "badge-muted"
  }

  if (loading) return <div style={{ padding: "2rem", color: "var(--muted2)" }}>Carregando...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Visao geral da operacao</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/operacao/nova")}>+ Nova Operacao</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total de Operacoes</div>
          <div className="stat-value" style={{ color: "var(--accent)" }}>{stats.operacoes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lojas Cadastradas</div>
          <div className="stat-value" style={{ color: "var(--accent)" }}>{stats.lojas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Funcionarios</div>
          <div className="stat-value" style={{ color: "var(--accent)" }}>{stats.funcionarios}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendentes</div>
          <div className="stat-value" style={{ color: "var(--orange)" }}>{stats.pendentes}</div>
          {stats.pendentes > 0 && <div className="stat-delta warn">Requer atencao</div>}
        </div>
      </div>

      <div>
        <div className="section-header">
          <span className="section-title">Proximas Operacoes</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/cronograma")}>Ver cronograma</button>
        </div>
        {proximas.length === 0 ? (
          <div className="card" style={{ color: "var(--muted2)", fontSize: "0.875rem", textAlign: "center", padding: "2rem" }}>
            Nenhuma operacao futura cadastrada.
          </div>
        ) : (
          proximas.map(op => {
            const { dia, mes } = formatarData(op.data)
            return (
              <div key={op.id} className="upcoming-item" onClick={() => navigate("/operacao/" + op.id)}>
                <div style={{ textAlign: "center", minWidth: "40px" }}>
                  <div className="upc-day">{dia}</div>
                  <div className="upc-month">{mes}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="upc-title">{op.titulo}</div>
                  <div className="upc-meta">
                    {op.lojas && op.lojas.cidade ? op.lojas.cidade : ""}
                    {op.hora_inicio ? " - " + op.hora_inicio.slice(0,5) : ""}
                    {op.hora_fim ? " ate " + op.hora_fim.slice(0,5) : ""}
                  </div>
                </div>
                <span className={"badge " + badgeStatus(op.status)}>{op.status}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
