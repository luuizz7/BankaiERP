CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100),
  email VARCHAR(100),
  telefone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100),
  cnpj VARCHAR(20),
  telefone VARCHAR(20),
  email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100),
  categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
  preco NUMERIC(10,2),
  estoque_atual INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vendedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100),
  email VARCHAR(100),
  telefone VARCHAR(20),
  salario NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS estoque (
  id SERIAL PRIMARY KEY,
  produto_id INT REFERENCES produtos(id),
  quantidade INT,
  tipo_movimento VARCHAR(20), -- 'entrada' ou 'saida'
  data_movimento TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ordem_compra (
  id SERIAL PRIMARY KEY,
  fornecedor_id INT REFERENCES fornecedores(id),
  data_ordem TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'aberta'
);

CREATE TABLE IF NOT EXISTS notas_entrada (
  id SERIAL PRIMARY KEY,
  ordem_id INT REFERENCES ordem_compra(id),
  produto_id INT REFERENCES produtos(id),
  quantidade INT,
  data_entrada TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS necessidade_compra (
  id SERIAL PRIMARY KEY,
  produto_id INT REFERENCES produtos(id),
  quantidade_necessaria INT,
  data_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos_venda (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  vendedor_id INT REFERENCES vendedores(id),
  data_pedido TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'aberto',  -- aberto, faturado, cancelado
  total NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orcamentos (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  vendedor_id INT REFERENCES vendedores(id),
  data_orcamento TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pendente',
  total NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS caixa (
  id SERIAL PRIMARY KEY,
  data_movimento TIMESTAMP DEFAULT NOW(),
  tipo_movimento VARCHAR(20), -- 'entrada' ou 'saida'
  valor NUMERIC(10,2),
  descricao TEXT
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id SERIAL PRIMARY KEY,
  fornecedor_id INT REFERENCES fornecedores(id),
  data_vencimento DATE,
  valor NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'pendente' -- pendente, pago
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  data_vencimento DATE,
  valor NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'pendente' -- pendente, recebido
);


INSERT INTO clientes (nome, email, telefone) VALUES
('Maria Silva', 'maria@email.com', '11999999999'),
('João Souza', 'joao@email.com', '11988888888');