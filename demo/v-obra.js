/* Atalaya · pantallas de obra: cartera, panel, modelo BIM, interiores y capturas. */
(function (A) {
  'use strict';
  const U = A.ui, S = U.S, E = A.engine, V = A.viewer, D = A.D, TODAY = A.TODAY;
  const { ic, chip, num, eur, keur, pct, fdate, fdt, esc } = U;
  const act = U.act;

  /* ═════════ CARTERA ═════════ */
  const thumbs = {};
  function obraThumb(o) {
    if (!thumbs[o.id]) {
      const at = o.img.at;
      thumbs[o.id] = A.photo.render({ cam: o.img.cam, at: at === 'now' || at === 'done' ? 'now' : at, allDone: at === 'done', noOverlay: true, thumb: true }).photo;
    }
    return thumbs[o.id];
  }
  function obraData(o) {
    if (!o.live) return o;
    const st = U.stats();
    const eco = U.eco();
    return Object.assign({}, o, { real: st.avance, plan: st.plan, budget: eco.venta, cert: eco.certificado, pend: eco.pagosPend, alerts: U.alerts().length, devs: 'Ruta crítica +8 días' });
  }
  S.cart = { emp: '', resp: '', estado: '', city: '', mode: 'cards', cmp: [] };
  A.views.cartera = {
    render() {
      const f = S.cart;
      const all = A.obras.map(obraData);
      const list = all.filter((o) => (!f.emp || o.promotor === f.emp) && (!f.resp || o.resp === f.resp) && (!f.estado || o.status === f.estado) && (!f.city || o.city === f.city));
      const uniq = (k) => [...new Set(A.obras.map((o) => o[k]))].sort();
      const active = all.filter((o) => o.status === 'ejecucion' || o.status === 'paralizada');
      const sel = (id, label, k, opts) => `<label class="fsel"><span>${label}</span><select data-change="cartf:${k}" id="${id}"><option value="">Todos</option>${opts.map((v) => `<option value="${esc(v[0])}" ${f[k] === v[0] ? 'selected' : ''}>${esc(v[1])}</option>`).join('')}</select></label>`;
      return `
      <header class="page-head">
        <div><div class="eyebrow">Edifica Levante · ${A.obras.length} obras</div><h1>Cartera de obras</h1></div>
        <div class="head-actions">
          ${f.cmp.length ? `<button class="btn btn-primary" data-action="cartcmp">${ic('sheet')}Comparar ${f.cmp.length} obras</button>` : '<span class="muted small">Marca varias obras para compararlas</span>'}
          <div class="seg" role="group" aria-label="Vista"><button data-action="cartmode:cards" aria-pressed="${f.mode === 'cards'}">Tarjetas</button><button data-action="cartmode:table" aria-pressed="${f.mode === 'table'}">Tabla</button></div>
        </div>
      </header>
      <section class="kpis">
        <div class="kpi"><div class="kpi-label">Obras activas</div><div class="kpi-value">${active.length}</div><div class="kpi-foot">${all.filter((o) => o.status === 'paralizada').length} paralizada · ${all.filter((o) => o.status === 'pendiente').length} pendiente de inicio</div></div>
        <div class="kpi"><div class="kpi-label">Contratación en curso</div><div class="kpi-value">${keur(active.reduce((s, o) => s + o.budget, 0))}</div><div class="kpi-foot">Presupuesto de venta de obras activas</div></div>
        <div class="kpi"><div class="kpi-label">Certificado a origen</div><div class="kpi-value">${keur(active.reduce((s, o) => s + o.cert, 0))}</div><div class="kpi-foot">Obras activas</div></div>
        <div class="kpi"><div class="kpi-label">Avisos abiertos</div><div class="kpi-value">${all.reduce((s, o) => s + (o.alerts || 0), 0)}</div><div class="kpi-foot">Entre todas las obras</div></div>
      </section>
      <div class="filters">
        ${sel('fEmp', 'Promotor', 'emp', uniq('promotor').map((v) => [v, v]))}
        ${sel('fResp', 'Responsable', 'resp', uniq('resp').map((v) => [v, v]))}
        ${sel('fEst', 'Estado', 'estado', Object.keys(A.obraStatus).map((k) => [k, A.obraStatus[k][0]]))}
        ${sel('fCity', 'Ubicación', 'city', uniq('city').map((v) => [v, v]))}
        ${f.emp || f.resp || f.estado || f.city ? `<button class="btn btn-sm btn-ghost" data-action="cartclear">${ic('x')}Quitar filtros</button>` : ''}
      </div>
      ${f.mode === 'cards' ? `<section class="obras">${list.map((o) => obraCard(o)).join('') || '<p class="muted">No hay obras con estos filtros.</p>'}</section>` : obraTable(list)}`;
    },
  };
  function obraCard(o) {
    const st = A.obraStatus[o.status];
    const cmp = S.cart.cmp.includes(o.id);
    return `<article class="card obra ${o.live ? 'live' : ''}">
      <button class="obra-img" data-action="obra:${o.id}" aria-label="Abrir ${esc(o.name)}"><img src="${obraThumb(o)}" alt=""><span class="chip ${st[1]}"><i></i>${st[0]}</span></button>
      <div class="obra-b">
        <div class="obra-top"><div><h2><button class="linkish" data-action="obra:${o.id}">${o.name}</button></h2><div class="muted small">${o.zone}, ${o.city} · ${o.type}</div></div>
          <label class="cmp" title="Comparar"><input type="checkbox" ${cmp ? 'checked' : ''} data-change="cartsel:${o.id}" aria-label="Comparar ${esc(o.name)}"><span>Comparar</span></label></div>
        <dl class="dl tight">
          <dt>Promotor</dt><dd>${o.promotor}</dd>
          <dt>Constructora</dt><dd>${o.constructora}</dd>
          <dt>Responsable</dt><dd>${o.resp}</dd>
          <dt>Plazo</dt><dd>${fdate(o.start)} – ${fdate(o.end)}</dd>
        </dl>
        <div class="obra-av"><div class="bars-top"><span>Avance real ${pct(o.real, 0)}</span><span class="muted">previsto ${pct(o.plan, 0)}</span></div>
          <div class="meter thin ${o.real + 0.02 < o.plan ? 'behind' : ''}"><i style="width:${o.real * 100}%"></i><b style="left:${o.plan * 100}%"></b></div></div>
        <div class="obra-eco"><div><span>Presupuesto</span><b>${keur(o.budget)}</b></div><div><span>Certificado</span><b>${keur(o.cert)}</b></div><div><span>Pagos pendientes</span><b>${keur(o.pend)}</b></div></div>
        <div class="obra-foot"><span class="${o.alerts > 2 ? 'neg' : 'muted'}">${ic('bell')}${o.alerts} avisos</span><span class="muted">${o.devs}</span></div>
      </div>
    </article>`;
  }
  function obraTable(list) {
    return `<article class="card"><div class="table-wrap"><table class="table">
      <thead><tr><th></th><th>Obra</th><th>Estado</th><th>Responsable</th><th>Fin previsto</th><th class="num">Real</th><th class="num">Previsto</th><th class="num">Presupuesto</th><th class="num">Certificado</th><th class="num">Pagos pend.</th><th class="num">Avisos</th></tr></thead>
      <tbody>${list.map((o) => `<tr><td><input type="checkbox" ${S.cart.cmp.includes(o.id) ? 'checked' : ''} data-change="cartsel:${o.id}" aria-label="Comparar"></td>
        <td><button class="linkish" data-action="obra:${o.id}"><strong>${o.name}</strong></button><div class="muted small">${o.city} · ${o.promotor}</div></td>
        <td>${U.chipOf(A.obraStatus, o.status)}</td><td>${o.resp}</td><td>${fdate(o.end)}</td>
        <td class="num">${pct(o.real, 0)}</td><td class="num">${pct(o.plan, 0)}</td><td class="num">${keur(o.budget)}</td><td class="num">${keur(o.cert)}</td><td class="num">${keur(o.pend)}</td><td class="num">${o.alerts}</td></tr>`).join('')}</tbody>
    </table></div></article>`;
  }
  act('cartf', (k, _, v) => { S.cart[k] = v; U.rerender(); });
  act('cartclear', () => { Object.assign(S.cart, { emp: '', resp: '', estado: '', city: '' }); U.rerender(); });
  act('cartmode', (m) => { S.cart.mode = m; U.rerender(); });
  act('cartsel', (id, _, on) => {
    const c = S.cart.cmp;
    if (on && !c.includes(id)) { if (c.length >= 4) { U.toast(`${ic('alert')}<span>Puedes comparar hasta 4 obras a la vez.</span>`, 'warn'); U.rerender(); return; } c.push(id); }
    if (!on) S.cart.cmp = c.filter((x) => x !== id);
    U.rerender();
  });
  act('cartcmp', () => {
    const os = S.cart.cmp.map((id) => obraData(A.obras.find((o) => o.id === id)));
    const rows = [
      ['Estado', (o) => U.chipOf(A.obraStatus, o.status)], ['Tipo', (o) => o.type], ['Tamaño', (o) => o.size], ['Responsable', (o) => o.resp],
      ['Inicio', (o) => fdate(o.start)], ['Fin previsto', (o) => fdate(o.end)], ['Avance real', (o) => pct(o.real, 0)], ['Avance previsto', (o) => pct(o.plan, 0)],
      ['Desviación', (o) => `<span class="${o.real < o.plan - 0.01 ? 'neg' : ''}">${num((o.real - o.plan) * 100, 1)} pts</span>`], ['Presupuesto', (o) => eur(o.budget)], ['Certificado', (o) => eur(o.cert)],
      ['% certificado', (o) => pct(o.cert / o.budget, 0)], ['Pagos pendientes', (o) => eur(o.pend)], ['Avisos', (o) => o.alerts], ['Situación', (o) => o.devs],
    ];
    U.modal(`<div class="modal-head"><h2>Comparativa de obras</h2></div><div class="table-wrap"><table class="table compact"><thead><tr><th></th>${os.map((o) => `<th>${o.name}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(([l, f]) => `<tr><td class="muted">${l}</td>${os.map((o) => `<td>${f(o)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`, 'wide');
  });
  act('obra', (id) => {
    const o = A.obras.find((x) => x.id === id);
    if (o.live) { location.hash = 'panel'; return; }
    const d = obraData(o);
    U.modal(`<div class="modal-head"><h2>${o.name}</h2>${U.chipOf(A.obraStatus, o.status)}</div>
      <img class="modal-img" src="${obraThumb(o)}" alt="">
      <dl class="dl"><dt>Ubicación</dt><dd>${o.zone}, ${o.city}</dd><dt>Tipo</dt><dd>${o.type} · ${o.size}</dd><dt>Promotor</dt><dd>${o.promotor}</dd><dt>Responsable</dt><dd>${o.resp}</dd>
      <dt>Plazo</dt><dd>${fdate(o.start)} – ${fdate(o.end)}</dd><dt>Avance</dt><dd>${pct(d.real, 0)} real · ${pct(d.plan, 0)} previsto</dd><dt>Situación</dt><dd>${o.devs}</dd></dl>
      <p class="muted small">En este prototipo solo la obra Residencial Mirador del Turia tiene todos sus datos cargados.</p>
      <div class="form-actions">${o.status === 'entregada' ? `<button class="btn btn-primary" data-action="goto:entregas:posventa">${ic('key')}Ver posventa</button>` : ''}<button class="btn" data-action="closemodal">Cerrar</button></div>`);
  });

  /* ═════════ PANEL ═════════ */
  function sCurve() {
    const pem = E.pem();
    const start = D('2026-02-01'), end = D('2027-07-01');
    const W = 760, H = 330, m = { l: 40, r: 14, t: 14, b: 28 };
    const x = (d) => m.l + ((d - start) / (end - start)) * (W - m.l - m.r);
    const y = (v) => m.t + (1 - v) * (H - m.t - m.b);
    const plan = [], real = [];
    for (let t = new Date(start); t <= end; t = A.addDays(t, 9)) plan.push([x(t), y(E.planificado(t) / pem)]);
    plan.push([x(end), y(1)]);
    for (let t = new Date(start); t < TODAY; t = A.addDays(t, 9)) real.push([x(t), y(E.ejecutado(t) / pem)]);
    real.push([x(TODAY), y(E.ejecutado(TODAY) / pem)]);
    const cert = [];
    let prev = 0;
    U.certPeriods().filter((p) => p.status === 'cerrada').forEach((p) => {
      const v = U.certOrigen(p) / pem;
      cert.push([x(p.end), y(prev)], [x(p.end), y(v)]);
      prev = v;
    });
    cert.push([x(TODAY), y(prev)]);
    const path = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
    const months = [];
    for (let d = new Date(2026, 1, 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(new Date(d));
    const today = x(TODAY), ry = y(E.ejecutado() / pem), py = y(E.planificado() / pem);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de avance: planificado frente a real y certificado">
      ${[0, 0.25, 0.5, 0.75, 1].map((v) => `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text>`).join('')}
      ${months.map((d, i) => (i % 2 ? '' : `<text class="axis" x="${x(d)}" y="${H - 8}" text-anchor="middle">${d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}${d.getMonth() === 0 ? ' ’' + String(d.getFullYear()).slice(2) : ''}</text>`)).join('')}
      <path class="area-real" d="${path(real)}L${today},${y(0)}L${m.l},${y(0)}Z"/>
      <path class="line-plan" d="${path(plan)}"/>
      <path class="line-cert" d="${path(cert)}"/>
      <path class="line-real" d="${path(real)}"/>
      <line class="today" x1="${today}" x2="${today}" y1="${m.t}" y2="${H - m.b}"/>
      <text class="today-label" x="${today + 6}" y="${m.t + 10}">Hoy</text>
      <line class="gap" x1="${today}" x2="${today}" y1="${py}" y2="${ry}"/>
      <circle class="dot-plan" cx="${today}" cy="${py}" r="4"/>
      <circle class="dot-real" cx="${today}" cy="${ry}" r="5"/>
    </svg>
    <div class="legend"><span><i class="lg-real"></i>Real validado</span><span><i class="lg-plan"></i>Planificado</span><span><i class="lg-cert"></i>Certificado al cliente</span></div>`;
  }
  U.sCurve = sCurve;
  S.capOpen = {};
  A.views.panel = {
    render() {
      const st = U.stats();
      const pc = U.pendingCaps();
      const elapsed = (TODAY - A.project.start) / (A.project.end - A.project.start);
      const dayN = Math.round((TODAY - A.project.start) / A.DAY), dayT = Math.round((A.project.end - A.project.start) / A.DAY);
      const al = U.alerts();
      const chs = E.chapterStats().filter((c) => c.ej > 0 || c.pl > 0);
      const eco = U.eco();
      const P = A.project;
      const upd = (k) => `<span class="upd" title="Última actualización">${ic('history')}${U.ago(P.updated[k])}</span>`;
      const inc = A.incidencias.filter((i) => i.estado !== 'cerrada').sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.prio] - { alta: 0, media: 1, baja: 2 }[b.prio]));
      const miss = U.missingDocs();
      const expired = A.files.filter((f) => U.docState(f) === 'caducado');
      const peds = A.supplies.filter((m) => ['sin_pedido', 'retraso', 'parcial', 'solicitud'].includes(m.status));
      return `
      <header class="page-head">
        <div>
          <div class="eyebrow">${P.code} · ${P.type}</div>
          <h1>${P.name}</h1>
          <p class="sub">${P.address} · ${P.desc} · Promotor: ${P.client} · Entrega prevista ${fdate(P.end)}</p>
        </div>
        <div class="head-actions">
          <span class="chip st-late"><i></i>Ruta crítica +8 días</span>
          <button class="btn" data-action="goto:informes">${ic('doc')}Generar informe</button>
          <a class="btn btn-primary" href="#capturas">${ic('spark')}Revisar capturas${pc.caps ? ` <b class="count">${pc.caps}</b>` : ''}</a>
        </div>
      </header>
      <section class="kpis">
        <button class="kpi link" data-action="go:modelo">
          <div class="kpi-label">Avance real validado ${upd('avance')}</div>
          <div class="kpi-value">${pct(st.avance)}</div>
          <div class="meter"><i style="width:${st.avance * 100}%"></i><b style="left:${st.plan * 100}%" title="Planificado"></b></div>
          <div class="kpi-foot">Planificado a hoy ${pct(st.plan)} · <span class="neg">${num((st.avance - st.plan) * 100, 1)} pts</span> · ponderado por importe</div>
        </button>
        <button class="kpi link" data-action="go:presupuesto">
          <div class="kpi-label">Ejecutado validado (PEM) ${upd('avance')}</div>
          <div class="kpi-value">${keur(st.ej)}</div>
          <div class="kpi-foot">de ${keur(st.pem)} de presupuesto de ejecución material vigente</div>
        </button>
        <button class="kpi link" data-action="go:planificacion">
          <div class="kpi-label">Plazo consumido ${upd('plan')}</div>
          <div class="kpi-value">${pct(elapsed, 0)}</div>
          <div class="kpi-foot">Día ${dayN} de ${dayT} · fin previsto 8 jul 2027</div>
        </button>
        <button class="kpi link" data-action="go:certificaciones">
          <div class="kpi-label">Pendiente de certificar ${upd('economia')}</div>
          <div class="kpi-value">${keur((st.ej - U.certOrigen(U.lastClosed())) * (1 + P.ggbi))}</div>
          <div class="kpi-foot">Certificado a origen ${keur(U.certOrigen(U.lastClosed()) * (1 + P.ggbi))} · ${U.lastClosed().label}</div>
        </button>
      </section>

      <section class="grid g-main">
        <article class="card">
          <div class="card-h"><h2>Curva de avance</h2><span class="muted">Ponderado por presupuesto · PEM</span></div>
          <div class="card-b">${sCurve()}</div>
        </article>
        <article class="card">
          <div class="card-h"><h2>Avisos</h2><button class="btn btn-sm btn-ghost" data-action="bell">${al.length} activos</button></div>
          <ul class="alert-list">${al.slice(0, S.allAlerts ? 99 : 4).map(U.alertHTML).join('')}</ul>
          ${al.length > 4 ? `<button class="more" data-action="allalerts">${S.allAlerts ? 'Ver menos' : 'Ver los ' + al.length + ' avisos'}</button>` : ''}
        </article>
      </section>

      <section class="grid g-main">
        <article class="card model-card">
          <div class="card-h"><h2>Modelo BIM · fase de obra</h2><a class="btn btn-sm" href="#modelo">${ic('cube')}Abrir visor</a></div>
          <div class="viewer-host small" id="viewerHost"></div>
          ${faseLegend()}
        </article>
        <article class="card">
          <div class="card-h"><h2>Avance por capítulo</h2><span class="muted">Real · <i class="tick-ic"></i> plan</span></div>
          <ul class="bars caps">${chs.map((c) => capRow(c)).join('')}</ul>
        </article>
      </section>

      <section class="grid g-3">
        <article class="card">
          <div class="card-h"><h2>Resumen económico</h2><a class="btn btn-sm btn-ghost" href="#economia">Detalle</a></div>
          <ul class="kv pad-x">
            <li><span>Venta vigente (PEC)</span><b data-action="goto:economia:resumen" class="clk">${eur(eco.venta)}</b></li>
            <li><span>Coste final previsto</span><b>${eur(eco.costeFinal)}</b></li>
            <li><span>Margen previsto</span><b class="${eco.margen < eco.margenIni ? 'neg' : ''}">${pct(eco.margen)} <span class="muted small">(inicial ${pct(eco.margenIni)})</span></b></li>
            <li><span>Certificado al cliente</span><b>${eur(eco.certificado)}</b></li>
            <li><span>Pendiente de cobro</span><b>${eur(eco.cobroPend)}</b></li>
            <li><span>Pagos pendientes</span><b>${eur(eco.pagosPend)}</b></li>
          </ul>
        </article>
        <article class="card">
          <div class="card-h"><h2>Próximos hitos</h2><a class="btn btn-sm btn-ghost" href="#planificacion">Planificación</a></div>
          <ul class="devs">${A.hitos.map((h) => { const dd = Math.round((D(h.fc) - D(h.plan)) / A.DAY); return `<li><div><strong>◆ ${h.name}</strong><span class="muted small">Previsto ${fdate(h.fc, false)} · plan ${fdate(h.plan, false)}</span></div><b class="${dd > 0 ? 'neg' : 'pos'}">${dd > 0 ? '+' + dd + ' d' : 'En plazo'}</b></li>`; }).join('')}</ul>
        </article>
        <article class="card">
          <div class="card-h"><h2>Pedidos pendientes y retrasados</h2><a class="btn btn-sm btn-ghost" href="#suministros">Suministros</a></div>
          <ul class="devs">${peds.map((m) => `<li><div><strong>${m.name}</strong><span class="muted small">${m.status === 'sin_pedido' ? 'Pedir antes del ' + fdate(E.orderBy(m), false) : m.ref || ''}</span></div>${U.chipOf(A.supplyStatus, m.status)}</li>`).join('')}</ul>
        </article>
      </section>

      <section class="grid g-3">
        <article class="card">
          <div class="card-h"><h2>Incidencias relevantes</h2><a class="btn btn-sm btn-ghost" href="#calidad">Calidad</a></div>
          <ul class="devs">${inc.slice(0, 5).map((i) => `<li class="clk" data-action="goto:calidad:${i.id}"><div><strong>${i.title}</strong><span class="muted small">${i.ubic} · ${U.subName(i.sub)} · vence ${fdate(i.due, false)}</span></div>${prioChip(i.prio)}</li>`).join('')}</ul>
        </article>
        <article class="card">
          <div class="card-h"><h2>Documentación pendiente</h2><a class="btn btn-sm btn-ghost" href="#documentacion">Documentación</a></div>
          <ul class="devs">${expired.map((f) => `<li class="clk" data-action="goto:documentacion:${f.folder}"><div><strong>${f.name}</strong><span class="muted small">Caducó el ${fdate(f.expires, false)}</span></div>${U.chipOf(A.docStatus, 'caducado')}</li>`).join('')}
            ${miss.slice(0, 5 - expired.length).map((m) => `<li class="clk" data-action="goto:documentacion:${m.folder}"><div><strong>${m.req}</strong><span class="muted small">${(A.folders.find((f) => f.id === m.folder) || { name: 'Subcontratas' }).name}</span></div>${U.chipOf(A.docStatus, 'pendiente')}</li>`).join('')}</ul>
          <p class="muted small pad">${miss.length} documentos requeridos sin cargar · ${expired.length} caducados</p>
        </article>
        <article class="card">
          <div class="card-h"><h2>Actividad reciente</h2><a class="btn btn-sm btn-ghost" href="#registro">Registro</a></div>
          <ul class="feed">${A.audit.slice(0, 6).map((a) => `<li><time>${fdt(a.at)}</time><div><strong>${a.who}</strong> ${a.what.charAt(0).toLowerCase() + a.what.slice(1)}${a.pending ? ' <span class="chip st-progress"><i></i>sin sincronizar</span>' : ''}</div></li>`).join('')}</ul>
        </article>
      </section>

      <article class="card">
        <div class="card-h"><h2>Ficha de la obra</h2>${U.can('panel') ? `<button class="btn btn-sm" data-action="editficha">${ic('edit')}Editar</button>` : ''}</div>
        <div class="ficha">
          <div><h3 class="mini">Datos generales</h3><p class="small">${P.description}</p><dl class="dl">${P.fields.map((f) => `<dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd>`).join('')}<dt>Dirección</dt><dd>${P.address}</dd><dt>Tipo</dt><dd>${P.type}</dd></dl></div>
          <div><h3 class="mini">Agentes intervinientes</h3><dl class="dl">${P.agentes.map((a) => `<dt>${a.rol}</dt><dd>${a.nombre}${a.contacto ? ` <span class="muted">· ${a.contacto}</span>` : ''}</dd>`).join('')}</dl></div>
          <div><h3 class="mini">Fechas y condiciones contractuales</h3><dl class="dl">${P.contract.map((c) => `<dt>${c.k}</dt><dd>${c.v}</dd>`).join('')}<dt>Responsables</dt><dd>${P.jefe} (jefe de obra) · ${P.pm} (project manager) · ${P.tecnico} (técnico)</dd></dl></div>
        </div>
      </article>`;
    },
    mount() { mountViewer(true); },
  };
  function prioChip(p) { return `<span class="chip ${{ alta: 'st-late', media: 'st-progress', baja: 'st-none' }[p]}"><i></i>Prioridad ${p}</span>`; }
  U.prioChip = prioChip;
  function capRow(c) {
    const open = S.capOpen[c.code];
    const parts = A.partidas.filter((p) => p.cap === c.code);
    return `<li class="cap-row ${open ? 'open' : ''}">
      <button class="cap-btn" data-action="capopen:${c.code}" aria-expanded="${!!open}">
        <div class="bars-top"><span>${ic('chevron', 'chev')}${c.code} ${c.name}</span><b>${pct(c.avance, 0)}</b></div>
        <div class="meter thin ${c.avance + 0.02 < c.plan ? 'behind' : ''}"><i style="width:${c.avance * 100}%"></i><b style="left:${c.plan * 100}%"></b></div>
      </button>
      ${open ? `<div class="cap-parts"><table class="table compact"><thead><tr><th>Partida</th><th class="num">Ejecutado</th><th class="num">Certificado</th></tr></thead><tbody>
        ${parts.map((p) => `<tr><td><span class="mono">${p.code}</span> ${p.desc}</td><td class="num">${pct(E.partidaAvance(p), 0)}</td><td class="num">${pct(U.certPct(p.code), 0)}</td></tr>`).join('')}</tbody></table>
        ${U.can('certificaciones') ? `<button class="btn btn-sm" data-action="certcap:${c.code}">${ic('sheet')}Certificar este capítulo</button>` : ''}</div>` : ''}
    </li>`;
  }
  act('capopen', (code) => { S.capOpen[code] = !S.capOpen[code]; U.rerender(); });
  act('certcap', (code) => U.go('certificaciones', () => { S.certCap = code; S.certOpen = { [code]: true }; }));
  act('allalerts', () => { S.allAlerts = !S.allAlerts; U.rerender(); });
  act('editficha', () => {
    if (!U.guard('panel')) return;
    const P = A.project;
    U.modal(`<div class="modal-head"><h2>Editar ficha de la obra</h2></div>
      <form class="form" id="fichaForm">
        <label for="fType">Tipo de proyecto</label><input id="fType" value="${esc(P.type)}">
        <label for="fAddr">Dirección</label><input id="fAddr" value="${esc(P.address)}">
        <label for="fDesc">Descripción</label><textarea id="fDesc" rows="3">${esc(P.description)}</textarea>
        <label>Campos de la obra <span class="muted">(se adaptan al tipo de proyecto)</span></label>
        <div id="fFields">${P.fields.map((f, i) => `<div class="kvrow"><input value="${esc(f.k)}" aria-label="Campo ${i + 1}" data-fk="${i}"><input value="${esc(f.v)}" aria-label="Valor ${i + 1}" data-fv="${i}"></div>`).join('')}</div>
        <button type="button" class="btn btn-sm" data-action="addfield">${ic('plus')}Añadir campo</button>
        <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>
      </form>`, 'wide');
    U.$('#fichaForm').addEventListener('submit', (e) => {
      e.preventDefault();
      P.type = U.$('#fType').value; P.address = U.$('#fAddr').value; P.description = U.$('#fDesc').value;
      P.fields = U.$$('#fFields .kvrow').map((r) => ({ k: r.children[0].value, v: r.children[1].value })).filter((f) => f.k.trim());
      U.log('panel', 'Actualizó la ficha de la obra');
      U.closeModal();
      U.toast(`${ic('check')}<span>Ficha de la obra guardada</span>`, 'ok');
      U.rerender();
    });
  });
  act('addfield', () => {
    const d = document.createElement('div');
    d.className = 'kvrow';
    d.innerHTML = '<input placeholder="Campo (p. ej. Plazas de garaje)" aria-label="Nuevo campo"><input placeholder="Valor" aria-label="Valor del nuevo campo">';
    U.$('#fFields').appendChild(d);
    d.firstChild.focus();
  });

  /* ═════════ MODELO BIM ═════════ */
  function faseLegend() {
    const groups = [
      ['Estructura', ['encofrado', 'armado', 'hormigonFresco', 'hormigon'], 'estructura'],
      ['Fachadas', ['ladrilloCurso', 'ladrillo'], 'fachadas'],
      ['Tabiquería', ['perfileria', 'primera', 'instalaciones', 'aislamiento', 'cierre', 'encintado', 'pintura'], 'tabiqueria'],
      ['Instalaciones', ['electrico', 'agua'], 'electricidad'],
    ];
    return `<div class="legend in-card fase-legend">${groups.filter((g) => V.layers[g[2]] || (g[2] === 'electricidad' && V.layers.fontaneria)).map(([t, ks]) => `<span class="lg-group"><b>${t}</b>${ks.map((k) => `<span><i class="sw" style="background:${V.FASE[k][0]}${k === 'perfileria' ? ';opacity:.6' : ''}"></i>${V.FASE[k][1]}</span>`).join('')}</span>`).join('')}<span><i class="sw st-none"></i>Pendiente (previsto)</span></div>`;
  }
  U.faseLegend = faseLegend;
  function legendHTML(mode) {
    let items;
    if (mode === 'fase') return faseLegend();
    if (mode === 'estado') items = [['validado', 'Validado'], ['ejecucion', 'En ejecución'], ['revision', 'Pendiente de revisión'], ['no_iniciado', 'No iniciado']].map(([k, l]) => `<span><i class="sw ${U.STATE[k][1]}"></i>${l}</span>`);
    else if (mode === 'plan') items = [['validado', 'Ejecutado'], ['ejecucion', 'En plazo'], ['retrasado', 'Retrasado respecto al plan'], ['no_iniciado', 'Aún no previsto']].map(([k, l]) => `<span><i class="sw ${U.STATE[k][1]}"></i>${l}</span>`);
    else if (mode === 'capitulo') items = [...new Set(A.elements.filter((e) => V.layers[e.layer]).map((e) => A.partidaByCode[e.partida].cap))].sort().map((c) => `<span><i class="sw" style="background:${V.capColor(c)}"></i>${c} ${A.chapters.find((x) => x.code === c).name}</span>`);
    else items = A.subs.map((s) => `<span><i class="sw" style="background:${V.subColor(s.id)}"></i>${s.short}</span>`);
    return `<div class="legend in-card">${items.join('')}</div>`;
  }
  A.views.modelo = {
    render() {
      const span = Math.round((TODAY - A.project.start) / A.DAY);
      const cur = V.date ? Math.round((V.date - A.project.start) / A.DAY) : span;
      const plan = V.view === 'planta';
      return `
      <header class="page-head compact">
        <div><div class="eyebrow">Arquitectura_v3.ifc · Estructura_v5.ifc · Instalaciones esquemáticas · ${A.elements.length} elementos</div><h1>Modelo BIM</h1></div>
        <div class="head-actions">
          <div class="seg" role="group" aria-label="Vista"><button data-action="vview:3d" aria-pressed="${!plan}">${ic('cube')}3D</button><button data-action="vview:planta" aria-pressed="${plan}">${ic('map')}En planta</button></div>
          <label class="fsel inline"><span>Color</span><select data-change="vmode" id="vmode">${[['fase', 'Fase constructiva'], ['estado', 'Estado de validación'], ['plan', 'Plan vs. real'], ['capitulo', 'Capítulo'], ['subcontrata', 'Subcontrata']].map(([k, l]) => `<option value="${k}" ${V.mode === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
      </header>
      <div class="viewer-layout">
        <article class="card viewer-card">
          <div class="viewer-toolbar">
            <div class="layer-chips" role="group" aria-label="Capas">${V.LAYERS.map((l) => `<label class="lchip ${V.layers[l.id] ? 'on' : ''}" title="${l.note || ''}"><input type="checkbox" ${V.layers[l.id] ? 'checked' : ''} data-change="vlayer:${l.id}"><span>${l.name}</span></label>`).join('')}</div>
          </div>
          <div class="viewer-toolbar sub">
            <div class="levels" role="group" aria-label="Planta">
              ${plan ? '' : `<button data-action="vlevel:all" aria-pressed="${V.level === 'all'}">Todo</button>`}
              ${A.levels.filter((l) => !plan || l.id !== 'CIM').map((l) => `<button data-action="vlevel:${l.id}" aria-pressed="${V.level === l.id}">${l.short}</button>`).join('')}
            </div>
            <button class="btn btn-sm btn-ghost" data-action="vreset" title="Restablecer vista">${ic('reset')}Encuadre</button>
          </div>
          <div class="viewer-host ${plan ? 'plan' : ''}" id="viewerHost">${plan ? `<div class="plan-note">${ic('map')}Corte horizontal a 1,5 m · ${A.levels.find((l) => l.id === V.level).name}</div>` : ''}</div>
          ${legendHTML(V.mode)}
          <div class="timeline">
            <button class="btn btn-sm btn-icon" data-action="vplay" aria-label="${S.playing ? 'Pausar' : 'Reproducir la obra'}">${ic(S.playing ? 'pause' : 'play')}</button>
            <input type="range" id="tl" min="0" max="${span}" value="${cur}" aria-label="Fecha del modelo">
            <output id="tlDate">${V.date ? fdate(V.date) : 'Hoy · ' + fdate(TODAY)}</output>
          </div>
        </article>
        <aside class="card inspector" id="inspector">${inspectorHTML()}</aside>
      </div>`;
    },
    mount() {
      mountViewer(false);
      if (S.focusEl) { V.focus(S.focusEl); S.focusEl = null; }
    },
  };
  function srcBadge(kind) {
    return { modelo: '<span class="src s-model" title="Dato procedente del modelo IFC">IFC</span>', obra: '<span class="src s-obra" title="Registrado en obra">Obra</span>', esq: '<span class="src s-esq" title="Representación esquemática: sin geometría en el modelo">Esquema</span>', pres: '<span class="src s-pres" title="Dato del presupuesto">BC3</span>' }[kind];
  }
  S.inspTab = 'resumen';
  function inspectorHTML() {
    const id = V.selected;
    if (!id) {
      const cnt = {};
      A.elements.forEach((e) => { if (V.layers[e.layer] && (V.level === 'all' || e.level === V.level)) { const s = E.displayState(e, V.date); cnt[s] = (cnt[s] || 0) + 1; } });
      return `<div class="card-h"><h2>${V.level === 'all' ? 'Todo el edificio' : A.levels.find((l) => l.id === V.level).name}</h2></div>
        <div class="card-b">
          <p class="muted">Selecciona un elemento para ver su fase, partida, medición, evidencias e incidencias. ${V.view === 'planta' ? 'Pulsa el nombre de una vivienda para abrir su ficha de interiores.' : ''}</p>
          <ul class="kv">${['validado', 'ejecucion', 'revision', 'no_iniciado'].map((s) => `<li><span>${chip(s)}</span><b>${cnt[s] || 0}</b></li>`).join('')}</ul>
          <h3 class="mini">Origen de los datos</h3>
          <ul class="kv small"><li><span>${srcBadge('modelo')} Geometría, materiales y mediciones</span></li><li><span>${srcBadge('obra')} Fases, fechas y validaciones</span></li><li><span>${srcBadge('esq')} Instalaciones y armaduras dibujadas sin geometría del IFC</span></li></ul>
        </div>`;
    }
    const el = A.el[id], p = U.partida(el.partida);
    const ds = E.displayState(el, V.date);
    const frac = E.doneFraction(el, TODAY);
    const caps = A.captures.filter((c) => (c.proposals || []).some((x) => x.el === id));
    const incs = A.incidencias.filter((i) => i.el === id);
    const actv = A.activities.find((a) => a.link && a.link.split('|').some((pre) => id.startsWith(pre)));
    const lvl = A.levels.find((l) => l.id === el.level);
    const f = V.faseOf(el, V.date);
    const t = S.inspTab;
    const edit = U.can('modelo');
    const tabs = [['resumen', 'Resumen'], ['coste', 'Medición y coste'], ['etapas', el.stages ? 'Etapas' : 'Estado'], ['evid', `Evidencias${caps.length + incs.length ? ' · ' + (caps.length + incs.length) : ''}`]];
    let body = '';
    if (t === 'resumen') body = `
      <div class="insp-state">${chip(ds)} ${f ? `<span class="chip"><i style="background:${V.FASE[f.k][0]}"></i>${V.FASE[f.k][1]}${f.partial ? ' (en curso)' : ''}</span>` : ''}</div>
      <dl class="dl">
        <dt>Zona</dt><dd>${el.viv ? 'Vivienda ' + el.viv + ' · ' : ''}${lvl.name} ${srcBadge('modelo')}</dd>
        ${el.room ? `<dt>Separa</dt><dd>${el.room}</dd>` : ''}
        <dt>Tipo IFC</dt><dd class="mono">${el.ifc} ${el.schematic ? srcBadge('esq') : srcBadge('modelo')}</dd>
        <dt>Material</dt><dd>${el.material}</dd>
        ${el.points ? `<dt>Puntos</dt><dd>${el.points}</dd>` : ''}
        <dt>Subcontrata</dt><dd>${U.subName(p.sub)}</dd>
        <dt>Actividad</dt><dd>${actv ? `<button class="linkish" data-action="goto:planificacion:${actv.id}">${actv.name}</button>` : '—'}</dd>
        <dt>Avance</dt><dd><b>${pct(frac, 0)}</b> del importe de la partida ${srcBadge('obra')}</dd>
        ${!el.stages ? `<dt>Plan</dt><dd>${el.plan ? fdate(el.plan.start, false) + ' – ' + fdate(el.plan.end, false) : '—'}</dd><dt>Real</dt><dd>${el.real ? fdate(el.real.start, false) + ' – ' + (el.real.end ? fdate(el.real.end, false) : 'en curso') : '—'}</dd>` : ''}
        <dt>GlobalId</dt><dd class="mono small">${el.gid}</dd>
      </dl>
      ${el.vivKey ? `<button class="btn btn-sm" data-action="goto:interiores:${el.vivKey}">${ic('home')}Abrir vivienda ${el.viv}</button>` : ''}`;
    else if (t === 'coste') body = `<dl class="dl">
        <dt>Partida</dt><dd><span class="mono">${p.code}</span> ${p.desc} ${srcBadge('pres')}</dd>
        <dt>Medición</dt><dd><b>${num(el.qty, 2)} ${p.unit}</b> ${p.model ? srcBadge('modelo') : '<span class="muted small">por unidad de obra</span>'}</dd>
        <dt>Precio</dt><dd>${num(p.price, 2)} €/${p.unit}</dd>
        <dt>Importe</dt><dd>${eur(el.qty * p.price)}</dd>
        <dt>Ejecutado</dt><dd>${eur(el.qty * p.price * frac)} · ${pct(frac, 0)}</dd>
        <dt>Certificado</dt><dd>${pct(U.certPct(p.code), 0)} de la partida</dd>
      </dl><button class="btn btn-sm" data-action="goto:presupuesto">${ic('list')}Ver en el presupuesto</button>`;
    else if (t === 'etapas') body = el.stages ? `<p class="muted small">Etapas de seguimiento (subcapítulos). ${edit ? 'Cambia el estado si lo registras en obra.' : ''}</p>
      <ul class="stage-list edit">${el.stages.map((s, i) => { const def = A.stageSets[el.stageSet][i]; const pend = E.pending[id] && E.pending[id].p.stage === s.key; return `<li><span>${def.name} <em>${def.w ? pct(def.w, 0) : def.ref || ''}</em></span>${pend ? chip('revision') : edit ? stateSelect(`elstage:${id}:${s.key}`, s.state) : chip(s.state)}</li>`; }).join('')}</ul>`
      : `<p class="muted small">Estado del elemento.</p><div class="stage-list edit"><li><span>Estado</span>${edit && !el.schematic ? stateSelect(`elstate:${id}`, el.state) : chip(el.state)}</li></div>${el.schematic ? '<p class="muted small">El estado de las instalaciones sigue a la etapa de instalaciones de los tabiques de la vivienda.</p>' : ''}`;
    else body = `<h3 class="mini">Fotografías y capturas</h3><ul class="evid">
        ${caps.map((c) => `<li><a href="#capturas" data-action="opencap:${c.id}">${ic('camera')}${c.title}</a><span>${fdt(c.at)}</span></li>`).join('') || '<li class="muted">Sin capturas vinculadas</li>'}
        ${el.validatedOn || (el.stages && el.stages.some((s) => s.validatedOn)) ? `<li>${ic('check')}<span>Validado por ${A.project.jefe} · ${fdate(el.validatedOn || el.stages.filter((s) => s.validatedOn).slice(-1)[0].validatedOn, false)}</span></li>` : ''}
      </ul><h3 class="mini">Incidencias</h3><ul class="evid">${incs.map((i) => `<li><button class="linkish" data-action="goto:calidad:${i.id}">${ic('flag')}${i.id} ${i.title}</button>${U.chipOf(A.incEstados, i.estado)}</li>`).join('') || '<li class="muted">Sin incidencias</li>'}</ul>
      ${U.can('calidad') ? `<button class="btn btn-sm" data-action="newinc:${id}">${ic('plus')}Registrar incidencia</button>` : ''}`;
    return `<div class="card-h"><h2>${el.name}</h2><button class="btn btn-sm btn-icon btn-ghost" data-action="vdeselect" aria-label="Cerrar">${ic('x')}</button></div>
      <div class="tabs small" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${t === k}" data-action="insptab:${k}">${l}</button>`).join('')}</div>
      <div class="card-b">${body}</div>`;
  }
  function stateSelect(spec, cur) {
    return `<select class="state-sel s-${cur}" data-change="${spec}" aria-label="Estado">${[['no_iniciado', 'Pendiente'], ['ejecucion', 'En ejecución'], ['validado', 'Terminado']].map(([k, l]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  }
  U.stateSelect = stateSelect;
  // Cambia el estado de una etapa o elemento y deja constancia
  U.setStage = (target, state, label) => {
    const before = target.state;
    if (before === state) return false;
    target.state = state;
    if (state === 'validado') { target.real = target.real || { start: A.addDays(TODAY, -3) }; target.real.end = TODAY; target.validatedOn = TODAY; }
    else if (state === 'ejecucion') { target.real = target.real || { start: TODAY }; target.real.end = null; delete target.validatedOn; }
    else { target.real = null; delete target.validatedOn; }
    return before;
  };
  const SN = { no_iniciado: 'Pendiente', ejecucion: 'En ejecución', validado: 'Terminado' };
  act('elstage', (id, key, val) => {
    if (!U.guard('modelo')) return U.rerender();
    const el = A.el[id], s = el.stages.find((x) => x.key === key);
    const before = U.setStage(s, val);
    if (key === 'instalaciones') A.syncInstalaciones();
    U.log('modelo', `Cambió «${U.stageName(el.stageSet, key)}» de ${el.name}`, SN[before], SN[val]);
    V.refresh();
    U.$('#inspector').innerHTML = inspectorHTML();
    U.toast(`${ic('check')}<span>${el.name}: ${U.stageName(el.stageSet, key).toLowerCase()} → <b>${SN[val]}</b>. El avance y el modelo se han actualizado.</span>`, 'ok');
  });
  act('elstate', (id, _, val) => {
    if (!U.guard('modelo')) return U.rerender();
    const el = A.el[id];
    const before = U.setStage(el, val);
    U.log('modelo', `Cambió el estado de ${el.name}`, SN[before], SN[val]);
    V.refresh();
    U.$('#inspector').innerHTML = inspectorHTML();
  });
  act('insptab', (t) => { S.inspTab = t; U.$('#inspector').innerHTML = inspectorHTML(); });
  function mountViewer(mini) {
    const host = U.$('#viewerHost');
    if (!host || !window.THREE) return;
    if (mini) { V.mode = 'fase'; V.level = 'all'; V.date = null; V.selected = null; V.view = '3d'; }
    V.onSelect = () => { S.inspTab = 'resumen'; const i = U.$('#inspector'); if (i) i.innerHTML = inspectorHTML(); };
    V.onLabels = (lvl) => A.vivs.filter((v) => v.level === lvl).map((v) => {
      const pr = vivProgress(v.key);
      const cur = pr.find((x) => x.state !== 'validado');
      return { x: v.ox + 6, y: V.LEVEL_Y[lvl] + 0.5, z: v.oz + 3.5, action: `goto:interiores:${v.key}`, html: `<b>${v.name}</b><span>${cur ? cur.name : 'Interiores terminados'}</span>` };
    });
    V.mount(host);
    if (!mini) V.setView(V.view);
    const tl = U.$('#tl');
    if (tl) tl.addEventListener('input', () => setTimeline(+tl.value));
  }
  function setTimeline(v) {
    const max = Math.round((TODAY - A.project.start) / A.DAY);
    const d = A.addDays(A.project.start, v);
    V.setDate(v >= max ? null : d);
    const o = U.$('#tlDate');
    if (o) o.textContent = v >= max ? 'Hoy · ' + fdate(TODAY) : fdate(d);
    const i = U.$('#inspector');
    if (i && !V.selected) i.innerHTML = inspectorHTML();
  }
  let playTimer = 0;
  act('vplay', () => {
    const tl = U.$('#tl');
    if (!tl) return;
    S.playing = !S.playing;
    const btn = U.$('[data-action="vplay"]');
    btn.innerHTML = ic(S.playing ? 'pause' : 'play');
    if (!S.playing) { clearInterval(playTimer); return; }
    if (+tl.value >= +tl.max) tl.value = 0;
    playTimer = setInterval(() => {
      if (!tl.isConnected) { clearInterval(playTimer); S.playing = false; return; }
      tl.value = Math.min(+tl.max, +tl.value + 3);
      setTimeline(+tl.value);
      if (+tl.value >= +tl.max) { clearInterval(playTimer); S.playing = false; btn.innerHTML = ic('play'); }
    }, 60);
  });
  act('vmode', (_, __, v) => { V.setMode(v); U.rerender(); });
  act('vview', (v) => { V.setView(v); U.rerender(); });
  act('vlayer', (id, _, on) => { V.setLayer(id, on); U.rerender(); });
  act('vlevel', (l) => { V.setLevel(l); U.rerender(); });
  act('vreset', () => V.resetView());
  act('vdeselect', () => V.select(null));

  /* ═════════ INTERIORES ═════════ */
  const ROOMS = [
    { name: 'Salón-comedor', x: 4.5, z: 0, w: 4.5, d: 4.2, back: 4, left: 1 },
    { name: 'Dormitorio 1', x: 0, z: 0, w: 4.5, d: 4.2, back: 2, left: 1 },
    { name: 'Dormitorio 2', x: 9, z: 0, w: 3, d: 4.2, back: 2, left: 4 },
    { name: 'Cocina', x: 0, z: 4.2, w: 8, d: 2.8, back: 2, left: 3 },
    { name: 'Baño', x: 8, z: 4.2, w: 4, d: 2.8, back: 3, left: 2 },
  ];
  const vivWalls = (key) => A.elements.filter((e) => e.vivKey === key && e.stageSet === 'tabique');
  // Estado de una fase en una vivienda (agregado de sus tabiques o registro propio)
  function phaseState(key, ph) {
    const def = A.vivPhaseDefs.find((p) => p.key === ph);
    if (def.src === 'tabique') {
      const st = vivWalls(key).map((w) => w.stages.find((s) => s.key === ph).state);
      const done = st.filter((x) => x === 'validado').length / st.length;
      return { state: done === 1 ? 'validado' : st.some((x) => x !== 'no_iniciado') ? 'ejecucion' : 'no_iniciado', done, pend: vivWalls(key).some((w) => E.pending[w.id] && E.pending[w.id].p.stage === ph) };
    }
    const s = A.vivPhases[key][ph];
    return { state: s, done: s === 'validado' ? 1 : s === 'ejecucion' ? 0.5 : 0 };
  }
  U.phaseState = phaseState;
  function vivProgress(key) {
    return A.phaseConfig.filter((c) => c.on).map((c) => Object.assign({ key: c.key, name: A.vivPhaseDefs.find((p) => p.key === c.key).name }, phaseState(key, c.key)));
  }
  U.vivProgress = vivProgress;
  const PHASE_DAYS = { perfileria: [-30, -26], primera: [-26, -22], instalaciones: [-22, -17], aislamiento: [-16, -14], cierre: [-12, -5], encintado: [-3, 4], pintura: [6, 14], pavimentos: [18, 23], carpinteria: [32, 36], sanitarios: [140, 144], cocina: [146, 150], remates: [155, 160] };
  const PHASE_SUPPLY = { pavimentos: 'M1', carpinteria: 'M5', sanitarios: 'M10' };
  A.views.interiores = {
    render() {
      const cfg = A.phaseConfig.filter((c) => c.on);
      const L = ['P4', 'P3', 'P2', 'P1', 'PB'];
      return `
      <header class="page-head compact">
        <div><div class="eyebrow">Avance por vivienda y fase · recorridos 360°</div><h1>Interiores</h1></div>
        <div class="head-actions"><button class="btn" data-action="phasecfg">${ic('cog')}Configurar fases</button><button class="btn" data-action="newcap">${ic('camera')}Subir recorrido</button></div>
      </header>
      <article class="card">
        <div class="card-h wrap"><h2>Viviendas por fase</h2><div class="legend"><span><i class="sw st-ok"></i>Terminada</span><span><i class="sw st-progress"></i>En ejecución</span><span><i class="sw st-review"></i>Propuesta IA</span><span><i class="sw st-none"></i>Pendiente</span><span><b class="acc-mark">✓</b> Aceptada</span></div></div>
        <div class="table-wrap"><table class="table matrix">
          <thead><tr><th>Vivienda</th>${cfg.map((c) => `<th><span>${A.vivPhaseDefs.find((p) => p.key === c.key).name}</span></th>`).join('')}<th class="num">Avance</th></tr></thead>
          <tbody>${L.map((lv) => A.vivs.filter((v) => v.level === lv).map((v) => {
            const pr = vivProgress(v.key);
            const tot = pr.reduce((s, x) => s + x.done, 0) / pr.length;
            return `<tr class="${S.viv === v.key ? 'sel' : ''}"><th scope="row"><button class="linkish" data-action="viv:${v.key}">${v.name}</button></th>${pr.map((x) => `<td><button class="mcell ${x.pend ? 'st-review' : U.STATE[x.state][1]}" style="--f:${x.done}" data-action="phaseedit:${v.key}:${x.key}" title="${v.name} · ${x.name}: ${x.pend ? 'propuesta pendiente' : U.STATE[x.state][0]}">${A.phaseMeta[v.key][x.key].aceptado ? '✓' : ''}</button></td>`).join('')}<td class="num">${pct(tot, 0)}</td></tr>`;
          }).join('')).join('')}</tbody>
        </table></div>
      </article>
      <div class="int-detail">${vivDetailHTML(S.viv)}</div>`;
    },
  };
  function vivDetailHTML(key) {
    const v = A.vivs.find((x) => x.key === key);
    const walls = vivWalls(key);
    const room = ROOMS[S.room];
    const wall = (k) => walls.find((w) => w.id.endsWith('-' + k));
    const rkey = key + ':' + S.room + ':' + walls.map((w) => w.stages.map((s) => s.state[0]).join('')).join('');
    U.roomCache = U.roomCache || {};
    if (!U.roomCache[rkey]) U.roomCache[rkey] = A.photo.renderRoom({ back: wall(room.back).id, left: wall(room.left).id }, null, { stamp: '360° R-' + v.level.replace('P', '').replace('B', '0') + v.letter + ' · ' + room.name + ' · 28/09/2026' });
    const pr = vivProgress(key);
    const cur = pr.find((x) => x.state !== 'validado');
    const s = 34, sc = (n) => n * s;
    const fill = (st) => ({ validado: 'var(--st-ok-soft)', ejecucion: 'var(--st-progress-soft)', no_iniciado: 'var(--surface-2)' }[st]);
    const roomState = (r) => {
      const ws = [wall(r.back), wall(r.left)];
      if (ws.every((w) => w.stages.every((x) => x.state === 'validado' || x.key === 'pintura'))) return 'validado';
      if (ws.some((w) => w.stages.some((x) => x.state !== 'no_iniciado'))) return 'ejecucion';
      return 'no_iniciado';
    };
    const showInst = S.planInst;
    return `
    <article class="card">
      <div class="card-h wrap"><div><h2>Vivienda ${v.name}</h2><div class="muted small">${A.levels.find((x) => x.id === v.level).name} · 84 m² útiles · 3 dormitorios · ${(A.compradores.find((c) => c.viv === key) || {}).reservada ? 'Reservada' : 'Disponible'}</div></div>
        <div class="head-actions">${chip(cur ? cur.state : 'validado', 'Fase actual: ' + (cur ? cur.name : 'Terminada'))}<button class="btn btn-sm" data-action="vivmodel:${key}">${ic('cube')}Ver en el modelo</button></div></div>
      <div class="viv-body">
        <div class="plan-wrap">
          <div class="plan-tools"><label class="switch"><input type="checkbox" ${showInst ? 'checked' : ''} data-change="planinst"><span>Mostrar instalaciones</span></label></div>
          <svg class="plan" viewBox="-14 -14 ${12 * s + 28} ${7 * s + 40}" role="img" aria-label="Plano de la vivienda ${v.name}">
            ${ROOMS.map((r, i) => `<g class="room ${S.room === i ? 'sel' : ''}" data-action="room:${i}" tabindex="0" role="button" aria-label="${r.name}">
              <rect x="${sc(r.x)}" y="${sc(7 - r.z - r.d)}" width="${sc(r.w)}" height="${sc(r.d)}" style="fill:${fill(roomState(r))}"/>
              <text x="${sc(r.x + r.w / 2)}" y="${sc(7 - r.z - r.d / 2)}" text-anchor="middle">${r.name}</text>
              <text class="area" x="${sc(r.x + r.w / 2)}" y="${sc(7 - r.z - r.d / 2) + 15}" text-anchor="middle">${num(r.w * r.d * 0.92, 1)} m²</text></g>`).join('')}
            ${walls.map((w) => {
              const t = A.tabLayout.find((x) => w.id.endsWith('-' + x.k));
              const f = V.faseOf(w);
              const x0 = t.x - t.sx / 2, x1 = t.x + t.sx / 2, z0 = t.z - t.sz / 2, z1 = t.z + t.sz / 2;
              const along = t.sx > t.sz;
              return `<line class="wall" style="stroke:${f ? V.FASE[f.k][0] : 'var(--ghost)'}" x1="${sc(along ? x0 : t.x)}" x2="${sc(along ? x1 : t.x)}" y1="${sc(7 - (along ? t.z : z0))}" y2="${sc(7 - (along ? t.z : z1))}"><title>${w.name}: ${f ? V.FASE[f.k][1] : 'pendiente'}</title></line>`;
            }).join('')}
            ${showInst ? instSVG(sc) : ''}
            <rect class="ext" x="0" y="0" width="${sc(12)}" height="${sc(7)}"/>
            ${[1.2, 5.6, 9.8].map((x) => `<line class="win" x1="${sc(x)}" x2="${sc(x + 1.4)}" y1="${sc(7)}" y2="${sc(7)}"/>`).join('')}
            <text class="axis" x="${sc(6)}" y="${sc(7) + 26}" text-anchor="middle">Fachada sur</text>
          </svg>
          <div class="legend in-card tight">${['perfileria', 'primera', 'aislamiento', 'cierre', 'encintado', 'pintura'].map((k) => `<span><i class="sw" style="background:${V.FASE[k][0]}"></i>${V.FASE[k][1]}</span>`).join('')}${showInst ? `<span><i class="sw" style="background:${V.FASE.electrico[0]}"></i>Electricidad</span><span><i class="sw" style="background:${V.FASE.agua[0]}"></i>Agua</span>` : ''}</div>
        </div>
        <figure class="room-shot">
          <img src="${U.roomCache[rkey]}" alt="Captura 360° de ${room.name}">
          <figcaption>${room.name} · recorrido 360° del 28 sep · pulsa una estancia del plano para cambiar</figcaption>
          <details class="guide"><summary>Cómo leer la imagen</summary><ul class="small">
            <li><b>Perfilería:</b> montantes metálicos a la vista.</li><li><b>Primera placa:</b> placas al fondo, por detrás de los montantes.</li>
            <li><b>Instalaciones:</b> tubos naranjas (electricidad), azul y rojo (agua fría y caliente).</li><li><b>Aislamiento:</b> lana mineral amarilla entre montantes.</li>
            <li><b>Cierre:</b> placa delantera con tornillos vistos.</li><li><b>Encintado:</b> juntas y tornillos tapados con pasta blanca.</li><li><b>Pintura:</b> superficie lisa y uniforme.</li></ul></details>
        </figure>
      </div>
    </article>
    <section class="grid g-2">
      <article class="card">
        <div class="card-h"><h2>Fases de la vivienda</h2><span class="muted">Pulsa una fase para registrar avance</span></div>
        <ul class="phase-list">${pr.map((x) => { const m = A.phaseMeta[key][x.key]; return `<li><button class="phase-row" data-action="phaseedit:${key}:${x.key}">
          <span class="ph-dot ${x.pend ? 'st-review' : U.STATE[x.state][1]}"></span>
          <span class="ph-txt"><strong>${x.name}</strong><span class="muted small">${m.resp || 'Sin responsable'}${m.obs ? ' · ' + esc(m.obs) : ''}</span></span>
          <span class="ph-r">${x.pend ? chip('revision') : chip(x.state, x.state === 'validado' ? 'Terminada' : x.state === 'ejecucion' ? 'En ejecución · ' + pct(x.done, 0) : 'Pendiente')}${m.aceptado ? `<span class="chip st-ok"><i></i>Aceptada</span>` : ''}</span></button></li>`; }).join('')}</ul>
      </article>
      <article class="card">
        <div class="card-h"><h2>Hoja de ruta de la vivienda</h2><span class="muted">Se recalcula con cada registro</span></div>
        <ol class="route">${routeFor(key).map((r) => `<li class="r-${r.state}">
          <span class="r-dot"></span>
          <div class="r-body"><strong>${r.name}</strong><span>${r.when} · ${r.who}</span>${r.note ? `<em class="${r.noteWarn ? 'warn-note' : ''}">${r.note}</em>` : ''}
          ${r.alert ? `<div class="r-alert">${ic('truck')}<span>${r.alert}</span>${r.orderId ? `<button class="btn btn-sm" data-action="order:${r.orderId}">Registrar pedido</button>` : ''}</div>` : ''}</div>
          ${chip(r.state === 'done' ? 'validado' : r.state === 'now' ? 'ejecucion' : 'no_iniciado', r.state === 'done' ? 'Hecho' : r.state === 'now' ? 'Ahora' : 'Siguiente')}
        </li>`).join('')}</ol>
      </article>
    </section>`;
  }
  function instSVG(sc) {
    const out = [];
    A.tabLayout.forEach((t) => {
      const along = t.sx > t.sz, len = along ? t.sx : t.sz;
      [0.3, 0.7].forEach((f) => {
        const px = along ? t.x - len / 2 + len * f : t.x + 0.15, pz = along ? t.z + 0.15 : t.z - len / 2 + len * f;
        out.push(`<circle class="pt-ele" cx="${sc(px)}" cy="${sc(7 - pz)}" r="4"><title>Toma de corriente</title></circle>`);
      });
    });
    out.push(`<polyline class="run-ele" points="${[[0.5, 4.35], [11.6, 4.35]].map(([x, z]) => sc(x) + ',' + sc(7 - z)).join(' ')}"/>`);
    out.push(`<polyline class="run-agua" points="${[[7.9, 6.9], [7.9, 6.3], [1.4, 6.3], [1.4, 6.85]].map(([x, z]) => sc(x) + ',' + sc(7 - z)).join(' ')}"/>`);
    out.push(`<polyline class="run-agua" points="${[[7.9, 6.3], [11.5, 6.3], [11.5, 6.75]].map(([x, z]) => sc(x) + ',' + sc(7 - z)).join(' ')}"/>`);
    [[8.55, 6.8], [9.7, 6.9], [11.2, 6.75], [11.5, 6.75], [1.4, 6.85], [2.8, 6.85], [4.0, 6.85]].forEach(([x, z]) => out.push(`<rect class="pt-agua" x="${sc(x) - 4}" y="${sc(7 - z) - 4}" width="8" height="8"><title>Punto de agua</title></rect>`));
    out.push(`<rect class="cgp" x="${sc(0.35)}" y="${sc(7 - 4.45)}" width="12" height="7"><title>Cuadro general</title></rect>`);
    return out.join('');
  }
  function routeFor(key) {
    const v = A.vivs.find((x) => x.key === key);
    const shift = (v.L - 1) * 14;
    let nowSet = false;
    return A.phaseConfig.filter((c) => c.on).map((c) => {
      const def = A.vivPhaseDefs.find((p) => p.key === c.key);
      const ps = phaseState(key, c.key);
      const days = PHASE_DAYS[c.key] || [0, 0];
      const d0 = A.addDays(TODAY, days[0] + shift), d1 = A.addDays(TODAY, days[1] + shift);
      let state = ps.state === 'validado' ? 'done' : ps.state === 'ejecucion' ? 'now' : 'next';
      if (state === 'now') nowSet = true;
      let alert = null, orderId = null;
      const sid = PHASE_SUPPLY[c.key];
      if (sid && state !== 'done') {
        const m = A.supplies.find((x) => x.id === sid);
        const ob = A.addDays(d0, -(m.lead + 1));
        if (m.status === 'sin_pedido') { alert = `Pedir ${m.name.toLowerCase()} antes del ${fdate(ob, false)}: ${m.lead} días de suministro.`; orderId = m.id; }
        else alert = `${m.name}: ${U.chipText(A.supplyStatus, m.status).toLowerCase()}${m.ref ? ' · ' + m.ref : ''}`;
      }
      let note = '', noteWarn = false;
      const meta = A.phaseMeta[key][c.key];
      if (c.key === 'instalaciones') {
        if (S.precierre[key] === false) { note = 'Falta la foto previa al cierre'; noteWarn = true; }
        else if (state === 'done') note = 'Evidencia previa al cierre registrada';
      }
      if (meta.aceptado) note = (note ? note + ' · ' : '') + 'Aceptada por ' + (meta.by || A.project.jefe);
      return { name: def.name, who: meta.resp || 'Sin asignar', when: state === 'done' ? 'Terminado' : fdate(d0, false) + ' – ' + fdate(d1, false), state, alert, orderId, note, noteWarn };
    });
  }
  act('viv', (k) => { S.viv = k; S.room = 0; U.rerender(); });
  act('room', (i) => { S.room = +i; U.$('.int-detail').innerHTML = vivDetailHTML(S.viv); });
  act('planinst', (_, __, on) => { S.planInst = on; U.$('.int-detail').innerHTML = vivDetailHTML(S.viv); });
  act('vivmodel', (key) => {
    const v = A.vivs.find((x) => x.key === key);
    U.go('modelo', () => { V.view = 'planta'; V.level = v.level; V.layers.tabiqueria = true; V.layers.electricidad = true; V.layers.fontaneria = true; V.layers.equipamiento = true; V.mode = 'fase'; V.selected = `TAB-${key}-1`; });
  });
  act('phaseedit', (key, ph) => {
    const v = A.vivs.find((x) => x.key === key);
    const def = A.vivPhaseDefs.find((p) => p.key === ph);
    const ps = phaseState(key, ph);
    const m = A.phaseMeta[key][ph];
    const edit = U.can('interiores');
    const caps = A.captures.filter((c) => c.viv === key);
    U.modal(`<div class="modal-head"><h2>${def.name} · ${v.name}</h2>${chip(ps.state)}</div>
      <form class="form" id="phForm">
        <label for="phState">Estado</label>
        <select id="phState" ${edit ? '' : 'disabled'}>${[['no_iniciado', 'Pendiente'], ['ejecucion', 'En ejecución'], ['validado', 'Terminada']].map(([k, l]) => `<option value="${k}" ${ps.state === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${def.src ? `<p class="muted small">Se aplica a los ${vivWalls(key).length} tabiques de la vivienda y actualiza el modelo 3D y el avance de la partida.</p>` : ''}
        <label class="check"><input type="checkbox" id="phAcc" ${m.aceptado ? 'checked' : ''} ${edit ? '' : 'disabled'}><span>Revisada y aceptada por la dirección de obra o el jefe de obra</span></label>
        <label for="phResp">Responsable</label>
        <select id="phResp" ${edit ? '' : 'disabled'}><option value="">Sin asignar</option>${A.subs.map((s) => `<option ${m.resp === s.short ? 'selected' : ''}>${s.short}</option>`).join('')}<option ${m.resp === 'Personal propio' ? 'selected' : ''}>Personal propio</option></select>
        <div class="row2"><div><label for="phIni">Inicio</label><input type="date" id="phIni" value="${m.ini || ''}" ${edit ? '' : 'disabled'}></div><div><label for="phFin">Fin</label><input type="date" id="phFin" value="${m.fin || ''}" ${edit ? '' : 'disabled'}></div></div>
        <label for="phObs">Observaciones</label><textarea id="phObs" rows="2" ${edit ? '' : 'disabled'}>${esc(m.obs)}</textarea>
        <label>Fotografías</label>
        <div class="ph-photos">${caps.map((c) => `<button type="button" class="ph-cap" data-action="opencap:${c.id}">${ic('camera')}${c.title}</button>`).join('')}${m.photos.filter((p) => p.startsWith('data:')).map((p) => `<img src="${p}" alt="Foto de la fase">`).join('')}</div>
        ${edit ? '<input type="file" id="phPhoto" accept="image/*" aria-label="Añadir foto">' : ''}
        <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button>${edit ? '<button type="submit" class="btn btn-primary">Guardar fase</button>' : ''}</div>
      </form>`);
    if (!edit) return;
    U.$('#phForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const nst = U.$('#phState').value;
      const finish = () => {
        const changes = [];
        if (nst !== ps.state) {
          if (def.src) { vivWalls(key).forEach((w) => U.setStage(w.stages.find((s) => s.key === ph), nst)); if (ph === 'instalaciones') A.syncInstalaciones(); }
          else A.vivPhases[key][ph] = nst;
          changes.push(`estado ${SN[ps.state]} → ${SN[nst]}`);
          U.log('interiores', `${def.name} en ${v.name}`, SN[ps.state], SN[nst]);
        }
        const acc = U.$('#phAcc').checked;
        if (acc !== m.aceptado) { m.aceptado = acc; m.by = U.me(); changes.push(acc ? 'aceptada' : 'aceptación retirada'); U.log('interiores', `${acc ? 'Aceptó' : 'Retiró la aceptación de'} ${def.name.toLowerCase()} en ${v.name}`); }
        m.resp = U.$('#phResp').value; m.ini = U.$('#phIni').value; m.fin = U.$('#phFin').value; m.obs = U.$('#phObs').value;
        E.refreshPending();
        V.refresh();
        U.closeModal();
        U.toast(`${ic('check')}<span>${def.name} de ${v.name} guardada${changes.length ? ': ' + changes.join(', ') : ''}.</span>`, 'ok');
        U.rerender();
      };
      const file = U.$('#phPhoto') && U.$('#phPhoto').files[0];
      if (file) { const r = new FileReader(); r.onload = () => { m.photos.push(r.result); finish(); }; r.readAsDataURL(file); } else finish();
    });
  });
  act('phasecfg', () => {
    if (!U.guard('interiores')) return;
    const rows = () => A.phaseConfig.map((c, i) => `<li><label class="check"><input type="checkbox" ${c.on ? 'checked' : ''} data-change="phon:${i}"><span>${A.vivPhaseDefs.find((p) => p.key === c.key).name}</span></label>
      <span class="ord"><button type="button" class="btn btn-sm btn-icon btn-ghost" data-action="phmove:${i}:-1" aria-label="Subir">${ic('up')}</button><button type="button" class="btn btn-sm btn-icon btn-ghost" data-action="phmove:${i}:1" aria-label="Bajar">${ic('down')}</button></span></li>`).join('');
    U.modal(`<div class="modal-head"><h2>Fases de interiores</h2></div><p class="muted">Ordena y activa las fases según el sistema constructivo de la obra. La configuración se puede reutilizar en otras obras.</p>
      <ul class="phase-cfg" id="phcfg">${rows()}</ul>
      <div class="form-actions"><button class="btn btn-primary" data-action="phcfgsave">Aplicar</button></div>`);
    U.phRows = rows;
  });
  act('phon', (i, _, on) => { A.phaseConfig[+i].on = on; });
  act('phmove', (i, d) => {
    i = +i; const j = i + +d;
    if (j < 0 || j >= A.phaseConfig.length) return;
    const c = A.phaseConfig;
    [c[i], c[j]] = [c[j], c[i]];
    U.$('#phcfg').innerHTML = U.phRows();
  });
  act('phcfgsave', () => { U.closeModal(); U.log('interiores', 'Cambió el orden o las fases activas de interiores'); U.rerender(); });

  /* ═════════ CAPTURAS ═════════ */
  const shots = {};
  const CAP_STATUS = {
    pendiente_analisis: ['Pendiente de análisis', 'st-none'],
    analizando: ['Analizando…', 'st-review'],
    pendiente_revision: ['Pendiente de revisión', 'st-review'],
    validada: ['Validada', 'st-ok'],
  };
  function stampFor(c) {
    const d = new Date(c.at);
    const dd = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const tt = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return (c.kind === 'interior' ? '360° ' : 'CAM ') + c.point.split(' · ')[0] + ' · ' + dd + ' ' + tt;
  }
  function shot(c, viewIdx) {
    if (c.upload) return { photo: c.upload, bim: null, boxes: [] };
    const vi = viewIdx == null ? S.capView : viewIdx;
    const key = c.id + ':' + (c.kind === 'interior' ? vi : '');
    if (!shots[key]) {
      if (c.kind === 'interior') {
        const v = c.views[Math.min(vi, c.views.length - 1)];
        shots[key] = { photo: A.photo.renderRoom(v, c, { stamp: stampFor(c) + ' · ' + v.name, dim: v.dim }), bim: null, boxes: interiorBoxes(c, v) };
      } else {
        c.stampText = stampFor(c);
        shots[key] = A.photo.render(c);
      }
    }
    return shots[key];
  }
  U.capShot = shot;
  function interiorBoxes(c, v) {
    const out = [];
    if (c.proposals.some((p) => p.el === v.back)) out.push({ el: v.back, x: 250, y: 70, w: 640, h: 560 });
    if (c.proposals.some((p) => p.el === v.left)) out.push({ el: v.left, x: 10, y: 20, w: 225, h: 700 });
    return out;
  }
  const thumb = (c) => (c.upload ? c.upload : shot(c, 0).photo);
  A.views.capturas = {
    render() {
      const list = A.captures.filter((c) => S.capFilter === 'todas' || (S.capFilter === 'pendientes' ? c.status !== 'validada' : c.status === 'validada'));
      const c = A.captures.find((x) => x.id === S.capSel) || A.captures[0];
      return `
      <header class="page-head compact">
        <div><div class="eyebrow">Fotos, 360° y cámaras fijas comparadas con el modelo</div><h1>Capturas e IA</h1></div>
        <div class="head-actions">${U.can('capturas') ? `<button class="btn btn-primary" data-action="newcap">${ic('upload')}Nueva captura</button>` : ''}</div>
      </header>
      <div class="cap-layout">
        <aside class="card cap-list">
          <div class="seg small" role="group" aria-label="Filtrar capturas">
            ${[['todas', 'Todas'], ['pendientes', 'Pendientes'], ['validadas', 'Validadas']].map(([k, l]) => `<button data-action="capfilter:${k}" aria-pressed="${S.capFilter === k}">${l}</button>`).join('')}
          </div>
          <ul>${list.map((x) => `<li><button class="cap-item ${x.id === c.id ? 'active' : ''}" data-action="opencap:${x.id}">
              <img src="${thumb(x)}" alt="" loading="lazy">
              <span class="cap-txt"><strong>${x.title}</strong><span>${fdt(x.at)} · ${x.author}</span>
              <span class="chip ${CAP_STATUS[x.status][1]}"><i></i>${CAP_STATUS[x.status][0]}${x.status === 'pendiente_revision' ? ' · ' + x.proposals.filter((p) => !p.resolved).length : ''}</span></span>
            </button></li>`).join('')}</ul>
        </aside>
        <section class="cap-detail" id="capDetail">${capDetailHTML(c)}</section>
      </div>`;
    },
  };
  function capDetailHTML(c) {
    const s = shot(c);
    const analyzed = c.status === 'pendiente_revision' || c.status === 'validada';
    const props = c.proposals || [];
    const showBoxes = S.boxes && analyzed && c.status !== 'validada';
    return `
    <article class="card">
      <div class="card-h wrap">
        <div><h2>${c.title}</h2><div class="muted small">${c.point} · ${c.device} · ${fdt(c.at)} · ${c.author}</div></div>
        <div class="toggles">
          ${s.bim ? `<label class="switch"><input type="checkbox" id="tgOverlay" ${S.overlay ? 'checked' : ''} data-change="capoverlay"><span>Modelo BIM</span></label>` : ''}
          ${analyzed && c.status !== 'validada' ? `<label class="switch"><input type="checkbox" id="tgBoxes" ${S.boxes ? 'checked' : ''} data-change="capboxes"><span>Detecciones</span></label>` : ''}
        </div>
      </div>
      ${c.views && c.views.length > 1 ? `<div class="seg small views">${c.views.map((v, i) => `<button data-action="capview:${i}" aria-pressed="${S.capView === i}">${v.name}</button>`).join('')}</div>` : ''}
      <div class="shot ${c.status === 'analizando' ? 'scanning' : ''}">
        <img class="shot-photo" src="${s.photo}" alt="Captura: ${esc(c.title)}">
        ${s.bim ? `<img class="shot-bim ${S.overlay ? '' : 'off'}" src="${s.bim}" alt="">` : ''}
        ${showBoxes ? `<svg class="shot-boxes" viewBox="0 0 1200 750" preserveAspectRatio="none">${s.boxes.filter(Boolean).map((b) => {
          const p = props.find((x) => x.el === b.el);
          if (!p || p.resolved) return '';
          const cls = { terminado: 'b-review', ejecucion: 'b-progress', no_iniciado: 'b-none', no_observable: 'b-unknown' }[p.prop];
          return `<g class="${cls}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4"/><rect class="tag" x="${b.x}" y="${Math.max(0, b.y - 30)}" width="${Math.max(150, (U.STATE[p.prop][0].length + 6) * 10)}" height="28" rx="3"/><text x="${b.x + 9}" y="${Math.max(0, b.y - 30) + 19}">${U.STATE[p.prop][0]} · ${Math.round(p.conf * 100)}%</text></g>`;
        }).join('')}</svg>` : ''}
        ${c.status === 'pendiente_analisis' ? `<div class="shot-cta">${U.can('capturas') ? `<button class="btn btn-primary btn-lg" data-action="analyze:${c.id}">${ic('spark')}Analizar con IA</button>` : ''}<span>Se compara la imagen con el modelo desde el punto ${c.point.split(' · ')[0]}</span></div>` : ''}
        ${c.status === 'analizando' ? '<div class="scan-status" id="scanStatus">Localizando la imagen en el modelo…</div>' : ''}
      </div>
    </article>
    ${analyzed ? proposalsHTML(c) : c.status === 'analizando' ? '' : '<article class="card"><div class="card-b muted">La IA propondrá un estado para cada elemento visible: <b>no iniciado</b>, <b>en ejecución</b>, <b>aparentemente terminado</b> o <b>no observable</b>. Nada cambia en el avance hasta que una persona lo valida.</div></article>'}`;
  }
  function proposalsHTML(c) {
    if (c.status === 'validada' && !c.proposals) return `<article class="card"><div class="card-b"><p>${ic('check')} ${c.summary}</p><p class="muted small">Validada por ${A.project.jefe}.</p></div></article>`;
    const open = c.proposals.filter((p) => !p.resolved);
    const high = open.filter((p) => p.conf >= 0.85 && p.prop !== 'no_observable');
    return `<article class="card">
      <div class="card-h wrap"><h2>Propuestas de la IA <span class="muted">${c.proposals.length - open.length}/${c.proposals.length} revisadas</span></h2>
        ${high.length && U.can('capturas') ? `<button class="btn btn-sm" data-action="acceptall:${c.id}">${ic('check')}Validar ${high.length} con confianza ≥ 85 %</button>` : ''}</div>
      <ul class="props">${c.proposals.map((p, i) => propHTML(c, p, i)).join('')}</ul>
      ${c.status === 'validada' ? `<div class="card-b done-note">${ic('check')} Captura validada. El avance, la planificación y la certificación ya incluyen estos cambios.</div>` : ''}
    </article>`;
  }
  function propHTML(c, p, i) {
    const el = A.el[p.el], pa = U.partida(el.partida);
    const cur = p.stage ? el.stages.find((s) => s.key === p.stage).state : el.state;
    const curLabel = p.resolved ? p.before : cur;
    const tgt = p.stage ? `${el.name} · ${U.stageName(el.stageSet, p.stage).toLowerCase()}` : el.name;
    const edit = U.can('capturas');
    return `<li class="prop ${p.resolved ? 'resolved' : ''}">
      <div class="prop-main">
        <div class="prop-title">${tgt} <span class="mono muted">${el.id}</span></div>
        <div class="prop-meta">${pa.code} · ${num(el.qty, 2)} ${pa.unit} · ${U.subName(pa.sub)}</div>
        <div class="prop-state">${chip(curLabel)} ${ic('arrow', 'arr')} ${chip(p.result || p.prop)}</div>
        <p class="prop-note">${p.note}</p>
      </div>
      <div class="prop-side">
        <div class="conf" title="Confianza del modelo"><div class="conf-bar ${p.conf < 0.6 ? 'low' : ''}"><i style="width:${p.conf * 100}%"></i></div><span>${Math.round(p.conf * 100)} %</span></div>
        ${p.resolved ? `<div class="resolved-by">${ic('check')}${p.resolvedText}</div>` : !edit ? '' : p.prop === 'no_observable' ? `<div class="prop-actions"><button class="btn btn-sm" data-action="recapture:${c.id}:${i}">Pedir nueva captura</button></div>` : `<div class="prop-actions">
          <button class="btn btn-sm btn-primary" data-action="accept:${c.id}:${i}">${ic('check')}Validar</button>
          <select class="btn btn-sm" aria-label="Corregir estado" data-change="correct:${c.id}:${i}">
            <option value="">Corregir…</option>
            ${['terminado', 'ejecucion', 'no_iniciado'].filter((s) => s !== p.prop).map((s) => `<option value="${s}">${U.STATE[s][0]}</option>`).join('')}
          </select></div>`}
      </div>
    </li>`;
  }
  function renderCapDetail() {
    const d = U.$('#capDetail');
    const c = A.captures.find((x) => x.id === S.capSel);
    if (d && c) d.innerHTML = capDetailHTML(c);
  }
  function refreshCapList() {
    if (S.view !== 'capturas') return;
    const list = U.$('.cap-list ul');
    if (!list) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = A.views.capturas.render();
    list.innerHTML = U.$('.cap-list ul', tmp).innerHTML;
    U.renderNav();
    U.renderTop();
  }
  act('analyze', (id) => {
    if (!U.guard('capturas')) return;
    const c = A.captures.find((x) => x.id === id);
    c.status = 'analizando';
    renderCapDetail();
    const steps = ['Localizando la imagen en el modelo…', `Identificando elementos visibles (${c.kind === 'interior' ? 12 : 37})…`, 'Comparando con el estado previsto a ' + fdate(new Date(c.at), false) + '…', 'Generando propuestas con evidencia…'];
    let i = 0;
    const tick = setInterval(() => {
      i++;
      const st = U.$('#scanStatus');
      if (i < steps.length) { if (st) st.textContent = steps[i]; return; }
      clearInterval(tick);
      c.status = 'pendiente_revision';
      E.refreshPending();
      V.refresh();
      renderCapDetail();
      refreshCapList();
      U.toast(`${ic('spark')}<span><b>${c.proposals.length} propuestas</b> listas para revisar en «${c.title}»</span>`);
    }, 750);
  });
  function applyProposal(c, p, result) {
    const el = A.el[p.el];
    const before = U.stats();
    const chBefore = E.chapterStats();
    const target = p.stage ? el.stages.find((s) => s.key === p.stage) : el;
    p.before = target.state;
    const map = { terminado: 'validado', ejecucion: 'ejecucion', no_iniciado: 'no_iniciado' };
    U.setStage(target, map[result]);
    if (result === 'ejecucion' && target.real && !target.real.start) target.real.start = new Date(c.at);
    if (p.stage === 'instalaciones') A.syncInstalaciones();
    p.resolved = true;
    p.result = map[result];
    p.resolvedText = `${result === p.prop ? 'Validado' : 'Corregido'} por ${U.me()} · ahora`;
    if (c.viv && S.precierre[c.viv] === false && p.stage === 'instalaciones') S.precierre[c.viv] = true;
    U.log('capturas', `${result === p.prop ? 'Validó' : 'Corrigió'} la propuesta de IA para ${el.name}${p.stage ? ' (' + U.stageName(el.stageSet, p.stage).toLowerCase() + ')' : ''}`, U.STATE[p.before][0], U.STATE[map[result]][0]);
    if (c.proposals.every((x) => x.resolved)) c.status = 'validada';
    E.refreshPending();
    const after = U.stats();
    const chAfter = E.chapterStats();
    const ch = chAfter.find((x, i) => Math.abs(x.avance - chBefore[i].avance) > 1e-6);
    return { delta: after.ej - before.ej, ch, chBefore: ch ? chBefore.find((x) => x.code === ch.code) : null };
  }
  function reportDelta(results) {
    const delta = results.reduce((s, r) => s + r.delta, 0);
    const r = results.find((x) => x.ch);
    if (r) U.toast(`${ic('check')}<span>Avance actualizado · <b>${r.ch.name}</b> ${pct(r.chBefore.avance)} → ${pct(r.ch.avance)} · ${delta >= 0 ? '+' : ''}${eur(delta)} ejecutado</span>`, 'ok');
    else U.toast(`${ic('check')}<span>Estado registrado con su evidencia. Sin cambio en el importe ejecutado.</span>`, 'ok');
    A.project.updated.avance = U.now();
    V.refresh();
    renderCapDetail();
    refreshCapList();
  }
  act('accept', (id, i) => { if (!U.guard('capturas')) return; const c = A.captures.find((x) => x.id === id); reportDelta([applyProposal(c, c.proposals[+i], c.proposals[+i].prop)]); });
  act('acceptall', (id) => {
    if (!U.guard('capturas')) return;
    const c = A.captures.find((x) => x.id === id);
    reportDelta(c.proposals.filter((p) => !p.resolved && p.conf >= 0.85 && p.prop !== 'no_observable').map((p) => applyProposal(c, p, p.prop)));
  });
  act('correct', (id, i, val) => { if (!val || !U.guard('capturas')) return; const c = A.captures.find((x) => x.id === id); reportDelta([applyProposal(c, c.proposals[+i], val)]); });
  act('recapture', (id, i) => {
    const c = A.captures.find((x) => x.id === id), p = c.proposals[+i];
    const el = A.el[p.el];
    p.resolved = true; p.result = 'no_observable'; p.before = p.stage ? el.stages.find((s) => s.key === p.stage).state : el.state;
    p.resolvedText = 'Nueva captura solicitada a ' + A.project.jefe;
    A.tareas.unshift({ id: 'T-' + (110 + A.tareas.length), t: 'Repetir la captura de ' + el.name, resp: A.project.jefe, due: A.iso(A.addDays(TODAY, 2)), estado: 'pendiente', from: null, link: { t: 'cap', id: c.id, label: c.id } });
    if (c.proposals.every((x) => x.resolved)) c.status = 'validada';
    E.refreshPending();
    U.log('capturas', `Pidió repetir la captura de ${el.name}`);
    U.toast(`${ic('cal')}<span>Tarea creada: <b>repetir la captura</b> de ${el.name}. El estado no cambia.</span>`);
    renderCapDetail(); refreshCapList();
  });
  act('opencap', (id, _, __, t, e) => {
    S.capSel = id; S.capView = 0;
    U.closeModal();
    if (S.view !== 'capturas') { if (e) e.preventDefault(); location.hash = 'capturas'; return; }
    renderCapDetail();
    U.$$('.cap-item').forEach((b) => b.classList.toggle('active', b.dataset.action === 'opencap:' + id));
    if (window.innerWidth < 900) U.$('#capDetail').scrollIntoView({ behavior: 'smooth' });
  });
  act('capfilter', (k) => { S.capFilter = k; U.rerender(); });
  act('capview', (i) => { S.capView = +i; renderCapDetail(); });
  act('capoverlay', (_, __, on) => { S.overlay = on; const b = U.$('.shot-bim'); if (b) b.classList.toggle('off', !on); });
  act('capboxes', (_, __, on) => { S.boxes = on; renderCapDetail(); });

  const UPLOAD_TEMPLATES = {
    P1C: { title: 'Vivienda 1ºC · instalaciones antes del cierre', zone: 'Vivienda 1ºC', level: 'P1', viv: 'P1C', point: 'R-1C · captura libre', proposals: [
      { el: 'TAB-P1C-1', stage: 'instalaciones', prop: 'terminado', conf: 0.9, note: 'Tubos corrugados y cajas de mecanismos visibles antes del cierre. Queda como evidencia previa al cierre.' },
      { el: 'TAB-P1C-2', stage: 'aislamiento', prop: 'ejecucion', conf: 0.84, note: 'Lana mineral colocada en parte del paño del distribuidor.' },
    ] },
    P1D: { title: 'Vivienda 1ºD · instalaciones antes del cierre', zone: 'Vivienda 1ºD', level: 'P1', viv: 'P1D', point: 'R-1D · captura libre', proposals: [
      { el: 'TAB-P1D-1', stage: 'instalaciones', prop: 'terminado', conf: 0.88, note: 'Instalación eléctrica y fontanería visibles en toda la altura. Queda como evidencia previa al cierre.' },
      { el: 'TAB-P1D-4', stage: 'instalaciones', prop: 'terminado', conf: 0.86, note: 'Cajas de mecanismos y bajantes visibles.' },
    ] },
    FACN: { title: 'Fachada norte · planta 1ª', zone: 'Fachadas · P1', level: 'P1', point: 'F-03 · patio norte', proposals: [
      { el: 'FAC-P1-N4', prop: 'terminado', conf: 0.86, note: 'Hoja de ladrillo completa y remate bajo forjado.' },
    ] },
    CUB: { title: 'Cubierta · foto desde planta 4ª', zone: 'Cubierta', level: 'CUB', point: 'C-05 · forjado P4', proposals: [
      { el: 'FOR-CUB-3', stage: 'armado', prop: 'ejecucion', conf: 0.83, note: 'Armadura inferior colocada; falta la superior.' },
    ] },
  };
  act('newcap', () => {
    if (!U.guard('capturas')) return;
    U.modal(`<h2>Nueva captura</h2>
      <p class="muted">Sube una foto, una imagen 360° o un fotograma de vídeo. Elige la zona para que la IA sepa con qué parte del modelo compararla.</p>
      <form id="capForm" class="form">
        <label for="capZone">Zona</label>
        <select id="capZone">
          <option value="P1C">Vivienda 1ºC · antes de cerrar placa</option>
          <option value="P1D">Vivienda 1ºD · antes de cerrar placa</option>
          <option value="FACN">Fachada norte · planta 1ª</option>
          <option value="CUB">Cubierta</option>
        </select>
        <label for="capType">Tipo</label>
        <select id="capType"><option>Foto</option><option>Imagen 360°</option><option>Vídeo</option></select>
        <label for="capFile">Imagen</label>
        <input id="capFile" type="file" accept="image/*">
        <p class="muted small">Prototipo: el análisis de las imágenes subidas usa resultados de ejemplo para la zona elegida.</p>
        <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button type="submit" class="btn btn-primary">${ic('upload')}Subir captura</button></div>
      </form>`);
    U.$('#capForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const zone = U.$('#capZone').value, f = U.$('#capFile').files[0];
      const t = UPLOAD_TEMPLATES[zone];
      const done = (src) => {
        S.uploads++;
        const c = Object.assign({}, t, { id: 'CAP-0' + (31 + S.uploads), at: new Date('2026-10-01T10:' + String(10 + S.uploads).padStart(2, '0')).toISOString(), author: U.me(), device: U.$('#capType').value + ' · subida manual', kind: 'upload', status: 'pendiente_analisis', upload: src, proposals: t.proposals.map((p) => Object.assign({}, p)) });
        A.captures.unshift(c);
        S.capSel = c.id;
        U.log('capturas', `Subió la captura «${c.title}»`);
        U.closeModal();
        U.go('capturas');
        U.toast(`${ic('upload')}<span>Captura subida. Pulsa <b>Analizar con IA</b> para compararla con el modelo.</span>`);
      };
      if (f) { const r = new FileReader(); r.onload = () => done(r.result); r.readAsDataURL(f); }
      else if (t.viv) done(A.photo.renderRoom({ back: `TAB-${t.viv}-2`, left: `TAB-${t.viv}-1` }, null, { stamp: 'FOTO · ' + t.point.split(' · ')[0] + ' · 01/10/2026' }));
      else done(A.photo.render({ cam: zone === 'CUB' ? 'grua' : 'gruaBaja', at: '2026-10-01T10:00', stampText: 'FOTO · ' + t.point.split(' · ')[0] + ' · 01/10/2026', proposals: t.proposals, noOverlay: true }).photo);
    });
  });
})(window.ATL);
