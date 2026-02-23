import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function Cronograma() {
  const navigate = useNavigate()
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [operacoes, setOperacoes] = useState([])
  const [view, setView] = useState('cal')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      const inicio = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
      const fim    = `${ano}-${String(mes + 1).padStart(2, '0')}-31`
      const { data } = await supabase
        .from('operacoes')
        .select('*, lojas(razao_social, cidade)')
        .gte('data', inicio)
        .lte('data', fim)
        .order('data', { ascending: true })
      setOperacoes(data || [])
      setLoading(false)
    }
    carregar()
  }, [mes, ano])

  function navMes(dir) {
    const d = new Date(ano, mes + dir, 1)
    setMes(d.getMonth())
    setAno(d.getFullYear())
  }

  function opsDoDia(dia) {
    const ds = `${ano}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return operacoes.filter(op => op.data === ds)
  }

  function corEvento(status) {
    const map = { 'Confirmado': 'ev-green', 'Pendente': 'ev-orange', 'Concluído': 'ev-muted', 'Em andamento': 'ev-yellow' }
    return map[status] || 'ev-muted'
  }

  function badgeStatus(status) {
    const map = { 'Confirmado': 'badge-green', 'Pendente': 'badge-orange', 'Concluído': 'badge-muted', 'Cancelado': 'badge-red' }
    return map[status] || 'badge-muted'
  }

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes   = new Date(ano, mes + 1, 0).getDate()
  const diasAntes   = new Date(ano, mes, 0).getDate()
  const totalCelulas = Math.ceil((primeiroDia + diasNoMes) / 7) * 7

  const mesesCurtos = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Cronograma</div>
          <div className="page-sub">Clique num evento para editar · + para nova operação</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/operacao/nova')}>
          + Nova Operação
        </button>
      </div>

      <div className="sched-controls">
        <div className="sched-nav">
          <button className="nav-arrow" onClick={() => navMes(-1)}>‹</button>
          <div className="sched-month">{MESES[mes]} {ano}</div>
          <button className="nav-arrow" onClick={() => navMes(1)}>›</button>
        </div>
        <div className="view-toggle">
          <button className={`view-btn ${view === 'cal' ? 'active' : ''}`} onClick={() => setView('cal')}>Calendário</button>
          <button className={`view-btn ${view === 'lst' ? 'active' : ''}`} onClick={() => setView('lst')}>Lista</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted2)', padding: '2rem' }}>Carregando...</div>
      ) : view === 'cal' ? (
        <div className="cal-wrap">
          <div className="cal-grid-head">
            {DIAS_SEMANA.map(d => <div key={d} className="cal-head-cell">{d}</div>)}
          </div>
          <div className="cal-grid-body">
            {Array.from({ length: totalCelulas }).map((_, i) => {
              const dia = i - primeiroDia + 1
              const outroMes = dia < 1 || dia > diasNoMes
              const numExibido = outroMes
                ? (dia < 1 ? diasAntes + dia : dia - diasNoMes)
                : dia
              const isHoje = !outroMes && dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()
              const eventos = outroMes ? [] : opsDoDia(dia)
              const ds = `${ano}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`

              return (
                <div key={i} className={`cal-cell ${outroMes ? 'other-month' : ''} ${isHoje ? 'today' : ''}`}>
                  <div className="cal-num">{numExibido}</div>
                  {eventos.map(op => (
                    <div
                      key={op.id}
                      className={`cal-event ${corEvento(op.status)}`}
                      onClick={e => { e.stopPropagation(); navigate(`/operacao/${op.id}`) }}
                    >
                      {op.titulo}
                    </div>
                  ))}
                  {!outroMes && (
                    <button className="cal-add" onClick={e => { e.stopPropagation(); navigate(`/operacao/nova?data=${ds}`) }}>+</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="sched-list">
          {operacoes.length === 0 ? (
            <div className="card" style={{ color: 'var(--muted2)', textAlign: 'center', padding: '2rem' }}>
              Nenhuma operação neste mês.
            </div>
          ) : operacoes.map(op => {
            const d = new Date(op.data + 'T00:00:00')
            return (
              <div key={op.id} className="sched-row" onClick={() => navigate(`/operacao/${op.id}`)}>
                <div className="sched-date-box">
                  <div className="day">{d.getDate()}</div>
                  <div className="mon">{mesesCurtos[d.getMonth()]}</div>
                </div>
                <div className="sched-info">
                  <div className="sched-title-text">{op.titulo}</div>
                  <div className="sched-meta">
                    {op.lojas?.cidade && <span>📍 {op.lojas.cidade}</span>}
                    {op.hora_inicio && <span>🕘 {op.hora_inicio.slice(0,5)}{op.hora_fim ? ` – ${op.hora_fim.slice(0,5)}` : ''}</span>}
                    {op.tipo && <span>📋 {op.tipo}</span>}
                  </div>
                </div>
                <span className={`badge ${badgeStatus(op.status)}`}>{op.status}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}