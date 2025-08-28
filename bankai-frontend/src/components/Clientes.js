import React, { useEffect, useState } from 'react';

function Clientes() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/clientes')
      .then(res => res.json())
      .then(data => setClientes(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Lista de Clientes</h1>
      <ul>
        {clientes.map(cliente => (
          <li key={cliente.id}>
            {cliente.nome} - {cliente.email} - {cliente.telefone}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Clientes;
