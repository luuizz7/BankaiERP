import React, { useEffect, useState } from "react";
import API from "../api";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    API.get("/clientes")
      .then(res => setClientes(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Clientes</h2>
      <ul>
        {clientes.map(c => (
          <li key={c.id}>{c.nome} - {c.email}</li>
        ))}
      </ul>
    </div>
  );
}
