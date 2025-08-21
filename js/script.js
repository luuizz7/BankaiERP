/* ========= Core Systems (localStorage) ========= */
const STORE_KEY = 'bankai_erp_v1';
const USERS_KEY = 'bankai_users_v1';

// Funções para carregar e salvar os dados principais do ERP
function loadStore(){
  const raw = localStorage.getItem(STORE_KEY);
  return raw ? JSON.parse(raw) : { cashflows: [], products: [], customers: [], sales: [] };
}
function saveStore(s){ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

// Funções para carregar e salvar a lista de usuários
function loadUsers(){
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

// Cria o usuário "chefe" e os dados de exemplo na primeira execução
function seed(){
  if (localStorage.getItem(USERS_KEY)) return;

  const initialUsers = [
    { id: crypto.randomUUID(), name: 'admin', pass: 'admin', role: 'chefe' }
  ];
  saveUsers(initialUsers);

  const s = { cashflows: [], products: [], customers: [], sales: [] };
  s.products = [ {id:crypto.randomUUID(), sku:'P-001', name:'Camiseta Laranja', category:'Vestuário', qty:30, min:10, price:39.9} ];
  saveStore(s);
}
seed();

/* ========= Authentication Logic ========= */
function login(name, pass) {
  const users = loadUsers();
  const user = users.find(u => u.name === name && u.pass === pass);
  if (user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = '/html/index.html';
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = '/html/login.html';
}

function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser'));
  } catch {
    return null;
  }
}

function checkAuth() {
  const user = getCurrentUser();
  const isLoginPage = window.location.pathname.includes('login.html');
  
  if (!user && !isLoginPage) {
    window.location.href = '/html/login.html';
  } else if (user && isLoginPage) {
    window.location.href = '/html/index.html';
  }
}

/* ========= Utils ========= */
const fmtBRL = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const id = sel => document.querySelector(sel);
const all = sel => document.querySelectorAll(sel);

/* ========= Render Functions ========= */
function renderDashboard(){
    const s = loadStore();
    const pendReceber = s.cashflows.filter(c=>c.type==='receber' && c.status!=='pago').reduce((a,c)=>a+c.amount,0);
    const pendPagar   = s.cashflows.filter(c=>c.type==='pagar'   && c.status!=='pago').reduce((a,c)=>a+c.amount,0);
    const saldo       = s.cashflows.reduce((a,c)=>a + (c.type==='receber'? c.amount : -c.amount),0);
    const low = s.products.filter(p=>p.qty<=p.min);
  
    if(!id('#kpiSaldo')) return; 
  
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
      labels: ['Entradas', 'Saídas'],
      datasets: [{ data: [1200, 829], backgroundColor: ['#00d25b', '#fc424a'], borderColor: '#2A3038', borderWidth: 3, cutout: '75%' }]
    };
  
    const ctx = document.getElementById('transaction-chart');
    if(window.transactionChart) { window.transactionChart.destroy(); }
    window.transactionChart = new Chart(ctx, {
      type: 'doughnut',
      data: transactionData,
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderUsuarios() {
  const users = loadUsers();
  const tbody = id('#tbUsuarios');
  if(!tbody) return;
  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.name}</td>
      <td><span class="badge ${u.role === 'chefe' ? 'text-bg-primary' : 'text-bg-secondary'}">${u.role}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger" data-id="${u.id}"><i class="bi bi-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.onclick = e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      const users = loadUsers();
      const newUsers = users.filter(u => u.id !== btn.dataset.id);
      saveUsers(newUsers);
      renderUsuarios();
    }
  };
}

// Adicione aqui as outras funções de render (renderFinanceiro, renderEstoque, etc.) do seu código original

/* ========= Page Loading Logic ========= */
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  const user = getCurrentUser();
  if (user) {
    all('.user-name').forEach(el => el.textContent = user.name);
    all('.btn-logout').forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    }));

    if (user.role === 'chefe') {
      id('#nav-usuarios')?.classList.remove('d-none');
    }
  }
  
  const path = window.location.pathname;
  all('.nav-link').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === path) { a.classList.add('active'); }
  });
  
  if (path.endsWith('index.html')) renderDashboard();
  if (path.endsWith('usuarios.html')) renderUsuarios();
  // Adicione aqui as chamadas para as outras funções de render
  
  const loginForm = id('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = id('#username').value;
      const pass = id('#password').value;
      if (!login(name, pass)) {
        id('#error-message').style.display = 'block';
      }
    });
  }
  
  const userForm = id('#formUsuario');
  if (userForm) {
    userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const newUser = Object.fromEntries(fd.entries());
      newUser.id = crypto.randomUUID();
      
      const users = loadUsers();
      users.push(newUser);
      saveUsers(users);
      
      e.target.reset();
      bootstrap.Modal.getInstance(id('#modalUsuario')).hide();
      renderUsuarios();
    });
  }

  id('#btnToggleSidebar')?.addEventListener('click', ()=>{
    document.querySelector('.sidebar').classList.toggle('show');
  });
});