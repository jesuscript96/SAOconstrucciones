/* Atalaya · datos de demostración de la obra piloto y motor de cálculo.
   Todo es ficticio: obra, empresas, personas e importes. */
window.ATL = window.ATL || {};
(function (A) {
  'use strict';
  const DAY = 864e5;
  const D = (s) => new Date(s + 'T12:00:00');
  const addDays = (d, n) => new Date(d.getTime() + n * DAY);
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const TODAY = D('2026-10-01');
  A.D = D; A.addDays = addDays; A.iso = iso; A.TODAY = TODAY; A.DAY = DAY;

  A.project = {
    code: 'OB-2611',
    name: 'Residencial Mirador del Turia',
    place: 'Benimaclet, Valencia',
    desc: '20 viviendas · PB + 4 · 1.680 m² construidos',
    client: 'Promociones Vega Baixa, S.L.',
    start: D('2026-02-02'),
    end: D('2027-06-30'),
    jefe: 'Marcos Ferrer',
    pm: 'Andrea Soler',
    tecnico: 'Lucía Montané',
    ggbi: 0.19,
    retencion: 0.05,
  };

  A.levels = [
    { id: 'CIM', name: 'Cimentación', short: 'Cim.' },
    { id: 'PB', name: 'Planta baja', short: 'PB', n: 0 },
    { id: 'P1', name: 'Planta 1ª', short: 'P1', n: 1 },
    { id: 'P2', name: 'Planta 2ª', short: 'P2', n: 2 },
    { id: 'P3', name: 'Planta 3ª', short: 'P3', n: 3 },
    { id: 'P4', name: 'Planta 4ª', short: 'P4', n: 4 },
    { id: 'CUB', name: 'Cubierta', short: 'Cub.' },
  ];
  const LV = ['PB', 'P1', 'P2', 'P3', 'P4'];
  const VIV_NAME = (lvl, letter) => (lvl === 'PB' ? 'Bajo ' : lvl.slice(1) + 'º') + letter;
  A.vivName = VIV_NAME;

  A.subs = [
    { id: 'S1', name: 'Movimientos de Tierra Horta, S.L.', short: 'Tierras Horta', trade: 'Movimiento de tierras', caps: ['01'], factor: 0.93 },
    { id: 'S2', name: 'Hormigones y Estructuras Turia, S.L.', short: 'Estructuras Turia', trade: 'Cimentación y estructura', caps: ['02', '03'], factor: 0.94 },
    { id: 'S3', name: 'Cerramientos Albufera, S.L.', short: 'Cerramientos Albufera', trade: 'Fachadas', caps: ['04'], factor: 0.95 },
    { id: 'S4', name: 'Sistemas Secos Levante, S.L.', short: 'Secos Levante', trade: 'Tabiquería seca', caps: ['05'], factor: 0.92 },
    { id: 'S5', name: 'Instalaciones Carraixet, S.L.', short: 'Inst. Carraixet', trade: 'Instalaciones', caps: ['06'], factor: 0.96 },
  ];

  A.chapters = [
    { code: '01', name: 'Movimiento de tierras' },
    { code: '02', name: 'Cimentación' },
    { code: '03', name: 'Estructura' },
    { code: '04', name: 'Fachadas y cerramientos' },
    { code: '05', name: 'Tabiquería y trasdosados' },
    { code: '06', name: 'Instalaciones' },
    { code: '07', name: 'Revestimientos y solados' },
    { code: '08', name: 'Carpinterías' },
    { code: '09', name: 'Cubierta' },
    { code: '10', name: 'Pinturas' },
    { code: '11', name: 'Urbanización y zonas comunes' },
    { code: '12', name: 'Seguridad, salud y residuos' },
    { code: '13', name: 'Equipamiento' },
  ];

  /* Partidas del presupuesto (formato BC3). model:true → la cantidad sale del modelo IFC. */
  const P = (code, desc, unit, qty, price, extra) => Object.assign({ code, cap: code.slice(0, 2), desc, unit, qty, price }, extra || {});
  A.partidas = [
    P('01.01', 'Excavación a cielo abierto con medios mecánicos', 'm³', 1850, 11.2, { plan: ['2026-02-02', '2026-02-13'], real: ['2026-02-02', '2026-02-13'], avance: 1 }),
    P('01.02', 'Excavación en pozos y zanjas de cimentación', 'm³', 240, 18.4, { plan: ['2026-02-09', '2026-02-20'], real: ['2026-02-09', '2026-02-24'], avance: 1 }),
    P('01.03', 'Relleno localizado y compactación de trasdós', 'm³', 380, 14.1, { plan: ['2026-03-16', '2026-10-30'], real: ['2026-03-23', '2026-11-13'], avance: 0.6 }),
    P('02.01', 'Hormigón de limpieza HL-150/B/20, espesor 10 cm', 'm³', 28, 86, { plan: ['2026-02-16', '2026-02-27'], real: ['2026-02-16', '2026-03-03'], avance: 1 }),
    P('02.02', 'Zapata aislada HA-30/B/20/IIa armada con acero B 500 S', 'm³', 0, 268, { model: true, ifc: 'IfcFooting' }),
    P('02.03', 'Viga de atado HA-30/B/20/IIa, sección 40×40 cm', 'm³', 14.6, 295, { plan: ['2026-03-02', '2026-03-20'], real: ['2026-03-02', '2026-03-27'], avance: 1 }),
    P('03.01', 'Pilar de HA-30 de 35×35 cm con encofrado metálico', 'm³', 0, 612, { model: true, ifc: 'IfcColumn' }),
    P('03.02', 'Losa maciza de HA-30, canto 30 cm, armada', 'm²', 0, 96, { model: true, ifc: 'IfcSlab' }),
    P('04.01', 'Fachada de ladrillo cara vista 11,5 cm, aislamiento y trasdosado', 'm²', 0, 118, { model: true, ifc: 'IfcWall' }),
    P('05.01', 'Tabique PYL 98/600(48) 2×12,5 mm con lana mineral', 'm²', 0, 42.5, { model: true, ifc: 'IfcWall', staged: true }),
    P('06.01', 'Instalación de fontanería y saneamiento por vivienda', 'ud', 20, 4850, { plan: ['2026-08-31', '2027-02-26'], real: ['2026-09-07', '2027-03-12'], avance: 0.14 }),
    P('06.02', 'Instalación de electricidad y telecomunicaciones por vivienda', 'ud', 20, 5600, { plan: ['2026-08-31', '2027-03-12'], real: ['2026-09-07', '2027-03-19'], avance: 0.12 }),
    P('06.03', 'Climatización y ventilación mecánica por vivienda', 'ud', 20, 6900, { plan: ['2026-10-19', '2027-03-26'], real: null, avance: 0 }),
    P('06.04', 'Instalaciones generales: acometidas, CGP y puesta a tierra', 'PA', 1, 38000, { plan: ['2026-03-02', '2027-04-30'], real: ['2026-03-09', '2027-05-07'], avance: 0.22 }),
    P('07.01', 'Pavimento laminado AC5 sobre lámina antiimpacto', 'm²', 1360, 34, { plan: ['2026-10-19', '2027-03-12'], real: null, avance: 0 }),
    P('07.02', 'Solado y alicatado cerámico en baños y cocinas', 'm²', 1180, 46, { plan: ['2026-10-19', '2027-03-26'], real: null, avance: 0 }),
    P('08.01', 'Carpintería exterior de aluminio con RPT y vidrio bajo emisivo', 'm²', 410, 385, { plan: ['2026-10-26', '2027-01-29'], real: null, avance: 0 }),
    P('08.02', 'Puerta interior de paso lacada en blanco', 'ud', 140, 520, { plan: ['2027-02-01', '2027-04-16'], real: null, avance: 0 }),
    P('09.01', 'Cubierta plana invertida transitable', 'm²', 336, 112, { plan: ['2026-10-05', '2026-10-23'], real: null, avance: 0 }),
    P('10.01', 'Pintura plástica lisa en paramentos verticales y techos', 'm²', 6200, 7.8, { plan: ['2027-01-11', '2027-05-14'], real: null, avance: 0 }),
    P('11.01', 'Urbanización interior, portal y zonas comunes', 'PA', 1, 78000, { plan: ['2027-03-01', '2027-06-25'], real: null, avance: 0 }),
    P('12.01', 'Seguridad y salud', 'PA', 1, 31000, { plan: ['2026-02-02', '2027-06-30'], real: ['2026-02-02', '2027-06-30'], avance: 0.47 }),
    P('12.02', 'Gestión de residuos de construcción y demolición', 'PA', 1, 15000, { plan: ['2026-02-02', '2027-06-30'], real: ['2026-02-02', '2027-06-30'], avance: 0.41 }),
    P('13.01', 'Aparatos sanitarios y mamparas por vivienda', 'ud', 20, 1450, { plan: ['2027-02-22', '2027-04-16'], real: null, avance: 0 }),
    P('13.02', 'Mobiliario de cocina por vivienda', 'ud', 20, 4200, { plan: ['2027-03-01', '2027-04-30'], real: null, avance: 0 }),
  ];
  A.partidaByCode = {};
  A.partidas.forEach((p) => { A.partidaByCode[p.code] = p; p.sub = (A.subs.find((s) => s.caps.includes(p.cap)) || {}).id || null; });

  /* ───────────── Elementos BIM (generados como lo haría la ingesta IFC) ───────────── */
  const xs = [0, 6, 12, 18, 24];
  const zs = [0, 7, 14];
  const els = [];
  let gidSeq = 0x3f1a;
  const gid = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
    let n = (gidSeq += 7919), s = '2';
    for (let i = 0; i < 21; i++) { s += chars[(n * (i + 3) + i * 31) % 64]; n = (n * 1103515245 + 12345) % 2147483647; }
    return s;
  };
  // Reparte n elementos dentro de un rango de fechas; cada uno dura `dur` días.
  function spread(range, n, i, dur) {
    if (!range) return null;
    const s = D(range[0]), e = D(range[1]);
    const span = Math.max(0, (e - s) / DAY - dur);
    const st = addDays(s, Math.round((i * span) / Math.max(1, n - 1)));
    return { start: st, end: addDays(st, dur) };
  }
  function add(el) { el.gid = gid(); els.push(el); return el; }

  // Cimentación: 15 zapatas 1,8 × 1,8 × 0,8
  let k = 0;
  zs.forEach((z) => xs.forEach((x) => {
    k++;
    add({ id: 'ZAP-' + String(k).padStart(2, '0'), name: 'Zapata Z' + k, ifc: 'IfcFooting', layer: 'estructura', level: 'CIM', partida: '02.02', qty: 2.592,
      material: 'HA-30/B/20/IIa · B 500 S', geom: { x, y: -0.8, z, sx: 1.8, sy: 0.8, sz: 1.8 },
      plan: spread(['2026-02-16', '2026-03-13'], 15, k - 1, 4), real: spread(['2026-02-16', '2026-03-20'], 15, k - 1, 4) });
  }));

  // Pilares por planta
  const PIL = {
    PB: [['2026-03-16', '2026-03-27'], ['2026-03-23', '2026-04-03']],
    P1: [['2026-04-20', '2026-05-01'], ['2026-04-27', '2026-05-08']],
    P2: [['2026-05-25', '2026-06-05'], ['2026-06-01', '2026-06-12']],
    P3: [['2026-06-29', '2026-07-10'], ['2026-07-06', '2026-07-17']],
    P4: [['2026-08-31', '2026-09-09'], ['2026-08-31', '2026-09-11']],
  };
  LV.forEach((lv, L) => {
    let i = 0;
    zs.forEach((z) => xs.forEach((x) => {
      i++;
      const y0 = L === 0 ? -0.4 : L * 3, y1 = L * 3 + 3 - 0.3;
      add({ id: `PIL-${lv}-${String(i).padStart(2, '0')}`, name: `Pilar P${i} · ${lv}`, ifc: 'IfcColumn', layer: 'estructura', level: lv, partida: '03.01', qty: 0.3675,
        material: 'HA-30/B/20/IIa · B 500 S', geom: { x, y: (y0 + y1) / 2, z, sx: 0.35, sy: y1 - y0, sz: 0.35 },
        plan: spread(PIL[lv][0], 15, i - 1, 2), real: spread(PIL[lv][1], 15, i - 1, 2) });
    }));
  });

  // Etapas constructivas (subcapítulos de seguimiento). w = peso en el importe de la partida.
  A.stageSets = {
    tabique: [
      { key: 'perfileria', name: 'Perfilería', w: 0.2 },
      { key: 'primera', name: 'Primera placa', w: 0.2 },
      { key: 'instalaciones', name: 'Instalaciones de agua y electricidad', w: 0, ref: '06 Instalaciones' },
      { key: 'aislamiento', name: 'Aislamiento', w: 0.1 },
      { key: 'cierre', name: 'Cierre de placas', w: 0.3 },
      { key: 'encintado', name: 'Encintado y juntas', w: 0.2 },
      { key: 'pintura', name: 'Pintura', w: 0, ref: '10 Pinturas' },
    ],
    losa: [
      { key: 'encofrado', name: 'Encofrado', w: 0.25 },
      { key: 'armado', name: 'Armado', w: 0.35 },
      { key: 'hormigonado', name: 'Hormigonado', w: 0.4 },
    ],
  };
  A.stages = A.stageSets.tabique;
  const ST = { v: 'validado', e: 'ejecucion', n: 'no_iniciado' };
  // Divide un rango {start,end} en etapas consecutivas según fracciones
  function splitRange(r, fr) {
    if (!r) return fr.map(() => null);
    const span = (r.end - r.start) / DAY;
    let acc = 0;
    return fr.map((f) => { const s = addDays(r.start, Math.round(acc * span)); acc += f; return { start: s, end: addDays(r.start, Math.round(acc * span)) }; });
  }

  // Forjados: 4 paños de 12 × 7 m por planta, con etapas encofrado · armado · hormigonado
  const FOR = {
    P1: [['2026-03-30', '2026-04-17'], ['2026-04-06', '2026-04-24']],
    P2: [['2026-05-04', '2026-05-22'], ['2026-05-11', '2026-05-29']],
    P3: [['2026-06-08', '2026-06-26'], ['2026-06-15', '2026-07-03']],
    P4: [['2026-07-13', '2026-07-31'], ['2026-07-20', '2026-08-07']],
    CUB: [['2026-09-10', '2026-09-30'], ['2026-09-14', '2026-10-08']],
  };
  const SLAB_SEED = { 'FOR-CUB-1': 'vvv', 'FOR-CUB-2': 'vve', 'FOR-CUB-3': 'ven', 'FOR-CUB-4': 'nnn' };
  const PANOS = [[0, 0], [12, 0], [12, 7], [0, 7]];
  ['P1', 'P2', 'P3', 'P4', 'CUB'].forEach((lv, j) => {
    const y = (j + 1) * 3;
    PANOS.forEach(([px, pz], i) => {
      const id = `FOR-${lv}-${i + 1}`;
      const plan = spread(FOR[lv][0], 4, i, 6), real = spread(FOR[lv][1], 4, i, 7);
      const fr = [0.45, 0.35, 0.2];
      const sp = splitRange(plan, fr), sr = splitRange(real, fr);
      const seed = SLAB_SEED[id] || 'vvv';
      add({ id, name: `Losa ${lv === 'CUB' ? 'cubierta' : lv} · paño ${i + 1}`, ifc: 'IfcSlab', layer: 'estructura', level: lv, partida: '03.02', qty: 84,
        material: 'HA-30/B/20/IIa · canto 30 cm · B 500 S', stageSet: 'losa',
        geom: { x: px + 6 + (px === 0 ? -0.1 : 0.1), y: y - 0.15, z: pz + 3.5 + (pz === 0 ? -0.1 : 0.1), sx: 12.2, sy: 0.3, sz: 7.2 },
        plan, stages: A.stageSets.losa.map((s, k) => ({ key: s.key, state: ST[seed[k]], plan: sp[k], real: sr[k] ? Object.assign({}, sr[k]) : null })) });
    });
  });

  // Fachadas: 12 paños por planta
  const FAC = {
    PB: [['2026-07-06', '2026-07-24'], ['2026-07-20', '2026-08-07']],
    P1: [['2026-08-31', '2026-09-18'], ['2026-09-01', '2026-10-06']],
    P2: [['2026-09-21', '2026-10-09'], null],
    P3: [['2026-10-12', '2026-10-30'], null],
    P4: [['2026-11-02', '2026-11-20'], null],
  };
  const SEGS = [
    { s: 'S1', x: 3, z: -0.25, sx: 6, sz: 0.3, a: 18 }, { s: 'S2', x: 9, z: -0.25, sx: 6, sz: 0.3, a: 18 },
    { s: 'O1', x: -0.25, z: 3.5, sx: 0.3, sz: 7, a: 21 }, { s: 'O2', x: -0.25, z: 10.5, sx: 0.3, sz: 7, a: 21 },
    { s: 'N1', x: 3, z: 14.25, sx: 6, sz: 0.3, a: 18 }, { s: 'N2', x: 9, z: 14.25, sx: 6, sz: 0.3, a: 18 },
    { s: 'N3', x: 15, z: 14.25, sx: 6, sz: 0.3, a: 18 }, { s: 'E1', x: 24.25, z: 3.5, sx: 0.3, sz: 7, a: 21 },
    { s: 'S3', x: 15, z: -0.25, sx: 6, sz: 0.3, a: 18 }, { s: 'N4', x: 21, z: 14.25, sx: 6, sz: 0.3, a: 18 },
    { s: 'S4', x: 21, z: -0.25, sx: 6, sz: 0.3, a: 18 }, { s: 'E2', x: 24.25, z: 10.5, sx: 0.3, sz: 7, a: 21 },
  ];
  const SIDE = { S: 'sur', N: 'norte', O: 'oeste', E: 'este' };
  LV.forEach((lv, L) => {
    SEGS.forEach((g, i) => {
      add({ id: `FAC-${lv}-${g.s}`, name: `Fachada ${SIDE[g.s[0]]} ${g.s} · ${lv}`, ifc: 'IfcWall', layer: 'fachadas', level: lv, partida: '04.01', qty: g.a,
        material: 'LCV 11,5 + lana mineral 6 cm + PYL', geom: { x: g.x, y: L * 3 + 1.35, z: g.z, sx: g.sx, sy: 2.7, sz: g.sz },
        plan: spread(FAC[lv][0], 12, i, 4), real: spread(FAC[lv][1], 12, i, 4) });
    });
  });

  // Carpintería exterior: una ventana por paño de fachada (prevista)
  const CARP = { PB: ['2026-10-26', '2026-11-06'], P1: ['2026-11-09', '2026-11-20'], P2: ['2026-11-23', '2026-12-04'], P3: ['2026-12-09', '2026-12-18'], P4: ['2027-01-11', '2027-01-29'] };
  LV.forEach((lv, L) => {
    SEGS.forEach((g, i) => {
      const along = g.sx > g.sz, w = along ? 2.4 : 1.6;
      const out = along ? (g.z < 7 ? -0.19 : 0.19) : (g.x < 12 ? -0.19 : 0.19);
      add({ id: `VEN-${lv}-${g.s}`, name: `Ventana ${g.s} · ${lv}`, ifc: 'IfcWindow', layer: 'carpinterias', level: lv, partida: '08.01', qty: +(w * 1.5).toFixed(2),
        material: 'Aluminio RPT · vidrio 4/16/4 bajo emisivo',
        geom: { x: g.x + (along ? 0 : out), y: L * 3 + 1.65, z: g.z + (along ? out : 0), sx: along ? w : 0.07, sy: 1.5, sz: along ? 0.07 : w },
        plan: spread(CARP[lv], 12, i, 2), real: null });
    });
  });

  // Tabiquería interior: 4 tabiques por vivienda, con 7 etapas cada uno
  const VIVS = [{ l: 'A', ox: 0, oz: 0 }, { l: 'B', ox: 12, oz: 0 }, { l: 'C', ox: 12, oz: 7 }, { l: 'D', ox: 0, oz: 7 }];
  A.vivs = [];
  A.tabLayout = [
    { k: 1, name: 'Dormitorio 1 / Salón', x: 4.5, z: 2.25, sx: 0.1, sz: 3.9 },
    { k: 2, name: 'Zona de día / Cocina y baño', x: 6, z: 4.2, sx: 11.4, sz: 0.1 },
    { k: 3, name: 'Cocina / Baño', x: 8, z: 5.45, sx: 0.1, sz: 2.5 },
    { k: 4, name: 'Salón / Dormitorio 2', x: 9, z: 2.25, sx: 0.1, sz: 3.9 },
  ];
  const STAGE_PLAN = {
    perfileria: ['2026-08-24', '2026-09-04'], primera: ['2026-08-31', '2026-09-09'], instalaciones: ['2026-09-03', '2026-09-14'],
    aislamiento: ['2026-09-10', '2026-09-17'], cierre: ['2026-09-14', '2026-09-25'], encintado: ['2026-09-21', '2026-10-02'], pintura: ['2026-10-05', '2026-10-16'],
  };
  const SEED = {
    PB: { A: 'vvvvvvn', B: 'vvvvvvn', C: 'vvvvven', D: 'vvvvvnn' },
    P1: { A: 'vvvvvnn', B: 'vvvvenn', C: 'vvvnnnn', D: 'vvennnn' },
    P2: { A: 'ennnnnn', B: 'ennnnnn', C: 'nnnnnnn', D: 'nnnnnnn' },
    P3: { A: 'nnnnnnn', B: 'nnnnnnn', C: 'nnnnnnn', D: 'nnnnnnn' },
    P4: { A: 'nnnnnnn', B: 'nnnnnnn', C: 'nnnnnnn', D: 'nnnnnnn' },
  };
  LV.forEach((lv, L) => {
    VIVS.forEach((v, vi) => {
      A.vivs.push({ key: lv + v.l, name: VIV_NAME(lv, v.l), level: lv, L, letter: v.l, ox: v.ox, oz: v.oz });
      A.tabLayout.forEach((t) => {
        const len = Math.max(t.sx, t.sz);
        const seed = SEED[lv][v.l];
        const stages = A.stageSets.tabique.map((s, si) => {
          const pr = STAGE_PLAN[s.key];
          const plan = spread(pr.map((d) => iso(addDays(D(d), 14 * L))), 4, vi, 3);
          const real = spread(pr.map((d) => iso(addDays(D(d), 14 * L + 5))), 4, vi, 3);
          return { key: s.key, state: ST[seed[si]], plan, real };
        });
        add({ id: `TAB-${lv}${v.l}-${t.k}`, name: `Tabique ${t.k} · ${VIV_NAME(lv, v.l)}`, room: t.name, ifc: 'IfcWall', layer: 'tabiqueria', level: lv, viv: VIV_NAME(lv, v.l), vivKey: lv + v.l,
          partida: '05.01', qty: +(len * 2.7).toFixed(2), material: 'PYL 98/600(48) · 2×12,5 mm · lana mineral 45 mm', stageSet: 'tabique',
          geom: { x: v.ox + t.x, y: L * 3 + 1.35, z: v.oz + t.z, sx: t.sx, sy: 2.7, sz: t.sz }, stages });
      });
    });
  });

  // Pavimentos, equipamiento e instalaciones por vivienda
  const P2 = (o, x, y, z, sx, sy, sz) => ({ x: o.ox + x, y: o.y + y, z: o.oz + z, sx, sy, sz });
  A.vivs.forEach((v) => {
    const o = { ox: v.ox, oz: v.oz, y: v.L * 3 };
    const base = addDays(D('2026-10-19'), 14 * (v.L - 1));
    const rng = (a, b) => ({ start: addDays(base, a), end: addDays(base, b) });
    add({ id: `PAV-${v.key}`, name: `Pavimento laminado · ${v.name}`, ifc: 'IfcCovering', layer: 'acabados', level: v.level, viv: v.name, vivKey: v.key, partida: '07.01', qty: 68,
      material: 'Laminado AC5 8 mm sobre lámina antiimpacto', geom: { x: v.ox + 6, y: o.y + 0.02, z: v.oz + 3.5, sx: 11.5, sy: 0.04, sz: 6.5 }, plan: rng(0, 4), real: null });
    add({ id: `EQB-${v.key}`, name: `Baño · ${v.name}`, ifc: 'IfcSanitaryTerminal', layer: 'equipamiento', level: v.level, viv: v.name, vivKey: v.key, partida: '13.01', qty: 1,
      material: 'Inodoro, lavabo con mueble, plato de ducha y mampara', schematic: false,
      geom: { parts: [P2(o, 8.55, 0.21, 6.5, 0.4, 0.42, 0.62), P2(o, 8.55, 0.62, 6.85, 0.4, 0.4, 0.16), P2(o, 9.7, 0.43, 6.72, 0.8, 0.86, 0.46), P2(o, 11.2, 0.03, 6.45, 1.2, 0.06, 0.8), P2(o, 10.58, 1.0, 6.45, 0.02, 1.95, 0.8)] },
      plan: rng(130, 134), real: null });
    add({ id: `EQC-${v.key}`, name: `Cocina · ${v.name}`, ifc: 'IfcFurniture', layer: 'equipamiento', level: v.level, viv: v.name, vivKey: v.key, partida: '13.02', qty: 1,
      material: 'Muebles bajos y altos lacados, encimera compacta, columna de frigorífico',
      geom: { parts: [P2(o, 2.2, 0.45, 6.62, 3.6, 0.9, 0.6), P2(o, 2.2, 0.93, 6.62, 3.64, 0.04, 0.64), P2(o, 2.2, 1.9, 6.78, 3.6, 0.7, 0.34), P2(o, 4.45, 1.05, 6.62, 0.7, 2.1, 0.62)] },
      plan: rng(140, 145), real: null });
    // Electricidad (representación esquemática): bandeja en techo, bajantes y cajas de mecanismos
    const elec = [P2(o, 6, 2.55, 4.32, 11.2, 0.04, 0.04), P2(o, 0.5, 1.7, 4.35, 0.3, 0.4, 0.1)];
    const pts = { tomas: 0, luz: 6, cuadro: 1 };
    A.tabLayout.forEach((t) => {
      const along = t.sx > t.sz, len = along ? t.sx : t.sz;
      [0.3, 0.7].forEach((f) => {
        const px = along ? t.x - len / 2 + len * f : t.x + 0.08, pz = along ? t.z + 0.08 : t.z - len / 2 + len * f;
        elec.push(P2(o, px, 1.42, pz, 0.03, 2.25, 0.03), P2(o, px, 0.3, pz, 0.08, 0.08, 0.06));
        pts.tomas++;
        if (f === 0.7) { elec.push(P2(o, px, 1.1, pz, 0.08, 0.08, 0.06)); pts.tomas++; }
      });
    });
    add({ id: `ELE-${v.key}`, name: `Electricidad · ${v.name}`, ifc: 'IfcCableSegment', layer: 'electricidad', level: v.level, viv: v.name, vivKey: v.key, partida: '06.02', qty: 1,
      material: 'Tubo corrugado Ø20/25 · cable H07V-K', schematic: true, points: `${pts.tomas} tomas de corriente · ${pts.luz} puntos de luz · 1 cuadro general`,
      geom: { parts: elec }, plan: null, real: null });
    // Fontanería (esquemática): montante, distribución bajo pavimento y puntos de agua
    const fon = [P2(o, 7.9, 1.4, 6.9, 0.06, 2.8, 0.06), P2(o, 5.2, 0.06, 6.3, 5.6, 0.04, 0.04), P2(o, 10, 0.06, 6.0, 4.2, 0.04, 0.04)];
    [[8.55, 6.8], [9.7, 6.9], [11.2, 6.75], [11.5, 6.75], [1.4, 6.85], [2.8, 6.85], [4.0, 6.85]].forEach(([x, z]) => fon.push(P2(o, x, 0.32, z, 0.035, 0.55, 0.035), P2(o, x, 0.6, z, 0.07, 0.07, 0.07)));
    add({ id: `FON-${v.key}`, name: `Fontanería y saneamiento · ${v.name}`, ifc: 'IfcPipeSegment', layer: 'fontaneria', level: v.level, viv: v.name, vivKey: v.key, partida: '06.01', qty: 1,
      material: 'Multicapa PEX-AL-PEX Ø16/20 · PVC Ø40/110', schematic: true, points: 'Baño: 4 puntos de agua (inodoro, lavabo, ducha fría y caliente) · Cocina: 3 puntos (fregadero, lavavajillas, lavadora)',
      geom: { parts: fon }, plan: null, real: null });
  });

  // Estado actual: por fechas reales + ajustes de la narrativa de la demo
  els.forEach((el) => {
    if (el.stages) {
      el.stages.forEach((s) => {
        if (s.state === 'validado') { if (!s.real) s.real = { start: addDays(TODAY, -6), end: addDays(TODAY, -2) }; if (s.real.end > TODAY) s.real.end = addDays(TODAY, -2); if (s.real.start > s.real.end) s.real.start = addDays(s.real.end, -2); s.validatedOn = addDays(s.real.end, 1); }
        else if (s.state === 'ejecucion') { s.real = s.real || { start: addDays(TODAY, -3) }; s.real.start = s.real.start > TODAY ? addDays(TODAY, -3) : s.real.start; s.real.end = null; }
        else { s.real = null; }
      });
    } else if (!el.real) { el.state = 'no_iniciado'; }
    else if (el.real.end <= TODAY) { el.state = 'validado'; el.validatedOn = addDays(el.real.end, 1); }
    else if (el.real.start <= TODAY) { el.state = 'ejecucion'; el.real.end = null; }
    else { el.state = 'no_iniciado'; el.real = null; }
  });
  const OVR = { 'FAC-P1-S3': 'ejecucion', 'FAC-P1-N4': 'ejecucion', 'FAC-P1-S4': 'no_iniciado', 'FAC-P1-E2': 'no_iniciado' };
  els.forEach((el) => {
    const o = OVR[el.id];
    if (!o) return;
    el.state = o;
    if (o === 'ejecucion') { el.real = el.real || { start: addDays(TODAY, -4) }; if (el.real.start > TODAY) el.real.start = addDays(TODAY, -2); el.real.end = null; delete el.validatedOn; }
    if (o === 'no_iniciado') { el.real = null; delete el.validatedOn; }
  });
  // Instalaciones de cada vivienda: su estado sigue a la etapa de instalaciones de los tabiques
  A.syncInstalaciones = function () {
    A.vivs.forEach((v) => {
      const st = els.filter((e) => e.vivKey === v.key && e.stageSet === 'tabique').map((e) => e.stages.find((s) => s.key === 'instalaciones'));
      const state = st.every((s) => s.state === 'validado') ? 'validado' : st.some((s) => s.state !== 'no_iniciado') ? 'ejecucion' : 'no_iniciado';
      ['ELE-', 'FON-'].forEach((pre) => {
        const el = A.el ? A.el[pre + v.key] : els.find((e) => e.id === pre + v.key);
        el.state = state;
        const starts = st.filter((s) => s.real && s.real.start).map((s) => +s.real.start);
        const ends = st.filter((s) => s.real && s.real.end).map((s) => +s.real.end);
        el.real = state === 'no_iniciado' ? null : { start: new Date(Math.min(...starts)), end: state === 'validado' ? new Date(Math.max(...ends)) : null };
        el.plan = (() => { const p = st.map((s) => s.plan).filter(Boolean); return p.length ? { start: new Date(Math.min(...p.map((x) => +x.start))), end: new Date(Math.max(...p.map((x) => +x.end))) } : null; })();
        if (state === 'validado') el.validatedOn = addDays(el.real.end, 1);
      });
    });
  };
  A.syncInstalaciones();

  A.elements = els;
  A.el = {};
  els.forEach((e) => { A.el[e.id] = e; });
  // Cantidades de partidas medidas en el modelo
  A.partidas.forEach((p) => { if (p.model) p.qty = +els.filter((e) => e.partida === p.code).reduce((s, e) => s + e.qty, 0).toFixed(2); });

  /* ───────────── Capturas de obra y propuestas de la IA ───────────── */
  A.cams = {
    grua: { pos: [22, 31, 36], target: [11, 9, 5], fov: 50 },
    sur: { pos: [21, 1.65, -17], target: [11, 4.2, 4], fov: 58 },
    esquinaSO: { pos: [-9, 0.6, -9], target: [12, -0.8, 7], fov: 60 },
    gruaBaja: { pos: [1, 16, 31], target: [12, 5, 7], fov: 55 },
  };
  A.captures = [
    { id: 'CAP-031', title: 'Cubierta · cámara de grúa', zone: 'Cubierta', level: 'CUB', point: 'C-03 · pluma de grúa, esquina NE', at: '2026-09-30T17:45', author: 'Cámara fija', device: 'Cámara 4K fija en grúa', kind: 'exterior', cam: 'grua', status: 'pendiente_analisis',
      proposals: [
        { el: 'FOR-CUB-2', stage: 'hormigonado', prop: 'terminado', conf: 0.91, note: 'Hormigón vertido y fratasado en todo el paño. Sin encofrado perimetral visible.' },
        { el: 'FOR-CUB-3', stage: 'armado', prop: 'ejecucion', conf: 0.86, note: 'Encofrado montado y armadura inferior colocada. Falta la armadura superior.' },
        { el: 'FOR-CUB-4', stage: 'encofrado', prop: 'no_iniciado', conf: 0.95, note: 'Sin encofrado ni puntales en el área del paño.' },
        { el: 'FAC-P2-N3', prop: 'no_iniciado', conf: 0.9, note: 'Plano de fachada abierto, sin hiladas de ladrillo.' },
      ] },
    { id: 'CAP-030', title: 'Fachada sur · planta 1ª', zone: 'Fachadas · P1', level: 'P1', point: 'F-01 · acera sur', at: '2026-09-29T09:12', author: 'Marcos Ferrer', device: 'Móvil · foto 48 MP', kind: 'exterior', cam: 'sur', status: 'pendiente_analisis',
      proposals: [
        { el: 'FAC-P1-S3', prop: 'terminado', conf: 0.88, note: 'Hoja de ladrillo completa hasta el canto del forjado. Juntas rematadas.' },
        { el: 'FAC-P1-S4', prop: 'ejecucion', conf: 0.79, note: 'Seis hiladas levantadas aproximadamente. Andamio en posición.' },
        { el: 'FAC-P1-E2', prop: 'no_observable', conf: 0.31, note: 'El paño queda fuera del encuadre y oculto por la malla del andamio. Se necesita otra captura.' },
        { el: 'FAC-PB-S4', prop: 'terminado', conf: 0.97, note: 'Coincide con el estado validado el 10 ago.' },
      ] },
    { id: 'CAP-029', title: 'Vivienda 1ºB · recorrido 360°', zone: 'Vivienda 1ºB', level: 'P1', viv: 'P1B', point: 'R-1B · 7 posiciones', at: '2026-09-28T12:30', author: 'Marcos Ferrer', device: 'Cámara 360° · vídeo 5,7K', kind: 'interior', status: 'pendiente_analisis',
      views: [
        { name: 'Salón-comedor', back: 'TAB-P1B-4', left: 'TAB-P1B-1' },
        { name: 'Distribuidor', back: 'TAB-P1B-2', left: 'TAB-P1B-3', dim: true },
      ],
      proposals: [
        { el: 'TAB-P1B-1', stage: 'cierre', prop: 'terminado', conf: 0.93, note: 'Segunda cara de placa atornillada en todo el paño. Juntas sin tratar.' },
        { el: 'TAB-P1B-4', stage: 'cierre', prop: 'terminado', conf: 0.89, note: 'Paño cerrado con placa. Cajas de mecanismos recortadas.' },
        { el: 'TAB-P1B-2', stage: 'cierre', prop: 'ejecucion', conf: 0.82, note: 'Cierre de placa en un 60 % del paño. Se ven la lana mineral y la perfilería en el extremo.' },
        { el: 'TAB-P1B-3', stage: 'cierre', prop: 'no_observable', conf: 0.41, note: 'Poca luz en el distribuidor. No se distingue si el cierre de placa cubre todo el paño.' },
      ] },
    { id: 'CAP-028', title: 'Vivienda Bajo C · recorrido 360°', zone: 'Vivienda Bajo C', level: 'PB', viv: 'PBC', point: 'R-0C · 6 posiciones', at: '2026-09-30T11:05', author: 'Lucía Montané', device: 'Cámara 360° · vídeo 5,7K', kind: 'interior', status: 'pendiente_analisis',
      views: [{ name: 'Salón-comedor', back: 'TAB-PBC-4', left: 'TAB-PBC-1' }],
      proposals: [
        { el: 'TAB-PBC-1', stage: 'encintado', prop: 'terminado', conf: 0.9, note: 'Juntas encintadas y con pasta. Tornillería cubierta.' },
        { el: 'TAB-PBC-4', stage: 'encintado', prop: 'terminado', conf: 0.87, note: 'Juntas tratadas en toda la altura.' },
        { el: 'TAB-PBC-2', stage: 'encintado', prop: 'ejecucion', conf: 0.8, note: 'Cinta colocada sin segunda mano de pasta.' },
      ] },
    { id: 'CAP-024', title: 'Estructura P4 · cámara de grúa', zone: 'Estructura · P4', level: 'P4', point: 'C-03 · pluma de grúa, esquina NE', at: '2026-09-11T18:00', author: 'Cámara fija', device: 'Cámara 4K fija en grúa', kind: 'exterior', cam: 'grua', status: 'validada', summary: '15 pilares de P4 validados · 5,51 m³' },
    { id: 'CAP-017', title: 'Fachada sur · planta baja', zone: 'Fachadas · PB', level: 'PB', point: 'F-01 · acera sur', at: '2026-08-07T08:40', author: 'Marcos Ferrer', device: 'Móvil · foto 48 MP', kind: 'exterior', cam: 'sur', status: 'validada', summary: '12 paños de fachada PB validados · 228 m²' },
    { id: 'CAP-009', title: 'Estructura P2 · cámara de grúa', zone: 'Estructura · P2', level: 'P2', point: 'C-03 · pluma de grúa, esquina NE', at: '2026-06-12T18:00', author: 'Cámara fija', device: 'Cámara 4K fija en grúa', kind: 'exterior', cam: 'gruaBaja', status: 'validada', summary: 'Forjado P2 y pilares P2 validados' },
    { id: 'CAP-002', title: 'Cimentación · 4 esquinas de parcela', zone: 'Cimentación', level: 'CIM', point: 'E-SO · esquina suroeste (1 de 4)', at: '2026-03-20T13:15', author: 'Marcos Ferrer', device: 'Móvil · 4 fotos', kind: 'exterior', cam: 'esquinaSO', status: 'validada', summary: '15 zapatas validadas · 38,88 m³' },
  ];

  /* ───────────── Planificación ───────────── */
  A.activities = [
    { id: 'A01', name: 'Movimiento de tierras', sub: 'S1', plan: ['2026-02-02', '2026-02-20'], real: ['2026-02-02', '2026-02-24'], done: 1 },
    { id: 'A02', name: 'Cimentación', sub: 'S2', plan: ['2026-02-16', '2026-03-20'], real: ['2026-02-16', '2026-03-27'], done: 1 },
    { id: 'A03', name: 'Estructura PB a P2', sub: 'S2', plan: ['2026-03-16', '2026-06-05'], real: ['2026-03-23', '2026-06-12'], done: 1 },
    { id: 'A04', name: 'Estructura P3 y P4', sub: 'S2', plan: ['2026-06-08', '2026-09-09'], real: ['2026-06-15', '2026-09-11'], done: 1 },
    { id: 'A05', name: 'Forjado de cubierta', sub: 'S2', plan: ['2026-09-10', '2026-09-30'], real: ['2026-09-14', '2026-10-08'], critical: true, link: 'FOR-CUB' },
    { id: 'A06', name: 'Cubierta e impermeabilización', sub: null, plan: ['2026-10-05', '2026-10-23'], real: ['2026-10-13', '2026-10-31'], critical: true, future: true },
    { id: 'A07', name: 'Fachada PB y P1', sub: 'S3', plan: ['2026-07-06', '2026-09-18'], real: ['2026-07-20', '2026-10-06'], link: 'FAC-PB|FAC-P1' },
    { id: 'A08', name: 'Fachada P2 a P4', sub: 'S3', plan: ['2026-09-21', '2026-11-20'], real: ['2026-10-05', '2026-12-02'], future: true },
    { id: 'A09', name: 'Tabiquería PB y P1', sub: 'S4', plan: ['2026-08-31', '2026-10-16'], real: ['2026-09-05', '2026-10-23'], link: 'TAB-PB|TAB-P1' },
    { id: 'A10', name: 'Tabiquería P2 a P4', sub: 'S4', plan: ['2026-09-28', '2026-12-18'], real: ['2026-09-29', '2026-12-23'], link: 'TAB-P2|TAB-P3|TAB-P4' },
    { id: 'A11', name: 'Instalaciones interiores', sub: 'S5', plan: ['2026-08-31', '2027-03-26'], real: ['2026-09-07', '2027-04-02'], pct: 0.13 },
    { id: 'A12', name: 'Carpintería exterior', sub: null, plan: ['2026-10-26', '2027-01-29'], real: ['2026-10-26', '2027-01-29'], future: true },
    { id: 'A13', name: 'Solados y alicatados', sub: null, plan: ['2026-10-19', '2027-03-26'], real: ['2026-10-26', '2027-04-02'], future: true },
    { id: 'A14', name: 'Pinturas y acabados', sub: null, plan: ['2027-01-11', '2027-05-14'], real: ['2027-01-18', '2027-05-21'], future: true },
    { id: 'A15', name: 'Urbanización y entrega', sub: null, plan: ['2027-03-01', '2027-06-30'], real: ['2027-03-08', '2027-07-08'], future: true, critical: true },
  ];

  A.supplies = [
    { id: 'M1', name: 'Pavimento laminado AC5', scope: 'Planta 1ª · 272 m²', needed: '2026-10-19', lead: 10, status: 'sin_pedido', vendor: 'Distribuciones Cerámicas del Este' },
    { id: 'M2', name: 'Baldosa porcelánica baños y cocinas', scope: 'Planta 1ª · 236 m²', needed: '2026-10-19', lead: 12, status: 'sin_pedido', vendor: 'Distribuciones Cerámicas del Este' },
    { id: 'M3', name: 'Lámina impermeabilizante y aislamiento XPS', scope: 'Cubierta · 336 m²', needed: '2026-10-13', lead: 7, status: 'pedido', ref: 'PED-0388 · entrega 9 oct', vendor: 'Impermeabilizaciones Saler' },
    { id: 'M4', name: 'Placa PYL 12,5 mm y perfilería', scope: 'Planta 2ª · 1.180 m² de placa', needed: '2026-10-12', lead: 5, status: 'pedido', ref: 'PED-0391 · entrega 7 oct', vendor: 'Sistemas Secos Levante' },
    { id: 'M5', name: 'Puertas de paso lacadas', scope: 'PB y P1 · 56 ud', needed: '2026-11-02', lead: 21, status: 'sin_pedido', vendor: 'Carpintería Rafelbunyol' },
    { id: 'M6', name: 'Carpintería de aluminio RPT', scope: 'PB y P1 · 164 m²', needed: '2026-10-26', lead: 35, status: 'pedido', ref: 'PED-0372 · en fabricación', vendor: 'Aluminios Puçol' },
    { id: 'M7', name: 'Ladrillo cara vista', scope: 'Planta 2ª · 9.800 ud', needed: '2026-10-05', lead: 4, status: 'recibido', ref: 'Albarán 22417 · 29 sep', vendor: 'Cerámica Manises' },
  ];

  /* Hoja de ruta de interiores (por vivienda tipo) */
  A.interiorRoute = [
    { key: 'perfileria', name: 'Perfilería', sub: 'S4', days: [-16, -12] },
    { key: 'instalaciones', name: 'Instalaciones empotradas', sub: 'S5', days: [-10, -6], note: 'Foto previa al cierre obligatoria' },
    { key: 'placa', name: 'Placa de yeso laminado', sub: 'S4', days: [-3, 2] },
    { key: 'encintado', name: 'Encintado y tratamiento de juntas', sub: 'S4', days: [4, 8] },
    { key: 'imprimacion', name: 'Imprimación de paramentos', sub: null, days: [11, 12] },
    { key: 'solado', name: 'Pavimento laminado y alicatado', sub: null, days: [18, 22], supply: 'M1' },
    { key: 'carpinteria', name: 'Puertas de paso', sub: null, days: [32, 36], supply: 'M5' },
    { key: 'pintura', name: 'Pintura final', sub: null, days: [39, 43] },
  ];

  /* Documentos económicos */
  A.docs = [
    { id: 'FAC-A-0412', type: 'Factura', sub: 'S3', date: '2026-09-25', amount: 49180, concept: 'Fachada PB y P1 · septiembre', match: 'exceso', detail: 'Supera lo certificado a origen en 4.180 €' },
    { id: 'PRO-0219', type: 'Proforma', sub: 'S3', date: '2026-09-02', amount: 18600, concept: 'Acopio ladrillo P2', match: 'acopio', detail: 'Acopio pendiente de condiciones contractuales' },
    { id: 'FAC-T-0088', type: 'Factura', sub: 'S2', date: '2026-09-03', amount: 132400, concept: 'Estructura · certificación 7', match: 'ok', detail: 'Coincide con la certificación n.º 7' },
    { id: 'PAG-0931', type: 'Pago', sub: 'S2', date: '2026-09-30', amount: 118300, concept: 'Transferencia · cert. 6', match: 'ok', detail: 'Justificante bancario adjunto' },
    { id: 'FAC-SL-0057', type: 'Factura', sub: 'S4', date: '2026-09-28', amount: 6900, concept: 'Tabiquería PB · septiembre', match: 'pendiente', detail: 'Pendiente de certificar: no hay avance validado de septiembre' },
    { id: 'PRO-0231', type: 'Proforma', sub: 'S5', date: '2026-09-21', amount: 12450, concept: 'Material de fontanería P1–P2', match: 'info', detail: 'Proforma: no acredita ejecución ni pago' },
    { id: 'FAC-IC-0140', type: 'Factura', sub: 'S5', date: '2026-09-15', amount: 21800, concept: 'Instalaciones · agosto', match: 'ok', detail: 'Coincide con la certificación n.º 7' },
  ];

  /* ───────────── Motor de cálculo ───────────── */
  const E = (A.engine = {});
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // ¿Elemento (o etapa) terminado a una fecha? Para hoy usa el estado validado.
  E.stageDoneAt = (s, d) => (d >= TODAY ? s.state === 'validado' : !!(s.real && s.real.end && s.real.end <= d));
  E.doneFraction = (el, d) => {
    if (el.stages) return el.stages.reduce((acc, s, i) => acc + (E.stageDoneAt(s, d) ? A.stageSets[el.stageSet][i].w : 0), 0);
    return E.stageDoneAt(el, d) ? 1 : 0;
  };
  E.plannedFraction = (el, d) => {
    if (el.stages) return el.stages.reduce((acc, s, i) => acc + (s.plan && s.plan.end <= d ? A.stageSets[el.stageSet][i].w : 0), 0);
    return el.plan && el.plan.end <= d ? 1 : 0;
  };
  E.partidaAvance = (p, d = TODAY) => {
    if (p.model) {
      const list = A.elements.filter((e) => e.partida === p.code);
      const tot = list.reduce((s, e) => s + e.qty, 0);
      return tot ? list.reduce((s, e) => s + e.qty * E.doneFraction(e, d), 0) / tot : 0;
    }
    if (!p.real || !p.avance) return 0;
    if (d >= TODAY) return p.avance;
    const s = D(p.real[0]), end = Math.min(D(p.real[1]), TODAY);
    if (d <= s) return 0;
    return p.avance * clamp01((d - s) / (end - s));
  };
  E.partidaPlan = (p, d = TODAY) => {
    if (p.model) {
      const list = A.elements.filter((e) => e.partida === p.code);
      const tot = list.reduce((s, e) => s + e.qty, 0);
      return tot ? list.reduce((s, e) => s + e.qty * E.plannedFraction(e, d), 0) / tot : 0;
    }
    const s = D(p.plan[0]), e = D(p.plan[1]);
    return clamp01((d - s) / (e - s));
  };
  E.importe = (p) => p.qty * p.price;
  E.pem = () => A.partidas.reduce((s, p) => s + E.importe(p), 0);
  E.ejecutado = (d = TODAY, filter) => A.partidas.filter(filter || (() => true)).reduce((s, p) => s + E.importe(p) * E.partidaAvance(p, d), 0);
  E.planificado = (d = TODAY, filter) => A.partidas.filter(filter || (() => true)).reduce((s, p) => s + E.importe(p) * E.partidaPlan(p, d), 0);
  E.chapterStats = (d = TODAY) => A.chapters.map((c) => {
    const f = (p) => p.cap === c.code;
    const total = A.partidas.filter(f).reduce((s, p) => s + E.importe(p), 0);
    const ej = E.ejecutado(d, f), pl = E.planificado(d, f);
    return Object.assign({}, c, { total, ej, pl, avance: total ? ej / total : 0, plan: total ? pl / total : 0 });
  });
  E.subStats = (sub) => {
    const f = (p) => p.sub === sub.id;
    const contrato = A.partidas.filter(f).reduce((s, p) => s + E.importe(p) * sub.factor, 0);
    const ej = E.ejecutado(TODAY, f) * sub.factor;
    const cert = E.ejecutado(D('2026-08-31'), f) * sub.factor;
    const pag = E.ejecutado(D('2026-07-31'), f) * sub.factor;
    const fact = sub.id === 'S3' ? cert + 4180 : cert;
    return { contrato, ej, cert, fact, pag, ret: cert * A.project.retencion };
  };
  // Fecha de pedido = fecha de necesidad − plazo de suministro − 1 día de margen
  E.orderBy = (m) => addDays(D(m.needed), -(m.lead + 1));
  E.daysTo = (d) => Math.round((d - TODAY) / DAY);
  // Estado mostrado de un elemento (incluye propuestas pendientes de revisión)
  E.pending = {};
  E.refreshPending = () => {
    E.pending = {};
    A.captures.forEach((c) => (c.proposals || []).forEach((p) => { if (c.status === 'pendiente_revision' && !p.resolved) E.pending[p.el] = { cap: c, p }; }));
  };
  E.displayState = (el, d) => {
    const now = !d || d >= TODAY;
    if (now && E.pending[el.id] && E.pending[el.id].p.prop !== 'no_observable') return 'revision';
    if (el.stages) {
      const done = el.stages.map((s) => (now ? s.state === 'validado' : E.stageDoneAt(s, d)));
      if (done.every(Boolean)) return 'validado';
      const started = el.stages.some((s) => (now ? s.state !== 'no_iniciado' : s.real && s.real.start <= d));
      return started ? 'ejecucion' : 'no_iniciado';
    }
    if (now) return el.state;
    if (el.real && el.real.end && el.real.end <= d) return 'validado';
    if (el.real && el.real.start <= d) return 'ejecucion';
    return 'no_iniciado';
  };
  E.planState = (el, d = TODAY) => {
    const real = E.doneFraction(el, d), plan = E.plannedFraction(el, d);
    if (real >= 1) return 'validado';
    if (plan > real + 0.01) return 'retrasado';
    if (real > 0) return 'ejecucion';
    return 'no_iniciado';
  };
  E.refreshPending();
})(window.ATL);
