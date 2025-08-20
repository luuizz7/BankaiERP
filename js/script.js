/* ========= Core Store (localStorage) ========= */
const STORE_KEY = 'bankai_erp_v1';
const PREF_KEY  = 'bankai_prefs_v1';

const emptyStore = {
  cashflows: [], // {id,date,type:'receber'|'pagar',desc,amount,status:'pendente'|'pago'}
  products:  [], // {id,sku,name,category,qty,min,price}
  customers: [], // {id,name,email,phone}
  sales:     []  // {id,date,customerId,items:[{sku,qty,price}],total}
};

function loadStore(){
  const raw = localStorage.getItem(STORE_KEY);
  if(!raw) return {...emptyStore};
  try{ return Object.assign({}, emptyStore, JSON.parse(raw)); }catch{ return {...emptyStore}; }
}
function saveStore(s){ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

// Função que cria dados iniciais apenas uma vez, se necessário.
function seed(){
  const raw = localStorage.getItem(STORE_KEY);
  // Se a chave já existe no localStorage, não faz nada.
  if(raw) return;

  const today = new Date().toISOString().slice(0,10);
  const s = {...emptyStore}; // Começa com uma loja vazia

  s.products = [
    {id:crypto.randomUUID(), sku:'P-001', name:'Camiseta Básica', category:'Vestuário', qty:30, min:10, price:39.9},
    {id:crypto.randomUUID(), sku:'P-002', name:'Caneta Azul', category:'Papelaria', qty:200, min:50, price:2.5},
    {id:crypto.randomUUID(), sku:'P-003', name:'Shampoo 300ml', category:'Higiene', qty:15, min:20, price:18.0},
  ];
  s.customers = [
    {id:crypto.randomUUID(), name:'Maria Souza', email:'maria@email.com', phone:'(11) 99999-1111'},
    {id:crypto.randomUUID(), name:'João Silva', email:'joao@email.com', phone:'(11) 98888-2222'}
  ];
  s.cashflows = [
    {id:crypto.randomUUID(), date:today, type:'receber', desc:'Venda balcão', amount:259.70, status:'pago'},
    {id:crypto.randomUUID(), date:today, type:'pagar',   desc:'Conta de luz', amount:320.00, status:'pendente'},
    {id:crypto.randomUUID(), date:today, type:'receber', desc:'Serviço manutenção', amount:480.00, status:'pendente'},
  ];
  s.sales = [
    {id:crypto.randomUUID(), date:today, customerId:s.customers[0].id, items:[{sku:'P-001', qty:2, price:39.9}], total:79.8}
  ];
  saveStore(s);
}
seed();

/* ========= Util ========= */
const fmtBRL = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const id = sel => document.querySelector(sel);
const all = sel => document.querySelectorAll(sel);

/* ========= Dashboard ========= */
function renderDashboard(){
  const s = loadStore();
  const pendReceber = s.cashflows.filter(c=>c.type==='receber' && c.status!=='pago').reduce((a,c)=>a+c.amount,0);
  const pendPagar   = s.cashflows.filter(c=>c.type==='pagar'   && c.status!=='pago').reduce((a,c)=>a+c.amount,0);
  const saldo       = s.cashflows.reduce((a,c)=>a + (c.type==='receber'? c.amount : -c.amount),0);
  const low = s.products.filter(p=>p.qty<=p.min);

  if(!id('#kpiSaldo')) return; // Evita erro se o dashboard não estiver na página

  id('#kpiSaldo').textContent   = fmtBRL(saldo);
  id('#kpiReceber').textContent = fmtBRL(pendReceber);
  id('#kpiPagar').textContent   = fmtBRL(pendPagar);
  id('#kpiLow').textContent     = low.length;

  const ul = id('#listLowStock');
  ul.innerHTML = '';
  if(!low.length) ul.innerHTML = `<li class="list-group-item">Nenhum item com estoque baixo 🎉</li>`;
  low.forEach(p=>{
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `<span>${p.name} <small class="text-muted">(${p.sku})</small></span>
                    <span class="badge text-bg-warning">${p.qty}/${p.min}</span>`;
    ul.appendChild(li);
  });

  const transactionData = {
    labels: ['Paypal', 'Stripe'],
    datasets: [{
      label: 'Total',
      data: [236, 593],
      backgroundColor: ['#00d25b', '#fc424a'],
      borderColor: '#2A3038',
      borderWidth: 3,
      cutout: '75%'
    }]
  };

  const ctx = document.getElementById('transaction-chart');
  let transactionChart;
  if(window.transactionChart) { window.transactionChart.destroy(); }
  window.transactionChart = new Chart(ctx, {
    type: 'doughnut',
    data: transactionData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  const prefs = loadPrefs();
  if(prefs.alertLow && low.length){
    toast(`Atenção: ${low.length} produto(s) com estoque baixo.`);
  }
}

/* ========= Financeiro ========= */
function renderFinanceiro(){
  const s = loadStore();
  const tbody = id('#tbFinanceiro');
  tbody.innerHTML = '';
  s.cashflows.forEach(c=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.date}</td>
      <td><span class="badge ${c.type==='receber'?'text-bg-success':'text-bg-danger'}">${c.type}</span></td>
      <td>${c.desc}</td>
      <td>${fmtBRL(c.amount)}</td>
      <td><span class="badge ${c.status==='pago'?'text-bg-primary':'text-bg-warning'}">${c.status}</span></td>
      <td class="text-end">
        ${c.status !== 'pago' ? `<button class="btn btn-sm btn-outline-success me-1" data-act="pay" data-id="${c.id}">baixar</button>` : ''}
        <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${c.id}"><i class="bi bi-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.onclick = e=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const idRow = btn.dataset.id; const act = btn.dataset.act;
    const s2 = loadStore();
    const i = s2.cashflows.findIndex(x=>x.id===idRow);
    if(i<0) return;
    if(act==='del') s2.cashflows.splice(i,1);
    if(act==='pay') s2.cashflows[i].status='pago';
    saveStore(s2); renderFinanceiro();
  };
}

id('#formLanc')?.addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const obj = Object.fromEntries(fd.entries());
  obj.amount = parseFloat(obj.amount);
  obj.id = crypto.randomUUID();

  const s = loadStore();
  s.cashflows.push(obj);
  saveStore(s);
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById('modalLanc')).hide();
  renderFinanceiro();
});

/* ========= Estoque ========= */
function renderEstoque(){
  const s = loadStore();
  const tb = id('#tbProdutos'); tb.innerHTML='';
  s.products.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.sku}</td>
      <td>${p.name}</td>
      <td>${p.category||''}</td>
      <td>${p.qty}</td>
      <td>${p.min}</td>
      <td>${fmtBRL(p.price)}</td>
      <td class="text-end">
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary" data-act="inc" data-id="${p.id}">+1</button>
          <button class="btn btn-sm btn-outline-secondary" data-act="dec" data-id="${p.id}">-1</button>
          <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${p.id}"><i class="bi bi-trash"></i></button>
        </div>
      </td>`;
    tb.appendChild(tr);
  });

  tb.onclick = e=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const s2 = loadStore();
    const i = s2.products.findIndex(x=>x.id===btn.dataset.id);
    if(i<0) return;
    const act = btn.dataset.act;
    if(act==='inc') s2.products[i].qty++;
    if(act==='dec') s2.products[i].qty = Math.max(0, s2.products[i].qty-1);
    if(act==='del') s2.products.splice(i,1);
    saveStore(s2); renderEstoque();
  };

  id('#btnExportCSV').onclick = ()=>{
    const rows = [['SKU','Nome','Categoria','Qtd','Min','Preço'], ...loadStore().products.map(p=>[p.sku,p.name,p.category||'',p.qty,p.min,p.price])];
    const csv = rows.map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    download('produtos.csv', csv, 'text/csv;charset=utf-8;');
  };
}

id('#formProd')?.addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(e.target); const obj = Object.fromEntries(fd.entries());
  const s = loadStore();
  obj.id = crypto.randomUUID();
  obj.qty = parseInt(obj.qty||'0',10);
  obj.min = parseInt(obj.min||'0',10);
  obj.price = parseFloat(obj.price||'0');
  if(!obj.sku.trim()){
    obj.sku = nextCode('P-', s.products, 'sku');
  }
  s.products.push(obj); saveStore(s);
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById('modalProd')).hide();
  renderEstoque();
});

/* ========= Clientes ========= */
function renderClientes(){
  const s = loadStore();
  const tb = id('#tbClientes'); tb.innerHTML='';
  s.customers.forEach(c=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.email||''}</td>
      <td>${c.phone||''}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger" data-id="${c.id}"><i class="bi bi-trash"></i></button>
      </td>`;
    tb.appendChild(tr);
  });
  tb.onclick = e=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const s2 = loadStore();
    const i = s2.customers.findIndex(x=>x.id===btn.dataset.id);
    if(i>=0) s2.customers.splice(i,1);
    saveStore(s2); renderClientes();
  };
}

id('#formCliente')?.addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(e.target); const obj = Object.fromEntries(fd.entries());
  obj.id = crypto.randomUUID();
  const s = loadStore(); s.customers.push(obj); saveStore(s);
  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
  renderClientes();
});

/* ========= Vendas ========= */
function renderVendas(){
  const s = loadStore();
  const tb = id('#tbVendas'); tb.innerHTML='';
  s.sales.forEach(v=>{
    const itCount = v.items.reduce((a,i)=>a+i.qty,0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.date}</td>
      <td>${(s.customers.find(x=>x.id===v.customerId)||{}).name || '-'}</td>
      <td>${itCount} itens</td>
      <td>${fmtBRL(v.total)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger" data-id="${v.id}"><i class="bi bi-trash"></i></button>
      </td>`;
    tb.appendChild(tr);
  });
  tb.onclick = e=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const s2 = loadStore();
    const i = s2.sales.findIndex(x=>x.id===btn.dataset.id);
    if(i>=0) s2.sales.splice(i,1);
    saveStore(s2); renderVendas();
  };

  const sel = id('#selClienteVenda');
  sel.innerHTML = loadStore().customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  const area = id('#areaItens'); area.innerHTML=''; addItemRow(); updateTotal();
}
id('#btnAddItem')?.addEventListener('click', addItemRow);

function addItemRow(){
  const s = loadStore();
  const row = document.createElement('div');
  row.className = 'row g-2 align-items-end';
  row.innerHTML = `
    <div class="col-12 col-md-6">
      <label class="form-label">Produto</label>
      <select class="form-select item-sku">
        ${s.products.map(p=>`<option value="${p.sku}" data-price="${p.price}">${p.sku} - ${p.name}</option>`).join('')}
      </select>
    </div>
    <div class="col-6 col-md-3">
      <label class="form-label">Qtd</label>
      <input class="form-control item-qty" type="number" value="1" min="1">
    </div>
    <div class="col-6 col-md-3">
      <label class="form-label">Preço</label>
      <input class="form-control item-price" type="number" step="0.01" value="0">
    </div>`;
  id('#areaItens').appendChild(row);
  const sel = row.querySelector('.item-sku');
  if(sel.selectedOptions[0]) {
    row.querySelector('.item-price').value = parseFloat(sel.selectedOptions[0].dataset.price||'0');
  }
  row.addEventListener('change', updateTotal);
}

function updateTotal(){
  let total = 0;
  id('#areaItens').querySelectorAll('.row').forEach(row=>{
    const qty = parseInt(row.querySelector('.item-qty').value||'0',10);
    const price = parseFloat(row.querySelector('.item-price').value||'0');
    total += qty*price;
  });
  id('#totalVenda').textContent = fmtBRL(total);
}

id('#formVenda')?.addEventListener('submit', e=>{
  e.preventDefault();
  const s = loadStore();
  const fd = new FormData(e.target);
  const date = fd.get('date'); const customerId = fd.get('customerId');
  const items = [];
  id('#areaItens').querySelectorAll('.row').forEach(r=>{
    items.push({
      sku: r.querySelector('.item-sku').value,
      qty: parseInt(r.querySelector('.item-qty').value||'0',10),
      price: parseFloat(r.querySelector('.item-price').value||'0')
    });
  });
  const total = items.reduce((a,i)=>a+i.qty*i.price,0);
  const sale = {id:crypto.randomUUID(), date, customerId, items, total};
  s.sales.push(sale);
  sale.items.forEach(it=>{
    const p = s.products.find(pp=>pp.sku===it.sku);
    if(p) p.qty = Math.max(0, p.qty - it.qty);
  });
  s.cashflows.push({id:crypto.randomUUID(), date, type:'receber', desc:'Venda #' + sale.id.slice(0,4), amount:total, status:'pendente'});
  saveStore(s);

  bootstrap.Modal.getInstance(document.getElementById('modalVenda')).hide();
  renderVendas();
});

/* ========= Relatórios ========= */
function renderRelatorios(){
  const s = loadStore();
  const receber = s.cashflows.filter(c=>c.type==='receber').reduce((a,c)=>a+c.amount,0);
  const pagar   = s.cashflows.filter(c=>c.type==='pagar').reduce((a,c)=>a+c.amount,0);

  const ctx1 = document.getElementById('chartResumo');
  if(window.chartResumo) window.chartResumo.destroy();
  window.chartResumo = new Chart(ctx1, {
    type:'doughnut',
    data:{ labels:['Receber','Pagar'], datasets:[{ data:[receber,pagar], backgroundColor: ['#00d25b', '#fc424a'] }]},
    options:{ responsive:true }
  });

  const map = {};
  s.sales.forEach(v=>v.items.forEach(i=>{ map[i.sku]=(map[i.sku]||0)+i.qty; }));
  const labels = Object.keys(map);
  const data = Object.values(map);

  const ctx2 = document.getElementById('chartVendas');
  if(window.chartVendas) window.chartVendas.destroy();
  window.chartVendas = new Chart(ctx2, {
    type:'bar',
    data:{ labels, datasets:[{ label:'Qtd', data, backgroundColor: '#007bff' }] },
    options:{ responsive:true, plugins:{legend:{display:false}} }
  });

  id('#btnExportJSON').onclick = ()=>{
    download('bankai-dados.json', JSON.stringify(loadStore(), null, 2), 'application/json');
  };
  id('#btnReset').onclick = ()=>{
    if(confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')){
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem(PREF_KEY);
      window.location.reload();
    }
  };
}

/* ========= Automação ========= */
function loadPrefs(){
  try{ return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; }catch{ return {}; }
}
function savePrefs(p){ localStorage.setItem(PREF_KEY, JSON.stringify(p)); }

function renderAutomacao(){
  const p = loadPrefs();
  id('#prefLow').checked = !!p.alertLow;
  id('#prefBaixa').checked = !!p.autoBaixa;
}

id('#formAuto')?.addEventListener('submit', e=>{
  e.preventDefault();
  const prefs = {
    alertLow: id('#prefLow').checked,
    autoBaixa: id('#prefBaixa').checked
  };
  savePrefs(prefs);
  if(prefs.autoBaixa){
    const s = loadStore();
    let changed = 0;
    s.cashflows.forEach(c=>{
      if(c.type==='receber' && c.status!=='pago'){ c.status='pago'; changed++; }
    });
    saveStore(s);
    if(changed) toast(`Baixa automática aplicada em ${changed} lançamento(s).`);
  }
  toast('Preferências salvas.');
});

/* ========= Helpers ========= */
function nextCode(prefix, list, field){
  let max = 0;
  list.forEach(x=>{
    const m = (x[field]||'').match(/(\d+)$/); if(m) max = Math.max(max, parseInt(m[1],10));
  });
  return `${prefix}${String(max+1).padStart(3,'0')}`;
}

function download(filename, data, type){
  const blob = new Blob([data], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function toast(msg){
  const el = document.createElement('div');
  el.className = 'position-fixed bottom-0 end-0 p-3';
  el.style.zIndex = 2000;
  el.innerHTML = `<div class="alert alert-primary shadow-lg">${msg}</div>`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

/* ========= Sidebar responsive ========= */
id('#btnToggleSidebar')?.addEventListener('click', ()=>{
  document.querySelector('.sidebar').classList.toggle('show');
});

/* ========= Page Loading Logic ========= */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  // Atualiza o link ativo na sidebar
  all('.nav-link').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === path) {
      a.classList.add('active');
    }
  });
  
  // Renderiza o conteúdo da página correta
  if (path.endsWith('index.html') || path.endsWith('/')) renderDashboard();
  else if (path.endsWith('financeiro.html')) renderFinanceiro();
  else if (path.endsWith('estoque.html')) renderEstoque();
  else if (path.endsWith('vendas.html')) renderVendas();
  else if (path.endsWith('clientes.html')) renderClientes();
  else if (path.endsWith('relatorios.html')) renderRelatorios();
  else if (path.endsWith('automacao.html')) renderAutomacao();
});