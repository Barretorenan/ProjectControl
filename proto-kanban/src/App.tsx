import { Link, Outlet } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div>
      <header style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 12, borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>ProtoKanban</h2>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">Início</Link>
          <Link to="/prototype">Prototipagem</Link>
          <Link to="/kanban">Kanban</Link>
        </nav>
      </header>
      <main style={{ padding: 12 }}>
        <Outlet />
      </main>
    </div>
  )
}

export default App
