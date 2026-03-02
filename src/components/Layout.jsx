import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { IoHome } from "react-icons/io5"
import { FaCalendarAlt } from "react-icons/fa"
import { LiaStoreSolid } from "react-icons/lia"
import { FaPeopleGroup } from "react-icons/fa6"

const navItems = [
  { to: "/",             icon: <IoHome size={16} />, label: "Dashboard"        },
  { to: "/cronograma",   icon: <FaCalendarAlt size={16} />, label: "Cronograma"       },
  { to: "/clientes",     icon: <LiaStoreSolid size={17} />, label: "Lojas / Clientes" },
  { to: "/funcionarios", icon: <FaPeopleGroup size={17} />, label: "Funcionarios"     },
]

export default function Layout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate("/login")
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="sidebar">
        <div className="sidebar-logo">
        //colocar a logo aqui.
        </div>
        <nav>
          <div className="nav-label">Principal</div>
          {navItems.slice(0, 2).map(item => (
            <NavLink key={item.to} to={item.to} end className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </NavLink>
          ))}
          <div className="nav-label">Cadastros</div>
          {navItems.slice(2).map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">AD</div>
            <div className="user-info">
              <div className="user-name">Administrador</div>
              <div className="user-role">Logado</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sair">?</button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
