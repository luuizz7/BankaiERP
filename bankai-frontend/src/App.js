// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import Clientes from './Clientes';

function App() {
  return (
    <Router>
      <div>
        {/* Menu de navegação simples */}
        <nav style={{ padding: '10px', background: '#eee' }}>
          <Link to="/" style={{ marginRight: '10px' }}>Dashboard</Link>
          <Link to="/clientes">Clientes</Link>
        </nav>

        {/* Rotas */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
