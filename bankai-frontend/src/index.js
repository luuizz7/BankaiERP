import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'bankai_user',       // seu usuário do PostgreSQL
  host: 'localhost',
  database: 'bankaierp',     // nome do seu banco
  password: 'minhasenha123', // senha do usuário
  port: 5432,
});

// Rota para listar clientes
app.get('/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

app.listen(5000, () => console.log('Backend rodando na porta 5000'));
