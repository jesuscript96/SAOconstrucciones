/* Atalaya · núcleo de la interfaz: formato, navegación, permisos, avisos, búsqueda, registro y utilidades. */
(function (A) {
  'use strict';
  const E = A.engine, D = A.D, TODAY = A.TODAY;
  const U = (A.ui = {});
  A.views = {};
  A.actions = {};

  /* ───────── Formato ───────── */
  let grouping = 'always';
  try { new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(1000); } catch (e) { grouping = true; }
  const NF = {};
  const nf = (d) => NF[d] || (NF[d] = new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: grouping }));
  U.$ = (s, r = document) => r.querySelector(s);
  U.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  U.num = (v, d = 0) => nf(d).format(v || 0);
  U.eur = (v, d = 0) => U.num(d ? v : Math.round(v || 0), d) + ' €';
  U.keur = (v) => (Math.abs(v) >= 1e6 ? U.num(v / 1e6, 2) + ' M€' : U.num(v / 1e3, 1) + ' k€');
  U.pct = (v, d = 1) => U.num((v || 0) * 100, d) + ' %';
  U.toDate = (d) => (d instanceof Date ? d : typeof d === 'string' && d.length === 10 ? D(d) : new Date(d));
  U.fdate = (d, y = true) => (d ? U.toDate(d).toLocaleDateString('es-ES', y ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }).replace('.', '') : '—');
  U.fdt = (s) => { const d = U.toDate(s); return U.fdate(d, false) + ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); };
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  U.days = (d) => Math.round((U.toDate(d) - TODAY) / A.DAY);
  U.now = () => { const n = new Date(); const t = new Date(TODAY); t.setHours(n.getHours(), n.getMinutes(), n.getSeconds()); return t.toISOString(); };
  U.ago = (iso) => {
    const m = Math.round((new Date(U.now()) - U.toDate(iso)) / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return 'hace ' + m + ' min';
    if (m < 1440) return 'hace ' + Math.round(m / 60) + ' h';
    return 'hace ' + Math.round(m / 1440) + ' d';
  };

  /* ───────── Iconos ───────── */
  const ICONS = {
    panel: '<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>',
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    gantt: '<path d="M4 5h9M7 10h10M10 15h10M4 20h7"/>',
    euro: '<path d="M17.5 6.6A6.5 6.5 0 1 0 17.5 17.4"/><path d="M4.5 10h8.5M4.5 14h8.5"/>',
    db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 16v4h16v-4"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    layers: '<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M9 7V4h6v3M3 12h18"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5 6-5s5.4 1.6 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c2.6.2 4.4 1.8 5 4.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    sheet: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16"/>',
    swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4M12 8v4l3 2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
    wifiOff: '<path d="M3 3l18 18M8.5 16a5 5 0 0 1 7 0M5.5 12.5a9.5 9.5 0 0 1 4.6-2.4M14 10.3a9.5 9.5 0 0 1 4.5 2.2M2.5 9a14 14 0 0 1 4.3-2.8M11 5.1A14 14 0 0 1 21.5 9"/><circle cx="12" cy="19" r="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    pin: '<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    sort: '<path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  };
  U.ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.doc}</svg>`;
  const ic = U.ic;

  /* ───────── Estados y chips ───────── */
  U.STATE = {
    validado: ['Validado', 'st-ok'],
    ejecucion: ['En ejecución', 'st-progress'],
    revision: ['Pendiente de revisión', 'st-review'],
    terminado: ['Aparentemente terminado', 'st-review'],
    no_iniciado: ['No iniciado', 'st-none'],
    no_observable: ['No observable', 'st-unknown'],
    retrasado: ['Retrasado', 'st-late'],
  };
  U.chip = (s, label) => {
    const st = U.STATE[s];
    return `<span class="chip ${st ? st[1] : s}"><i></i>${label || (st ? st[0] : s)}</span>`;
  };
  U.chipOf = (map, k) => (map[k] ? `<span class="chip ${map[k][1]}"><i></i>${map[k][0]}</span>` : '');
  U.subName = (id) => (A.subs.find((s) => s.id === id) || {}).short || 'Sin adjudicar';
  U.sub = (id) => A.subs.find((s) => s.id === id);
  U.prov = (id) => A.proveedores.find((p) => p.id === id);
  U.partida = (code) => A.partidaByCode[code];
  U.stageName = (set, k) => ((A.stageSets[set] || []).find((s) => s.key === k) || {}).name || k;
  U.stars = (n) => '<span class="stars" aria-label="' + n + ' de 5">' + [1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}">${ic('star')}</i>`).join('') + '</span>';

  /* ───────── Estado de la interfaz ───────── */
  const S = (U.S = {
    view: 'panel', role: 'jefe', offline: false, queue: [], seenAlerts: 0,
    capSel: 'CAP-031', capFilter: 'todas', overlay: false, boxes: true, capView: 0,
    viv: 'P1B', room: 0, precierre: { P1C: false, P1D: false }, uploads: 0,
  });
  const USERS = { direccion: 'Andrea Soler', jefe: 'Marcos Ferrer', admin: 'Rosa Llorens', tecnico: 'Lucía Montané', sub: 'Raúl Navarro', cliente: 'Ignacio Bosch' };
  U.me = () => USERS[S.role];
  U.roleName = (r) => (A.roles.find((x) => x.id === (r || S.role)) || {}).name;

  /* ───────── Permisos ───────── */
  const RANK = { none: 0, view: 1, edit: 2, approve: 3 };
  U.level = (mod) => (A.perms[S.role] || {})[mod] || 'none';
  U.can = (mod, need = 'edit') => RANK[U.level(mod)] >= RANK[need];
  U.guard = (mod, need = 'edit') => {
    if (U.can(mod, need)) return true;
    toast(`${ic('shield')}<span>El perfil <b>${U.roleName()}</b> no puede ${need === 'approve' ? 'aprobar' : 'modificar'} en este apartado.</span>`, 'warn');
    return false;
  };

  /* ───────── Registro de cambios ───────── */
  U.log = (mod, what, before, after) => {
    const entry = { at: U.now(), who: U.me(), mod, what, before, after, pending: S.offline };
    A.audit.unshift(entry);
    if (S.offline) { S.queue.push(entry); renderTop(); }
  };

  /* ───────── Avisos flotantes y modales ───────── */
  function toast(html, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.setAttribute('role', 'status');
    t.innerHTML = html;
    U.$('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 4600);
    setTimeout(() => t.remove(), 5000);
  }
  U.toast = toast;
  U.modal = (html, cls = '') => {
    const m = U.$('#modal');
    U.$('.modal-box', m).className = 'modal-box ' + cls;
    U.$('.modal-body', m).innerHTML = html;
    m.hidden = false;
    const f = U.$('input:not([type=checkbox]), select, textarea, button', U.$('.modal-body', m));
    if (f) f.focus();
  };
  U.closeModal = () => { U.$('#modal').hidden = true; };

  /* ───────── Descargas y librerías bajo demanda ───────── */
  const libs = {
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    autotable: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
    xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  };
  const loading = {};
  U.lib = (name) => loading[name] || (loading[name] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = libs[name];
    s.onload = res;
    s.onerror = () => { delete loading[name]; rej(new Error('No se pudo cargar ' + name)); };
    document.head.appendChild(s);
  }));
  let dlCap;
  U.download = async (filename, data) => {
    try {
      if (window.claude && window.claude.use) {
        dlCap = dlCap === undefined ? await window.claude.use('downloads') : dlCap;
        if (dlCap) {
          await dlCap.save({ filename, data });
          toast(`${ic('download')}<span>Descarga preparada: <b>${U.esc(filename)}</b></span>`, 'ok');
          return;
        }
      }
    } catch (err) {
      if (err && err.code === 'declined') return;
      if (err && err.code !== 'unavailable') { toast(`${ic('alert')}<span>No se pudo guardar el archivo (${U.esc(err.code || err.message)}).</span>`, 'warn'); return; }
    }
    const blob = data instanceof Blob ? data : new Blob([data]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  // Hoja de cálculo real a partir de filas
  U.exportXlsx = async (filename, sheets) => {
    await U.lib('xlsx');
    const wb = window.XLSX.utils.book_new();
    sheets.forEach((s) => {
      const ws = window.XLSX.utils.aoa_to_sheet(s.rows);
      if (s.widths) ws['!cols'] = s.widths.map((w) => ({ wch: w }));
      window.XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
    });
    const out = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    await U.download(filename, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  };

  /* ───────── Indicadores comunes ───────── */
  U.stats = () => {
    const pem = E.pem();
    const ej = E.ejecutado();
    const pl = E.planificado();
    const cert = E.ejecutado(D('2026-08-31'));
    return { pem, ej, pl, cert, avance: ej / pem, plan: pl / pem };
  };
  U.pendingCaps = () => {
    let caps = 0, props = 0;
    A.captures.forEach((c) => {
      if (c.status === 'pendiente_analisis') { caps++; props += (c.proposals || []).length; }
      if (c.status === 'pendiente_revision') { caps++; props += c.proposals.filter((p) => !p.resolved).length; }
    });
    return { caps, props };
  };
  U.docState = (f) => {
    if (f.expires && U.toDate(f.expires) < TODAY) return 'caducado';
    return f.status || 'cargado';
  };

  /* ───────── Avisos (centralizados) ───────── */
  U.alerts = (all) => {
    const list = [];
    const add = (o) => list.push(o);
    A.supplies.forEach((m) => {
      if (m.status === 'sin_pedido') {
        const ob = E.orderBy(m), dd = E.daysTo(ob);
        if (dd <= 14) add({ cat: 'pedidos', sev: dd <= 7 ? 'crit' : 'warn', icon: 'truck', title: `Pedir ${m.name.toLowerCase()} antes del ${U.fdate(ob, false)}`, detail: `${m.scope}. Se necesita el ${U.fdate(m.needed, false)} y el plazo de suministro es de ${m.lead} días. No consta pedido.`, action: `order:${m.id}`, actionLabel: 'Registrar pedido', go: 'suministros' });
      }
      if (m.status === 'retraso') add({ cat: 'pedidos', sev: 'crit', icon: 'truck', title: `Entrega retrasada: ${m.name.toLowerCase()}`, detail: `${m.ref}. Bloquea la actividad «${(A.activities.find((a) => a.id === m.act) || {}).name}».`, action: `goto:suministros:${m.id}`, actionLabel: 'Ver pedido' });
      if (['confirmado', 'parcial'].includes(m.status) && m.entrega && U.toDate(m.entrega) > U.toDate(m.needed)) add({ cat: 'pedidos', sev: 'warn', icon: 'truck', title: `${m.name} llega después de la fecha necesaria`, detail: `Entrega prevista ${U.fdate(m.entrega, false)}, necesaria ${U.fdate(m.needed, false)}. Compromete «${(A.activities.find((a) => a.id === m.act) || {}).name}».`, action: `goto:suministros:${m.id}`, actionLabel: 'Ver pedido' });
    });
    const a5 = A.activities.find((a) => a.id === 'A05');
    const delay = Math.round((D(a5.real[1]) - D(a5.plan[1])) / A.DAY);
    add({ cat: 'plazos', sev: 'crit', icon: 'gantt', title: `Forjado de cubierta con ${delay} días de retraso`, detail: 'Está en la ruta crítica: desplaza la impermeabilización al 13 oct y la entrega al 8 jul 2027 si no se recupera.', action: 'goto:planificacion:A05', actionLabel: 'Ver planificación' });
    const pre = Object.keys(S.precierre).filter((k) => !S.precierre[k]);
    if (pre.length) add({ cat: 'docs', sev: 'warn', icon: 'camera', title: `Falta la foto previa al cierre en ${pre.map((k) => A.vivName(k.slice(0, 2), k[2])).join(' y ')}`, detail: 'Instalaciones validadas por parte de obra sin evidencia fotográfica. Hay que capturarlas antes de colocar la placa (prevista el 5 oct).', action: 'newcap', actionLabel: 'Subir captura' });
    A.files.forEach((f) => {
      const st = U.docState(f);
      if (st === 'caducado') add({ cat: 'docs', sev: 'warn', icon: 'doc', title: `Documento caducado: ${f.name}`, detail: `Caducó el ${U.fdate(f.expires, false)}. Pide la versión actualizada.`, action: `goto:documentacion:${f.folder}`, actionLabel: 'Ver documento' });
      else if (f.expires && U.days(f.expires) <= 30 && U.days(f.expires) >= 0) add({ cat: 'docs', sev: 'info', icon: 'doc', title: `${f.name} caduca el ${U.fdate(f.expires, false)}`, detail: 'Solicita la renovación antes de esa fecha.', action: `goto:documentacion:${f.folder}`, actionLabel: 'Ver documento' });
    });
    const missing = U.missingDocs();
    if (missing.length) add({ cat: 'docs', sev: 'info', icon: 'folder', title: `${missing.length} documentos requeridos sin cargar`, detail: missing.slice(0, 3).map((m) => m.req).join(' · ') + (missing.length > 3 ? '…' : ''), action: 'goto:documentacion:obra', actionLabel: 'Ver documentación' });
    A.incidencias.forEach((i) => {
      if (['abierta', 'asignada'].includes(i.estado) && U.toDate(i.due) < TODAY) add({ cat: 'incidencias', sev: i.prio === 'alta' ? 'crit' : 'warn', icon: 'flag', title: `Incidencia fuera de plazo: ${i.title.toLowerCase()}`, detail: `${i.ubic} · ${U.subName(i.sub)} · vencía el ${U.fdate(i.due, false)}`, action: `goto:calidad:${i.id}`, actionLabel: 'Ver incidencia' });
    });
    A.facturas.forEach((f) => {
      const total = f.base * (1 + f.iva);
      const done = f.dir === 'emitida' ? f.cobrado : f.pagado;
      if (done >= total - 1) return;
      const dd = U.days(f.vence);
      if (dd <= 7) add({ cat: 'vencimientos', sev: dd < 0 ? 'warn' : 'info', icon: 'euro', title: `${f.dir === 'emitida' ? 'Cobro' : 'Pago'} ${dd < 0 ? 'vencido' : 'próximo'}: ${f.id}`, detail: `${U.eur(total - done)} · vence el ${U.fdate(f.vence, false)} · ${f.dir === 'emitida' ? f.a : U.subName(f.sub) || (U.prov(f.prov) || {}).name}`, action: 'goto:economia:vencimientos', actionLabel: 'Ver vencimientos' });
    });
    const exc = A.facturas.find((f) => f.flag && f.id === 'FAC-A-0412');
    if (exc) add({ cat: 'vencimientos', sev: 'warn', icon: 'euro', title: 'La factura FAC-A-0412 supera lo certificado', detail: 'Cerramientos Albufera ha facturado 4.180 € más que lo certificado a origen.', action: 'goto:subcontratas:S3', actionLabel: 'Ver subcontrata' });
    const pc = U.pendingCaps();
    if (pc.caps) add({ cat: 'capturas', sev: 'info', icon: 'spark', title: `${pc.caps} capturas pendientes de análisis o revisión`, detail: `${pc.props} propuestas de avance esperan la validación del jefe de obra.`, action: 'goto:capturas', actionLabel: 'Revisar' });
    const appr = [];
    (U.certPeriods ? U.certPeriods() : []).forEach((p) => { if (p.status === 'revision') appr.push(`Certificación ${p.label}`); });
    A.cambios.filter((c) => c.com === 'presentado').forEach((c) => appr.push(c.id));
    A.decisiones.filter((d) => d.estado === 'pendiente').forEach((d) => appr.push(d.id));
    if (appr.length) add({ cat: 'aprobaciones', sev: 'info', icon: 'check', title: `${appr.length} aprobaciones o decisiones pendientes`, detail: appr.join(' · '), action: 'goto:reuniones', actionLabel: 'Ver pendientes' });
    const order = { crit: 0, warn: 1, info: 2 };
    const sevRank = { info: 0, warn: 1, crit: 2 };
    const res = all ? list : list.filter((a) => { const c = A.alertCats.find((x) => x.id === a.cat); return !c || (c.on && sevRank[a.sev] >= sevRank[c.min]); });
    return res.sort((a, b) => order[a.sev] - order[b.sev]);
  };
  U.alertHTML = (a) => `<li class="alert sev-${a.sev}">
      <span class="alert-ic">${ic(a.icon)}</span>
      <div class="alert-txt"><strong>${a.title}</strong><span>${a.detail}</span></div>
      ${a.action ? `<button class="btn btn-sm" data-action="${a.action}">${a.actionLabel}</button>` : ''}
    </li>`;
  U.missingDocs = () => {
    const out = [];
    Object.keys(A.requisitos).forEach((fid) => {
      if (fid === 'sub') {
        A.subs.forEach((s) => A.requisitos.sub.forEach((r) => { if (!A.files.some((f) => f.folder === 'sub-' + s.id && f.req === r)) out.push({ folder: 'sub-' + s.id, req: r + ' · ' + s.short }); }));
      } else A.requisitos[fid].forEach((r) => { if (!A.files.some((f) => f.folder === fid && f.req === r)) out.push({ folder: fid, req: r }); });
    });
    return out;
  };

  /* ───────── Navegación ───────── */
  U.NAV = [
    { items: [['cartera', 'Cartera de obras', 'briefcase']] },
    { group: 'Obra', items: [['panel', 'Panel', 'panel'], ['modelo', 'Modelo BIM', 'cube'], ['interiores', 'Interiores', 'home'], ['planificacion', 'Planificación', 'gantt']] },
    { group: 'Campo', items: [['capturas', 'Capturas e IA', 'camera'], ['diario', 'Diario y fotos', 'book'], ['calidad', 'Calidad e incidencias', 'flag']] },
    { group: 'Compras', items: [['suministros', 'Suministros', 'truck'], ['subcontratas', 'Subcontratas', 'users']] },
    { group: 'Economía', items: [['presupuesto', 'Presupuesto', 'list'], ['certificaciones', 'Certificaciones', 'sheet'], ['economia', 'Control económico', 'euro'], ['cambios', 'Cambios y desviaciones', 'swap']] },
    { group: 'Gestión', items: [['documentacion', 'Documentación', 'folder'], ['reuniones', 'Reuniones y tareas', 'chat'], ['informes', 'Informes', 'doc'], ['entregas', 'Entregas y posventa', 'key']] },
    { group: 'Ajustes', items: [['datos', 'Datos e integraciones', 'db'], ['usuarios', 'Usuarios y permisos', 'shield'], ['registro', 'Registro de cambios', 'history']] },
  ];
  U.viewTitle = (id) => { for (const g of U.NAV) for (const it of g.items) if (it[0] === id) return it[1]; return ''; };
  function renderNav() {
    const pc = U.pendingCaps();
    const inc = A.incidencias.filter((i) => i.estado === 'abierta' || i.estado === 'asignada').length;
    const badges = { capturas: pc.caps, calidad: inc };
    U.$('#nav').innerHTML = U.NAV.map((g) => {
      const items = g.items.filter(([id]) => U.can(id, 'view'));
      if (!items.length) return '';
      return `<div class="nav-group">${g.group ? `<div class="nav-h">${g.group}</div>` : ''}${items.map(([id, label, icon]) => `<a class="navlink" href="#${id}" aria-current="${S.view === id ? 'page' : 'false'}">${ic(icon)}<span class="lbl">${label}</span>${badges[id] ? `<b class="nav-badge">${badges[id]}</b>` : ''}</a>`).join('')}</div>`;
    }).join('');
  }
  U.renderNav = renderNav;

  function renderTop() {
    const al = U.alerts();
    const top = U.$('#topActions');
    if (!top) return;
    top.innerHTML = `
      <button class="search-btn" data-action="search" aria-label="Buscar en la obra">${ic('search')}<span>Buscar vivienda, partida, factura…</span><kbd>⌘K</kbd></button>
      <button class="btn btn-sm btn-ghost net ${S.offline ? 'off' : ''}" data-action="offline" title="Simular trabajo sin conexión">${ic(S.offline ? 'wifiOff' : 'wifi')}<span>${S.offline ? 'Sin conexión' + (S.queue.length ? ' · ' + S.queue.length + ' pendientes' : '') : 'En línea'}</span></button>
      <label class="role-pick" title="Ver la aplicación con otro perfil">${ic('eye')}<select id="rolePick" data-change="role" aria-label="Ver como">${A.roles.map((r) => `<option value="${r.id}" ${S.role === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>
      <button class="btn btn-sm btn-ghost btn-icon bell" data-action="bell" aria-label="Avisos">${ic('bell')}${al.length ? `<b>${al.length}</b>` : ''}</button>
      <button class="btn btn-sm btn-ghost btn-icon" data-action="theme" aria-label="Cambiar tema claro u oscuro">${ic('moon')}</button>`;
    const crumbs = U.$('#crumbs');
    if (crumbs) crumbs.innerHTML = S.view === 'cartera' ? '<b>Cartera de obras</b>' : `<a href="#cartera">Cartera</a> · Mirador del Turia · <b>${U.viewTitle(S.view)}</b>`;
    const ban = U.$('#banner');
    const lvl = U.level(S.view);
    const msgs = [];
    if (S.offline) msgs.push(`${ic('wifiOff')}<span>Trabajando sin conexión. Los cambios se guardan en el dispositivo y se sincronizarán al recuperar cobertura${S.queue.length ? ` (${S.queue.length} pendientes)` : ''}.</span>`);
    if (S.role !== 'jefe' && lvl === 'view') msgs.push(`${ic('eye')}<span>Vista de consulta para el perfil <b>${U.roleName()}</b>: puedes ver este apartado pero no modificarlo.</span>`);
    ban.innerHTML = msgs.map((m) => `<div class="banner-row">${m}</div>`).join('');
    ban.hidden = !msgs.length;
    const u = U.$('#sideUser');
    if (u) u.innerHTML = `<span class="avatar">${U.me().split(' ').map((x) => x[0]).join('').slice(0, 2)}</span><div>${U.me()}<span>${U.roleName()}</span></div>`;
  }
  U.renderTop = renderTop;

  /* ───────── Router ───────── */
  U.render = function () {
    const h = (location.hash || '').replace('#', '');
    S.view = A.views[h] ? h : (S.role === 'sub' ? 'interiores' : 'panel');
    const main = U.$('#view');
    if (!U.can(S.view, 'view')) {
      main.innerHTML = `<div class="empty-page">${ic('shield')}<h1>Sin acceso</h1><p class="muted">El perfil ${U.roleName()} no tiene acceso a ${U.viewTitle(S.view).toLowerCase()}.</p><a class="btn" href="#panel">Ir al panel</a></div>`;
    } else {
      const v = A.views[S.view];
      main.innerHTML = v.render();
      main.dataset.view = S.view;
      if (v.mount) v.mount();
    }
    document.body.classList.remove('nav-open');
    renderNav();
    renderTop();
  };
  U.rerender = function () {
    const y = window.scrollY;
    U.render();
    window.scrollTo(0, y);
  };
  U.go = (view, setup) => {
    if (setup) setup();
    if (location.hash === '#' + view) U.rerender();
    else location.hash = view;
  };

  /* ───────── Búsqueda global ───────── */
  function searchIndex() {
    const idx = [];
    const add = (kind, label, sub, go) => idx.push({ kind, label, sub, go, hay: (kind + ' ' + label + ' ' + sub).toLowerCase() });
    A.vivs.forEach((v) => add('Vivienda', 'Vivienda ' + v.name, A.levels.find((l) => l.id === v.level).name, () => U.go('interiores', () => { S.viv = v.key; })));
    A.partidas.forEach((p) => add('Partida', p.code + ' ' + p.desc, p.unit + ' · ' + U.subName(p.sub), () => U.go('presupuesto', () => { S.presOpen = { [p.cap]: true }; S.presHi = p.code; })));
    A.subs.forEach((s) => add('Subcontrata', s.name, s.trade, () => U.go('subcontratas', () => { S.subSel = s.id; })));
    A.proveedores.forEach((p) => add('Proveedor', p.name, p.cats.join(', '), () => U.go('suministros', () => { S.supTab = 'proveedores'; S.provSel = p.id; })));
    A.facturas.forEach((f) => add('Factura', f.id + ' · ' + f.concepto, U.eur(f.base * (1 + f.iva)), () => U.go('economia', () => { S.ecoTab = 'facturas'; S.ecoHi = f.id; })));
    A.supplies.forEach((m) => add('Pedido', m.name, m.scope, () => U.go('suministros', () => { S.supTab = 'pedidos'; S.supSel = m.id; })));
    A.planos.forEach((p) => add('Plano', p.id + ' ' + p.title, p.disc + ' · rev. ' + p.revs[p.revs.length - 1].r, () => U.go('documentacion', () => { S.docFolder = 'planos'; S.planoSel = p.id; })));
    A.files.forEach((f) => add('Documento', f.name, (A.folders.find((x) => x.id === f.folder) || { name: 'Subcontratas' }).name, () => U.go('documentacion', () => { S.docFolder = f.folder; S.docHi = f.id; })));
    A.incidencias.forEach((i) => add('Incidencia', i.id + ' ' + i.title, i.ubic, () => U.go('calidad', () => { S.incSel = i.id; S.calTab = 'incidencias'; })));
    A.cambios.forEach((c) => add('Cambio', c.id + ' ' + c.title, U.chipText(A.cambioCom, c.com), () => U.go('cambios', () => { S.camSel = c.id; })));
    A.tareas.forEach((t) => add('Tarea', t.t, t.resp, () => U.go('reuniones', () => { S.reuTab = 'tareas'; })));
    A.activities.forEach((a) => add('Actividad', a.name, 'Planificación', () => U.go('planificacion', () => { S.actSel = a.id; })));
    A.elements.forEach((e) => add('Elemento BIM', e.name, e.id + ' · ' + e.ifc, () => U.go('modelo', () => { A.viewer.selected = e.id; S.focusEl = e.id; })));
    return idx;
  }
  U.chipText = (map, k) => (map[k] ? map[k][0] : k);
  let sIdx = null, sRes = [];
  function openSearch() {
    sIdx = searchIndex();
    U.modal(`<div class="search-box"><label class="search-in">${ic('search')}<input id="gsearch" type="search" placeholder="Busca una vivienda, partida, empresa, factura, plano o documento" autocomplete="off" aria-label="Buscar"></label><ul class="search-res" id="gres"></ul><p class="muted small">Enter abre el primer resultado · Esc cierra</p></div>`, 'wide');
    const inp = U.$('#gsearch');
    const run = () => {
      const q = inp.value.trim().toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      sRes = words.length ? sIdx.filter((x) => words.every((w) => x.hay.includes(w))).slice(0, 40) : [];
      const groups = {};
      sRes.forEach((r, i) => { (groups[r.kind] = groups[r.kind] || []).push([r, i]); });
      U.$('#gres').innerHTML = words.length ? (sRes.length ? Object.keys(groups).map((k) => `<li class="sr-h">${k}</li>` + groups[k].slice(0, 6).map(([r, i]) => `<li><button data-action="sres:${i}"><strong>${U.esc(r.label)}</strong><span>${U.esc(r.sub)}</span></button></li>`).join('')).join('') : '<li class="muted pad-s">Sin resultados</li>') : '<li class="muted pad-s">Prueba con «1ºB», «hormigón», «Albufera», «A-102» o «licencia».</li>';
    };
    inp.addEventListener('input', run);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && sRes[0]) { U.closeModal(); sRes[0].go(); } });
    run();
  }
  U.act = (name, fn) => { A.actions[name] = fn; };
  U.act('search', openSearch);
  U.act('sres', (i) => { const r = sRes[+i]; U.closeModal(); if (r) r.go(); });

  /* ───────── Centro de avisos ───────── */
  function openBell() {
    const al = U.alerts();
    const cats = {};
    al.forEach((a) => (cats[a.cat] = cats[a.cat] || []).push(a));
    U.modal(`<div class="modal-head"><h2>Avisos</h2><button class="btn btn-sm" data-action="alertcfg">${ic('cog')}Configurar</button></div>
      ${al.length ? Object.keys(cats).map((c) => `<h3 class="mini">${A.alertCats.find((x) => x.id === c).name}</h3><ul class="alert-list flat">${cats[c].map(U.alertHTML).join('')}</ul>`).join('') : '<p class="muted">No hay avisos con la configuración actual.</p>'}`, 'wide');
  }
  function alertConfig() {
    U.modal(`<div class="modal-head"><h2>Configurar avisos</h2></div><p class="muted">Elige qué avisos recibe ${U.me()} y desde qué prioridad, para no acumular notificaciones poco útiles.</p>
      <table class="table compact"><thead><tr><th>Categoría</th><th>Activo</th><th>Prioridad mínima</th></tr></thead><tbody>
      ${A.alertCats.map((c) => `<tr><td>${c.name}</td><td><input type="checkbox" ${c.on ? 'checked' : ''} data-change="alerton:${c.id}" aria-label="Activar ${c.name}"></td><td><select data-change="alertmin:${c.id}" aria-label="Prioridad mínima">${[['info', 'Todas'], ['warn', 'Importantes'], ['crit', 'Solo críticas']].map(([v, l]) => `<option value="${v}" ${c.min === v ? 'selected' : ''}>${l}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table><div class="form-actions"><button class="btn btn-primary" data-action="bell">Guardar</button></div>`, 'wide');
  }
  U.act('bell', openBell);
  U.act('alertcfg', alertConfig);
  U.act('alerton', (id, _, val, el) => { A.alertCats.find((c) => c.id === id).on = el.checked; renderTop(); });
  U.act('alertmin', (id, _, val) => { A.alertCats.find((c) => c.id === id).min = val; renderTop(); });

  /* ───────── Perfiles, conexión y tema ───────── */
  U.act('role', (a, b, val) => {
    S.role = val;
    U.toast(`${ic('eye')}<span>Viendo la aplicación como <b>${U.roleName()}</b> (${U.me()}).</span>`);
    if (!U.can(S.view, 'view')) location.hash = val === 'sub' ? 'interiores' : 'panel';
    U.rerender();
  });
  U.act('offline', () => {
    if (!S.offline) { S.offline = true; S.queue = []; U.toast(`${ic('wifiOff')}<span>Modo sin conexión activado. Prueba a validar o registrar algo.</span>`); renderTop(); return; }
    S.offline = false;
    const n = S.queue.length;
    renderTop();
    if (!n) { U.toast(`${ic('wifi')}<span>Conexión recuperada. No había cambios pendientes.</span>`, 'ok'); return; }
    U.toast(`${ic('wifi')}<span>Sincronizando ${n} cambios…</span>`);
    setTimeout(() => {
      A.audit.forEach((a) => { a.pending = false; });
      const first = S.queue[0];
      U.modal(`<div class="modal-head"><h2>Conflicto al sincronizar</h2></div>
        <p>${n - 1 ? n - 1 + ' cambios se han sincronizado sin problemas. ' : ''}Uno de ellos coincide con una modificación hecha desde la oficina mientras estabas sin conexión:</p>
        <div class="conflict"><div><h3 class="mini">Tu cambio (sin conexión)</h3><p>${U.esc(first.what)}</p><span class="muted small">${U.fdt(first.at)} · ${first.who}</span></div>
        <div><h3 class="mini">Cambio en la oficina</h3><p>Rosa Llorens revisó el mismo registro y añadió una observación.</p><span class="muted small">${U.fdt(U.now())}</span></div></div>
        <div class="form-actions"><button class="btn" data-action="conflict:office">Quedarme con el de la oficina</button><button class="btn btn-primary" data-action="conflict:mine">Conservar los dos</button></div>`);
      S.queue = [];
      renderTop();
    }, 1100);
  });
  U.act('conflict', (w) => { U.closeModal(); U.toast(`${ic('check')}<span>Conflicto resuelto: ${w === 'mine' ? 'se conservan ambos cambios con su autoría' : 'se mantiene la versión de la oficina'}. Queda en el registro.</span>`, 'ok'); U.log('registro', 'Resolvió un conflicto de sincronización'); });
  U.act('theme', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('atalaya-theme', root.dataset.theme); } catch (err) { /* sin almacenamiento */ }
    A.viewer.applyTheme();
    U.rerender();
  });
  U.act('menu', () => document.body.classList.toggle('nav-open'));
  U.act('closemodal', U.closeModal);
  U.act('go', (v) => { location.hash = v; });
  // Ir a un registro concreto desde un aviso, cifra o vínculo
  U.act('goto', (view, id) => {
    U.closeModal();
    const set = {
      suministros: () => { S.supTab = 'pedidos'; S.supSel = id; },
      planificacion: () => { S.actSel = id; },
      documentacion: () => { S.docFolder = id || 'obra'; },
      calidad: () => { S.calTab = 'incidencias'; S.incSel = id; },
      economia: () => { S.ecoTab = id || 'resumen'; },
      subcontratas: () => { S.subSel = id; },
      capturas: () => {},
      reuniones: () => { S.reuTab = 'decisiones'; },
      cambios: () => { S.camSel = id; },
      interiores: () => { if (id) S.viv = id; },
      certificaciones: () => {},
      entregas: () => { S.entTab = id || 'preparacion'; },
      informes: () => {},
      presupuesto: () => { if (id) { S.presOpen = { [id.slice(0, 2)]: true }; S.presHi = id; } },
    }[view];
    U.go(view, set);
  });

  /* ───────── Delegación de eventos ───────── */
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('nav-open') && !e.target.closest('.side') && !e.target.closest('.menu-btn')) { document.body.classList.remove('nav-open'); e.preventDefault(); return; }
    const t = e.target.closest('[data-action]');
    if (!t) return;
    if ((t.tagName === 'INPUT' && t.type !== 'button') || t.tagName === 'SELECT') return;
    const parts = t.dataset.action.split(':');
    const fn = A.actions[parts[0]];
    if (!fn) return;
    if (t.tagName === 'A' && t.getAttribute('href') === '#') e.preventDefault();
    fn(parts[1], parts[2], undefined, t, e, parts[3]);
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    const spec = t.dataset && t.dataset.change;
    if (!spec) return;
    const parts = spec.split(':');
    const fn = A.actions[parts[0]];
    if (fn) fn(parts[1], parts[2], t.type === 'checkbox' ? t.checked : t.value, t, e);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
    if (e.key === 'Escape' && !U.$('#modal').hidden) U.closeModal();
    const r = e.target.closest && e.target.closest('[role="button"][data-action]');
    if (r && r.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  U.boot = function () {
    const n0 = new Date(U.now());
    A.project.updated = { avance: new Date(n0 - 22 * 6e4).toISOString(), economia: new Date(n0 - 75 * 6e4).toISOString(), plan: new Date(n0 - 15 * 36e5).toISOString() };
    U.$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') U.closeModal(); });
    try { const th = localStorage.getItem('atalaya-theme'); if (th) document.documentElement.dataset.theme = th; } catch (err) { /* sin almacenamiento */ }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { A.viewer.applyTheme(); U.rerender(); });
    window.addEventListener('hashchange', () => { U.render(); window.scrollTo(0, 0); });
    U.render();
  };
})(window.ATL);
