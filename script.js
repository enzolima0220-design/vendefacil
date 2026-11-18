/* ========== 10. JS: dados e LocalStorage ========== */
const KEY = "vendefacil:v1";
let db = { products: [], sales: [], log: [], cfg: { store: "Minha Loja", low: 5 }, seeded: false, nextNum: 1 };
let editId = null;      // id do produto em edição (null = novo)
let onConfirm = null;   // função da janela de confirmação

function load() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) { const d = JSON.parse(r); db = Object.assign(db, d); db.cfg = Object.assign({ store: "Minha Loja", low: 5 }, d.cfg); }
  } catch (e) {}
  migrate();
}
// Dados da versão 1 não tinham número nem status: completa o que faltar
function migrate() {
  const max = Math.max(0, ...db.sales.map(s => s.num || 0));
  if (db.nextNum <= max) db.nextNum = max + 1;
  db.sales.filter(s => !s.num).sort((a, b) => a.date.localeCompare(b.date)).forEach(s => s.num = db.nextNum++);
  db.sales.forEach(s => { if (typeof s.canceled !== "boolean") s.canceled = false; });
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

/* ========== 11. JS: funções utilitárias ========== */
const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const money = n => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = d => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dayKey = d => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const isLow = p => p.stock <= db.cfg.low;
const active = () => db.sales.filter(s => !s.canceled);          // só vendas não canceladas
const sid = s => "#" + String(s.num).padStart(4, "0");           // número da venda: #0001
function log(msg) { db.log.unshift({ t: new Date().toISOString(), msg }); db.log = db.log.slice(0, 30); }
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2200); }
function ask(msg, fn) { $("cMsg").textContent = msg; onConfirm = fn; $("cfm").showModal(); }
$("cOk").onclick = () => { $("cfm").close(); if (onConfirm) onConfirm(); };

const ICONS = {
  dash: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
  cart: '<path d="M6 6h15l-2 9H8zM6 6L5 3H2M9 20h.01M18 20h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  money: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  alert: '<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

/* ========== 12. JS: dados de exemplo (primeiro acesso) ========== */
function sell(p, q, date) {   // registra uma venda e baixa o estoque
  p.stock -= q;
  db.sales.unshift({ id: uid(), num: db.nextNum++, date: date.toISOString(), pid: p.id, name: p.name, qty: q, price: p.price, total: +(p.price * q).toFixed(2), canceled: false });
}
function seed() {
  const P = [["Camiseta Básica","Roupas",49.9,60],["Calça Jeans","Roupas",139.9,35],["Tênis Esportivo","Calçados",249.9,25],["Fone Bluetooth","Eletrônicos",129.9,40],["Carregador USB-C","Eletrônicos",59.9,50],["Mochila Urbana","Acessórios",179.9,18],["Garrafa Térmica","Acessórios",69.9,30],["Caderno Universitário","Papelaria",24.9,80]];
  db.products = P.map((p, i) => ({ id: uid(), code: "P" + String(i + 1).padStart(3, "0"), name: p[0], cat: p[1], price: p[2], stock: p[3] }));
  db.sales = []; db.log = [];
  for (let d = 6; d >= 0; d--) for (let k = 0; k < 2 + (d % 3); k++)
    sell(db.products[(d * 3 + k * 5) % 8], 1 + (d + k) % 3, new Date(Date.now() - d * 864e5 - k * 36e5));
  db.sales.sort((a, b) => b.date.localeCompare(a.date));
  [...db.sales].reverse().forEach((s, i) => s.num = i + 1); db.nextNum = db.sales.length + 1;
  db.products[5].stock = 3; db.products[6].stock = 4;   // exemplos de estoque baixo
  db.seeded = true; log("Dados de exemplo carregados"); save();
}

/* ========== 13. JS: navegação sem recarregar ========== */
function show(page) {
  document.querySelectorAll(".page").forEach(s => s.classList.toggle("on", s.id === page));
  document.querySelectorAll(".nav").forEach(b => b.classList.toggle("on", b.dataset.page === page));
  render();
}
document.querySelectorAll(".nav").forEach(b => { b.innerHTML = icon(b.dataset.ic) + b.textContent; b.onclick = () => show(b.dataset.page); });

/* ========== 14. JS: Dashboard ========== */
function renderDash() {
  const act = active(), rev = act.reduce((s, v) => s + v.total, 0), low = db.products.filter(isLow);
  const k = [["money", "Faturamento total", money(rev)], ["cart", "Vendas realizadas", act.length], ["box", "Produtos cadastrados", db.products.length], ["alert", "Estoque baixo", low.length]];
  $("kpis").innerHTML = k.map(x => `<div class="card kpi"><div class="ico">${icon(x[0])}</div><div><small>${x[1]}</small><strong>${x[2]}</strong></div></div>`).join("");

  // gráfico: soma das vendas de cada um dos últimos 7 dias
  const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return { key: dayKey(d), label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), v: 0 }; });
  act.forEach(s => { const d = days.find(x => x.key === dayKey(s.date)); if (d) d.v += s.total; });
  const max = Math.max(...days.map(d => d.v), 1);
  $("chart").innerHTML = `<svg viewBox="0 0 420 165" style="width:100%;height:auto">` + days.map((d, i) => {
    const h = d.v / max * 110, x = i * 60 + 10;
    return `<rect class="bar" x="${x}" y="${125 - h}" width="40" height="${h}" rx="6"/><text class="lbl" x="${x + 20}" y="${118 - h}" text-anchor="middle">${d.v ? Math.round(d.v) : ""}</text><text class="lbl" x="${x + 20}" y="148" text-anchor="middle">${d.label}</text>`;
  }).join("") + `</svg>`;

  // mais vendidos: soma das quantidades por produto
  const tot = {}; act.forEach(s => tot[s.name] = (tot[s.name] || 0) + s.qty);
  const top = Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $("top").innerHTML = top.length ? top.map(t => `<div style="margin-bottom:10px"><div class="row" style="border:0;padding:0"><span>${esc(t[0])}</span><span class="mut">${t[1]} un.</span></div><div class="meter"><i style="width:${t[1] / top[0][1] * 100}%"></i></div></div>`).join("") : '<div class="empty">Sem vendas ainda</div>';

  $("last").innerHTML = salesList(act.slice(0, 5));
  $("log").innerHTML = db.log.length ? db.log.slice(0, 6).map(l => `<div class="row"><span>${esc(l.msg)}</span><span class="mut">${fmtDate(l.t)}</span></div>`).join("") : '<div class="empty">Nenhuma atividade</div>';
}
function salesList(list) {
  return list.length ? list.map(s => `<div class="row"><span><span class="mut">${sid(s)}</span> ${esc(s.name)} <span class="mut">× ${s.qty}</span></span><strong>${money(s.total)}</strong></div>`).join("") : '<div class="empty">Nenhuma venda registrada</div>';
}

/* ========== 15. JS: Produtos (cadastrar, editar, excluir, buscar, filtrar) ========== */
function renderProds() {
  const cats = [...new Set(db.products.map(p => p.cat))].sort(), cur = $("catF").value;
  $("catF").innerHTML = '<option value="">Todas as categorias</option>' + cats.map(c => `<option ${c === cur ? "selected" : ""}>${esc(c)}</option>`).join("");
  $("cats").innerHTML = cats.map(c => `<option value="${esc(c)}">`).join("");
  const q = $("q").value.toLowerCase(), cat = $("catF").value;
  const list = db.products.filter(p => (!cat || p.cat === cat) && (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)));
  $("ptb").innerHTML = list.length ? list.map(p => `<tr><td>${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(p.cat)}</td><td>${money(p.price)}</td>
    <td><span class="tag ${p.stock === 0 ? "zero" : isLow(p) ? "low" : ""}">${p.stock} un.</span></td>
    <td style="text-align:right"><button class="btn ghost sm" onclick="openProd('${p.id}')">Editar</button> <button class="btn red sm" onclick="delProd('${p.id}')">Excluir</button></td></tr>`).join("")
    : '<tr><td colspan="6" class="empty">Nenhum produto encontrado</td></tr>';
}
function openProd(id) {
  editId = id || null;
  const p = db.products.find(x => x.id === id) || { name: "", cat: "", price: "", stock: "", code: "P" + String(db.products.length + 1).padStart(3, "0") };
  $("dTitle").textContent = id ? "Editar produto" : "Novo produto";
  $("fName").value = p.name; $("fCat").value = p.cat; $("fPrice").value = p.price; $("fStock").value = p.stock; $("fCode").value = p.code; $("fErr").textContent = "";
  $("dlg").showModal();
}
$("pf").onsubmit = e => {
  e.preventDefault();
  const name = $("fName").value.trim(), cat = $("fCat").value.trim(), code = $("fCode").value.trim();
  const price = parseFloat($("fPrice").value), stock = Number($("fStock").value);
  let err = "";
  if (!name || !cat || !code) err = "Preencha nome, categoria e código.";
  else if (isNaN(price) || price <= 0) err = "O preço deve ser maior que zero.";
  else if ($("fStock").value === "" || !Number.isInteger(stock) || stock < 0) err = "O estoque deve ser um número inteiro (0 ou mais).";
  else if (db.products.some(p => p.code.toLowerCase() === code.toLowerCase() && p.id !== editId)) err = "Já existe um produto com esse código.";
  if (err) { $("fErr").textContent = err; return; }
  if (editId) { Object.assign(db.products.find(p => p.id === editId), { name, cat, price, stock, code }); log("Produto editado: " + name); }
  else { db.products.push({ id: uid(), name, cat, price, stock, code }); log("Produto cadastrado: " + name); }
  save(); $("dlg").close(); render(); toast("Produto salvo!");
};
function delProd(id) {
  const p = db.products.find(x => x.id === id);
  ask(`Excluir "${p.name}"? As vendas antigas continuam no histórico.`, () => { db.products = db.products.filter(x => x.id !== id); log("Produto excluído: " + p.name); save(); render(); toast("Produto excluído"); });
}

/* ========== 16. JS: Vendas ========== */
function renderSale() {
  const cur = $("sP").value;
  $("sP").innerHTML = db.products.length ? db.products.map(p => `<option value="${p.id}" ${p.stock === 0 ? "disabled" : ""} ${p.id === cur ? "selected" : ""}>${esc(p.name)} (estoque: ${p.stock})</option>`).join("") : "<option value=''>Nenhum produto cadastrado</option>";
  updateTotal(); $("sLast").innerHTML = salesList(active().slice(0, 6));
}
function updateTotal() {
  const p = db.products.find(x => x.id === $("sP").value), q = Number($("sQ").value) || 0;
  $("sPrice").textContent = p ? money(p.price) : "—";
  $("sTotal").textContent = money(p ? p.price * q : 0);
}
function confirmSale() {
  const p = db.products.find(x => x.id === $("sP").value), q = Number($("sQ").value);
  let err = "";
  if (!p) err = "Selecione um produto.";
  else if (!Number.isInteger(q) || q < 1) err = "Informe uma quantidade inteira maior que zero.";
  else if (q > p.stock) err = `Estoque insuficiente: só há ${p.stock} unidade(s).`;
  $("sErr").textContent = err; if (err) return;
  sell(p, q, new Date()); log(`Venda ${sid(db.sales[0])}: ${q}× ${p.name} (${money(p.price * q)})`);
  save(); $("sQ").value = 1; render(); toast(`Venda ${sid(db.sales[0])} registrada!`);
}
$("sP").onchange = updateTotal; $("sQ").oninput = updateTotal;

/* ========== 17. JS: Histórico ========== */
function renderHist() {
  const q = $("hq").value.toLowerCase().replace("#", ""), d = $("hd").value, st = $("hs").value;
  const list = db.sales.filter(s => (s.name.toLowerCase().includes(q) || sid(s).includes(q)) && (!d || dayKey(s.date) === d) && (!st || (st === "c") === s.canceled));
  $("htb").innerHTML = list.length ? list.map(s => `<tr class="${s.canceled ? "canceled" : ""}"><td>${sid(s)}</td><td>${fmtDate(s.date)}</td><td>${esc(s.name)}</td><td>${s.qty}</td><td>${money(s.price)}</td><td><strong>${money(s.total)}</strong></td><td><span class="tag ${s.canceled ? "zero" : "ok"}">${s.canceled ? "Cancelada" : "Concluída"}</span></td><td style="text-align:right">${s.canceled ? "" : `<button class="btn red sm" onclick="cancelSale('${s.id}')">Cancelar</button>`}</td></tr>`).join("") : '<tr><td colspan="8" class="empty">Nenhuma venda encontrada</td></tr>';
  const ok = list.filter(s => !s.canceled);
  $("hSum").textContent = `${list.length} registro(s) — ${ok.length} concluída(s), total ${money(ok.reduce((s, v) => s + v.total, 0))}`;
}
function clearHist() { $("hq").value = ""; $("hd").value = ""; $("hs").value = ""; renderHist(); }
// Cancela a venda: devolve as unidades ao estoque e tira a venda do faturamento
function cancelSale(id) {
  const s = db.sales.find(x => x.id === id);
  if (!s || s.canceled) return;
  ask(`Cancelar a venda ${sid(s)} (${s.qty}× ${s.name})? O estoque será devolvido.`, () => {
    const p = db.products.find(x => x.id === s.pid);
    if (p) p.stock += s.qty;
    s.canceled = true; s.canceledAt = new Date().toISOString();
    log(`Venda ${sid(s)} cancelada` + (p ? "" : " (produto excluído: estoque não restaurado)"));
    save(); render(); toast(p ? "Venda cancelada e estoque restaurado" : "Venda cancelada (produto não existe mais)");
  });
}
$("hq").oninput = $("hd").oninput = $("hs").onchange = renderHist;
$("q").oninput = $("catF").onchange = renderProds;

/* ========== 18. JS: Configurações ========== */
function saveCfg() {
  const low = Number($("cLow").value);
  if (!Number.isInteger(low) || low < 0) return toast("Valor inválido");
  db.cfg.store = $("cName").value.trim() || "Minha Loja"; db.cfg.low = low;
  save(); render(); toast("Configurações salvas");
}

/* ========== 18b. JS: exportar e importar JSON ========== */
function exportData() {
  const payload = { app: "VendeFácil", version: 2, exportedAt: new Date().toISOString(),
    data: { products: db.products, sales: db.sales, log: db.log, cfg: db.cfg, nextNum: db.nextNum } };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "vendefacil-backup-" + dayKey(new Date()) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  setIo("Backup exportado com sucesso.", true);
}
function setIo(msg, ok) { const e = $("ioMsg"); e.textContent = msg; e.className = "err" + (ok ? " ok-msg" : ""); }

// Pequenos verificadores usados na validação
const isId = v => typeof v === "string" && /^[\w-]{1,40}$/.test(v);   // só letras, números, _ e - (evita código malicioso)
const isTxt = v => typeof v === "string" && v.trim() !== "" && v.length <= 100;
const isNum = (v, min) => typeof v === "number" && isFinite(v) && v >= min;
const isInt = (v, min) => Number.isInteger(v) && v >= min;

// Confere o arquivo inteiro e devolve dados limpos, ou { error } com o motivo
function validateImport(raw) {
  const d = raw && raw.data ? raw.data : raw;
  if (!d || !Array.isArray(d.products) || !Array.isArray(d.sales)) return { error: "Arquivo inválido: faltam as listas de produtos e vendas." };
  const ids = new Set(), codes = new Set(), products = [];
  for (const [i, p] of d.products.entries()) {
    const n = "Produto " + (i + 1) + ": ";
    if (!p || !isId(p.id) || !isTxt(p.name) || !isTxt(p.cat) || !isTxt(p.code)) return { error: n + "id, nome, categoria ou código inválido." };
    if (!isNum(p.price, 0.01)) return { error: n + "preço inválido (precisa ser maior que zero)." };
    if (!isInt(p.stock, 0)) return { error: n + "estoque inválido (inteiro, 0 ou mais)." };
    if (ids.has(p.id) || codes.has(p.code.trim().toLowerCase())) return { error: n + "id ou código repetido." };
    ids.add(p.id); codes.add(p.code.trim().toLowerCase());
    products.push({ id: p.id, name: p.name.trim(), cat: p.cat.trim(), code: p.code.trim(), price: p.price, stock: p.stock });
  }
  const sids = new Set(), nums = new Set(), sales = [];
  for (const [i, s] of d.sales.entries()) {
    const n = "Venda " + (i + 1) + ": ";
    if (!s || !isId(s.id) || !isId(s.pid) || !isTxt(s.name)) return { error: n + "id, produto ou nome inválido." };
    if (!isInt(s.qty, 1) || !isNum(s.price, 0) || !isNum(s.total, 0)) return { error: n + "quantidade, preço ou total inválido." };
    if (typeof s.date !== "string" || isNaN(new Date(s.date))) return { error: n + "data inválida." };
    if (s.num !== undefined && !isInt(s.num, 1)) return { error: n + "número inválido." };
    if (sids.has(s.id) || (s.num && nums.has(s.num))) return { error: n + "id ou número repetido." };
    sids.add(s.id); if (s.num) nums.add(s.num);
    sales.push({ id: s.id, num: s.num, date: new Date(s.date).toISOString(), pid: s.pid, name: s.name.trim(), qty: s.qty, price: s.price, total: s.total, canceled: s.canceled === true });
  }
  const log = (Array.isArray(d.log) ? d.log : []).filter(l => l && typeof l.msg === "string" && typeof l.t === "string" && !isNaN(new Date(l.t))).slice(0, 30).map(l => ({ t: l.t, msg: l.msg.slice(0, 200) }));
  const cfg = { store: d.cfg && isTxt(d.cfg.store) ? d.cfg.store.trim() : "Minha Loja", low: d.cfg && isInt(d.cfg.low, 0) ? d.cfg.low : 5 };
  return { products, sales, log, cfg, nextNum: isInt(d.nextNum, 1) ? d.nextNum : 1 };
}

function importData(file) {
  if (!file) return;
  $("impFile").value = "";                       // permite escolher o mesmo arquivo de novo
  if (file.size > 5e6) return setIo("Arquivo muito grande (máximo 5 MB).");
  const r = new FileReader();
  r.onerror = () => setIo("Não foi possível ler o arquivo.");
  r.onload = () => {
    let raw;
    try { raw = JSON.parse(r.result); } catch (e) { return setIo("O arquivo não é um JSON válido."); }
    const v = validateImport(raw);
    if (v.error) return setIo(v.error);
    ask(`Importar ${v.products.length} produto(s) e ${v.sales.length} venda(s)? Os dados atuais serão substituídos.`, () => {
      db.products = v.products; db.cfg = v.cfg; db.log = v.log; db.nextNum = v.nextNum; db.seeded = true;
      db.sales = v.sales.sort((a, b) => b.date.localeCompare(a.date));
      migrate(); log("Dados importados de arquivo JSON"); save(); render();
      setIo("Dados importados com sucesso.", true);
    });
  };
  r.readAsText(file);
}

/* ========== 19. JS: iniciar o app ========== */
function render() {
  $("storeName").textContent = db.cfg.store; $("cName").value = db.cfg.store; $("cLow").value = db.cfg.low;
  renderDash(); renderProds(); renderSale(); renderHist();
}
load(); if (!db.seeded && !db.products.length) seed();
render();
