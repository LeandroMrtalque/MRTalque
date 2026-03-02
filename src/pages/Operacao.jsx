import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

export default function Operacao() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isNova = id === 'nova'

  const [lojas, setLojas] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [equipe, setEquipe] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo: '', tipo: 'Auditoria', data: searchParams.get('data') || '',
    hora_inicio: '09:00', hora_fim: '13:00', status: 'Pendente',
    loja_id: '', forma_deslocamento: '', observacoes: ''
  })
  const [loja, setLoja] = useState({
    razao_social: '', cnpj: '', cidade: '', km_matriz: '', qtd_itens: '', sistema: ''
  })

  useEffect(() => {
  async function carregar() {
    const [{ data: lojasData }, { data: funcsData }] = await Promise.all([
      supabase.from('lojas').select('*').order('razao_social'),
      supabase.from('funcionarios').select('*').eq('status', 'Ativo').order('nome')
    ])
    setLojas(lojasData || [])
    setFuncionarios(funcsData || [])

    if (!isNova && id) {
      const { data: op } = await supabase
        .from('operacoes')
        .select('*')
        .eq('id', id)
        .single()

      if (op) {
        setForm({
          titulo: op.titulo || '',
          tipo: op.tipo || 'Auditoria',
          data: op.data || '',
          hora_inicio: op.hora_inicio || '09:00',
          hora_fim: op.hora_fim || '13:00',
          status: op.status || 'Pendente',
          loja_id: op.loja_id || '',
          forma_deslocamento: op.forma_deslocamento || '',
          observacoes: op.observacoes || ''
        })

        if (op.loja_id) {
          const loja = lojasData?.find(x => x.id === op.loja_id)
          if (loja) setLoja({
            razao_social: loja.razao_social || '',
            cnpj: loja.cnpj || '',
            cidade: loja.cidade || '',
            km_matriz: loja.km_matriz || '',
            qtd_itens: loja.qtd_itens || '',
            sistema: loja.sistema || ''
          })
        }

        const { data: eqData } = await supabase
          .from('operacao_funcionarios')
          .select('funcionario_id')
          .eq('operacao_id', id)
        setEquipe(eqData?.map(e => e.funcionario_id) || [])
      }
    }
  }
  carregar()
}, [id])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function setL(field, value) { setLoja(l => ({ ...l, [field]: value })) }

  function toggleFuncionario(fid) {
    setEquipe(e => e.includes(fid) ? e.filter(x => x !== fid) : [...e, fid])
  }

  function maskCNPJ(v) {
    v = v.replace(/\D/g,'')
    v = v.replace(/^(\d{2})(\d)/,'$1.$2')
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
    v = v.replace(/\.(\d{3})(\d)/,'.$1/$2')
    v = v.replace(/(\d{4})(\d)/,'$1-$2')
    return v.substring(0,18)
  }

  async function salvar() {
    if (!form.titulo) return alert('Preencha o título da operação.')
    if (!isNova && !id) return alert('Erro: ID da operação não encontrado.')
    setSaving(true)

    const payload = {
      titulo: form.titulo, tipo: form.tipo, data: form.data,
      hora_inicio: form.hora_inicio, hora_fim: form.hora_fim,
      status: form.status, loja_id: form.loja_id || null,
      forma_deslocamento: form.forma_deslocamento, observacoes: form.observacoes
    }

    let opId = id
    if (isNova) {
      const { data, error } = await supabase.from('operacoes').insert(payload).select().single()
      if (error) { alert('Erro ao salvar: ' + error.message); setSaving(false); return }
      opId = data.id
    } else {
      const { error } = await supabase.from('operacoes').update(payload).eq('id', id)
      if (error) { alert('Erro ao atualizar: ' + error.message); setSaving(false); return }
    }

    // Salvar equipe
    const { error: errorDelete } = await supabase.from('operacao_funcionarios').delete().eq('operacao_id', opId)
    if (errorDelete) { alert('Erro ao remover equipe: ' + errorDelete.message); setSaving(false); return }

    if (equipe.length > 0) {
      const { error: errorInsert } = await supabase.from('operacao_funcionarios').insert(
        equipe.map(fid => ({ operacao_id: opId, funcionario_id: fid }))
      )
      if (errorInsert) { alert('Erro ao adicionar equipe: ' + errorInsert.message); setSaving(false); return }
    }

    setSaving(false)
    navigate('/cronograma')
  }

  function inicialNome(nome) {
    return nome ? nome.split(' ').map(p => p[0]).join('').substring(0,2).toUpperCase() : '?'
  }

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/cronograma')}>
        ← Voltar ao Cronograma
      </button>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="page-title">{isNova ? 'Nova Operação' : 'Editar Operação'}</div>
          <div className="page-sub">Preencha todas as informações</div>
        </div>
        <select className="input" style={{ width: 'auto' }} value={form.status} onChange={e => set('status', e.target.value)}>
          <option>Pendente</option>
          <option>Confirmado</option>
          <option>Em andamento</option>
          <option>Concluído</option>
          <option>Cancelado</option>
        </select>
      </div>

      {/* INFO DA OPERAÇÃO */}
      <div className="section-card">
        <div className="section-card-title">📋 Informações da Operação</div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Título / Demanda</label>
            <input className="input" placeholder="Ex: Auditoria Mensal" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              <option>Auditoria</option><option>Inventário</option><option>Treinamento</option><option>Revisão</option><option>Outro</option>
            </select>
          </div>
        </div>
        <div className="form-row c3">
          <div className="form-group">
            <label>Data</label>
            <input className="input" type="date" value={form.data} onChange={e => set('data', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hora Início</label>
            <input className="input" type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hora Fim</label>
            <input className="input" type="time" value={form.hora_fim} onChange={e => set('hora_fim', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Loja Vinculada</label>
          <select className="input" value={form.loja_id} onChange={e => {
            set('loja_id', e.target.value)
            const l = lojas.find(x => x.id === e.target.value)
            if (l) setLoja({ razao_social: l.razao_social || '', cnpj: l.cnpj || '', cidade: l.cidade || '', km_matriz: l.km_matriz || '', qtd_itens: l.qtd_itens || '', sistema: l.sistema || '' })
          }}>
            <option value="">Selecione uma loja...</option>
            {lojas.map(l => <option key={l.id} value={l.id}>{l.razao_social}</option>)}
          </select>
        </div>
      </div>

      {/* INFORMAÇÕES DA LOJA */}
      <div className="section-card">
        <div className="section-card-title">🏪 Informações da Loja</div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Razão Social</label>
            <input className="input" placeholder="Nome jurídico" value={loja.razao_social} onChange={e => setL('razao_social', e.target.value)} />
          </div>
          <div className="form-group">
            <label>CNPJ</label>
            <input className="input" placeholder="00.000.000/0000-00" value={loja.cnpj} onChange={e => setL('cnpj', maskCNPJ(e.target.value))} />
          </div>
        </div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Cidade</label>
            <input className="input" placeholder="Ex: Criciúma – SC" value={loja.cidade} onChange={e => setL('cidade', e.target.value)} />
          </div>
          <div className="form-group">
            <label>KM da Matriz (MR)</label>
            <input className="input" type="number" placeholder="Ex: 45" value={loja.km_matriz} onChange={e => setL('km_matriz', e.target.value)} />
          </div>
        </div>
        <div className="form-row c3">
          <div className="form-group">
            <label>Qtd. de Itens</label>
            <input className="input" type="number" placeholder="Ex: 1200" value={loja.qtd_itens} onChange={e => setL('qtd_itens', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Sistema</label>
            <select className="input" value={loja.sistema} onChange={e => setL('sistema', e.target.value)}>
              <option value="">Selecione...</option>
              <option>SAP</option><option>TOTVS</option><option>Linx</option><option>Oracle</option><option>Outro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Forma de Deslocamento</label>
            <select className="input" value={form.forma_deslocamento} onChange={e => set('forma_deslocamento', e.target.value)}>
              <option value="">Selecione...</option>
              <option>Veículo próprio</option><option>Frota da empresa</option><option>Uber / App</option><option>Ônibus</option><option>Avião</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Observações</label>
          <textarea className="input" rows="3" placeholder="Informações adicionais..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </div>
      </div>

      {/* EQUIPE */}
      <div className="section-card">
        <div className="section-card-title">👥 Equipe da Operação</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted2)', marginBottom: '1rem' }}>
          Clique para adicionar ou remover da operação
        </p>
        {funcionarios.length === 0 ? (
          <p style={{ color: 'var(--muted2)', fontSize: '0.85rem' }}>
            Nenhum funcionário ativo cadastrado.{' '}
            <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/funcionarios')}>
              Cadastrar agora →
            </span>
          </p>
        ) : (
          <div className="team-selector">
            {funcionarios.map(f => (
              <div
                key={f.id}
                className={`team-chip ${equipe.includes(f.id) ? 'selected' : ''}`}
                onClick={() => toggleFuncionario(f.id)}
              >
                <div className="avatar">{inicialNome(f.nome)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="team-chip-name">{f.nome}</div>
                  <div className="team-chip-role">{f.cargo}</div>
                </div>
                <span className="team-chip-check">✓</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="op-footer">
        <button className="btn btn-ghost" onClick={() => navigate('/cronograma')}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvar} disabled={saving}>
          {saving ? 'Salvando...' : '✓ Salvar Operação'}
        </button>
      </div>
    </div>
  )
}