import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



// -------------------- CLIENTES --------------------
app.get('/clientes', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM clientes ORDER BY id'); res.json(result.rows); }
  catch (err) { res.status(500).send(err.message); }
});

app.post('/clientes', async (req, res) => {
  const { nome, email, telefone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO clientes (nome, email, telefone) VALUES ($1,$2,$3) RETURNING *',
      [nome,email,telefone]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).send(err.message); }
});

app.put('/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nome,email,telefone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE clientes SET nome=$1,email=$2,telefone=$3 WHERE id=$4 RETURNING *',
      [nome,email,telefone,id]
    );
    res.json(result.rows[0]);
  } catch(err){res.status(500).send(err.message);}
});

app.delete('/clientes/:id', async (req,res)=>{
  const {id} = req.params;
  try {await pool.query('DELETE FROM clientes WHERE id=$1',[id]); res.json({message:'Cliente deletado!'});}
  catch(err){res.status(500).send(err.message);}
});

// -------------------- FORNECEDORES --------------------
app.get('/fornecedores', async (req,res)=>{
  try {const result = await pool.query('SELECT * FROM fornecedores ORDER BY id'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/fornecedores', async (req,res)=>{
  const {nome,cnpj,telefone,email} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO fornecedores (nome,cnpj,telefone,email) VALUES ($1,$2,$3,$4) RETURNING *',
      [nome,cnpj,telefone,email]
    );
    res.json(result.rows[0]);
  } catch(err){res.status(500).send(err.message);}
});

app.put('/fornecedores/:id', async(req,res)=>{
  const {id} = req.params;
  const {nome,cnpj,telefone,email} = req.body;
  try{
    const result = await pool.query(
      'UPDATE fornecedores SET nome=$1,cnpj=$2,telefone=$3,email=$4 WHERE id=$5 RETURNING *',
      [nome,cnpj,telefone,email,id]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

app.delete('/fornecedores/:id', async(req,res)=>{
  const {id} = req.params;
  try{await pool.query('DELETE FROM fornecedores WHERE id=$1',[id]); res.json({message:'Fornecedor deletado!'});}
  catch(err){res.status(500).send(err.message);}
});

// -------------------- CATEGORIAS --------------------
app.get('/categorias', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM categorias ORDER BY id'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/categorias', async(req,res)=>{
  const {nome} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO categorias (nome) VALUES ($1) RETURNING *',
      [nome]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- PRODUTOS --------------------
app.get('/produtos', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM produtos ORDER BY id'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/produtos', async(req,res)=>{
  const {nome,categoria_id,preco,estoque_atual} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO produtos (nome,categoria_id,preco,estoque_atual) VALUES ($1,$2,$3,$4) RETURNING *',
      [nome,categoria_id,preco,estoque_atual]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- VENDEDORES --------------------
app.get('/vendedores', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM vendedores ORDER BY id'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/vendedores', async(req,res)=>{
  const {nome,email,telefone,salario} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO vendedores (nome,email,telefone,salario) VALUES ($1,$2,$3,$4) RETURNING *',
      [nome,email,telefone,salario]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- ESTOQUE --------------------
app.get('/estoque', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM estoque ORDER BY id DESC'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/estoque', async(req,res)=>{
  const {produto_id,quantidade,tipo_movimento} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO estoque (produto_id,quantidade,tipo_movimento) VALUES ($1,$2,$3) RETURNING *',
      [produto_id,quantidade,tipo_movimento]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- ORDEM DE COMPRA --------------------
app.get('/ordem_compra', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM ordem_compra ORDER BY id DESC'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/ordem_compra', async(req,res)=>{
  const {fornecedor_id,status} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO ordem_compra (fornecedor_id,status) VALUES ($1,$2) RETURNING *',
      [fornecedor_id,status]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- NOTAS DE ENTRADA --------------------
app.get('/notas_entrada', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM notas_entrada ORDER BY id DESC'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/notas_entrada', async(req,res)=>{
  const {produto_id,quantidade,fornecedor_id,data} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO notas_entrada (produto_id,quantidade,fornecedor_id,data) VALUES ($1,$2,$3,$4) RETURNING *',
      [produto_id,quantidade,fornecedor_id,data]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- NOTAS DE SAÍDA --------------------
app.get('/notas_saida', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM notas_saida ORDER BY id DESC'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/notas_saida', async(req,res)=>{
  const {produto_id,quantidade,cliente_id,data} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO notas_saida (produto_id,quantidade,cliente_id,data) VALUES ($1,$2,$3,$4) RETURNING *',
      [produto_id,quantidade,cliente_id,data]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- PEDIDOS DE VENDA --------------------
app.get('/pedidos_venda', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM pedidos_venda ORDER BY id DESC'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/pedidos_venda', async(req,res)=>{
  const {cliente_id,produto_id,quantidade,status} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO pedidos_venda (cliente_id,produto_id,quantidade,status) VALUES ($1,$2,$3,$4) RETURNING *',
      [cliente_id,produto_id,quantidade,status]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- ORÇAMENTOS --------------------
app.get('/orcamentos', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM orcamentos ORDER BY id DESC'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/orcamentos', async(req,res)=>{
  const {cliente_id,valor,data,status} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO orcamentos (cliente_id,valor,data,status) VALUES ($1,$2,$3,$4) RETURNING *',
      [cliente_id,valor,data,status]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- CONTAS A PAGAR --------------------
app.post('/contas_pagar', async(req,res)=>{
  const {fornecedor_id,valor,vencimento,status} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO contas_pagar (fornecedor_id,valor,vencimento,status) VALUES ($1,$2,$3,$4) RETURNING *',
      [fornecedor_id,valor,vencimento,status]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

app.put('/contas_pagar/:id', async(req,res)=>{
  const {id} = req.params;
  const {fornecedor_id,valor,vencimento,status} = req.body;
  try{
    const result = await pool.query(
      'UPDATE contas_pagar SET fornecedor_id=$1,valor=$2,vencimento=$3,status=$4 WHERE id=$5 RETURNING *',
      [fornecedor_id,valor,vencimento,status,id]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

app.delete('/contas_pagar/:id', async(req,res)=>{
  const {id} = req.params;
  try{
    await pool.query('DELETE FROM contas_pagar WHERE id=$1',[id]);
    res.json({message:'Conta a pagar deletada!'});
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- CONTAS A RECEBER --------------------
app.get('/contas_receber', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM contas_receber ORDER BY id DESC'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/contas_receber', async(req,res)=>{
  const {cliente_id,valor,vencimento,status} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO contas_receber (cliente_id,valor,vencimento,status) VALUES ($1,$2,$3,$4) RETURNING *',
      [cliente_id,valor,vencimento,status]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

app.put('/contas_receber/:id', async(req,res)=>{
  const {id} = req.params;
  const {cliente_id,valor,vencimento,status} = req.body;
  try{
    const result = await pool.query(
      'UPDATE contas_receber SET cliente_id=$1,valor=$2,vencimento=$3,status=$4 WHERE id=$5 RETURNING *',
      [cliente_id,valor,vencimento,status,id]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

app.delete('/contas_receber/:id', async(req,res)=>{
  const {id} = req.params;
  try{
    await pool.query('DELETE FROM contas_receber WHERE id=$1',[id]);
    res.json({message:'Conta a receber deletada!'});
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- CAIXA --------------------
app.get('/caixa', async(req,res)=>{
  try{const result = await pool.query('SELECT * FROM caixa ORDER BY id DESC'); res.json(result.rows);}
  catch(err){res.status(500).send(err.message);}
});

app.post('/caixa', async(req,res)=>{
  const {descricao,valor,tipo,data} = req.body;
  try{
    const result = await pool.query(
      'INSERT INTO caixa (descricao,valor,tipo,data) VALUES ($1,$2,$3,$4) RETURNING *',
      [descricao,valor,tipo,data]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

app.put('/caixa/:id', async(req,res)=>{
  const {id} = req.params;
  const {descricao,valor,tipo,data} = req.body;
  try{
    const result = await pool.query(
      'UPDATE caixa SET descricao=$1,valor=$2,tipo=$3,data=$4 WHERE id=$5 RETURNING *',
      [descricao,valor,tipo,data,id]
    );
    res.json(result.rows[0]);
  }catch(err){res.status(500).send(err.message);}
});

app.delete('/caixa/:id', async(req,res)=>{
  const {id} = req.params;
  try{
    await pool.query('DELETE FROM caixa WHERE id=$1',[id]);
    res.json({message:'Registro de caixa deletado!'});
  }catch(err){res.status(500).send(err.message);}
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
  console.log(`🚀 Bankai ERP API funcionando na porta ${PORT}!`);
});
