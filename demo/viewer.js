/* Atalaya · visor BIM 3D (three.js): capas, fases constructivas, vista en planta y capturas de obra. */
(function (A) {
  'use strict';
  const E = A.engine;
  const V = (A.viewer = {
    mode: 'fase', level: 'all', view: '3d', date: null, selected: null, onSelect: null, onLabels: null,
    layers: { estructura: true, armaduras: false, fachadas: true, tabiqueria: true, carpinterias: false, acabados: false, equipamiento: false, electricidad: false, fontaneria: false },
  });
  V.LAYERS = [
    { id: 'estructura', name: 'Estructura de hormigón' },
    { id: 'armaduras', name: 'Armaduras', note: 'Esquemáticas, según armado tipo' },
    { id: 'fachadas', name: 'Fachadas' },
    { id: 'tabiqueria', name: 'Tabiquería interior' },
    { id: 'carpinterias', name: 'Carpinterías' },
    { id: 'acabados', name: 'Acabados' },
    { id: 'equipamiento', name: 'Baños y cocinas' },
    { id: 'electricidad', name: 'Electricidad', note: 'Esquemática' },
    { id: 'fontaneria', name: 'Fontanería y saneamiento', note: 'Esquemática' },
  ];
  V.LEVEL_Y = { CIM: -1.2, PB: 0, P1: 3, P2: 6, P3: 9, P4: 12, CUB: 15 };
  const LEVEL_IDX = { CIM: -1, PB: 0, P1: 1, P2: 2, P3: 3, P4: 4, CUB: 5 };
  let renderer, scene, persp, ortho, camera, controls, pControls, oControls, root, rebarRoot, ground, gridLines, host, ro, raf = 0, dirty = true, labelsEl;
  const meshes = {};
  const rebars = {};
  const geoCache = {};
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const lin = (c) => new THREE.Color(c).convertSRGBToLinear();
  const col = (n) => lin(css(n) || '#888');

  const CAP_COLORS = ['#8a6f4e', '#5b7f95', '#9a4f3a', '#b4673f', '#4f8a7a', '#c08a2c', '#6c5ea8', '#7a7f86', '#4d6fa8', '#a66a8f', '#5f8f4f', '#8c8c6a', '#7d5a9b'];
  const SUB_COLORS = { S1: '#8a6f4e', S2: '#4d6fa8', S3: '#b4673f', S4: '#4f8a7a', S5: '#c08a2c' };
  V.capColor = (code) => CAP_COLORS[(parseInt(code, 10) - 1) % CAP_COLORS.length];
  V.subColor = (id) => SUB_COLORS[id] || '#7a7f86';

  // Aspecto de cada fase constructiva (modo «Fase»)
  V.FASE = {
    encofrado: ['#b07a45', 'Encofrado'], armado: ['#7a2f22', 'Armado'], hormigon: ['#a9a7a0', 'Hormigonado'], hormigonFresco: ['#c9bfa9', 'Hormigonado en curso'],
    ladrillo: ['#b3684a', 'Fábrica de ladrillo'], ladrilloCurso: ['#d39a7f', 'Fábrica en curso'],
    perfileria: ['#b9c0c6', 'Perfilería'], primera: ['#cfcbc1', 'Primera placa'], instalaciones: ['#e2a36f', 'Instalaciones'], aislamiento: ['#e3c86a', 'Aislamiento'],
    cierre: ['#dcd9d1', 'Cierre de placas'], encintado: ['#f6f5f0', 'Encintado'], pintura: ['#efe0c7', 'Pintura'],
    vidrio: ['#8fb3c9', 'Carpintería colocada'], madera: ['#b48a5a', 'Pavimento colocado'], equipo: ['#f2f2ee', 'Equipamiento colocado'],
    electrico: ['#e0782f', 'Electricidad'], agua: ['#2f6fb3', 'Fontanería'],
  };

  function boxGeo(g) {
    const k = [g.sx, g.sy, g.sz].map((v) => v.toFixed(3)).join('|');
    if (!geoCache[k]) {
      const geo = new THREE.BoxGeometry(g.sx, g.sy, g.sz);
      geoCache[k] = { geo, edges: new THREE.EdgesGeometry(geo) };
    }
    return geoCache[k];
  }
  // Une varias cajas en una sola geometría (elementos con varias piezas)
  function mergeParts(parts) {
    const pos = [], nor = [];
    parts.forEach((p) => {
      const b = new THREE.BoxGeometry(p.sx, p.sy, p.sz).toNonIndexed();
      b.translate(p.x, p.y, p.z);
      pos.push(...b.attributes.position.array);
      nor.push(...b.attributes.normal.array);
      b.dispose();
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return { geo: g, edges: new THREE.EdgesGeometry(g, 30) };
  }
  V.center = (el) => {
    const g = el.geom;
    if (!g.parts) return { x: g.x, y: g.y, z: g.z };
    const n = g.parts.length;
    return { x: g.parts.reduce((s, p) => s + p.x, 0) / n, y: g.parts.reduce((s, p) => s + p.y, 0) / n, z: g.parts.reduce((s, p) => s + p.z, 0) / n };
  };

  // Armaduras esquemáticas de pilares y losas
  function rebarGeo(el) {
    const g = el.geom, pts = [];
    if (el.ifc === 'IfcColumn') {
      const o = 0.12, y0 = g.y - g.sy / 2, y1 = g.y + g.sy / 2 + 0.25;
      [[-o, -o], [o, -o], [o, o], [-o, o]].forEach(([dx, dz]) => pts.push(g.x + dx, y0, g.z + dz, g.x + dx, y1, g.z + dz));
      for (let y = y0 + 0.15; y < y1; y += 0.3) {
        const c = [[-o, -o], [o, -o], [o, o], [-o, o], [-o, -o]];
        for (let i = 0; i < 4; i++) pts.push(g.x + c[i][0], y, g.z + c[i][1], g.x + c[i + 1][0], y, g.z + c[i + 1][1]);
      }
    } else if (el.ifc === 'IfcSlab') {
      const x0 = g.x - g.sx / 2 + 0.1, x1 = g.x + g.sx / 2 - 0.1, z0 = g.z - g.sz / 2 + 0.1, z1 = g.z + g.sz / 2 - 0.1;
      [g.y - 0.09, g.y + 0.09].forEach((y) => {
        for (let x = x0; x <= x1; x += 0.45) pts.push(x, y, z0, x, y, z1);
        for (let z = z0; z <= z1; z += 0.45) pts.push(x0, y, z, x1, y, z);
      });
    }
    if (!pts.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }

  V.init = function () {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.className = 'viewer-canvas';
    scene = new THREE.Scene();
    persp = new THREE.PerspectiveCamera(32, 1, 0.5, 600);
    persp.position.set(46, 30, -34);
    ortho = new THREE.OrthographicCamera(-20, 20, 12, -12, 0.1, 300);
    ortho.position.set(12, 80, 7);
    ortho.up.set(0, 0, -1);
    ortho.lookAt(12, 0, 7);
    camera = persp;
    pControls = new THREE.OrbitControls(persp, renderer.domElement);
    pControls.target.set(12, 5, 7);
    Object.assign(pControls, { enableDamping: true, dampingFactor: 0.08, maxPolarAngle: Math.PI * 0.49, minDistance: 8, maxDistance: 140 });
    pControls.addEventListener('change', () => (dirty = true));
    oControls = new THREE.OrbitControls(ortho, renderer.domElement);
    oControls.target.set(12, 0, 7);
    Object.assign(oControls, { enableRotate: false, enableDamping: true, dampingFactor: 0.1, screenSpacePanning: true, minZoom: 0.6, maxZoom: 6 });
    oControls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    oControls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    oControls.enabled = false;
    oControls.addEventListener('change', () => (dirty = true));
    controls = pControls;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a96a0, 0.78));
    const sun = new THREE.DirectionalLight(0xffffff, 0.5);
    sun.position.set(30, 60, -25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160 });
    sun.target.position.set(12, 0, 7);
    scene.add(sun, sun.target);

    ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(12, -1.21, 7);
    ground.receiveShadow = true;
    scene.add(ground);
    const pts = [];
    for (let x = -24; x <= 48; x += 3) pts.push(x, -1.2, -24, x, -1.2, 38);
    for (let z = -24; z <= 38; z += 3) pts.push(-24, -1.2, z, 48, -1.2, z);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    gridLines = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 }));
    scene.add(gridLines);
    const pl = [-5, -6, 29, -6, 29, -6, 29, 20, 29, 20, -5, 20, -5, 20, -5, -6];
    const pg = new THREE.BufferGeometry();
    const pp = [];
    for (let i = 0; i < pl.length; i += 2) pp.push(pl[i], -1.19, pl[i + 1]);
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
    V.parcel = new THREE.LineSegments(pg, new THREE.LineDashedMaterial({ dashSize: 0.8, gapSize: 0.5 }));
    V.parcel.computeLineDistances();
    scene.add(V.parcel);

    root = new THREE.Group();
    rebarRoot = new THREE.Group();
    scene.add(root, rebarRoot);
    const rebarMat = new THREE.LineBasicMaterial({ color: lin(V.FASE.armado[0]) });
    A.elements.forEach((el) => {
      const g = el.geom;
      const c = g.parts ? mergeParts(g.parts) : boxGeo(g);
      const m = new THREE.Mesh(c.geo, new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0, transparent: true }));
      if (!g.parts) m.position.set(g.x, g.y, g.z);
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.id = el.id;
      const edges = new THREE.LineSegments(c.edges, new THREE.LineBasicMaterial({ transparent: true }));
      m.add(edges);
      m.userData.edges = edges;
      root.add(m);
      meshes[el.id] = m;
      if (el.ifc === 'IfcColumn' || el.ifc === 'IfcSlab') {
        const rg = rebarGeo(el);
        if (rg) { const ls = new THREE.LineSegments(rg, rebarMat); ls.visible = false; rebarRoot.add(ls); rebars[el.id] = ls; }
      }
    });
    buildProps();
    bindPicking();
    V.applyTheme();
  };

  /* Elementos de obra que solo aparecen en las capturas: grúa, casetas, acopios */
  let props;
  function buildProps() {
    props = new THREE.Group();
    const mat = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: r, metalness: m });
    const box = (w, h, d, material, x, y, z) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      b.position.set(x, y, z);
      b.castShadow = true;
      b.receiveShadow = true;
      props.add(b);
      return b;
    };
    const yellow = mat(0xe3b21c, 0.55, 0.2);
    const cx = 27.5, cz = 18;
    for (let y = -1.2; y < 24; y += 2) {
      [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]].forEach(([dx, dz]) => box(0.12, 2, 0.12, yellow, cx + dx, y + 1, cz + dz));
      box(1.5, 0.08, 0.08, yellow, cx, y + 2, cz - 0.7);
      box(1.5, 0.08, 0.08, yellow, cx, y + 2, cz + 0.7);
      box(0.08, 0.08, 1.5, yellow, cx - 0.7, y + 2, cz);
      box(0.08, 0.08, 1.5, yellow, cx + 0.7, y + 2, cz);
    }
    box(36, 0.7, 0.9, yellow, cx - 16, 25.2, cz);
    box(9, 0.6, 0.8, yellow, cx + 5, 25.2, cz);
    box(2.2, 1.6, 1.4, mat(0x5a5f63), cx + 7.5, 24.4, cz);
    box(1.6, 1.4, 1.6, mat(0xf0f0ec, 0.4), cx, 25.1, cz + 1.4);
    box(0.05, 12, 0.05, mat(0x333333, 0.4, 0.6), cx - 22, 19, cz);
    box(0.8, 0.5, 0.8, yellow, cx - 22, 12.8, cz);
    box(6, 2.5, 2.4, mat(0xf2f1ec, 0.6), -1, 0.05, 23);
    box(6, 2.5, 2.4, mat(0xe8e6df, 0.6), 5.5, 0.05, 23);
    box(1.2, 0.9, 1, mat(0xb06f3f), 31, -0.75, 4);
    box(1.2, 0.9, 1, mat(0xb06f3f), 31, -0.75, 5.3);
    box(1.2, 1.8, 1, mat(0xb06f3f), 32.4, -0.3, 4.6);
    box(3, 0.4, 1.2, mat(0x9c9b93), 31.5, -1, 9);
    box(2.4, 2.6, 6, mat(0x3c6e91, 0.5, 0.2), -6, 0.1, 12);
    const fence = mat(0xd9dbd6, 0.5, 0.3);
    box(34, 2, 0.05, fence, 12, -0.2, -6);
    box(0.05, 2, 26, fence, -5, -0.2, 7);
    props.visible = false;
    scene.add(props);
  }

  V.applyTheme = function () {
    if (!renderer) return;
    ground.material.color = col('--ground');
    gridLines.material.color = col('--line');
    V.parcel.material.color = col('--accent');
    V.refresh();
  };

  function stateColor(s) {
    return { validado: '--st-ok', ejecucion: '--st-progress', revision: '--st-review', no_iniciado: '--ink-3', retrasado: '--st-late', no_observable: '--st-unknown' }[s];
  }
  const stageStateAt = (s, d) => (!d || d >= A.TODAY ? s.state : s.real && s.real.end && s.real.end <= d ? 'validado' : s.real && s.real.start && s.real.start <= d ? 'ejecucion' : 'no_iniciado');
  V.stageStateAt = stageStateAt;

  // Aspecto de un elemento según su fase real
  V.faseOf = function (el, d) {
    const ds = E.displayState(el, d);
    if (el.stageSet === 'losa') {
      const st = {};
      el.stages.forEach((s) => (st[s.key] = stageStateAt(s, d)));
      if (st.hormigonado === 'validado') return { k: 'hormigon' };
      if (st.hormigonado === 'ejecucion') return { k: 'hormigonFresco' };
      if (st.armado !== 'no_iniciado') return { k: 'encofrado', rebar: true, partial: st.armado === 'ejecucion' };
      if (st.encofrado !== 'no_iniciado') return { k: 'encofrado', partial: st.encofrado === 'ejecucion' };
      return null;
    }
    if (el.stageSet === 'tabique') {
      let last = null, prog = false;
      el.stages.forEach((s) => { const x = stageStateAt(s, d); if (x !== 'no_iniciado') { last = s.key; prog = x === 'ejecucion'; } });
      return last ? { k: last, partial: prog } : null;
    }
    if (ds === 'no_iniciado') return null;
    const partial = ds === 'ejecucion';
    switch (el.layer) {
      case 'estructura': return partial ? { k: 'encofrado', rebar: true } : { k: 'hormigon' };
      case 'fachadas': return { k: partial ? 'ladrilloCurso' : 'ladrillo', partial };
      case 'carpinterias': return { k: 'vidrio', partial };
      case 'acabados': return { k: 'madera', partial };
      case 'equipamiento': return { k: 'equipo', partial };
      case 'electricidad': return { k: 'electrico', partial };
      case 'fontaneria': return { k: 'agua', partial };
      default: return { k: 'hormigon', partial };
    }
  };

  V.refresh = function () {
    if (!renderer) return;
    const d = V.date;
    const lvl = V.level, lvIdx = LEVEL_IDX[lvl];
    const plan = V.view === 'planta';
    const armOn = V.layers.armaduras;
    A.elements.forEach((el) => {
      const m = meshes[el.id];
      const mat = m.material, em = m.userData.edges.material;
      const layerOn = V.layers[el.layer] !== false;
      let color, opacity = 1, edgeOpacity = 0.55, ghost = false, rebarOn = false;
      m.scale.y = 1;
      if (!el.geom.parts) m.position.y = el.geom.y;
      const ds = E.displayState(el, d);
      if (V.mode === 'fase') {
        const f = V.faseOf(el, d);
        if (!f) ghost = true;
        else {
          color = V.FASE[f.k][0];
          if (f.partial) { opacity = el.stageSet === 'tabique' ? 0.75 : 0.85; edgeOpacity = 0.9; }
          if (f.k === 'perfileria') opacity = 0.5;
          if (f.k === 'vidrio') opacity = 0.7;
          if (f.rebar) rebarOn = true;
          if (el.layer === 'fachadas' && f.partial && !el.geom.parts) { m.scale.y = 0.45; m.position.y = el.geom.y - (el.geom.sy * 0.55) / 2; }
        }
      } else if (V.mode === 'estado') {
        if (ds === 'no_iniciado') ghost = true;
        color = css(stateColor(ds));
      } else if (V.mode === 'plan') {
        const ps = E.planState(el, d || A.TODAY);
        if (ps === 'no_iniciado') ghost = true;
        color = css(stateColor(ps));
      } else if (V.mode === 'capitulo') {
        color = V.capColor(A.partidaByCode[el.partida].cap);
        if (ds === 'no_iniciado') opacity = 0.22;
      } else {
        color = V.subColor(A.partidaByCode[el.partida].sub);
        if (ds === 'no_iniciado') opacity = 0.22;
      }
      if (ghost) { color = css('--ghost'); opacity = plan ? 0.28 : 0.1; edgeOpacity = plan ? 0.5 : 0.28; }
      if (plan && el.ifc === 'IfcSlab') { opacity = Math.min(opacity, 0.35); edgeOpacity = 0.15; }
      if (armOn && el.layer === 'estructura' && !ghost) { opacity = Math.min(opacity, 0.2); rebarOn = true; }
      // Filtro por planta: en 3D se ve la planta y lo de debajo atenuado; en planta solo la planta
      let visible = layerOn;
      if (lvl !== 'all') {
        const i = LEVEL_IDX[el.level];
        if (plan) visible = visible && (i === lvIdx || (el.ifc === 'IfcSlab' && i === lvIdx) || (lvl === 'PB' && el.level === 'CIM'));
        else if (i > lvIdx) visible = false;
        else if (i < lvIdx) { opacity = Math.min(opacity, 0.08); edgeOpacity = 0.1; rebarOn = false; }
      }
      m.visible = visible;
      mat.color.copy(lin(color));
      mat.opacity = opacity;
      mat.depthWrite = opacity > 0.5;
      const side = plan && el.ifc !== 'IfcSlab' ? THREE.DoubleSide : THREE.FrontSide;
      if (mat.side !== side) { mat.side = side; mat.needsUpdate = true; }
      if (plan && el.layer === 'tabiqueria' && !el.geom.parts) { m.scale.x = el.geom.sx < 0.2 ? 2.2 : 1; m.scale.z = el.geom.sz < 0.2 ? 2.2 : 1; } else { m.scale.x = 1; m.scale.z = 1; }
      m.userData.pickable = visible;
      em.color.copy(lin(css(ghost ? '--ink-3' : '--edge')));
      em.opacity = edgeOpacity;
      const sel = V.selected === el.id;
      mat.emissive.copy(lin(sel ? css('--accent') : '#000000'));
      mat.emissiveIntensity = sel ? 0.55 : 0;
      if (sel) { em.color.copy(lin(css('--accent'))); em.opacity = 1; }
      if (rebars[el.id]) rebars[el.id].visible = visible && rebarOn;
    });
    renderer.clippingPlanes = plan && lvl !== 'all' ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), V.LEVEL_Y[lvl] + 1.5)] : [];
    dirty = true;
  };

  V.setMode = (m) => { V.mode = m; V.refresh(); };
  V.setLevel = (l) => { V.level = l; if (V.view === 'planta' && l === 'all') V.level = 'P1'; V.refresh(); fitOrtho(); };
  V.setLayer = (id, on) => { V.layers[id] = on; V.refresh(); };
  V.setDate = (d) => { V.date = d; V.refresh(); };
  V.setView = (v) => {
    V.view = v;
    if (!renderer) return;
    if (v === 'planta') {
      if (V.level === 'all' || V.level === 'CIM') V.level = 'P1';
      camera = ortho; controls = oControls; pControls.enabled = false; oControls.enabled = true;
      fitOrtho();
    } else {
      camera = persp; controls = pControls; oControls.enabled = false; pControls.enabled = true;
    }
    resize();
    V.refresh();
  };
  function fitOrtho() {
    if (!ortho || !host) return;
    const w = host.clientWidth || 800, h = host.clientHeight || 500;
    const aspect = w / h, need = Math.max(29 / aspect, 18) / 2;
    ortho.left = -need * aspect; ortho.right = need * aspect; ortho.top = need; ortho.bottom = -need;
    ortho.zoom = 1;
    ortho.position.set(12, 80, 7);
    oControls.target.set(12, 0, 7);
    ortho.updateProjectionMatrix();
    dirty = true;
  }
  V.select = (id, silent) => {
    V.selected = id;
    V.refresh();
    if (!silent && V.onSelect) V.onSelect(id);
  };
  V.focus = (id) => {
    const el = A.el[id];
    if (!el || V.view === 'planta') return;
    const c = V.center(el);
    const off = persp.position.clone().sub(pControls.target).setLength(26);
    pControls.target.set(c.x, c.y, c.z);
    persp.position.copy(pControls.target).add(off);
    dirty = true;
  };
  V.resetView = () => {
    if (V.view === 'planta') { fitOrtho(); return; }
    persp.position.set(46, 30, -34);
    pControls.target.set(12, 5, 7);
    dirty = true;
  };
  V.project = (x, y, z) => {
    const v = new THREE.Vector3(x, y, z).project(camera);
    return { x: ((v.x + 1) / 2) * host.clientWidth, y: ((1 - v.y) / 2) * host.clientHeight, behind: v.z > 1 };
  };

  function bindPicking() {
    const ray = new THREE.Raycaster();
    const v2 = new THREE.Vector2();
    let down = null;
    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const r = el.getBoundingClientRect();
      v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const planes = renderer.clippingPlanes;
      const hits = ray.intersectObjects(root.children, false).filter((h) => h.object.userData.pickable && h.object.visible && (!planes.length || planes[0].distanceToPoint(h.point) >= 0));
      const solid = hits.find((h) => h.object.material.opacity > 0.3);
      const hit = solid || hits[0];
      V.select(hit ? hit.object.userData.id : null);
    });
  }

  V.mount = function (container) {
    V.init();
    host = container;
    container.appendChild(renderer.domElement);
    labelsEl = document.createElement('div');
    labelsEl.className = 'viewer-labels';
    container.appendChild(labelsEl);
    if (ro) ro.disconnect();
    ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    if (V.view === 'planta') V.setView('planta');
    V.refresh();
    if (!raf) loop();
  };
  function resize() {
    if (!host) return;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px';
    renderer.domElement.style.height = h + 'px';
    persp.aspect = w / h;
    persp.updateProjectionMatrix();
    if (V.view === 'planta') fitOrtho();
    dirty = true;
  }
  function updateLabels() {
    if (!labelsEl) return;
    if (V.view !== 'planta' || !V.onLabels) { if (labelsEl.childElementCount) labelsEl.innerHTML = ''; return; }
    labelsEl.innerHTML = V.onLabels(V.level).map((l) => {
      const p = V.project(l.x, l.y, l.z);
      return `<button class="vlabel" style="left:${p.x}px;top:${p.y}px" data-action="${l.action}">${l.html}</button>`;
    }).join('');
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!host || !host.isConnected) return;
    controls.update();
    if (dirty) { renderer.render(scene, camera); dirty = false; updateLabels(); }
  }

  /* ───────────── Capturas de obra (render "fotográfico" del estado construido) ───────────── */
  const P = (A.photo = {});
  let pr, noiseCanvas;
  const W = 1200, H = 750;
  function photoRenderer() {
    if (pr) return pr;
    pr = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    pr.setPixelRatio(1);
    pr.setSize(W, H, false);
    pr.outputEncoding = THREE.sRGBEncoding;
    pr.shadowMap.enabled = true;
    pr.shadowMap.type = THREE.PCFSoftShadowMap;
    return pr;
  }
  P.renderer = photoRenderer;
  function skyTexture() {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#7fa6c9');
    gr.addColorStop(0.55, '#c9d8e2');
    gr.addColorStop(1, '#e9e4da');
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  let sky;
  function noise() {
    if (noiseCanvas) return noiseCanvas;
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = noiseCanvas.height = 256;
    const g = noiseCanvas.getContext('2d');
    const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return noiseCanvas;
  }
  // Acabado de cámara: grano, viñeteado, tono cálido y sello de tiempo
  function postProcess(src, stamp, opts = {}) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    if (opts.blur) g.filter = 'blur(1.4px) brightness(0.62) contrast(0.9)';
    g.drawImage(src, 0, 0, W, H);
    g.filter = 'none';
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = opts.cool ? 'rgba(120,150,190,0.25)' : 'rgba(255,190,130,0.22)';
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = 0.09;
    const n = noise();
    for (let x = 0; x < W; x += 256) for (let y = 0; y < H; y += 256) g.drawImage(n, x, y);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    if (stamp) {
      g.font = '500 20px "IBM Plex Mono", ui-monospace, monospace';
      g.fillStyle = 'rgba(0,0,0,0.45)';
      const tw = g.measureText(stamp).width;
      g.fillRect(18, H - 50, tw + 24, 34);
      g.fillStyle = '#f3f1e8';
      g.fillText(stamp, 30, H - 26);
    }
    return c.toDataURL('image/jpeg', opts.quality || 0.86);
  }

  const PHOTO_MAT = {};
  function photoMat(kind) {
    if (PHOTO_MAT[kind]) return PHOTO_MAT[kind];
    const spec = {
      concrete: [0xa9a7a0, 0.92], fresh: [0x8e8a82, 0.6], footing: [0x8f8c85, 0.95], formwork: [0xa8794a, 0.8], brick: [0xb3684a, 0.9], brickWip: [0xa45f45, 0.9],
      plaster: [0xd8d5cd, 0.9], glass: [0x6f8ea3, 0.15], frame: [0x3d4246, 0.4],
    }[kind];
    PHOTO_MAT[kind] = new THREE.MeshStandardMaterial({ color: lin(spec[0]), roughness: spec[1], metalness: kind === 'glass' ? 0.6 : 0 });
    return PHOTO_MAT[kind];
  }
  // Lo que muestra la foto: estado a la fecha de la captura; las propuestas describen la imagen
  function photoLook(el, cap, date) {
    if (cap.allDone) {
      if (['acabados', 'equipamiento', 'electricidad', 'fontaneria'].includes(el.layer)) return null;
      if (el.layer === 'fachadas') return { mat: 'brick' };
      if (el.layer === 'carpinterias') return { mat: 'glass' };
      if (el.layer === 'tabiqueria') return { mat: 'plaster' };
      return { mat: el.ifc === 'IfcFooting' ? 'footing' : 'concrete' };
    }
    if (cap.empty) return null;
    if (['acabados', 'equipamiento', 'electricidad', 'fontaneria'].includes(el.layer)) return null;
    const d = date < A.TODAY ? date : null;
    const pr = (cap.proposals || []).find((p) => p.el === el.id);
    const ovr = (s, cur) => (pr && pr.stage === s ? (pr.prop === 'terminado' ? 'validado' : pr.prop === 'ejecucion' ? 'ejecucion' : pr.prop === 'no_iniciado' ? 'no_iniciado' : cur) : cur);
    if (el.stageSet === 'losa') {
      const st = {};
      el.stages.forEach((s) => (st[s.key] = ovr(s.key, stageStateAt(s, d))));
      if (st.hormigonado === 'validado') return { mat: 'concrete' };
      if (st.hormigonado === 'ejecucion') return { mat: 'fresh' };
      if (st.encofrado !== 'no_iniciado' || st.armado !== 'no_iniciado') return { mat: 'formwork', rebar: st.armado !== 'no_iniciado' };
      return null;
    }
    if (el.stageSet === 'tabique') return el.stages.some((s) => stageStateAt(s, d) !== 'no_iniciado') ? { mat: 'plaster' } : null;
    let t = E.displayState(el, d);
    if (pr) t = pr.prop === 'terminado' ? 'validado' : pr.prop === 'ejecucion' ? 'ejecucion' : pr.prop === 'no_iniciado' ? 'no_iniciado' : t;
    if (t === 'revision') t = el.state;
    if (t === 'no_iniciado') return null;
    if (el.layer === 'carpinterias') return t === 'validado' ? { mat: 'glass' } : null;
    if (el.layer === 'fachadas') return t === 'validado' ? { mat: 'brick' } : { mat: 'brickWip', half: true };
    if (el.ifc === 'IfcFooting') return { mat: 'footing' };
    return t === 'validado' ? { mat: 'concrete' } : { mat: 'formwork', rebar: true };
  }

  P.render = function (cap) {
    V.init();
    const r = photoRenderer();
    const date = cap.at === 'now' || !cap.at ? A.TODAY : new Date(cap.at);
    const camDef = A.cams[cap.cam];
    const cam = new THREE.PerspectiveCamera(camDef.fov, W / H, 0.3, 600);
    cam.position.set(...camDef.pos);
    cam.lookAt(new THREE.Vector3(...camDef.target));
    cam.updateMatrixWorld();

    const saved = [];
    const groundColor = ground.material.color.clone();
    const prevBg = scene.background;
    sky = sky || skyTexture();
    scene.background = sky;
    scene.fog = new THREE.Fog(0xd9dcd8, 70, 220);
    ground.material.color.copy(lin(0x9b8e7c));
    gridLines.visible = false;
    V.parcel.visible = false;
    props.visible = !cap.allDone;
    const rebarSaved = Object.keys(rebars).map((k) => [rebars[k], rebars[k].visible]);
    Object.values(rebars).forEach((r2) => (r2.visible = false));

    A.elements.forEach((el) => {
      const m = meshes[el.id];
      saved.push([m, m.material, m.visible, m.scale.y, m.position.y, m.userData.edges.visible]);
      m.userData.edges.visible = false;
      const look = photoLook(el, cap, date);
      if (!look) { m.visible = false; return; }
      m.visible = true;
      m.material = photoMat(look.mat);
      m.scale.y = 1;
      if (!el.geom.parts) m.position.y = el.geom.y;
      if (look.half && !el.geom.parts) { m.scale.y = 0.42; m.position.y = el.geom.y - (el.geom.sy * (1 - 0.42)) / 2; }
      if (look.rebar && rebars[el.id]) rebars[el.id].visible = true;
    });

    r.clippingPlanes = [];
    r.setClearColor(0x000000, 0);
    r.render(scene, cam);
    const photo = postProcess(r.domElement, cap.stampText, { quality: cap.thumb ? 0.7 : 0.86 });
    let bim = null, boxes = [];
    if (!cap.noOverlay) {
      // Capa BIM: modelo previsto superpuesto desde el mismo punto de vista
      scene.background = null;
      scene.fog = null;
      props.visible = false;
      ground.visible = false;
      Object.values(rebars).forEach((r2) => (r2.visible = false));
      const ghost = new THREE.MeshBasicMaterial({ color: lin(css('--overlay')), transparent: true, opacity: 0.22, depthWrite: false });
      A.elements.forEach((el) => {
        const m = meshes[el.id];
        const show = ['estructura', 'fachadas', 'carpinterias'].includes(el.layer);
        m.visible = show;
        m.scale.y = 1;
        if (!el.geom.parts) m.position.y = el.geom.y;
        m.material = ghost;
        m.userData.edges.visible = show;
        m.userData.edges.material.color.copy(lin(css('--overlay')));
        m.userData.edges.material.opacity = 0.9;
      });
      r.render(scene, cam);
      bim = r.domElement.toDataURL('image/png');
      boxes = (cap.proposals || []).map((p) => {
        const m = meshes[p.el];
        if (!m) return null;
        const b = new THREE.Box3().setFromObject(m);
        const pts = [];
        [b.min.x, b.max.x].forEach((x) => [b.min.y, b.max.y].forEach((y) => [b.min.z, b.max.z].forEach((z) => pts.push(new THREE.Vector3(x, y, z).project(cam)))));
        if (pts.some((q) => q.z > 1)) return null;
        const xsP = pts.map((q) => ((q.x + 1) / 2) * W), ysP = pts.map((q) => ((1 - q.y) / 2) * H);
        const x0 = Math.max(4, Math.min(...xsP)), x1 = Math.min(W - 4, Math.max(...xsP));
        const y0 = Math.max(4, Math.min(...ysP)), y1 = Math.min(H - 4, Math.max(...ysP));
        if (x1 - x0 < 8 || y1 - y0 < 8) return null;
        return { el: p.el, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      });
    }

    saved.forEach(([m, mat, vis, sy, py, ev]) => { m.material = mat; m.visible = vis; m.scale.y = sy; m.position.y = py; m.userData.edges.visible = ev; });
    rebarSaved.forEach(([r2, v]) => (r2.visible = v));
    ground.visible = true;
    ground.material.color.copy(groundColor);
    scene.background = prevBg;
    scene.fog = null;
    gridLines.visible = true;
    V.parcel.visible = true;
    props.visible = false;
    V.refresh();
    return { photo, bim, boxes, w: W, h: H };
  };

  /* ───────────── Capturas interiores: estancia con tabiques en su fase ───────────── */
  const TEX = {};
  function canvasTex(key, w, h, draw, rep) {
    if (!TEX[key]) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = 4;
      TEX[key] = t;
    }
    const t = TEX[key].clone();
    t.needsUpdate = true;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  }
  function speckle(g, w, h, n, alpha, light) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = (Math.random() < (light || 0.5) ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (Math.random() * alpha).toFixed(3) + ')';
      const s = Math.random() * 2.2 + 0.4;
      g.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
  }
  const concreteTex = (rep) => canvasTex('concrete', 512, 512, (g, w, h) => {
    g.fillStyle = '#8d8a84'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 30 + Math.random() * 110;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const dark = Math.random() < 0.5;
      gr.addColorStop(0, dark ? 'rgba(60,58,54,0.16)' : 'rgba(200,196,188,0.14)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    speckle(g, w, h, 9000, 0.22);
  }, rep);
  const boardTex = (enc) => canvasTex('board' + (enc ? 'E' : ''), 240, 540, (g, w, h) => {
    g.fillStyle = '#d6d3cb'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 2600, 0.06, 0.6);
    [0.25, 0.75].forEach((fx) => {
      for (let y = 18; y < h; y += 50) {
        if (enc) { g.fillStyle = 'rgba(250,249,245,0.95)'; g.beginPath(); g.ellipse(fx * w, y, 7, 5, 0, 0, 7); g.fill(); }
        else { g.fillStyle = 'rgba(70,70,68,0.75)'; g.beginPath(); g.arc(fx * w, y, 1.8, 0, 7); g.fill(); }
      }
    });
    g.fillStyle = 'rgba(120,116,108,0.35)'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
  });
  const woolTex = () => canvasTex('wool', 256, 256, (g, w, h) => {
    g.fillStyle = '#d9b75c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) {
      g.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,236,170' : '150,110,40'},${(Math.random() * 0.25).toFixed(2)})`;
      g.beginPath();
      const x = Math.random() * w, y = Math.random() * h;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10, x + Math.random() * 30 - 15, y + Math.random() * 30 - 15);
      g.stroke();
    }
  }, [1, 3]);
  const brickTex = (rep) => canvasTex('brick', 512, 512, (g, w, h) => {
    g.fillStyle = '#9a9286'; g.fillRect(0, 0, w, h);
    const bh = 32, bw = 120;
    for (let row = 0; row * bh < h; row++) {
      for (let x = -(row % 2) * bw / 2; x < w; x += bw) {
        const v = 150 + Math.random() * 30;
        g.fillStyle = `rgb(${v + 20},${v * 0.55},${v * 0.42})`;
        g.fillRect(x + 3, row * bh + 3, bw - 6, bh - 6);
      }
    }
    speckle(g, w, h, 5000, 0.18);
  }, rep);

  // vis = { perf, primera (0-1), inst, aisl (0-1), cierre (0-1), enc (0-1), pint }
  function wallGroup(len, vis, H2) {
    const g = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: lin(0xc9cdd0), roughness: 0.35, metalness: 0.7 });
    const add = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
    const n = Math.ceil(len / 1.2);
    const boardsFrom = (frac, z, matFn) => {
      const covered = Math.round(n * frac);
      for (let i = 0; i < covered; i++) {
        const x1 = len - i * 1.2, x0 = Math.max(0, x1 - 1.2), w = x1 - x0;
        add(w - 0.008, H2 - 0.012, 0.0125, matFn(i, w), (x0 + x1) / 2, H2 / 2, z);
      }
      return { covered, start: Math.max(0, len - covered * 1.2) };
    };
    const plainBoard = (i, w) => { const t = boardTex(false); t.repeat.set(w / 1.2, 1); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, color: lin(i % 2 ? 0xe8e6e0 : 0xf2f0ea) }); };
    if (vis.perf) {
      add(len, 0.035, 0.06, steel, len / 2, 0.02, 0);
      add(len, 0.035, 0.06, steel, len / 2, H2 - 0.02, 0);
      for (let x = 0.3; x < len - 0.05; x += 0.6) add(0.05, H2, 0.048, steel, x, H2 / 2, 0);
    }
    if (vis.primera) boardsFrom(vis.primera, -0.035, plainBoard);
    if (vis.inst) {
      const orange = new THREE.MeshStandardMaterial({ color: lin(0xe0782f), roughness: 0.55 });
      const blue = new THREE.MeshStandardMaterial({ color: lin(0x2f6fb3), roughness: 0.45 });
      const red = new THREE.MeshStandardMaterial({ color: lin(0xc23b2e), roughness: 0.45 });
      const boxM = new THREE.MeshStandardMaterial({ color: lin(0xe9e9e4), roughness: 0.7 });
      for (let x = 0.6, i = 0; x < len - 0.3; x += 1.2, i++) {
        const y0 = i % 2 ? 1.1 : 0.32;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, H2 - y0, 8), orange);
        c.position.set(x, y0 + (H2 - y0) / 2, 0.01);
        g.add(c);
        add(0.075, 0.075, 0.045, boxM, x, y0, 0.012);
      }
      [[blue, len - 0.45], [red, len - 0.38]].forEach(([m, x]) => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, H2 - 0.6, 8), m);
        c.position.set(x, 0.6 + (H2 - 0.6) / 2, 0.012);
        g.add(c);
      });
    }
    if (vis.aisl) {
      const wool = new THREE.MeshStandardMaterial({ map: woolTex(), roughness: 1 });
      const bays = Math.round(Math.floor((len - 0.35) / 0.6) * vis.aisl);
      for (let i = 0; i < bays; i++) {
        const x = len - 0.6 - i * 0.6;
        if (x < 0.3) break;
        add(0.54, H2 - 0.1, 0.04, wool, x, H2 / 2, -0.004);
      }
    }
    if (vis.cierre) {
      const fullEnc = vis.enc >= 1;
      const paint = new THREE.MeshStandardMaterial({ color: lin(0xf1ebe0), roughness: 0.85 });
      const res = boardsFrom(vis.cierre, 0.035, (i, w) => {
        if (vis.pint) return paint;
        const t = boardTex(fullEnc);
        t.repeat.set(w / 1.2, 1);
        return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, color: lin(i % 2 ? 0xf4f2ee : 0xffffff) });
      });
      if (vis.inst && res.covered) {
        const hole = new THREE.MeshStandardMaterial({ color: lin(vis.pint ? 0xf7f7f4 : 0x3a3a38), roughness: 0.9 });
        for (let x = 0.6, i = 0; x < len - 0.3; x += 1.2, i++) if (x > res.start) add(0.08, 0.08, 0.004, hole, x, i % 2 ? 1.1 : 0.32, 0.0425);
      }
      if (vis.enc && !vis.pint) {
        const tape = new THREE.MeshStandardMaterial({ color: lin(0xf7f6f1), roughness: 0.98 });
        const joints = Math.round((res.covered - 1) * vis.enc);
        for (let i = 1; i <= joints; i++) add(0.13, H2 - 0.02, 0.003, tape, len - i * 1.2, H2 / 2, 0.0435);
      }
    }
    return g;
  }
  function wallVis(el, stageOverride) {
    const st = {};
    el.stages.forEach((s) => { st[s.key] = s.state; });
    if (stageOverride && stageOverride.stage) st[stageOverride.stage] = stageOverride.prop === 'terminado' ? 'validado' : stageOverride.prop === 'ejecucion' ? 'ejecucion' : st[stageOverride.stage];
    const f = (k) => (st[k] === 'validado' ? 1 : st[k] === 'ejecucion' ? 0.6 : 0);
    return { perf: st.perfileria !== 'no_iniciado', primera: f('primera'), inst: st.instalaciones !== 'no_iniciado', aisl: f('aislamiento'), cierre: f('cierre'), enc: f('encintado'), pint: st.pintura === 'validado' };
  }
  P.wallVis = wallVis;

  P.renderRoom = function (view, cap, opts = {}) {
    V.init();
    const r = photoRenderer();
    r.clippingPlanes = [];
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x1d1d1c);
    const RW = 4.6, RD = 3.8, RH = 2.7;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(RW + 1, 0.1, RD + 1), new THREE.MeshStandardMaterial({ map: concreteTex([2.5, 2]), roughness: 0.9 }));
    floor.position.set(RW / 2, -0.05, RD / 2);
    sc.add(floor);
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(RW + 1, 0.1, RD + 1), new THREE.MeshStandardMaterial({ map: concreteTex([2, 2]), roughness: 0.95, color: lin(0xb0aea8) }));
    ceil.position.set(RW / 2, RH + 0.05, RD / 2);
    sc.add(ceil);
    const brick = new THREE.MeshStandardMaterial({ map: brickTex([1.5, 2]), roughness: 0.95 });
    const fw = (w, h, z, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, w), brick); b.position.set(RW + 0.06, y, z); sc.add(b); };
    fw(1.1, RH, 0.55, RH / 2);
    fw(1.1, RH, RD - 0.55, RH / 2);
    fw(RD - 2.2, 0.9, RD / 2, 0.45);
    fw(RD - 2.2, 0.5, RD / 2, RH - 0.25);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(RD - 2.2, RH - 1.4), new THREE.MeshBasicMaterial({ color: 0xf7f2e6 }));
    glow.rotation.y = -Math.PI / 2;
    glow.position.set(RW + 0.3, 0.9 + (RH - 1.4) / 2, RD / 2);
    sc.add(glow);

    const elBack = A.el[view.back], elLeft = A.el[view.left];
    const ov = (el) => (cap && cap.proposals ? cap.proposals.find((p) => p.el === el.id) : null);
    const back = wallGroup(RW, opts.vis ? opts.vis(elBack) : wallVis(elBack, ov(elBack)), RH);
    back.position.set(0, 0, 0.05);
    sc.add(back);
    const left = wallGroup(RD, opts.vis ? opts.vis(elLeft) : wallVis(elLeft, ov(elLeft)), RH);
    left.rotation.y = -Math.PI / 2;
    left.scale.z = -1;
    left.position.set(0.05, 0, 0);
    sc.add(left);
    const beyond = new THREE.MeshStandardMaterial({ color: lin(0x6b6862), roughness: 1 });
    const bw = new THREE.Mesh(new THREE.BoxGeometry(RW + 2, RH, 0.1), beyond);
    bw.position.set(RW / 2, RH / 2, -2.2);
    sc.add(bw);
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.1, RH, RD + 2), beyond);
    bl.position.set(-2.4, RH / 2, RD / 2);
    sc.add(bl);
    const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 2.55), new THREE.MeshStandardMaterial({ color: lin(0x9d7a4f), roughness: 0.9 }));
    pallet.position.set(2.7, 0.06, 2.3);
    pallet.rotation.y = 0.15;
    sc.add(pallet);
    const stack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 2.5), new THREE.MeshStandardMaterial({ map: boardTex(false), roughness: 0.9 }));
    stack.position.set(2.7, 0.22, 2.3);
    stack.rotation.y = 0.15;
    sc.add(stack);
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.32, 18), new THREE.MeshStandardMaterial({ color: lin(0xe9e7e1), roughness: 0.6 }));
    bucket.position.set(1.2, 0.16, 1.5);
    sc.add(bucket);

    const k = opts.dim ? 0.45 : 1;
    sc.add(new THREE.HemisphereLight(0xfff4e2, 0x4a4743, 0.38 * k));
    const win = new THREE.DirectionalLight(0xfff0d8, 1.05 * k);
    win.position.set(RW + 3, 2.6, RD / 2 + 0.4);
    win.target.position.set(0.5, 0.6, 1.2);
    win.castShadow = true;
    win.shadow.mapSize.set(1024, 1024);
    Object.assign(win.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 12 });
    sc.add(win, win.target);
    const lamp = new THREE.PointLight(0xffd9a0, 0.55 * k, 7, 1.6);
    lamp.position.set(1.6, RH - 0.25, 1.4);
    sc.add(lamp);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff3d6 }));
    bulb.position.copy(lamp.position);
    sc.add(bulb);
    sc.traverse((o) => { if (o.isMesh && o !== bulb && o !== glow) { o.castShadow = true; o.receiveShadow = true; } });

    const cam = new THREE.PerspectiveCamera(72, W / H, 0.05, 50);
    cam.position.set(RW - 0.45, 1.55, RD - 0.35);
    cam.lookAt(0.9, 1.2, 0.7);
    r.setClearColor(0x000000, 1);
    r.render(sc, cam);
    const img = postProcess(r.domElement, opts.stamp, { blur: opts.dim, cool: false });
    sc.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); });
    return img;
  };
})(window.ATL);
