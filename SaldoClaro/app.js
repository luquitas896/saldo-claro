(() => {
  "use strict";
  const KEY = "saldo-claro:v1";
  const categorySeeds = [
    { id: "cat-food", name: "Comida", icon: "◉", color: "#62a27d" },
    { id: "cat-home", name: "Hogar", icon: "⌂", color: "#8b83c9" },
    { id: "cat-transport", name: "Transporte", icon: "↗", color: "#e0a34d" },
    { id: "cat-health", name: "Salud", icon: "+", color: "#dc7c6b" },
    { id: "cat-leisure", name: "Ocio", icon: "✦", color: "#5c91bc" },
    { id: "cat-salary", name: "Ingresos", icon: "↙", color: "#4f9c70" },
    { id: "cat-other", name: "Otros", icon: "•", color: "#98a49b" }
  ];
  const now = new Date();
  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const dateISO = (dayOffset = 0) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const makeId = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const demoState = () => ({
    version: 1, demo: true, categories: structuredClone(categorySeeds),
    movements: [
      { id: "demo-1", type: "income", amount: 98000000, date: dateISO(-4), categoryId: "cat-salary", description: "Ingreso mensual" },
      { id: "demo-2", type: "expense", amount: 12450000, date: dateISO(-3), categoryId: "cat-home", description: "Alquiler" },
      { id: "demo-3", type: "expense", amount: 7300000, date: dateISO(-2), categoryId: "cat-food", description: "Compras del mes" },
      { id: "demo-4", type: "expense", amount: 3200000, date: dateISO(-1), categoryId: "cat-transport", description: "Combustible" },
      { id: "demo-5", type: "expense", amount: 1850000, date: dateISO(-1), categoryId: "cat-leisure", description: "Salida" },
      { id: "demo-6", type: "expense", amount: 2100000, date: dateISO(0), categoryId: "cat-health", description: "Farmacia" }
    ],
    budgets: [
      { id: "budget-1", categoryId: "cat-food", month: monthKey(now), amount: 15000000 },
      { id: "budget-2", categoryId: "cat-transport", month: monthKey(now), amount: 8000000 },
      { id: "budget-3", categoryId: "cat-leisure", month: monthKey(now), amount: 6000000 }
    ],
    goals: [
      { id: "goal-1", name: "Fondo de emergencia", target: 250000000, saved: 82500000, dueDate: "2027-06-30", icon: "◈" },
      { id: "goal-2", name: "Viaje", target: 180000000, saved: 42000000, dueDate: "2027-12-15", icon: "✈" }
    ]
  });
  const validState = x => x && x.version === 1 && Array.isArray(x.categories) && Array.isArray(x.movements) && Array.isArray(x.budgets) && Array.isArray(x.goals);
  let state;
  try {
    const saved = localStorage.getItem(KEY);
    state = saved ? JSON.parse(saved) : demoState();
    if (!validState(state)) state = demoState();
  } catch { state = demoState(); }
  let selectedMonth = monthKey(now);
  let activePage = "inicio";
  let toastTimer;
  const $ = s => document.querySelector(s);
  const money = cents => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format((Number(cents) || 0) / 100);
  const amountInput = cents => ((Number(cents) || 0) / 100).toFixed(2);
  const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const category = id => state.categories.find(c => c.id === id) || { name: "Sin categoría", icon: "•", color: "#98a49b" };
  const dateFmt = value => value ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "—";
  const periodName = m => { const [y, mm] = m.split("-").map(Number); return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(y, mm - 1, 1)); };
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(state)); updateDemoBanner(); };
  const toast = message => { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600); };
  const monthMovements = m => state.movements.filter(x => x.date.startsWith(m));
  const totals = list => list.reduce((a, x) => { a[x.type] += x.amount; return a; }, { income: 0, expense: 0 });
  const updateDemoBanner = () => $("#demo-banner").classList.toggle("hidden", !state.demo);
  const titleFor = page => ({ inicio: "Resumen", movimientos: "Movimientos", presupuestos: "Presupuestos", metas: "Metas de ahorro", ajustes: "Ajustes y respaldo" }[page]);
  const nav = page => { activePage = page; document.querySelectorAll("[data-page]").forEach(b => b.classList.toggle("active", b.dataset.page === page)); $("#page-title").textContent = titleFor(page); render(); };
  const escAttr = safe;

  function render() {
    const view = $("#view");
    if (activePage === "inicio") view.innerHTML = renderDashboard();
    if (activePage === "movimientos") view.innerHTML = renderMovements();
    if (activePage === "presupuestos") view.innerHTML = renderBudgets();
    if (activePage === "metas") view.innerHTML = renderGoals();
    if (activePage === "ajustes") view.innerHTML = renderSettings();
    if (activePage === "inicio") drawChart();
    updateDemoBanner();
  }

  function statCard(label, value, caption, icon, kind = "") {
    return `<article class="card stat-card ${kind}"><div class="stat-head"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${money(value)}</div><div class="stat-sub">${caption}</div></article>`;
  }

  function renderDashboard() {
    const list = monthMovements(selectedMonth), t = totals(list), balance = t.income - t.expense;
    const expenses = list.filter(x => x.type === "expense");
    const byCat = Object.entries(expenses.reduce((a, x) => { a[x.categoryId] = (a[x.categoryId] || 0) + x.amount; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const recent = [...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    return `<div class="grid stats-grid">${statCard("Ingresos del período", t.income, "Total registrado este mes", "↙", "income")}${statCard("Gastos del período", t.expense, "Total registrado este mes", "↗", "expense")}${statCard("Balance del período", balance, "Ingresos menos gastos", "◫", "balance")}${statCard("Movimientos", list.length, "Registros en el período", "↕")}</div>
      <div class="grid dashboard-grid">
        <section class="card panel"><div class="panel-header"><div><h2 class="panel-title">Evolución del mes</h2><p class="panel-caption">Ingresos y gastos por día</p></div><div class="legend"><span><i></i> Ingresos</span><span><i class="out"></i> Gastos</span></div></div><div class="chart-wrap"><canvas id="month-chart" aria-label="Gráfico de ingresos y gastos del mes"></canvas></div></section>
        <section class="card panel"><div class="panel-header"><div><h2 class="panel-title">Gastos por categoría</h2><p class="panel-caption">Distribución de ${safe(periodName(selectedMonth))}</p></div></div>${byCat.length ? `<div class="category-list">${byCat.map(([id, cents]) => { const c = category(id), pct = t.expense ? Math.min(100, cents / t.expense * 100) : 0; return `<div class="category-row"><span class="category-symbol" style="color:${safe(c.color)}">${safe(c.icon)}</span><div><div class="category-name">${safe(c.name)}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div></div><span class="category-amount">${money(cents)}</span></div>`; }).join("")}</div>` : `<div class="no-data">Todavía no hay gastos para mostrar.</div>`}</section>
      </div>
      <section class="card panel recent-panel"><div class="panel-header"><div><h2 class="panel-title">Últimos movimientos</h2><p class="panel-caption">Actividad de ${safe(periodName(selectedMonth))}</p></div><button class="link-button" data-page="movimientos">Ver todos →</button></div>${renderMovementTable(recent, false)}</section>`;
  }

  function renderMovementTable(list, showActions = true) {
    if (!list.length) return `<div class="empty-state"><div class="empty-icon">↕</div><h3>No hay movimientos para mostrar</h3><p>Agregá un ingreso o gasto para empezar a organizar tus finanzas.</p><button class="button primary small" id="new-movement-inline">＋ Nuevo movimiento</button></div>`;
    return `<div class="table-wrap"><table><thead><tr><th>DETALLE</th><th>CATEGORÍA</th><th>FECHA</th><th>TIPO</th><th>IMPORTE</th>${showActions ? "<th></th>" : ""}</tr></thead><tbody>${list.map(m => { const c = category(m.categoryId); return `<tr><td><div class="td-title">${safe(m.description)}</div><div class="td-sub">${safe(m.type === "income" ? "Ingreso" : "Gasto")}</div></td><td><span class="pill">${safe(c.icon)} &nbsp;${safe(c.name)}</span></td><td>${dateFmt(m.date)}</td><td>${m.type === "income" ? "Ingreso" : "Gasto"}</td><td class="amount ${m.type === "income" ? "positive" : "negative"}">${m.type === "income" ? "+" : "−"}${money(m.amount)}</td>${showActions ? `<td><div class="actions"><button class="icon-button" title="Editar" data-edit-movement="${escAttr(m.id)}">✎</button><button class="icon-button" title="Eliminar" data-delete-movement="${escAttr(m.id)}">×</button></div></td>` : ""}</tr>`; }).join("")}</tbody></table></div>`;
  }

  function renderMovements() {
    return `<div class="page-toolbar"><div class="month-summary"><span>Período</span><strong>${safe(periodName(selectedMonth))}</strong><span>${monthMovements(selectedMonth).length} movimientos</span></div><div class="filters"><input class="field search-field" id="movement-search" placeholder="Buscar descripción o categoría" aria-label="Buscar movimientos"><select class="select" id="type-filter"><option value="all">Todos los tipos</option><option value="income">Ingresos</option><option value="expense">Gastos</option></select></div></div><section class="card panel" id="movement-table">${renderMovementTable([...monthMovements(selectedMonth)].sort((a, b) => b.date.localeCompare(a.date)))}</section>`;
  }

  function renderBudgets() {
    const list = state.budgets.filter(b => b.month === selectedMonth);
    const spent = id => monthMovements(selectedMonth).filter(x => x.type === "expense" && x.categoryId === id).reduce((s, x) => s + x.amount, 0);
    return `<div class="page-toolbar"><div class="month-summary"><span>Topes de gasto para</span><strong>${safe(periodName(selectedMonth))}</strong></div><button class="button primary small" id="new-budget">＋ Crear presupuesto</button></div>${list.length ? `<div class="grid budget-grid">${list.map(b => { const c = category(b.categoryId), value = spent(b.categoryId), pct = b.amount ? value / b.amount * 100 : 0, cls = pct >= 100 ? "over" : pct >= 80 ? "warning" : ""; return `<article class="card budget-card"><div class="panel-header"><div class="budget-title"><span class="category-symbol" style="color:${safe(c.color)}">${safe(c.icon)}</span>${safe(c.name)}</div><div class="actions"><button class="icon-button" title="Editar" data-edit-budget="${safe(b.id)}">✎</button><button class="icon-button" title="Eliminar" data-delete-budget="${safe(b.id)}">×</button></div></div><div class="budget-num">${money(b.amount)}</div><div class="budget-detail">Tope mensual</div><div class="progress ${cls}"><span style="width:${Math.min(100, pct)}%"></span></div><div class="budget-footer"><span>${money(value)} utilizado</span><span>${Math.max(0, 100 - pct).toFixed(0)}% disponible</span></div></article>`; }).join("")}</div>` : `<section class="card empty-state"><div class="empty-icon">▤</div><h3>No hay presupuestos en este período</h3><p>Definí un límite para una categoría y seguí cómo evoluciona durante el mes.</p><button class="button primary small" id="new-budget-empty">＋ Crear presupuesto</button></section>`}`;
  }

  function renderGoals() {
    return `<div class="page-toolbar"><div class="month-summary"><span>Organizá tus próximos objetivos</span></div><button class="button primary small" id="new-goal">＋ Nueva meta</button></div>${state.goals.length ? `<div class="grid goal-grid">${state.goals.map(g => { const pct = g.target ? Math.min(100, g.saved / g.target * 100) : 0; return `<article class="card goal-card"><div class="panel-header"><div><div class="goal-title"><span class="category-symbol">${safe(g.icon || "◎")}</span>${safe(g.name)}</div><div class="goal-target">Meta: ${money(g.target)}</div></div><div class="actions"><button class="icon-button" title="Editar" data-edit-goal="${safe(g.id)}">✎</button><button class="icon-button" title="Eliminar" data-delete-goal="${safe(g.id)}">×</button></div></div><div class="goal-amount">${money(g.saved)}</div><div class="progress"><span style="width:${pct}%"></span></div><div class="goal-footer"><span class="goal-date">${pct >= 100 ? "Objetivo alcanzado" : `${pct.toFixed(0)}% completado · ${g.dueDate ? `fecha objetivo ${dateFmt(g.dueDate)}` : "sin fecha objetivo"}`}</span><button class="button secondary small" data-contribute-goal="${safe(g.id)}">＋ Aportar</button></div></article>`; }).join("")}</div>` : `<section class="card empty-state"><div class="empty-icon">◎</div><h3>Todavía no hay metas de ahorro</h3><p>Creá un objetivo y registrá aportes para seguir tu progreso.</p><button class="button primary small" id="new-goal-empty">＋ Nueva meta</button></section>`}`;
  }

  function renderSettings() {
    return `<div class="grid settings-grid"><section class="card settings-card"><h2>Respaldo y transferencia</h2><p>Descargá una copia de tus datos o restaurala en este mismo equipo. La exportación incluye movimientos, categorías, presupuestos y metas.</p><div class="settings-actions"><button class="button primary small" id="export-json">Descargar respaldo JSON</button><button class="button secondary small" id="import-json">Restaurar respaldo</button><input type="file" id="backup-file" accept="application/json,.json" hidden><button class="button secondary small" id="export-csv">Exportar movimientos CSV</button></div><div class="settings-note">Los datos se guardan en el almacenamiento local de esta aplicación. No se envían a un servidor ni se sincronizan entre equipos. Conservá el archivo de respaldo en un lugar seguro.</div></section>
      <section class="card settings-card"><h2>Categorías</h2><p>Las categorías clasifican cada movimiento y se pueden personalizar. Una categoría no puede eliminarse mientras tenga movimientos asociados.</p><button class="button secondary small" id="new-category">＋ Agregar categoría</button><div class="category-manage">${state.categories.map(c => `<div class="category-chip"><span>${safe(c.icon)} &nbsp;${safe(c.name)}</span><button class="icon-button" title="Eliminar categoría" data-delete-category="${safe(c.id)}">×</button></div>`).join("")}</div></section>
      <section class="card settings-card"><h2>Datos de demostración</h2><p>La primera apertura carga registros ficticios para mostrar el funcionamiento de los indicadores. Al crear el primer movimiento, la aplicación los reemplaza por tus datos.</p><div class="warning-box">Los registros iniciales son ejemplos ilustrativos. No representan información real ni recomendaciones financieras.</div><div class="settings-actions demo-reset"><button class="button danger small" id="clear-demo">Borrar datos de demostración</button><button class="button secondary small" id="restore-demo">Restablecer ejemplos</button></div></section>
      <section class="card settings-card"><h2>Acerca de Saldo Claro</h2><p>Aplicación de escritorio para registrar ingresos, gastos, presupuestos y metas personales.</p><div class="settings-note">Versión 1.0 · Almacenamiento local · Moneda de visualización: peso argentino (ARS)<br>Los importes se guardan como centavos enteros para evitar errores de redondeo.</div></section></div>`;
  }

  function drawChart() {
    const canvas = $("#month-chart"); if (!canvas) return;
    const rect = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio)); canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = canvas.getContext("2d"); ctx.scale(ratio, ratio);
    const w = rect.width, h = rect.height, pad = { l: 38, r: 9, t: 12, b: 26 };
    ctx.clearRect(0, 0, w, h);
    const [year, month] = selectedMonth.split("-").map(Number), days = new Date(year, month, 0).getDate();
    const daily = Array.from({ length: days }, () => ({ income: 0, expense: 0 }));
    monthMovements(selectedMonth).forEach(m => { const d = Number(m.date.slice(8, 10)) - 1; if (daily[d]) daily[d][m.type] += m.amount; });
    const max = Math.max(1, ...daily.map(d => Math.max(d.income, d.expense))) * 1.2;
    ctx.strokeStyle = "#edf1ed"; ctx.fillStyle = "#9ba49d"; ctx.font = "9px Arial"; ctx.lineWidth = 1;
    for (let j = 0; j <= 3; j++) { const y = pad.t + (h - pad.t - pad.b) * j / 3; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); ctx.fillText(money(max * (3 - j) / 3).replace(",00", ""), 0, y + 3); }
    const slot = (w - pad.l - pad.r) / days, bw = Math.max(1, Math.min(6, slot * .28));
    daily.forEach((d, i) => { const cx = pad.l + i * slot + slot / 2, usable = h - pad.t - pad.b; const ih = d.income / max * usable, eh = d.expense / max * usable; ctx.fillStyle = "#4b9870"; ctx.beginPath(); ctx.roundRect(cx - bw - 1, h - pad.b - ih, bw, ih, 2); ctx.fill(); ctx.fillStyle = "#e28a75"; ctx.beginPath(); ctx.roundRect(cx + 1, h - pad.b - eh, bw, eh, 2); ctx.fill(); });
    ctx.fillStyle = "#929c95"; [1, Math.ceil(days / 4), Math.ceil(days / 2), Math.ceil(days * 3 / 4), days].forEach(d => { const x = pad.l + (d - .5) * slot; ctx.fillText(String(d), x - 5, h - 6); });
  }

  function showModal(title, intro, body, onSubmit) {
    const dlg = $("#modal");
    $("#modal-content").innerHTML = `<div class="modal-body"><h2>${safe(title)}</h2><p class="modal-intro">${safe(intro)}</p>${body}</div>`;
    dlg.showModal();
    const form = dlg.querySelector("form.data-form");
    if (form) form.addEventListener("submit", e => { e.preventDefault(); onSubmit(new FormData(form)); });
  }
  const field = (name, label, value = "", type = "text", required = true, attrs = "") => `<div class="form-field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${safe(value)}" ${required ? "required" : ""} ${attrs}></div>`;
  const categorySelect = (value, type) => state.categories.filter(c => type !== "income" || c.id === "cat-salary" || !["cat-home", "cat-food", "cat-transport", "cat-health", "cat-leisure"].includes(c.id)).map(c => `<option value="${safe(c.id)}" ${c.id === value ? "selected" : ""}>${safe(c.icon)} ${safe(c.name)}</option>`).join("");
  const formActions = (label = "Guardar") => `<div class="form-actions"><button class="button secondary" type="button" data-close-modal>Cancelar</button><button class="button primary" type="submit">${label}</button></div>`;
  function movementModal(item = null) {
    const edit = Boolean(item);
    const type = item?.type || "expense";
    const body = `<form class="data-form"><div class="form-grid">
      <div class="form-field"><label for="f-type">Tipo</label><select id="f-type" name="type"><option value="expense" ${type === "expense" ? "selected" : ""}>Gasto</option><option value="income" ${type === "income" ? "selected" : ""}>Ingreso</option></select></div>
      ${field("amount", "Importe (ARS)", edit ? amountInput(item.amount) : "", "number", true, 'min="0.01" step="0.01"')}
      <div class="form-field"><label for="f-categoryId">Categoría</label><select id="f-categoryId" name="categoryId" required>${categorySelect(item?.categoryId || (type === "income" ? "cat-salary" : "cat-food"), type)}</select></div>
      ${field("date", "Fecha", item?.date || dateISO(), "date")}
      <div class="form-field full"><label for="f-description">Descripción</label><input id="f-description" name="description" value="${safe(item?.description || "")}" required maxlength="100" placeholder="Ej.: compras del supermercado"></div>
      </div>${formActions(edit ? "Guardar cambios" : "Agregar movimiento")}</form>`;
    showModal(edit ? "Editar movimiento" : "Nuevo movimiento", "Registrá el importe, la fecha y una categoría para mantener tu resumen actualizado.", body, data => {
      const cents = Math.round(Number(data.get("amount")) * 100), date = String(data.get("date")), description = String(data.get("description")).trim(), typeNow = String(data.get("type"));
      if (!Number.isSafeInteger(cents) || cents <= 0) return toast("Ingresá un importe mayor que cero.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !description) return toast("Revisá la fecha y la descripción.");
      const updated = { id: item?.id || makeId("movement"), type: typeNow, amount: cents, date, categoryId: String(data.get("categoryId")), description };
      if (edit) state.movements = state.movements.map(x => x.id === item.id ? updated : x); else { if (state.demo) clearAllDemo(); state.movements.push(updated); }
      persist(); $("#modal").close(); render(); toast(edit ? "Movimiento actualizado." : "Movimiento agregado.");
    });
    $("#f-type").addEventListener("change", e => { const sel = $("#f-categoryId"), old = sel.value; sel.innerHTML = categorySelect(old, e.target.value); });
  }

  function budgetModal(item = null) {
    const body = `<form class="data-form"><div class="form-grid"><div class="form-field full"><label for="f-categoryId">Categoría de gasto</label><select id="f-categoryId" name="categoryId" required>${state.categories.filter(c => c.id !== "cat-salary").map(c => `<option value="${safe(c.id)}" ${c.id === item?.categoryId ? "selected" : ""}>${safe(c.icon)} ${safe(c.name)}</option>`).join("")}</select></div>${field("amount", "Límite mensual (ARS)", item ? amountInput(item.amount) : "", "number", true, 'min="0.01" step="0.01"')}</div>${formActions(item ? "Guardar cambios" : "Crear presupuesto")}</form>`;
    showModal(item ? "Editar presupuesto" : "Nuevo presupuesto", `El límite se aplicará a ${periodName(selectedMonth)}.`, body, data => {
      const cents = Math.round(Number(data.get("amount")) * 100), categoryId = String(data.get("categoryId"));
      if (!Number.isSafeInteger(cents) || cents <= 0) return toast("El límite debe ser mayor que cero.");
      const dupe = state.budgets.find(b => b.categoryId === categoryId && b.month === selectedMonth && b.id !== item?.id);
      if (dupe) return toast("Ya existe un presupuesto para esa categoría y período.");
      const b = { id: item?.id || makeId("budget"), categoryId, month: selectedMonth, amount: cents };
      if (item) state.budgets = state.budgets.map(x => x.id === item.id ? b : x); else state.budgets.push(b);
      persist(); $("#modal").close(); render(); toast("Presupuesto guardado.");
    });
  }

  function goalModal(item = null) {
    const body = `<form class="data-form"><div class="form-grid">${field("name", "Nombre de la meta", item?.name || "", "text", true, 'maxlength="50"')}${field("target", "Importe objetivo (ARS)", item ? amountInput(item.target) : "", "number", true, 'min="0.01" step="0.01"')}${field("saved", "Ahorro acumulado (ARS)", item ? amountInput(item.saved) : "0", "number", true, 'min="0" step="0.01"')}${field("dueDate", "Fecha objetivo", item?.dueDate || "", "date", false)}</div>${formActions(item ? "Guardar cambios" : "Crear meta")}</form>`;
    showModal(item ? "Editar meta de ahorro" : "Nueva meta de ahorro", "Definí un objetivo y registrá cuánto ya lograste ahorrar.", body, data => {
      const target = Math.round(Number(data.get("target")) * 100), saved = Math.round(Number(data.get("saved")) * 100), name = String(data.get("name")).trim();
      if (!name || !Number.isSafeInteger(target) || target <= 0 || !Number.isSafeInteger(saved) || saved < 0) return toast("Revisá el nombre y los importes de la meta.");
      const g = { id: item?.id || makeId("goal"), name, target, saved, dueDate: String(data.get("dueDate") || ""), icon: item?.icon || "◎" };
      if (item) state.goals = state.goals.map(x => x.id === item.id ? g : x); else state.goals.push(g);
      persist(); $("#modal").close(); render(); toast("Meta guardada.");
    });
  }

  function contributeModal(id) {
    const g = state.goals.find(x => x.id === id); if (!g) return;
    const body = `<form class="data-form"><div class="form-grid">${field("amount", "Aporte (ARS)", "", "number", true, 'min="0.01" step="0.01"')}${field("date", "Fecha", dateISO(), "date")}</div>${formActions("Registrar aporte")}</form>`;
    showModal("Aportar a una meta", `Se sumará un aporte a “${g.name}”. El registro queda reflejado en el progreso de la meta.`, body, data => {
      const n = Math.round(Number(data.get("amount")) * 100); if (!Number.isSafeInteger(n) || n <= 0) return toast("El aporte debe ser mayor que cero.");
      g.saved += n; persist(); $("#modal").close(); render(); toast("Aporte registrado.");
    });
  }

  function categoryModal() {
    const body = `<form class="data-form"><div class="form-grid">${field("name", "Nombre", "", "text", true, 'maxlength="25"')}${field("icon", "Símbolo", "•", "text", true, 'maxlength="2"')}</div>${formActions("Agregar categoría")}</form>`;
    showModal("Nueva categoría", "Elegí un nombre y un símbolo breve para identificarla.", body, data => {
      const name = String(data.get("name")).trim(), icon = String(data.get("icon")).trim() || "•";
      if (!name) return toast("Escribí el nombre de la categoría.");
      if (state.categories.some(c => c.name.toLocaleLowerCase("es-AR") === name.toLocaleLowerCase("es-AR"))) return toast("Ya existe una categoría con ese nombre.");
      state.categories.push({ id: makeId("cat"), name, icon, color: "#779a81" }); persist(); $("#modal").close(); render(); toast("Categoría agregada.");
    });
  }

  function clearAllDemo() { state.demo = false; state.movements = state.movements.filter(x => !x.id.startsWith("demo-")); state.budgets = state.budgets.filter(x => !x.id.startsWith("budget-")); state.goals = state.goals.filter(x => !x.id.startsWith("goal-")); }
  function clearDemo() { if (!state.demo) return toast("No hay datos de demostración activos."); if (!confirm("Se eliminarán los ejemplos cargados inicialmente. ¿Continuar?")) return; clearAllDemo(); persist(); render(); toast("Datos de demostración eliminados."); }
  function download(filename, content, type) { const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function exportJson() { download(`respaldo-saldo-claro-${dateISO()}.json`, JSON.stringify({ app: "Saldo Claro", version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2), "application/json"); toast("Respaldo descargado."); }
  function exportCsv() {
    const lines = [["Fecha", "Tipo", "Descripción", "Categoría", "Importe ARS"].join(";")];
    [...state.movements].sort((a, b) => a.date.localeCompare(b.date)).forEach(m => lines.push([m.date, m.type === "income" ? "Ingreso" : "Gasto", m.description, category(m.categoryId).name, (m.amount / 100).toFixed(2)].map(x => `"${String(x).replace(/"/g, '""')}"`).join(";")));
    download(`movimientos-saldo-claro-${dateISO()}.csv`, "\ufeff" + lines.join("\r\n"), "text/csv;charset=utf-8"); toast("Archivo CSV descargado.");
  }
  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const raw = JSON.parse(String(reader.result || "")), data = raw.data; if (!raw || raw.app !== "Saldo Claro" || !validState(data)) throw new Error("Formato"); if (!confirm("La restauración reemplazará los datos actuales. ¿Querés continuar?")) return; state = data; persist(); render(); toast("Respaldo restaurado."); } catch { toast("El archivo no es un respaldo válido de Saldo Claro."); } };
    reader.readAsText(file);
  }

  function handleClick(e) {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.page) { nav(b.dataset.page); return; }
    if (b.id === "new-movement" || b.id === "new-movement-inline") return movementModal();
    if (b.id === "new-budget" || b.id === "new-budget-empty") return budgetModal();
    if (b.id === "new-goal" || b.id === "new-goal-empty") return goalModal();
    if (b.id === "new-category") return categoryModal();
    if (b.hasAttribute("data-close-modal")) return $("#modal").close();
    if (b.id === "export-json") return exportJson();
    if (b.id === "export-csv") return exportCsv();
    if (b.id === "import-json") return $("#backup-file").click();
    if (b.id === "clear-demo") return clearDemo();
    if (b.id === "restore-demo") { if (!confirm("Esto reemplazará los datos actuales por los ejemplos iniciales. ¿Continuar?")) return; state = demoState(); persist(); render(); return toast("Ejemplos restablecidos."); }
    if (b.dataset.editMovement) return movementModal(state.movements.find(x => x.id === b.dataset.editMovement));
    if (b.dataset.deleteMovement) { if (!confirm("¿Eliminar este movimiento? Esta acción no se puede deshacer.")) return; state.movements = state.movements.filter(x => x.id !== b.dataset.deleteMovement); persist(); render(); return toast("Movimiento eliminado."); }
    if (b.dataset.editBudget) return budgetModal(state.budgets.find(x => x.id === b.dataset.editBudget));
    if (b.dataset.deleteBudget) { if (!confirm("¿Eliminar este presupuesto?")) return; state.budgets = state.budgets.filter(x => x.id !== b.dataset.deleteBudget); persist(); render(); return toast("Presupuesto eliminado."); }
    if (b.dataset.editGoal) return goalModal(state.goals.find(x => x.id === b.dataset.editGoal));
    if (b.dataset.deleteGoal) { if (!confirm("¿Eliminar esta meta de ahorro?")) return; state.goals = state.goals.filter(x => x.id !== b.dataset.deleteGoal); persist(); render(); return toast("Meta eliminada."); }
    if (b.dataset.contributeGoal) return contributeModal(b.dataset.contributeGoal);
    if (b.dataset.deleteCategory) { const id = b.dataset.deleteCategory; if (state.movements.some(m => m.categoryId === id) || state.budgets.some(x => x.categoryId === id)) return toast("No se puede borrar: la categoría tiene registros asociados."); if (!confirm("¿Eliminar esta categoría?")) return; state.categories = state.categories.filter(c => c.id !== id); persist(); render(); return toast("Categoría eliminada."); }
  }

  function filterMovements() {
    const query = $("#movement-search")?.value.trim().toLocaleLowerCase("es-AR") || "", type = $("#type-filter")?.value || "all";
    const list = monthMovements(selectedMonth).filter(m => (type === "all" || m.type === type) && (!query || m.description.toLocaleLowerCase("es-AR").includes(query) || category(m.categoryId).name.toLocaleLowerCase("es-AR").includes(query))).sort((a, b) => b.date.localeCompare(a.date));
    const table = $("#movement-table"); if (table) table.innerHTML = renderMovementTable(list);
  }

  document.addEventListener("click", handleClick);
  document.addEventListener("input", e => { if (e.target.id === "movement-search") filterMovements(); });
  document.addEventListener("change", e => {
    if (e.target.id === "month-picker") { if (e.target.value) selectedMonth = e.target.value; render(); }
    if (e.target.id === "type-filter") filterMovements();
    if (e.target.id === "backup-file") { importJson(e.target.files?.[0]); e.target.value = ""; }
  });
  $("#modal").addEventListener("click", e => { if (e.target === $("#modal")) $("#modal").close(); });
  window.addEventListener("resize", () => { if (activePage === "inicio") drawChart(); });
  $("#month-picker").value = selectedMonth;
  $("#today-label").textContent = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  persist(); render();
})();
