/* Atalaya · presupuesto, certificaciones, control económico, subcontratas y cambios. */
(function (A) {
  'use strict';
  const U = A.ui, S = U.S, E = A.engine, D = A.D, TODAY = A.TODAY;
  const { ic, chip, num, eur, keur, pct, fdate, fdt, esc } = U;
  const act = U.act;
  const P = A.project;
  const K = 1 + P.ggbi;
  const r2 = (v) => Math.round(v * 100) / 100;

  /* ═════════ Periodos de certificación ═════════ */
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const qtyAt = (d, filter) => {
    const q = {};
    A.partidas.filter(filter || (() => true)).forEach((p) => { q[p.code] = r2(p.qty * E.partidaAvance(p, d)); });
    return q;
  };
  function buildPeriods(kind, filter) {
    const out = [];
    if (kind === 'mes') {
      for (let m = 1; m <= 8; m++) {
        const end = new Date(2026, m + 1, 0, 12);
        out.push({ id: '2026-' + String(m + 1).padStart(2, '0'), n: m, label: `n.º ${m} · ${MONTHS[m]}`, start: new Date(2026, m, 1, 12), end, status: m <= 7 ? 'cerrada' : 'revision', qty: m <= 7 ? qtyAt(end, filter) : qtyAt(TODAY, filter), corrections: [], log: [] });
      }
    } else {
      let n = 0;
      for (let m = 6; m <= 8; m++) {
        [15, 0].forEach((day) => {
          n++;
          const end = day ? new Date(2026, m, 15, 12) : new Date(2026, m + 1, 0, 12);
          const last = m === 8 && !day;
          out.push({ id: `Q${n}`, n, label: `${day ? '1ª' : '2ª'} quincena de ${MONTHS[m]}`, start: day ? new Date(2026, m, 1, 12) : new Date(2026, m, 16, 12), end, status: last ? 'revision' : 'cerrada', qty: last ? qtyAt(TODAY, filter) : qtyAt(end, filter), corrections: [], log: [] });
        });
      }
    }
    return out;
  }
  const PER = { cliente: { mes: buildPeriods('mes'), quincena: buildPeriods('quincena') } };
  A.subs.forEach((s) => { PER[s.id] = { mes: buildPeriods('mes', (p) => p.sub === s.id), quincena: buildPeriods('quincena', (p) => p.sub === s.id) }; PER[s.id].mes.forEach((p) => { if (p.status === 'revision') p.status = 'borrador'; }); });
  A.certPER = PER;
  U.certPeriods = (side = 'cliente', mode = 'mes') => PER[side][mode];
  U.lastClosed = (side = 'cliente') => PER[side].mes.filter((p) => p.status === 'cerrada').slice(-1)[0];
  const priceOf = (p, side) => (side === 'cliente' ? p.price : p.price * U.sub(side).factor);
  const partsOf = (side) => (side === 'cliente' ? A.partidas : A.partidas.filter((p) => p.sub === side));
  const corrQty = (per, code) => per.corrections.filter((c) => c.code === code).reduce((s, c) => s + c.dq, 0);
  const origenQty = (per, code) => (per.qty[code] || 0) + corrQty(per, code);
  U.certOrigen = (per, side = 'cliente') => partsOf(side).reduce((s, p) => s + origenQty(per, p.code) * priceOf(p, side), 0);
  U.certPct = (code) => { const p = A.partidaByCode[code]; return p.qty ? origenQty(U.lastClosed(), code) / p.qty : 0; };
  const CST = { borrador: ['Borrador', 'st-none'], revision: ['En revisión', 'st-review'], aprobada: ['Aprobada', 'st-progress'], cerrada: ['Cerrada', 'st-ok'] };

  /* ═════════ Cálculos económicos ═════════ */
  const COST_RATIO = 0.97;
  const INDIRECT = 0.09; // personal de obra, casetas, grúa y medios auxiliares, sobre PEM
  U.capCost = (code) => {
    const parts = A.partidas.filter((p) => p.cap === code);
    return parts.reduce((s, p) => s + E.importe(p) * (p.sub ? U.sub(p.sub).factor : COST_RATIO), 0);
  };
  U.eco = function () {
    const pem = E.pem();
    const modsV = A.cambios.filter((c) => c.com === 'aprobado').reduce((s, c) => s + c.venta, 0);
    const modsC = A.cambios.filter((c) => c.com === 'aprobado').reduce((s, c) => s + c.coste, 0);
    const ventaIni = pem * K, venta = (pem + modsV) * K;
    const indirectos = pem * INDIRECT;
    const costeIni = A.chapters.reduce((s, c) => s + U.capCost(c.code), 0) + indirectos;
    const desvC = A.desviaciones.filter((d) => ['precios', 'productividad', 'otras', 'retrasos'].includes(d.causa)).reduce((s, d) => s + d.coste, 0);
    const costeFinal = costeIni + modsC + desvC;
    const subContr = A.subs.reduce((s, x) => s + E.subStats(x).contrato, 0) + A.subs.reduce((s, x) => s + (x.mods || []).filter((m) => m.st === 'aprobado').reduce((t, m) => t + m.imp, 0), 0);
    const pedidos = A.supplies.filter((m) => m.status !== 'cancelado' && m.status !== 'sin_pedido').reduce((s, m) => s + m.importe, 0);
    const rec = A.facturas.filter((f) => f.dir === 'recibida');
    const emi = A.facturas.filter((f) => f.dir === 'emitida');
    const costeReal = rec.reduce((s, f) => s + f.base, 0) + E.ejecutado() * 0.0;
    const cobrado = emi.reduce((s, f) => s + f.cobrado, 0);
    const pagado = rec.reduce((s, f) => s + f.pagado, 0);
    const certificado = U.certOrigen(U.lastClosed()) * K;
    return {
      pem, venta, ventaIni, costeIni, indirectos, costeFinal, modsV, modsC, desvC, comprometido: subContr + pedidos, subContr, pedidos, costeReal,
      certificado, cobrado, pagado, cobroPend: emi.reduce((s, f) => s + f.base * (1 + f.iva), 0) - cobrado, pagosPend: rec.reduce((s, f) => s + f.base * (1 + f.iva), 0) - pagado,
      margenIni: 1 - costeIni / ventaIni, margen: 1 - costeFinal / venta, retCliente: certificado * P.retencion,
      retSubs: A.subs.reduce((s, x) => s + E.subStats(x).cert * P.retencion, 0),
      ivaRep: emi.reduce((s, f) => s + f.base * f.iva, 0), ivaSop: rec.reduce((s, f) => s + f.base * f.iva, 0),
    };
  };

  /* ═════════ PRESUPUESTO ═════════ */
  S.presVer = 'vigente';
  S.presOpen = { '03': true };
  A.presHist = [
    { at: '2026-01-20T10:00', who: 'Andrea Soler', what: 'Presupuesto de contrato importado desde Presupuesto_contrato.bc3 (12 capítulos, 23 partidas)', imp: null },
    { at: '2026-07-14T12:30', who: 'Andrea Soler', what: 'Modificación aprobada CAM-01 · porcelánico en baños', imp: 6240 },
    { at: '2026-09-02T09:15', who: 'Andrea Soler', what: 'Modificación aprobada CAM-02 · peto de cubierta', imp: 1487 },
    { at: '2026-09-30T17:00', who: 'Andrea Soler', what: 'Añadido el capítulo 13 Equipamiento desde la oferta de cocinas y sanitarios', imp: null },
  ];
  const modsOf = (code) => A.cambios.filter((c) => c.com === 'aprobado' && c.partidas[0] === code).reduce((s, c) => s + c.venta, 0);
  const prevOf = (code) => A.cambios.filter((c) => ['presentado', 'valorar'].includes(c.com) && c.partidas[0] === code).reduce((s, c) => s + c.venta, 0);
  A.views.presupuesto = {
    render() {
      const tot = { ini: 0, mod: 0, vig: 0, fin: 0 };
      A.partidas.forEach((p) => { const i = E.importe(p), m = modsOf(p.code), f = prevOf(p.code); tot.ini += i; tot.mod += m; tot.vig += i + m; tot.fin += i + m + f; });
      return `
      <header class="page-head compact">
        <div><div class="eyebrow">Capítulos, partidas y etapas · vinculados con planificación, subcontratas, modelo y documentos</div><h1>Presupuesto</h1></div>
        <div class="head-actions">
          <button class="btn" data-action="presimport">${ic('upload')}Importar Excel o BC3</button>
          <button class="btn" data-action="presxlsx">${ic('download')}Exportar a Excel</button>
        </div>
      </header>
      <section class="kpis">
        <div class="kpi"><div class="kpi-label">Presupuesto inicial (PEM)</div><div class="kpi-value">${keur(tot.ini)}</div><div class="kpi-foot">Contrato del 15 ene 2026</div></div>
        <div class="kpi"><div class="kpi-label">Modificaciones aprobadas</div><div class="kpi-value">${keur(tot.mod)}</div><div class="kpi-foot">${A.cambios.filter((c) => c.com === 'aprobado').length} cambios aprobados</div></div>
        <div class="kpi"><div class="kpi-label">Presupuesto vigente</div><div class="kpi-value">${keur(tot.vig)}</div><div class="kpi-foot">PEC ${keur(tot.vig * K)} con 13 % GG y 6 % BI</div></div>
        <div class="kpi"><div class="kpi-label">Previsión final</div><div class="kpi-value">${keur(tot.fin)}</div><div class="kpi-foot">Incluye cambios presentados o por valorar</div></div>
      </section>
      <article class="card">
        <div class="card-h wrap"><h2>Capítulos y partidas</h2><div class="head-actions"><button class="btn btn-sm btn-ghost" data-action="presall:1">Desplegar todo</button><button class="btn btn-sm btn-ghost" data-action="presall:0">Plegar todo</button></div></div>
        <div class="table-wrap"><table class="table pres">
          <thead><tr><th>Código</th><th>Descripción</th><th>Ud</th><th class="num">Medición</th><th class="num">Precio</th><th class="num">Inicial</th><th class="num">Modif.</th><th class="num">Vigente</th><th class="num">Previsión</th><th>Vínculos</th></tr></thead>
          <tbody>${A.chapters.map((c) => chapterRows(c)).join('')}</tbody>
          <tfoot><tr class="total"><td colspan="5">Total ejecución material</td><td class="num">${eur(tot.ini)}</td><td class="num">${eur(tot.mod)}</td><td class="num">${eur(tot.vig)}</td><td class="num">${eur(tot.fin)}</td><td></td></tr></tfoot>
        </table></div>
      </article>
      ${S.presHi ? partidaLinks(A.partidaByCode[S.presHi]) : ''}
      <article class="card">
        <div class="card-h"><h2>Historial del presupuesto</h2></div>
        <ul class="feed">${A.presHist.slice().reverse().map((h) => `<li><time>${fdt(h.at)}</time><div><strong>${h.who}</strong> ${h.what}${h.imp ? ` · <b>${h.imp > 0 ? '+' : ''}${eur(h.imp)}</b>` : ''}</div></li>`).join('')}</ul>
      </article>`;
    },
  };
  function chapterRows(c) {
    const ps = A.partidas.filter((p) => p.cap === c.code);
    const open = S.presOpen[c.code];
    const sum = (f) => ps.reduce((s, p) => s + f(p), 0);
    const ini = sum((p) => E.importe(p)), mod = sum((p) => modsOf(p.code)), fin = sum((p) => prevOf(p.code));
    return `<tr class="cap-tr" data-action="presopen:${c.code}"><td><span class="chev-wrap">${ic('chevron', open ? 'chev open' : 'chev')}</span><b class="mono">${c.code}</b></td><td colspan="4"><b>${c.name}</b></td><td class="num"><b>${eur(ini)}</b></td><td class="num">${mod ? eur(mod) : '—'}</td><td class="num"><b>${eur(ini + mod)}</b></td><td class="num">${eur(ini + mod + fin)}</td><td></td></tr>
    ${open ? ps.map((p) => {
      const m = modsOf(p.code), f = prevOf(p.code);
      const els = A.elements.filter((e) => e.partida === p.code).length;
      const peds = A.supplies.filter((s) => s.act && (A.activities.find((a) => a.id === s.act) || {}).cap === p.cap).length;
      const st = A.elements.find((e) => e.partida === p.code && e.stageSet);
      return `<tr class="${S.presHi === p.code ? 'sel' : ''} clk" data-action="preshi:${p.code}"><td class="mono">${p.code}</td><td>${p.desc}${p.model ? ' <span class="tag-model">modelo</span>' : ''}</td><td>${p.unit}</td><td class="num">${num(p.qty, 2)}</td><td class="num">${num(p.price, 2)}</td><td class="num">${eur(E.importe(p))}</td><td class="num">${m ? '+' + eur(m) : '—'}</td><td class="num">${eur(E.importe(p) + m)}</td><td class="num">${eur(E.importe(p) + m + f)}</td>
        <td class="links-cell">${p.sub ? `<span class="tag">${U.subName(p.sub)}</span>` : ''}${els ? `<span class="tag">${els} elem. BIM</span>` : ''}${peds ? `<span class="tag">${peds} pedidos</span>` : ''}</td></tr>
        ${st ? A.stageSets[st.stageSet].map((sd) => `<tr class="stage-tr"><td></td><td colspan="4"><span class="muted">↳ Etapa: ${sd.name}</span></td><td class="num muted">${sd.w ? eur(E.importe(p) * sd.w) : '—'}</td><td></td><td class="num muted">${sd.w ? pct(sd.w, 0) : sd.ref}</td><td></td><td></td></tr>`).join('') : ''}`;
    }).join('') : ''}`;
  }
  function partidaLinks(p) {
    const els = A.elements.filter((e) => e.partida === p.code);
    const acts = A.activities.filter((a) => a.cap === p.cap);
    const docs = A.files.filter((f) => f.links.some((l) => l.t === 'cambios') && A.cambios.some((c) => c.partidas.includes(p.code) && f.id === 'DOC-' + c.id));
    const cams = A.cambios.filter((c) => c.partidas.includes(p.code));
    const peds = A.supplies.filter((s) => acts.some((a) => a.id === s.act));
    return `<article class="card"><div class="card-h wrap"><div><h2><span class="mono">${p.code}</span> ${p.desc}</h2><div class="muted small">Todo lo que está conectado con esta partida</div></div><button class="btn btn-sm btn-icon btn-ghost" data-action="preshi:" aria-label="Cerrar">${ic('x')}</button></div>
      <div class="links-grid">
        <div><h3 class="mini">Presupuesto</h3><p>${num(p.qty, 2)} ${p.unit} × ${num(p.price, 2)} € = <b>${eur(E.importe(p))}</b></p></div>
        <div><h3 class="mini">Avance</h3><p>Ejecutado validado <b>${pct(E.partidaAvance(p), 0)}</b> · certificado ${pct(U.certPct(p.code), 0)}</p><button class="btn btn-sm" data-action="certcap:${p.cap}">${ic('sheet')}Certificar</button></div>
        <div><h3 class="mini">Planificación</h3>${acts.map((a) => `<button class="linkish" data-action="goto:planificacion:${a.id}">${a.name}</button>`).join('<br>') || '—'}</div>
        <div><h3 class="mini">Subcontrata</h3>${p.sub ? `<button class="linkish" data-action="goto:subcontratas:${p.sub}">${U.sub(p.sub).name}</button>` : 'Sin adjudicar'}</div>
        <div><h3 class="mini">Modelo BIM</h3>${els.length ? `${els.length} elementos · <button class="linkish" data-action="presbim:${p.code}">ver en el modelo</button>` : 'Sin elementos en el modelo: avance por parte de obra'}</div>
        <div><h3 class="mini">Pedidos</h3>${peds.map((m) => `<button class="linkish" data-action="goto:suministros:${m.id}">${m.name}</button>`).join('<br>') || '—'}</div>
        <div><h3 class="mini">Cambios</h3>${cams.map((c) => `<button class="linkish" data-action="goto:cambios:${c.id}">${c.id} ${c.title}</button>`).join('<br>') || '—'}</div>
        <div><h3 class="mini">Documentos</h3>${docs.map((f) => `<button class="linkish" data-action="goto:documentacion:${f.folder}">${f.name}</button>`).join('<br>') || '—'}</div>
      </div></article>`;
  }
  act('presopen', (c) => { S.presOpen[c] = !S.presOpen[c]; U.rerender(); });
  act('presall', (v) => { S.presOpen = {}; if (v === '1') A.chapters.forEach((c) => (S.presOpen[c.code] = true)); U.rerender(); });
  act('preshi', (code) => { S.presHi = code || null; U.rerender(); });
  act('presbim', (code) => U.go('modelo', () => { const p = A.partidaByCode[code]; A.viewer.mode = 'capitulo'; A.viewer.selected = A.elements.find((e) => e.partida === code).id; S.focusEl = A.viewer.selected; const lay = A.elements.find((e) => e.partida === code).layer; A.viewer.layers[lay] = true; }));
  act('presxlsx', () => {
    const rows = [['Código', 'Descripción', 'Unidad', 'Medición', 'Precio', 'Importe inicial', 'Modificaciones', 'Vigente']];
    A.chapters.forEach((c) => {
      rows.push([c.code, c.name]);
      A.partidas.filter((p) => p.cap === c.code).forEach((p) => rows.push([p.code, p.desc, p.unit, p.qty, p.price, r2(E.importe(p)), modsOf(p.code), r2(E.importe(p) + modsOf(p.code))]));
    });
    U.exportXlsx('Presupuesto_Mirador_del_Turia.xlsx', [{ name: 'Presupuesto', rows, widths: [8, 60, 6, 10, 10, 14, 14, 14] }]).catch(() => U.toast(`${ic('alert')}<span>No se pudo generar el Excel.</span>`, 'warn'));
  });
  // Importación: lee BC3 (FIEBDC-3) o Excel/CSV y muestra lo que entiende
  function parseBC3(text) {
    const out = [];
    text.split('~').forEach((rec) => {
      if (rec[0] !== 'C') return;
      const f = rec.slice(2).split('|');
      const code = (f[0] || '').replace(/#+$/, '');
      if (!code) return;
      out.push({ code, unit: f[1] || '', desc: (f[2] || '').trim(), price: parseFloat((f[3] || '0').split('\\')[0]) || 0, chapter: /#$/.test(f[0] || '') });
    });
    return out;
  }
  function sampleBC3() {
    let t = '~V|Atalaya|FIEBDC-3/2020|Presupuesto_contrato|\r\n~K|\\2\\2\\3\\2\\2\\2\\2\\EUR\\|\r\n';
    A.chapters.forEach((c) => { t += `~C|${c.code}#||${c.name}|${r2(A.partidas.filter((p) => p.cap === c.code).reduce((s, p) => s + E.importe(p), 0))}|200126|0|\r\n`; });
    A.partidas.forEach((p) => { t += `~C|${p.code}|${p.unit}|${p.desc}|${p.price}|200126|0|\r\n~M|${p.cap}#\\${p.code}|1|${p.qty}|\r\n`; });
    return t;
  }
  act('presimport', () => {
    U.modal(`<div class="modal-head"><h2>Importar presupuesto</h2></div>
      <p class="muted">Admite BC3 (FIEBDC-3, exportado desde Presto, Arquímedes o TCQ), Excel y CSV. Se crea una versión nueva sin perder la anterior.</p>
      <div class="form"><label for="impFile">Archivo</label><input type="file" id="impFile" accept=".bc3,.xlsx,.xls,.csv">
      <button class="btn btn-sm" data-action="impsample">Probar con un BC3 de ejemplo</button></div>
      <div id="impPrev"></div>`, 'wide');
    U.$('#impFile').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const ext = f.name.split('.').pop().toLowerCase();
      try {
        if (ext === 'bc3') showImport(f.name, parseBC3(await f.text()));
        else {
          await U.lib('xlsx');
          const wb = window.XLSX.read(await f.arrayBuffer(), { type: 'array' });
          const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).filter((r) => r.length);
          showImport(f.name, rows.slice(1).map((r) => ({ code: String(r[0] || ''), desc: String(r[1] || ''), unit: String(r[2] || ''), price: parseFloat(r[4] || r[3]) || 0 })).filter((r) => r.code));
        }
      } catch (err) { U.$('#impPrev').innerHTML = `<p class="neg">No se pudo leer el archivo: ${esc(err.message)}</p>`; }
    });
  });
  function showImport(name, items) {
    const parts = items.filter((i) => !i.chapter);
    U.$('#impPrev').innerHTML = `<h3 class="mini">${esc(name)} · ${items.length} conceptos leídos (${items.filter((i) => i.chapter).length} capítulos, ${parts.length} partidas)</h3>
      <div class="table-wrap"><table class="table compact"><thead><tr><th>Código</th><th>Descripción</th><th>Ud</th><th class="num">Precio</th><th>Coincide con</th></tr></thead><tbody>
      ${items.slice(0, 14).map((i) => `<tr><td class="mono">${esc(i.code)}</td><td>${esc(i.desc)}</td><td>${esc(i.unit)}</td><td class="num">${num(i.price, 2)}</td><td>${A.partidaByCode[i.code] ? '<span class="chip st-ok"><i></i>Partida existente</span>' : i.chapter ? '<span class="chip"><i></i>Capítulo</span>' : '<span class="chip st-review"><i></i>Nueva</span>'}</td></tr>`).join('')}</tbody></table></div>
      ${items.length > 14 ? `<p class="muted small">… y ${items.length - 14} más.</p>` : ''}
      <div class="form-actions"><button class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary" data-action="impok:${items.length}">Guardar como nueva versión</button></div>`;
    S.impName = name;
  }
  act('impsample', () => showImport('Presupuesto_contrato.bc3', parseBC3(sampleBC3())));
  act('impok', (n) => { A.presHist.push({ at: U.now(), who: U.me(), what: `Importó ${S.impName} como versión de comparación (${n} conceptos). La versión vigente no cambia hasta aprobarla.`, imp: null }); U.log('presupuesto', `Importó ${S.impName}`); U.closeModal(); U.rerender(); });

  /* ═════════ CERTIFICACIONES ═════════ */
  S.certMode = 'mes';
  S.certSide = 'cliente';
  S.certInput = 'pct';
  S.certOpen = {};
  S.certSel = {};
  function curPeriod() {
    const list = U.certPeriods(S.certSide, S.certMode);
    let per = list.find((p) => p.id === S.certPer);
    if (!per) per = list.find((p) => p.status !== 'cerrada') || list[list.length - 1];
    S.certPer = per.id;
    return per;
  }
  const prevOfPer = (per) => { const l = U.certPeriods(S.certSide, S.certMode); const i = l.indexOf(per); return i > 0 ? l[i - 1] : null; };
  A.views.certificaciones = {
    render() {
      if (S.role === 'sub') S.certSide = 'S4';
      const side = S.certSide;
      const list = U.certPeriods(side, S.certMode);
      const per = curPeriod();
      const prev = prevOfPer(per);
      const parts = partsOf(side).filter((p) => !S.certCap || p.cap === S.certCap);
      const editable = ['borrador', 'revision'].includes(per.status) && U.can('certificaciones');
      const caps = A.chapters.filter((c) => parts.some((p) => p.cap === c.code));
      let tPer = 0, tOri = 0, tAnt = 0, tCon = 0;
      parts.forEach((p) => { const pr = priceOf(p, side); const o = origenQty(per, p.code), a = prev ? origenQty(prev, p.code) : 0; tOri += o * pr; tAnt += a * pr; tCon += p.qty * pr; });
      tPer = tOri - tAnt;
      const pem = side === 'cliente' ? E.pem() : tCon;
      const planEnd = side === 'cliente' ? E.planificado(per.end) / E.pem() : null;
      const isCli = side === 'cliente';
      const gg = isCli ? tPer * P.ggbi : 0, ret = (tPer + gg) * P.retencion, iva = (tPer + gg - ret) * (isCli ? 0.1 : 0.21);
      const nextLabel = S.certMode === 'mes' ? 'octubre' : '1ª quincena de octubre';
      const canGen = !list.some((p) => p.start >= new Date(2026, 9, 1, 0));
      return `
      <header class="page-head compact">
        <div><div class="eyebrow">Avance por capítulos y partidas · ${isCli ? 'certificación al cliente' : 'certificación de subcontrata'}</div><h1>Certificaciones</h1></div>
        <div class="head-actions">
          ${S.role !== 'sub' ? `<label class="fsel inline"><span>Certificación</span><select data-change="certside" id="certside"><option value="cliente">Al cliente · ${P.client}</option>${A.subs.map((s) => `<option value="${s.id}" ${side === s.id ? 'selected' : ''}>Subcontrata · ${s.short}</option>`).join('')}</select></label>` : ''}
          <div class="seg" role="group" aria-label="Periodo"><button data-action="certmode:mes" aria-pressed="${S.certMode === 'mes'}">Mensual</button><button data-action="certmode:quincena" aria-pressed="${S.certMode === 'quincena'}">Quincenal</button></div>
        </div>
      </header>
      <div class="periods">${list.map((p) => `<button class="period ${p.id === per.id ? 'active' : ''}" data-action="certper:${p.id}"><span>${p.label}</span>${U.chipOf(CST, p.status)}</button>`).join('')}
        ${canGen && U.can('certificaciones') ? `<button class="period new" data-action="certgen">${ic('plus')}<span>Generar ${nextLabel}</span></button>` : ''}</div>
      <article class="card cert-card">
        <div class="card-h wrap">
          <div><h2>${per.label}</h2><div class="muted small">${fdate(per.start, false)} – ${fdate(per.end)} · ${isCli ? 'precios de contrato (PEM)' : 'precios de subcontrato'} · ${per.status === 'cerrada' ? 'cerrada: solo admite correcciones registradas' : 'parte del acumulado anterior sin duplicar cantidades'}</div></div>
          <div class="head-actions">
            ${U.chipOf(CST, per.status)}
            ${editable ? `<div class="seg small" role="group" aria-label="Introducir avance en"><button data-action="certinput:pct" aria-pressed="${S.certInput === 'pct'}">%</button><button data-action="certinput:qty" aria-pressed="${S.certInput === 'qty'}">Medición</button></div>` : ''}
            <label class="fsel inline"><span>Capítulo</span><select data-change="certcapf" id="certcapf"><option value="">Todos</option>${A.chapters.filter((c) => partsOf(side).some((p) => p.cap === c.code)).map((c) => `<option value="${c.code}" ${S.certCap === c.code ? 'selected' : ''}>${c.code} ${c.name}</option>`).join('')}</select></label>
            <button class="btn btn-sm" data-action="certxlsx">${ic('download')}Excel</button>
            <button class="btn btn-sm" data-action="certpdf">${ic('download')}PDF</button>
          </div>
        </div>
        ${editable ? `<div class="bulk"><span class="muted small">${Object.values(S.certSel).filter(Boolean).length} partidas seleccionadas</span>
          <label class="fsel inline"><span>Fijar % a origen</span><input type="number" min="0" max="100" step="any" id="bulkPct" class="cell-in" aria-label="Porcentaje a origen para las seleccionadas"></label>
          <button class="btn btn-sm" data-action="certbulk">Aplicar a la selección</button>
          <button class="btn btn-sm" data-action="certfromval">${ic('check')}Rellenar con el avance validado en obra</button></div>` : ''}
        <div class="table-wrap"><table class="table grid-x" id="certGrid">
          <thead><tr>${editable ? '<th><input type="checkbox" data-change="certselall" aria-label="Seleccionar todas"></th>' : ''}<th>Código</th><th>Descripción</th><th>Ud</th><th class="num">Medición</th><th class="num">Precio</th><th class="num">Importe</th><th class="num">% anterior</th><th class="num">Periodo</th><th class="num">% origen</th><th class="num">Pendiente</th><th class="num">Importe periodo</th><th class="num">Importe origen</th><th class="num" title="Avance validado en obra a hoy">Validado obra</th></tr></thead>
          <tbody>${caps.map((c) => {
            const cps = parts.filter((p) => p.cap === c.code);
            const open = S.certOpen[c.code] !== false;
            const sOri = cps.reduce((s, p) => s + origenQty(per, p.code) * priceOf(p, side), 0), sAnt = prev ? cps.reduce((s, p) => s + origenQty(prev, p.code) * priceOf(p, side), 0) : 0, sCon = cps.reduce((s, p) => s + p.qty * priceOf(p, side), 0);
            return `<tr class="cap-tr" data-action="certopen:${c.code}"><td colspan="${editable ? 6 : 5}"><span class="chev-wrap">${ic('chevron', open ? 'chev open' : 'chev')}</span><b>${c.code} ${c.name}</b></td><td class="num"><b>${eur(sCon)}</b></td><td class="num">${pct(sAnt / sCon, 1)}</td><td></td><td class="num"><b>${pct(sOri / sCon, 1)}</b></td><td class="num">${pct(1 - sOri / sCon, 1)}</td><td class="num"><b>${eur(sOri - sAnt)}</b></td><td class="num">${eur(sOri)}</td><td></td></tr>
            ${open ? cps.map((p) => certRow(p, per, prev, side, editable)).join('') : ''}`;
          }).join('')}</tbody>
        </table></div>
        <div class="cert-totals">
          <div><span>Importe del periodo</span><b id="tPer">${eur(tPer)}</b></div>
          <div><span>Acumulado a origen</span><b id="tOri">${eur(tOri)}</b></div>
          <div><span>Avance económico a origen</span><b id="tPct">${pct(tOri / pem)}</b></div>
          ${isCli ? `<div><span>Planificado al cierre del periodo</span><b>${pct(planEnd)}</b><em class="${tOri / pem < planEnd ? 'neg' : 'pos'}">${num((tOri / pem - planEnd) * 100, 1)} pts</em></div>` : ''}
        </div>
        <div class="table-wrap"><table class="table compact sums"><tbody>
          ${isCli ? `<tr><td>Gastos generales y beneficio industrial (19 %)</td><td class="num">${eur(gg)}</td></tr>` : ''}
          <tr><td>Retención de garantía (5 %)</td><td class="num">−${eur(ret)}</td></tr>
          <tr><td>IVA (${isCli ? '10' : '21'} %)</td><td class="num">${eur(iva)}</td></tr>
          <tr class="total"><td>Total a ${isCli ? 'certificar al cliente' : 'pagar a la subcontrata'} en el periodo</td><td class="num">${eur(tPer + gg - ret + iva)}</td></tr>
        </tbody></table></div>
        ${per.corrections.length ? `<div class="card-b"><h3 class="mini">Correcciones registradas</h3><ul class="evid">${per.corrections.map((c) => `<li>${ic('edit')}<span>${fdt(c.at)} · ${c.who} · <span class="mono">${c.code}</span> ${c.dq > 0 ? '+' : ''}${num(c.dq, 2)} ${A.partidaByCode[c.code].unit} · ${esc(c.why)}</span></li>`).join('')}</ul></div>` : ''}
        <div class="card-f">${flowButtons(per)}</div>
      </article>
      <p class="muted small">Ejecutado, certificado, facturado y cobrado se llevan por separado: marcar un trabajo como ejecutado en obra no lo certifica, y aprobar una certificación no la da por cobrada.</p>`;
    },
    mount() { bindGrid(); },
  };
  function certRow(p, per, prev, side, editable) {
    const pr = priceOf(p, side);
    const o = origenQty(per, p.code), a = prev ? origenQty(prev, p.code) : 0;
    const val = E.partidaAvance(p) * p.qty;
    const over = o > val + 0.01;
    const per_ = o - a;
    const inVal = S.certInput === 'pct' ? r2((per_ / p.qty) * 100) : r2(per_);
    return `<tr data-code="${p.code}" class="${S.certSel[p.code] ? 'sel' : ''}">
      ${editable ? `<td><input type="checkbox" ${S.certSel[p.code] ? 'checked' : ''} data-change="certsel:${p.code}" aria-label="Seleccionar ${p.code}"></td>` : ''}
      <td class="mono">${p.code}</td><td class="desc">${p.desc}</td><td>${p.unit}</td><td class="num">${num(p.qty, 2)}</td><td class="num">${num(pr, 2)}</td><td class="num">${eur(p.qty * pr)}</td>
      <td class="num">${pct(a / p.qty, 1)}</td>
      <td class="num">${editable ? `<input class="cell-in" type="number" step="any" value="${inVal}" data-code="${p.code}" aria-label="Avance del periodo de ${p.code} en ${S.certInput === 'pct' ? 'porcentaje' : p.unit}"><span class="unit">${S.certInput === 'pct' ? '%' : p.unit}</span>` : `${S.certInput === 'pct' ? pct(per_ / p.qty, 1) : num(per_, 2) + ' ' + p.unit}`}</td>
      <td class="num"><b>${pct(o / p.qty, 1)}</b></td><td class="num">${pct(1 - o / p.qty, 1)}</td><td class="num">${eur(per_ * pr)}</td><td class="num">${eur(o * pr)}</td>
      <td class="num ${over ? 'neg' : 'muted'}" title="${over ? 'Se certifica más de lo validado en obra' : ''}">${pct(val / p.qty, 0)}${over ? ' ' + ic('alert') : ''}</td></tr>`;
  }
  function flowButtons(per) {
    const b = [];
    if (per.status === 'borrador' && U.can('certificaciones')) b.push(`<button class="btn btn-primary" data-action="certflow:revision">Enviar a revisión</button>`);
    if (per.status === 'revision' && U.can('certificaciones', 'approve')) b.push(`<button class="btn" data-action="certflow:borrador">Devolver a borrador</button><button class="btn btn-primary" data-action="certflow:aprobada">Aprobar</button>`);
    if (per.status === 'revision' && !U.can('certificaciones', 'approve')) b.push(`<span class="muted small">Pendiente de aprobación por ${S.certSide === 'cliente' ? 'el promotor o la dirección' : 'la dirección'}.</span>`);
    if (per.status === 'aprobada' && U.can('certificaciones', 'approve')) b.push(`<button class="btn btn-primary" data-action="certflow:cerrada">Cerrar certificación</button>`);
    if (per.status === 'cerrada' && U.can('certificaciones')) b.push(`<button class="btn" data-action="certcorr">${ic('edit')}Registrar corrección</button>`);
    return (per.log.length ? `<span class="muted small cert-log">${per.log.map((l) => `${l.what} · ${l.who} · ${fdt(l.at)}`).join(' — ')}</span>` : '') + b.join('');
  }
  function focusRel(code, dir) {
    const all = U.$$('input.cell-in[data-code]', U.$('#certGrid'));
    const i = all.findIndex((x) => x.dataset.code === code);
    const n = all[i + dir];
    if (n) { n.focus(); n.select(); }
  }
  function bindGrid() {
    const grid = U.$('#certGrid');
    if (!grid) return;
    U.$$('input.cell-in[data-code]', grid).forEach((inp) => {
      inp.addEventListener('change', () => setPeriodValue(inp.dataset.code, parseFloat(inp.value)));
      inp.addEventListener('keydown', (e) => {
        const dir = e.key === 'Enter' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const code = inp.dataset.code;
        S.certNext = { code, dir };
        inp.blur();
        if (inp.isConnected) { S.certNext = null; focusRel(code, dir); }
      });
    });
    if (S.certNext) { const { code, dir } = S.certNext; S.certNext = null; focusRel(code, dir); }
  }
  function setPeriodValue(code, v, silent) {
    const per = curPeriod(), prev = prevOfPer(per);
    const p = A.partidaByCode[code];
    if (isNaN(v)) v = 0;
    const a = prev ? origenQty(prev, code) : 0;
    let q = S.certInput === 'pct' ? (v / 100) * p.qty : v;
    let o = a + q;
    let warn = '';
    if (o < a - 1e-6) { o = a; warn = 'El acumulado no puede ser inferior a lo ya certificado. Usa una corrección.'; }
    if (o > p.qty + 1e-6) { o = p.qty; warn = 'No se puede certificar más del 100 % de la partida.'; }
    const before = per.qty[code] || 0;
    per.qty[code] = r2(o - corrQty(per, code));
    if (Math.abs(before - per.qty[code]) > 1e-6 && !silent) U.log('certificaciones', `Cambió ${code} en ${per.label}`, pct(before / p.qty, 1), pct(per.qty[code] / p.qty, 1));
    if (warn && !silent) U.toast(`${ic('alert')}<span>${warn}</span>`, 'warn');
    if (!silent) U.rerender();
  }
  act('certside', (_, __, v) => { S.certSide = v; S.certPer = null; S.certSel = {}; U.rerender(); });
  act('certmode', (m) => { S.certMode = m; S.certPer = null; U.rerender(); });
  act('certper', (id) => { S.certPer = id; S.certSel = {}; U.rerender(); });
  act('certinput', (m) => { S.certInput = m; U.rerender(); });
  act('certcapf', (_, __, v) => { S.certCap = v || null; U.rerender(); });
  act('certopen', (c) => { S.certOpen[c] = S.certOpen[c] === false; U.rerender(); });
  act('certsel', (code, _, on) => { S.certSel[code] = on; const n = Object.values(S.certSel).filter(Boolean).length; const b = U.$('.bulk .muted'); if (b) b.textContent = n + ' partidas seleccionadas'; });
  act('certselall', (_, __, on) => { partsOf(S.certSide).forEach((p) => { if (!S.certCap || p.cap === S.certCap) S.certSel[p.code] = on; }); U.rerender(); });
  act('certbulk', () => {
    const v = parseFloat(U.$('#bulkPct').value);
    const codes = Object.keys(S.certSel).filter((k) => S.certSel[k]);
    if (isNaN(v) || !codes.length) { U.toast(`${ic('alert')}<span>Selecciona partidas e indica un porcentaje a origen.</span>`, 'warn'); return; }
    const per = curPeriod(), prev = prevOfPer(per);
    codes.forEach((code) => { const p = A.partidaByCode[code]; const a = prev ? origenQty(prev, code) : 0; const q = Math.max(a, Math.min(p.qty, (v / 100) * p.qty)); per.qty[code] = r2(q - corrQty(per, code)); });
    U.log('certificaciones', `Fijó un ${v} % a origen en ${codes.length} partidas de ${per.label}`);
    U.rerender();
  });
  act('certfromval', () => {
    const per = curPeriod(), prev = prevOfPer(per);
    const codes = Object.keys(S.certSel).filter((k) => S.certSel[k]);
    const list = codes.length ? codes : partsOf(S.certSide).filter((p) => !S.certCap || p.cap === S.certCap).map((p) => p.code);
    list.forEach((code) => { const p = A.partidaByCode[code]; const a = prev ? origenQty(prev, code) : 0; per.qty[code] = r2(Math.max(a, E.partidaAvance(p) * p.qty) - corrQty(per, code)); });
    U.log('certificaciones', `Rellenó ${list.length} partidas de ${per.label} con el avance validado en obra`);
    U.toast(`${ic('check')}<span>${list.length} partidas actualizadas con el avance validado. Revísalas antes de enviar.</span>`, 'ok');
    U.rerender();
  });
  act('certgen', () => {
    if (!U.guard('certificaciones')) return;
    const list = U.certPeriods(S.certSide, S.certMode);
    const last = list[list.length - 1];
    if (last.status !== 'cerrada' && last.status !== 'aprobada') {
      U.modal(`<div class="modal-head"><h2>Generar nuevo periodo</h2></div><p>${last.label} está ${U.chipText(CST, last.status).toLowerCase()}. Para no duplicar cantidades, el nuevo periodo parte de su acumulado. ¿Quieres aprobarla y cerrarla ahora?</p>
        <div class="form-actions"><button class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary" data-action="certgenok:1">${U.can('certificaciones', 'approve') ? 'Cerrar y generar' : 'Generar igualmente'}</button></div>`);
      return;
    }
    genNext();
  });
  act('certgenok', () => {
    const list = U.certPeriods(S.certSide, S.certMode);
    const last = list[list.length - 1];
    if (U.can('certificaciones', 'approve')) { last.status = 'cerrada'; last.log.push({ what: 'Cerrada', who: U.me(), at: U.now() }); }
    U.closeModal();
    genNext();
  });
  function genNext() {
    const list = U.certPeriods(S.certSide, S.certMode);
    const last = list[list.length - 1];
    const mes = S.certMode === 'mes';
    const per = { id: mes ? '2026-10' : 'Q7', n: last.n + 1, label: mes ? `n.º ${last.n + 1} · octubre` : '1ª quincena de octubre', start: new Date(2026, 9, 1, 12), end: mes ? new Date(2026, 9, 31, 12) : new Date(2026, 9, 15, 12), status: 'borrador', qty: {}, corrections: [], log: [{ what: 'Creada', who: U.me(), at: U.now() }] };
    partsOf(S.certSide).forEach((p) => { per.qty[p.code] = origenQty(last, p.code); });
    list.push(per);
    S.certPer = per.id;
    U.log('certificaciones', `Generó ${per.label} a partir del acumulado de ${last.label}`);
    U.toast(`${ic('sheet')}<span>${per.label} creada con el acumulado anterior. Sube los porcentajes del periodo.</span>`, 'ok');
    U.rerender();
  }
  const FLOW_TXT = { revision: 'Enviada a revisión', borrador: 'Devuelta a borrador', aprobada: 'Aprobada', cerrada: 'Cerrada' };
  act('certflow', (to) => {
    const per = curPeriod();
    if (!U.guard('certificaciones', to === 'aprobada' || to === 'cerrada' ? 'approve' : 'edit')) return;
    per.status = to;
    per.log.push({ what: FLOW_TXT[to], who: U.me(), at: U.now() });
    U.log('certificaciones', `${FLOW_TXT[to]}: ${per.label}${S.certSide !== 'cliente' ? ' de ' + U.subName(S.certSide) : ''}`);
    if (to === 'cerrada' && S.certSide === 'cliente') {
      const base = (U.certOrigen(per) - U.certOrigen(prevOfPer(per))) * K;
      const id = 'FE-2026-0' + (48 + A.facturas.filter((f) => f.dir === 'emitida').length);
      A.facturas.unshift({ id, dir: 'emitida', a: P.client, concepto: 'Certificación ' + per.label, fecha: A.iso(TODAY), vence: A.iso(A.addDays(TODAY, 30)), base: Math.round(base * (1 - P.retencion)), iva: 0.1, cobrado: 0, doc: null });
      U.toast(`${ic('euro')}<span>Certificación cerrada. Se ha preparado la factura <b>${id}</b> en el control económico.</span>`, 'ok');
    }
    U.rerender();
  });
  act('certcorr', () => {
    const per = curPeriod();
    U.modal(`<div class="modal-head"><h2>Corrección en ${per.label}</h2></div><p class="muted">Una certificación cerrada no se edita. La corrección queda registrada con su motivo y se tiene en cuenta en el acumulado siguiente.</p>
      <form class="form" id="corrForm"><label for="cCode">Partida</label><select id="cCode">${partsOf(S.certSide).map((p) => `<option value="${p.code}">${p.code} ${p.desc}</option>`).join('')}</select>
      <label for="cDq">Diferencia de medición (+/−)</label><input id="cDq" type="number" step="any" required>
      <label for="cWhy">Motivo</label><input id="cWhy" required placeholder="Ej.: medición revisada con la dirección de ejecución">
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Registrar</button></div></form>`);
    U.$('#corrForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const c = { code: U.$('#cCode').value, dq: parseFloat(U.$('#cDq').value), why: U.$('#cWhy').value, who: U.me(), at: U.now() };
      per.corrections.push(c);
      U.log('certificaciones', `Registró una corrección en ${per.label} (${c.code}): ${c.why}`);
      U.closeModal(); U.rerender();
    });
  });
  function certRowsExport(per) {
    const prev = prevOfPer(per), side = S.certSide;
    const rows = [['Código', 'Descripción', 'Ud', 'Medición', 'Precio', 'Importe', '% anterior', 'Medición periodo', '% origen', 'Importe periodo', 'Importe origen']];
    partsOf(side).forEach((p) => { const pr = priceOf(p, side), o = origenQty(per, p.code), a = prev ? origenQty(prev, p.code) : 0; rows.push([p.code, p.desc, p.unit, p.qty, r2(pr), r2(p.qty * pr), r2(a / p.qty), r2(o - a), r2(o / p.qty), r2((o - a) * pr), r2(o * pr)]); });
    return rows;
  }
  act('certxlsx', () => {
    const per = curPeriod();
    U.exportXlsx(`Certificacion_${per.label.replace(/[^\wáéíóúñº]+/gi, '_')}.xlsx`, [{ name: 'Certificación', rows: certRowsExport(per), widths: [8, 55, 5, 10, 10, 12, 10, 12, 10, 12, 12] }]).catch(() => U.toast(`${ic('alert')}<span>No se pudo generar el Excel.</span>`, 'warn'));
  });
  act('certpdf', async () => {
    const per = curPeriod();
    try {
      const doc = await U.pdfDoc();
      U.pdfHeader(doc, `Certificación ${per.label}`, `${P.name} · ${S.certSide === 'cliente' ? 'al cliente ' + P.client : 'subcontrata ' + U.sub(S.certSide).name} · ${U.chipText(CST, per.status)}`);
      const rows = certRowsExport(per);
      doc.autoTable({ startY: 34, head: [['Código', 'Descripción', 'Ud', '% ant.', '% origen', 'Importe periodo', 'Importe origen']], body: rows.slice(1).filter((r) => r[10] > 0).map((r) => [r[0], r[1], r[2], num(r[6] * 100, 1) + ' %', num(r[8] * 100, 1) + ' %', eur(r[9]), eur(r[10])]), styles: { fontSize: 7.5 }, headStyles: { fillColor: [21, 33, 42] }, columnStyles: { 1: { cellWidth: 70 }, 5: { halign: 'right' }, 6: { halign: 'right' } } });
      const tPer = rows.slice(1).reduce((s, r) => s + r[9], 0);
      doc.setFontSize(10);
      doc.text(`Importe del periodo (PEM): ${eur(tPer)}`, 14, doc.lastAutoTable.finalY + 10);
      await U.download(`Certificacion_${per.id}.pdf`, doc.output('blob'));
    } catch (err) { U.toast(`${ic('alert')}<span>No se pudo generar el PDF.</span>`, 'warn'); }
  });

  /* PDF común */
  U.pdfDoc = async (landscape) => {
    await U.lib('jspdf');
    await U.lib('autotable');
    return new window.jspdf.jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  };
  U.pdfHeader = (doc, title, sub) => {
    doc.setFillColor(242, 183, 5); doc.rect(14, 12, 6, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 33, 42); doc.text('ATALAYA · CONTROL DE OBRA', 23, 16.5);
    doc.setFontSize(15); doc.text(title, 14, 25);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 100, 110); doc.text(sub, 14, 30);
    doc.setTextColor(20, 33, 42);
  };

  /* ═════════ CONTROL ECONÓMICO ═════════ */
  S.ecoTab = 'resumen';
  A.views.economia = {
    render() {
      const t = S.ecoTab;
      const e = U.eco();
      return `
      <header class="page-head compact">
        <div><div class="eyebrow">Ingresos y costes · certificaciones, facturas, cobros y pagos</div><h1>Control económico</h1></div>
        <div class="head-actions"><div class="seg" role="tablist">${[['resumen', 'Resumen'], ['capitulos', 'Por capítulo'], ['facturas', 'Facturas'], ['movimientos', 'Cobros y pagos'], ['vencimientos', 'Vencimientos y tesorería']].map(([k, l]) => `<button role="tab" data-action="ecotab:${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</div></div>
      </header>
      ${t === 'resumen' ? ecoResumen(e) : t === 'capitulos' ? ecoCaps() : t === 'facturas' ? ecoFacturas() : t === 'movimientos' ? ecoMovs(e) : ecoVenc(e)}`;
    },
  };
  const money = (v, key) => `<button class="money" data-action="origin:${key}" title="Ver el origen del importe">${eur(v)}</button>`;
  function ecoResumen(e) {
    return `
    <section class="kpis">
      <div class="kpi"><div class="kpi-label">Venta vigente (PEC)</div><div class="kpi-value">${keur(e.venta)}</div><div class="kpi-foot">Inicial ${keur(e.ventaIni)} + modificaciones ${keur(e.modsV * K)}</div></div>
      <div class="kpi"><div class="kpi-label">Coste final previsto</div><div class="kpi-value">${keur(e.costeFinal)}</div><div class="kpi-foot">Objetivo inicial ${keur(e.costeIni)}</div></div>
      <div class="kpi"><div class="kpi-label">Margen previsto</div><div class="kpi-value">${pct(e.margen)}</div><div class="kpi-foot ${e.margen < e.margenIni ? 'neg' : ''}">Inicial ${pct(e.margenIni)} · ${eur(e.venta - e.costeFinal)}</div></div>
      <div class="kpi"><div class="kpi-label">Saldo de caja de la obra</div><div class="kpi-value">${keur(e.cobrado - e.pagado)}</div><div class="kpi-foot">Cobrado ${keur(e.cobrado)} · pagado ${keur(e.pagado)}</div></div>
    </section>
    <section class="grid g-2">
      <article class="card"><div class="card-h"><h2>Ingresos</h2></div><table class="table compact sums"><tbody>
        <tr><td>Presupuesto de venta vigente</td><td class="num">${money(e.venta, 'venta')}</td></tr>
        <tr><td>Ejecutado validado (PEC)</td><td class="num">${money(E.ejecutado() * K, 'ejecutado')}</td></tr>
        <tr><td>Certificaciones emitidas a origen</td><td class="num">${money(e.certificado, 'certificado')}</td></tr>
        <tr><td>Facturas emitidas</td><td class="num">${money(A.facturas.filter((f) => f.dir === 'emitida').reduce((s, f) => s + f.base * (1 + f.iva), 0), 'emitidas')}</td></tr>
        <tr><td>Cobrado</td><td class="num">${money(e.cobrado, 'cobrado')}</td></tr>
        <tr><td>Pendiente de cobro</td><td class="num">${money(e.cobroPend, 'cobropend')}</td></tr>
        <tr><td>Retención de garantía del cliente (5 %)</td><td class="num">${eur(e.retCliente)}</td></tr>
      </tbody></table></article>
      <article class="card"><div class="card-h"><h2>Costes</h2></div><table class="table compact sums"><tbody>
        <tr><td>Presupuesto de coste (objetivo)</td><td class="num">${money(e.costeIni, 'costeini')}</td></tr>
        <tr><td>Comprometido (subcontratos y pedidos)</td><td class="num">${money(e.comprometido, 'comprometido')}</td></tr>
        <tr><td>Coste real (facturas recibidas)</td><td class="num">${money(e.costeReal, 'costereal')}</td></tr>
        <tr><td>Coste pendiente previsto</td><td class="num">${eur(e.costeFinal - e.costeReal)}</td></tr>
        <tr><td>Coste final previsto</td><td class="num">${money(e.costeFinal, 'costefinal')}</td></tr>
        <tr><td>Pagado</td><td class="num">${money(e.pagado, 'pagado')}</td></tr>
        <tr><td>Pendiente de pago</td><td class="num">${money(e.pagosPend, 'pagospend')}</td></tr>
        <tr><td>Retenciones practicadas a subcontratas</td><td class="num">${eur(e.retSubs)}</td></tr>
      </tbody></table></article>
    </section>
    <section class="grid g-3">
      <article class="card"><div class="card-h"><h2>Impuestos</h2></div><table class="table compact sums"><tbody><tr><td>IVA repercutido</td><td class="num">${eur(e.ivaRep)}</td></tr><tr><td>IVA soportado</td><td class="num">${eur(e.ivaSop)}</td></tr><tr class="total"><td>Diferencia</td><td class="num">${eur(e.ivaRep - e.ivaSop)}</td></tr></tbody></table></article>
      <article class="card"><div class="card-h"><h2>Anticipos y acopios</h2></div><ul class="devs"><li><div><strong>Acopio de ladrillo P2</strong><span class="muted small">Proforma PRO-0219 · Cerramientos Albufera · pendiente de condiciones</span></div><b>${eur(18600)}</b></li><li><div><strong>Anticipo del cliente</strong><span class="muted small">No contemplado en contrato</span></div><b>—</b></li></ul></article>
      <article class="card"><div class="card-h"><h2>Margen por origen de la desviación</h2></div><ul class="devs">${A.desviaciones.filter((d) => d.coste).map((d) => `<li><div><strong>${d.title}</strong><span class="muted small">${A.causas[d.causa]}</span></div><b class="neg">−${eur(d.coste)}</b></li>`).join('')}</ul></article>
    </section>`;
  }
  function ecoCaps() {
    const rows = A.chapters.map((c) => {
      const ps = A.partidas.filter((p) => p.cap === c.code);
      const venta = (ps.reduce((s, p) => s + E.importe(p) + modsOf(p.code), 0)) * K;
      const obj = U.capCost(c.code);
      const sub = ps[0] && ps[0].sub;
      const compr = sub ? E.subStats(U.sub(sub)).contrato * (ps.every((p) => p.sub === sub) ? 1 : 0) : A.supplies.filter((m) => m.status !== 'cancelado' && m.status !== 'sin_pedido' && (A.activities.find((a) => a.id === m.act) || {}).cap === c.code).reduce((s, m) => s + m.importe, 0);
      const real = A.facturas.filter((f) => f.dir === 'recibida' && ((f.sub && U.sub(f.sub).caps.includes(c.code) && U.sub(f.sub).caps[0] === c.code) || (f.prov && ((f.prov === 'PR7' && c.code === '03') || (f.prov === 'PR6' && c.code === '04'))))).reduce((s, f) => s + f.base, 0);
      const extra = A.cambios.filter((x) => x.com === 'aprobado' && x.partidas[0].startsWith(c.code)).reduce((s, x) => s + x.coste, 0) + A.desviaciones.filter((d) => d.area.startsWith(c.code) && ['precios', 'productividad'].includes(d.causa)).reduce((s, d) => s + d.coste, 0);
      const fin = obj + extra;
      return { c, venta, obj, compr, real, fin, pend: fin - real, margen: venta ? 1 - fin / venta : 0 };
    });
    const ind = E.pem() * INDIRECT;
    rows.push({ c: { code: '—', name: 'Costes indirectos de obra' }, venta: 0, obj: ind, compr: ind * 0.6, real: ind * 0.47, fin: ind, pend: ind * 0.53, margen: 0 });
    const T = rows.reduce((t, r) => { ['venta', 'obj', 'compr', 'real', 'fin', 'pend'].forEach((k) => (t[k] = (t[k] || 0) + r[k])); return t; }, {});
    return `<article class="card"><div class="card-h"><h2>Por capítulo</h2><span class="muted">Venta con GG y BI · costes sin IVA</span></div><div class="table-wrap"><table class="table">
      <thead><tr><th>Capítulo</th><th class="num">Venta</th><th class="num">Coste objetivo</th><th class="num">Comprometido</th><th class="num">Coste real</th><th class="num">Pendiente previsto</th><th class="num">Coste final previsto</th><th class="num">Margen</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${r.c.code} ${r.c.name}</td><td class="num">${eur(r.venta)}</td><td class="num">${eur(r.obj)}</td><td class="num">${eur(r.compr)}</td><td class="num">${eur(r.real)}</td><td class="num">${eur(r.pend)}</td><td class="num ${r.fin > r.obj ? 'neg' : ''}">${eur(r.fin)}</td><td class="num">${r.venta ? pct(r.margen) : '—'}</td></tr>`).join('')}</tbody>
      <tfoot><tr class="total"><td>Total</td><td class="num">${eur(T.venta)}</td><td class="num">${eur(T.obj)}</td><td class="num">${eur(T.compr)}</td><td class="num">${eur(T.real)}</td><td class="num">${eur(T.pend)}</td><td class="num">${eur(T.fin)}</td><td class="num">${pct(1 - T.fin / T.venta)}</td></tr></tfoot></table></div></article>`;
  }
  const facState = (f) => { const tot = f.base * (1 + f.iva), d = f.dir === 'emitida' ? f.cobrado : f.pagado; return d >= tot - 1 ? ['Cobrada', 'st-ok'] : d > 0 ? ['Parcial', 'st-progress'] : U.days(f.vence) < 0 ? ['Vencida', 'st-late'] : ['Pendiente', 'st-none']; };
  function facTable(dir) {
    const list = A.facturas.filter((f) => f.dir === dir);
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Factura</th><th>${dir === 'emitida' ? 'Cliente' : 'Emisor'}</th><th>Fecha</th><th>Vence</th><th class="num">Base</th><th class="num">Total</th><th class="num">${dir === 'emitida' ? 'Cobrado' : 'Pagado'}</th><th>Estado</th><th></th></tr></thead>
      <tbody>${list.map((f) => { const tot = f.base * (1 + f.iva), d = f.dir === 'emitida' ? f.cobrado : f.pagado, st = facState(f); return `<tr class="${S.ecoHi === f.id ? 'sel' : ''}"><td><span class="mono">${f.id}</span><div class="muted small">${f.concepto}${f.flag ? ` · <span class="neg">${f.flag}</span>` : ''}</div></td><td>${f.a || (f.sub ? U.sub(f.sub).name : U.prov(f.prov).name)}</td><td>${fdate(f.fecha, false)}</td><td class="${U.days(f.vence) < 0 && d < tot - 1 ? 'neg' : ''}">${fdate(f.vence, false)}</td><td class="num">${eur(f.base)}</td><td class="num">${eur(tot)}</td><td class="num">${eur(d)}</td><td><span class="chip ${st[1]}"><i></i>${dir === 'recibida' && st[0] === 'Cobrada' ? 'Pagada' : st[0]}</span></td>
        <td>${d < tot - 1 && U.can('economia') ? `<button class="btn btn-sm" data-action="regpay:${f.id}">${dir === 'emitida' ? 'Registrar cobro' : 'Registrar pago'}</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function ecoFacturas() {
    return `<article class="card"><div class="card-h"><h2>Facturas emitidas</h2></div>${facTable('emitida')}</article>
      <article class="card"><div class="card-h"><h2>Facturas recibidas</h2><span class="muted">Subcontratas y proveedores</span></div>${facTable('recibida')}</article>`;
  }
  function ecoMovs(e) {
    return `<article class="card"><div class="card-h"><h2>Cobros y pagos</h2><span class="muted">Admiten importes parciales con justificante</span></div><div class="table-wrap"><table class="table">
      <thead><tr><th>Fecha</th><th>Tipo</th><th>Contraparte</th><th>Factura</th><th class="num">Importe</th><th>Justificante</th></tr></thead>
      <tbody>${A.movimientos.map((m) => `<tr><td>${fdate(m.fecha, false)}</td><td>${m.tipo === 'cobro' ? '<span class="chip st-ok"><i></i>Cobro</span>' : '<span class="chip st-progress"><i></i>Pago</span>'}${m.parcial ? ' <span class="tag">parcial</span>' : ''}</td><td>${m.contraparte}</td><td class="mono small">${m.factura}</td><td class="num">${eur(m.importe)}</td><td>${m.just ? `<button class="linkish" data-action="goto:documentacion:${m.tipo === 'cobro' ? 'cliente' : 'sub-S2'}">${ic('doc')}${m.just.replace('DOC-', '')}</button>` : '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div></article>
      <section class="grid g-2"><article class="card"><div class="card-h"><h2>Retenciones</h2></div><table class="table compact sums"><tbody><tr><td>Retenida por el cliente (5 % de lo certificado)</td><td class="num">${eur(e.retCliente)}</td></tr><tr><td>Retenida a subcontratas</td><td class="num">${eur(e.retSubs)}</td></tr></tbody></table></article>
      <article class="card"><div class="card-h"><h2>Resumen de caja</h2></div><table class="table compact sums"><tbody><tr><td>Cobrado</td><td class="num">${eur(e.cobrado)}</td></tr><tr><td>Pagado</td><td class="num">−${eur(e.pagado)}</td></tr><tr class="total"><td>Saldo</td><td class="num">${eur(e.cobrado - e.pagado)}</td></tr></tbody></table></article></section>`;
  }
  function ecoVenc(e) {
    const items = [];
    A.facturas.forEach((f) => { const tot = f.base * (1 + f.iva), d = f.dir === 'emitida' ? f.cobrado : f.pagado; if (d < tot - 1) items.push({ date: f.vence, kind: f.dir === 'emitida' ? 'Cobro' : 'Pago', who: f.a || (f.sub ? U.subName(f.sub) : U.prov(f.prov).name), what: f.id + ' · ' + f.concepto, imp: tot - d }); });
    const c8 = U.certPeriods().find((p) => p.status !== 'cerrada');
    if (c8) items.push({ date: A.iso(A.addDays(TODAY, 30)), kind: 'Cobro previsto', who: P.client, what: 'Certificación ' + c8.label + ' (pendiente de aprobar)', imp: (U.certOrigen(c8) - U.certOrigen(U.lastClosed())) * K * 0.95 * 1.1 });
    items.sort((a, b) => U.toDate(a.date) - U.toDate(b.date));
    // Previsión de tesorería mensual
    const months = [];
    let saldo = e.cobrado - e.pagado;
    for (let m = 9; m < 18; m++) {
      const d0 = new Date(2026, m, 1, 12), d1 = new Date(2026, m + 1, 0, 12);
      const prodPrev = new Date(2026, m - 1, 0, 12), prodCur = new Date(2026, m, 0, 12);
      const certM = Math.max(0, E.planificado(prodCur) - E.planificado(prodPrev)) * K * 0.95 * 1.1;
      const costM = Math.max(0, E.planificado(d1) - E.planificado(d0)) * COST_RATIO * 1.21 * 0.92;
      const pendCob = A.facturas.filter((f) => f.dir === 'emitida' && U.toDate(f.vence) >= d0 && U.toDate(f.vence) <= d1).reduce((s, f) => s + f.base * (1 + f.iva) - f.cobrado, 0);
      const pendPag = A.facturas.filter((f) => f.dir === 'recibida' && U.toDate(f.vence) >= d0 && U.toDate(f.vence) <= d1).reduce((s, f) => s + f.base * (1 + f.iva) - f.pagado, 0);
      const cob = (m === 9 ? 0 : certM) + pendCob, pag = costM + pendPag;
      saldo += cob - pag;
      months.push({ d: d0, cob, pag, saldo });
    }
    const W = 760, H = 260, mg = { l: 56, r: 12, t: 14, b: 28 };
    const max = Math.max(...months.map((m) => Math.max(m.cob, m.pag))), minS = Math.min(0, ...months.map((m) => m.saldo)), maxS = Math.max(...months.map((m) => m.saldo), max);
    const top = Math.max(max, maxS), bot = Math.min(0, minS);
    const y = (v) => mg.t + (1 - (v - bot) / (top - bot)) * (H - mg.t - mg.b);
    const bw = (W - mg.l - mg.r) / months.length;
    const ticks = 4;
    return `<section class="grid g-main">
      <article class="card"><div class="card-h"><h2>Previsión de tesorería</h2><span class="muted">Según planificación, certificaciones y vencimientos</span></div><div class="card-b">
        <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Previsión mensual de cobros, pagos y saldo">
          ${Array.from({ length: ticks + 1 }, (_, i) => bot + ((top - bot) * i) / ticks).map((v) => `<line class="grid" x1="${mg.l}" x2="${W - mg.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${mg.l - 6}" y="${y(v) + 4}" text-anchor="end">${num(v / 1000, 0)}k</text>`).join('')}
          <line class="axis-zero" x1="${mg.l}" x2="${W - mg.r}" y1="${y(0)}" y2="${y(0)}"/>
          ${months.map((m, i) => { const x0 = mg.l + i * bw; return `<rect class="bar-cob" x="${x0 + bw * 0.14}" y="${y(m.cob)}" width="${bw * 0.34}" height="${y(0) - y(m.cob)}"><title>Cobros ${eur(m.cob)}</title></rect><rect class="bar-pag" x="${x0 + bw * 0.52}" y="${y(m.pag)}" width="${bw * 0.34}" height="${y(0) - y(m.pag)}"><title>Pagos ${eur(m.pag)}</title></rect><text class="axis" x="${x0 + bw / 2}" y="${H - 8}" text-anchor="middle">${m.d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</text>`; }).join('')}
          <path class="line-saldo" d="M${months.map((m, i) => (mg.l + i * bw + bw / 2).toFixed(1) + ',' + y(m.saldo).toFixed(1)).join('L')}"/>
          ${months.map((m, i) => `<circle class="dot-saldo" cx="${mg.l + i * bw + bw / 2}" cy="${y(m.saldo)}" r="3.5"><title>Saldo ${eur(m.saldo)}</title></circle>`).join('')}
        </svg>
        <div class="legend"><span><i class="lg-cob"></i>Cobros previstos</span><span><i class="lg-pag"></i>Pagos previstos</span><span><i class="lg-saldo"></i>Saldo acumulado</span></div></div></article>
      <article class="card"><div class="card-h"><h2>Próximos vencimientos</h2></div><ul class="devs">${items.slice(0, 9).map((i) => `<li><div><strong>${i.kind} · ${i.who}</strong><span class="muted small">${fdate(i.date, false)} · ${i.what}</span></div><b class="${i.kind.startsWith('Cobro') ? 'pos' : ''}">${i.kind.startsWith('Cobro') ? '+' : '−'}${eur(i.imp)}</b></li>`).join('')}</ul></article>
    </section>`;
  }
  act('ecotab', (t) => { S.ecoTab = t; U.rerender(); });
  act('regpay', (id) => {
    if (!U.guard('economia')) return;
    const f = A.facturas.find((x) => x.id === id);
    const tot = f.base * (1 + f.iva), done = f.dir === 'emitida' ? f.cobrado : f.pagado;
    U.modal(`<div class="modal-head"><h2>${f.dir === 'emitida' ? 'Registrar cobro' : 'Registrar pago'} · ${f.id}</h2></div><form class="form" id="payForm">
      <p class="muted">Pendiente: <b>${eur(tot - done)}</b> de ${eur(tot)}. Puedes registrar un importe parcial.</p>
      <label for="payImp">Importe</label><input id="payImp" type="number" step="0.01" max="${(tot - done).toFixed(2)}" value="${(tot - done).toFixed(2)}" required>
      <label for="payDate">Fecha</label><input id="payDate" type="date" value="${A.iso(TODAY)}">
      <label for="payJus">Justificante</label><input id="payJus" type="file">
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Registrar</button></div></form>`);
    U.$('#payForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const imp = Math.min(tot - done, parseFloat(U.$('#payImp').value) || 0);
      if (f.dir === 'emitida') f.cobrado += imp; else f.pagado += imp;
      const file = U.$('#payJus').files[0];
      const mid = (f.dir === 'emitida' ? 'COB-' : 'PAG-') + (700 + A.movimientos.length);
      let jid = null;
      if (file) { jid = 'DOC-' + mid; A.files.push({ id: jid, folder: f.dir === 'emitida' ? 'cliente' : f.sub ? 'sub-' + f.sub : 'proveedores', name: 'Justificante ' + mid + ' · ' + file.name, date: U.$('#payDate').value, resp: U.me(), status: 'cargado', tags: ['pago'], links: [{ t: 'eco', label: 'Control económico' }], size: Math.round(file.size / 1024) + ' kB', type: file.name.split('.').pop().toUpperCase(), url: URL.createObjectURL(file) }); }
      A.movimientos.unshift({ id: mid, tipo: f.dir === 'emitida' ? 'cobro' : 'pago', fecha: U.$('#payDate').value, contraparte: f.a || (f.sub ? U.sub(f.sub).name : U.prov(f.prov).name), factura: f.id, importe: imp, just: jid, parcial: imp < tot - done - 1 });
      U.log('economia', `Registró ${f.dir === 'emitida' ? 'un cobro' : 'un pago'} de ${eur(imp)} (${f.id})`);
      U.closeModal(); U.rerender();
    });
  });
  // Origen de cualquier importe
  act('origin', (key) => {
    const e = U.eco();
    const list = {
      venta: [['Presupuesto inicial (PEC)', e.ventaIni], ...A.cambios.filter((c) => c.com === 'aprobado').map((c) => [c.id + ' · ' + c.title, c.venta * K])],
      ejecutado: E.chapterStats().filter((c) => c.ej).map((c) => [c.code + ' ' + c.name, c.ej * K]),
      certificado: U.certPeriods().filter((p) => p.status === 'cerrada').map((p, i, arr) => ['Certificación ' + p.label, (U.certOrigen(p) - (i ? U.certOrigen(arr[i - 1]) : 0)) * K]),
      emitidas: A.facturas.filter((f) => f.dir === 'emitida').map((f) => [f.id + ' · ' + f.concepto, f.base * (1 + f.iva)]),
      cobrado: A.movimientos.filter((m) => m.tipo === 'cobro').map((m) => [m.id + ' · ' + m.factura, m.importe]),
      cobropend: A.facturas.filter((f) => f.dir === 'emitida' && f.cobrado < f.base * (1 + f.iva) - 1).map((f) => [f.id + ' · vence ' + fdate(f.vence, false), f.base * (1 + f.iva) - f.cobrado]),
      costeini: A.chapters.map((c) => [c.code + ' ' + c.name, U.capCost(c.code)]).filter((x) => x[1]).concat([['Costes indirectos de obra (9 % del PEM)', e.indirectos]]),
      comprometido: [...A.subs.map((s) => ['Subcontrato · ' + s.name, E.subStats(s).contrato]), ...A.supplies.filter((m) => !['cancelado', 'sin_pedido'].includes(m.status)).map((m) => ['Pedido · ' + m.name, m.importe])],
      costereal: A.facturas.filter((f) => f.dir === 'recibida').map((f) => [f.id + ' · ' + f.concepto, f.base]),
      costefinal: [['Coste objetivo', e.costeIni], ...A.cambios.filter((c) => c.com === 'aprobado').map((c) => [c.id + ' · coste del cambio', c.coste]), ...A.desviaciones.filter((d) => ['precios', 'productividad', 'otras', 'retrasos'].includes(d.causa) && d.coste).map((d) => [d.id + ' · ' + d.title, d.coste])],
      pagado: A.movimientos.filter((m) => m.tipo === 'pago').map((m) => [m.id + ' · ' + m.factura, m.importe]),
      pagospend: A.facturas.filter((f) => f.dir === 'recibida' && f.pagado < f.base * (1 + f.iva) - 1).map((f) => [f.id + ' · ' + f.concepto, f.base * (1 + f.iva) - f.pagado]),
    }[key] || [];
    U.modal(`<div class="modal-head"><h2>Origen del importe</h2></div><table class="table compact"><tbody>${list.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="num">${eur(v)}</td></tr>`).join('')}</tbody><tfoot><tr class="total"><td>Total</td><td class="num">${eur(list.reduce((s, x) => s + x[1], 0))}</td></tr></tfoot></table>
      <p class="muted small">Cada línea enlaza con sus documentos en Documentación.</p>`, 'wide');
  });

  /* ═════════ SUBCONTRATAS ═════════ */
  S.subSel = 'S2';
  S.subTab = 'resumen';
  A.views.subcontratas = {
    render() {
      if (S.role === 'sub') S.subSel = 'S4';
      const rows = A.subs.filter((s) => S.role !== 'sub' || s.id === 'S4').map((s) => Object.assign({ s }, E.subStats(s)));
      const sel = rows.find((r) => r.s.id === S.subSel) || rows[0];
      const max = Math.max(...rows.map((r) => r.contrato));
      return `
      <header class="page-head compact"><div><div class="eyebrow">Contratos, avance, certificaciones, facturas, pagos y documentación</div><h1>Subcontratas</h1></div></header>
      <article class="card">
        <div class="table-wrap"><table class="table subs">
          <thead><tr><th>Subcontrata</th><th class="num">Contrato</th><th class="num">Ejecutado</th><th class="num">Certificado</th><th class="num">Facturado</th><th class="num">Pagado</th><th>Valoración</th><th>Situación</th></tr></thead>
          <tbody>${rows.map((r) => `<tr class="${r.s.id === sel.s.id ? 'sel' : ''}" data-action="sub:${r.s.id}" tabindex="0">
            <td><strong>${r.s.name}</strong><div class="muted small">${r.s.trade}</div>
              <div class="stack" style="width:${(r.contrato / max) * 100}%"><i class="s-ej" style="width:${(r.ej / r.contrato) * 100}%"></i><i class="s-cert" style="width:${(r.cert / r.contrato) * 100}%"></i><i class="s-pag" style="width:${(r.pag / r.contrato) * 100}%"></i></div></td>
            <td class="num">${eur(r.contrato)}</td><td class="num">${eur(r.ej)}</td><td class="num">${eur(r.cert)}</td>
            <td class="num ${r.fact > r.cert + 1 ? 'neg' : ''}">${eur(r.fact)}</td><td class="num">${eur(r.pag)}</td><td>${U.stars(Math.round((r.s.val.calidad + r.s.val.plazos + r.s.val.respuesta) / 3))}</td>
            <td>${r.fact > r.cert + 1 ? chip('retrasado', 'Facturado > certificado') : r.ej - r.cert > 1000 ? chip('revision', 'Pendiente de certificar') : chip('validado', 'Al día')}</td>
          </tr>`).join('')}</tbody>
        </table></div>
        <div class="legend in-card"><span><i class="lg-s-ej"></i>Ejecutado</span><span><i class="lg-s-cert"></i>Certificado</span><span><i class="lg-s-pag"></i>Pagado</span></div>
      </article>
      ${subFicha(sel)}`;
    },
  };
  function subFicha(r) {
    const s = r.s, t = S.subTab;
    const acts = A.activities.filter((a) => a.sub === s.id);
    const facs = A.facturas.filter((f) => f.sub === s.id);
    const incs = A.incidencias.filter((i) => i.sub === s.id);
    const docs = A.files.filter((f) => f.folder === 'sub-' + s.id);
    const tabs = [['resumen', 'Resumen'], ['contrato', 'Contrato y modificaciones'], ['cert', 'Certificaciones'], ['facturas', 'Facturas y pagos'], ['incidencias', `Incidencias · ${incs.length}`], ['docs', `Documentación · ${docs.length}`], ['valoracion', 'Valoración']];
    let body = '';
    if (t === 'resumen') body = `<div class="act-grid">
      <div><h3 class="mini">Ficha</h3><dl class="dl"><dt>CIF</dt><dd class="mono">${s.cif}</dd><dt>Especialidad</dt><dd>${s.trade}</dd>${s.contactos.map((c) => `<dt>${c.c}</dt><dd>${c.n} · <span class="mono small">${c.t}</span></dd>`).join('')}<dt>Fechas</dt><dd>${fdate(s.inicio)} – ${fdate(s.fin)}</dd></dl></div>
      <div><h3 class="mini">Alcance contratado</h3><p class="small">${s.alcance}</p><h3 class="mini">Compromisos</h3><ul class="bullets small">${s.compromisos.map((c) => `<li>${c}</li>`).join('')}</ul></div>
      <div><h3 class="mini">Avance de sus trabajos</h3><ul class="bars">${acts.map((a) => `<li><div class="bars-top"><span>${a.name}</span><b>${pct(U.actProgress(a), 0)}</b></div><div class="meter thin"><i style="width:${U.actProgress(a) * 100}%"></i></div></li>`).join('')}</ul></div>
    </div>
    <div class="flow5">${[['Contratado', r.contrato], ['Ejecutado', r.ej], ['Certificado', r.cert], ['Facturado', r.fact], ['Pagado', r.pag]].map(([l, v]) => `<div><span>${l}</span><b>${eur(v)}</b><em>${pct(v / r.contrato, 0)}</em></div>`).join('')}</div>`;
    else if (t === 'contrato') body = `<dl class="dl"><dt>Importe de contrato</dt><dd><b>${eur(r.contrato)}</b> · precios al ${pct(s.factor, 0)} del presupuesto de venta</dd><dt>Retención</dt><dd>5 % hasta la recepción · pago a 60 días</dd></dl>
      <h3 class="mini">Partidas adjudicadas</h3><table class="table compact"><thead><tr><th>Partida</th><th class="num">Medición</th><th class="num">Precio subcontrato</th><th class="num">Importe</th></tr></thead><tbody>${A.partidas.filter((p) => p.sub === s.id).map((p) => `<tr><td><span class="mono">${p.code}</span> ${p.desc}</td><td class="num">${num(p.qty, 2)} ${p.unit}</td><td class="num">${num(p.price * s.factor, 2)} €</td><td class="num">${eur(E.importe(p) * s.factor)}</td></tr>`).join('')}</tbody></table>
      <h3 class="mini">Modificaciones y reformas</h3><ul class="devs">${s.mods.map((m) => `<li><div><strong>${m.d}</strong><span class="muted small">${m.id}</span></div><span>${eur(m.imp)} ${m.st === 'aprobado' ? chip('validado', 'Aprobada') : chip('revision', 'Pendiente')}</span></li>`).join('') || '<li class="muted">Sin modificaciones</li>'}</ul>`;
    else if (t === 'cert') body = `<table class="table compact"><thead><tr><th>Periodo</th><th>Estado</th><th class="num">Importe del periodo</th><th class="num">A origen</th></tr></thead><tbody>${PER[s.id].mes.map((p, i, arr) => `<tr><td>${p.label}</td><td>${U.chipOf(CST, p.status)}</td><td class="num">${eur(U.certOrigen(p, s.id) - (i ? U.certOrigen(arr[i - 1], s.id) : 0))}</td><td class="num">${eur(U.certOrigen(p, s.id))}</td></tr>`).join('')}</tbody></table>
      <button class="btn btn-sm" data-action="subcert:${s.id}">${ic('sheet')}Abrir la certificación del periodo</button>`;
    else if (t === 'facturas') body = `<table class="table compact"><thead><tr><th>Factura</th><th>Vence</th><th class="num">Total</th><th class="num">Pagado</th><th></th></tr></thead><tbody>${facs.map((f) => `<tr><td><span class="mono">${f.id}</span><div class="muted small">${f.concepto}${f.flag ? ' · <span class="neg">' + f.flag + '</span>' : ''}</div></td><td>${fdate(f.vence, false)}</td><td class="num">${eur(f.base * (1 + f.iva))}</td><td class="num">${eur(f.pagado)}</td><td>${f.pagado < f.base * (1 + f.iva) - 1 && U.can('economia') ? `<button class="btn btn-sm" data-action="regpay:${f.id}">Registrar pago</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Sin facturas</td></tr>'}</tbody></table>
      <h3 class="mini">Pagos realizados</h3><ul class="evid">${A.movimientos.filter((m) => m.contraparte === s.name).map((m) => `<li>${ic('euro')}<span>${fdate(m.fecha, false)} · ${eur(m.importe)}${m.parcial ? ' (parcial)' : ''} · ${m.factura}</span></li>`).join('') || '<li class="muted">Sin pagos registrados</li>'}</ul>`;
    else if (t === 'incidencias') body = `<ul class="devs">${incs.map((i) => `<li class="clk" data-action="goto:calidad:${i.id}"><div><strong>${i.id} ${i.title}</strong><span class="muted small">${i.ubic} · vence ${fdate(i.due, false)}</span></div>${U.chipOf(A.incEstados, i.estado)}</li>`).join('') || '<li class="muted">Sin incidencias</li>'}</ul>`;
    else if (t === 'docs') body = `<ul class="devs">${A.requisitos.sub.map((req) => { const f = docs.find((x) => x.req === req); const st = f ? U.docState(f) : 'pendiente'; return `<li><div><strong>${req}</strong><span class="muted small">${f ? fdate(f.date, false) + (f.expires ? ' · caduca ' + fdate(f.expires, false) : '') : 'Sin cargar'}</span></div>${U.chipOf(A.docStatus, st)}</li>`; }).join('')}
      ${docs.filter((f) => !f.req).map((f) => `<li><div><strong>${f.name}</strong><span class="muted small">${fdate(f.date, false)} · ${f.tags.join(', ')}</span></div>${U.chipOf(A.docStatus, U.docState(f))}</li>`).join('')}</ul>
      <button class="btn btn-sm" data-action="goto:documentacion:sub-${s.id}">${ic('folder')}Abrir carpeta en Documentación</button>`;
    else body = `<div class="val-grid">${[['calidad', 'Calidad del trabajo'], ['plazos', 'Cumplimiento de plazos'], ['respuesta', 'Respuesta ante incidencias']].map(([k, l]) => `<div><span>${l}</span>${U.can('subcontratas') ? `<select data-change="subval:${s.id}:${k}" aria-label="${l}">${[1, 2, 3, 4, 5].map((n) => `<option ${s.val[k] === n ? 'selected' : ''}>${n}</option>`).join('')}</select>` : ''}${U.stars(s.val[k])}</div>`).join('')}</div>
      <h3 class="mini">Observaciones para futuras contrataciones</h3><ul class="feed">${s.notas.map((n) => `<li><time>${fdate(n.at, false)}</time><div><strong>${n.who}</strong> ${esc(n.t)}</div></li>`).join('') || '<li class="muted">Sin observaciones</li>'}</ul>
      ${U.can('subcontratas') ? `<form class="form inline-form" id="noteForm"><input id="noteT" placeholder="Añadir una observación" aria-label="Observación"><button class="btn btn-sm">Añadir</button></form>` : ''}`;
    return `<article class="card">
      <div class="card-h wrap"><div><h2>${s.name}</h2><div class="muted small">${s.trade} · ${s.contactos[0].n}</div></div></div>
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${t === k}" data-action="subtab:${k}">${l}</button>`).join('')}</div>
      <div class="card-b">${body}</div></article>`;
  }
  act('sub', (id) => { S.subSel = id; U.rerender(); });
  act('subtab', (t) => { S.subTab = t; U.rerender(); setTimeout(() => { const f = U.$('#noteForm'); if (f) f.addEventListener('submit', (e) => { e.preventDefault(); const v = U.$('#noteT').value.trim(); if (!v) return; U.sub(S.subSel).notas.unshift({ at: A.iso(TODAY), who: U.me(), t: v }); U.log('subcontratas', 'Añadió una observación sobre ' + U.subName(S.subSel)); U.rerender(); }); }); });
  act('subval', (id, k, v) => { const s = U.sub(id); const b = s.val[k]; s.val[k] = +v; U.log('subcontratas', `Valoró ${k} de ${s.short}`, b, +v); U.rerender(); });
  act('subcert', (id) => U.go('certificaciones', () => { S.certSide = id; S.certPer = null; }));

  /* ═════════ CAMBIOS Y DESVIACIONES ═════════ */
  A.views.cambios = {
    render() {
      const sel = A.cambios.find((c) => c.id === S.camSel);
      const sum = (f) => A.cambios.filter(f).reduce((s, c) => s + c.venta, 0);
      return `
      <header class="page-head compact"><div><div class="eyebrow">Modificaciones, extras, trabajos no previstos y desviaciones</div><h1>Cambios y desviaciones</h1></div>
        <div class="head-actions">${U.can('cambios') ? `<button class="btn btn-primary" data-action="newcambio">${ic('plus')}Nuevo cambio</button>` : ''}</div></header>
      <section class="kpis">
        <div class="kpi"><div class="kpi-label">Aprobados</div><div class="kpi-value">${keur(sum((c) => c.com === 'aprobado'))}</div><div class="kpi-foot">Incorporados al presupuesto vigente</div></div>
        <div class="kpi"><div class="kpi-label">Presentados</div><div class="kpi-value">${keur(sum((c) => c.com === 'presentado'))}</div><div class="kpi-foot">Pendientes de respuesta del cliente</div></div>
        <div class="kpi"><div class="kpi-label">Por valorar</div><div class="kpi-value">${A.cambios.filter((c) => c.com === 'valorar').length}</div><div class="kpi-foot">Sin importe cerrado</div></div>
        <div class="kpi"><div class="kpi-label">Impacto en plazo</div><div class="kpi-value">+${A.cambios.filter((c) => c.com !== 'rechazado').reduce((s, c) => s + c.plazo, 0)} d</div><div class="kpi-foot">Si se aprueban todos</div></div>
      </section>
      <article class="card"><div class="card-h"><h2>Cambios de alcance</h2><span class="muted">La aprobación comercial y la ejecución se siguen por separado</span></div>
        <div class="table-wrap"><table class="table subs"><thead><tr><th>Cambio</th><th>Solicitante</th><th>Partidas</th><th class="num">Venta</th><th class="num">Coste</th><th class="num">Plazo</th><th>Comercial</th><th>Ejecución</th></tr></thead>
        <tbody>${A.cambios.map((c) => `<tr class="${S.camSel === c.id ? 'sel' : ''}" data-action="camsel:${c.id}" tabindex="0"><td><span class="mono">${c.id}</span> <strong>${c.title}</strong><div class="muted small">${c.motivo} · ${fdate(c.fecha, false)}</div></td><td>${c.solicitante}</td><td class="mono small">${c.partidas.join(', ')}</td><td class="num">${eur(c.venta)}</td><td class="num">${eur(c.coste)}</td><td class="num">${c.plazo ? '+' + c.plazo + ' d' : '—'}</td><td>${U.chipOf(A.cambioCom, c.com)}</td><td>${U.chipOf(A.cambioEjec, c.ejec)}</td></tr>`).join('')}</tbody></table></div></article>
      ${sel ? cambioDetail(sel) : ''}
      <article class="card"><div class="card-h"><h2>Desviaciones</h2><span class="muted">Causa, responsable y acción correctora</span></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Desviación</th><th>Causa</th><th class="num">Plazo</th><th class="num">Coste</th><th>Responsable</th><th>Acción correctora</th><th>Estado</th></tr></thead>
        <tbody>${A.desviaciones.map((d) => `<tr><td><strong>${d.title}</strong><div class="muted small">${d.area}</div></td>
          <td>${U.can('cambios') ? `<select data-change="descausa:${d.id}" aria-label="Causa">${Object.keys(A.causas).map((k) => `<option value="${k}" ${d.causa === k ? 'selected' : ''}>${A.causas[k]}</option>`).join('')}</select>` : A.causas[d.causa]}</td>
          <td class="num">${d.plazo ? '+' + d.plazo + ' d' : '—'}</td><td class="num">${d.coste ? eur(d.coste) : '—'}</td>
          <td>${U.can('cambios') ? `<select data-change="desresp:${d.id}" aria-label="Responsable">${A.users.filter((u) => ['direccion', 'jefe', 'tecnico', 'admin'].includes(u.role)).map((u) => `<option ${d.resp === u.n ? 'selected' : ''}>${u.n}</option>`).join('')}</select>` : d.resp}</td>
          <td class="small">${esc(d.accion)}</td><td>${{ abierta: chip('retrasado', 'Abierta'), 'en curso': chip('ejecucion', 'En curso'), cerrada: chip('validado', 'Cerrada') }[d.estado]}</td></tr>`).join('')}</tbody></table></div></article>`;
    },
  };
  function cambioDetail(c) {
    const docs = A.files.filter((f) => c.docs.includes(f.id));
    const edit = U.can('cambios'), appr = U.can('cambios', 'approve');
    return `<article class="card"><div class="card-h wrap"><div><h2>${c.id} · ${c.title}</h2><div class="muted small">${c.motivo} · solicitado por ${c.solicitante} el ${fdate(c.fecha)}</div></div><button class="btn btn-sm btn-icon btn-ghost" data-action="camsel:" aria-label="Cerrar">${ic('x')}</button></div>
      <div class="act-grid">
        <div><h3 class="mini">Impacto</h3><dl class="dl"><dt>Venta</dt><dd>${eur(c.venta)} (PEM)</dd><dt>Coste</dt><dd>${eur(c.coste)}</dd><dt>Margen del cambio</dt><dd>${eur(c.venta - c.coste)}</dd><dt>Plazo</dt><dd>${c.plazo ? '+' + c.plazo + ' días' : 'Sin impacto'}</dd></dl></div>
        <div><h3 class="mini">Partidas afectadas</h3>${c.partidas.map((p) => `<button class="linkish" data-action="goto:presupuesto:${p}">${p} ${A.partidaByCode[p].desc}</button>`).join('<br>')}<h3 class="mini">Documentación</h3>${docs.map((f) => `<button class="linkish" data-action="goto:documentacion:${f.folder}">${ic('doc')}${f.name}</button>`).join('<br>') || '<span class="muted">Sin documentos</span>'}</div>
        <div><h3 class="mini">Estado comercial</h3><p>${U.chipOf(A.cambioCom, c.com)}</p><div class="btn-row">
          ${edit && c.com === 'valorar' ? `<button class="btn btn-sm" data-action="camcom:${c.id}:presentado">Presentar al cliente</button>` : ''}
          ${appr && c.com === 'presentado' ? `<button class="btn btn-sm btn-primary" data-action="camcom:${c.id}:aprobado">Aprobar</button><button class="btn btn-sm" data-action="camcom:${c.id}:rechazado">Rechazar</button>` : ''}
          ${!appr && c.com === 'presentado' ? '<span class="muted small">Esperando respuesta del cliente</span>' : ''}</div>
          <h3 class="mini">Ejecución</h3><p>${U.chipOf(A.cambioEjec, c.ejec)}</p><div class="btn-row">
          ${edit && c.ejec === 'pendiente' && c.com !== 'rechazado' ? `<button class="btn btn-sm" data-action="camejec:${c.id}:ejecucion">Iniciar</button>` : ''}
          ${edit && c.ejec === 'ejecucion' ? `<button class="btn btn-sm" data-action="camejec:${c.id}:ejecutado">Marcar ejecutado</button>` : ''}</div>
          ${c.com !== 'aprobado' && c.ejec !== 'pendiente' ? '<p class="neg small">Se está ejecutando sin aprobación comercial.</p>' : ''}</div>
      </div></article>`;
  }
  act('camsel', (id) => { S.camSel = id || null; U.rerender(); });
  act('camcom', (id, st) => {
    const c = A.cambios.find((x) => x.id === id);
    if (!U.guard('cambios', st === 'presentado' ? 'edit' : 'approve')) return;
    const b = U.chipText(A.cambioCom, c.com);
    c.com = st;
    if (st === 'aprobado') A.presHist.push({ at: U.now(), who: U.me(), what: `Modificación aprobada ${c.id} · ${c.title}`, imp: c.venta });
    U.log('cambios', `${c.id}: estado comercial`, b, U.chipText(A.cambioCom, st));
    U.rerender();
  });
  act('camejec', (id, st) => { const c = A.cambios.find((x) => x.id === id); const b = U.chipText(A.cambioEjec, c.ejec); c.ejec = st; U.log('cambios', `${c.id}: ejecución`, b, U.chipText(A.cambioEjec, st)); U.rerender(); });
  act('descausa', (id, _, v) => { const d = A.desviaciones.find((x) => x.id === id); const b = A.causas[d.causa]; d.causa = v; U.log('cambios', `Reclasificó la causa de «${d.title}»`, b, A.causas[v]); });
  act('desresp', (id, _, v) => { const d = A.desviaciones.find((x) => x.id === id); d.resp = v; U.log('cambios', `Asignó «${d.title}» a ${v}`); });
  act('newcambio', () => {
    U.modal(`<div class="modal-head"><h2>Nuevo cambio</h2></div><form class="form" id="camForm">
      <label for="cmT">Descripción</label><input id="cmT" required>
      <div class="row2"><div><label for="cmM">Motivo</label><input id="cmM" placeholder="Solicitud del promotor, error de proyecto…"></div><div><label for="cmS">Solicitante</label><select id="cmS"><option>Promotor</option><option>Comprador</option><option>Dirección de obra</option><option>Constructora</option></select></div></div>
      <label for="cmP">Partida afectada</label><select id="cmP">${A.partidas.map((p) => `<option value="${p.code}">${p.code} ${p.desc}</option>`).join('')}</select>
      <div class="row2"><div><label for="cmV">Importe de venta (PEM)</label><input id="cmV" type="number" step="any" value="0"></div><div><label for="cmC">Coste</label><input id="cmC" type="number" step="any" value="0"></div></div>
      <label for="cmD">Impacto en plazo (días)</label><input id="cmD" type="number" value="0">
      <label for="cmF">Documentación</label><input id="cmF" type="file">
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Registrar</button></div></form>`, 'wide');
    U.$('#camForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = 'CAM-0' + (A.cambios.length + 1);
      const f = U.$('#cmF').files[0];
      const docs = [];
      if (f) { A.files.push({ id: 'DOC-' + id, folder: 'contratos', name: 'Valoración ' + id + ' · ' + f.name, date: A.iso(TODAY), resp: U.me(), status: 'cargado', tags: ['cambio'], links: [{ t: 'cambios', id, label: 'Cambios · ' + id }], size: Math.round(f.size / 1024) + ' kB', type: f.name.split('.').pop().toUpperCase(), url: URL.createObjectURL(f) }); docs.push('DOC-' + id); }
      A.cambios.unshift({ id, title: U.$('#cmT').value, motivo: U.$('#cmM').value || 'Sin indicar', solicitante: U.$('#cmS').value, partidas: [U.$('#cmP').value], venta: +U.$('#cmV').value, coste: +U.$('#cmC').value, plazo: +U.$('#cmD').value, com: 'valorar', ejec: 'pendiente', fecha: A.iso(TODAY), docs });
      U.log('cambios', 'Registró el cambio ' + id + ': ' + U.$('#cmT').value);
      S.camSel = id; U.closeModal(); U.rerender();
    });
  });
})(window.ATL);
