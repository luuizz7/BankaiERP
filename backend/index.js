import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// =======================
// Rota de teste
// =======================
app.get("/", (req, res) => {
  res.send("🚀 Bankai ERP API funcionando!");
});

// =======================
// CRUD de Clientes
// =======================

// Listar todos os clientes
app.get("/clientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clientes ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar clientes");
  }
});

// Buscar cliente por ID
app.get("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM clientes WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).send("Cliente não encontrado");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar cliente");
  }
});

// Criar novo cliente
app.post("/clientes", async (req, res) => {
  const { nome, email, telefone } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO clientes (nome, email, telefone) VALUES ($1, $2, $3) RETURNING *",
      [nome, email, telefone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao criar cliente");
  }
});

// Atualizar cliente
app.put("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone } = req.body;
  try {
    const result = await pool.query(
      "UPDATE clientes SET nome=$1, email=$2, telefone=$3 WHERE id=$4 RETURNING *",
      [nome, email, telefone, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Cliente não encontrado");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao atualizar cliente");
  }
});

// Deletar cliente
app.delete("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM clientes WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).send("Cliente não encontrado");
    }
    res.json({ mensagem: "Cliente deletado com sucesso", cliente: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao deletar cliente");
  }
});

app.get("/produtos", async (req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.nome, p.preco, p.estoque_atual, c.nome AS categoria
     FROM produtos p
     LEFT JOIN categorias c ON p.categoria_id = c.id
     ORDER BY p.id`
  );
  res.json(result.rows);
});

app.get("/vendedores", async (req, res) => {
  const result = await pool.query("SELECT * FROM vendedores ORDER BY id");
  res.json(result.rows);
});

app.get("/estoque", async (req, res) => {
  const result = await pool.query(
    `SELECT e.id, p.nome AS produto, e.quantidade, e.tipo_movimento, e.data_movimento
     FROM estoque e
     JOIN produtos p ON e.produto_id = p.id
     ORDER BY e.data_movimento DESC`
  );
  res.json(result.rows);
});

app.get("/ordens_compra", async (req, res) => {
  const result = await pool.query(
    `SELECT o.id, f.nome AS fornecedor, o.data_ordem, o.status
     FROM ordem_compra o
     JOIN fornecedores f ON o.fornecedor_id = f.id
     ORDER BY o.data_ordem DESC`
  );
  res.json(result.rows);
});

app.get("/notas_entrada", async (req, res) => {
  const result = await pool.query(
    `SELECT n.id, o.id AS ordem_id, p.nome AS produto, n.quantidade, n.data_entrada
     FROM notas_entrada n
     JOIN ordem_compra o ON n.ordem_id = o.id
     JOIN produtos p ON n.produto_id = p.id
     ORDER BY n.data_entrada DESC`
  );
  res.json(result.rows);
});

app.get("/necessidades_compra", async (req, res) => {
  const result = await pool.query(
    `SELECT nc.id, p.nome AS produto, nc.quantidade_necessaria, nc.data_registro
     FROM necessidade_compra nc
     JOIN produtos p ON nc.produto_id = p.id
     ORDER BY nc.data_registro DESC`
  );
  res.json(result.rows);
});

app.get("/pedidos_venda", async (req, res) => {
  const result = await pool.query(
    `SELECT p.id, c.nome AS cliente, v.nome AS vendedor, p.data_pedido, p.status, p.total
     FROM pedidos_venda p
     JOIN clientes c ON p.cliente_id = c.id
     JOIN vendedores v ON p.vendedor_id = v.id
     ORDER BY p.data_pedido DESC`
  );
  res.json(result.rows);
});

app.get("/itens_pedido/:pedido_id", async (req, res) => {
  const { pedido_id } = req.params;
  const result = await pool.query(
    `SELECT i.id, pr.nome AS produto, i.quantidade, i.preco_unitario
     FROM itens_pedido i
     JOIN produtos pr ON i.produto_id = pr.id
     WHERE i.pedido_id = $1`,
    [pedido_id]
  );
  res.json(result.rows);
});

app.get("/orcamentos", async (req, res) => {
  const result = await pool.query(
    `SELECT o.id, c.nome AS cliente, v.nome AS vendedor, o.data_orcamento, o.status, o.total
     FROM orcamentos o
     JOIN clientes c ON o.cliente_id = c.id
     JOIN vendedores v ON o.vendedor_id = v.id
     ORDER BY o.data_orcamento DESC`
  );
  res.json(result.rows);
});

app.get("/caixa", async (req, res) => {
  const result = await pool.query("SELECT * FROM caixa ORDER BY data_movimento DESC");
  res.json(result.rows);
});

app.get("/contas_pagar", async (req, res) => {
  const result = await pool.query(
    `SELECT cp.id, f.nome AS fornecedor, cp.data_vencimento, cp.valor, cp.status
     FROM contas_pagar cp
     JOIN fornecedores f ON cp.fornecedor_id = f.id
     ORDER BY cp.data_vencimento`
  );
  res.json(result.rows);
});

app.get("/contas_receber", async (req, res) => {
  const result = await pool.query(
    `SELECT cr.id, c.nome AS cliente, cr.data_vencimento, cr.valor, cr.status
     FROM contas_receber cr
     JOIN clientes c ON cr.cliente_id = c.id
     ORDER BY cr.data_vencimento`
  );
  res.json(result.rows);
});


// =======================
// Servidor
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
