/* Atalaya · documentación, planos, calidad, diario, reuniones, informes, entregas, datos, usuarios y registro. */
(function (A) {
  'use strict';
  const U = A.ui, S = U.S, E = A.engine, D = A.D, TODAY = A.TODAY;
  const { ic, chip, num, eur, keur, pct, fdate, fdt, esc } = U;
  const act = U.act;
  const P = A.project;
  const newId = (pre) => pre + '-' + Date.now().toString(36).slice(-5).toUpperCase();
  const fileRec = (f, extra) => Object.assign({ id: newId('DOC'), name: f.name, date: A.iso(TODAY), resp: U.me(), status: 'cargado', tags: [], links: [], size: f.size > 1e6 ? num(f.size / 1e6, 1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' kB', type: (f.name.split('.').pop() || '').toUpperCase(), url: URL.createObjectURL(f), mime: f.type }, extra);

  /* ═════════ DOCUMENTACIÓN ═════════ */
  S.docFolder = 'obra';
  const folderName = (id) => { for (const f of A.folders) { if (f.id === id) return f.name; for (const c of f.children || []) if (c.id === id) return 'Subcontratas › ' + c.name; } return id; };
  const reqsOf = (fid) => (fid.startsWith('sub-') ? A.requisitos.sub : A.requisitos[fid] || []);
  const filesIn = (fid) => A.files.filter((f) => f.folder === fid);
  function folderStats(fid) {
    const reqs = reqsOf(fid);
    const fs = filesIn(fid);
    const done = reqs.filter((r) => fs.some((f) => f.req === r && U.docState(f) === 'cargado')).length;
    return { reqs: reqs.length, done, files: fs.length, bad: fs.filter((f) => U.docState(f) === 'caducado').length };
  }
  A.views.documentacion = {
    render() {
      if (S.role === 'sub' && !S.docFolder.startsWith('sub-S4')) S.docFolder = 'sub-S4';
      if (S.role === 'cliente' && !['cliente', 'informes', 'planos', 'entrega'].includes(S.docFolder)) S.docFolder = 'cliente';
      const fid = S.docFolder;
      const visible = (id) => (S.role === 'sub' ? id === 'subs' || id === 'sub-S4' : S.role === 'cliente' ? ['cliente', 'informes', 'planos', 'entrega'].includes(id) : true);
      const tree = A.folders.filter((f) => visible(f.id)).map((f) => {
        const st = f.children ? null : folderStats(f.id);
        return `<li><button class="folder ${fid === f.id ? 'active' : ''}" data-action="docf:${f.id}">${ic(f.id === 'planos' ? 'map' : 'folder')}<span>${f.name}</span>${f.id === 'planos' ? `<em>${A.planos.length}</em>` : st && st.reqs ? `<em class="${st.done < st.reqs ? 'warn' : ''}">${st.done}/${st.reqs}</em>` : st ? `<em>${st.files}</em>` : ''}</button>
          ${f.children ? `<ul>${f.children.filter((c) => visible(c.id)).map((c) => { const s2 = folderStats(c.id); return `<li><button class="folder sub ${fid === c.id ? 'active' : ''}" data-action="docf:${c.id}">${ic('folder')}<span>${c.name}</span><em class="${s2.done < s2.reqs || s2.bad ? 'warn' : ''}">${s2.done}/${s2.reqs}</em></button></li>`; }).join('')}</ul>` : ''}</li>`;
      }).join('');
      const miss = U.missingDocs().length;
      return `
      <header class="page-head compact"><div><div class="eyebrow">Plantilla: residencial plurifamiliar · Comunitat Valenciana · ${A.files.length} documentos</div><h1>Documentación</h1></div>
        <div class="head-actions">${U.can('documentacion') ? `<button class="btn" data-action="reqcfg">${ic('cog')}Configurar requisitos</button><button class="btn btn-primary" data-action="docup">${ic('upload')}Cargar documento</button>` : ''}</div></header>
      <div class="doc-layout">
        <aside class="card doc-tree"><ul>${tree}</ul><p class="muted small pad">${miss} documentos requeridos sin cargar</p></aside>
        <section class="doc-main">${fid === 'planos' ? planosHTML() : fid === 'subs' ? subsFolders() : folderHTML(fid)}</section>
      </div>`;
    },
    mount() { bindPlano(); },
  };
  function subsFolders() {
    return `<article class="card"><div class="card-h"><h2>Subcontratas</h2><span class="muted">Una carpeta por empresa con contratos, proformas, albaranes, facturas, pagos y PRL</span></div>
      <div class="sub-folders">${A.subs.map((s) => { const st = folderStats('sub-' + s.id); return `<button class="sub-folder" data-action="docf:sub-${s.id}">${ic('folder')}<strong>${s.name}</strong><span>${st.files} documentos · ${st.done}/${st.reqs} requisitos${st.bad ? ` · <b class="neg">${st.bad} caducado</b>` : ''}</span></button>`; }).join('')}</div></article>`;
  }
  function folderHTML(fid) {
    const reqs = reqsOf(fid);
    const fs = filesIn(fid).sort((a, b) => U.toDate(b.date) - U.toDate(a.date));
    const edit = U.can('documentacion');
    const sub = fid.startsWith('sub-') ? U.sub(fid.slice(4)) : null;
    return `
    ${reqs.length ? `<article class="card"><div class="card-h wrap"><h2>Requisitos · ${folderName(fid)}</h2><span class="muted">${reqs.filter((r) => fs.some((f) => f.req === r && U.docState(f) === 'cargado')).length} de ${reqs.length} cargados</span></div>
      <ul class="reqs">${reqs.map((r) => { const f = fs.find((x) => x.req === r); const st = f ? U.docState(f) : 'pendiente'; return `<li class="r-${st}"><span class="req-ic">${ic(st === 'cargado' ? 'check' : st === 'caducado' ? 'alert' : st === 'revision' ? 'eye' : 'doc')}</span><div><strong>${r}</strong><span class="muted small">${f ? `${f.name} · ${fdate(f.date, false)}${f.expires ? ' · caduca ' + fdate(f.expires, false) : ''}` : 'Pendiente de cargar'}</span></div>${U.chipOf(A.docStatus, st)}${edit ? `<label class="btn btn-sm file-btn">${ic('upload')}${f ? 'Sustituir' : 'Cargar'}<input type="file" data-change="requp:${fid}:${A.requisitos.sub.includes(r) || (A.requisitos[fid] || []).includes(r) ? reqsOf(fid).indexOf(r) : ''}"></label>` : ''}</li>`; }).join('')}</ul></article>` : ''}
    <article class="card"><div class="card-h wrap"><h2>${sub ? sub.name : folderName(fid)}</h2><span class="muted">${fs.length} documentos</span></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Documento</th><th>Etiquetas</th><th>Fecha</th><th>Responsable</th><th>Estado</th><th>También en</th></tr></thead>
      <tbody>${fs.map((f) => `<tr class="${S.docHi === f.id ? 'sel' : ''}"><td>${f.url ? `<a href="${f.url}" target="_blank" rel="noopener">${ic('doc')}${esc(f.name)}</a>` : `<span class="docname">${ic('doc')}${esc(f.name)}</span>`}<div class="muted small">${f.type} · ${f.size}</div></td>
        <td>${f.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join(' ')}</td><td>${fdate(f.date, false)}</td><td class="small">${f.resp}</td><td>${U.chipOf(A.docStatus, U.docState(f))}</td>
        <td>${f.links.map((l) => `<button class="tag link" data-action="${l.t === 'sup' ? 'goto:suministros:' + l.id : l.t === 'eco' ? 'goto:economia:facturas' : l.t === 'cambios' ? 'goto:cambios:' + l.id : l.t === 'subs' ? 'goto:subcontratas:' + l.id : l.t === 'cert' ? 'goto:certificaciones' : 'go:panel'}">${l.label}</button>`).join(' ')}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Carpeta vacía</td></tr>'}</tbody></table></div>
      ${fid === 'informes' ? `<div class="card-b"><h3 class="mini">Informes emitidos desde la aplicación</h3><ul class="evid">${A.informesEmitidos.map((r) => `<li>${ic('doc')}<button class="linkish" data-action="infview:${r.id}">${r.title}</button><span>${fdate(r.at, false)} · ${r.to}</span></li>`).join('')}</ul></div>` : ''}
      <p class="muted small pad">Cada documento se guarda una sola vez y se puede consultar desde los apartados con los que está vinculado.</p></article>`;
  }
  act('docf', (f) => { S.docFolder = f; S.docHi = null; U.rerender(); });
  act('requp', (fid, idx, _, el) => {
    if (!U.guard('documentacion')) return;
    const f = el.files[0];
    if (!f) return;
    const req = reqsOf(fid)[+idx];
    A.files.filter((x) => x.folder === fid && x.req === req).forEach((x) => { x.req = null; x.tags.push('versión anterior'); });
    A.files.push(fileRec(f, { folder: fid, req, name: req + ' · ' + f.name }));
    U.log('documentacion', `Cargó «${req}» en ${folderName(fid)}`);
    U.toast(`${ic('check')}<span>${req} cargado en <b>${folderName(fid)}</b>.</span>`, 'ok');
    U.rerender();
  });
  act('docup', () => {
    const all = [];
    A.folders.forEach((f) => { if (f.children) f.children.forEach((c) => all.push([c.id, 'Subcontratas › ' + c.name])); else if (f.id !== 'planos') all.push([f.id, f.name]); });
    U.modal(`<div class="modal-head"><h2>Cargar documento</h2></div><form class="form" id="upForm">
      <label for="uFile">Archivo</label><input type="file" id="uFile" required>
      <label for="uFold">Carpeta</label><select id="uFold">${all.map(([id, n]) => `<option value="${id}" ${S.docFolder === id ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label for="uReq">Requisito que cubre</label><select id="uReq"><option value="">Ninguno</option></select>
      <label for="uTags">Etiquetas (separadas por comas)</label><input id="uTags" placeholder="factura, septiembre">
      <div class="row2"><div><label for="uExp">Caduca</label><input type="date" id="uExp"></div><div><label for="uSt">Estado</label><select id="uSt"><option value="cargado">Cargado</option><option value="revision">En revisión</option></select></div></div>
      <label for="uLink">Vincular también con</label><select id="uLink"><option value="">Nada</option><option value="eco">Control económico</option>${A.subs.map((s) => `<option value="subs:${s.id}">Subcontrata · ${s.short}</option>`).join('')}${A.supplies.map((m) => `<option value="sup:${m.id}">Pedido · ${m.name}</option>`).join('')}</select>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Cargar</button></div></form>`, 'wide');
    const fill = () => { U.$('#uReq').innerHTML = '<option value="">Ninguno</option>' + reqsOf(U.$('#uFold').value).map((r) => `<option>${r}</option>`).join(''); };
    U.$('#uFold').addEventListener('change', fill);
    fill();
    U.$('#upForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = U.$('#uFile').files[0];
      const lk = U.$('#uLink').value;
      const links = [];
      if (lk === 'eco') links.push({ t: 'eco', label: 'Control económico' });
      if (lk.startsWith('subs:')) links.push({ t: 'subs', id: lk.slice(5), label: 'Subcontratas' });
      if (lk.startsWith('sup:')) { links.push({ t: 'sup', id: lk.slice(4), label: 'Suministros · ' + lk.slice(4) }); }
      const rec = fileRec(f, { folder: U.$('#uFold').value, req: U.$('#uReq').value || null, tags: U.$('#uTags').value.split(',').map((x) => x.trim()).filter(Boolean), expires: U.$('#uExp').value || null, status: U.$('#uSt').value, links });
      A.files.push(rec);
      if (lk.startsWith('sup:')) A.supplies.find((m) => m.id === lk.slice(4)).docs.push(rec.id);
      S.docFolder = rec.folder; S.docHi = rec.id;
      U.log('documentacion', `Cargó ${f.name} en ${folderName(rec.folder)}`);
      U.closeModal(); U.rerender();
    });
  });
  act('reqcfg', () => {
    const fids = ['obra', 'sys', 'contratos', 'cliente', 'calidad', 'entrega', 'sub'];
    U.modal(`<div class="modal-head"><h2>Requisitos documentales</h2></div><p class="muted">Ajusta la plantilla a esta obra. No todas las obras necesitan los mismos documentos.</p>
      <div class="req-cfg">${fids.map((f) => `<div><h3 class="mini">${f === 'sub' ? 'Cada subcontrata' : folderName(f)}</h3><ul>${A.requisitos[f].map((r, i) => `<li><span>${r}</span><button class="btn btn-sm btn-icon btn-ghost" data-action="reqdel:${f}:${i}" aria-label="Quitar ${esc(r)}">${ic('x')}</button></li>`).join('')}</ul>
        <form class="inline-form" data-f="${f}"><input placeholder="Añadir requisito" aria-label="Nuevo requisito para ${f}"><button class="btn btn-sm">${ic('plus')}</button></form></div>`).join('')}</div>`, 'wide');
    U.$$('.req-cfg form').forEach((fm) => fm.addEventListener('submit', (e) => { e.preventDefault(); const v = fm.querySelector('input').value.trim(); if (!v) return; A.requisitos[fm.dataset.f].push(v); U.log('documentacion', 'Añadió el requisito ' + v); A.actions.reqcfg(); }));
  });
  act('reqdel', (f, i) => { const r = A.requisitos[f].splice(+i, 1)[0]; U.log('documentacion', 'Quitó el requisito ' + r); A.actions.reqcfg(); U.rerender(); A.actions.reqcfg(); });

  /* ── Planos ── */
  S.planoSel = 'A-102';
  function planosHTML() {
    const sel = A.planos.find((p) => p.id === S.planoSel) || A.planos[0];
    const rev = S.planoRev && sel.revs.some((r) => r.r === S.planoRev) ? S.planoRev : sel.revs[sel.revs.length - 1].r;
    S.planoRev = rev;
    const prevRev = sel.revs.length > 1 ? sel.revs[sel.revs.length - 2].r : null;
    const notes = A.planoNotes.filter((n) => n.plano === sel.id);
    return `<article class="card"><div class="card-h wrap"><h2>Planos</h2><div class="head-actions"><label class="fsel inline"><span>Disciplina</span><select data-change="pldisc" id="pldisc"><option value="">Todas</option>${[...new Set(A.planos.map((p) => p.disc))].map((d) => `<option ${S.plDisc === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label></div></div>
      <div class="table-wrap"><table class="table subs"><thead><tr><th>Código</th><th>Título</th><th>Disciplina</th><th>Planta o zona</th><th>Revisión</th><th>Fecha</th><th>Estado</th></tr></thead>
      <tbody>${A.planos.filter((p) => !S.plDisc || p.disc === S.plDisc).map((p) => { const last = p.revs[p.revs.length - 1]; return `<tr class="${p.id === sel.id ? 'sel' : ''}" data-action="plsel:${p.id}" tabindex="0"><td class="mono">${p.id}</td><td>${p.title}${p.asBuilt ? ' <span class="tag">final de obra</span>' : ''}</td><td>${p.disc}</td><td>${p.zona}</td><td class="mono">${last.r}${p.revs.length > 1 ? ` <span class="muted small">(${p.revs.length - 1} anteriores)</span>` : ''}</td><td>${fdate(last.date, false)}</td><td>${p.asBuilt ? chip('validado', 'Final de obra') : chip('validado', 'Vigente')}</td></tr>`; }).join('')}</tbody></table></div></article>
    <article class="card plano-card">
      <div class="card-h wrap"><div><h2><span class="mono">${sel.id}</span> ${sel.title}</h2><div class="muted small">${sel.disc} · ${sel.zona} · ${sel.revs.find((r) => r.r === rev).note || 'Sin observaciones de revisión'}</div></div>
        <div class="head-actions">
          <div class="seg small" role="group" aria-label="Revisión">${sel.revs.map((r) => `<button data-action="plrev:${r.r}" aria-pressed="${rev === r.r}">Rev. ${r.r}${r.st === 'sustituido' ? ' · sustituida' : ''}</button>`).join('')}</div>
          ${prevRev ? `<label class="switch"><input type="checkbox" ${S.plCmp ? 'checked' : ''} data-change="plcmp"><span>Comparar con rev. ${prevRev}</span></label>` : ''}
          ${U.can('documentacion') ? `<button class="btn btn-sm ${S.plNote ? 'btn-primary' : ''}" data-action="plnote">${ic('pin')}${S.plNote ? 'Pulsa en el plano' : 'Añadir observación'}</button><label class="btn btn-sm file-btn">${ic('upload')}Nueva revisión<input type="file" data-change="plup:${sel.id}"></label>` : ''}
        </div></div>
      <div class="plano-wrap ${S.plNote ? 'noting' : ''}" id="planoWrap">${planoSVG(sel, rev, S.plCmp && prevRev)}
        ${notes.map((n, i) => `<button class="pin ${n.rev !== rev ? 'other' : ''}" style="left:${n.x * 100}%;top:${n.y * 100}%" data-action="plpin:${i}" title="${esc(n.t)}">${i + 1}</button>`).join('')}</div>
      ${S.plCmp && prevRev ? `<div class="legend in-card"><span><i class="sw" style="background:var(--st-late)"></i>Rev. ${prevRev} (sustituida)</span><span><i class="sw" style="background:var(--accent)"></i>Rev. ${rev}</span></div>` : ''}
      <div class="card-b"><h3 class="mini">Observaciones sobre el plano</h3><ol class="notes">${notes.map((n) => `<li class="${n.rev !== rev ? 'muted' : ''}"><b>Rev. ${n.rev}</b> · ${esc(n.t)} <span class="muted small">· ${n.who}, ${fdate(n.at, false)}</span>${n.inc ? ` <button class="tag link" data-action="goto:calidad:${n.inc}">${n.inc}</button>` : ''}</li>`).join('') || '<li class="muted">Sin observaciones</li>'}</ol>
        <p class="muted small">Las observaciones conservan su posición y la revisión sobre la que se hicieron.</p></div>
    </article>`;
  }
  function planoSVG(p, rev, cmpRev) {
    const s = 30, W = 24 * s + 80, H = 14 * s + 80, o = 40;
    const X = (x) => o + x * s, Y = (z) => o + (14 - z) * s;
    const out = [`<svg class="plano" viewBox="0 0 ${W} ${H}" role="img" aria-label="Plano ${p.id}">`, `<rect class="pl-bg" x="0" y="0" width="${W}" height="${H}"/>`];
    const frame = () => out.push(`<rect class="pl-frame" x="${o - 14}" y="${o - 14}" width="${24 * s + 28}" height="${14 * s + 28}"/><text class="pl-title" x="${W - 12}" y="${H - 12}" text-anchor="end">${p.id} · rev. ${rev} · ${p.title}</text>`);
    if (p.kind === 'arq' || p.kind === 'ele' || p.kind === 'fon') {
      out.push(`<rect class="pl-ext" x="${X(0)}" y="${Y(14)}" width="${24 * s}" height="${14 * s}"/>`);
      [[0, 0], [12, 0], [12, 7], [0, 7]].forEach(([ox, oz], vi) => {
        const t4 = (k, r) => (k === 4 && (vi === 0 || vi === 3) && r >= 'C' ? 8.6 : null);
        const walls = (r, cls) => A.tabLayout.map((t) => {
          const along = t.sx > t.sz;
          const tx = t4(t.k, r) || t.x;
          return along ? `<line class="${cls}" x1="${X(ox + t.x - t.sx / 2)}" y1="${Y(oz + t.z)}" x2="${X(ox + t.x + t.sx / 2)}" y2="${Y(oz + t.z)}"/>` : `<line class="${cls}" x1="${X(ox + tx)}" y1="${Y(oz + t.z - t.sz / 2)}" x2="${X(ox + tx)}" y2="${Y(oz + t.z + t.sz / 2)}"/>`;
        }).join('');
        if (cmpRev) out.push(walls(cmpRev, 'pl-old'));
        out.push(walls(p.kind === 'arq' ? rev : 'C', cmpRev ? 'pl-new' : 'pl-wall'));
        out.push(`<line class="pl-ext2" x1="${X(ox)}" y1="${Y(oz)}" x2="${X(ox)}" y2="${Y(oz + 7)}"/><line class="pl-ext2" x1="${X(ox)}" y1="${Y(oz + 7)}" x2="${X(ox + 12)}" y2="${Y(oz + 7)}"/>`);
        out.push(`<text class="pl-lbl" x="${X(ox + 6)}" y="${Y(oz + 1.6)}" text-anchor="middle">Vivienda ${['A', 'B', 'C', 'D'][vi]}</text>`);
        [['Salón', 6.75, 2], ['Dorm. 1', 2.25, 2], ['Dorm. 2', 10.5, 2], ['Cocina', 4, 5.6], ['Baño', 10, 5.6]].forEach(([n, x, z]) => out.push(`<text class="pl-room" x="${X(ox + x)}" y="${Y(oz + z)}" text-anchor="middle">${n}</text>`));
        if (p.kind === 'ele') A.tabLayout.forEach((t) => { const along = t.sx > t.sz, len = along ? t.sx : t.sz; [0.3, 0.7].forEach((f) => { const px = along ? t.x - len / 2 + len * f : t.x + 0.2, pz = along ? t.z + 0.2 : t.z - len / 2 + len * f; out.push(`<circle class="pl-ele" cx="${X(ox + px)}" cy="${Y(oz + pz)}" r="4"/>`); }); });
        if (p.kind === 'fon') { out.push(`<polyline class="pl-fon" points="${[[7.9, 6.9], [7.9, 6.3], [1.4, 6.3], [1.4, 6.85]].map(([x, z]) => X(ox + x) + ',' + Y(oz + z)).join(' ')}"/><polyline class="pl-fon" points="${[[7.9, 6.3], [11.5, 6.3], [11.5, 6.75]].map(([x, z]) => X(ox + x) + ',' + Y(oz + z)).join(' ')}"/>`); [[8.55, 6.8], [9.7, 6.9], [11.2, 6.75], [1.4, 6.85], [2.8, 6.85], [4, 6.85]].forEach(([x, z]) => out.push(`<rect class="pl-fonp" x="${X(ox + x) - 4}" y="${Y(oz + z) - 4}" width="8" height="8"/>`)); }
      });
    } else if (p.kind === 'est') {
      [0, 6, 12, 18, 24].forEach((x, i) => out.push(`<line class="pl-axis" x1="${X(x)}" y1="${o - 26}" x2="${X(x)}" y2="${H - o + 20}"/><text class="pl-ax" x="${X(x)}" y="${o - 30}" text-anchor="middle">${i + 1}</text>`));
      [0, 7, 14].forEach((z, i) => out.push(`<line class="pl-axis" x1="${o - 26}" y1="${Y(z)}" x2="${W - o + 20}" y2="${Y(z)}"/><text class="pl-ax" x="${o - 32}" y="${Y(z) + 4}" text-anchor="middle">${'ABC'[i]}</text>`));
      if (p.level >= 1) [[0, 0], [12, 0], [12, 7], [0, 7]].forEach(([x, z], i) => out.push(`<rect class="pl-slab" x="${X(x)}" y="${Y(z + 7)}" width="${12 * s}" height="${7 * s}"/><text class="pl-room" x="${X(x + 6)}" y="${Y(z + 3.5)}" text-anchor="middle">Paño ${i + 1} · canto 30 · Ø12/15 ${p.level === 5 && rev === 'B' ? '+ refuerzo Ø16' : ''}</text>`));
      [0, 6, 12, 18, 24].forEach((x) => [0, 7, 14].forEach((z) => out.push(p.level < 0 ? `<rect class="pl-zap" x="${X(x) - 27}" y="${Y(z) - 27}" width="54" height="54"/><rect class="pl-col" x="${X(x) - 5}" y="${Y(z) - 5}" width="10" height="10"/>` : `<rect class="pl-col" x="${X(x) - 6}" y="${Y(z) - 6}" width="12" height="12"/>`)));
    } else {
      for (let L = 0; L < 5; L++) {
        out.push(`<rect class="pl-ext" x="${X(0)}" y="${o + (4 - L) * 2.6 * s * 0.55 + 10}" width="${24 * s}" height="${2.6 * s * 0.55}"/>`);
        [3, 9, 15, 21].forEach((x) => out.push(`<rect class="pl-win" x="${X(x) - 36}" y="${o + (4 - L) * 2.6 * s * 0.55 + 18}" width="72" height="${2.6 * s * 0.3}"/>`));
      }
      out.push(`<text class="pl-lbl" x="${X(12)}" y="${H - o + 10}" text-anchor="middle">Alzado sur</text>`);
    }
    frame();
    out.push('</svg>');
    return out.join('');
  }
  function bindPlano() {
    const w = U.$('#planoWrap');
    if (!w) return;
    w.addEventListener('click', (e) => {
      if (!S.plNote || e.target.closest('.pin')) return;
      const r = w.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      U.modal(`<div class="modal-head"><h2>Observación en ${S.planoSel} · rev. ${S.planoRev}</h2></div><form class="form" id="noteF"><label for="nT">Texto</label><textarea id="nT" rows="3" required></textarea>
        <label class="check"><input type="checkbox" id="nInc"><span>Crear también una incidencia vinculada</span></label>
        <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Guardar</button></div></form>`);
      U.$('#noteF').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const t = U.$('#nT').value;
        let inc = null;
        if (U.$('#nInc').checked) { inc = 'INC-0' + (22 + A.incidencias.length); A.incidencias.unshift({ id: inc, title: t, ubic: 'Plano ' + S.planoSel, viv: null, sub: null, prio: 'media', resp: U.me(), due: A.iso(A.addDays(TODAY, 7)), estado: 'abierta', at: A.iso(TODAY), by: U.me(), el: null, fase: '', plano: S.planoSel }); }
        A.planoNotes.push({ plano: S.planoSel, rev: S.planoRev, x, y, t, who: U.me(), at: A.iso(TODAY), inc });
        U.log('documentacion', `Añadió una observación en el plano ${S.planoSel} rev. ${S.planoRev}`);
        S.plNote = false; U.closeModal(); U.rerender();
      });
    });
  }
  act('plsel', (id) => { S.planoSel = id; S.planoRev = null; S.plCmp = false; U.rerender(); });
  act('plrev', (r) => { S.planoRev = r; U.rerender(); });
  act('plcmp', (_, __, on) => { S.plCmp = on; U.rerender(); });
  act('pldisc', (_, __, v) => { S.plDisc = v; U.rerender(); });
  act('plnote', () => { S.plNote = !S.plNote; U.rerender(); });
  act('plpin', (i) => { const n = A.planoNotes.filter((x) => x.plano === S.planoSel)[+i]; U.toast(`${ic('pin')}<span><b>Rev. ${n.rev}</b> · ${esc(n.t)} — ${n.who}</span>`); });
  act('plup', (id, _, __, el) => {
    const f = el.files[0];
    if (!f) return;
    const p = A.planos.find((x) => x.id === id);
    const last = p.revs[p.revs.length - 1];
    last.st = 'sustituido';
    const nr = String.fromCharCode(last.r.charCodeAt(0) + 1);
    p.revs.push({ r: nr, date: A.iso(TODAY), st: 'vigente', note: 'Cargada desde ' + f.name });
    A.files.push(fileRec(f, { folder: 'planos', name: `${id} rev. ${nr} · ${f.name}`, tags: ['plano', p.disc.toLowerCase()] }));
    U.log('documentacion', `Subió la revisión ${nr} del plano ${id}; la ${last.r} queda sustituida`);
    S.planoRev = nr; U.rerender();
  });

  /* ═════════ CALIDAD E INCIDENCIAS ═════════ */
  S.calTab = 'incidencias';
  S.incF = { estado: '', prio: '', sub: '' };
  A.views.calidad = {
    render() {
      const t = S.calTab;
      return `
      <header class="page-head compact"><div><div class="eyebrow">Incidencias, defectos, repasos y listas de comprobación</div><h1>Calidad e incidencias</h1></div>
        <div class="head-actions"><div class="seg" role="tablist"><button data-action="caltab:incidencias" aria-pressed="${t === 'incidencias'}">Incidencias</button><button data-action="caltab:listas" aria-pressed="${t === 'listas'}">Listas de comprobación</button></div>
        ${U.can('calidad') ? `<button class="btn btn-primary" data-action="${t === 'incidencias' ? 'newinc' : 'newcheck'}">${ic('plus')}${t === 'incidencias' ? 'Nueva incidencia' : 'Nueva lista'}</button>` : ''}</div></header>
      ${t === 'incidencias' ? incHTML() : checksHTML()}`;
    },
  };
  function incHTML() {
    const f = S.incF;
    const list = A.incidencias.filter((i) => (S.role !== 'sub' || i.sub === 'S4') && (!f.estado || i.estado === f.estado) && (!f.prio || i.prio === f.prio) && (!f.sub || i.sub === f.sub));
    const sel = A.incidencias.find((i) => i.id === S.incSel);
    const overdue = (i) => ['abierta', 'asignada'].includes(i.estado) && U.toDate(i.due) < TODAY;
    return `
    <section class="kpis">${['abierta', 'asignada', 'resuelta', 'cerrada'].map((k) => `<button class="kpi link" data-action="incf:estado:${f.estado === k ? '' : k}"><div class="kpi-label">${A.incEstados[k][0]}</div><div class="kpi-value">${A.incidencias.filter((i) => i.estado === k).length}</div><div class="kpi-foot">${k === 'asignada' ? A.incidencias.filter(overdue).length + ' fuera de plazo' : k === 'resuelta' ? 'Pendientes de verificar el cierre' : '&nbsp;'}</div></button>`).join('')}</section>
    <article class="card">
      <div class="card-h wrap"><h2>Incidencias</h2><div class="filters tight">
        <label class="fsel inline"><span>Estado</span><select data-change="incf:estado" id="ife"><option value="">Todos</option>${Object.keys(A.incEstados).map((k) => `<option value="${k}" ${f.estado === k ? 'selected' : ''}>${A.incEstados[k][0]}</option>`).join('')}</select></label>
        <label class="fsel inline"><span>Prioridad</span><select data-change="incf:prio" id="ifp"><option value="">Todas</option>${['alta', 'media', 'baja'].map((k) => `<option ${f.prio === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label class="fsel inline"><span>Subcontrata</span><select data-change="incf:sub" id="ifs"><option value="">Todas</option>${A.subs.map((s) => `<option value="${s.id}" ${f.sub === s.id ? 'selected' : ''}>${s.short}</option>`).join('')}</select></label></div></div>
      <div class="table-wrap"><table class="table subs"><thead><tr><th>Incidencia</th><th>Ubicación</th><th>Subcontrata</th><th>Prioridad</th><th>Fecha límite</th><th>Estado</th></tr></thead>
      <tbody>${list.map((i) => `<tr class="${S.incSel === i.id ? 'sel' : ''}" data-action="incsel:${i.id}" tabindex="0"><td><span class="mono small">${i.id}</span> <strong>${i.title}</strong><div class="muted small">${fdate(i.at, false)} · ${i.by}</div></td><td>${i.ubic}</td><td>${U.subName(i.sub)}</td><td>${U.prioChip(i.prio)}</td><td class="${overdue(i) ? 'neg' : ''}">${fdate(i.due, false)}${overdue(i) ? ' · fuera de plazo' : ''}</td><td>${U.chipOf(A.incEstados, i.estado)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Sin incidencias con estos filtros</td></tr>'}</tbody></table></div>
    </article>
    ${sel ? incDetail(sel) : ''}`;
  }
  function incDetail(i) {
    const cap = i.capture && A.captures.find((c) => c.id === i.capture);
    const edit = U.can('calidad');
    const btn = { abierta: [['asignada', 'Asignar']], asignada: [['resuelta', 'Comunicar resolución']], resuelta: [['cerrada', 'Verificar y cerrar'], ['asignada', 'Reabrir']], cerrada: [['asignada', 'Reabrir']] }[i.estado];
    return `<article class="card"><div class="card-h wrap"><div><h2>${i.id} · ${i.title}</h2><div class="muted small">${i.ubic} · registrada por ${i.by} el ${fdate(i.at)}</div></div><div class="head-actions">${U.chipOf(A.incEstados, i.estado)}${edit ? btn.map(([to, l]) => `<button class="btn btn-sm ${to === 'cerrada' || to === 'resuelta' ? 'btn-primary' : ''}" data-action="incflow:${i.id}:${to}">${l}</button>`).join('') : ''}<button class="btn btn-sm btn-icon btn-ghost" data-action="incsel:" aria-label="Cerrar">${ic('x')}</button></div></div>
      <div class="act-grid">
        <div><h3 class="mini">Datos</h3><dl class="dl"><dt>Responsable</dt><dd>${i.resp} · ${U.subName(i.sub)}</dd><dt>Prioridad</dt><dd>${U.prioChip(i.prio)}</dd><dt>Fecha límite</dt><dd>${fdate(i.due)}</dd><dt>Fase</dt><dd>${i.fase || '—'}</dd></dl>
          <div class="ws"><span class="${['abierta', 'asignada', 'resuelta', 'cerrada'].indexOf(i.estado) >= 0 ? 'on' : ''}">Registrada</span><span class="${['asignada', 'resuelta', 'cerrada'].includes(i.estado) ? 'on' : ''}">Asignada</span><span class="${['resuelta', 'cerrada'].includes(i.estado) ? 'on' : ''}">Resuelta</span><span class="${i.estado === 'cerrada' ? 'on' : ''}">Verificada</span></div></div>
        <div><h3 class="mini">Vinculada con</h3><div class="btn-col">
          ${i.viv ? `<button class="tag link" data-action="goto:interiores:${i.viv}">${ic('home')}Vivienda ${A.vivs.find((v) => v.key === i.viv).name}</button>` : ''}
          ${i.el ? `<button class="tag link" data-action="incbim:${i.el}">${ic('cube')}${A.el[i.el].name}</button>` : ''}
          ${i.plano ? `<button class="tag link" data-action="incplano:${i.plano}">${ic('map')}Plano ${i.plano}</button>` : ''}
          ${i.sub ? `<button class="tag link" data-action="goto:subcontratas:${i.sub}">${ic('users')}${U.sub(i.sub).name}</button>` : ''}</div></div>
        <div><h3 class="mini">Fotografías</h3>${cap ? `<img class="inc-photo" src="${U.capShot(cap, 0).photo}" alt="Foto de ${esc(i.title)}">` : ''}${(i.photos || []).map((p) => `<img class="inc-photo" src="${p}" alt="Foto adjunta">`).join('')}${!cap && !(i.photos || []).length ? '<p class="muted small">Sin fotografías</p>' : ''}
          ${edit ? `<label class="btn btn-sm file-btn">${ic('camera')}Añadir foto<input type="file" accept="image/*" data-change="incphoto:${i.id}"></label>` : ''}</div>
      </div></article>`;
  }
  function checksHTML() {
    const sel = A.checklists.find((c) => c.id === S.ckSel);
    return `<section class="grid g-2">
      <article class="card"><div class="card-h"><h2>Plantillas reutilizables</h2></div><ul class="devs">${A.checkTemplates.map((t) => `<li><div><strong>${t.name}</strong><span class="muted small">${t.items.length} comprobaciones · fase ${t.fase}</span></div>${U.can('calidad') ? `<button class="btn btn-sm" data-action="newcheck:${t.id}">Usar</button>` : ''}</li>`).join('')}</ul></article>
      <article class="card"><div class="card-h"><h2>Listas realizadas</h2></div><ul class="devs">${A.checklists.map((c) => { const t = A.checkTemplates.find((x) => x.id === c.tpl); const d = c.done.filter(Boolean).length; return `<li class="clk ${S.ckSel === c.id ? 'sel' : ''}" data-action="cksel:${c.id}"><div><strong>${t.name}</strong><span class="muted small">${c.zona} · ${fdate(c.at, false)} · ${c.by}</span></div><span>${d}/${c.done.length} ${c.result === 'apto' ? chip('validado', 'Apta') : chip('ejecucion', 'En curso')}</span></li>`; }).join('')}</ul></article>
    </section>
    ${sel ? (() => { const t = A.checkTemplates.find((x) => x.id === sel.tpl); return `<article class="card"><div class="card-h wrap"><div><h2>${t.name} · ${sel.zona}</h2><div class="muted small">${sel.by} · ${fdate(sel.at)}</div></div>${sel.result === 'apto' ? chip('validado', 'Apta') : ''}</div>
      <ul class="checklist">${t.items.map((it, k) => `<li><label class="check"><input type="checkbox" ${sel.done[k] ? 'checked' : ''} ${U.can('calidad') ? '' : 'disabled'} data-change="ckitem:${sel.id}:${k}"><span>${it}</span></label></li>`).join('')}</ul>
      ${U.can('calidad') && sel.result !== 'apto' ? `<div class="card-f"><button class="btn btn-primary" data-action="ckok:${sel.id}" ${sel.done.every(Boolean) ? '' : 'disabled'}>Firmar como apta</button></div>` : ''}</article>`; })() : ''}`;
  }
  act('caltab', (t) => { S.calTab = t; U.rerender(); });
  act('incf', (k, v, val) => { S.incF[k] = val !== undefined ? val : v || ''; U.rerender(); });
  act('incsel', (id) => { S.incSel = id || null; U.rerender(); });
  act('incflow', (id, to) => {
    if (!U.guard('calidad')) return;
    const i = A.incidencias.find((x) => x.id === id);
    const b = U.chipText(A.incEstados, i.estado);
    i.estado = to;
    U.log('calidad', `${i.id}: ${i.title}`, b, U.chipText(A.incEstados, to));
    U.rerender();
  });
  act('incphoto', (id, _, __, el) => { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const i = A.incidencias.find((x) => x.id === id); (i.photos = i.photos || []).push(r.result); U.log('calidad', 'Añadió una foto a ' + id); U.rerender(); }; r.readAsDataURL(f); });
  act('incbim', (elId) => U.go('modelo', () => { const el = A.el[elId]; A.viewer.selected = elId; A.viewer.layers[el.layer] = true; S.focusEl = elId; }));
  act('incplano', (p) => U.go('documentacion', () => { S.docFolder = 'planos'; S.planoSel = p; }));
  act('newinc', (elId) => {
    if (!U.guard('calidad')) return;
    const el = elId ? A.el[elId] : null;
    U.modal(`<div class="modal-head"><h2>Nueva incidencia</h2></div><form class="form" id="incForm">
      <label for="iT">Descripción</label><input id="iT" required placeholder="Qué ocurre">
      <label for="iU">Ubicación</label><select id="iU">${el && el.vivKey ? '' : '<option value="">Zona común o exterior</option>'}${A.vivs.map((v) => `<option value="${v.key}" ${el && el.vivKey === v.key ? 'selected' : ''}>Vivienda ${v.name}</option>`).join('')}</select>
      ${el ? `<p class="muted small">Vinculada al elemento ${el.name} (${el.id}).</p>` : ''}
      <div class="row2"><div><label for="iS">Subcontrata</label><select id="iS"><option value="">Sin asignar</option>${A.subs.map((s) => `<option value="${s.id}" ${el && U.partida(el.partida).sub === s.id ? 'selected' : ''}>${s.short}</option>`).join('')}</select></div><div><label for="iP">Prioridad</label><select id="iP"><option>media</option><option>alta</option><option>baja</option></select></div></div>
      <label for="iD">Fecha límite</label><input type="date" id="iD" value="${A.iso(A.addDays(TODAY, 7))}">
      <label for="iF">Foto</label><input type="file" id="iF" accept="image/*">
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Registrar</button></div></form>`);
    U.$('#incForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const save = (photo) => {
        const id = 'INC-0' + (22 + A.incidencias.length);
        const viv = U.$('#iU').value || null, sub = U.$('#iS').value || null;
        A.incidencias.unshift({ id, title: U.$('#iT').value, ubic: viv ? 'Vivienda ' + A.vivs.find((v) => v.key === viv).name : 'Zona común', viv, sub, prio: U.$('#iP').value, resp: sub ? U.sub(sub).contactos[0].n : U.me(), due: U.$('#iD').value, estado: sub ? 'asignada' : 'abierta', at: A.iso(TODAY), by: U.me(), el: elId || null, fase: '', photos: photo ? [photo] : [] });
        U.log('calidad', `Registró la incidencia ${id}: ${U.$('#iT').value}`);
        U.closeModal();
        U.go('calidad', () => { S.calTab = 'incidencias'; S.incSel = id; });
      };
      const f = U.$('#iF').files[0];
      if (f) { const r = new FileReader(); r.onload = () => save(r.result); r.readAsDataURL(f); } else save(null);
    });
  });
  act('cksel', (id) => { S.ckSel = id; U.rerender(); });
  act('ckitem', (id, k, on) => { const c = A.checklists.find((x) => x.id === id); c.done[+k] = on; const b = U.$('[data-action^="ckok"]'); if (b) b.disabled = !c.done.every(Boolean); });
  act('ckok', (id) => { const c = A.checklists.find((x) => x.id === id); c.result = 'apto'; U.log('calidad', `Firmó como apta la lista «${A.checkTemplates.find((t) => t.id === c.tpl).name}» de ${c.zona}`); if (c.tpl === 'CK-PRE' && c.viv && S.precierre[c.viv] === false) U.toast(`${ic('alert')}<span>Recuerda que sigue faltando la foto previa al cierre de ${c.zona}.</span>`, 'warn'); U.rerender(); });
  act('newcheck', (tpl) => {
    U.modal(`<div class="modal-head"><h2>Nueva lista de comprobación</h2></div><form class="form" id="ckForm">
      <label for="kT">Plantilla</label><select id="kT">${A.checkTemplates.map((t) => `<option value="${t.id}" ${tpl === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
      <label for="kZ">Zona</label><select id="kZ">${A.vivs.map((v) => `<option value="${v.key}">Vivienda ${v.name}</option>`).join('')}<option value="">Zonas comunes</option></select>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Crear</button></div></form>`);
    U.$('#ckForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const t = A.checkTemplates.find((x) => x.id === U.$('#kT').value);
      const viv = U.$('#kZ').value;
      const id = 'CL-0' + (40 + A.checklists.length);
      A.checklists.unshift({ id, tpl: t.id, zona: viv ? 'Vivienda ' + A.vivs.find((v) => v.key === viv).name : 'Zonas comunes', viv, at: A.iso(TODAY), by: U.me(), done: t.items.map(() => false), result: 'pendiente' });
      U.log('calidad', `Creó la lista «${t.name}»`);
      S.ckSel = id; S.calTab = 'listas'; U.closeModal(); U.rerender();
    });
  });

  /* ═════════ DIARIO Y FOTOS ═════════ */
  S.diaTab = 'diario';
  S.reportPhotos = S.reportPhotos || {};
  const EVO = { grua: ['2026-04-15', '2026-05-29', '2026-07-03', '2026-08-07', '2026-09-11', 'now'], sur: ['2026-06-12', '2026-07-24', '2026-08-07', '2026-09-15', '2026-09-29', 'now'] };
  const evoCache = {};
  function evoShot(cam, at) {
    const k = cam + at;
    if (!evoCache[k]) evoCache[k] = A.photo.render({ cam, at, noOverlay: true, thumb: true, stampText: (cam === 'grua' ? 'CAM C-03' : 'F-01') + ' · ' + (at === 'now' ? '01/10/2026' : at.split('-').reverse().join('/')) }).photo;
    return evoCache[k];
  }
  A.views.diario = {
    render() {
      const t = S.diaTab;
      return `
      <header class="page-head compact"><div><div class="eyebrow">Trabajos, empresas, entregas, meteorología y fotografías</div><h1>Diario y fotos</h1></div>
        <div class="head-actions"><div class="seg" role="tablist"><button data-action="diatab:diario" aria-pressed="${t === 'diario'}">Diario de obra</button><button data-action="diatab:fotos" aria-pressed="${t === 'fotos'}">Fotografías</button><button data-action="diatab:evo" aria-pressed="${t === 'evo'}">Evolución</button></div>
        ${U.can('diario') && t === 'diario' ? `<button class="btn btn-primary" data-action="newdia">${ic('plus')}Parte de hoy</button>` : ''}</div></header>
      ${t === 'diario' ? diarioHTML() : t === 'fotos' ? fotosHTML() : evoHTML()}`;
    },
  };
  function diarioHTML() {
    const sel = A.diario.find((d) => d.date === S.diaSel) || A.diario[0];
    return `<div class="dia-layout">
      <aside class="card"><ul class="dia-list">${A.diario.map((d) => `<li><button class="${d === sel ? 'active' : ''}" data-action="diasel:${d.date}"><strong>${fdate(d.date)}</strong><span>${d.meteo} · ${d.empresas.reduce((s, e) => s + e[1], 0)} personas</span></button></li>`).join('')}</ul></aside>
      <article class="card"><div class="card-h wrap"><div><h2>${new Date(sel.date + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2><div class="muted small">${sel.meteo} · parte de ${sel.by}</div></div></div>
        <div class="card-b dia-body">
          <section><h3 class="mini">Trabajos realizados</h3><p>${esc(sel.trabajos)}</p></section>
          <section><h3 class="mini">Empresas y personal</h3><table class="table compact"><tbody>${sel.empresas.map(([e, n]) => `<tr><td>${e}</td><td class="num">${n} personas</td></tr>`).join('')}<tr class="total"><td>Total</td><td class="num">${sel.empresas.reduce((s, e) => s + e[1], 0)}</td></tr></tbody></table></section>
          <section><h3 class="mini">Maquinaria</h3><p>${esc(sel.maquinaria) || '—'}</p></section>
          <section><h3 class="mini">Entregas</h3><p>${esc(sel.entregas) || '—'}</p></section>
          <section><h3 class="mini">Problemas</h3><p class="${sel.problemas ? 'neg' : 'muted'}">${esc(sel.problemas) || 'Sin incidencias'}</p></section>
          ${sel.photos && sel.photos.length ? `<section><h3 class="mini">Fotos</h3><div class="ph-photos">${sel.photos.map((p) => `<img src="${p}" alt="Foto del parte">`).join('')}</div></section>` : ''}
        </div></article></div>`;
  }
  function photoItems() {
    const items = A.captures.map((c) => ({ id: c.id, src: c.upload || U.capShot(c, 0).photo, title: c.title, date: c.at, level: c.level, viv: c.viv || null, cap: c.viv ? '05' : c.level === 'CUB' || c.zone.startsWith('Estructura') || c.zone === 'Cimentación' ? '03' : '04' }));
    A.diario.forEach((d) => (d.photos || []).forEach((p, i) => items.push({ id: 'D' + d.date + i, src: p, title: 'Parte del ' + fdate(d.date, false), date: d.date, level: '', viv: null, cap: '' })));
    A.incidencias.forEach((i) => (i.photos || []).forEach((p, k) => items.push({ id: i.id + k, src: p, title: i.id + ' · ' + i.title, date: i.at, level: '', viv: i.viv, cap: '' })));
    return items;
  }
  function fotosHTML() {
    const f = S.phF || {};
    const items = photoItems().filter((p) => (!f.level || p.level === f.level) && (!f.viv || p.viv === f.viv) && (!f.cap || p.cap === f.cap));
    return `<article class="card"><div class="card-h wrap"><h2>Fotografías</h2><div class="filters tight">
      <label class="fsel inline"><span>Zona</span><select data-change="phf:level" id="phl"><option value="">Todas</option>${A.levels.map((l) => `<option value="${l.id}" ${f.level === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}</select></label>
      <label class="fsel inline"><span>Vivienda</span><select data-change="phf:viv" id="phv"><option value="">Todas</option>${A.vivs.map((v) => `<option value="${v.key}" ${f.viv === v.key ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>
      <label class="fsel inline"><span>Capítulo</span><select data-change="phf:cap" id="phc"><option value="">Todos</option>${['03', '04', '05'].map((c) => `<option value="${c}" ${f.cap === c ? 'selected' : ''}>${c} ${A.chapters.find((x) => x.code === c).name}</option>`).join('')}</select></label></div></div>
      <div class="gallery">${items.map((p) => `<figure class="ph"><img src="${p.src}" alt="${esc(p.title)}" loading="lazy"><figcaption><strong>${esc(p.title)}</strong><span>${fdt(p.date)}</span>
        <label class="check small"><input type="checkbox" ${S.reportPhotos[p.id] ? 'checked' : ''} data-change="phrep:${p.id}"><span>Usar en informe</span></label></figcaption></figure>`).join('') || '<p class="muted pad">Sin fotografías con estos filtros</p>'}</div></article>`;
  }
  function evoHTML() {
    const cam = S.evoCam || 'grua';
    const dates = EVO[cam];
    const a = S.evoA != null ? S.evoA : 1, b = S.evoB != null ? S.evoB : dates.length - 1;
    const lbl = (d) => (d === 'now' ? 'Hoy' : fdate(d));
    return `<article class="card"><div class="card-h wrap"><h2>Evolución de una ubicación</h2><label class="fsel inline"><span>Punto</span><select data-change="evocam" id="evocam"><option value="grua" ${cam === 'grua' ? 'selected' : ''}>C-03 · cámara de grúa</option><option value="sur" ${cam === 'sur' ? 'selected' : ''}>F-01 · fachada sur</option></select></label></div>
      <div class="evo-strip">${dates.map((d, i) => `<figure class="${i === a || i === b ? 'on' : ''}"><img src="${evoShot(cam, d)}" alt="${lbl(d)}"><figcaption>${lbl(d)}</figcaption></figure>`).join('')}</div>
      <div class="card-b"><h3 class="mini">Comparar dos fechas</h3><div class="row2 cmp-sel">
        <label class="fsel inline"><span>Antes</span><select data-change="evoa" id="evoa">${dates.map((d, i) => `<option value="${i}" ${i === a ? 'selected' : ''}>${lbl(d)}</option>`).join('')}</select></label>
        <label class="fsel inline"><span>Después</span><select data-change="evob" id="evob">${dates.map((d, i) => `<option value="${i}" ${i === b ? 'selected' : ''}>${lbl(d)}</option>`).join('')}</select></label></div>
        <div class="compare" id="cmpBox"><img src="${evoShot(cam, dates[b])}" alt="Después"><div class="cmp-before" id="cmpBefore"><img src="${evoShot(cam, dates[a])}" alt="Antes"></div><input type="range" min="0" max="100" value="50" id="cmpRange" aria-label="Deslizar para comparar"><span class="cmp-l">${lbl(dates[a])}</span><span class="cmp-r">${lbl(dates[b])}</span></div>
      </div></article>`;
  }
  A.views.diario.mount = () => {
    const r = U.$('#cmpRange');
    if (r) r.addEventListener('input', () => { U.$('#cmpBefore').style.width = r.value + '%'; });
  };
  act('diatab', (t) => { S.diaTab = t; U.rerender(); });
  act('diasel', (d) => { S.diaSel = d; U.rerender(); });
  act('phf', (k, _, v) => { S.phF = Object.assign(S.phF || {}, { [k]: v }); U.rerender(); });
  act('phrep', (id, _, on) => { S.reportPhotos[id] = on; });
  act('evocam', (_, __, v) => { S.evoCam = v; S.evoA = null; S.evoB = null; U.rerender(); });
  act('evoa', (_, __, v) => { S.evoA = +v; U.rerender(); });
  act('evob', (_, __, v) => { S.evoB = +v; U.rerender(); });
  act('newdia', () => {
    const today = A.iso(TODAY);
    const ex = A.diario.find((d) => d.date === today);
    U.modal(`<div class="modal-head"><h2>Parte de obra · ${fdate(TODAY)}</h2></div><form class="form" id="diaForm">
      <label for="dM">Meteorología</label><select id="dM"><option>Soleado · 23 °C</option><option>Nubes y claros · 21 °C</option><option>Lluvia débil · 18 °C</option><option>Lluvia intensa · 16 °C</option><option>Viento fuerte</option></select>
      <label for="dT">Trabajos realizados</label><textarea id="dT" rows="3" required>${ex ? esc(ex.trabajos) : ''}</textarea>
      <label>Empresas presentes</label><div class="emp-grid">${A.subs.map((s) => `<label class="fsel inline"><span>${s.short}</span><input type="number" min="0" value="0" data-emp="${s.short}" aria-label="Personas de ${s.short}"></label>`).join('')}</div>
      <label for="dQ">Maquinaria</label><input id="dQ" value="Grúa torre">
      <label for="dE">Entregas</label><input id="dE">
      <label for="dP">Problemas</label><input id="dP">
      <label for="dF">Fotos</label><input id="dF" type="file" accept="image/*" multiple>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Guardar parte</button></div></form>`, 'wide');
    U.$('#diaForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const files = Array.from(U.$('#dF').files);
      const entry = { date: today, meteo: U.$('#dM').value, trabajos: U.$('#dT').value, empresas: U.$$('[data-emp]').filter((i) => +i.value > 0).map((i) => [i.dataset.emp, +i.value]), maquinaria: U.$('#dQ').value, entregas: U.$('#dE').value, problemas: U.$('#dP').value, by: U.me(), photos: [] };
      entry.photos = await Promise.all(files.map((f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); })));
      A.diario = A.diario.filter((d) => d.date !== today);
      A.diario.unshift(entry);
      S.diaSel = today;
      U.log('diario', 'Registró el parte de obra del ' + fdate(TODAY, false));
      U.closeModal(); U.rerender();
    });
  });

  /* ═════════ REUNIONES, TAREAS Y DECISIONES ═════════ */
  S.reuTab = 'actas';
  A.views.reuniones = {
    render() {
      const t = S.reuTab;
      return `
      <header class="page-head compact"><div><div class="eyebrow">Actas, compromisos y decisiones pendientes</div><h1>Reuniones y tareas</h1></div>
        <div class="head-actions"><div class="seg" role="tablist">${[['actas', 'Actas'], ['tareas', 'Tareas'], ['decisiones', 'Decisiones']].map(([k, l]) => `<button data-action="reutab:${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</div>
        ${U.can('reuniones') ? `<button class="btn btn-primary" data-action="${t === 'actas' ? 'newacta' : t === 'tareas' ? 'newtask' : 'newdec'}">${ic('plus')}${t === 'actas' ? 'Nueva acta' : t === 'tareas' ? 'Nueva tarea' : 'Nueva decisión'}</button>` : ''}</div></header>
      ${t === 'actas' ? actasHTML() : t === 'tareas' ? tareasHTML() : decHTML()}`;
    },
  };
  function linkBtn(l) {
    if (!l) return '';
    const a = { act: `goto:planificacion:${l.id}`, viv: `goto:interiores:${l.id}`, cambio: `goto:cambios:${l.id}`, sup: `goto:suministros:${l.id}`, plano: `incplano:${l.id}`, cap: `opencap:${l.id}` }[l.t] || 'go:panel';
    return `<button class="tag link" data-action="${a}">${ic('link')}${l.label}</button>`;
  }
  function actasHTML() {
    const sel = A.reuniones.find((r) => r.id === S.reuSel) || A.reuniones[0];
    return `<div class="dia-layout">
      <aside class="card"><ul class="dia-list">${A.reuniones.map((r) => `<li><button class="${r === sel ? 'active' : ''}" data-action="reusel:${r.id}"><strong>${r.title}</strong><span>${fdate(r.date)} · ${r.tipo}</span></button></li>`).join('')}</ul></aside>
      <article class="card"><div class="card-h wrap"><div><h2>${sel.title}</h2><div class="muted small">${fdate(sel.date)} · ${sel.asistentes.join(', ')}</div></div></div>
        <div class="card-b"><h3 class="mini">Puntos tratados</h3><ol class="bullets">${sel.puntos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
        <h3 class="mini">Acuerdos</h3><ul class="devs">${sel.acuerdos.map((a, i) => { const t = a.task && A.tareas.find((x) => x.id === a.task); return `<li><div><strong>${esc(a.t)}</strong><span class="muted small">${a.resp} · ${fdate(a.due, false)}</span></div>${t ? `<span class="chip ${t.estado === 'hecha' ? 'st-ok' : 'st-progress'}"><i></i>Tarea ${t.id} · ${{ pendiente: 'pendiente', curso: 'en curso', hecha: 'hecha' }[t.estado]}</span>` : U.can('reuniones') ? `<button class="btn btn-sm" data-action="mktask:${sel.id}:${i}">${ic('plus')}Crear tarea</button>` : ''}</li>`; }).join('')}</ul></div></article></div>`;
  }
  function tareasHTML() {
    const cols = [['pendiente', 'Pendiente'], ['curso', 'En curso'], ['hecha', 'Hecha']];
    return `<div class="kanban">${cols.map(([k, l]) => `<section class="kcol"><h3 class="mini">${l} · ${A.tareas.filter((t) => t.estado === k).length}</h3>
      ${A.tareas.filter((t) => t.estado === k).map((t) => { const late = k !== 'hecha' && U.toDate(t.due) < TODAY; return `<article class="kcard"><strong>${esc(t.t)}</strong><span class="muted small">${t.resp} · <span class="${late ? 'neg' : ''}">${fdate(t.due, false)}${late ? ' · vencida' : ''}</span>${t.from ? ' · ' + t.from : ''}</span>${linkBtn(t.link)}
        ${U.can('reuniones') ? `<div class="btn-row">${cols.filter(([c]) => c !== k).map(([c, cl]) => `<button class="btn btn-sm btn-ghost" data-action="taskmv:${t.id}:${c}">${cl}</button>`).join('')}</div>` : ''}</article>`; }).join('')}</section>`).join('')}</div>`;
  }
  function decHTML() {
    return `<article class="card"><div class="card-h"><h2>Decisiones</h2><span class="muted">Vinculadas con planos, cambios, compras y actividades</span></div><ul class="devs">${A.decisiones.map((d) => `<li><div><strong>${d.id} · ${esc(d.t)}</strong><span class="muted small">Decide: ${d.quien} · antes del ${fdate(d.due, false)}${d.result ? ' · ' + esc(d.result) : ''}</span><div class="btn-row">${d.links.map(linkBtn).join('')}</div></div>
      ${d.estado === 'pendiente' ? (U.can('reuniones') ? `<button class="btn btn-sm btn-primary" data-action="decide:${d.id}">Registrar decisión</button>` : '<span class="chip st-progress"><i></i>Pendiente</span>') : '<span class="chip st-ok"><i></i>Tomada</span>'}</li>`).join('')}</ul></article>`;
  }
  act('reutab', (t) => { S.reuTab = t; U.rerender(); });
  act('reusel', (id) => { S.reuSel = id; U.rerender(); });
  act('mktask', (rid, i) => {
    const r = A.reuniones.find((x) => x.id === rid), a = r.acuerdos[+i];
    const id = 'T-' + (110 + A.tareas.length);
    A.tareas.unshift({ id, t: a.t, resp: a.resp, due: a.due, estado: 'pendiente', from: rid, link: null });
    a.task = id;
    U.log('reuniones', `Creó la tarea ${id} desde ${r.title}`);
    U.toast(`${ic('check')}<span>Tarea <b>${id}</b> creada y asignada a ${a.resp}.</span>`, 'ok');
    U.rerender();
  });
  act('taskmv', (id, to) => { const t = A.tareas.find((x) => x.id === id); const b = t.estado; t.estado = to; U.log('reuniones', `Movió la tarea ${id}`, b, to); U.rerender(); });
  act('decide', (id) => {
    const d = A.decisiones.find((x) => x.id === id);
    U.modal(`<div class="modal-head"><h2>${d.id} · decisión</h2></div><p>${esc(d.t)}</p><form class="form" id="decF"><label for="dR">Decisión tomada</label><input id="dR" required><div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Registrar</button></div></form>`);
    U.$('#decF').addEventListener('submit', (e) => { e.preventDefault(); d.estado = 'tomada'; d.result = U.$('#dR').value; U.log('reuniones', `Registró la decisión ${d.id}: ${d.result}`); U.closeModal(); U.rerender(); });
  });
  act('newtask', () => {
    U.modal(`<div class="modal-head"><h2>Nueva tarea</h2></div><form class="form" id="tkF"><label for="tT">Tarea</label><input id="tT" required>
      <div class="row2"><div><label for="tR">Responsable</label><select id="tR">${A.users.map((u) => `<option>${u.n}</option>`).join('')}</select></div><div><label for="tD">Fecha límite</label><input type="date" id="tD" value="${A.iso(A.addDays(TODAY, 7))}"></div></div>
      <label for="tL">Vincular con</label><select id="tL"><option value="">Nada</option>${A.activities.map((a) => `<option value="act:${a.id}">Actividad · ${a.name}</option>`).join('')}${A.supplies.map((m) => `<option value="sup:${m.id}">Pedido · ${m.name}</option>`).join('')}${A.cambios.map((c) => `<option value="cambio:${c.id}">Cambio · ${c.id}</option>`).join('')}</select>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Crear</button></div></form>`);
    U.$('#tkF').addEventListener('submit', (e) => {
      e.preventDefault();
      const lv = U.$('#tL').value, sel = U.$('#tL').selectedOptions[0].text;
      A.tareas.unshift({ id: 'T-' + (110 + A.tareas.length), t: U.$('#tT').value, resp: U.$('#tR').value, due: U.$('#tD').value, estado: 'pendiente', from: null, link: lv ? { t: lv.split(':')[0], id: lv.split(':')[1], label: sel.split(' · ')[1] || sel } : null });
      U.log('reuniones', 'Creó la tarea ' + U.$('#tT').value);
      U.closeModal(); U.rerender();
    });
  });
  act('newdec', () => {
    U.modal(`<div class="modal-head"><h2>Nueva decisión pendiente</h2></div><form class="form" id="ndF"><label for="ndT">Qué hay que decidir</label><input id="ndT" required><div class="row2"><div><label for="ndQ">Quién decide</label><select id="ndQ"><option>Promotor</option><option>Dirección de obra</option><option>Constructora</option></select></div><div><label for="ndD">Antes del</label><input type="date" id="ndD" value="${A.iso(A.addDays(TODAY, 10))}"></div></div>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Crear</button></div></form>`);
    U.$('#ndF').addEventListener('submit', (e) => { e.preventDefault(); A.decisiones.unshift({ id: 'DEC-0' + (8 + A.decisiones.length), t: U.$('#ndT').value, quien: U.$('#ndQ').value, due: U.$('#ndD').value, links: [], estado: 'pendiente' }); U.log('reuniones', 'Registró una decisión pendiente'); U.closeModal(); U.rerender(); });
  });
  act('newacta', () => {
    U.modal(`<div class="modal-head"><h2>Nueva acta</h2></div><form class="form" id="acF"><label for="aT">Título</label><input id="aT" required value="Reunión semanal de obra n.º 35">
      <div class="row2"><div><label for="aD">Fecha</label><input type="date" id="aD" value="${A.iso(TODAY)}"></div><div><label for="aY">Tipo</label><select id="aY"><option>Obra</option><option>Promotor</option><option>Seguridad</option></select></div></div>
      <label for="aA">Asistentes (separados por comas)</label><input id="aA" value="Marcos Ferrer, Lucía Montané, Clara Vidal">
      <label for="aP">Puntos tratados (uno por línea)</label><textarea id="aP" rows="3"></textarea>
      <label for="aC">Acuerdos (uno por línea: acuerdo · responsable)</label><textarea id="aC" rows="3" placeholder="Revisar replanteo de huecos · Marcos Ferrer"></textarea>
      <label class="check"><input type="checkbox" id="aTask" checked><span>Crear una tarea por cada acuerdo</span></label>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Guardar acta</button></div></form>`, 'wide');
    U.$('#acF').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = 'ACT-0' + (35 + A.reuniones.length - 3);
      const ac = U.$('#aC').value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [t, r] = l.split('·').map((x) => x.trim()); return { t, resp: r || U.me(), due: A.iso(A.addDays(TODAY, 7)), task: null }; });
      if (U.$('#aTask').checked) ac.forEach((a) => { const tid = 'T-' + (110 + A.tareas.length); A.tareas.unshift({ id: tid, t: a.t, resp: a.resp, due: a.due, estado: 'pendiente', from: id, link: null }); a.task = tid; });
      A.reuniones.unshift({ id, title: U.$('#aT').value, date: U.$('#aD').value, tipo: U.$('#aY').value, asistentes: U.$('#aA').value.split(',').map((x) => x.trim()), puntos: U.$('#aP').value.split('\n').filter(Boolean), acuerdos: ac });
      A.files.push({ id: 'DOC-' + id, folder: 'informes', name: 'Acta · ' + U.$('#aT').value, date: U.$('#aD').value, resp: U.me(), status: 'cargado', tags: ['acta'], links: [], size: '—', type: 'HTML' });
      U.log('reuniones', `Registró el acta «${U.$('#aT').value}» con ${ac.length} acuerdos`);
      S.reuSel = id; U.closeModal(); U.rerender();
    });
  });

  /* ═════════ INFORMES ═════════ */
  const TPL = [
    { id: 'semanal', name: 'Informe semanal', to: 'Interno', secs: ['avance', 'plan', 'fotos', 'suministros', 'incidencias'] },
    { id: 'mensual', name: 'Informe mensual', to: 'Interno', secs: ['avance', 'plan', 'fotos', 'economia', 'certificacion', 'suministros', 'incidencias', 'docs'] },
    { id: 'promotor', name: 'Seguimiento para el promotor', to: 'Promotor', secs: ['avance', 'plan', 'fotos', 'certificacion'] },
    { id: 'certificacion', name: 'Certificación del periodo', to: 'Promotor', secs: ['certificacion'] },
    { id: 'economico', name: 'Control económico', to: 'Dirección', secs: ['economia', 'certificacion'] },
    { id: 'subcontratas', name: 'Seguimiento de subcontratas', to: 'Dirección', secs: ['subcontratas', 'incidencias'] },
    { id: 'incidencias', name: 'Incidencias y repasos', to: 'Dirección de obra', secs: ['incidencias', 'fotos'] },
    { id: 'cierre', name: 'Cierre de obra', to: 'Promotor', secs: ['avance', 'economia', 'docs', 'subcontratas'] },
  ];
  const SECS = { avance: 'Avance de obra', plan: 'Planificación', fotos: 'Fotografías', economia: 'Control económico', certificacion: 'Certificaciones', suministros: 'Suministros', incidencias: 'Incidencias', subcontratas: 'Subcontratas', docs: 'Documentación pendiente' };
  S.infTpl = 'mensual';
  A.views.informes = {
    render() {
      const tpl = TPL.find((t) => t.id === S.infTpl);
      if (!S.infCfg || S.infCfg.tpl !== tpl.id) S.infCfg = { tpl: tpl.id, from: '2026-09-01', to: A.iso(TODAY), dest: tpl.to, secs: Object.fromEntries(Object.keys(SECS).map((k) => [k, tpl.secs.includes(k)])) };
      const c = S.infCfg;
      return `
      <header class="page-head compact"><div><div class="eyebrow">Generados con la información ya registrada</div><h1>Informes</h1></div></header>
      <div class="tpl-grid">${TPL.map((t) => `<button class="tpl ${t.id === tpl.id ? 'active' : ''}" data-action="inftpl:${t.id}">${ic('doc')}<strong>${t.name}</strong><span>${t.secs.map((s) => SECS[s]).join(' · ')}</span></button>`).join('')}</div>
      <section class="grid g-main">
        <article class="card"><div class="card-h"><h2>${tpl.name}</h2></div>
          <div class="card-b inf-cfg">
            <div class="row2"><label class="fsel"><span>Desde</span><input type="date" id="ifrom" value="${c.from}" data-change="infc:from"></label><label class="fsel"><span>Hasta</span><input type="date" id="ito" value="${c.to}" data-change="infc:to"></label></div>
            <label class="fsel"><span>Destinatario</span><select id="idest" data-change="infc:dest">${['Interno', 'Promotor', 'Dirección', 'Dirección de obra', 'Subcontrata'].map((d) => `<option ${c.dest === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
            <h3 class="mini">Secciones</h3><div class="sec-checks">${Object.keys(SECS).map((k) => `<label class="check"><input type="checkbox" ${c.secs[k] ? 'checked' : ''} data-change="infsec:${k}"><span>${SECS[k]}</span></label>`).join('')}</div>
            ${c.dest === 'Promotor' ? '<p class="muted small">Para el promotor se ocultan costes, márgenes y datos de subcontratas.</p>' : ''}
            <div class="btn-row"><button class="btn btn-primary" data-action="infprev">${ic('eye')}Vista previa</button>${U.can('informes') ? `<button class="btn" data-action="infemit">${ic('check')}Emitir</button>` : ''}<button class="btn" data-action="infpdf">${ic('download')}PDF</button><button class="btn" data-action="infxlsx">${ic('download')}Excel</button></div>
          </div></article>
        <article class="card"><div class="card-h"><h2>Informes emitidos</h2></div><ul class="devs">${A.informesEmitidos.map((r) => `<li><div><strong>${r.title}</strong><span class="muted small">${fdate(r.at, false)} · ${r.to} · ${r.by} · avance ${pct(r.avance, 1)}</span></div><button class="btn btn-sm" data-action="infview:${r.id}">Ver</button></li>`).join('')}</ul>
          <p class="muted small pad">Cada informe emitido guarda una copia de los datos de ese momento y aparece en Documentación › Informes y actas.</p></article>
      </section>
      ${S.infPreview ? `<article class="card report-wrap"><div class="card-h"><h2>Vista previa</h2><button class="btn btn-sm btn-icon btn-ghost" data-action="infclose" aria-label="Cerrar">${ic('x')}</button></div><div class="report">${reportHTML(c)}</div></article>` : ''}`;
    },
  };
  function reportHTML(c, snap) {
    const st = U.stats(), e = U.eco(), cli = c.dest === 'Promotor';
    const tpl = TPL.find((t) => t.id === c.tpl);
    const per = U.certPeriods().find((p) => p.status !== 'cerrada') || U.lastClosed();
    const photos = photoItems().filter((p) => S.reportPhotos[p.id]).concat(photoItems().slice(0, Object.values(S.reportPhotos).some(Boolean) ? 0 : 3));
    const s = c.secs;
    return `<div class="rep-page">
      <div class="rep-head"><span class="rep-brand">ATALAYA · CONTROL DE OBRA</span><span>${snap ? 'Emitido el ' + fdate(snap) : 'Borrador · ' + fdate(TODAY)}</span></div>
      <h1>${tpl.name}</h1><p class="rep-sub">${P.name} · ${P.address} · periodo ${fdate(c.from)} – ${fdate(c.to)} · para: ${c.dest}</p>
      <div class="rep-kpis"><div><span>Avance real</span><b>${pct(st.avance)}</b></div><div><span>Planificado</span><b>${pct(st.plan)}</b></div><div><span>Ruta crítica</span><b>+8 días</b></div><div><span>Entrega prevista</span><b>8 jul 2027</b></div></div>
      ${s.avance ? `<h2>Avance de obra</h2><div class="rep-chart">${U.sCurve()}</div><table class="table compact"><thead><tr><th>Capítulo</th><th class="num">Real</th><th class="num">Plan</th></tr></thead><tbody>${E.chapterStats().filter((x) => x.ej || x.pl).map((x) => `<tr><td>${x.code} ${x.name}</td><td class="num">${pct(x.avance, 0)}</td><td class="num">${pct(x.plan, 0)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${s.plan ? `<h2>Planificación</h2><ul>${A.hitos.map((h) => `<li>${h.name}: previsto ${fdate(h.fc)} (plan ${fdate(h.plan)})</li>`).join('')}</ul><p>Restricciones abiertas: ${A.restricciones.filter((q) => q.status === 'abierta').map((q) => q.text).join('; ') || 'ninguna'}.</p>` : ''}
      ${s.fotos ? `<h2>Fotografías</h2><div class="rep-photos">${photos.slice(0, 6).map((p) => `<figure><img src="${p.src}" alt=""><figcaption>${esc(p.title)} · ${fdate(p.date, false)}</figcaption></figure>`).join('')}</div>` : ''}
      ${s.certificacion ? `<h2>Certificaciones</h2><p>Certificado a origen: <b>${eur(U.certOrigen(U.lastClosed()) * K())}</b> (${U.lastClosed().label}). En curso: ${per.label}, ${U.chipText({ borrador: ['borrador'], revision: ['en revisión'], aprobada: ['aprobada'], cerrada: ['cerrada'] }, per.status)}, ${eur((U.certOrigen(per) - U.certOrigen(U.lastClosed())) * K())} a certificar.</p>` : ''}
      ${s.economia && !cli ? `<h2>Control económico</h2><table class="table compact"><tbody><tr><td>Venta vigente</td><td class="num">${eur(e.venta)}</td></tr><tr><td>Coste final previsto</td><td class="num">${eur(e.costeFinal)}</td></tr><tr><td>Margen previsto</td><td class="num">${pct(e.margen)}</td></tr><tr><td>Pendiente de cobro</td><td class="num">${eur(e.cobroPend)}</td></tr><tr><td>Pendiente de pago</td><td class="num">${eur(e.pagosPend)}</td></tr></tbody></table>` : ''}
      ${s.suministros ? `<h2>Suministros</h2><ul>${A.supplies.filter((m) => ['sin_pedido', 'retraso', 'parcial'].includes(m.status)).map((m) => `<li>${m.name}: ${U.chipText(A.supplyStatus, m.status).toLowerCase()}${m.status === 'sin_pedido' ? ', pedir antes del ' + fdate(E.orderBy(m), false) : ''}</li>`).join('')}</ul>` : ''}
      ${s.incidencias ? `<h2>Incidencias</h2><ul>${A.incidencias.filter((i) => i.estado !== 'cerrada').map((i) => `<li>${i.id} · ${i.title} (${i.ubic}) · ${U.chipText(A.incEstados, i.estado).toLowerCase()}</li>`).join('')}</ul>` : ''}
      ${s.subcontratas && !cli ? `<h2>Subcontratas</h2><table class="table compact"><thead><tr><th>Empresa</th><th class="num">Ejecutado</th><th class="num">Certificado</th><th class="num">Pagado</th></tr></thead><tbody>${A.subs.map((x) => { const r = E.subStats(x); return `<tr><td>${x.short}</td><td class="num">${eur(r.ej)}</td><td class="num">${eur(r.cert)}</td><td class="num">${eur(r.pag)}</td></tr>`; }).join('')}</tbody></table>` : ''}
      ${s.docs ? `<h2>Documentación pendiente</h2><ul>${U.missingDocs().slice(0, 10).map((m) => `<li>${m.req}</li>`).join('')}</ul>` : ''}
    </div>`;
  }
  const K = () => 1 + P.ggbi;
  act('inftpl', (id) => { S.infTpl = id; S.infPreview = false; U.rerender(); });
  act('infc', (k, _, v) => { S.infCfg[k] = v; if (S.infPreview) U.rerender(); });
  act('infsec', (k, _, on) => { S.infCfg.secs[k] = on; if (S.infPreview) U.rerender(); });
  act('infprev', () => { S.infPreview = true; U.rerender(); setTimeout(() => { const r = U.$('.report-wrap'); if (r) r.scrollIntoView({ behavior: 'smooth' }); }, 50); });
  act('infclose', () => { S.infPreview = false; U.rerender(); });
  act('infemit', () => {
    if (!U.guard('informes')) return;
    const c = JSON.parse(JSON.stringify(S.infCfg));
    const tpl = TPL.find((t) => t.id === c.tpl);
    const id = 'INF-' + Date.now().toString(36).toUpperCase();
    const html = reportHTML(c, TODAY);
    A.informesEmitidos.unshift({ id, tpl: c.tpl, title: tpl.name + ' · ' + fdate(TODAY), to: c.dest, at: A.iso(TODAY), by: U.me(), avance: U.stats().avance, snapshot: html, cfg: c });
    A.files.push({ id: 'DOC-' + id, folder: 'informes', name: tpl.name + ' · ' + fdate(TODAY), date: A.iso(TODAY), resp: U.me(), status: 'cargado', tags: [tpl.id], links: [], size: '—', type: 'Informe' });
    U.log('informes', `Emitió «${tpl.name}» para ${c.dest}`);
    U.toast(`${ic('check')}<span>Informe emitido y guardado en <b>Documentación › Informes y actas</b> con los datos de hoy.</span>`, 'ok');
    U.rerender();
  });
  act('infview', (id) => {
    const r = A.informesEmitidos.find((x) => x.id === id);
    U.modal(`<div class="modal-head"><h2>${r.title}</h2><span class="muted small">Copia de los datos del ${fdate(r.at)}</span></div><div class="report">${r.snapshot || `<div class="rep-page"><h1>${r.title}</h1><p class="rep-sub">${P.name} · para ${r.to} · emitido por ${r.by}</p><p>Avance real en la fecha de emisión: <b>${pct(r.avance)}</b>.</p><p class="muted">Informe emitido antes de la puesta en marcha de la aplicación: se conserva el documento original en Documentación.</p></div>`}</div>`, 'wide xl');
  });
  function chartPNG() {
    return new Promise((res) => {
      const svg = U.$('.report .chart') || (() => { const d = document.createElement('div'); d.innerHTML = U.sCurve(); return d.querySelector('svg'); })();
      const clone = svg.cloneNode(true);
      const cs = getComputedStyle(document.documentElement);
      const map = { '.grid': 'stroke:#d0d6d3', '.axis': 'fill:#7a868d;font:11px sans-serif', '.line-plan': 'fill:none;stroke:#7a868d;stroke-width:2;stroke-dasharray:5 4', '.line-real': 'fill:none;stroke:#1c5f8f;stroke-width:2.6', '.area-real': 'fill:#1c5f8f;opacity:.1', '.line-cert': 'fill:none;stroke:#2f8a57;stroke-width:1.8', '.today': 'stroke:#f2b705;stroke-width:2', '.today-label': 'fill:#48565f;font:600 11px sans-serif', '.gap': 'stroke:#c3412b;stroke-width:3;opacity:.6', '.dot-real': 'fill:#1c5f8f;stroke:#fff;stroke-width:2', '.dot-plan': 'fill:#fff;stroke:#7a868d;stroke-width:2' };
      Object.keys(map).forEach((sel) => clone.querySelectorAll(sel).forEach((n) => n.setAttribute('style', map[sel])));
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const vb = clone.getAttribute('viewBox').split(' ').map(Number);
      const img = new Image();
      img.onload = () => { const c = document.createElement('canvas'); c.width = vb[2] * 2; c.height = vb[3] * 2; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); res({ data: c.toDataURL('image/jpeg', 0.9), w: vb[2], h: vb[3] }); };
      img.onerror = () => res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
      void cs;
    });
  }
  act('infpdf', async () => {
    const c = S.infCfg, tpl = TPL.find((t) => t.id === c.tpl), st = U.stats(), e = U.eco(), cli = c.dest === 'Promotor';
    try {
      const doc = await U.pdfDoc();
      U.pdfHeader(doc, tpl.name, `${P.name} · ${fdate(c.from)} – ${fdate(c.to)} · para ${c.dest}`);
      let y = 38;
      doc.setFontSize(10);
      [['Avance real', pct(st.avance)], ['Planificado', pct(st.plan)], ['Ruta crítica', '+8 días'], ['Entrega prevista', '8 jul 2027']].forEach(([l, v], i) => { doc.setTextColor(120); doc.text(l, 14 + i * 47, y); doc.setTextColor(20); doc.setFontSize(14); doc.text(v, 14 + i * 47, y + 7); doc.setFontSize(10); });
      y += 16;
      const sec = (t) => { if (y > 255) { doc.addPage(); y = 20; } doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(t, 14, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); y += 6; };
      const table = (head, body) => { doc.autoTable({ startY: y, head: [head], body, styles: { fontSize: 8 }, headStyles: { fillColor: [21, 33, 42] }, margin: { left: 14, right: 14 } }); y = doc.lastAutoTable.finalY + 8; };
      if (c.secs.avance) {
        sec('Avance de obra');
        const png = await chartPNG();
        if (png) { doc.addImage(png.data, 'JPEG', 14, y, 182, (182 * png.h) / png.w); y += (182 * png.h) / png.w + 4; }
        table(['Capítulo', 'Real', 'Plan'], E.chapterStats().filter((x) => x.ej || x.pl).map((x) => [x.code + ' ' + x.name, pct(x.avance, 0), pct(x.plan, 0)]));
      }
      if (c.secs.plan) { sec('Planificación'); table(['Hito', 'Plan', 'Previsto'], A.hitos.map((h) => [h.name, fdate(h.plan), fdate(h.fc)])); }
      if (c.secs.fotos) {
        sec('Fotografías');
        const ph = photoItems().filter((p) => S.reportPhotos[p.id]);
        const list = (ph.length ? ph : photoItems().slice(0, 4)).slice(0, 4);
        list.forEach((p, i) => { if (y > 220) { doc.addPage(); y = 20; } const x = 14 + (i % 2) * 92; try { doc.addImage(p.src, p.src.startsWith('data:image/png') ? 'PNG' : 'JPEG', x, y, 88, 55); } catch (err) { /* formato no admitido */ } doc.setFontSize(8); doc.text(p.title.slice(0, 60), x, y + 59); if (i % 2) y += 64; });
        if (list.length % 2) y += 64;
      }
      if (c.secs.certificacion) { sec('Certificaciones'); table(['Periodo', 'Estado', 'Importe PEM'], U.certPeriods().map((p, i, a) => [p.label, U.chipText({ borrador: ['Borrador'], revision: ['En revisión'], aprobada: ['Aprobada'], cerrada: ['Cerrada'] }, p.status), eur(U.certOrigen(p) - (i ? U.certOrigen(a[i - 1]) : 0))])); }
      if (c.secs.economia && !cli) { sec('Control económico'); table(['Concepto', 'Importe'], [['Venta vigente', eur(e.venta)], ['Coste final previsto', eur(e.costeFinal)], ['Margen previsto', pct(e.margen)], ['Pendiente de cobro', eur(e.cobroPend)], ['Pendiente de pago', eur(e.pagosPend)]]); }
      if (c.secs.suministros) { sec('Suministros'); table(['Material', 'Estado', 'Necesario'], A.supplies.filter((m) => !['completa', 'cancelado'].includes(m.status)).map((m) => [m.name, U.chipText(A.supplyStatus, m.status), fdate(m.needed, false)])); }
      if (c.secs.incidencias) { sec('Incidencias'); table(['Id', 'Incidencia', 'Ubicación', 'Estado'], A.incidencias.filter((i) => i.estado !== 'cerrada').map((i) => [i.id, i.title, i.ubic, U.chipText(A.incEstados, i.estado)])); }
      if (c.secs.subcontratas && !cli) { sec('Subcontratas'); table(['Empresa', 'Ejecutado', 'Certificado', 'Pagado'], A.subs.map((x) => { const r = E.subStats(x); return [x.short, eur(r.ej), eur(r.cert), eur(r.pag)]; })); }
      if (c.secs.docs) { sec('Documentación pendiente'); table(['Documento'], U.missingDocs().slice(0, 15).map((m) => [m.req])); }
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140); doc.text(`${P.name} · ${tpl.name} · página ${i} de ${pages}`, 14, 290); }
      await U.download(`${tpl.name.replace(/\s+/g, '_')}_${A.iso(TODAY)}.pdf`, doc.output('blob'));
    } catch (err) { U.toast(`${ic('alert')}<span>No se pudo generar el PDF (${esc(err.message)}).</span>`, 'warn'); }
  });
  act('infxlsx', () => {
    const e = U.eco();
    U.exportXlsx(`Informe_${A.iso(TODAY)}.xlsx`, [
      { name: 'Avance', rows: [['Capítulo', 'Importe', 'Real', 'Plan']].concat(E.chapterStats().map((x) => [x.code + ' ' + x.name, Math.round(x.total), +x.avance.toFixed(4), +x.plan.toFixed(4)])), widths: [40, 14, 10, 10] },
      { name: 'Economía', rows: [['Concepto', 'Importe'], ['Venta vigente', Math.round(e.venta)], ['Coste final previsto', Math.round(e.costeFinal)], ['Margen previsto', +e.margen.toFixed(4)], ['Certificado', Math.round(e.certificado)], ['Cobrado', Math.round(e.cobrado)], ['Pendiente de cobro', Math.round(e.cobroPend)], ['Pendiente de pago', Math.round(e.pagosPend)]], widths: [30, 14] },
      { name: 'Suministros', rows: [['Pedido', 'Proveedor', 'Estado', 'Necesario', 'Importe']].concat(A.supplies.map((m) => [m.name, (U.prov(m.prov) || {}).name || '', U.chipText(A.supplyStatus, m.status), m.needed, Math.round(m.importe)])), widths: [40, 30, 18, 12, 12] },
      { name: 'Incidencias', rows: [['Id', 'Incidencia', 'Ubicación', 'Subcontrata', 'Prioridad', 'Estado', 'Fecha límite']].concat(A.incidencias.map((i) => [i.id, i.title, i.ubic, U.subName(i.sub), i.prio, U.chipText(A.incEstados, i.estado), i.due])), widths: [9, 45, 25, 20, 9, 18, 12] },
    ]).catch(() => U.toast(`${ic('alert')}<span>No se pudo generar el Excel.</span>`, 'warn'));
  });

  /* ═════════ ENTREGAS Y POSVENTA ═════════ */
  S.entTab = 'preparacion';
  A.entregas = {};
  A.vivs.forEach((v) => { A.entregas[v.key] = { check: A.checkTemplates.find((t) => t.id === 'CK-ENT').items.map(() => false), repasos: [], llaves: null }; });
  A.views.entregas = {
    render() {
      const t = S.entTab;
      return `
      <header class="page-head compact"><div><div class="eyebrow">Revisiones previas, repasos, llaves, garantías y posventa</div><h1>Entregas y posventa</h1></div>
        <div class="head-actions"><div class="seg" role="tablist">${[['preparacion', 'Preparación de entregas'], ['posventa', 'Posventa'], ['final', 'Documentación final']].map(([k, l]) => `<button data-action="enttab:${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</div></div></header>
      ${t === 'preparacion' ? prepHTML() : t === 'posventa' ? pvHTML() : finalHTML()}`;
    },
  };
  function entState(k) {
    const e = A.entregas[k];
    if (e.llaves) return ['Entregada', 'st-ok'];
    if (e.check.every(Boolean) && !e.repasos.some((r) => !r.ok)) return ['Lista para entregar', 'st-review'];
    if (e.repasos.length || e.check.some(Boolean)) return ['Repasos en curso', 'st-progress'];
    const pr = U.vivProgress(k); const done = pr.reduce((s, x) => s + x.done, 0) / pr.length;
    return done > 0 ? ['En obra · ' + pct(done, 0), 'st-none'] : ['Sin empezar', 'st-none'];
  }
  function prepHTML() {
    const sel = S.entViv ? A.vivs.find((v) => v.key === S.entViv) : null;
    return `<p class="muted">Las entregas están previstas entre el 14 y el 21 de junio de 2027. Puedes preparar ya la revisión previa de cada vivienda.</p>
    <article class="card"><div class="table-wrap"><table class="table subs"><thead><tr><th>Vivienda</th><th>Comprador</th><th>Entrega prevista</th><th>Revisión previa</th><th>Repasos</th><th>Llaves</th><th>Estado</th></tr></thead>
      <tbody>${A.vivs.map((v) => { const e = A.entregas[v.key], c = A.compradores.find((x) => x.viv === v.key), s = entState(v.key); return `<tr class="${S.entViv === v.key ? 'sel' : ''}" data-action="entviv:${v.key}" tabindex="0"><td><strong>${v.name}</strong></td><td>${c.reservada ? c.name : '<span class="muted">Sin reservar</span>'}</td><td>${fdate(c.entrega, false)}</td><td>${e.check.filter(Boolean).length}/${e.check.length}</td><td>${e.repasos.filter((r) => !r.ok).length} abiertos</td><td>${e.llaves ? fdate(e.llaves.date, false) : '—'}</td><td><span class="chip ${s[1]}"><i></i>${s[0]}</span></td></tr>`; }).join('')}</tbody></table></div></article>
    ${sel ? (() => { const e = A.entregas[sel.key]; const tpl = A.checkTemplates.find((t) => t.id === 'CK-ENT'); const ready = e.check.every(Boolean) && !e.repasos.some((r) => !r.ok); return `<section class="grid g-2">
      <article class="card"><div class="card-h"><h2>Revisión previa · ${sel.name}</h2></div><ul class="checklist">${tpl.items.map((it, i) => `<li><label class="check"><input type="checkbox" ${e.check[i] ? 'checked' : ''} ${U.can('entregas') ? '' : 'disabled'} data-change="entck:${sel.key}:${i}"><span>${it}</span></label></li>`).join('')}</ul></article>
      <article class="card"><div class="card-h"><h2>Repasos</h2></div><ul class="devs">${e.repasos.map((r, i) => `<li><div><strong>${esc(r.t)}</strong><span class="muted small">${U.subName(r.sub)}</span></div>${r.ok ? chip('validado', 'Hecho') : U.can('entregas') ? `<button class="btn btn-sm" data-action="entrepok:${sel.key}:${i}">Marcar hecho</button>` : chip('ejecucion', 'Pendiente')}</li>`).join('') || '<li class="muted">Sin repasos</li>'}</ul>
        ${U.can('entregas') ? `<form class="form inline-form" id="repF"><input id="repT" placeholder="Nuevo repaso (p. ej. desconchón en puerta de baño)" aria-label="Repaso"><select id="repS" aria-label="Empresa">${A.subs.map((s) => `<option value="${s.id}">${s.short}</option>`).join('')}</select><button class="btn btn-sm">Añadir</button></form>` : ''}
        <div class="card-f">${e.llaves ? `<span>${ic('key')} Llaves entregadas el ${fdate(e.llaves.date)} a ${esc(e.llaves.to)}</span>` : U.can('entregas') ? `<button class="btn btn-primary" data-action="llaves:${sel.key}" ${ready ? '' : 'disabled'}>${ic('key')}Registrar entrega de llaves</button>${ready ? '' : '<span class="muted small">Completa la revisión y los repasos</span>'}` : ''}</div></article></section>`; })() : ''}`;
  }
  function pvHTML() {
    const list = A.posventa;
    const next = { comunicada: ['asignada', 'Asignar'], asignada: ['reparacion', 'Iniciar reparación'], reparacion: ['resuelta', 'Marcar resuelta'], resuelta: ['aceptada', 'Aceptación del propietario'] };
    return `<article class="card"><div class="card-h wrap"><div><h2>Edificio Albereda 12</h2><div class="muted small">Entregado el 13 mar 2026 · 14 viviendas y local · garantías según la LOE</div></div>${U.can('entregas') ? `<button class="btn btn-sm" data-action="newpv">${ic('plus')}Nueva incidencia de posventa</button>` : ''}</div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Incidencia</th><th>Vivienda</th><th>Comunicada</th><th>Empresa</th><th>Garantía</th><th>Plazo</th><th>Estado</th><th></th></tr></thead>
      <tbody>${list.map((p) => { const late = !['resuelta', 'aceptada'].includes(p.estado) && U.toDate(p.due) < TODAY; return `<tr><td><span class="mono small">${p.id}</span> <strong>${esc(p.t)}</strong></td><td>${p.viv}</td><td>${fdate(p.com, false)}</td><td>${p.emp}</td><td class="small">${p.garantia}</td><td class="${late ? 'neg' : ''}">${fdate(p.due, false)}</td><td>${U.chipOf(A.pvEstados, p.estado)}</td><td>${next[p.estado] && U.can('entregas') ? `<button class="btn btn-sm" data-action="pvnext:${p.id}">${next[p.estado][1]}</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div></article>`;
  }
  function finalHTML() {
    const fs = filesIn('entrega');
    return `<article class="card"><div class="card-h"><h2>Documentación final · Mirador del Turia</h2><button class="btn btn-sm" data-action="goto:documentacion:entrega">${ic('folder')}Abrir carpeta</button></div>
      <ul class="reqs">${A.requisitos.entrega.map((r) => { const f = fs.find((x) => x.req === r); return `<li class="r-${f ? 'cargado' : 'pendiente'}"><span class="req-ic">${ic(f ? 'check' : 'doc')}</span><div><strong>${r}</strong><span class="muted small">${f ? f.name : 'Se preparará al final de la obra'}</span></div>${U.chipOf(A.docStatus, f ? 'cargado' : 'pendiente')}</li>`; }).join('')}</ul></article>
      <article class="card"><div class="card-h"><h2>Plazos de garantía</h2></div><table class="table compact"><tbody><tr><td>Acabados</td><td>1 año</td></tr><tr><td>Habitabilidad (instalaciones, cerramientos)</td><td>3 años</td></tr><tr><td>Estructura</td><td>10 años · seguro decenal</td></tr></tbody></table></article>`;
  }
  act('enttab', (t) => { S.entTab = t; U.rerender(); });
  act('entviv', (k) => { S.entViv = k; U.rerender(); setTimeout(() => { const f = U.$('#repF'); if (f) f.addEventListener('submit', (e) => { e.preventDefault(); const t = U.$('#repT').value.trim(); if (!t) return; A.entregas[k].repasos.push({ t, sub: U.$('#repS').value, ok: false }); U.log('entregas', `Añadió un repaso en ${A.vivs.find((v) => v.key === k).name}`); U.rerender(); A.actions.entviv(k); }); }); });
  act('entck', (k, i, on) => { A.entregas[k].check[+i] = on; U.rerender(); A.actions.entviv(k); });
  act('entrepok', (k, i) => { A.entregas[k].repasos[+i].ok = true; U.rerender(); A.actions.entviv(k); });
  act('llaves', (k) => {
    const v = A.vivs.find((x) => x.key === k), c = A.compradores.find((x) => x.viv === k);
    U.modal(`<div class="modal-head"><h2>Entrega de llaves · ${v.name}</h2></div><form class="form" id="llF"><label for="llT">Recibe</label><input id="llT" value="${esc(c.name)}"><label for="llD">Fecha</label><input type="date" id="llD" value="${A.iso(TODAY)}"><label for="llA">Acta firmada</label><input type="file" id="llA">
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Registrar</button></div></form>`);
    U.$('#llF').addEventListener('submit', (e) => { e.preventDefault(); A.entregas[k].llaves = { to: U.$('#llT').value, date: U.$('#llD').value }; const f = U.$('#llA').files[0]; if (f) A.files.push(fileRec(f, { folder: 'entrega', name: 'Acta de entrega ' + v.name + ' · ' + f.name, tags: ['entrega'] })); U.log('entregas', `Registró la entrega de llaves de ${v.name}`); U.closeModal(); U.rerender(); A.actions.entviv(k); });
  });
  act('pvnext', (id) => { const p = A.posventa.find((x) => x.id === id); const nx = { comunicada: 'asignada', asignada: 'reparacion', reparacion: 'resuelta', resuelta: 'aceptada' }[p.estado]; const b = U.chipText(A.pvEstados, p.estado); p.estado = nx; U.log('entregas', `Posventa ${id}`, b, U.chipText(A.pvEstados, nx)); U.rerender(); });
  act('newpv', () => {
    U.modal(`<div class="modal-head"><h2>Nueva incidencia de posventa</h2></div><form class="form" id="pvF"><label for="pvT">Descripción</label><input id="pvT" required><div class="row2"><div><label for="pvV">Vivienda</label><input id="pvV" value="2ºA"></div><div><label for="pvG">Garantía</label><select id="pvG"><option>1 año · acabados</option><option>3 años · habitabilidad</option><option>10 años · estructura</option></select></div></div>
      <label for="pvE">Empresa responsable</label><select id="pvE">${A.subs.map((s) => `<option>${s.name}</option>`).join('')}<option>Aluminios Puçol</option></select>
      <div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Registrar</button></div></form>`);
    U.$('#pvF').addEventListener('submit', (e) => { e.preventDefault(); A.posventa.unshift({ id: 'PV-0' + (32 + A.posventa.length - 7), obra: 'OB-2509', viv: U.$('#pvV').value, t: U.$('#pvT').value, com: A.iso(TODAY), emp: U.$('#pvE').value, estado: 'comunicada', garantia: U.$('#pvG').value, due: A.iso(A.addDays(TODAY, 14)) }); U.log('entregas', 'Registró una incidencia de posventa'); U.closeModal(); U.rerender(); });
  });

  /* ═════════ DATOS E INTEGRACIONES ═════════ */
  const FILES = [
    { name: 'Arquitectura_v3.ifc', kind: 'Modelo BIM · IFC4', size: '48,2 MB', date: '28 ago 2026', info: '1.032 entidades · 325 elementos vinculados' },
    { name: 'Estructura_v5.ifc', kind: 'Modelo BIM · IFC4', size: '31,7 MB', date: '3 jul 2026', info: '85 elementos vinculados' },
    { name: 'Presupuesto_contrato.bc3', kind: 'Presupuesto · FIEBDC-3', size: '412 kB', date: '20 ene 2026', info: '13 capítulos · 25 partidas' },
    { name: 'Planificacion_rev2.xml', kind: 'Planificación · MS Project', size: '96 kB', date: '15 jun 2026', info: '15 actividades · 22 dependencias' },
    { name: 'Contratos_subcontratas.zip', kind: 'Contratos · 5 PDF', size: '8,4 MB', date: '2 feb 2026', info: 'Precios, retenciones y plazos de pago' },
  ];
  A.integraciones = [
    { cat: 'Contabilidad', items: ['A3 Asesor', 'Sage 200', 'Holded'], on: 'Sage 200' },
    { cat: 'Presupuestos y mediciones', items: ['Presto', 'Arquímedes', 'TCQ'], on: 'Presto' },
    { cat: 'Planificación', items: ['MS Project', 'Primavera P6'], on: 'MS Project' },
    { cat: 'Almacenamiento de documentos', items: ['Google Drive', 'SharePoint', 'Dropbox'], on: null },
    { cat: 'Modelos BIM', items: ['Autodesk Construction Cloud', 'BIMcollab (BCF)'], on: null },
  ];
  A.views.datos = {
    render() {
      return `
      <header class="page-head compact"><div><div class="eyebrow">Modelos, importaciones, exportaciones, conexiones y trabajo sin conexión</div><h1>Datos e integraciones</h1></div>
        <div class="head-actions">${U.can('datos') ? `<button class="btn" data-action="ingest">${ic('upload')}Cargar nueva versión del modelo</button>` : ''}<button class="btn btn-primary" data-action="exportall">${ic('download')}Exportar la obra completa</button></div></header>
      <section class="grid g-main">
        <article class="card"><div class="card-h"><h2>Archivos de origen</h2></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>Archivo</th><th>Tipo</th><th>Contenido</th><th>Actualizado</th></tr></thead>
          <tbody id="filesBody">${FILES.map((f) => `<tr><td><span class="mono">${f.name}</span></td><td>${f.kind}<div class="muted small">${f.size}</div></td><td>${f.info}</td><td>${f.date}</td></tr>`).join('')}</tbody></table></div><div id="ingest"></div></article>
        <article class="card"><div class="card-h"><h2>Calidad de datos</h2></div><ul class="checks">
          <li class="ok">${ic('check')}<div><strong>Niveles asignados</strong><span>${A.elements.length} de ${A.elements.length} elementos</span></div></li>
          <li class="warn">${ic('alert')}<div><strong>Tabiques sin cantidades Qto</strong><span>80 elementos: superficie calculada a partir de la geometría</span></div></li>
          <li class="warn">${ic('alert')}<div><strong>Instalaciones sin geometría en el IFC</strong><span>40 recorridos dibujados de forma esquemática y marcados como tales</span></div></li>
          <li class="info">${ic('doc')}<div><strong>Partidas sin elementos en el modelo</strong><span>${A.partidas.filter((p) => !p.model).length} de ${A.partidas.length}: avance por parte de obra</span></div></li>
          <li class="ok">${ic('check')}<div><strong>Planificación vinculada</strong><span>15 actividades con zona, capítulo y dependencias</span></div></li></ul></article>
      </section>
      <section class="grid g-2">
        <article class="card"><div class="card-h"><h2>Importar</h2></div><ul class="devs">
          <li><div><strong>Presupuesto</strong><span class="muted small">BC3 (FIEBDC-3), Excel o CSV</span></div><button class="btn btn-sm" data-action="presimport">Importar</button></li>
          <li><div><strong>Planificación</strong><span class="muted small">MS Project XML o Excel</span></div><label class="btn btn-sm file-btn">Importar<input type="file" accept=".xml,.xlsx,.csv" data-change="impplan"></label></li>
          <li><div><strong>Modelo BIM</strong><span class="muted small">IFC 2x3 o IFC4; los elementos se reconocen por su GlobalId</span></div>${U.can('datos') ? '<button class="btn btn-sm" data-action="ingest">Cargar versión</button>' : ''}</li></ul>
          <div id="impPlanRes"></div></article>
        <article class="card"><div class="card-h"><h2>Trabajo en obra sin conexión</h2></div><div class="card-b">
          <p>Avances, fotos, incidencias y partes se guardan en el dispositivo y se sincronizan al recuperar cobertura. Si alguien ha cambiado el mismo registro, la aplicación muestra el conflicto para elegir.</p>
          <button class="btn" data-action="offline">${ic(S.offline ? 'wifi' : 'wifiOff')}${S.offline ? 'Volver a conectar' : 'Probar sin conexión'}</button></div></article>
      </section>
      <article class="card"><div class="card-h"><h2>Conexiones con otros programas</h2><span class="muted">Configuración de ejemplo en el prototipo</span></div>
        <div class="integ">${A.integraciones.map((g) => `<div><h3 class="mini">${g.cat}</h3>${g.items.map((it) => `<div class="integ-row"><span>${it}</span>${g.on === it ? '<span class="chip st-ok"><i></i>Conectado</span>' : `<button class="btn btn-sm" data-action="integ:${A.integraciones.indexOf(g)}:${g.items.indexOf(it)}">Conectar</button>`}</div>`).join('')}</div>`).join('')}</div></article>`;
    },
  };
  act('integ', (g, i) => { if (!U.guard('datos')) return; const x = A.integraciones[+g]; x.on = x.items[+i]; U.log('datos', `Conectó ${x.on} (${x.cat})`); U.toast(`${ic('link')}<span>${x.on} conectado. En el prototipo la conexión es de ejemplo.</span>`, 'ok'); U.rerender(); });
  act('impplan', async (_, __, ___, el) => {
    const f = el.files[0];
    if (!f) return;
    const box = U.$('#impPlanRes');
    try {
      if (/\.xml$/i.test(f.name)) {
        const xml = new DOMParser().parseFromString(await f.text(), 'application/xml');
        const tasks = Array.from(xml.getElementsByTagName('Task')).map((t) => ({ name: (t.getElementsByTagName('Name')[0] || {}).textContent, start: (t.getElementsByTagName('Start')[0] || {}).textContent, finish: (t.getElementsByTagName('Finish')[0] || {}).textContent })).filter((t) => t.name);
        box.innerHTML = `<div class="card-b"><h3 class="mini">${esc(f.name)} · ${tasks.length} tareas leídas</h3><ul class="evid">${tasks.slice(0, 8).map((t) => `<li><span>${esc(t.name)} · ${(t.start || '').slice(0, 10)} → ${(t.finish || '').slice(0, 10)}</span></li>`).join('')}</ul><p class="muted small">Se guardará como previsión alternativa para compararla con la planificación aprobada.</p></div>`;
      } else {
        await U.lib('xlsx');
        const wb = window.XLSX.read(await f.arrayBuffer(), { type: 'array' });
        const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).filter((r) => r.length);
        box.innerHTML = `<div class="card-b"><h3 class="mini">${esc(f.name)} · ${rows.length - 1} filas leídas</h3><p class="muted small">Columnas: ${esc((rows[0] || []).join(', '))}</p></div>`;
      }
      U.log('datos', 'Importó la planificación ' + f.name);
    } catch (err) { box.innerHTML = `<p class="neg pad">No se pudo leer el archivo.</p>`; }
  });
  act('ingest', () => {
    const box = U.$('#ingest');
    if (!box) { U.go('datos'); return; }
    const steps = [
      ['Leyendo Arquitectura_v4.ifc', 'IFC4 · 1.047 entidades'],
      ['Extrayendo geometría, niveles y cantidades', '167 elementos constructivos'],
      ['Comparando con la versión 3 por GlobalId', '6 modificados · 2 nuevos · 0 eliminados'],
      ['Conservando historial y estados validados', 'Ningún elemento pierde su avance ni se cuenta dos veces'],
      ['Recalculando mediciones', '04.01 Fachada: +12,6 m² (peto de cubierta)'],
    ];
    box.innerHTML = `<div class="ingest"><h3 class="mini">Carga en curso</h3><ol>${steps.map((s, i) => `<li id="ing${i}"><span class="ing-dot"></span><div><strong>${s[0]}</strong><span>${s[1]}</span></div></li>`).join('')}</ol></div>`;
    let i = 0;
    U.$('#ing0').classList.add('run');
    const t = setInterval(() => {
      const li = U.$('#ing' + i);
      if (li) { li.classList.remove('run'); li.classList.add('done'); }
      i++;
      if (i >= steps.length) {
        clearInterval(t);
        box.querySelector('h3').textContent = 'Versión 4 cargada';
        const tb = U.$('#filesBody');
        if (tb) tb.rows[0].innerHTML = `<td><span class="mono">Arquitectura_v4.ifc</span> <span class="chip st-ok"><i></i>Nueva</span></td><td>Modelo BIM · IFC4<div class="muted small">49,0 MB</div></td><td>1.047 entidades · 327 elementos vinculados</td><td>${fdate(TODAY)}</td>`;
        U.log('datos', 'Cargó Arquitectura_v4.ifc conservando el historial');
        U.toast(`${ic('check')}<span>Modelo actualizado. <b>Historial conservado</b>: ningún elemento se ha contado dos veces.</span>`, 'ok');
      } else { const n = U.$('#ing' + i); if (n) n.classList.add('run'); }
    }, 700);
  });
  act('exportall', async () => {
    try {
      U.toast(`${ic('download')}<span>Preparando el archivo de la obra…</span>`);
      await U.lib('jszip');
      const zip = new window.JSZip();
      const plain = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k === 'snapshot' || k === 'url' || k === 'upload' || k === '_thumb' || k === 'stampText' ? undefined : v)));
      zip.file('obra.json', JSON.stringify(plain({ proyecto: P, partidas: A.partidas, actividades: A.activities, hitos: A.hitos, pedidos: A.supplies, proveedores: A.proveedores, subcontratas: A.subs, facturas: A.facturas, movimientos: A.movimientos, cambios: A.cambios, desviaciones: A.desviaciones, incidencias: A.incidencias, diario: A.diario, reuniones: A.reuniones, tareas: A.tareas, registro: A.audit }), null, 2));
      const csv = (rows) => rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
      zip.file('presupuesto.csv', '﻿' + csv([['Código', 'Descripción', 'Unidad', 'Medición', 'Precio', 'Importe', 'Avance']].concat(A.partidas.map((p) => [p.code, p.desc, p.unit, p.qty, p.price, E.importe(p).toFixed(2), E.partidaAvance(p).toFixed(4)]))));
      zip.file('elementos_bim.csv', '﻿' + csv([['Id', 'GlobalId', 'Tipo IFC', 'Nivel', 'Partida', 'Medición', 'Estado']].concat(A.elements.map((e) => [e.id, e.gid, e.ifc, e.level, e.partida, e.qty, E.displayState(e)]))));
      zip.file('documentos.csv', '﻿' + csv([['Id', 'Carpeta', 'Nombre', 'Fecha', 'Estado']].concat(A.files.map((f) => [f.id, f.folder, f.name, f.date, U.docState(f)]))));
      const up = A.files.filter((f) => f.url);
      for (const f of up) { try { zip.file('documentos/' + f.name.replace(/[\\/:*?"<>|]/g, '_'), await (await fetch(f.url)).blob()); } catch (err) { /* archivo no disponible */ } }
      const blob = await zip.generateAsync({ type: 'blob' });
      await U.download(`Obra_${P.code}_${A.iso(TODAY)}.zip`, blob);
      U.log('datos', 'Exportó la obra completa');
    } catch (err) { U.toast(`${ic('alert')}<span>No se pudo generar la exportación.</span>`, 'warn'); }
  });

  /* ═════════ USUARIOS Y PERMISOS ═════════ */
  const MODS = U.NAV.flatMap((g) => g.items.map((i) => [i[0], i[1]]));
  const LV = { none: 'Sin acceso', view: 'Ver', edit: 'Editar', approve: 'Aprobar' };
  A.views.usuarios = {
    render() {
      const edit = U.can('usuarios');
      return `
      <header class="page-head compact"><div><div class="eyebrow">Perfiles por obra y función</div><h1>Usuarios y permisos</h1></div>
        <div class="head-actions">${edit ? `<button class="btn btn-primary" data-action="invite">${ic('plus')}Invitar usuario</button>` : ''}</div></header>
      <article class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Persona</th><th>Correo</th><th>Perfil</th><th>Empresa</th><th>Obras</th></tr></thead>
        <tbody>${A.users.map((u) => `<tr><td><strong>${u.n}</strong></td><td class="small">${u.email}</td><td>${edit ? `<select data-change="urole:${A.users.indexOf(u)}" aria-label="Perfil de ${u.n}">${A.roles.map((r) => `<option value="${r.id}" ${u.role === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select>` : U.roleName(u.role)}</td><td>${u.emp}</td><td class="small">${u.obras}</td></tr>`).join('')}</tbody></table></div>
        <p class="muted small pad">Prueba el selector «Ver como» de la barra superior para ver la aplicación con cada perfil.</p></article>
      <article class="card"><div class="card-h"><h2>Permisos por perfil</h2>${edit ? '' : '<span class="muted">Solo la dirección puede cambiarlos</span>'}</div><div class="table-wrap"><table class="table compact perm">
        <thead><tr><th>Apartado</th>${A.roles.map((r) => `<th>${r.name}</th>`).join('')}</tr></thead>
        <tbody>${MODS.map(([m, l]) => `<tr><td>${l}</td>${A.roles.map((r) => { const v = A.perms[r.id][m] || 'none'; return `<td>${edit ? `<select class="perm-sel p-${v}" data-change="perm:${r.id}:${m}" aria-label="${l} · ${r.name}">${Object.keys(LV).map((k) => `<option value="${k}" ${v === k ? 'selected' : ''}>${LV[k]}</option>`).join('')}</select>` : `<span class="perm-tag p-${v}">${LV[v]}</span>`}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></article>`;
    },
  };
  act('perm', (r, m, v) => { const b = A.perms[r][m]; A.perms[r][m] = v; U.log('usuarios', `Cambió el permiso de ${U.roleName(r)} en ${U.viewTitle(m)}`, LV[b], LV[v]); U.rerender(); });
  act('urole', (i, _, v) => { const u = A.users[+i]; const b = U.roleName(u.role); u.role = v; U.log('usuarios', `Cambió el perfil de ${u.n}`, b, U.roleName(v)); });
  act('invite', () => {
    U.modal(`<div class="modal-head"><h2>Invitar usuario</h2></div><form class="form" id="invF"><label for="vN">Nombre</label><input id="vN" required><label for="vE">Correo</label><input id="vE" type="email" required><div class="row2"><div><label for="vR">Perfil</label><select id="vR">${A.roles.map((r) => `<option value="${r.id}">${r.name}</option>`).join('')}</select></div><div><label for="vC">Empresa</label><input id="vC"></div></div>
      <p class="muted small">En el prototipo no se envía ningún correo.</p><div class="form-actions"><button type="button" class="btn" data-action="closemodal">Cancelar</button><button class="btn btn-primary">Añadir</button></div></form>`);
    U.$('#invF').addEventListener('submit', (e) => { e.preventDefault(); A.users.push({ n: U.$('#vN').value, email: U.$('#vE').value, role: U.$('#vR').value, emp: U.$('#vC').value, obras: 'OB-2611' }); U.log('usuarios', 'Añadió a ' + U.$('#vN').value); U.closeModal(); U.rerender(); });
  });

  /* ═════════ REGISTRO DE CAMBIOS ═════════ */
  A.views.registro = {
    render() {
      const f = S.regF || {};
      const list = A.audit.filter((a) => (!f.mod || a.mod === f.mod) && (!f.who || a.who === f.who));
      return `
      <header class="page-head compact"><div><div class="eyebrow">Quién cambió qué y cuándo</div><h1>Registro de cambios</h1></div>
        <div class="head-actions"><button class="btn" data-action="regcsv">${ic('download')}Exportar</button></div></header>
      <article class="card"><div class="card-h wrap"><h2>${list.length} registros</h2><div class="filters tight">
        <label class="fsel inline"><span>Apartado</span><select data-change="regf:mod" id="rgm"><option value="">Todos</option>${[...new Set(A.audit.map((a) => a.mod))].map((m) => `<option value="${m}" ${f.mod === m ? 'selected' : ''}>${U.viewTitle(m) || m}</option>`).join('')}</select></label>
        <label class="fsel inline"><span>Persona</span><select data-change="regf:who" id="rgw"><option value="">Todas</option>${[...new Set(A.audit.map((a) => a.who))].map((w) => `<option ${f.who === w ? 'selected' : ''}>${w}</option>`).join('')}</select></label></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Persona</th><th>Apartado</th><th>Cambio</th><th>Antes</th><th>Después</th></tr></thead>
        <tbody>${list.map((a) => `<tr><td class="small">${fdt(a.at)}</td><td>${a.who}</td><td>${U.viewTitle(a.mod) || a.mod}</td><td>${esc(a.what)}${a.pending ? ' <span class="chip st-progress"><i></i>sin sincronizar</span>' : ''}</td><td class="muted">${a.before != null ? esc(a.before) : ''}</td><td>${a.after != null ? esc(a.after) : ''}</td></tr>`).join('')}</tbody></table></div></article>`;
    },
  };
  act('regf', (k, _, v) => { S.regF = Object.assign(S.regF || {}, { [k]: v }); U.rerender(); });
  act('regcsv', () => {
    const rows = [['Fecha', 'Persona', 'Apartado', 'Cambio', 'Antes', 'Después']].concat(A.audit.map((a) => [a.at, a.who, U.viewTitle(a.mod) || a.mod, a.what, a.before == null ? '' : a.before, a.after == null ? '' : a.after]));
    U.download(`Registro_de_cambios_${A.iso(TODAY)}.csv`, '﻿' + rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n'));
  });
})(window.ATL);
