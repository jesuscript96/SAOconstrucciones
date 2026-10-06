/* Atalaya · planificación y suministros. */
(function (A) {
  'use strict';
  const U = A.ui, S = U.S, E = A.engine, D = A.D, TODAY = A.TODAY;
  const { ic, chip, num, eur, pct, fdate, fdt, esc } = U;
  const act = U.act;
  const actById = (id) => A.activities.find((a) => a.id === id);

  /* ═════════ PLANIFICACIÓN ═════════ */
  function actProgress(a) {
    if (a.link) {
      const pres = a.link.split('|');
      const els = A.elements.filter((e) => pres.some((p) => e.id.startsWith(p)));
      const tot = els.reduce((s, e) => s + e.qty, 0);
      return tot ? els.reduce((s, e) => s + e.qty * E.doneFraction(e, TODAY), 0) / tot : 0;
    }
    if (a.done) return 1;
    return a.pct || 0;
  }
  U.actProgress = actProgress;
  const successors = (id) => A.activities.filter((a) => (a.deps || []).includes(id));
  function downstream(id, seen = new Set()) {
    successors(id).forEach((s) => { if (!seen.has(s.id)) { seen.add(s.id); downstream(s.id, seen); } });
    return [...seen].map(actById);
  }
  const delayOf = (a) => Math.round((D(a.real[1]) - D(a.plan[1])) / A.DAY);
  const ZOOM = {
    mes: { from: '2026-02-01', to: '2027-07-20', pxd: 2.15, tick: 'month' },
    quincena: { from: '2026-07-01', to: '2027-03-01', pxd: 4.6, tick: 'half' },
    semana: { from: '2026-09-07', to: '2026-12-20', pxd: 10.5, tick: 'week' },
  };
  S.planZoom = 'mes';
  S.planGroup = 'none';
  function gantt() {
    const z = ZOOM[S.planZoom];
    const start = D(z.from), end = D(z.to);
    const L = 220, rowH = 34, top = 44;
    const W = L + Math.round(((end - start) / A.DAY) * z.pxd) + 20;
    const x = (d) => L + ((U.toDate(d) - start) / A.DAY) * z.pxd;
    const clampX = (d) => Math.max(L, Math.min(W - 10, x(d)));
    // Filas (con agrupación opcional)
    const groupKey = { capitulo: (a) => a.cap + ' ' + A.chapters.find((c) => c.code === a.cap).name, zona: (a) => a.zona, subcontrata: (a) => U.subName(a.sub) }[S.planGroup];
    const rows = [];
    if (groupKey) {
      const groups = {};
      A.activities.forEach((a) => (groups[groupKey(a)] = groups[groupKey(a)] || []).push(a));
      Object.keys(groups).sort().forEach((g) => { rows.push({ group: g }); groups[g].forEach((a) => rows.push({ a })); });
    } else A.activities.forEach((a) => rows.push({ a }));
    rows.unshift({ hitos: true });
    const H = top + rows.length * rowH + 10;
    const ticks = [];
    if (z.tick === 'month') for (let d = new Date(2026, 1, 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) ticks.push([new Date(d), d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') + (d.getMonth() === 0 ? ' ' + d.getFullYear() : '')]);
    if (z.tick === 'half') for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth() + (d.getDate() > 1 ? 1 : 0), d.getDate() > 1 ? 1 : 16)) ticks.push([new Date(d), (d.getDate() === 1 ? '1ª ' : '2ª ') + d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')]);
    if (z.tick === 'week') for (let d = new Date(start); d <= end; d = A.addDays(d, 7)) ticks.push([new Date(d), 'S' + weekNo(d) + ' · ' + d.getDate() + '/' + (d.getMonth() + 1)]);
    const rowY = {};
    rows.forEach((r, i) => { if (r.a) rowY[r.a.id] = top + i * rowH; });
    const arrows = [];
    rows.forEach((r) => {
      if (!r.a) return;
      (r.a.deps || []).forEach((p) => {
        const pa = actById(p);
        if (rowY[p] == null) return;
        const x1 = clampX(pa.real[1]), y1 = rowY[p] + 21, x2 = clampX(r.a.real[0]), y2 = rowY[r.a.id] + 21;
        const crit = pa.critical && r.a.critical;
        arrows.push(`<path class="dep ${crit ? 'crit' : ''}" d="M${x1},${y1} h6 V${y2} H${Math.max(x2 - 2, x1 + 6)}" marker-end="url(#arr${crit ? 'c' : ''})"/>`);
      });
    });
    return `<svg class="gantt" viewBox="0 0 ${W} ${H}" style="min-width:${W}px" role="img" aria-label="Diagrama de Gantt">
      <defs><marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L6,3L0,6z" class="dep-head"/></marker><marker id="arrc" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L6,3L0,6z" class="dep-head crit"/></marker></defs>
      ${ticks.map(([d, l]) => `<line class="grid" x1="${x(d)}" x2="${x(d)}" y1="${top - 10}" y2="${H}"/><text class="axis" x="${x(d) + 4}" y="${top - 16}">${l}</text>`).join('')}
      ${rows.map((r, i) => {
        const y = top + i * rowH;
        if (r.hitos) return `<g class="g-row hitos"><rect class="row-bg" x="0" y="${y}" width="${W}" height="${rowH}"/><text class="g-name" x="8" y="${y + 21}">Hitos</text>${A.hitos.map((h) => `<g class="hito" data-action="hito:${h.id}"><title>${h.name}: plan ${fdate(h.plan, false)} · previsto ${fdate(h.fc, false)}</title><path class="h-plan" d="M${x(h.plan)},${y + 9} l7,8 l-7,8 l-7,-8z"/><path class="h-fc ${D(h.fc) > D(h.plan) ? 'late' : ''}" d="M${x(h.fc)},${y + 9} l7,8 l-7,8 l-7,-8z"/></g>`).join('')}</g>`;
        if (r.group) return `<g class="g-row grp"><rect class="row-bg grp" x="0" y="${y}" width="${W}" height="${rowH}"/><text class="g-grp" x="8" y="${y + 21}">${esc(r.group)}</text></g>`;
        const a = r.a;
        const p0 = x(a.plan[0]), p1 = x(a.plan[1]), r0 = x(a.real[0]), r1 = x(a.real[1]);
        const prog = actProgress(a);
        const delay = delayOf(a);
        const started = D(a.real[0]) <= TODAY;
        const sel = S.actSel === a.id;
        const blocked = A.restricciones.some((q) => q.act === a.id && q.status === 'abierta');
        return `<g class="g-row ${a.critical ? 'crit' : ''} ${sel ? 'sel' : ''}" data-action="actsel:${a.id}" role="button" tabindex="0" aria-label="${esc(a.name)}">
          <rect class="row-bg" x="0" y="${y}" width="${W}" height="${rowH}"/>
          <text class="g-name" x="8" y="${y + 15}">${blocked ? '⚠ ' : ''}${esc(a.name)}</text>
          <text class="g-sub" x="8" y="${y + 28}">${a.sub ? U.subName(a.sub) : 'Pendiente de adjudicar'} · ${a.resp || ''}</text>
          <rect class="bar-plan" x="${p0}" y="${y + 6}" width="${Math.max(2, p1 - p0)}" height="7" rx="2"/>
          <rect class="bar-real ${started ? '' : 'fc'}" x="${r0}" y="${y + 15}" width="${Math.max(2, r1 - r0)}" height="12" rx="2"/>
          ${started ? `<rect class="bar-done" x="${r0}" y="${y + 15}" width="${Math.max(0, (r1 - r0) * prog)}" height="12" rx="2"/>` : ''}
          ${delay > 0 && D(a.real[1]) > D('2026-06-01') ? `<text class="g-delay" x="${r1 + 6}" y="${y + 25}">+${delay} d</text>` : ''}
        </g>`;
      }).join('')}
      ${arrows.join('')}
      <line class="grid" x1="${L}" x2="${L}" y1="${top - 10}" y2="${H}"/>
      <line class="today" x1="${x(TODAY)}" x2="${x(TODAY)}" y1="${top - 10}" y2="${H}"/>
      <text class="today-label" x="${x(TODAY) + 5}" y="${H - 6}">Hoy</text>
    </svg>`;
  }
  function weekNo(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / A.DAY + 1) / 7);
  }
  A.views.planificacion = {
    render() {
      const edit = U.can('planificacion');
      const look = A.activities.filter((a) => D(a.real[0]) <= A.addDays(TODAY, 21) && D(a.real[1]) >= TODAY);
      return `
      <header class="page-head compact">
        <div><div class="eyebrow">Planificación aprobada rev. 2 · previsión recalculada con el avance validado</div><h1>Planificación</h1></div>
        <div class="head-actions">
          <div class="seg" role="group" aria-label="Escala">${[['mes', 'Meses'], ['quincena', 'Quincenas'], ['semana', 'Semanas']].map(([k, l]) => `<button data-action="pzoom:${k}" aria-pressed="${S.planZoom === k}">${l}</button>`).join('')}</div>
          <label class="fsel inline"><span>Agrupar</span><select data-change="pgroup" id="pgroup">${[['none', 'Sin agrupar'], ['capitulo', 'Capítulo'], ['zona', 'Zona o planta'], ['subcontrata', 'Subcontrata']].map(([k, l]) => `<option value="${k}" ${S.planGroup === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          ${edit ? `<button class="btn" data-action="replan">${ic('gantt')}${S.replan === 'sent' ? 'Replanificación enviada' : 'Proponer replanificación'}</button>` : ''}
        </div>
      </header>
      <article class="card">
        <div class="card-h wrap"><h2>Plan base frente a real y previsión</h2>
          <div class="legend"><span><i class="lg-planbar"></i>Plan aprobado</span><span><i class="lg-realbar"></i>Real · hecho</span><span><i class="lg-fcbar"></i>Previsión</span><span><i class="lg-crit"></i>Ruta crítica</span><span>◆ Hito</span><span>⚠ Con restricciones</span></div></div>
        <div class="table-wrap">${gantt()}</div>
        <p class="muted small pad">Pulsa una actividad para ver sus dependencias, a qué trabajos afecta, sus restricciones y el historial de fechas.</p>
      </article>
      ${S.replan === 'open' ? replanHTML() : ''}
      ${S.actSel ? actDetail(actById(S.actSel)) : ''}
      <section class="grid g-2">
        <article class="card">
          <div class="card-h"><h2>Próximas 3 semanas</h2><span class="muted">${fdate(TODAY, false)} – ${fdate(A.addDays(TODAY, 21), false)}</span></div>
          <ul class="devs">${look.map((a) => { const rs = A.restricciones.filter((q) => q.act === a.id && q.status === 'abierta'); return `<li class="clk" data-action="actsel:${a.id}"><div><strong>${a.name}</strong><span class="muted small">${a.zona} · ${a.sub ? U.subName(a.sub) : 'Sin adjudicar'} · ${pct(actProgress(a), 0)} hecho${rs.length ? ' · ' + rs.map((q) => q.type.toLowerCase()).join(', ') : ''}</span></div>${rs.length ? '<span class="chip st-late"><i></i>Bloqueada</span>' : '<span class="chip st-ok"><i></i>Lista</span>'}</li>`; }).join('')}
            ${A.tareas.filter((t) => t.estado !== 'hecha' && U.days(t.due) <= 21).map((t) => `<li><div><strong>${t.t}</strong><span class="muted small">Tarea · ${t.resp} · ${fdate(t.due, false)}</span></div><span class="chip st-none"><i></i>Tarea</span></li>`).join('')}</ul>
        </article>
        <article class="card">
          <div class="card-h"><h2>Restricciones</h2><span class="muted">Lo que impide empezar una tarea</span></div>
          <ul class="devs">${A.restricciones.map((q) => `<li><div><strong>${q.text}</strong><span class="muted small">${q.type} · ${actById(q.act).name} · ${q.resp} · ${fdate(q.due, false)}</span></div>${q.status === 'abierta' ? (edit ? `<button class="btn btn-sm" data-action="resolve:${q.id}">Resolver</button>` : '<span class="chip st-late"><i></i>Abierta</span>') : '<span class="chip st-ok"><i></i>Resuelta</span>'}</li>`).join('')}</ul>
          ${edit ? `<div class="card-f"><button class="btn btn-sm" data-action="newrestr">${ic('plus')}Añadir restricción</button></div>` : ''}
        </article>
      </section>
      <article class="card">
        <div class="card-h"><h2>Historial de cambios de fechas</h2><span class="muted">Previsión. La planificación aprobada no cambia sin aprobación.</span></div>
        <div class="table-wrap"><table class="table compact"><thead><tr><th>Fecha</th><th>Actividad</th><th>Cambio</th><th>Motivo</th><th>Quién</th></tr></thead>
        <tbody>${A.dateChanges.map((c) => `<tr><td>${fdt(c.at)}</td><td>${actById(c.act).name}</td><td>Fin ${c.from} → <b>${c.to}</b></td><td>${esc(c.reason)}</td><td>${c.who}</td></tr>`).join('')}</tbody></table></div>
      </article>`;
    },
  };
  function actDetail(a) {
    const pred = (a.deps || []).map(actById);
    const succ = successors(a.id);
    const down = downstream(a.id);
    const rs = A.restricciones.filter((q) => q.act === a.id);
    const hist = A.dateChanges.filter((c) => c.act === a.id);
    const delay = delayOf(a);
    const edit = U.can('planificacion');
    return `<article class="card act-detail">
      <div class="card-h wrap"><div><h2>${a.name}</h2><div class="muted small">${A.chapters.find((c) => c.code === a.cap).name} · ${a.zona} · ${a.sub ? U.subName(a.sub) : 'Pendiente de adjudicar'} · responsable ${a.resp}</div></div>
        <div class="head-actions">${a.critical ? '<span class="chip st-late"><i></i>Ruta crítica</span>' : ''}${edit ? `<button class="btn btn-sm" data-action="movedates:${a.id}">${ic('cal')}Mover previsión</button>` : ''}<button class="btn btn-sm btn-icon btn-ghost" data-action="actsel:" aria-label="Cerrar">${ic('x')}</button></div></div>
      <div class="act-grid">
        <div><h3 class="mini">Fechas</h3><dl class="dl"><dt>Plan aprobado</dt><dd>${fdate(a.plan[0], false)} – ${fdate(a.plan[1], false)}</dd><dt>Real / previsto</dt><dd>${fdate(a.real[0], false)} – ${fdate(a.real[1], false)}</dd><dt>Desviación</dt><dd class="${delay > 0 ? 'neg' : ''}">${delay > 0 ? '+' + delay + ' días' : 'En plazo'}</dd><dt>Avance</dt><dd>${pct(actProgress(a), 0)}</dd></dl></div>
        <div><h3 class="mini">Dependencias</h3><p class="small"><b>Antes:</b> ${pred.map((p) => `<button class="linkish" data-action="actsel:${p.id}">${p.name}</button>`).join(', ') || '—'}</p><p class="small"><b>Después:</b> ${succ.map((p) => `<button class="linkish" data-action="actsel:${p.id}">${p.name}</button>`).join(', ') || '—'}</p>
          ${delay > 0 && down.length ? `<div class="r-alert">${ic('alert')}<span>Este retraso afecta a ${down.length} trabajos posteriores: ${down.map((d) => d.name).join(', ')}.</span></div>` : ''}</div>
        <div><h3 class="mini">Restricciones</h3><ul class="evid">${rs.map((q) => `<li>${q.status === 'abierta' ? ic('alert') : ic('check')}<span>${q.type}: ${q.text}</span></li>`).join('') || '<li class="muted">Sin restricciones</li>'}</ul>
          <h3 class="mini">Historial</h3><ul class="evid">${hist.map((c) => `<li><span>${fdate(c.at, false)} · fin ${c.from} → ${c.to} · ${esc(c.reason)}</span></li>`).join('') || '<li class="muted">Sin cambios</li>'}</ul></div>
      </div>
    </article>`;
  }
  function replanHTML() {
    return `<article class="card replan">
      <div class="card-h"><h2>Propuesta de replanificación</h2><span class="muted">Borrador · requiere aprobación de ${A.project.pm}</span></div>
      <div class="card-b">
        <p>Para recuperar los 8 días de la ruta crítica sin mover la entrega:</p>
        <ul class="bullets">
          <li>Hormigonar los paños 3 y 4 de la cubierta en una sola puesta (ahorro estimado: 3 días).</li>
          <li>Solapar el inicio de la impermeabilización con el curado del paño 4 en la zona ya hormigonada (2 días).</li>
          <li>Reforzar la cuadrilla de fachada P2 con un segundo equipo durante 3 semanas (3 días en urbanización final).</li>
        </ul>
        <div class="form-actions"><button class="btn" data-action="replan-close">Descartar</button><button class="btn btn-primary" data-action="replan-send">Enviar a aprobación</button></div>
      </div>
    </article>`;
  }
  act('pzoom', (z) => { S.planZoom = z; U.rerender(); });
  act('pgroup', (_, __, v) => { S.planGroup = v; U.rerender(); });
  act('actsel', (id) => { S.actSel = id || null; U.rerender(); });
  act('hito', (id) => { const h = A.hitos.find((x) => x.id === id); S.actSel = h.act; U.rerender(); });
  act('replan', () => { if (S.replan !== 'sent' && U.guard('planificacion')) { S.replan = 'open'; U.rerender(); } });
  act('replan-close', () => { S.replan = 'none'; U.rerender(); });
  act('replan-send', () => { S.replan = 'sent'; U.log('planificacion', 'Envió una propuesta de replanificación a aprobación'); U.toast(`${ic('check')}<span>Replanificación enviada a <b>${A.project.pm}</b>. La planificación aprobada no cambia hasta su aprobación.</span>`, 'ok'); U.rerender(); });
  act('resolve', (id) => { if (!U.guard('planificacion')) return; const q = A.restricciones.find((x) => x.id === id); q.status = 'resuelta'; U.log('planificacion', `Resolvió la restricción «${q.text}»`); U.rerender(); });
  act('newrestr', () => {
    U.modal(`<div class="modal-head"><h2>Nueva restricción</h2></div><form class="form" id="rForm">
      <label for="rAct">Actividad</label><select id="rAct">${A.activities.map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}</select>
      <label for="rType">Tipo</label><select id="rType"><option>Material</option><option>Documentación</option><option>Aprobación</option><option>Trabajo previo</option></select>
      <label for="rText">Descripción</label><input id="rText" required placeholder="Qué falta para empezar">
      <label for="rDue">Fecha objetivo</label><input type="date" id="rDue" value="${A.iso(A.addDays(TODAY, 7))}">
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Añadir</button></div></form>`);
    U.$('#rForm').addEventListener('submit', (e) => {
      e.preventDefault();
      A.restricciones.unshift({ id: 'R' + (A.restricciones.length + 1), act: U.$('#rAct').value, type: U.$('#rType').value, text: U.$('#rText').value, status: 'abierta', resp: U.me(), due: U.$('#rDue').value });
      U.log('planificacion', 'Añadió una restricción: ' + U.$('#rText').value);
      U.closeModal(); U.rerender();
    });
  });
  act('movedates', (id) => {
    const a = actById(id);
    U.modal(`<div class="modal-head"><h2>Mover previsión · ${a.name}</h2></div><form class="form" id="mvForm">
      <label for="mvEnd">Nuevo fin previsto</label><input type="date" id="mvEnd" value="${a.real[1]}" required>
      <label for="mvWhy">Motivo</label><input id="mvWhy" required placeholder="Por qué cambia la fecha">
      <p class="muted small">Se desplazan las actividades posteriores que dependan de esta. La planificación aprobada se mantiene.</p>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Aplicar</button></div></form>`);
    U.$('#mvForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const ne = U.$('#mvEnd').value, diff = Math.round((D(ne) - D(a.real[1])) / A.DAY);
      const from = fdate(a.real[1], false);
      a.real = [a.real[0], ne];
      const moved = [];
      downstream(a.id).forEach((s) => { if (diff > 0) { s.real = [A.iso(A.addDays(D(s.real[0]), diff)), A.iso(A.addDays(D(s.real[1]), diff))]; moved.push(s.name); } });
      A.dateChanges.unshift({ at: U.now(), who: U.me(), act: a.id, from, to: fdate(ne, false), reason: U.$('#mvWhy').value });
      U.log('planificacion', `Movió el fin previsto de ${a.name}`, from, fdate(ne, false));
      U.closeModal();
      U.toast(`${ic('cal')}<span>Previsión actualizada${moved.length ? `. Se han desplazado ${moved.length} actividades posteriores.` : '.'}</span>`, 'ok');
      U.rerender();
    });
  });

  /* ═════════ SUMINISTROS ═════════ */
  S.supTab = 'pedidos';
  S.supFilter = '';
  A.recepciones = [
    { at: '2026-09-29T08:20', ped: 'M7', who: 'Marcos Ferrer', lines: '9.800 ud de ladrillo', inc: '', alb: 'DOC-ALB-22417' },
    { at: '2026-09-26T07:45', ped: 'M8', who: 'Marcos Ferrer', lines: '26 m³ de hormigón (1 de 3 entregas)', inc: '', alb: 'DOC-ALB-H-1180' },
    { at: '2026-09-25T09:10', ped: 'M9', who: 'Marcos Ferrer', lines: '5,5 t de acero corrugado', inc: 'Faltan 1,9 t de barra Ø16 respecto al pedido', alb: 'DOC-ALB-F-771' },
  ];
  A.views.suministros = {
    render() {
      const tab = S.supTab;
      return `
      <header class="page-head compact">
        <div><div class="eyebrow">Pedidos, recepciones, proveedores y acopios</div><h1>Suministros</h1></div>
        <div class="head-actions">
          <div class="seg" role="tablist">${[['pedidos', 'Pedidos'], ['recepciones', 'Recepciones'], ['proveedores', 'Proveedores'], ['acopios', 'Acopios']].map(([k, l]) => `<button role="tab" data-action="suptab:${k}" aria-pressed="${tab === k}">${l}</button>`).join('')}</div>
          ${U.can('suministros') ? `<button class="btn btn-primary" data-action="newped">${ic('plus')}Nuevo pedido</button>` : ''}
        </div>
      </header>
      ${tab === 'pedidos' ? pedidosHTML() : tab === 'recepciones' ? recepHTML() : tab === 'proveedores' ? provHTML() : acopiosHTML()}`;
    },
  };
  function pedidosHTML() {
    const list = A.supplies.filter((m) => !S.supFilter || m.status === S.supFilter);
    const sel = A.supplies.find((m) => m.id === S.supSel);
    const pend = A.supplies.filter((m) => !['completa', 'cancelado'].includes(m.status));
    return `
    <section class="kpis">
      <div class="kpi"><div class="kpi-label">Pedidos abiertos</div><div class="kpi-value">${pend.length}</div><div class="kpi-foot">${eur(pend.reduce((s, m) => s + m.importe, 0))} comprometidos</div></div>
      <div class="kpi"><div class="kpi-label">Pendientes de pedir</div><div class="kpi-value">${A.supplies.filter((m) => m.status === 'sin_pedido').length}</div><div class="kpi-foot">Con fecha límite en los próximos 14 días</div></div>
      <div class="kpi"><div class="kpi-label">Retrasados</div><div class="kpi-value">${A.supplies.filter((m) => m.status === 'retraso').length}</div><div class="kpi-foot">Comprometen actividades en curso</div></div>
      <div class="kpi"><div class="kpi-label">Entregas parciales</div><div class="kpi-value">${A.supplies.filter((m) => m.status === 'parcial').length}</div><div class="kpi-foot">Material pendiente de recibir</div></div>
    </section>
    <article class="card">
      <div class="card-h wrap"><h2>Pedidos</h2><label class="fsel inline"><span>Estado</span><select data-change="supfilter" id="supfilter"><option value="">Todos</option>${Object.keys(A.supplyStatus).map((k) => `<option value="${k}" ${S.supFilter === k ? 'selected' : ''}>${A.supplyStatus[k][0]}</option>`).join('')}</select></label></div>
      <div class="table-wrap"><table class="table subs">
        <thead><tr><th>Material</th><th>Proveedor</th><th class="num">Importe</th><th>Necesario</th><th>Entrega prevista</th><th>Pedir antes de</th><th>Estado</th><th>Resp.</th></tr></thead>
        <tbody>${list.map((m) => { const ob = E.orderBy(m), dd = E.daysTo(ob); const late = m.entrega && D(m.entrega) > D(m.needed) && !['completa', 'cancelado'].includes(m.status); return `<tr class="${S.supSel === m.id ? 'sel' : ''}" data-action="supsel:${m.id}" tabindex="0">
          <td><strong>${m.name}</strong><div class="muted small">${m.scope}</div></td><td>${(U.prov(m.prov) || {}).name || '—'}</td><td class="num">${eur(m.importe)}</td>
          <td>${fdate(m.needed, false)}</td><td class="${late ? 'neg' : ''}">${m.entrega ? fdate(m.entrega, false) : '—'}${late ? ' ' + ic('alert') : ''}</td>
          <td>${m.status === 'sin_pedido' ? `<b class="${dd <= 7 ? 'neg' : 'warn'}">${fdate(ob, false)}</b><div class="small muted">${dd >= 0 ? 'en ' + dd + ' días' : 'vencido'}</div>` : '<span class="muted">—</span>'}</td>
          <td>${U.chipOf(A.supplyStatus, m.status)}</td><td class="small">${m.resp}</td></tr>`; }).join('')}</tbody>
      </table></div>
    </article>
    ${sel ? pedidoDetail(sel) : ''}`;
  }
  function pedidoDetail(m) {
    const p = U.prov(m.prov) || {};
    const docs = A.files.filter((f) => m.docs.includes(f.id) || f.links.some((l) => l.t === 'sup' && l.id === m.id));
    const a = actById(m.act);
    const edit = U.can('suministros');
    const late = m.entrega && D(m.entrega) > D(m.needed) && !['completa', 'cancelado'].includes(m.status);
    return `<article class="card">
      <div class="card-h wrap"><div><h2>${m.name}</h2><div class="muted small">${m.id} · ${m.scope} · ${p.name || ''}${m.ref ? ' · ' + m.ref : ''}</div></div>
        <div class="head-actions">${U.chipOf(A.supplyStatus, m.status)}
          ${edit && ['sin_pedido', 'solicitud'].includes(m.status) ? `<button class="btn btn-sm btn-primary" data-action="order:${m.id}">Registrar pedido</button>` : ''}
          ${edit && ['confirmado', 'parcial', 'retraso'].includes(m.status) ? `<button class="btn btn-sm btn-primary" data-action="recep:${m.id}">${ic('truck')}Registrar recepción</button>` : ''}
          ${edit && ['confirmado', 'parcial'].includes(m.status) ? `<button class="btn btn-sm" data-action="pedretraso:${m.id}">Marcar retraso</button>` : ''}
          ${edit && !['completa', 'cancelado'].includes(m.status) ? `<button class="btn btn-sm btn-ghost" data-action="pedcancel:${m.id}">Cancelar</button>` : ''}</div></div>
      <div class="act-grid">
        <div><h3 class="mini">Datos del pedido</h3><dl class="dl"><dt>Proveedor</dt><dd>${p.name || '—'}<div class="muted small">${p.contacto || ''} · ${p.tel || ''}</div></dd><dt>Solicitado</dt><dd>${m.solicitado ? fdate(m.solicitado) : '—'}</dd><dt>Necesario en obra</dt><dd>${fdate(m.needed)}</dd><dt>Entrega prevista</dt><dd>${m.entrega ? fdate(m.entrega) : '—'}</dd><dt>Plazo</dt><dd>${m.lead} días</dd><dt>Responsable</dt><dd>${m.resp}</dd></dl></div>
        <div><h3 class="mini">Líneas</h3><table class="table compact"><thead><tr><th>Material</th><th class="num">Pedido</th><th class="num">Recibido</th><th class="num">Precio</th></tr></thead><tbody>${m.lines.map((l, i) => `<tr><td>${l.d}</td><td class="num">${num(l.q, l.q % 1 ? 1 : 0)} ${l.u}</td><td class="num ${m.recibido[i] < l.q && m.recibido[i] > 0 ? 'warn' : ''}">${num(m.recibido[i], m.recibido[i] % 1 ? 1 : 0)}</td><td class="num">${num(l.p, 2)} €</td></tr>`).join('')}</tbody></table>
          <p class="muted small">Recibir el material no significa que esté instalado: el avance se registra aparte.</p></div>
        <div><h3 class="mini">Planificación</h3><p class="small">Actividad vinculada: <button class="linkish" data-action="goto:planificacion:${a.id}">${a.name}</button> (inicio ${fdate(a.real[0], false)})</p>
          ${late ? `<div class="r-alert">${ic('alert')}<span>La entrega llega después de la fecha necesaria y compromete esta actividad.</span></div>` : ''}
          <h3 class="mini">Documentos</h3><ul class="evid">${docs.map((f) => `<li>${ic('doc')}<button class="linkish" data-action="goto:documentacion:${f.folder}">${f.name}</button></li>`).join('') || '<li class="muted">Sin documentos</li>'}</ul>
          ${edit ? `<label class="btn btn-sm file-btn">${ic('upload')}Adjuntar oferta, confirmación o albarán<input type="file" data-change="supdoc:${m.id}"></label>` : ''}</div>
      </div>
    </article>`;
  }
  function recepHTML() {
    return `<article class="card"><div class="card-h"><h2>Recepciones registradas</h2></div><div class="table-wrap"><table class="table">
      <thead><tr><th>Fecha</th><th>Pedido</th><th>Recibido</th><th>Diferencias o daños</th><th>Albarán</th><th>Registró</th></tr></thead>
      <tbody>${A.recepciones.map((r) => { const m = A.supplies.find((x) => x.id === r.ped); return `<tr><td>${fdt(r.at)}</td><td><button class="linkish" data-action="supsel:${m.id}:go">${m.name}</button></td><td>${r.lines}</td><td class="${r.inc ? 'neg' : 'muted'}">${r.inc || 'Sin incidencias'}</td><td>${r.alb ? `<span class="mono small">${r.alb.replace('DOC-', '')}</span>` : '—'}</td><td>${r.who}</td></tr>`; }).join('')}</tbody></table></div></article>`;
  }
  function provHTML() {
    const q = (S.provQ || '').toLowerCase();
    const cat = S.provCat || '';
    const cats = [...new Set(A.proveedores.flatMap((p) => p.cats))].sort();
    const list = A.proveedores.filter((p) => (!q || (p.name + p.contacto + p.cats.join(' ')).toLowerCase().includes(q)) && (!cat || p.cats.includes(cat)));
    const sel = A.proveedores.find((p) => p.id === S.provSel);
    return `<article class="card">
      <div class="card-h wrap"><h2>Proveedores y contactos habituales</h2><div class="head-actions">
        <label class="search-in small">${ic('search')}<input type="search" id="provQ" value="${esc(S.provQ || '')}" placeholder="Buscar material o empresa" data-change="provq" aria-label="Buscar proveedor"></label>
        <label class="fsel inline"><span>Material</span><select data-change="provcat" id="provcat"><option value="">Todos</option>${cats.map((c) => `<option ${cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        ${U.can('suministros') ? `<button class="btn btn-sm" data-action="newprov">${ic('plus')}Añadir proveedor</button>` : ''}</div></div>
      <div class="table-wrap"><table class="table subs"><thead><tr><th>Empresa</th><th>Materiales y especialidades</th><th>Contacto</th><th>Teléfono</th><th>Correo</th><th>Valoración</th></tr></thead>
      <tbody>${list.map((p) => `<tr class="${S.provSel === p.id ? 'sel' : ''}" data-action="provsel:${p.id}" tabindex="0"><td><strong>${p.name}</strong><div class="muted small">${p.city}</div></td><td>${p.cats.map((c) => `<span class="tag">${c}</span>`).join(' ')}</td><td>${p.contacto}</td><td class="mono small">${p.tel}</td><td class="small">${p.email}</td><td>${U.stars(p.rating)}</td></tr>`).join('')}</tbody></table></div>
    </article>
    ${sel ? `<article class="card"><div class="card-h wrap"><div><h2>${sel.name}</h2><div class="muted small">${sel.cats.join(' · ')} · ${sel.city}</div></div>${U.can('suministros') ? `<button class="btn btn-sm btn-primary" data-action="newped:${sel.id}">${ic('plus')}Nuevo pedido a este proveedor</button>` : ''}</div>
      <div class="card-b"><p>${sel.contacto} · <span class="mono">${sel.tel}</span> · ${sel.email}</p>
      <h3 class="mini">Pedidos en esta obra</h3><ul class="evid">${A.supplies.filter((m) => m.prov === sel.id).map((m) => `<li><button class="linkish" data-action="supsel:${m.id}:go">${m.name}</button>${U.chipOf(A.supplyStatus, m.status)}<span>${eur(m.importe)}</span></li>`).join('') || '<li class="muted">Sin pedidos</li>'}</ul></div></article>` : ''}`;
  }
  function acopiosHTML() {
    return `<article class="card"><div class="card-h"><h2>Existencias y acopios en obra</h2><span class="muted">Control sencillo de material recibido y consumido</span></div><div class="table-wrap"><table class="table">
      <thead><tr><th>Material</th><th>Ubicación</th><th class="num">Recibido</th><th class="num">Consumo estimado</th><th class="num">En obra</th><th>Nota</th></tr></thead>
      <tbody>${A.acopios.map((a) => `<tr><td><strong>${a.mat}</strong></td><td>${a.ubic}</td><td class="num">${a.recibido}</td><td class="num">${a.consumo}</td><td class="num"><b>${a.stock}</b></td><td class="muted">${a.nota}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted small pad">El consumo se estima a partir del avance validado de las partidas que usan cada material.</p></article>`;
  }
  act('suptab', (t) => { S.supTab = t; U.rerender(); });
  act('supfilter', (_, __, v) => { S.supFilter = v; U.rerender(); });
  act('supsel', (id, go) => { S.supSel = S.supSel === id && !go ? null : id; S.supTab = 'pedidos'; U.rerender(); });
  act('provsel', (id) => { S.provSel = id; U.rerender(); });
  act('provq', (_, __, v) => { S.provQ = v; U.rerender(); });
  act('provcat', (_, __, v) => { S.provCat = v; U.rerender(); });
  act('order', (id) => {
    if (!U.guard('suministros')) return;
    const m = A.supplies.find((x) => x.id === id);
    const before = U.chipText(A.supplyStatus, m.status);
    m.status = 'confirmado';
    m.solicitado = A.iso(TODAY);
    m.entrega = A.iso(A.addDays(TODAY, m.lead));
    m.ref = 'PED-04' + (10 + A.supplies.indexOf(m)) + ' · entrega ' + fdate(m.entrega, false);
    const r = A.restricciones.find((q) => q.act === m.act && q.type === 'Material' && q.status === 'abierta' && /pedido/i.test(q.text));
    if (r && A.supplies.filter((x) => x.act === m.act && x.status === 'sin_pedido').length === 0) r.status = 'resuelta';
    const t = A.tareas.find((x) => x.link && x.link.t === 'sup' && x.link.id === id);
    if (t) t.estado = 'hecha';
    U.log('suministros', `Registró el pedido de ${m.name.toLowerCase()} (${m.scope})`, before, 'Pedido confirmado');
    U.toast(`${ic('truck')}<span>Pedido registrado: <b>${m.name}</b> · entrega prevista ${fdate(m.entrega, false)}</span>`, 'ok');
    U.rerender();
  });
  act('pedretraso', (id) => { const m = A.supplies.find((x) => x.id === id); m.status = 'retraso'; U.log('suministros', `Marcó como retrasado el pedido de ${m.name.toLowerCase()}`); U.rerender(); });
  act('pedcancel', (id) => { const m = A.supplies.find((x) => x.id === id); m.status = 'cancelado'; U.log('suministros', `Canceló el pedido de ${m.name.toLowerCase()}`); U.rerender(); });
  act('recep', (id) => {
    const m = A.supplies.find((x) => x.id === id);
    U.modal(`<div class="modal-head"><h2>Recepción · ${m.name}</h2></div><form class="form" id="recForm">
      <table class="table compact"><thead><tr><th>Material</th><th class="num">Pendiente</th><th class="num">Recibido ahora</th></tr></thead><tbody>
      ${m.lines.map((l, i) => `<tr><td>${l.d}</td><td class="num">${num(l.q - m.recibido[i], 1)} ${l.u}</td><td class="num"><input type="number" step="any" min="0" class="cell-in" id="rq${i}" value="${+(l.q - m.recibido[i]).toFixed(2)}" aria-label="Cantidad recibida de ${esc(l.d)}"></td></tr>`).join('')}</tbody></table>
      <label for="recInc">Daños o diferencias respecto al pedido</label><textarea id="recInc" rows="2" placeholder="Opcional"></textarea>
      <label for="recAlb">Albarán</label><input type="file" id="recAlb">
      <p class="muted small">Recibir el material actualiza el pedido y las restricciones de la planificación. No marca nada como instalado.</p>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Registrar recepción</button></div></form>`, 'wide');
    U.$('#recForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const oldRef = (m.ref || '').split(' ')[0];
      const got = m.lines.map((l, i) => +U.$('#rq' + i).value || 0);
      got.forEach((g, i) => { m.recibido[i] = Math.min(m.lines[i].q, m.recibido[i] + g); });
      const complete = m.lines.every((l, i) => m.recibido[i] >= l.q - 1e-6);
      m.status = complete ? 'completa' : 'parcial';
      m.ref = complete ? 'Recibido el ' + fdate(TODAY, false) : 'Recepción parcial ' + fdate(TODAY, false);
      const f = U.$('#recAlb').files[0];
      let albId = null;
      if (f) { albId = 'DOC-' + Date.now(); A.files.push({ id: albId, folder: 'proveedores', name: 'Albarán · ' + f.name, date: A.iso(TODAY), resp: U.me(), status: 'cargado', tags: ['albarán'], links: [{ t: 'sup', id: m.id, label: 'Suministros · ' + m.id }], size: Math.round(f.size / 1024) + ' kB', type: f.name.split('.').pop().toUpperCase(), url: URL.createObjectURL(f) }); m.docs.push(albId); }
      A.recepciones.unshift({ at: U.now(), ped: m.id, who: U.me(), lines: m.lines.map((l, i) => num(got[i], got[i] % 1 ? 1 : 0) + ' ' + l.u + ' de ' + l.d.toLowerCase()).join(', '), inc: U.$('#recInc').value, alb: albId });
      if (complete) A.restricciones.filter((q) => q.act === m.act && q.type === 'Material' && q.status === 'abierta' && oldRef && q.text.includes(oldRef)).forEach((q) => (q.status = 'resuelta'));
      U.log('suministros', `Registró la recepción de ${m.name.toLowerCase()}`, null, complete ? 'Entrega completa' : 'Entrega parcial');
      U.closeModal();
      U.toast(`${ic('truck')}<span>Recepción registrada: <b>${complete ? 'entrega completa' : 'entrega parcial'}</b>.</span>`, 'ok');
      U.rerender();
    });
  });
  act('supdoc', (id, _, __, el) => {
    const f = el.files[0];
    if (!f) return;
    const m = A.supplies.find((x) => x.id === id);
    const did = 'DOC-' + Date.now();
    A.files.push({ id: did, folder: 'proveedores', name: f.name, date: A.iso(TODAY), resp: U.me(), status: 'cargado', tags: ['pedido'], links: [{ t: 'sup', id, label: 'Suministros · ' + id }], size: Math.round(f.size / 1024) + ' kB', type: f.name.split('.').pop().toUpperCase(), url: URL.createObjectURL(f) });
    m.docs.push(did);
    U.log('documentacion', `Adjuntó ${f.name} al pedido ${id}`);
    U.toast(`${ic('doc')}<span>Documento guardado en <b>Documentación › Proveedores</b> y vinculado al pedido.</span>`, 'ok');
    U.rerender();
  });
  act('newped', (provId) => {
    if (!U.guard('suministros')) return;
    U.modal(`<div class="modal-head"><h2>Nuevo pedido</h2></div><form class="form" id="pedForm">
      <label for="pProv">Proveedor</label><select id="pProv">${A.proveedores.map((p) => `<option value="${p.id}" ${provId === p.id ? 'selected' : ''}>${p.name} · ${p.cats[0]}</option>`).join('')}</select>
      <label for="pName">Material</label><input id="pName" required placeholder="Ej.: Mortero cola para alicatado">
      <div class="row2"><div><label for="pQ">Cantidad</label><input id="pQ" type="number" step="any" required value="100"></div><div><label for="pU">Unidad</label><input id="pU" value="m²"></div></div>
      <div class="row2"><div><label for="pP">Precio unitario (€)</label><input id="pP" type="number" step="any" value="10"></div><div><label for="pLead">Plazo de suministro (días)</label><input id="pLead" type="number" value="7"></div></div>
      <div class="row2"><div><label for="pNeed">Necesario en obra</label><input id="pNeed" type="date" value="${A.iso(A.addDays(TODAY, 14))}"></div><div><label for="pAct">Actividad</label><select id="pAct">${A.activities.map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div></div>
      <label for="pSt">Estado</label><select id="pSt"><option value="solicitud">Solicitud de oferta</option><option value="confirmado">Pedido confirmado</option></select>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Crear pedido</button></div></form>`, 'wide');
    U.$('#pedForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = 'M' + (A.supplies.length + 1);
      const q = +U.$('#pQ').value, p = +U.$('#pP').value, lead = +U.$('#pLead').value;
      const st = U.$('#pSt').value;
      A.supplies.unshift({ id, name: U.$('#pName').value, scope: U.$('#pAct').selectedOptions[0].text, needed: U.$('#pNeed').value, lead, status: st, prov: U.$('#pProv').value, act: U.$('#pAct').value, resp: U.me(), solicitado: A.iso(TODAY), entrega: st === 'confirmado' ? A.iso(A.addDays(TODAY, lead)) : null, ref: st === 'confirmado' ? 'PED-0' + (430 + A.supplies.length) : 'Oferta solicitada', lines: [{ d: U.$('#pName').value, q, u: U.$('#pU').value, p }], recibido: [0], docs: [], importe: q * p });
      U.log('suministros', `Creó el pedido ${id}: ${U.$('#pName').value}`);
      S.supSel = id; S.supTab = 'pedidos';
      U.closeModal(); U.rerender();
    });
  });
  act('newprov', () => {
    U.modal(`<div class="modal-head"><h2>Nuevo proveedor</h2></div><form class="form" id="prvForm">
      <label for="vN">Empresa</label><input id="vN" required>
      <label for="vC">Materiales o especialidades (separados por comas)</label><input id="vC" required placeholder="Pintura, Revestimientos">
      <div class="row2"><div><label for="vP">Contacto</label><input id="vP"></div><div><label for="vT">Teléfono</label><input id="vT"></div></div>
      <label for="vE">Correo</label><input id="vE" type="email">
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Guardar</button></div></form>`);
    U.$('#prvForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = 'PR' + (A.proveedores.length + 1);
      A.proveedores.push({ id, name: U.$('#vN').value, cats: U.$('#vC').value.split(',').map((x) => x.trim()).filter(Boolean), contacto: U.$('#vP').value, tel: U.$('#vT').value, email: U.$('#vE').value, city: '', rating: 3 });
      U.log('suministros', 'Añadió el proveedor ' + U.$('#vN').value);
      S.provSel = id; U.closeModal(); U.rerender();
    });
  });
})(window.ATL);
