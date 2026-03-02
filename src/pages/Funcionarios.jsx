import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modo, setModo] = useState("lista") // "lista" ou "form"
  const [editando, setEditando] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    cargo: '',
    status: 'Ativo'
  })

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .order("nome", { ascending: true })

    if (error) {
      console.error("Erro:", error.message)
    }
    setFuncionarios(data || [])
    setLoading(false)
  }

  function funcionariosFiltrados() {
    return funcionarios.filter(f =>
      f.nome?.toLowerCase().includes(search.toLowerCase()) ||
      f.cargo?.toLowerCase().includes(search.toLowerCase())
    )
  }

  function novoFuncionario() {
    setForm({
      nome: '',
      cargo: '',
      status: 'Ativo'
    })
    setEditando(null)
    setModo("form")
  }

  function editarFuncionario(funcionario) {
    setForm({
      nome: funcionario.nome || '',
      cargo: funcionario.cargo || '',
      status: funcionario.status || 'Ativo'
    })
    setEditando(funcionario.id)
    setModo("form")
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function salvar() {
    if (!form.nome) return alert('Preencha o nome do funcionário.')
    if (!form.cargo) return alert('Preencha o cargo.')
    setSaving(true)

    const payload = {
      nome: form.nome,
      cargo: form.cargo,
      status: form.status
    }

    if (!editando) {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert(payload)
        .select()
        .single()
      if (error) {
        alert('Erro ao salvar: ' + error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('funcionarios')
        .update(payload)
        .eq('id', editando)
      if (error) {
        alert('Erro ao atualizar: ' + error.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    carregar()
    setModo("lista")
  }

  function cancelar() {
    setModo("lista")
    setEditando(null)
  }

  async function handleDelete(id) {
    // Verificar se tem operações vinculadas
    const { data: operacoes, error } = await supabase
      .from('operacao_funcionarios')
      .select('*')
      .eq('funcionario_id', id)

    if (error) {
      alert('Erro ao verificar vinculações: ' + error.message)
      return
    }

    if (operacoes && operacoes.length > 0) {
      alert('Não é possível deletar. Este funcionário está vinculado a ' + operacoes.length + ' operação(ões).')
      return
    }

    if (window.confirm("Tem certeza que deseja deletar este funcionário?")) {
      deletarFuncionario(id)
    }
  }

  async function deletarFuncionario(id) {
    const { error } = await supabase.from("funcionarios").delete().eq("id", id)
    if (error) {
      alert("Erro ao deletar: " + error.message)
      return
    }
    carregar()
  }

  function badgeStatus(status) {
    if (status === "Ativo") return "badge-green"
    if (status === "Inativo") return "badge-muted"
    return "badge-muted"
  }

  function inicialNome(nome) {
    return nome ? nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : '?'
  }

  // ============ MODO LISTA ============
  if (modo === "lista") {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Funcionários</div>
            <div className="page-sub">Gerenciamento de funcionários</div>
          </div>
          <button className="btn btn-primary" onClick={novoFuncionario}>+ Novo Funcionário</button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            className="input"
            placeholder="Buscar por nome ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ color: "var(--muted2)", padding: "2rem" }}>Carregando...</div>
        ) : funcionariosFiltrados().length === 0 ? (
          <div className="card" style={{ color: "var(--muted2)", textAlign: "center", padding: "2rem" }}>
            {funcionarios.length === 0 ? "Nenhum funcionário cadastrado." : "Nenhum funcionário encontrado na busca."}
          </div>
        ) : (
          <div className="funcionarios-grid">
            {funcionariosFiltrados().map(func => (
              <div key={func.id} className="funcionario-card card">
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                  <div className="avatar" style={{ width: "50px", height: "50px", fontSize: "1.2rem" }}>
                    {inicialNome(func.nome)}
                  </div>
                  <div style={{ marginLeft: "1rem", flex: 1 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                      {func.nome}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted2)" }}>
                      {func.cargo}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <span className={"badge " + badgeStatus(func.status)}>
                    {func.status}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => editarFuncionario(func)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ flex: 1, color: "var(--red)" }}
                    onClick={() => handleDelete(func.id)}
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`
          .funcionarios-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
          }

          .funcionario-card {
            padding: 1.25rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .funcionario-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--accent);
            color: white;
            font-weight: 600;
            flex-shrink: 0;
          }

          @media (max-width: 768px) {
            .funcionarios-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    )
  }

  // ============ MODO FORM ============
  return (
    <div>
      <button className="back-btn" onClick={cancelar}>
        ← Voltar para Funcionários
      </button>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="page-title">{editando ? 'Editar Funcionário' : 'Novo Funcionário'}</div>
          <div className="page-sub">Preencha as informações do funcionário</div>
        </div>
      </div>

      {/* INFORMAÇÕES DO FUNCIONÁRIO */}
      <div className="section-card">
        <div className="section-card-title">👤 Informações do Funcionário</div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Nome*</label>
            <input
              className="input"
              placeholder="Ex: João Silva"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Cargo*</label>
            <input
              className="input"
              placeholder="Ex: Auditor, Gerente"
              value={form.cargo}
              onChange={e => set('cargo', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Status</label>
            <select
              className="input"
              value={form.status}
              onChange={e => set('status', e.target.value)}
            >
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="op-footer">
        <button className="btn btn-ghost" onClick={cancelar}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={salvar} disabled={saving}>
          {saving ? 'Salvando...' : '✓ Salvar Funcionário'}
        </button>
      </div>
    </div>
  )
}
