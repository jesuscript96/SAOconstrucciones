/* Atalaya · datos de demostración de los módulos de gestión (cartera, compras, economía, documentación, calidad…).
   Todo es ficticio. */
(function (A) {
  'use strict';
  const D = A.D, TODAY = A.TODAY, addDays = A.addDays;

  /* ───────── Ficha de la obra ───────── */
  Object.assign(A.project, {
    type: 'Residencial plurifamiliar',
    address: 'C/ del Arquitecte Tolsà, 27 · 46020 Valencia',
    constructora: 'Edifica Levante, S.L.',
    description: 'Edificio de 20 viviendas de 2 y 3 dormitorios en planta baja más cuatro, con estructura de hormigón armado, fachada de ladrillo cara vista y tabiquería seca. Cubierta plana transitable con zonas comunes.',
    fields: [
      { k: 'Viviendas', v: '20 (8 de 2 dormitorios · 12 de 3 dormitorios)' },
      { k: 'Plantas', v: 'Planta baja + 4' },
      { k: 'Superficie construida', v: '1.680 m²' },
      { k: 'Garaje', v: 'No' },
      { k: 'Calificación energética', v: 'A (proyecto)' },
    ],
    agentes: [
      { rol: 'Promotor', nombre: 'Promociones Vega Baixa, S.L.', contacto: 'Ignacio Bosch' },
      { rol: 'Constructora', nombre: 'Edifica Levante, S.L.', contacto: 'Andrea Soler' },
      { rol: 'Proyectista', nombre: 'Estudio Nolla Arquitectura', contacto: 'Clara Vidal' },
      { rol: 'Dirección de obra', nombre: 'Clara Vidal, arquitecta', contacto: '' },
      { rol: 'Dirección de ejecución', nombre: 'Jorge Peris, arquitecto técnico', contacto: '' },
      { rol: 'Coordinación de seguridad y salud', nombre: 'Laura Ibáñez', contacto: '' },
      { rol: 'Organismo de control técnico', nombre: 'Control Técnico Llevant', contacto: '' },
      { rol: 'Laboratorio de control', nombre: 'Ensayos Turia Lab', contacto: '' },
    ],
    contract: [
      { k: 'Firma del contrato', v: '15 ene 2026' },
      { k: 'Acta de replanteo', v: '2 feb 2026' },
      { k: 'Plazo de ejecución', v: '17 meses' },
      { k: 'Fin contractual', v: '30 jun 2027' },
      { k: 'Penalización por retraso', v: '0,5 ‰ del contrato por día' },
      { k: 'Forma de pago', v: 'Certificación mensual a 30 días' },
    ],
    updated: { avance: '2026-10-01T09:40', economia: '2026-10-01T08:15', plan: '2026-09-30T18:20' },
  });

  /* ───────── Cartera de obras ───────── */
  A.obras = [
    { id: 'OB-2611', name: 'Residencial Mirador del Turia', city: 'Valencia', zone: 'Benimaclet', type: 'Residencial plurifamiliar', size: '20 viviendas · 1.680 m²', promotor: 'Promociones Vega Baixa, S.L.', constructora: 'Edifica Levante, S.L.', resp: 'Marcos Ferrer', status: 'ejecucion', start: '2026-02-02', end: '2027-06-30', live: true, img: { cam: 'gruaBaja', at: 'now' } },
    { id: 'OB-2604', name: 'Residencial Les Moreres', city: 'Alboraia', zone: 'Port Saplaya', type: 'Viviendas adosadas', size: '12 viviendas · 2.150 m²', promotor: 'Moreres Habitat, S.L.', constructora: 'Edifica Levante, S.L.', resp: 'Lucía Montané', status: 'ejecucion', start: '2025-11-03', end: '2026-12-18', real: 0.61, plan: 0.58, budget: 2140000, cert: 1250000, pend: 86000, alerts: 2, devs: 'Al día', img: { cam: 'sur', at: '2026-08-07' } },
    { id: 'OB-2615', name: 'Nave logística Riba-roja', city: 'Riba-roja de Túria', zone: 'Pol. Ind. El Oliveral', type: 'Industrial', size: 'Nave de 6.400 m² · 8 muelles', promotor: 'Logística Camp de Túria, S.A.', constructora: 'Edifica Levante, S.L.', resp: 'Javier Ortí', status: 'paralizada', start: '2026-04-06', end: '2027-02-26', real: 0.12, plan: 0.31, budget: 3480000, cert: 395000, pend: 41000, alerts: 4, devs: 'Licencia de actividad pendiente', img: { cam: 'esquinaSO', at: '2026-03-20' } },
    { id: 'OB-2509', name: 'Edificio Albereda 12', city: 'Valencia', zone: 'Algirós', type: 'Residencial plurifamiliar', size: '14 viviendas + local', promotor: 'Albereda Patrimonial, S.L.', constructora: 'Edifica Levante, S.L.', resp: 'Marcos Ferrer', status: 'entregada', start: '2024-09-16', end: '2026-03-13', real: 1, plan: 1, budget: 1890000, cert: 1890000, pend: 0, alerts: 3, devs: 'Posventa: 7 incidencias abiertas', img: { cam: 'gruaBaja', at: 'done' } },
    { id: 'OB-2602', name: 'Residencial Patraix Jardí', city: 'Valencia', zone: 'Patraix', type: 'Residencial plurifamiliar', size: '28 viviendas · garaje', promotor: 'Inversiones Jardí, S.L.', constructora: 'Edifica Levante, S.L.', resp: 'Javier Ortí', status: 'terminada', start: '2025-01-13', end: '2026-10-30', real: 0.98, plan: 1, budget: 3960000, cert: 3880000, pend: 212000, alerts: 2, devs: 'Repasos previos a entrega', img: { cam: 'grua', at: 'done' } },
    { id: 'OB-2620', name: 'Rehabilitación Sueca 31', city: 'Valencia', zone: 'Russafa', type: 'Rehabilitación', size: '9 viviendas · fachada protegida', promotor: 'Russafa Living, S.L.', constructora: 'Edifica Levante, S.L.', resp: 'Lucía Montané', status: 'pendiente', start: '2026-11-16', end: '2027-11-30', real: 0, plan: 0, budget: 1240000, cert: 0, pend: 0, alerts: 1, devs: 'Pendiente de licencia', img: { cam: 'esquinaSO', at: '2026-02-01' } },
  ];
  A.obraStatus = {
    pendiente: ['Pendiente de inicio', 'st-none'],
    ejecucion: ['En ejecución', 'st-progress'],
    paralizada: ['Paralizada', 'st-late'],
    terminada: ['Terminada', 'st-review'],
    entregada: ['Entregada', 'st-ok'],
  };

  /* ───────── Planificación: hitos, dependencias, restricciones e historial ───────── */
  const ACT = {
    A01: { cap: '01', zona: 'Parcela', resp: 'Marcos Ferrer', deps: [] },
    A02: { cap: '02', zona: 'Cimentación', resp: 'Marcos Ferrer', deps: ['A01'] },
    A03: { cap: '03', zona: 'PB a P2', resp: 'Marcos Ferrer', deps: ['A02'] },
    A04: { cap: '03', zona: 'P3 y P4', resp: 'Marcos Ferrer', deps: ['A03'] },
    A05: { cap: '03', zona: 'Cubierta', resp: 'Marcos Ferrer', deps: ['A04'] },
    A06: { cap: '09', zona: 'Cubierta', resp: 'Marcos Ferrer', deps: ['A05'] },
    A07: { cap: '04', zona: 'PB y P1', resp: 'Lucía Montané', deps: ['A03'] },
    A08: { cap: '04', zona: 'P2 a P4', resp: 'Lucía Montané', deps: ['A07', 'A04'] },
    A09: { cap: '05', zona: 'PB y P1', resp: 'Lucía Montané', deps: ['A07'] },
    A10: { cap: '05', zona: 'P2 a P4', resp: 'Lucía Montané', deps: ['A09', 'A08'] },
    A11: { cap: '06', zona: 'Viviendas', resp: 'Lucía Montané', deps: ['A09'] },
    A12: { cap: '08', zona: 'Fachadas', resp: 'Marcos Ferrer', deps: ['A07', 'A08'] },
    A13: { cap: '07', zona: 'Viviendas', resp: 'Lucía Montané', deps: ['A09', 'A11'] },
    A14: { cap: '10', zona: 'Viviendas', resp: 'Lucía Montané', deps: ['A13'] },
    A15: { cap: '11', zona: 'Zonas comunes', resp: 'Marcos Ferrer', deps: ['A14', 'A06'] },
  };
  A.activities.forEach((a) => Object.assign(a, ACT[a.id] || {}));
  A.hitos = [
    { id: 'H1', name: 'Fin de estructura', plan: '2026-09-30', fc: '2026-10-08', act: 'A05' },
    { id: 'H2', name: 'Cubierta estanca', plan: '2026-10-23', fc: '2026-10-31', act: 'A06' },
    { id: 'H3', name: 'Fachadas cerradas', plan: '2026-11-20', fc: '2026-12-02', act: 'A08' },
    { id: 'H4', name: 'Fin de tabiquería', plan: '2026-12-18', fc: '2026-12-23', act: 'A10' },
    { id: 'H5', name: 'Final de obra y entrega', plan: '2027-06-30', fc: '2027-07-08', act: 'A15' },
  ];
  A.restricciones = [
    { id: 'R1', act: 'A06', type: 'Material', text: 'Lámina impermeabilizante y XPS (PED-0388), entrega prevista el 9 oct', status: 'abierta', resp: 'Marcos Ferrer', due: '2026-10-09' },
    { id: 'R2', act: 'A06', type: 'Trabajo previo', text: 'Hormigonado de los paños 3 y 4 de la losa de cubierta', status: 'abierta', resp: 'Estructuras Turia', due: '2026-10-08' },
    { id: 'R3', act: 'A09', type: 'Documentación', text: 'Foto previa al cierre de instalaciones en 1ºC y 1ºD', status: 'abierta', resp: 'Marcos Ferrer', due: '2026-10-05' },
    { id: 'R4', act: 'A12', type: 'Aprobación', text: 'Planos de taller de carpintería pendientes de la dirección de obra', status: 'abierta', resp: 'Clara Vidal', due: '2026-10-09' },
    { id: 'R5', act: 'A13', type: 'Material', text: 'Pavimento laminado y baldosa de P1 sin pedido confirmado', status: 'abierta', resp: 'Marcos Ferrer', due: '2026-10-08' },
    { id: 'R6', act: 'A08', type: 'Aprobación', text: 'Muestra de ladrillo de P2 aprobada por la dirección de obra', status: 'resuelta', resp: 'Clara Vidal', due: '2026-09-25' },
  ];
  A.dateChanges = [
    { at: '2026-09-28T10:20', who: 'Andrea Soler', act: 'A05', from: '30 sep', to: '8 oct', reason: 'Lluvias del 22 y 23 sep; reprogramación del hormigonado' },
    { at: '2026-09-28T10:22', who: 'Andrea Soler', act: 'A06', from: '23 oct', to: '31 oct', reason: 'Arrastre del forjado de cubierta' },
    { at: '2026-09-15T17:05', who: 'Marcos Ferrer', act: 'A07', from: '18 sep', to: '6 oct', reason: 'Baja de un oficial de Cerramientos Albufera' },
    { at: '2026-08-31T09:00', who: 'Andrea Soler', act: 'A04', from: '9 sep', to: '11 sep', reason: 'Vacaciones de agosto alargadas una semana' },
  ];

  /* ───────── Proveedores y pedidos ───────── */
  A.proveedores = [
    { id: 'PR1', name: 'Distribuciones Cerámicas del Este', cats: ['Pavimentos', 'Revestimientos cerámicos'], contacto: 'Sergio Martí', tel: '961 000 101', email: 'pedidos@ceramicasdeleste.example', city: 'Manises', rating: 4 },
    { id: 'PR2', name: 'Impermeabilizaciones Saler', cats: ['Impermeabilización', 'Aislamiento'], contacto: 'Nuria Gil', tel: '961 000 102', email: 'obra@impersaler.example', city: 'Valencia', rating: 5 },
    { id: 'PR3', name: 'Sistemas Secos Levante', cats: ['Placa de yeso', 'Perfilería', 'Aislamiento'], contacto: 'Raúl Navarro', tel: '961 000 103', email: 'almacen@secoslevante.example', city: 'Paterna', rating: 4 },
    { id: 'PR4', name: 'Carpintería Rafelbunyol', cats: ['Carpintería interior', 'Puertas'], contacto: 'Pilar Sanchis', tel: '961 000 104', email: 'comercial@carpinteriarafel.example', city: 'Rafelbunyol', rating: 3 },
    { id: 'PR5', name: 'Aluminios Puçol', cats: ['Carpintería exterior', 'Vidrio'], contacto: 'Toni Ferrando', tel: '961 000 105', email: 'oficina@alupucol.example', city: 'Puçol', rating: 4 },
    { id: 'PR6', name: 'Cerámica Manises', cats: ['Ladrillo', 'Bloques'], contacto: 'Amparo Roig', tel: '961 000 106', email: 'ventas@ceramicamanises.example', city: 'Manises', rating: 5 },
    { id: 'PR7', name: 'Hormigones del Túria', cats: ['Hormigón', 'Bombeo'], contacto: 'Vicent Llopis', tel: '961 000 107', email: 'planta@hormigonesturia.example', city: 'Quart de Poblet', rating: 4 },
    { id: 'PR8', name: 'Ferralla Levante', cats: ['Acero corrugado', 'Mallas'], contacto: 'Ernesto Peña', tel: '961 000 108', email: 'pedidos@ferrallalevante.example', city: 'Sagunto', rating: 4 },
    { id: 'PR9', name: 'Saneamientos Horta Nord', cats: ['Sanitarios', 'Grifería', 'Fontanería'], contacto: 'Marta Coll', tel: '961 000 109', email: 'obras@saneamientoshn.example', city: 'Alboraia', rating: 3 },
    { id: 'PR10', name: 'Cocinas Albufera', cats: ['Mobiliario de cocina', 'Electrodomésticos'], contacto: 'Jaume Ferri', tel: '961 000 110', email: 'proyectos@cocinasalbufera.example', city: 'Catarroja', rating: 4 },
  ];
  const PROV = { M1: 'PR1', M2: 'PR1', M3: 'PR2', M4: 'PR3', M5: 'PR4', M6: 'PR5', M7: 'PR6' };
  const EXTRA = {
    M1: { act: 'A13', resp: 'Marcos Ferrer', lines: [{ d: 'Laminado AC5 8 mm roble natural', q: 272, u: 'm²', p: 14.2 }, { d: 'Lámina antiimpacto 3 mm', q: 280, u: 'm²', p: 2.1 }] },
    M2: { act: 'A13', resp: 'Marcos Ferrer', lines: [{ d: 'Porcelánico rectificado 60×60', q: 236, u: 'm²', p: 18.9 }] },
    M3: { act: 'A06', resp: 'Marcos Ferrer', solicitado: '2026-09-24', lines: [{ d: 'Lámina EPDM 1,2 mm', q: 360, u: 'm²', p: 11.8 }, { d: 'XPS 80 mm', q: 345, u: 'm²', p: 9.4 }], entrega: '2026-10-09' },
    M4: { act: 'A10', resp: 'Lucía Montané', solicitado: '2026-09-29', lines: [{ d: 'Placa PYL 12,5 mm', q: 1180, u: 'm²', p: 3.2 }, { d: 'Montante 48 y canal', q: 920, u: 'ml', p: 1.6 }], entrega: '2026-10-07' },
    M5: { act: 'A13', resp: 'Lucía Montané', lines: [{ d: 'Puerta de paso lacada 72,5 cm', q: 56, u: 'ud', p: 168 }] },
    M6: { act: 'A12', resp: 'Marcos Ferrer', solicitado: '2026-09-08', lines: [{ d: 'Ventana corredera RPT 2,4×1,5', q: 16, u: 'ud', p: 690 }, { d: 'Ventana practicable 1,6×1,5', q: 8, u: 'ud', p: 470 }], entrega: '2026-10-23' },
    M7: { act: 'A08', resp: 'Lucía Montané', solicitado: '2026-09-22', lines: [{ d: 'Ladrillo cara vista 24×11,5×5', q: 9800, u: 'ud', p: 0.42 }], entrega: '2026-09-29' },
  };
  A.supplies.forEach((m) => {
    const x = EXTRA[m.id];
    Object.assign(m, x, { prov: PROV[m.id] });
    m.status = m.status === 'pedido' ? 'confirmado' : m.status === 'recibido' ? 'completa' : m.status;
    m.importe = m.lines.reduce((s, l) => s + l.q * l.p, 0);
    m.recibido = m.status === 'completa' ? m.lines.map((l) => l.q) : m.lines.map(() => 0);
    m.docs = m.status === 'completa' ? ['DOC-ALB-22417'] : m.status === 'confirmado' ? ['DOC-CONF-' + m.id] : [];
  });
  A.supplies.push(
    { id: 'M8', name: 'Hormigón HA-30 para losa de cubierta', scope: 'Cubierta · paños 2 a 4 · 76 m³', needed: '2026-10-05', lead: 1, status: 'parcial', prov: 'PR7', act: 'A05', resp: 'Marcos Ferrer', solicitado: '2026-09-21', entrega: '2026-10-05', ref: 'PED-0386 · 2 de 3 entregas', lines: [{ d: 'HA-30/B/20/IIa bombeado', q: 76, u: 'm³', p: 92 }], recibido: [26], docs: ['DOC-ALB-H-1180'] },
    { id: 'M9', name: 'Acero corrugado B 500 S cubierta', scope: 'Cubierta · 7,4 t', needed: '2026-09-28', lead: 5, status: 'retraso', prov: 'PR8', act: 'A05', resp: 'Marcos Ferrer', solicitado: '2026-09-18', entrega: '2026-10-03', ref: 'PED-0384 · falta 1,9 t', lines: [{ d: 'Barra corrugada Ø12-Ø16', q: 7.4, u: 't', p: 890 }], recibido: [5.5], docs: ['DOC-ALB-F-771'] },
    { id: 'M10', name: 'Sanitarios y grifería', scope: 'Todas las viviendas · 20 juegos', needed: '2027-02-22', lead: 30, status: 'solicitud', prov: 'PR9', act: 'A13', resp: 'Lucía Montané', solicitado: '2026-09-30', ref: 'Oferta solicitada', lines: [{ d: 'Juego inodoro, lavabo, plato y grifería', q: 20, u: 'ud', p: 980 }], recibido: [0], docs: [] },
    { id: 'M11', name: 'Bloque de hormigón para petos', scope: 'Cubierta', needed: '2026-10-20', lead: 3, status: 'cancelado', prov: 'PR6', act: 'A06', resp: 'Marcos Ferrer', solicitado: '2026-09-10', ref: 'Sustituido por fábrica de ladrillo (CAM-02)', lines: [{ d: 'Bloque 40×20×20', q: 420, u: 'ud', p: 1.1 }], recibido: [0], docs: [] },
  );
  A.supplies.forEach((m) => { m.importe = m.importe || m.lines.reduce((s, l) => s + l.q * l.p, 0); });
  A.supplyStatus = {
    sin_pedido: ['Pendiente de pedir', 'st-late'],
    solicitud: ['Solicitud', 'st-none'],
    confirmado: ['Pedido confirmado', 'st-review'],
    parcial: ['Entrega parcial', 'st-progress'],
    completa: ['Entrega completa', 'st-ok'],
    retraso: ['Retrasado', 'st-late'],
    cancelado: ['Cancelado', 'st-none'],
  };
  A.acopios = [
    { mat: 'Ladrillo cara vista', ubic: 'Patio este', recibido: '9.800 ud', consumo: '1.150 ud', stock: '8.650 ud', nota: 'Suficiente para P2 y P3' },
    { mat: 'Placa PYL 12,5 mm', ubic: 'Planta 1ª', recibido: '2.360 m²', consumo: '2.120 m²', stock: '240 m²', nota: 'Llega PED-0391 el 7 oct' },
    { mat: 'Lana mineral 45 mm', ubic: 'Planta baja', recibido: '1.200 m²', consumo: '760 m²', stock: '440 m²', nota: '' },
    { mat: 'Acero corrugado', ubic: 'Zona de ferralla', recibido: '5,5 t', consumo: '4,8 t', stock: '0,7 t', nota: 'Falta 1,9 t del PED-0384' },
  ];

  /* ───────── Subcontratas: ficha, contrato y valoración ───────── */
  const SUBX = {
    S1: { cif: 'B-00000001', contactos: [{ n: 'Josep Martí', c: 'Gerente', t: '961 100 201' }], alcance: 'Vaciado, excavación de zanjas y pozos, rellenos y transporte a vertedero.', inicio: '2026-02-02', fin: '2026-11-13', compromisos: ['Retirada diaria de tierras', 'Relleno de trasdós antes del 30 oct'], mods: [], val: { calidad: 4, plazos: 4, respuesta: 5 } },
    S2: { cif: 'B-00000002', contactos: [{ n: 'Ramón Esteve', c: 'Jefe de producción', t: '961 100 202' }, { n: 'Carla Pons', c: 'Administración', t: '961 100 212' }], alcance: 'Cimentación y estructura de hormigón armado: zapatas, pilares, losas y escaleras, incluso encofrados y ferralla.', inicio: '2026-02-16', fin: '2026-10-08', compromisos: ['Hormigonado de cubierta antes del 8 oct', 'Desencofrado de cubierta en 7 días'], mods: [{ id: 'MOD-S2-01', d: 'Refuerzo de armado en losa de cubierta por cambio de cargas', imp: 3200, st: 'aprobado' }], val: { calidad: 4, plazos: 3, respuesta: 4 } },
    S3: { cif: 'B-00000003', contactos: [{ n: 'Paco Ribera', c: 'Encargado', t: '961 100 203' }], alcance: 'Fachada de ladrillo cara vista, aislamiento y trasdosado, incluso petos de cubierta.', inicio: '2026-07-20', fin: '2026-12-02', compromisos: ['Segundo equipo en fachada P2 desde el 5 oct'], mods: [{ id: 'MOD-S3-01', d: 'Peto de cubierta no medido (CAM-02)', imp: 1234, st: 'aprobado' }], val: { calidad: 4, plazos: 2, respuesta: 3 } },
    S4: { cif: 'B-00000004', contactos: [{ n: 'Raúl Navarro', c: 'Jefe de obra', t: '961 100 204' }], alcance: 'Tabiquería y trasdosados de placa de yeso laminado con aislamiento, encintado y tratamiento de juntas.', inicio: '2026-08-31', fin: '2026-12-23', compromisos: ['Cierre de 1ºC y 1ºD tras la foto de instalaciones'], mods: [], val: { calidad: 5, plazos: 4, respuesta: 5 } },
    S5: { cif: 'B-00000005', contactos: [{ n: 'Elena Soria', c: 'Jefa de proyecto', t: '961 100 205' }], alcance: 'Instalaciones de fontanería, saneamiento, electricidad, telecomunicaciones y climatización de viviendas y zonas comunes.', inicio: '2026-09-07', fin: '2027-04-02', compromisos: ['Pruebas de estanqueidad por planta antes del cierre de placa'], mods: [{ id: 'MOD-S5-01', d: 'Preinstalación de recarga de vehículo eléctrico (CAM-03)', imp: 8300, st: 'pendiente' }], val: { calidad: 3, plazos: 4, respuesta: 3 } },
  };
  A.subs.forEach((s) => Object.assign(s, SUBX[s.id], { notas: [] }));
  A.subs.find((s) => s.id === 'S3').notas.push({ at: '2026-09-15', who: 'Marcos Ferrer', t: 'Retraso de dos semanas en fachada P1 por falta de personal.' });
  A.subs.find((s) => s.id === 'S4').notas.push({ at: '2026-09-26', who: 'Lucía Montané', t: 'Muy buena terminación del encintado en planta baja.' });

  /* ───────── Facturas, cobros y pagos ───────── */
  A.facturas = [
    { id: 'FE-2026-041', dir: 'emitida', a: 'Promociones Vega Baixa, S.L.', concepto: 'Certificación n.º 6 · julio', fecha: '2026-08-05', vence: '2026-09-04', base: 64373, iva: 0.1, cobrado: 70810, doc: 'DOC-FE-041' },
    { id: 'FE-2026-047', dir: 'emitida', a: 'Promociones Vega Baixa, S.L.', concepto: 'Certificación n.º 7 · agosto', fecha: '2026-09-04', vence: '2026-10-04', base: 48181, iva: 0.1, cobrado: 0, doc: 'DOC-FE-047' },
    { id: 'FAC-T-0088', dir: 'recibida', sub: 'S2', concepto: 'Estructura · certificación 7', fecha: '2026-09-03', vence: '2026-11-02', base: 13225, iva: 0.21, pagado: 0, doc: 'DOC-FAC-T-0088' },
    { id: 'FAC-T-0081', dir: 'recibida', sub: 'S2', concepto: 'Estructura · certificación 6', fecha: '2026-08-04', vence: '2026-10-03', base: 22180, iva: 0.21, pagado: 13000, doc: 'DOC-FAC-T-0081' },
    { id: 'FAC-A-0412', dir: 'recibida', sub: 'S3', concepto: 'Fachada PB y P1 · septiembre', fecha: '2026-09-25', vence: '2026-11-24', base: 15345, iva: 0.21, pagado: 0, doc: 'DOC-FAC-A-0412', flag: 'Supera lo certificado a origen en 4.180 €' },
    { id: 'FAC-SL-0057', dir: 'recibida', sub: 'S4', concepto: 'Tabiquería PB · septiembre', fecha: '2026-09-28', vence: '2026-11-27', base: 6900, iva: 0.21, pagado: 0, doc: 'DOC-FAC-SL-0057', flag: 'Pendiente de certificar' },
    { id: 'FAC-IC-0140', dir: 'recibida', sub: 'S5', concepto: 'Instalaciones · agosto', fecha: '2026-09-15', vence: '2026-11-14', base: 4967, iva: 0.21, pagado: 0, doc: 'DOC-FAC-IC-0140' },
    { id: 'FAC-H-2291', dir: 'recibida', prov: 'PR7', concepto: 'Hormigón cubierta · entrega 1', fecha: '2026-09-26', vence: '2026-10-26', base: 2392, iva: 0.21, pagado: 0, doc: 'DOC-FAC-H-2291' },
    { id: 'FAC-CM-0930', dir: 'recibida', prov: 'PR6', concepto: 'Ladrillo cara vista P2', fecha: '2026-09-30', vence: '2026-10-30', base: 4116, iva: 0.21, pagado: 0, doc: 'DOC-FAC-CM-0930' },
  ];
  A.movimientos = [
    { id: 'COB-0612', tipo: 'cobro', fecha: '2026-09-03', contraparte: 'Promociones Vega Baixa, S.L.', factura: 'FE-2026-041', importe: 70810, just: 'DOC-JUS-0612' },
    { id: 'PAG-0931', tipo: 'pago', fecha: '2026-09-30', contraparte: 'Hormigones y Estructuras Turia, S.L.', factura: 'FAC-T-0081', importe: 13000, just: 'DOC-PAG-0931', parcial: true },
  ];

  /* ───────── Cambios de alcance y desviaciones ───────── */
  A.cambios = [
    { id: 'CAM-01', title: 'Pavimento de baños en porcelánico rectificado 60×60', motivo: 'Mejora solicitada por el promotor', solicitante: 'Promotor', partidas: ['07.02'], venta: 6240, coste: 4900, plazo: 0, com: 'aprobado', ejec: 'pendiente', fecha: '2026-07-14', docs: ['DOC-CAM-01'] },
    { id: 'CAM-02', title: 'Peto de cubierta no medido en proyecto', motivo: 'Error de medición', solicitante: 'Dirección de ejecución', partidas: ['04.01'], venta: 1487, coste: 1234, plazo: 0, com: 'aprobado', ejec: 'pendiente', fecha: '2026-09-02', docs: ['DOC-CAM-02'] },
    { id: 'CAM-03', title: 'Preinstalación de recarga de vehículo eléctrico', motivo: 'Solicitud del promotor', solicitante: 'Promotor', partidas: ['06.04'], venta: 9800, coste: 8300, plazo: 3, com: 'presentado', ejec: 'pendiente', fecha: '2026-09-18', docs: ['DOC-CAM-03'] },
    { id: 'CAM-04', title: 'Ampliación de huecos de fachada en 1ºA y 1ºD', motivo: 'Cambio de distribución de compradores', solicitante: 'Comprador', partidas: ['04.01', '08.01'], venta: 2150, coste: 1700, plazo: 2, com: 'valorar', ejec: 'pendiente', fecha: '2026-09-29', docs: [] },
    { id: 'CAM-05', title: 'Sustitución de bañeras por platos de ducha en 6 viviendas', motivo: 'Petición de compradores', solicitante: 'Comprador', partidas: ['13.01'], venta: -1320, coste: -900, plazo: 0, com: 'rechazado', ejec: 'pendiente', fecha: '2026-08-21', docs: [] },
  ];
  A.cambioCom = { valorar: ['Pendiente de valorar', 'st-none'], presentado: ['Presentado', 'st-review'], aprobado: ['Aprobado', 'st-ok'], rechazado: ['Rechazado', 'st-late'] };
  A.cambioEjec = { pendiente: ['Sin ejecutar', 'st-none'], ejecucion: ['En ejecución', 'st-progress'], ejecutado: ['Ejecutado', 'st-ok'] };
  A.desviaciones = [
    { id: 'DES-01', area: '03 Estructura', title: 'Retraso del forjado de cubierta', causa: 'retrasos', plazo: 8, coste: 0, resp: 'Marcos Ferrer', accion: 'Hormigonar paños 3 y 4 en una sola puesta y reforzar ferralla', estado: 'en curso' },
    { id: 'DES-02', area: '04 Fachadas', title: 'Fachada PB y P1 por debajo del rendimiento previsto', causa: 'productividad', plazo: 18, coste: 0, resp: 'Lucía Montané', accion: 'Segundo equipo de Cerramientos Albufera durante 3 semanas', estado: 'en curso' },
    { id: 'DES-03', area: '04 Fachadas', title: 'Peto de cubierta sin medir', causa: 'mediciones', plazo: 0, coste: 1234, resp: 'Andrea Soler', accion: 'Modificado aprobado (CAM-02)', estado: 'cerrada' },
    { id: 'DES-04', area: '03 Estructura', title: 'Subida del acero corrugado', causa: 'precios', plazo: 0, coste: 2860, resp: 'Andrea Soler', accion: 'Revisar fórmula de revisión de precios del contrato', estado: 'abierta' },
    { id: 'DES-05', area: '07 Revestimientos', title: 'Porcelánico en baños (cambio del promotor)', causa: 'alcance', plazo: 0, coste: 4900, resp: 'Andrea Soler', accion: 'Repercutido en venta (CAM-01)', estado: 'cerrada' },
  ];
  A.causas = { alcance: 'Cambio de alcance', mediciones: 'Mediciones', precios: 'Precios', productividad: 'Productividad', retrasos: 'Retrasos', otras: 'Otras causas' };

  /* ───────── Documentación ───────── */
  A.folders = [
    { id: 'planos', name: 'Planos', icon: 'map' },
    { id: 'obra', name: 'Documentación de obra', icon: 'doc' },
    { id: 'sys', name: 'Seguridad y salud', icon: 'shield' },
    { id: 'contratos', name: 'Contratos', icon: 'doc' },
    { id: 'informes', name: 'Informes y actas', icon: 'doc' },
    { id: 'cliente', name: 'Cliente', icon: 'euro' },
    { id: 'subs', name: 'Subcontratas', icon: 'users', children: A.subs.map((s) => ({ id: 'sub-' + s.id, name: s.short, sub: s.id })) },
    { id: 'proveedores', name: 'Proveedores', icon: 'truck' },
    { id: 'calidad', name: 'Calidad', icon: 'check' },
    { id: 'entrega', name: 'Entrega y cierre', icon: 'key' },
  ];
  // Requisitos documentales (plantilla reutilizable «Residencial plurifamiliar · Comunitat Valenciana»)
  A.requisitos = {
    obra: ['Licencia de obras', 'DREP', 'Acta de replanteo', 'Comunicación de apertura del centro de trabajo', 'Libro de órdenes', 'Seguro decenal', 'Póliza de responsabilidad civil', 'Plan de control de calidad', 'Estudio de gestión de residuos'],
    sys: ['PSS (plan de seguridad y salud)', 'Aprobación del PSS', 'Libro de incidencias', 'Libro de subcontratación', 'Actas de adhesión al PSS', 'Nombramiento de recurso preventivo'],
    contratos: ['Contrato con el promotor', 'Contratos de subcontratas'],
    cliente: ['Certificaciones firmadas', 'Facturas emitidas', 'Justificantes de cobro'],
    calidad: ['Ensayos de hormigón', 'Fichas técnicas de materiales', 'Certificados CE', 'Pruebas de instalaciones'],
    entrega: ['Certificado final de obra', 'Licencia de primera ocupación', 'Libro del edificio', 'Planos finales de obra', 'Garantías y manuales'],
    sub: ['Contrato firmado', 'Inscripción REA', 'Seguro de responsabilidad civil', 'Certificado de estar al corriente con la Seguridad Social', 'Formación PRL de trabajadores'],
  };
  let dn = 0;
  const F = (folder, name, extra) => Object.assign({ id: 'DOC-' + String(++dn).padStart(3, '0'), folder, name, date: '2026-02-02', resp: 'Andrea Soler', status: 'cargado', tags: [], links: [], size: '1,2 MB', type: 'PDF' }, extra);
  A.files = [
    F('obra', 'Licencia de obras · Ayto. de Valencia', { req: 'Licencia de obras', date: '2026-01-12', tags: ['licencia'] }),
    F('obra', 'DREP', { req: 'DREP', date: '2026-01-20', status: 'revision', tags: ['administración'] }),
    F('obra', 'Acta de replanteo firmada', { req: 'Acta de replanteo', date: '2026-02-02' }),
    F('obra', 'Apertura de centro de trabajo', { req: 'Comunicación de apertura del centro de trabajo', date: '2026-01-28' }),
    F('obra', 'Libro de órdenes · hojas 1 a 14', { req: 'Libro de órdenes', date: '2026-09-29', resp: 'Clara Vidal' }),
    F('obra', 'Póliza RC 2026', { req: 'Póliza de responsabilidad civil', date: '2026-01-05', expires: '2026-12-31' }),
    F('obra', 'Plan de control de calidad', { req: 'Plan de control de calidad', date: '2026-02-10', resp: 'Jorge Peris' }),
    F('sys', 'PSS Mirador del Turia rev. 2', { req: 'PSS (plan de seguridad y salud)', date: '2026-01-25', resp: 'Laura Ibáñez' }),
    F('sys', 'Acta de aprobación del PSS', { req: 'Aprobación del PSS', date: '2026-01-30', resp: 'Laura Ibáñez' }),
    F('sys', 'Libro de subcontratación', { req: 'Libro de subcontratación', date: '2026-09-01' }),
    F('sys', 'Actas de adhesión (5 subcontratas)', { req: 'Actas de adhesión al PSS', date: '2026-09-01' }),
    F('contratos', 'Contrato de obra con Promociones Vega Baixa', { req: 'Contrato con el promotor', date: '2026-01-15', links: [{ t: 'eco', label: 'Control económico' }] }),
    F('contratos', 'Contratos de subcontratas (5)', { req: 'Contratos de subcontratas', date: '2026-02-12' }),
    F('cliente', 'Certificación n.º 6 firmada', { req: 'Certificaciones firmadas', date: '2026-08-04', links: [{ t: 'cert', label: 'Certificaciones' }] }),
    F('cliente', 'Certificación n.º 7 firmada', { req: 'Certificaciones firmadas', date: '2026-09-03', links: [{ t: 'cert', label: 'Certificaciones' }] }),
    F('cliente', 'Factura FE-2026-041', { id: 'DOC-FE-041', req: 'Facturas emitidas', date: '2026-08-05', links: [{ t: 'eco', label: 'Control económico' }] }),
    F('cliente', 'Factura FE-2026-047', { id: 'DOC-FE-047', req: 'Facturas emitidas', date: '2026-09-04', links: [{ t: 'eco', label: 'Control económico' }] }),
    F('cliente', 'Justificante de cobro COB-0612', { id: 'DOC-JUS-0612', req: 'Justificantes de cobro', date: '2026-09-03', links: [{ t: 'eco', label: 'Control económico' }] }),
    F('calidad', 'Ensayos de rotura de probetas · forjados P1 a P4', { req: 'Ensayos de hormigón', date: '2026-09-10', resp: 'Ensayos Turia Lab' }),
    F('calidad', 'Fichas técnicas PYL y lana mineral', { req: 'Fichas técnicas de materiales', date: '2026-08-20' }),
    F('informes', 'Informe mensual · agosto', { date: '2026-09-02', resp: 'Andrea Soler', tags: ['mensual'] }),
    F('informes', 'Acta de reunión de obra n.º 33', { date: '2026-09-22', resp: 'Marcos Ferrer', tags: ['acta'] }),
    F('proveedores', 'Albarán 22417 · ladrillo cara vista', { id: 'DOC-ALB-22417', date: '2026-09-29', resp: 'Marcos Ferrer', tags: ['albarán'], links: [{ t: 'sup', id: 'M7', label: 'Suministros · M7' }] }),
    F('proveedores', 'Confirmación PED-0388', { id: 'DOC-CONF-M3', date: '2026-09-25', tags: ['pedido'], links: [{ t: 'sup', id: 'M3', label: 'Suministros · M3' }] }),
    F('proveedores', 'Confirmación PED-0391', { id: 'DOC-CONF-M4', date: '2026-09-29', tags: ['pedido'], links: [{ t: 'sup', id: 'M4', label: 'Suministros · M4' }] }),
    F('proveedores', 'Confirmación PED-0372', { id: 'DOC-CONF-M6', date: '2026-09-08', tags: ['pedido'], links: [{ t: 'sup', id: 'M6', label: 'Suministros · M6' }] }),
    F('proveedores', 'Albarán hormigón 1180', { id: 'DOC-ALB-H-1180', date: '2026-09-26', tags: ['albarán'], links: [{ t: 'sup', id: 'M8', label: 'Suministros · M8' }] }),
    F('proveedores', 'Albarán ferralla 771', { id: 'DOC-ALB-F-771', date: '2026-09-25', tags: ['albarán'], links: [{ t: 'sup', id: 'M9', label: 'Suministros · M9' }] }),
    F('proveedores', 'Factura FAC-H-2291', { id: 'DOC-FAC-H-2291', date: '2026-09-26', tags: ['factura'], links: [{ t: 'eco', label: 'Control económico' }] }),
    F('proveedores', 'Factura FAC-CM-0930', { id: 'DOC-FAC-CM-0930', date: '2026-09-30', tags: ['factura'], links: [{ t: 'eco', label: 'Control económico' }] }),
  ];
  // Documentación de cada subcontrata
  const subDocs = {
    S1: [['Contrato firmado', '2026-01-26'], ['Inscripción REA', '2026-01-26'], ['Seguro de responsabilidad civil', '2026-01-26', '2026-12-31'], ['Certificado de estar al corriente con la Seguridad Social', '2026-08-31', '2026-09-30']],
    S2: [['Contrato firmado', '2026-02-05'], ['Inscripción REA', '2026-02-05'], ['Seguro de responsabilidad civil', '2026-02-05', '2027-02-04'], ['Certificado de estar al corriente con la Seguridad Social', '2026-09-30', '2026-10-30'], ['Formación PRL de trabajadores', '2026-02-10']],
    S3: [['Contrato firmado', '2026-07-01'], ['Inscripción REA', '2026-07-01'], ['Seguro de responsabilidad civil', '2026-07-01', '2027-06-30']],
    S4: [['Contrato firmado', '2026-08-10'], ['Inscripción REA', '2026-08-10'], ['Seguro de responsabilidad civil', '2026-08-10', '2027-08-09'], ['Certificado de estar al corriente con la Seguridad Social', '2026-09-30', '2026-10-30'], ['Formación PRL de trabajadores', '2026-08-25']],
    S5: [['Contrato firmado', '2026-08-20'], ['Seguro de responsabilidad civil', '2026-08-20', '2027-08-19'], ['Formación PRL de trabajadores', '2026-08-28', null, 'revision']],
  };
  Object.keys(subDocs).forEach((sid) => subDocs[sid].forEach(([req, date, expires, status]) => A.files.push(F('sub-' + sid, req + ' · ' + A.subs.find((s) => s.id === sid).short, { req, date, expires, status: status || 'cargado', resp: 'Rosa Llorens' }))));
  const facDocs = { 'FAC-T-0088': 'S2', 'FAC-T-0081': 'S2', 'FAC-A-0412': 'S3', 'FAC-SL-0057': 'S4', 'FAC-IC-0140': 'S5' };
  Object.keys(facDocs).forEach((f) => A.files.push(F('sub-' + facDocs[f], 'Factura ' + f, { id: 'DOC-' + f, date: A.facturas.find((x) => x.id === f).fecha, resp: 'Rosa Llorens', tags: ['factura'], links: [{ t: 'eco', label: 'Control económico' }, { t: 'subs', id: facDocs[f], label: 'Subcontratas' }] })));
  A.files.push(F('sub-S2', 'Justificante de pago PAG-0931 (parcial)', { id: 'DOC-PAG-0931', date: '2026-09-30', resp: 'Rosa Llorens', tags: ['pago'], links: [{ t: 'eco', label: 'Control económico' }] }));
  A.files.push(F('sub-S3', 'Proforma PRO-0219 · acopio ladrillo P2', { date: '2026-09-02', resp: 'Rosa Llorens', tags: ['proforma'], links: [{ t: 'eco', label: 'Control económico' }] }));
  A.files.push(F('sub-S5', 'Proforma PRO-0231 · material de fontanería', { date: '2026-09-21', resp: 'Rosa Llorens', tags: ['proforma'] }));
  ['CAM-01', 'CAM-02', 'CAM-03'].forEach((c) => A.files.push(F('contratos', 'Valoración ' + c, { id: 'DOC-' + c, date: A.cambios.find((x) => x.id === c).fecha, tags: ['cambio'], links: [{ t: 'cambios', id: c, label: 'Cambios · ' + c }] })));
  A.docStatus = { cargado: ['Cargado', 'st-ok'], pendiente: ['Pendiente', 'st-none'], caducado: ['Caducado', 'st-late'], revision: ['En revisión', 'st-review'] };

  /* ───────── Planos y versiones ───────── */
  A.planos = [
    { id: 'A-101', title: 'Planta baja · distribución', disc: 'Arquitectura', zona: 'PB', kind: 'arq', level: 0, revs: [{ r: 'B', date: '2026-01-10', st: 'sustituido' }, { r: 'C', date: '2026-06-02', st: 'vigente', note: 'Ajuste de huecos de fachada sur' }] },
    { id: 'A-102', title: 'Planta tipo (1ª a 4ª) · distribución', disc: 'Arquitectura', zona: 'P1–P4', kind: 'arq', level: 1, revs: [{ r: 'B', date: '2026-01-10', st: 'sustituido' }, { r: 'C', date: '2026-09-30', st: 'vigente', note: 'Desplazamiento de tabique de dormitorio 2 en viviendas A y D (CAM-04)' }] },
    { id: 'A-201', title: 'Alzados y secciones', disc: 'Arquitectura', zona: 'Edificio', kind: 'alzado', revs: [{ r: 'A', date: '2026-01-10', st: 'vigente' }] },
    { id: 'E-101', title: 'Cimentación', disc: 'Estructuras', zona: 'Cimentación', kind: 'est', level: -1, revs: [{ r: 'A', date: '2025-12-15', st: 'vigente' }] },
    { id: 'E-102', title: 'Losas de planta tipo · armado', disc: 'Estructuras', zona: 'P1–P4', kind: 'est', level: 1, revs: [{ r: 'A', date: '2025-12-15', st: 'sustituido' }, { r: 'B', date: '2026-03-20', st: 'vigente', note: 'Refuerzo de armado en voladizos' }] },
    { id: 'E-103', title: 'Losa de cubierta · armado', disc: 'Estructuras', zona: 'Cubierta', kind: 'est', level: 5, revs: [{ r: 'B', date: '2026-09-02', st: 'vigente', note: 'Refuerzo por cambio de cargas (MOD-S2-01)' }] },
    { id: 'I-101', title: 'Electricidad · planta tipo', disc: 'Instalaciones', zona: 'P1–P4', kind: 'ele', level: 1, revs: [{ r: 'A', date: '2026-02-20', st: 'vigente' }] },
    { id: 'I-201', title: 'Fontanería y saneamiento · planta tipo', disc: 'Instalaciones', zona: 'P1–P4', kind: 'fon', level: 1, revs: [{ r: 'A', date: '2026-02-20', st: 'vigente' }] },
    { id: 'AB-101', title: 'Cimentación · plano final de obra', disc: 'Estructuras', zona: 'Cimentación', kind: 'est', level: -1, asBuilt: true, revs: [{ r: '0', date: '2026-04-02', st: 'vigente', note: 'Plano final de obra' }] },
  ];
  A.planoNotes = [
    { plano: 'A-102', rev: 'C', x: 0.36, y: 0.42, t: 'Comprobar nueva posición del tabique de dormitorio 2 antes de montar perfilería', who: 'Marcos Ferrer', at: '2026-09-30', inc: null },
    { plano: 'A-102', rev: 'B', x: 0.69, y: 0.7, t: 'Arqueta de saneamiento desplazada 30 cm en obra', who: 'Lucía Montané', at: '2026-08-18', inc: 'INC-014' },
  ];

  /* ───────── Incidencias y listas de comprobación ───────── */
  A.incidencias = [
    { id: 'INC-021', title: 'Junta de placa abierta junto a caja de mecanismos', ubic: 'Vivienda Bajo C · salón', viv: 'PBC', sub: 'S4', prio: 'media', resp: 'Raúl Navarro', due: '2026-10-06', estado: 'asignada', at: '2026-09-30', by: 'Lucía Montané', el: 'TAB-PBC-1', capture: 'CAP-028', fase: 'encintado' },
    { id: 'INC-020', title: 'Coquera en cara inferior de losa P4, paño 2', ubic: 'Planta 4ª · paño 2', viv: null, sub: 'S2', prio: 'alta', resp: 'Ramón Esteve', due: '2026-10-03', estado: 'resuelta', at: '2026-09-24', by: 'Jorge Peris', el: 'FOR-P4-2', fase: 'hormigonado' },
    { id: 'INC-019', title: 'Falta aislamiento en trasdosado de fachada norte', ubic: 'Vivienda 1ºD · dormitorio 1', viv: 'P1D', sub: 'S3', prio: 'alta', resp: 'Paco Ribera', due: '2026-09-29', estado: 'asignada', at: '2026-09-22', by: 'Marcos Ferrer', el: 'FAC-P1-N1', fase: 'cierre' },
    { id: 'INC-017', title: 'Tubo de fontanería sin fijar en cámara de tabique', ubic: 'Vivienda 1ºB · baño', viv: 'P1B', sub: 'S5', prio: 'media', resp: 'Elena Soria', due: '2026-09-26', estado: 'cerrada', at: '2026-09-19', by: 'Marcos Ferrer', el: 'TAB-P1B-3', fase: 'instalaciones' },
    { id: 'INC-016', title: 'Barandilla provisional suelta en escalera P3', ubic: 'Escalera · planta 3ª', viv: null, sub: 'S2', prio: 'alta', resp: 'Ramón Esteve', due: '2026-09-18', estado: 'cerrada', at: '2026-09-17', by: 'Laura Ibáñez', el: null, fase: 'seguridad' },
    { id: 'INC-014', title: 'Arqueta de saneamiento desplazada respecto al plano', ubic: 'Planta baja · patio', viv: null, sub: 'S5', prio: 'baja', resp: 'Elena Soria', due: '2026-10-15', estado: 'abierta', at: '2026-08-18', by: 'Lucía Montané', el: null, fase: 'instalaciones', plano: 'A-102' },
  ];
  A.incEstados = { abierta: ['Abierta', 'st-late'], asignada: ['Asignada', 'st-progress'], resuelta: ['Resuelta · por verificar', 'st-review'], cerrada: ['Cerrada', 'st-ok'] };
  A.checkTemplates = [
    { id: 'CK-PRE', name: 'Revisión antes de cerrar tabiques', fase: 'cierre', items: ['Instalaciones fijadas a la perfilería', 'Prueba de estanqueidad de fontanería realizada', 'Cajas de mecanismos a la altura de plano', 'Refuerzos para muebles y sanitarios colocados', 'Aislamiento continuo y sin huecos', 'Foto previa al cierre registrada'] },
    { id: 'CK-FON', name: 'Prueba de estanqueidad de fontanería', fase: 'instalaciones', items: ['Red cargada a 10 bar', 'Sin pérdida de presión en 2 horas', 'Sin fugas visibles en uniones', 'Acta firmada por el instalador'] },
    { id: 'CK-ELE', name: 'Prueba de instalación eléctrica', fase: 'instalaciones', items: ['Continuidad de conductores de protección', 'Resistencia de aislamiento', 'Disparo de diferenciales', 'Identificación de circuitos en el cuadro'] },
    { id: 'CK-HOR', name: 'Recepción de losa antes de hormigonar', fase: 'armado', items: ['Recubrimientos con separadores', 'Armado según plano vigente', 'Pasos de instalaciones dejados', 'Encofrado estanco y limpio', 'Visto bueno de la dirección de ejecución'] },
    { id: 'CK-ENT', name: 'Revisión previa a la entrega', fase: 'entrega', items: ['Pintura sin desperfectos', 'Carpinterías ajustadas y con herrajes', 'Sanitarios y grifería sin fugas', 'Mecanismos eléctricos funcionando', 'Limpieza final', 'Contadores y suministros dados de alta'] },
  ];
  A.checklists = [
    { id: 'CL-031', tpl: 'CK-PRE', zona: 'Vivienda 1ºB', viv: 'P1B', at: '2026-09-22', by: 'Marcos Ferrer', done: [true, true, true, true, true, true], result: 'apto' },
    { id: 'CL-032', tpl: 'CK-PRE', zona: 'Vivienda 1ºC', viv: 'P1C', at: '2026-09-30', by: 'Marcos Ferrer', done: [true, true, true, false, false, false], result: 'pendiente' },
    { id: 'CL-029', tpl: 'CK-HOR', zona: 'Losa de cubierta · paño 2', at: '2026-09-28', by: 'Jorge Peris', done: [true, true, true, true, true], result: 'apto' },
    { id: 'CL-027', tpl: 'CK-FON', zona: 'Planta 1ª', at: '2026-09-21', by: 'Elena Soria', done: [true, true, true, true], result: 'apto' },
  ];

  /* ───────── Diario de obra ───────── */
  A.diario = [
    { date: '2026-09-30', meteo: 'Soleado · 24 °C', trabajos: 'Armado del paño 3 de cubierta. Hormigonado del paño 2. Fachada sur P1. Cierre de placa en 1ºB. Encintado en Bajo C.', empresas: [['Estructuras Turia', 9], ['Cerramientos Albufera', 4], ['Secos Levante', 6], ['Inst. Carraixet', 3]], maquinaria: 'Grúa torre · bomba de hormigón (mañana)', entregas: 'Hormigón 26 m³ (PED-0386) · ferralla parcial 5,5 t (PED-0384)', problemas: 'Falta 1,9 t de acero para el paño 3; el proveedor la entrega el 3 oct.', by: 'Marcos Ferrer' },
    { date: '2026-09-29', meteo: 'Nubes y claros · 23 °C', trabajos: 'Encofrado del paño 3 de cubierta. Fachada sur P1. Recepción de ladrillo para P2.', empresas: [['Estructuras Turia', 8], ['Cerramientos Albufera', 4], ['Secos Levante', 6], ['Inst. Carraixet', 4]], maquinaria: 'Grúa torre', entregas: 'Ladrillo cara vista 9.800 ud (albarán 22417)', problemas: '', by: 'Marcos Ferrer' },
    { date: '2026-09-28', meteo: 'Soleado · 25 °C', trabajos: 'Recorrido 360° de 1ºB. Instalaciones en 1ºD. Aislamiento en 1ºA.', empresas: [['Estructuras Turia', 8], ['Cerramientos Albufera', 3], ['Secos Levante', 5], ['Inst. Carraixet', 4]], maquinaria: 'Grúa torre', entregas: '', problemas: '', by: 'Lucía Montané' },
    { date: '2026-09-25', meteo: 'Lluvia débil · 19 °C', trabajos: 'Trabajos interiores únicamente. Placa en 1ºA y 1ºB.', empresas: [['Secos Levante', 6], ['Inst. Carraixet', 4]], maquinaria: '', entregas: 'Ferralla 5,5 t', problemas: 'Lluvia: sin trabajos en cubierta ni fachada.', by: 'Marcos Ferrer' },
  ];

  /* ───────── Reuniones, tareas y decisiones ───────── */
  A.reuniones = [
    { id: 'ACT-034', title: 'Reunión semanal de obra n.º 34', date: '2026-09-29', tipo: 'Obra', asistentes: ['Marcos Ferrer', 'Lucía Montané', 'Clara Vidal', 'Jorge Peris', 'Ramón Esteve', 'Paco Ribera'],
      puntos: ['Estado del forjado de cubierta y previsión de hormigonado', 'Rendimiento de la fachada P1 y refuerzo de equipo', 'Planos de taller de carpintería exterior', 'Fotografías previas al cierre de instalaciones'],
      acuerdos: [
        { t: 'Hormigonar los paños 3 y 4 de cubierta en una sola puesta', resp: 'Ramón Esteve', due: '2026-10-08', task: 'T-101' },
        { t: 'Incorporar un segundo equipo de fachada desde el 5 oct', resp: 'Paco Ribera', due: '2026-10-05', task: 'T-102' },
        { t: 'Revisar y devolver los planos de taller de carpintería', resp: 'Clara Vidal', due: '2026-10-09', task: null },
        { t: 'Subir las fotos de instalaciones de 1ºC y 1ºD antes de cerrar placa', resp: 'Marcos Ferrer', due: '2026-10-05', task: 'T-104' },
      ] },
    { id: 'ACT-033', title: 'Reunión con el promotor', date: '2026-09-24', tipo: 'Promotor', asistentes: ['Andrea Soler', 'Ignacio Bosch', 'Marcos Ferrer'],
      puntos: ['Certificación de agosto', 'Preinstalación de recarga de vehículo eléctrico', 'Calendario de visitas de compradores'],
      acuerdos: [{ t: 'Enviar valoración de la preinstalación de recarga (CAM-03)', resp: 'Andrea Soler', due: '2026-09-30', task: 'T-098' }, { t: 'Fijar visita de compradores para el 20 oct', resp: 'Ignacio Bosch', due: '2026-10-07', task: null }] },
    { id: 'ACT-032', title: 'Coordinación de seguridad y salud', date: '2026-09-22', tipo: 'Seguridad', asistentes: ['Laura Ibáñez', 'Marcos Ferrer', 'Recursos preventivos'],
      puntos: ['Protecciones colectivas en cubierta', 'Barandilla provisional de escalera P3'], acuerdos: [{ t: 'Revisar redes y barandillas antes del hormigonado de cubierta', resp: 'Marcos Ferrer', due: '2026-10-07', task: 'T-099' }] },
  ];
  A.tareas = [
    { id: 'T-101', t: 'Hormigonar los paños 3 y 4 de cubierta en una sola puesta', resp: 'Ramón Esteve', due: '2026-10-08', estado: 'curso', from: 'ACT-034', link: { t: 'act', id: 'A05', label: 'Forjado de cubierta' } },
    { id: 'T-102', t: 'Incorporar un segundo equipo de fachada', resp: 'Paco Ribera', due: '2026-10-05', estado: 'pendiente', from: 'ACT-034', link: { t: 'act', id: 'A08', label: 'Fachada P2 a P4' } },
    { id: 'T-104', t: 'Subir las fotos de instalaciones de 1ºC y 1ºD', resp: 'Marcos Ferrer', due: '2026-10-05', estado: 'pendiente', from: 'ACT-034', link: { t: 'viv', id: 'P1C', label: 'Vivienda 1ºC' } },
    { id: 'T-098', t: 'Enviar valoración de la preinstalación de recarga', resp: 'Andrea Soler', due: '2026-09-30', estado: 'hecha', from: 'ACT-033', link: { t: 'cambio', id: 'CAM-03', label: 'CAM-03' } },
    { id: 'T-099', t: 'Revisar redes y barandillas antes del hormigonado', resp: 'Marcos Ferrer', due: '2026-10-07', estado: 'curso', from: 'ACT-032', link: null },
    { id: 'T-105', t: 'Pedir pavimento laminado de P1', resp: 'Marcos Ferrer', due: '2026-10-08', estado: 'pendiente', from: null, link: { t: 'sup', id: 'M1', label: 'Pedido M1' } },
  ];
  A.decisiones = [
    { id: 'DEC-07', t: 'Elegir acabado de la carpintería exterior (gris antracita o bronce)', quien: 'Promotor', due: '2026-10-09', links: [{ t: 'plano', id: 'A-201', label: 'Plano A-201' }, { t: 'sup', id: 'M6', label: 'Pedido M6' }], estado: 'pendiente' },
    { id: 'DEC-06', t: 'Aceptar o rechazar la preinstalación de recarga de vehículo eléctrico', quien: 'Promotor', due: '2026-10-14', links: [{ t: 'cambio', id: 'CAM-03', label: 'CAM-03' }], estado: 'pendiente' },
    { id: 'DEC-05', t: 'Nueva posición del tabique de dormitorio 2 en viviendas A y D', quien: 'Dirección de obra', due: '2026-09-30', links: [{ t: 'plano', id: 'A-102', label: 'Plano A-102 rev. C' }, { t: 'cambio', id: 'CAM-04', label: 'CAM-04' }], estado: 'tomada', result: 'Aprobada en la revisión C del plano A-102' },
  ];

  /* ───────── Informes emitidos ───────── */
  A.informesEmitidos = [
    { id: 'INF-2026-08', tpl: 'mensual', title: 'Informe mensual · agosto 2026', to: 'Promotor', at: '2026-09-02', by: 'Andrea Soler', avance: 0.199, snapshot: null },
    { id: 'INF-2026-W38', tpl: 'semanal', title: 'Informe semanal · semana 38', to: 'Interno', at: '2026-09-21', by: 'Marcos Ferrer', avance: 0.214, snapshot: null },
  ];

  /* ───────── Entregas y posventa ───────── */
  A.compradores = A.vivs.map((v, i) => ({ viv: v.key, name: ['Compradora', 'Comprador'][i % 2] + ' ' + v.name, reservada: i % 5 !== 3, entrega: v.L < 2 ? '2027-06-14' : '2027-06-21' }));
  A.posventa = [
    { id: 'PV-031', obra: 'OB-2509', viv: '3ºB', t: 'Humedad en techo de baño', com: '2026-09-27', emp: 'Instalaciones Carraixet, S.L.', estado: 'asignada', garantia: '1 año · acabados', due: '2026-10-11' },
    { id: 'PV-030', obra: 'OB-2509', viv: '1ºA', t: 'Puerta de terraza roza en la guía', com: '2026-09-22', emp: 'Aluminios Puçol', estado: 'reparacion', garantia: '1 año · acabados', due: '2026-10-06' },
    { id: 'PV-028', obra: 'OB-2509', viv: 'Local', t: 'Fisura en solera del local', com: '2026-09-10', emp: 'Hormigones y Estructuras Turia, S.L.', estado: 'comunicada', garantia: '3 años · habitabilidad', due: '2026-10-10' },
    { id: 'PV-026', obra: 'OB-2509', viv: '4ºA', t: 'Grifo de cocina gotea', com: '2026-08-30', emp: 'Instalaciones Carraixet, S.L.', estado: 'resuelta', garantia: '1 año · acabados', due: '2026-09-13' },
    { id: 'PV-024', obra: 'OB-2509', viv: '2ºC', t: 'Mecanismo de persiana averiado', com: '2026-08-12', emp: 'Aluminios Puçol', estado: 'aceptada', garantia: '1 año · acabados', due: '2026-08-26' },
    { id: 'PV-022', obra: 'OB-2509', viv: '2ºB', t: 'Fisura en encuentro de tabique y techo', com: '2026-07-28', emp: 'Sistemas Secos Levante, S.L.', estado: 'asignada', garantia: '1 año · acabados', due: '2026-09-28' },
    { id: 'PV-019', obra: 'OB-2509', viv: '1ºB', t: 'Baja presión de agua caliente', com: '2026-07-02', emp: 'Instalaciones Carraixet, S.L.', estado: 'comunicada', garantia: '3 años · habitabilidad', due: '2026-07-16' },
  ];
  A.pvEstados = { comunicada: ['Comunicada', 'st-late'], asignada: ['Asignada', 'st-progress'], reparacion: ['En reparación', 'st-progress'], resuelta: ['Resuelta', 'st-review'], aceptada: ['Aceptada por el propietario', 'st-ok'] };

  /* ───────── Fases por vivienda ───────── */
  A.vivPhaseDefs = A.stageSets.tabique.map((s) => ({ key: s.key, name: s.name, src: 'tabique' })).concat([
    { key: 'pavimentos', name: 'Pavimentos y revestimientos' },
    { key: 'carpinteria', name: 'Carpintería interior' },
    { key: 'sanitarios', name: 'Sanitarios y equipamiento' },
    { key: 'cocina', name: 'Muebles de cocina' },
    { key: 'remates', name: 'Remates y limpieza' },
  ]);
  A.phaseConfig = A.vivPhaseDefs.map((p) => ({ key: p.key, on: true }));
  A.vivPhases = {};
  A.phaseMeta = {};
  A.vivs.forEach((v) => {
    A.vivPhases[v.key] = {};
    A.phaseMeta[v.key] = {};
    A.vivPhaseDefs.forEach((p) => {
      if (!p.src) A.vivPhases[v.key][p.key] = 'no_iniciado';
      A.phaseMeta[v.key][p.key] = { resp: '', obs: '', aceptado: false, photos: [] };
    });
  });
  const meta = (k, p, o) => Object.assign(A.phaseMeta[k][p], o);
  ['PBA', 'PBB', 'PBC', 'PBD', 'P1A', 'P1B', 'P1C', 'P1D'].forEach((k) => {
    meta(k, 'perfileria', { resp: 'Secos Levante', aceptado: true, by: 'Marcos Ferrer' });
    meta(k, 'primera', { resp: 'Secos Levante', aceptado: k.startsWith('PB') || k === 'P1A' || k === 'P1B', by: 'Marcos Ferrer' });
    meta(k, 'instalaciones', { resp: 'Inst. Carraixet', aceptado: k.startsWith('PB') || k === 'P1A' || k === 'P1B', by: 'Marcos Ferrer', obs: k === 'P1C' || k === 'P1D' ? 'Falta la foto previa al cierre' : 'Prueba de estanqueidad CL-027 apta' });
  });
  meta('P1B', 'cierre', { resp: 'Secos Levante', obs: 'Paño del distribuidor pendiente de terminar', photos: ['CAP-029'] });
  meta('PBC', 'encintado', { resp: 'Secos Levante', obs: 'Incidencia INC-021 abierta en el salón', photos: ['CAP-028'] });

  /* ───────── Usuarios, perfiles y permisos ───────── */
  A.roles = [
    { id: 'direccion', name: 'Dirección' },
    { id: 'jefe', name: 'Jefe de obra' },
    { id: 'admin', name: 'Administración' },
    { id: 'tecnico', name: 'Técnico de seguimiento' },
    { id: 'sub', name: 'Subcontrata' },
    { id: 'cliente', name: 'Cliente o promotor' },
  ];
  A.users = [
    { n: 'Andrea Soler', email: 'a.soler@edificalevante.example', role: 'direccion', emp: 'Edifica Levante', obras: 'Todas' },
    { n: 'Marcos Ferrer', email: 'm.ferrer@edificalevante.example', role: 'jefe', emp: 'Edifica Levante', obras: 'OB-2611, OB-2509' },
    { n: 'Lucía Montané', email: 'l.montane@edificalevante.example', role: 'tecnico', emp: 'Edifica Levante', obras: 'OB-2611, OB-2604, OB-2620' },
    { n: 'Rosa Llorens', email: 'r.llorens@edificalevante.example', role: 'admin', emp: 'Edifica Levante', obras: 'Todas' },
    { n: 'Raúl Navarro', email: 'r.navarro@secoslevante.example', role: 'sub', emp: 'Sistemas Secos Levante', obras: 'OB-2611', sub: 'S4' },
    { n: 'Ignacio Bosch', email: 'i.bosch@vegabaixa.example', role: 'cliente', emp: 'Promociones Vega Baixa', obras: 'OB-2611' },
  ];
  // Permisos por perfil y módulo: none · view · edit · approve
  const ALLV = { cartera: 'view', panel: 'view', modelo: 'view', interiores: 'view', capturas: 'view', diario: 'view', calidad: 'view', planificacion: 'view', suministros: 'view', subcontratas: 'view', presupuesto: 'view', certificaciones: 'view', economia: 'view', cambios: 'view', documentacion: 'view', reuniones: 'view', informes: 'view', entregas: 'view', datos: 'view', usuarios: 'none', registro: 'view' };
  const mk = (base, over) => Object.assign({}, base, over);
  A.perms = {
    direccion: mk(ALLV, { panel: 'approve', certificaciones: 'approve', economia: 'approve', cambios: 'approve', planificacion: 'approve', presupuesto: 'approve', usuarios: 'edit', documentacion: 'edit', informes: 'edit', subcontratas: 'edit', suministros: 'edit', reuniones: 'edit', datos: 'edit' }),
    jefe: mk(ALLV, { modelo: 'edit', interiores: 'edit', capturas: 'edit', diario: 'edit', calidad: 'edit', planificacion: 'edit', suministros: 'edit', subcontratas: 'edit', certificaciones: 'edit', cambios: 'edit', documentacion: 'edit', reuniones: 'edit', informes: 'edit', entregas: 'edit', datos: 'edit', panel: 'edit' }),
    admin: mk(ALLV, { modelo: 'none', interiores: 'none', capturas: 'none', diario: 'none', economia: 'edit', subcontratas: 'edit', documentacion: 'edit', suministros: 'edit', certificaciones: 'edit', informes: 'edit' }),
    tecnico: mk(ALLV, { modelo: 'edit', interiores: 'edit', capturas: 'edit', diario: 'edit', calidad: 'edit', documentacion: 'edit', reuniones: 'edit', economia: 'none', presupuesto: 'view' }),
    sub: { cartera: 'none', panel: 'view', modelo: 'view', interiores: 'edit', capturas: 'view', diario: 'none', calidad: 'edit', planificacion: 'view', suministros: 'none', subcontratas: 'view', presupuesto: 'none', certificaciones: 'view', economia: 'none', cambios: 'none', documentacion: 'edit', reuniones: 'view', informes: 'none', entregas: 'none', datos: 'none', usuarios: 'none', registro: 'none' },
    cliente: { cartera: 'none', panel: 'view', modelo: 'view', interiores: 'view', capturas: 'none', diario: 'none', calidad: 'none', planificacion: 'view', suministros: 'none', subcontratas: 'none', presupuesto: 'none', certificaciones: 'approve', economia: 'none', cambios: 'approve', documentacion: 'view', reuniones: 'none', informes: 'view', entregas: 'view', datos: 'none', usuarios: 'none', registro: 'none' },
  };

  /* ───────── Avisos: configuración por categoría ───────── */
  A.alertCats = [
    { id: 'pedidos', name: 'Pedidos y entregas', on: true, min: 'info' },
    { id: 'plazos', name: 'Retrasos de planificación', on: true, min: 'warn' },
    { id: 'docs', name: 'Documentación pendiente o caducada', on: true, min: 'info' },
    { id: 'incidencias', name: 'Incidencias fuera de plazo', on: true, min: 'info' },
    { id: 'vencimientos', name: 'Vencimientos de cobros y pagos', on: true, min: 'info' },
    { id: 'aprobaciones', name: 'Aprobaciones necesarias', on: true, min: 'info' },
    { id: 'capturas', name: 'Capturas pendientes de revisión', on: true, min: 'info' },
  ];

  /* ───────── Registro de cambios (auditoría) ───────── */
  A.audit = [
    { at: '2026-09-30T18:02', who: 'Cámara fija', mod: 'capturas', what: 'Nueva captura CAP-031 de cubierta' },
    { at: '2026-09-30T11:20', who: 'Lucía Montané', mod: 'capturas', what: 'Subió el recorrido 360° de la vivienda Bajo C' },
    { at: '2026-09-30T09:40', who: 'Rosa Llorens', mod: 'economia', what: 'Registró el pago parcial PAG-0931 de 13.000 € a Estructuras Turia' },
    { at: '2026-09-29T16:40', who: 'Andrea Soler', mod: 'suministros', what: 'Aprobó el pedido PED-0391 de placa para la planta 2ª' },
    { at: '2026-09-28T13:05', who: 'Marcos Ferrer', mod: 'interiores', what: 'Validó el encintado de Bajo A y Bajo B', before: 'En ejecución', after: 'Terminado' },
    { at: '2026-09-28T10:20', who: 'Andrea Soler', mod: 'planificacion', what: 'Cambió el fin previsto del forjado de cubierta', before: '30 sep', after: '8 oct' },
    { at: '2026-09-03T12:00', who: 'Andrea Soler', mod: 'certificaciones', what: 'Cerró la certificación n.º 7 (agosto)' },
  ];
})(window.ATL);
