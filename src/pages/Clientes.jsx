import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modo, setModo] = useState("lista") // "lista" ou "form"
  const [editando, setEditando] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    razao_social: '',
    cnpj: '',
    cidade: '',
    km_matriz: '',
    qtd_itens: '',
    sistema: '',
    contato: '',
    horario_abertura: '',
    horario_fechamento: '',
    senha_wifi: '',
    observacoes: ''
  })

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)
    const { data, error } = await supabase
      .from("lojas")
      .select("*")
      .order("razao_social", { ascending: true })

    if (error) {
      console.error("Erro:", error.message)
    }
    setClientes(data || [])
    setLoading(false)
  }

  function clientesFiltrados() {
    return clientes.filter(c =>
      c.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj?.includes(search) ||
      c.cidade?.toLowerCase().includes(search.toLowerCase())
    )
  }

  function novoCliente() {
    setForm({
      razao_social: '',
      cnpj: '',
      cidade: '',
      km_matriz: '',
      qtd_itens: '',
      sistema: '',
      contato: '',
      horario_abertura: '',
      horario_fechamento: '',
      senha_wifi: '',
      observacoes: ''
    })
    setEditando(null)
    setModo("form")
  }

  function editarCliente(cliente) {
    setForm({
      razao_social: cliente.razao_social || '',
      cnpj: cliente.cnpj || '',
      cidade: cliente.cidade || '',
      km_matriz: cliente.km_matriz || '',
      qtd_itens: cliente.qtd_itens || '',
      sistema: cliente.sistema || '',
      contato: cliente.contato || '',
      horario_abertura: cliente.horario_abertura || '',
      horario_fechamento: cliente.horario_fechamento || '',
      senha_wifi: cliente.senha_wifi || '',
      observacoes: cliente.observacoes || ''
    })
    setEditando(cliente.id)
    setModo("form")
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function maskCNPJ(v) {
    v = v.replace(/\D/g, '')
    v = v.replace(/^(\d{2})(\d)/, '$1.$2')
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2')
    v = v.replace(/(\d{4})(\d)/, '$1-$2')
    return v.substring(0, 18)
  }

  async function salvar() {
    if (!form.razao_social) return alert('Preencha a razão social.')
    setSaving(true)

    const payload = {
      razao_social: form.razao_social,
      cnpj: form.cnpj || null,
      cidade: form.cidade || null,
      km_matriz: form.km_matriz || null,
      qtd_itens: form.qtd_itens || null,
      sistema: form.sistema || null,
      contato: form.contato || null,
      horario_abertura: form.horario_abertura || null,
      horario_fechamento: form.horario_fechamento || null,
      senha_wifi: form.senha_wifi || null,
      observacoes: form.observacoes || null
    }

    if (!editando) {
      const { data, error } = await supabase
        .from('lojas')
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
        .from('lojas')
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

  function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja deletar este cliente?")) {
      deletarCliente(id)
    }
  }

  async function deletarCliente(id) {
    const { error } = await supabase.from("lojas").delete().eq("id", id)
    if (error) {
      alert("Erro ao deletar: " + error.message)
      return
    }
    carregar()
  }

  // ============ MODO LISTA ============
  if (modo === "lista") {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Lojas / Clientes</div>
            <div className="page-sub">Gerenciamento de clientes e lojas</div>
          </div>
          <button className="btn btn-primary" onClick={novoCliente}>+ Novo Cliente</button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            className="input"
            placeholder="Buscar por razão social, CNPJ ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ color: "var(--muted2)", padding: "2rem" }}>Carregando...</div>
        ) : clientesFiltrados().length === 0 ? (
          <div className="card" style={{ color: "var(--muted2)", textAlign: "center", padding: "2rem" }}>
            {clientes.length === 0 ? "Nenhum cliente cadastrado." : "Nenhum cliente encontrado na busca."}
          </div>
        ) : (
          <div className="clientes-grid">
            {clientesFiltrados().map(cliente => (
              <div key={cliente.id} className="cliente-card card">
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                    {cliente.razao_social}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted2)" }}>
                    {cliente.cnpj}
                  </div>
                </div>

                <div style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                  <div><strong>Cidade:</strong> {cliente.cidade || "—"}</div>
                  <div><strong>KM Matriz:</strong> {cliente.km_matriz || "—"}</div>
                  <div><strong>Itens:</strong> {cliente.qtd_itens || "—"}</div>
                  <div><strong>Sistema:</strong> {cliente.sistema || "—"}</div>
                  {cliente.contato && <div><strong>Contato:</strong> {cliente.contato}</div>}
                  {(cliente.horario_abertura || cliente.horario_fechamento) && (
                    <div>
                      <strong>Horário:</strong> {cliente.horario_abertura?.slice(0, 5) || "—"} às {cliente.horario_fechamento?.slice(0, 5) || "—"}
                    </div>
                  )}
                  {cliente.senha_wifi && <div><strong>WiFi:</strong> {cliente.senha_wifi}</div>}
                  {cliente.observacoes && (
                    <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)", fontSize: "0.85rem" }}>
                      <strong>Obs:</strong> {cliente.observacoes}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => editarCliente(cliente)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ flex: 1, color: "var(--red)" }}
                    onClick={() => handleDelete(cliente.id)}
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`
          .clientes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
          }

          .cliente-card {
            padding: 1.25rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .cliente-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          @media (max-width: 768px) {
            .clientes-grid {
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
        ← Voltar para Lojas / Clientes
      </button>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="page-title">{editando ? 'Editar Cliente' : 'Novo Cliente'}</div>
          <div className="page-sub">Preencha as informações do cliente/loja</div>
        </div>
      </div>

      {/* INFORMAÇÕES DO CLIENTE */}
      <div className="section-card">
        <div className="section-card-title">🏪 Informações do Cliente</div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Razão Social*</label>
            <input
              className="input"
              placeholder="Nome jurídico da empresa"
              value={form.razao_social}
              onChange={e => set('razao_social', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>CNPJ</label>
            <input
              className="input"
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={e => set('cnpj', maskCNPJ(e.target.value))}
            />
          </div>
        </div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Cidade</label>
            <input
              className="input"
              placeholder="Ex: Criciúma – SC"
              value={form.cidade}
              onChange={e => set('cidade', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>KM da Matriz (MR)</label>
            <input
              className="input"
              type="number"
              placeholder="Ex: 45"
              value={form.km_matriz}
              onChange={e => set('km_matriz', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Quantidade de Itens</label>
            <input
              className="input"
              type="number"
              placeholder="Ex: 1200"
              value={form.qtd_itens}
              onChange={e => set('qtd_itens', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Sistema</label>
            <select
              className="input"
              value={form.sistema}
              onChange={e => set('sistema', e.target.value)}
            >
              <option value="">Selecione...</option>
              <option>SAP</option>
              <option>TOTVS</option>
              <option>Linx</option>
              <option>Oracle</option>
              <option>Outro</option>
            </select>
          </div>
        </div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Contato</label>
            <input
              className="input"
              placeholder="(XX) XXXXX-XXXX ou email"
              value={form.contato}
              onChange={e => set('contato', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Horário de Abertura</label>
            <input
              className="input"
              type="time"
              value={form.horario_abertura}
              onChange={e => set('horario_abertura', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row c2">
          <div className="form-group">
            <label>Horário de Fechamento</label>
            <input
              className="input"
              type="time"
              value={form.horario_fechamento}
              onChange={e => set('horario_fechamento', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Senha do WiFi</label>
            <input
              className="input"
              type="text"
              placeholder="Senha de acesso"
              value={form.senha_wifi}
              onChange={e => set('senha_wifi', e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Observações</label>
          <textarea
            className="input"
            rows="3"
            placeholder="Informações adicionais sobre o cliente..."
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
          />
        </div>
      </div>

      <div className="op-footer">
        <button className="btn btn-ghost" onClick={cancelar}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={salvar} disabled={saving}>
          {saving ? 'Salvando...' : '✓ Salvar Cliente'}
        </button>
      </div>
    </div>
  )
}
