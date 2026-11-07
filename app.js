/* ==========================================================================
   CAUCHOS KSM · LÓGICA DE APLICACIÓN, FILTROS ADAPTADOS, NEOPRENO & COTIZADOR
   ========================================================================== */

(function () {
  'use strict';

  const DATA = window.KSM_DATA || [];
  const LINES_META = window.KSM_LINES_META || [];
  const CATALOGS_HUB = window.KSM_CATALOGS_HUB || [];
  const WA_CHANNELS = window.KSM_WHATSAPP_CHANNELS || [];
  const NEO_REFS = window.KSM_NEO_REFS || [];
  const NEOTIER = window.KSM_NEOTIER || {};
  const CMAP = window.KSM_CMAP || {};
  const MIN_ORDER = window.KSM_MIN_ORDER || 30000;

  // Índice rápido por ID de producto
  const BY_ID = {};
  DATA.forEach(p => { BY_ID[p.i] = p; });

  // Mapa de páginas de Canva para Bola Lisa (RF3) por color (§9.4)
  const LISA_SPECIAL_PAGES = {
    'gris claro': 5,
    'beige claro': 8,
    'verde menta viejo': 25
  };

  // Sinónimos para búsqueda inteligente
  const SYNONYMS = {
    'futbol': ['equipos', 'balon', 'mundial', 'seleccion', 'nacional', 'millonarios', 'america', 'junior', 'madrid', 'barcelona'],
    'balon': ['balón', 'futbol', 'mundial'],
    'reloj': ['rolex'],
    'virgen': ['guadalupe', 'milagrosa', 'maria', 'religiosos'],
    'santo': ['san benito', 'judas tadeo', 'espiritu santo', 'san miguel', 'jesus', 'cristo'],
    'cruz': ['cruces', 'crucifijo', 'crucero'],
    'iniciales': ['letra', 'letras'],
    'aretes': ['areteria', 'candongas', 'candonga', 'topos', 'topo'],
    'piedras': ['cuarzo', 'amatista', 'citrino', 'howlita', 'labradorita', 'ojo de tigre', 'volcanica', 'murano', 'coral', 'nacar'],
    'osito': ['oso', 'tous'],
    'trebol': ['trébol', 'van cleef'],
    'perro': ['perrito', 'mascota', 'huella', 'huellitas', 'dog']
  };

  // Sugerencias contextuales por línea
  const LINE_SUGGESTIONS = {
    'Todos': ['Corona Rolex', 'San Benito', 'Van Cleef', 'Mundial', 'Candongas', 'Letras', 'Cuarzo', 'Balín #6'],
    'Dijes de Rodio': ['Colombia', 'Calavera', 'Corona', 'Familia', 'Real Madrid', 'Millonarios', 'Virgen Guadalupe', 'Ancla', 'Oso Tous', 'Dona Separadora'],
    'Línea Económica': ['San Benito', 'Corona', 'Ancla', 'Hello Kitty', 'Snoopy', 'Corazón', 'Arcoíris', 'Mariposa'],
    'Dijes de Acero': ['Placa', 'Signos Zodiacales', 'Línea $2.100', 'Cruz Armable', 'Combo', 'Letra', 'Gucci', 'Bitcoin'],
    'Aretería': ['Candonga dorada', 'Candonga plateada', 'Zircones', 'Mariposas', 'Búho', 'Tous', 'Aretes en acero'],
    'Dijes de Oro Laminado': ['Van Cleef', 'Tío Rico', 'Virgen Milagrosa', 'San Benito', 'Cadena', 'Pulsera', 'Tobillera', 'Topos', 'Separador'],
    'Pulseras de Expansión': ['Camuflado', 'Candy', 'Pimienta', 'Animal Print', 'Verde Menta', 'Colombia'],
    'Fimo y Piedras': ['Corazón', 'Letras', 'Perlas de vidrio', 'Cuarzo', 'Amatista', 'Howlita', 'Ojo de tigre', 'Murano'],
    'Hilos': ['Metalizado', 'Celular 0.8', 'Celular 1.0', 'Celular 1.5', 'Terlenka', 'Carrete'],
    'Balines Oro Laminado': ['Dorado', 'Rosado', 'Neopreno', 'Argolla', 'Paquete x 50', 'Paquete x 100'],
    'Balines de Rodio': ['Liso', 'Grabado', 'Rosado', 'Nº 8', 'Nº 6', 'Nº 4'],
    'Balines de Acero': ['Dorado', 'Plateado', 'Rosado', 'Nº 8', 'Nº 6', 'Nº 4']
  };

  // Estado reactivo de la aplicación
  const state = {
    activeLine: 'Todos',
    activeSub: 'Todas',
    sizeFilter: 'all',
    priceFilter: 'all',
    specialFilter: 'all',
    sortBy: 'catalog',
    hideSoldOut: false,
    viewMode: 'grid', // 'grid' | 'compact'
    query: '',
    cart: {},      // { [id]: qty }
    cnote: {},     // { [id]: string }
    neo: [],       // [ { id, r, rName, s, cn, cname, m, q, k, photoUrl } ]
    customer: {
      name: '',
      phone: '',
      city: '',
      idNum: '',
      address: ''
    },
    neoForm: {
      ref: 'RF3',
      size: 8,
      colorSearch: '',
      colorIdx: 0,
      customColor: '',
      metal: 'Dorado',
      qty: 100,
      dirty: false
    }
  };

  // Cargar borrador guardado en localStorage para no perder la cotización accidentalmente
  function loadPersistedState() {
    try {
      const saved = localStorage.getItem('ksm_quote_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cart && typeof parsed.cart === 'object') state.cart = parsed.cart;
        if (parsed.cnote && typeof parsed.cnote === 'object') state.cnote = parsed.cnote;
        if (Array.isArray(parsed.neo)) state.neo = parsed.neo;
        if (parsed.customer && typeof parsed.customer === 'object') {
          state.customer = Object.assign(state.customer, parsed.customer);
        }
      }
      const savedTheme = localStorage.getItem('ksm_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch (e) {
      // Ignorar errores de almacenamiento
    }
  }

  function savePersistedState() {
    try {
      localStorage.setItem('ksm_quote_v2', JSON.stringify({
        cart: state.cart,
        cnote: state.cnote,
        neo: state.neo,
        customer: state.customer
      }));
    } catch (e) {}
  }

  // Utilidades de texto y formato COP
  function norm(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function fmtCOP(num) {
    if (num === null || num === undefined || isNaN(num)) return '$0';
    return '$' + Math.round(num).toLocaleString('es-CO');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 220ms ease';
      setTimeout(() => t.remove(), 240);
    }, 2600);
  }

  // ==========================================================================
  // REGLAS DE NEGOCIO: PRECIOS ESCALONADOS POR VOLUMEN Y DOCENAS (§8 y §16)
  // ==========================================================================
  function getEffectiveUnitPrice(prod, qty) {
    if (!prod || !prod.k) return 0;
    const q = Number(qty) || 0;
    const note = prod.o || '';
    // ID 0: "1 a 999 und $3.000 · 1.000+ und $2.800"
    if (prod.i === 0 && q >= 1000) return 2800;
    // ID 1: "1 a 99 und $4.500 · 100+ und $4.000"
    if (prod.i === 1 && q >= 100) return 4000;
    // ID 227: "100+ und a $3.000"
    if (prod.i === 227 && q >= 100) return 3000;
    // Parse genérico por si algún otro producto tiene "100+ und $X" o "1.000+ und $X"
    if (q >= 1000 && /1\.000\+\s*und\s*a?\s*\$([\d.]+)/i.test(note)) {
      const m = note.match(/1\.000\+\s*und\s*a?\s*\$([\d.]+)/i);
      if (m) return parseInt(m[1].replace(/\./g, ''), 10);
    }
    if (q >= 100 && /100\+\s*und\s*a?\s*\$([\d.]+)/i.test(note)) {
      const m = note.match(/100\+\s*und\s*a?\s*\$([\d.]+)/i);
      if (m) return parseInt(m[1].replace(/\./g, ''), 10);
    }
    return prod.k;
  }

  // Cálculo del enlace exacto a Canva por producto
  function getProductCanvaUrl(prod) {
    if (!prod || !prod.u || !prod.p) return '';
    return `${prod.u}#${prod.p}`;
  }

  // Determina si un producto usa chips de color de metal
  function productHasMetalChips(prod) {
    const metalLines = ['Dijes de Rodio', 'Línea Económica', 'Dijes de Acero', 'Aretería'];
    if (!metalLines.includes(prod.l)) return false;
    if (prod.s === 'Letras') return false;
    return true;
  }

  // Determina si un producto es de la subsección Letras
  function productIsLetters(prod) {
    return prod.s === 'Letras';
  }

  // Determina si un producto requiere nota de color libre (Hilos / Neopreno con oro laminado)
  function productNeedsColorNote(prod) {
    return prod.l === 'Hilos' || prod.s === 'Neopreno con oro laminado';
  }

  // Extrae qué letras están agotadas o disponibles según `prod.o`
  function getLettersAvailability(prod) {
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const note = prod.o || '';
    const disabled = new Set();

    // Caso "Agotadas: A, I, K, Q" o "agotadas: I, J, S, V"
    const mAgot = note.match(/agotadas:\s*([A-Z,\s]+)/i);
    if (mAgot) {
      const list = mAgot[1].split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
      list.forEach(l => { if (l.length === 1) disabled.add(l); });
    }
    if (/desde W tampoco aparecen/i.test(note)) {
      ['W', 'X', 'Y', 'Z'].forEach(l => disabled.add(l));
    }

    // Caso "disponibles: F, G, J..."
    const mDisp = note.match(/disponibles:\s*([A-Z,\s]+)/i);
    if (mDisp) {
      const avail = new Set(mDisp[1].split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean));
      allLetters.forEach(l => {
        if (!avail.has(l)) disabled.add(l);
      });
    }

    // Caso ID 226: "Doradas: B C E F J K R P S T Y · Plateadas: D E P T · Rosadas: K Y"
    if (prod.i === 226) {
      const avail226 = new Set(['B','C','D','E','F','J','K','P','R','S','T','Y']);
      allLetters.forEach(l => {
        if (!avail226.has(l)) disabled.add(l);
      });
    }

    return { allLetters, disabled };
  }

  // Cuenta la cantidad total codificada en una nota de letras o colores (ej. "A2, B1, M3" -> 6, "2 rojo, 3 azul" -> 5)
  function parseNoteTotalQty(noteStr) {
    if (!noteStr) return 0;
    const matches = String(noteStr).match(/\d+/g);
    if (!matches) return 0;
    return matches.reduce((acc, n) => acc + parseInt(n, 10), 0);
  }

  // ==========================================================================
  // FILTROS ADAPTADOS POR LÍNEA Y SUBSECCIÓN
  // ==========================================================================
  function getDynamicSizeOptionsForLine(line) {
    if (line === 'Aretería') {
      return [
        { value: 'all', label: 'Todos los tamaños' },
        { value: 'cand-peq', label: 'Candongas 1 a 3.5 cm' },
        { value: 'cand-gra', label: 'Candongas 4 a 8 cm' },
        { value: 'figuras', label: 'Con figuras / zircones' },
        { value: 'aretes-acero', label: 'Aretes en acero' }
      ];
    }
    if (line === 'Dijes de Oro Laminado') {
      return [
        { value: 'all', label: 'Todas las categorías' },
        { value: 'dije-peq', label: 'Dijes pequeños (≤12 mm)' },
        { value: 'dije-med', label: 'Dijes medianos/grandes (>12 mm)' },
        { value: 'cadenas', label: 'Cadenas y Collares (40–65 cm)' },
        { value: 'pulseras', label: 'Pulseras y Tobilleras (18–25 cm)' },
        { value: 'topos-cand', label: 'Topos y Candongas' }
      ];
    }
    if (line === 'Fimo y Piedras') {
      return [
        { value: 'all', label: 'Todas las presentaciones' },
        { value: 'fimo-und', label: 'Por unidad ($250 c/u)' },
        { value: 'fimo-copa', label: 'Por copa (20 g)' },
        { value: 'sarta', label: 'Por sarta (Piedras / Murano / Perlas)' },
        { value: 'cal-4', label: 'Calibre #3 y #4' },
        { value: 'cal-6', label: 'Calibre #6' },
        { value: 'cal-8', label: 'Calibre #8 y 10 mm' }
      ];
    }
    if (line === 'Hilos') {
      return [
        { value: 'all', label: 'Todos los calibres' },
        { value: 'hilo-08', label: '0.8 mm / #8' },
        { value: 'hilo-10', label: '1.0 mm a 1.2 mm' },
        { value: 'hilo-15', label: '1.5 mm a 2.5 mm' },
        { value: 'carretes', label: 'Carretes (10 m – 20 m)' }
      ];
    }
    if (line.startsWith('Balines')) {
      return [
        { value: 'all', label: 'Todos los calibres' },
        { value: 'bal-3', label: 'Nº 3 (3 mm)' },
        { value: 'bal-4', label: 'Nº 4 (4 mm)' },
        { value: 'bal-5', label: 'Nº 5 (5 mm)' },
        { value: 'bal-6', label: 'Nº 6 (6 mm)' },
        { value: 'bal-78', label: 'Nº 7 y Nº 8 (7–8 mm)' },
        { value: 'paquetes', label: 'Paquetes x50 y x100' }
      ];
    }
    // Por defecto (Todos, Dijes de Rodio, Línea Económica, Dijes de Acero, Pulseras Expansión)
    return [
      { value: 'all', label: 'Todas las medidas' },
      { value: 'peq', label: 'Pequeños (≤ 12 mm)' },
      { value: 'med', label: 'Medianos (13 – 20 mm)' },
      { value: 'gra', label: 'Grandes (> 20 mm)' },
      { value: 'insumos', label: 'Argollas, Separadores e Insumos' }
    ];
  }

  function matchesSizeFilter(prod, filterVal) {
    if (!filterVal || filterVal === 'all') return true;
    const t = norm(prod.t);
    const s = norm(prod.s);
    const n = norm(prod.n);
    const o = norm(prod.o);

    // Extraer primer número en mm si existe
    const mmMatch = prod.t.match(/(\d+(?:,\d+)?)\s*(?:x\s*(\d+(?:,\d+)?))?\s*mm/i);
    let maxMm = 0;
    if (mmMatch) {
      const n1 = parseFloat(mmMatch[1].replace(',', '.'));
      const n2 = mmMatch[2] ? parseFloat(mmMatch[2].replace(',', '.')) : n1;
      maxMm = Math.max(n1, n2);
    }

    switch (filterVal) {
      case 'peq': return maxMm > 0 && maxMm <= 12.5;
      case 'med': return maxMm > 12.5 && maxMm <= 20.5;
      case 'gra': return maxMm > 20.5;
      case 'insumos': return s.includes('separador') || s.includes('insumo') || n.includes('argolla') || n.includes('tapanudo') || n.includes('escalachin');
      case 'cand-peq': return t.includes('cm') && parseFloat(prod.t.replace(',', '.')) <= 3.5;
      case 'cand-gra': return t.includes('cm') && parseFloat(prod.t.replace(',', '.')) >= 4;
      case 'figuras': return s.includes('figura') || s.includes('zircones');
      case 'aretes-acero': return s.includes('aretes en acero');
      case 'dije-peq': return maxMm > 0 && maxMm <= 12.5 && !s.includes('cadena') && !s.includes('pulsera') && !s.includes('topos');
      case 'dije-med': return maxMm > 12.5 && !s.includes('cadena') && !s.includes('pulsera') && !s.includes('topos');
      case 'cadenas': return s.includes('cadenas');
      case 'pulseras': return s.includes('pulseras');
      case 'topos-cand': return s.includes('topos');
      case 'fimo-und': return o.includes('por unidad');
      case 'fimo-copa': return o.includes('por copa');
      case 'sarta': return o.includes('por sarta');
      case 'cal-4': return n.includes('#3') || n.includes('#4') || t.includes('#4') || t.includes('4 mm');
      case 'cal-6': return n.includes('#6') || t.includes('#6') || t.includes('6 mm');
      case 'cal-8': return n.includes('#8') || t.includes('#8') || t.includes('8 mm') || t.includes('10 mm');
      case 'hilo-08': return n.includes('0.8') || n.includes('#8');
      case 'hilo-10': return n.includes('1.0') || n.includes('1.2');
      case 'hilo-15': return n.includes('1.5') || n.includes('2.5');
      case 'carretes': return s.includes('carretes');
      case 'bal-3': return n.includes('nº 3') || t.includes('#3') || t === '3 mm';
      case 'bal-4': return n.includes('nº 4') || t.includes('#4') || t === '4 mm';
      case 'bal-5': return n.includes('nº 5') || t.includes('#5') || t === '5 mm';
      case 'bal-6': return n.includes('nº 6') || t.includes('#6') || t === '6 mm';
      case 'bal-78': return n.includes('nº 7') || n.includes('nº 8') || t.includes('#8') || t === '7 mm' || t === '8 mm';
      case 'paquetes': return s.includes('paquetes');
      default: return true;
    }
  }

  function matchesPriceFilter(prod, priceVal) {
    if (!priceVal || priceVal === 'all') return true;
    const k = prod.k || 0;
    if (priceVal === 'up-to-3k') return k > 0 && k <= 3000;
    if (priceVal === '3k-to-8k') return k > 3000 && k <= 8000;
    if (priceVal === '8k-to-35k') return k > 8000 && k <= 35000;
    if (priceVal === 'over-35k') return k > 35000;
    return true;
  }

  function matchesSpecialFilter(prod, specVal) {
    if (!specVal || specVal === 'all') return true;
    if (specVal === 'in-cart') return (state.cart[prod.i] || 0) > 0;
    if (specVal === 'wholesale') return /\d+\+\s*und|12\s*und|paquete/i.test(prod.o || '') || prod.s.includes('Paquetes');
    if (specVal === 'customizable') return productIsLetters(prod) || productNeedsColorNote(prod) || productHasMetalChips(prod);
    return true;
  }

  function matchesSearchQuery(prod, qRaw) {
    if (!qRaw) return true;
    const q = norm(qRaw);
    if (!q) return true;

    // Búsqueda por ID exacto (#142 o id 142)
    if (/^#?\d+$/.test(q)) {
      const numId = parseInt(q.replace('#', ''), 10);
      if (prod.i === numId) return true;
    }

    const haystack = norm(`${prod.n} ${prod.s} ${prod.l} ${prod.t} ${prod.o} #${prod.i}`);
    const words = q.split(/\s+/).filter(Boolean);

    return words.every(w => {
      if (haystack.includes(w)) return true;
      // Revisar sinónimos
      const syns = SYNONYMS[w];
      if (syns && syns.some(syn => haystack.includes(norm(syn)))) return true;
      return false;
    });
  }

  function getFilteredProducts() {
    let list = DATA.filter(prod => {
      if (state.activeLine !== 'Todos' && prod.l !== state.activeLine) return false;
      if (state.activeSub !== 'Todas' && prod.s !== state.activeSub) return false;
      if (state.hideSoldOut && (prod.v === 'AGOTADO' || prod.k === 0)) return false;
      if (!matchesSizeFilter(prod, state.sizeFilter)) return false;
      if (!matchesPriceFilter(prod, state.priceFilter)) return false;
      if (!matchesSpecialFilter(prod, state.specialFilter)) return false;
      if (!matchesSearchQuery(prod, state.query)) return false;
      return true;
    });

    if (state.sortBy === 'price-asc') {
      list = list.slice().sort((a, b) => {
        if (a.k === 0 && b.k > 0) return 1;
        if (b.k === 0 && a.k > 0) return -1;
        return a.k - b.k;
      });
    } else if (state.sortBy === 'price-desc') {
      list = list.slice().sort((a, b) => b.k - a.k);
    } else if (state.sortBy === 'name-asc') {
      list = list.slice().sort((a, b) => a.n.localeCompare(b.n, 'es'));
    }
    return list;
  }

  // ==========================================================================
  // ICONOS REPRESENTATIVOS POR LÍNEA Y MINIATURAS SVG CON PALETA DEL .MD
  // ==========================================================================
  const LINE_ICONS = {
    'Dijes de Rodio': '👑',
    'Línea Económica': '✨',
    'Dijes de Acero': '🛡️',
    'Aretería': '🌸',
    'Dijes de Oro Laminado': '💛',
    'Pulseras de Expansión': '📿',
    'Fimo y Piedras': '💎',
    'Hilos': '🧵',
    'Balines Oro Laminado': '🟡',
    'Balines de Rodio': '⚪',
    'Balines de Acero': '⚙️'
  };

  let categoriesShowcaseHiddenByUser = false;

  function getProductSvgThumb(prod) {
    const l = prod.l;
    const s = norm(prod.s);
    const n = norm(prod.n);

    // Colores fieles a Documentacion_Catalogo_KSM.md (§4.2)
    let stroke = '#2F4A55'; // --teal
    let fill = '#F3E7C9';   // --goldsoft
    if (l.includes('Oro Laminado')) {
      stroke = '#9A7220';   // --gold
      fill = '#F3E7C9';
    } else if (l.includes('Aretería')) {
      stroke = '#C8691C';   // --cat
      fill = '#FDF1E6';
    }

    // Geometría según tipo de pieza
    if (n.includes('corona')) {
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18M4 15l-1-9 5 4 4-6 4 6 5-4-1 9H4z"/></svg>`;
    }
    if (n.includes('corazon') || n.includes('corazón') || s.includes('corazones')) {
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.7"><path d="M12 20.5s-7.5-4.6-9.3-9A5.3 5.3 0 0 1 12 6a5.3 5.3 0 0 1 9.3 5.5c-1.8 4.4-9.3 9-9.3 9z"/></svg>`;
    }
    if (n.includes('cruz') || s.includes('cruces') || s.includes('religiosos')) {
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v18M7 8h10"/></svg>`;
    }
    if (l === 'Aretería' || n.includes('candonga') || n.includes('topo')) {
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2"><circle cx="12" cy="13" r="7" fill="${fill}" fill-opacity="0.55"/><path d="M12 3v3"/></svg>`;
    }
    if (s.includes('cadenas')) {
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8"><rect x="4" y="8" width="9" height="6" rx="3"/><rect x="11" y="10" width="9" height="6" rx="3"/></svg>`;
    }
    if (l.startsWith('Balines') || n.includes('balín') || n.includes('balin') || n.includes('bola')) {
      const gradColor = prod.f === 'ros' || n.includes('rosado') ? '#E8A598' : (l.includes('Oro') || n.includes('dorado') ? '#E2BC63' : '#B8C4C8');
      return `<svg width="30" height="30" viewBox="0 0 32 32"><defs><radialGradient id="g_${prod.i}" cx="35%" cy="32%" r="65%"><stop offset="0%" stop-color="#fff"/><stop offset="45%" stop-color="${gradColor}"/><stop offset="100%" stop-color="${stroke}"/></radialGradient></defs><circle cx="16" cy="16" r="10" fill="url(#g_${prod.i})" stroke="${stroke}" stroke-width="1"/></svg>`;
    }
    if (l === 'Hilos') {
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.7"><rect x="6" y="4" width="12" height="4" rx="1"/><rect x="6" y="16" width="12" height="4" rx="1"/><path d="M8 8v8M12 8v8M16 8v8"/></svg>`;
    }
    if (l === 'Fimo y Piedras') {
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.7"><circle cx="8" cy="12" r="3.5"/><circle cx="16" cy="12" r="3.5"/><circle cx="12" cy="7" r="3.5"/><circle cx="12" cy="17" r="3.5"/></svg>`;
    }
    if (s.includes('letras')) {
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 16l3-8 3 8M10 14h4"/></svg>`;
    }
    // Dije medallón por defecto
    return `<svg width="28" height="28" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.7"><circle cx="12" cy="4" r="2"/><polygon points="12,7 19,13 12,21 5,13"/></svg>`;
  }

  // ==========================================================================
  // TARJETAS VISUALES DE LAS 11 CATEGORÍAS AL INICIO (#categoriesBentoGrid)
  // ==========================================================================
  function renderCategoriesBentoGrid() {
    const grid = document.getElementById('categoriesBentoGrid');
    const section = document.getElementById('categoriesShowcaseSection');
    if (!grid || !section) return;

    // Mostrar las tarjetas de categoría solo cuando estamos en "Todos", sin búsqueda activa y sin filtro especial
    const shouldShowSection = state.activeLine === 'Todos' &&
      !state.query.trim() &&
      state.specialFilter === 'all';

    section.style.display = shouldShowSection ? 'block' : 'none';
    grid.style.display = categoriesShowcaseHiddenByUser ? 'none' : 'grid';

    if (grid.dataset.rendered === '1') return;

    let html = '';
    LINES_META.forEach(lm => {
      const prods = DATA.filter(p => p.l === lm.name);
      const count = prods.length;
      const icon = LINE_ICONS[lm.name] || '💍';
      html += `
        <div class="cat-bento-card" data-select-line="${escapeHtml(lm.name)}" role="button" tabindex="0">
          <div class="cat-bento-top">
            <div class="cat-bento-icon" aria-hidden="true">${icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                <span class="cat-bento-name">${escapeHtml(lm.name)}</span>
                <span class="min-order-pill num">${count} ref.</span>
              </div>
              <p class="cat-bento-desc">${escapeHtml(lm.desc)}</p>
            </div>
          </div>
          <div class="cat-bento-footer">
            <span class="cat-bento-enter">Explorar colección →</span>
            ${lm.canvaUrl ? `
              <a href="${escapeHtml(lm.canvaUrl)}" target="_blank" rel="noopener" class="ver-canva-btn bento-canva-link" title="Abrir catálogo con fotos en Canva">
                📷 Fotos Canva
              </a>
            ` : `<span class="meta-badge">${escapeHtml(lm.badge)}</span>`}
          </div>
        </div>
      `;
    });

    // Tarjeta 12 Destacada: Estudio de Bolas de Neopreno
    html += `
      <div class="cat-bento-card neopreno-highlight" data-open-neopreno="1" role="button" tabindex="0">
        <div class="cat-bento-top">
          <div class="cat-bento-icon" aria-hidden="true">🟠</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
              <span class="cat-bento-name">Bolas de Neopreno</span>
              <span class="min-order-pill num">786 colores</span>
            </div>
            <p class="cat-bento-desc">Configurador oficial RF2 a RF18 por docena (12+), cien (100+) y mil (1.000+).</p>
          </div>
        </div>
        <div class="cat-bento-footer">
          <span class="cat-bento-enter" style="color:var(--cat);">Abrir configurador →</span>
          <a href="https://www.canva.com/design/DAGp_Y2KeZE/5-ToqWvRMYasDw8iwu6TIw/view?utlId=h0899514f3a" target="_blank" rel="noopener" class="ver-canva-btn bento-canva-link">
            📷 Fotos Canva
          </a>
        </div>
      </div>
    `;

    grid.innerHTML = html;
    grid.dataset.rendered = '1';

    // Evitar que clic en "📷 Fotos Canva" dispare el filtro de la tarjeta
    grid.querySelectorAll('.bento-canva-link').forEach(link => {
      link.addEventListener('click', e => e.stopPropagation());
    });

    grid.querySelectorAll('[data-select-line]').forEach(card => {
      const activate = () => {
        const lineName = card.getAttribute('data-select-line');
        state.activeLine = lineName;
        state.activeSub = 'Todas';
        state.sizeFilter = 'all';
        renderAllCatalogControls();
        renderProductCatalog();
        window.scrollTo({ top: 180, behavior: 'smooth' });
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });

    const neoCard = grid.querySelector('[data-open-neopreno]');
    if (neoCard) {
      neoCard.addEventListener('click', () => switchWorkspaceTab('neopreno'));
    }
  }

  // ==========================================================================
  // RENDERIZADO DE LA BARRA DE FILTROS MINIMALISTA PROGRESIVA Y PRODUCTOS
  // ==========================================================================
  function renderLinesRibbon() {
    const ribbon = document.getElementById('linesRibbon');
    if (!ribbon) return;

    const totalCount = DATA.length;
    let html = `
      <button type="button" class="line-chip" aria-pressed="${state.activeLine === 'Todos'}" data-line="Todos">
        <span>🏠 Todas las líneas</span>
        <span class="line-chip-count">${totalCount}</span>
      </button>
    `;

    LINES_META.forEach(lm => {
      const count = DATA.filter(p => p.l === lm.name).length;
      const isPressed = state.activeLine === lm.name;
      const icon = LINE_ICONS[lm.name] || '';
      html += `
        <button type="button" class="line-chip" aria-pressed="${isPressed}" data-line="${escapeHtml(lm.name)}">
          <span>${icon} ${escapeHtml(lm.short)}</span>
          <span class="line-chip-count">${count}</span>
        </button>
      `;
    });

    ribbon.innerHTML = html;

    ribbon.querySelectorAll('.line-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedLine = btn.getAttribute('data-line');
        state.activeLine = selectedLine;
        state.activeSub = 'Todas';
        state.sizeFilter = 'all';
        renderAllCatalogControls();
        renderProductCatalog();
      });
    });
  }

  function updateExtraFiltersBadge() {
    const badge = document.getElementById('extraFiltersBadge');
    const toggleBtn = document.getElementById('toggleExtraFiltersBtn');
    const quickCartBtn = document.getElementById('quickCartFilterBtn');

    let count = 0;
    if (state.sizeFilter !== 'all') count++;
    if (state.priceFilter !== 'all') count++;
    if (state.specialFilter !== 'all' && state.specialFilter !== 'in-cart') count++;
    if (state.sortBy !== 'catalog') count++;
    if (state.hideSoldOut) count++;

    if (badge) {
      badge.textContent = String(count);
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    if (toggleBtn) {
      const collapse = document.getElementById('extraFiltersCollapse');
      const isOpen = collapse && collapse.classList.contains('open');
      toggleBtn.classList.toggle('active', Boolean(isOpen || count > 0));
    }
    if (quickCartBtn) {
      quickCartBtn.classList.toggle('active', state.specialFilter === 'in-cart');
    }
  }

  function renderAdaptedFilters() {
    const progressiveSubBar = document.getElementById('progressiveSubBar');
    const subScroll = document.getElementById('subPillsScroll');
    const sizeSelect = document.getElementById('sizeFilterSelect');
    const lineBanner = document.getElementById('lineContextBanner');

    // 1. Subcategorías PROGRESIVAS: Solo visibles cuando el usuario selecciona una Línea específica
    if (progressiveSubBar) {
      const showSubBar = state.activeLine !== 'Todos';
      progressiveSubBar.classList.toggle('visible', showSubBar);
    }

    if (subScroll && state.activeLine !== 'Todos') {
      const baseProds = DATA.filter(p => p.l === state.activeLine);

      const subCounts = {};
      const subOrder = [];
      baseProds.forEach(p => {
        if (!subCounts[p.s]) {
          subCounts[p.s] = 0;
          subOrder.push(p.s);
        }
        subCounts[p.s]++;
      });

      let subHtml = `
        <button type="button" class="sub-pill ${state.activeSub === 'Todas' ? 'active' : ''}" data-sub="Todas">
          Todas (${baseProds.length})
        </button>
      `;
      subOrder.forEach(subName => {
        const activeCls = state.activeSub === subName ? 'active' : '';
        subHtml += `
          <button type="button" class="sub-pill ${activeCls}" data-sub="${escapeHtml(subName)}">
            ${escapeHtml(subName)} (${subCounts[subName]})
          </button>
        `;
      });
      subScroll.innerHTML = subHtml;

      subScroll.querySelectorAll('.sub-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          state.activeSub = btn.getAttribute('data-sub');
          renderAdaptedFilters();
          renderProductCatalog();
        });
      });
    }

    // 2. Opciones de Tamaño / Calibre adaptadas a la línea activa
    if (sizeSelect) {
      const opts = getDynamicSizeOptionsForLine(state.activeLine);
      sizeSelect.innerHTML = opts.map(o =>
        `<option value="${o.value}" ${state.sizeFilter === o.value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`
      ).join('');
    }

    // 3. Banner contextual de la línea activa con la paleta oficial KSM
    if (lineBanner) {
      if (state.activeLine === 'Todos') {
        lineBanner.style.display = 'none';
      } else {
        const meta = LINES_META.find(m => m.name === state.activeLine);
        if (meta) {
          const icon = LINE_ICONS[meta.name] || '💍';
          lineBanner.style.display = 'flex';
          lineBanner.innerHTML = `
            <div class="line-context-info">
              <h2>
                <span>${icon}</span>
                <span>${escapeHtml(meta.name)}</span>
                <span class="min-order-pill">${escapeHtml(meta.badge)}</span>
              </h2>
              <p>${escapeHtml(meta.desc)}</p>
              ${meta.note ? `<div class="line-context-note">ℹ️ ${escapeHtml(meta.note)}</div>` : ''}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${meta.canvaUrl ? `
                <a href="${escapeHtml(meta.canvaUrl)}" target="_blank" rel="noopener" class="btn cat">
                  📷 Abrir Catálogo Canva de ${escapeHtml(meta.short)}
                </a>
              ` : ''}
              <button type="button" class="btn outline" id="resetLineBtn">← Volver a las 11 Categorías</button>
            </div>
          `;
          const resetBtn = document.getElementById('resetLineBtn');
          if (resetBtn) {
            resetBtn.addEventListener('click', () => {
              state.activeLine = 'Todos';
              state.activeSub = 'Todas';
              state.sizeFilter = 'all';
              renderAllCatalogControls();
              renderProductCatalog();
            });
          }
        }
      }
    }

    renderCategoriesBentoGrid();
    updateExtraFiltersBadge();
  }

  function renderAllCatalogControls() {
    renderLinesRibbon();
    renderAdaptedFilters();
  }

  // Renderizado del catálogo de productos
  function renderProductCatalog() {
    const container = document.getElementById('catalogListContainer');
    const countLabel = document.getElementById('resultsCountLabel');
    const clearFiltersBtn = document.getElementById('clearAllFiltersBtn');
    const quickCartCount = document.getElementById('quickCartFilterCount');
    if (!container) return;

    const filtered = getFilteredProducts();
    const inCartCount = Object.values(state.cart).filter(q => q > 0).length;

    if (quickCartCount) {
      quickCartCount.textContent = `(${inCartCount})`;
    }

    // Actualizar opción "En mi cotización"
    const specSelect = document.getElementById('specialFilterSelect');
    if (specSelect) {
      const optCart = specSelect.querySelector('option[value="in-cart"]');
      if (optCart) optCart.textContent = `En mi cotización (${inCartCount})`;
    }

    const hasActiveFilters = state.activeLine !== 'Todos' ||
      state.activeSub !== 'Todas' ||
      state.sizeFilter !== 'all' ||
      state.priceFilter !== 'all' ||
      state.specialFilter !== 'all' ||
      state.sortBy !== 'catalog' ||
      state.hideSoldOut ||
      state.query.trim() !== '';

    if (clearFiltersBtn) {
      clearFiltersBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
    }
    renderCategoriesBentoGrid();
    updateExtraFiltersBadge();

    if (countLabel) {
      countLabel.innerHTML = `<strong class="num" style="color:var(--fg);">${filtered.length}</strong> ref.`;
    }

    if (filtered.length === 0) {
      // Verificar si buscó términos de Joyería 18K (§13)
      const qNorm = norm(state.query);
      const is18kQuery = /oring|o-ring|correa|hublot|cartier|versace|canal|ranura|bulgari|mortadela|exclusiv|18\s*k|oro 18/i.test(qNorm);

      container.innerHTML = `
        <div class="hero-info-card" style="text-align:center;padding:38px 20px;margin:20px 0;">
          <div style="font-size:32px;margin-bottom:8px;">${is18kQuery ? '💎' : '🔍'}</div>
          <h3 style="font-family:var(--font-display);font-size:20px;margin-bottom:6px;">
            ${is18kQuery ? 'Producto del Catálogo Exclusivo Joyería Oro 18K' : 'No encontramos productos con esos filtros'}
          </h3>
          <p style="color:var(--muted);max-width:480px;margin:0 auto 16px;">
            ${is18kQuery
              ? 'Los separadores de neopreno (mín. 50 und), modelos exclusivos, orings, correas y mortadelas se atienden en nuestro catálogo de Joyería Oro 18K.'
              : 'Prueba buscando otra palabra clave, cambiando la categoría o limpiando los filtros activos.'}
          </p>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
            ${is18kQuery ? `
              <a href="https://claude.ai/artifact/FgquqwfhHdULUhq3DcdMPB" target="_blank" rel="noopener" class="btn primary">
                💎 Abrir Catálogo Joyería Oro 18K
              </a>
            ` : ''}
            <button type="button" class="btn outline" id="emptyResetBtn">Restablecer todos los filtros</button>
          </div>
        </div>
      `;
      const emptyReset = document.getElementById('emptyResetBtn');
      if (emptyReset) {
        emptyReset.addEventListener('click', resetAllFilters);
      }
      return;
    }

    // Si hay ordenamiento por precio o nombre, mostramos lista directa; si es 'catalog', agrupamos por Línea › Subsección
    if (state.sortBy !== 'catalog') {
      container.innerHTML = `
        <div class="products-grid ${state.viewMode === 'compact' ? 'compact-view' : ''}">
          ${filtered.map(prod => renderProductCardHtml(prod)).join('')}
        </div>
      `;
      bindProductCardEvents(container);
      return;
    }

    // Agrupar por Línea y luego por Subsección manteniendo el orden del catálogo
    const groupedByLine = [];
    const lineMap = {};

    filtered.forEach(prod => {
      if (!lineMap[prod.l]) {
        lineMap[prod.l] = { lineName: prod.l, subs: [], subMap: {} };
        groupedByLine.push(lineMap[prod.l]);
      }
      const lObj = lineMap[prod.l];
      if (!lObj.subMap[prod.s]) {
        lObj.subMap[prod.s] = { subName: prod.s, items: [] };
        lObj.subs.push(lObj.subMap[prod.s]);
      }
      lObj.subMap[prod.s].items.push(prod);
    });

    let html = '';
    groupedByLine.forEach(lGroup => {
      const meta = LINES_META.find(m => m.name === lGroup.lineName);
      const lineTotal = lGroup.subs.reduce((acc, s) => acc + s.items.length, 0);
      const icon = LINE_ICONS[lGroup.lineName] || '💍';

      html += `
        <section class="line-section" id="${meta ? meta.id : ''}">
          ${state.activeLine === 'Todos' ? `
            <div class="line-header">
              <h2 class="line-header-title">
                <span class="co-flag" aria-hidden="true"></span>
                <span>${icon} ${escapeHtml(lGroup.lineName)}</span>
                <span class="line-badge-colored">${lineTotal} ref.</span>
              </h2>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                ${meta && meta.canvaUrl ? `
                  <a href="${escapeHtml(meta.canvaUrl)}" target="_blank" rel="noopener" class="ver-canva-btn">
                    📷 Catálogo Canva · ${escapeHtml(meta.short)}
                  </a>
                ` : ''}
                <button type="button" class="scale-btn filter-this-line-btn" style="background:#F3E7C9;color:#5B4E1A;border-color:#DEC484;font-weight:700;" data-line="${escapeHtml(lGroup.lineName)}">
                  Filtrar esta categoría (${lGroup.subs.length} subsecciones) →
                </button>
              </div>
            </div>
          ` : ''}
          ${lGroup.subs.map(subGroup => `
            <div class="sub-section">
              <div class="sub-header" title="Toca para colapsar o expandir esta subsección">
                <h3><span>🔸</span> <span>${escapeHtml(subGroup.subName)}</span></h3>
                <div class="sub-header-right">
                  <span class="sub-header-count num">${subGroup.items.length} ${subGroup.items.length === 1 ? 'referencia' : 'referencias'}</span>
                  <span class="sub-collapse-icon">▾</span>
                </div>
              </div>
              <div class="products-grid ${state.viewMode === 'compact' ? 'compact-view' : ''}">
                ${subGroup.items.map(prod => renderProductCardHtml(prod)).join('')}
              </div>
            </div>
          `).join('')}
        </section>
      `;
    });

    container.innerHTML = html;
    bindProductCardEvents(container);
  }

  function renderProductCardHtml(prod) {
    const qty = state.cart[prod.i] || 0;
    const isSoldOut = prod.v === 'AGOTADO';
    const isConsult = prod.k === 0 && !isSoldOut;
    const effectiveUnit = getEffectiveUnitPrice(prod, qty || 1);
    const hasVolumeDiscountApplied = qty > 0 && effectiveUnit < prod.k;
    const canvaUrl = getProductCanvaUrl(prod);
    const noteVal = state.cnote[prod.i] || '';
    const isBalinDocena = prod.l === 'Balines de Rodio' || prod.l === 'Balines de Acero';

    // Mostrar personalizador si el producto está en el carrito (qty > 0) o si es Letras / Hilos / Neopreno con oro laminado
    const showCustomizer = !isSoldOut && !isConsult && (
      qty > 0 || productIsLetters(prod) || productNeedsColorNote(prod)
    );

    let customizerHtml = '';
    if (showCustomizer) {
      if (productIsLetters(prod)) {
        const { allLetters, disabled } = getLettersAvailability(prod);
        customizerHtml = `
          <div class="prod-customizer" data-customizer-for="${prod.i}">
            <div class="customizer-label">
              <span>🔤 Toca las letras para agregar o escribe (ej: A2, M1):</span>
              <span class="num" style="color:var(--wa);">${qty} und</span>
            </div>
            <div class="letters-grid">
              ${allLetters.map(letter => `
                <button type="button" class="letter-key" data-prod-id="${prod.i}" data-letter="${letter}" ${disabled.has(letter) ? 'disabled title="Letra agotada"' : ''}>
                  ${letter}
                </button>
              `).join('')}
            </div>
            <input type="text" class="custom-note-input prod-note-input" data-prod-id="${prod.i}"
              placeholder="Ej: A2, B1, M1 (la cantidad se actualiza sola)"
              value="${escapeHtml(noteVal)}" />
          </div>
        `;
      } else if (productNeedsColorNote(prod)) {
        const quickColors = ['Negro', 'Rojo', 'Blanco', 'Azul Rey', 'Dorado', 'Verde', 'Rosado', 'Tricolor'];
        customizerHtml = `
          <div class="prod-customizer" data-customizer-for="${prod.i}">
            <div class="customizer-label">
              <span>🎨 Especifica colores y cantidades:</span>
            </div>
            <div class="metal-chips-row">
              ${quickColors.map(col => `
                <button type="button" class="metal-chip quick-color-chip" data-prod-id="${prod.i}" data-col="${col}">
                  +1 ${col}
                </button>
              `).join('')}
            </div>
            <input type="text" class="custom-note-input prod-note-input" data-prod-id="${prod.i}"
              placeholder="Ej: 2 rojo, 3 azul, 1 negro"
              value="${escapeHtml(noteVal)}" />
          </div>
        `;
      } else if (productHasMetalChips(prod) && qty > 0) {
        customizerHtml = `
          <div class="prod-customizer" data-customizer-for="${prod.i}">
            <div class="customizer-label">
              <span>✨ Color de baño / metal (opcional):</span>
            </div>
            <div class="metal-chips-row">
              <button type="button" class="metal-chip metal-add-btn" data-prod-id="${prod.i}" data-metal="dorado">
                <span class="metal-dot dorado"></span> Dorado
              </button>
              <button type="button" class="metal-chip metal-add-btn" data-prod-id="${prod.i}" data-metal="plateado">
                <span class="metal-dot plateado"></span> Plateado
              </button>
              <button type="button" class="metal-chip metal-add-btn" data-prod-id="${prod.i}" data-metal="negro">
                <span class="metal-dot negro"></span> Negro
              </button>
              <button type="button" class="metal-chip metal-add-btn" data-prod-id="${prod.i}" data-metal="rosado">
                <span class="metal-dot rosado"></span> Rosado
              </button>
            </div>
            <input type="text" class="custom-note-input prod-note-input" data-prod-id="${prod.i}"
              placeholder="Ej: 2 dorado, 3 plateado (o nota especial)"
              value="${escapeHtml(noteVal)}" />
          </div>
        `;
      }
    }

    return `
      <article class="prod-card ${qty > 0 ? 'in-cart' : ''} ${isSoldOut || isConsult ? 'out-of-stock' : ''}" id="prod-card-${prod.i}" data-id="${prod.i}">
        <div class="prod-card-top">
          <div class="prod-visual-thumb open-ref-modal-btn" data-id="${prod.i}" title="Ver referencia, foto en Canva y escala en mm">
            <span class="prod-id-tag">#${prod.i}</span>
            ${getProductSvgThumb(prod)}
            ${prod.p ? `<span class="prod-page-mini">Pág. ${prod.p}</span>` : (prod.f ? `<span class="prod-page-mini">📷 Foto</span>` : '')}
          </div>
          <div class="prod-main-info">
            <div class="prod-title-row">
              <h4 class="prod-name">${escapeHtml(prod.n)}</h4>
              <div class="prod-price-box">
                ${isSoldOut
                  ? `<span class="meta-badge soldout-badge">AGOTADO</span>`
                  : (isConsult
                      ? `<span class="meta-badge">Consultar</span>`
                      : `<span class="prod-price ${hasVolumeDiscountApplied ? 'tier-active' : ''}">${fmtCOP(effectiveUnit)}</span>`
                    )
                }
                ${qty > 0 && prod.k > 0 ? `<div class="num" style="font-size:11.5px;font-weight:700;color:var(--wa);">✓ En pedido: ${fmtCOP(effectiveUnit * qty)}</div>` : ''}
              </div>
            </div>
            <div class="prod-meta-tags">
              ${prod.t ? `<span class="meta-badge">📏 ${escapeHtml(prod.t)}</span>` : ''}
              ${prod.o ? `<span class="meta-badge ${/\d+\+\s*und|12\s*und/i.test(prod.o) ? 'tier-badge' : ''}">💡 ${escapeHtml(prod.o)}</span>` : ''}
            </div>
          </div>
        </div>

        ${customizerHtml}

        <div class="prod-card-actions">
          <div class="ref-links-group">
            ${canvaUrl ? `
              <a href="${escapeHtml(canvaUrl)}" target="_blank" rel="noopener" class="ver-canva-btn" title="Abrir página ${prod.p} en el catálogo oficial de Canva">
                📷 Canva · Pág. ${prod.p}
              </a>
            ` : ''}
            ${prod.f ? `
              <button type="button" class="ver-canva-btn open-ref-modal-btn" data-id="${prod.i}">
                📷 Ver foto ref.
              </button>
            ` : ''}
            ${prod.t ? `
              <button type="button" class="scale-btn open-ref-modal-btn" data-id="${prod.i}" title="Ver tamaño a escala real y detalles">
                📐 Escala
              </button>
            ` : ''}
          </div>

          ${!isSoldOut && !isConsult ? `
            <div class="stepper-wrap">
              ${isBalinDocena ? `
                <button type="button" class="doz-btn add-dozen-btn" data-id="${prod.i}" title="Agregar 1 docena (+12 unidades)">
                  +12 Doc.
                </button>
              ` : ''}
              <div class="step">
                <button type="button" class="step-dec" data-id="${prod.i}" aria-label="Disminuir cantidad">−</button>
                <input type="number" min="0" max="99999" class="step-input" data-id="${prod.i}" value="${qty}" aria-label="Cantidad de ${escapeHtml(prod.n)}" />
                <button type="button" class="step-inc" data-id="${prod.i}" aria-label="Aumentar cantidad">+</button>
              </div>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  function bindProductCardEvents(container) {
    // Cabeceras de Subsección colapsables (.sub-header)
    container.querySelectorAll('.sub-header').forEach(hdr => {
      if (hdr.dataset.bound === '1') return;
      hdr.dataset.bound = '1';
      hdr.addEventListener('click', () => {
        const subSec = hdr.closest('.sub-section');
        if (subSec) subSec.classList.toggle('collapsed');
      });
    });

    // Botones "Ver solo esta línea"
    container.querySelectorAll('.filter-this-line-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeLine = btn.getAttribute('data-line');
        state.activeSub = 'Todas';
        state.sizeFilter = 'all';
        renderAllCatalogControls();
        renderProductCatalog();
        window.scrollTo({ top: 180, behavior: 'smooth' });
      });
    });

    // Stepper +
    container.querySelectorAll('.step-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        updateProductQty(id, (state.cart[id] || 0) + 1);
      });
    });

    // Stepper -
    container.querySelectorAll('.step-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        updateProductQty(id, Math.max(0, (state.cart[id] || 0) - 1));
      });
    });

    // Botón +12 Docena en Balines
    container.querySelectorAll('.add-dozen-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        updateProductQty(id, (state.cart[id] || 0) + 12);
        showToast('Agregada +1 docena (12 und) a tu cotización');
      });
    });

    // Input directo numérico
    container.querySelectorAll('.step-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const id = parseInt(inp.getAttribute('data-id'), 10);
        const val = Math.max(0, Math.min(99999, parseInt(inp.value, 10) || 0));
        updateProductQty(id, val);
      });
    });

    // Botones de teclado de letras A-Z
    container.querySelectorAll('.letter-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const letter = btn.getAttribute('data-letter');
        appendTokenToProductNote(id, letter, true);
      });
    });

    // Botones de color de baño/metal (Dorado, Plateado, Negro, Rosado)
    container.querySelectorAll('.metal-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const metal = btn.getAttribute('data-metal');
        appendMetalToProductNote(id, metal);
      });
    });

    // Botones de color rápido para Hilos / Neopreno con oro laminado
    container.querySelectorAll('.quick-color-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const col = btn.getAttribute('data-col');
        appendMetalToProductNote(id, col.toLowerCase());
      });
    });

    // Input de nota libre (letras / colores)
    container.querySelectorAll('.prod-note-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const id = parseInt(inp.getAttribute('data-id'), 10);
        const prod = BY_ID[id];
        const val = inp.value;
        state.cnote[id] = val;
        // Si es Letras o Hilos y escribió cantidades como "A2, B1" o "2 rojo, 3 azul", sincronizar cantidad
        if (prod && (productIsLetters(prod) || prod.l === 'Hilos')) {
          const counted = parseNoteTotalQty(val);
          if (counted > 0) {
            state.cart[id] = counted;
            const card = document.getElementById(`prod-card-${id}`);
            if (card) {
              const stepInp = card.querySelector('.step-input');
              if (stepInp) stepInp.value = counted;
              card.classList.add('in-cart');
            }
          }
        }
        savePersistedState();
        updateCartBar();
      });
    });

    // Abrir modal de referencia Canva & Escala Real
    container.querySelectorAll('.open-ref-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        openReferenceScaleModal(id);
      });
    });
  }

  function appendTokenToProductNote(id, letter) {
    const current = state.cnote[id] || '';
    const regex = new RegExp(`\\b${letter}(\\d+)\\b`, 'i');
    let nextNote = '';
    if (regex.test(current)) {
      nextNote = current.replace(regex, (_, num) => `${letter}${parseInt(num, 10) + 1}`);
    } else {
      nextNote = current.trim() ? `${current.trim()}, ${letter}1` : `${letter}1`;
    }
    state.cnote[id] = nextNote;
    const total = parseNoteTotalQty(nextNote);
    updateProductQty(id, Math.max(1, total));
  }

  function appendMetalToProductNote(id, metalWord) {
    const current = state.cnote[id] || '';
    const regex = new RegExp(`(\\d+)\\s*${metalWord}`, 'i');
    let nextNote = '';
    if (regex.test(current)) {
      nextNote = current.replace(regex, (_, num) => `${parseInt(num, 10) + 1} ${metalWord}`);
    } else {
      nextNote = current.trim() ? `${current.trim()}, 1 ${metalWord}` : `1 ${metalWord}`;
    }
    state.cnote[id] = nextNote;
    const totalFromNote = parseNoteTotalQty(nextNote);
    const currentQty = state.cart[id] || 0;
    updateProductQty(id, Math.max(currentQty, totalFromNote, 1));
  }

  function updateProductQty(id, newQty) {
    const prod = BY_ID[id];
    if (!prod) return;
    if (newQty <= 0) {
      delete state.cart[id];
    } else {
      state.cart[id] = newQty;
    }
    savePersistedState();

    // Re-renderizar solo la tarjeta afectada para respuesta instantánea
    const existingCard = document.getElementById(`prod-card-${id}`);
    if (existingCard) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderProductCardHtml(prod);
      const newCard = wrapper.firstElementChild;
      existingCard.replaceWith(newCard);
      bindProductCardEvents(newCard.parentElement);
    }
    updateCartBar();
  }

  function resetAllFilters() {
    state.activeLine = 'Todos';
    state.activeSub = 'Todas';
    state.sizeFilter = 'all';
    state.priceFilter = 'all';
    state.specialFilter = 'all';
    state.sortBy = 'catalog';
    state.hideSoldOut = false;
    state.query = '';

    const qInput = document.getElementById('q');
    if (qInput) qInput.value = '';
    const hideCheck = document.getElementById('hideSoldOutCheck');
    if (hideCheck) hideCheck.checked = false;
    const priceSel = document.getElementById('priceFilterSelect');
    if (priceSel) priceSel.value = 'all';
    const specSel = document.getElementById('specialFilterSelect');
    if (specSel) specSel.value = 'all';
    const sortSel = document.getElementById('sortSelect');
    if (sortSel) sortSel.value = 'catalog';

    updateClearSearchBtn();
    renderAllCatalogControls();
    renderProductCatalog();
  }

  function updateClearSearchBtn() {
    const btn = document.getElementById('clearSearchBtn');
    if (btn) {
      btn.classList.toggle('visible', Boolean(state.query && state.query.length > 0));
    }
  }

  // ==========================================================================
  // MODAL DE REFERENCIA CANVA, FOTOS DE ESTUDIO Y ESCALA REAL EN MILÍMETROS
  // ==========================================================================
  function renderStudioEmbeddedPhotoSvg(fKey, prod) {
    // Representación de alta precisión para las 4 referencias de Balines/Neopreno Oro Laminado (`oro`, `ros`, `nar`, `nap`)
    if (fKey === 'oro' || fKey === 'ros') {
      const isRos = fKey === 'ros';
      const c1 = isRos ? '#FFF0EC' : '#FFF9E2';
      const c2 = isRos ? '#E6A191' : '#E5C058';
      const c3 = isRos ? '#8E493A' : '#8A6214';
      const label = isRos ? 'Balín Oro Laminado Rosado 18K' : 'Balín Oro Laminado Dorado 18K';
      return `
        <div style="background:linear-gradient(135deg,#182226,#2A3B42);border-radius:12px;padding:18px;text-align:center;color:#F6EDD9;">
          <svg width="240" height="120" viewBox="0 0 240 120" style="max-width:100%;">
            <defs>
              <radialGradient id="balGradModal" cx="35%" cy="30%" r="68%">
                <stop offset="0%" stop-color="${c1}"/>
                <stop offset="45%" stop-color="${c2}"/>
                <stop offset="100%" stop-color="${c3}"/>
              </radialGradient>
            </defs>
            ${[3, 4, 5, 6, 7, 8].map((mm, idx) => {
              const r = 6 + mm * 1.9;
              const cx = 24 + idx * 38;
              return `
                <circle cx="${cx}" cy="58" r="${r}" fill="url(#balGradModal)" stroke="${c1}" stroke-width="0.6"/>
                <text x="${cx}" y="105" fill="#E2BC63" font-size="10" font-weight="700" text-anchor="middle">#${mm}</text>
              `;
            }).join('')}
          </svg>
          <div style="font-size:12.5px;font-weight:700;color:#E2BC63;margin-top:4px;">📷 Vista de Referencia · ${label} (${escapeHtml(prod.t || 'Calibres #3 al #8')})</div>
        </div>
      `;
    }
    if (fKey === 'nar' || fKey === 'nap') {
      const isFlat = fKey === 'nap';
      return `
        <div style="background:linear-gradient(135deg,#182226,#2A3B42);border-radius:12px;padding:18px;text-align:center;color:#F6EDD9;">
          <svg width="220" height="120" viewBox="0 0 220 120">
            <defs>
              <radialGradient id="neoBlk" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#4A5255"/>
                <stop offset="60%" stop-color="#1D2224"/>
                <stop offset="100%" stop-color="#0A0C0D"/>
              </radialGradient>
              <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#FFF2B2"/>
                <stop offset="50%" stop-color="#D4AF37"/>
                <stop offset="100%" stop-color="#8A6214"/>
              </linearGradient>
            </defs>
            <circle cx="110" cy="60" r="36" fill="url(#neoBlk)" stroke="#333" stroke-width="1"/>
            <rect x="98" y="21" width="6" height="78" rx="${isFlat ? 1 : 3}" fill="url(#goldRing)"/>
            <rect x="108" y="21" width="6" height="78" rx="${isFlat ? 1 : 3}" fill="url(#goldRing)"/>
            <rect x="118" y="21" width="6" height="78" rx="${isFlat ? 1 : 3}" fill="url(#goldRing)"/>
          </svg>
          <div style="font-size:12.5px;font-weight:700;color:#E2BC63;margin-top:4px;">
            📷 Bola de Neopreno con Argollas ${isFlat ? 'Planas' : 'Redondas'} en Oro Laminado
          </div>
        </div>
      `;
    }
    return '';
  }

  function openReferenceScaleModal(prodId) {
    const prod = BY_ID[prodId];
    if (!prod) return;
    const modal = document.getElementById('refScaleModal');
    const body = document.getElementById('refScaleModalBody');
    const title = document.getElementById('refScaleModalTitle');
    if (!modal || !body || !title) return;

    title.textContent = `Referencia #${prod.i} · ${prod.n}`;
    const canvaUrl = getProductCanvaUrl(prod);

    // Parsear dimensiones en mm o cm para dibujar plano a escala
    let wMm = 14, hMm = 14, dimLabel = prod.t || 'Tamaño estándar';
    const m2 = (prod.t || '').match(/(\d+(?:,\d+)?)\s*x\s*(\d+(?:,\d+)?)\s*mm/i);
    const m1 = (prod.t || '').match(/(\d+(?:,\d+)?)\s*mm/i);
    const mCm = (prod.t || '').match(/(\d+(?:,\d+)?)\s*cm/i);
    if (m2) {
      wMm = parseFloat(m2[1].replace(',', '.'));
      hMm = parseFloat(m2[2].replace(',', '.'));
    } else if (m1) {
      wMm = parseFloat(m1[1].replace(',', '.'));
      hMm = wMm;
    } else if (mCm) {
      const cm = parseFloat(mCm[1].replace(',', '.'));
      wMm = Math.min(80, cm * 10);
      hMm = wMm;
    }

    // Escala visual (4px por mm, acotado para caber cómodamente en el visor)
    const scalePx = Math.min(4.2, 140 / Math.max(wMm, hMm, 10));
    const rectW = Math.max(14, Math.round(wMm * scalePx));
    const rectH = Math.max(14, Math.round(hMm * scalePx));
    const ref10mmPx = Math.round(10 * scalePx);

    body.innerHTML = `
      ${prod.f ? renderStudioEmbeddedPhotoSvg(prod.f, prod) : ''}

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;align-items:center;">
        <!-- Plano de escala milimétrica -->
        <div style="background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--gold);margin-bottom:8px;">
            📐 Proporción y Medida de Referencia
          </div>
          <svg width="240" height="170" viewBox="0 0 240 170" style="background:var(--card);border:1px solid var(--line);border-radius:8px;">
            <!-- Cuadrícula milimétrica tenue -->
            <defs>
              <pattern id="mmGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--line)" stroke-width="0.7"/>
              </pattern>
            </defs>
            <rect width="240" height="170" fill="url(#mmGrid)"/>
            <!-- Caja de dimensión del producto -->
            <rect x="${120 - rectW / 2}" y="${78 - rectH / 2}" width="${rectW}" height="${rectH}" rx="6"
              fill="var(--goldsoft)" stroke="var(--teal)" stroke-width="2" stroke-dasharray="4 2"/>
            <text x="120" y="${78 + 4}" fill="var(--fg)" font-size="11" font-weight="800" text-anchor="middle">
              ${escapeHtml(dimLabel)}
            </text>
            <!-- Barra comparativa de 10 mm (1 cm) -->
            <line x1="24" y1="150" x2="${24 + ref10mmPx}" y2="150" stroke="var(--cat)" stroke-width="3"/>
            <text x="${24 + ref10mmPx + 8}" y="154" fill="var(--muted)" font-size="10.5" font-weight="700">
              Escala: 10 mm (1 cm)
            </text>
          </svg>
        </div>

        <!-- Ficha técnica y acceso al catálogo Canva -->
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="font-size:12px;font-weight:700;color:var(--gold);text-transform:uppercase;">
            ${escapeHtml(prod.l)} › ${escapeHtml(prod.s)}
          </div>
          <div style="font-size:22px;font-weight:800;color:var(--teal);" class="num">
            ${prod.v === 'AGOTADO' ? 'AGOTADO' : (prod.k > 0 ? fmtCOP(prod.k) + ' COP' : 'Consultar precio')}
          </div>
          ${prod.o ? `<div class="meta-badge tier-badge" style="align-self:flex-start;">💡 ${escapeHtml(prod.o)}</div>` : ''}
          <p style="font-size:13.5px;color:var(--muted);">
            ${canvaUrl
              ? `La fotografía oficial de referencia de este producto se encuentra en la <strong>Página ${prod.p}</strong> del catálogo de Canva de <strong>${escapeHtml(prod.l)}</strong>.`
              : `Referencia oficial #${prod.i} del catálogo Cauchos KSM.`}
          </p>
          ${canvaUrl ? `
            <a href="${escapeHtml(canvaUrl)}" target="_blank" rel="noopener" class="btn cat" style="width:100%;justify-content:center;">
              📷 Abrir Foto en Canva · Página ${prod.p} ↗
            </a>
          ` : ''}
        </div>
      </div>
    `;

    modal.classList.add('open');
  }

  // ==========================================================================
  // ESTUDIO CONFIGURADOR DE BOLAS DE NEOPRENO (#neopreno) — §9, §10, §11
  // ==========================================================================
  function getNeoTiersForSelection(refCode, sizeMm, colorNumStr) {
    const sKey = String(sizeMm);
    const cNum = parseInt(colorNumStr, 10) || 0;

    // §9.3 Excepciones por número de color (`neoTiers`)
    if (refCode === 'RF6' && cNum >= 36 && cNum <= 48) {
      if (sKey === '8') return [null, 1000, 1000, 850];
      if (sKey === '6') return null; // por WhatsApp
    }
    if (refCode === 'RF11') {
      if (cNum >= 72 && cNum <= 84) {
        if (sKey === '8') return [400, 300, 300, 225];
        if (sKey === '6') return null; // por WhatsApp
      }
      if ((cNum >= 7 && cNum <= 13) || (cNum >= 64 && cNum <= 71)) {
        if (sKey === '6') return [null, 300, 300, 270];
        if (sKey === '8') return [400, 300, 300, 270];
      }
    }
    if (refCode === 'RF13' && cNum >= 46 && cNum <= 49 && sKey === '8') {
      return [300, 250, 250, 250];
    }
    if (refCode === 'RF15' && sKey === '8') {
      if (cNum >= 33 && cNum <= 47) return [650, 650, 650, 650];
      if (cNum >= 48 && cNum <= 60) return [900, 900, 900, 900];
    }

    const refTable = NEOTIER[refCode];
    if (!refTable || !refTable[sKey]) return null;
    return refTable[sKey];
  }

  function getNeoUnitPrice(refCode, sizeMm, colorNumStr, qty) {
    const tiers = getNeoTiersForSelection(refCode, sizeMm, colorNumStr);
    if (!tiers) return 0; // Por confirmar en WhatsApp
    const q = Number(qty) || 0;
    let idx = 0;
    if (q >= 1000) idx = 3;
    else if (q >= 500) idx = 2;
    else if (q >= 100) idx = 1;
    else idx = 0;

    if (tiers[idx] === null || tiers[idx] === undefined) {
      // Si el tramo 12-99 es null, el mínimo es 100
      return tiers[1] || 0;
    }
    return tiers[idx];
  }

  function getNeoMinQty(refCode, sizeMm, colorNumStr) {
    const tiers = getNeoTiersForSelection(refCode, sizeMm, colorNumStr);
    if (tiers && tiers[0] === null) return 100;
    return 12;
  }

  function getNeoCanvaPhotoUrl(refCode, colorObj) {
    const refMeta = NEO_REFS.find(r => r.ref === refCode);
    if (refCode === 'RF3' && colorObj) {
      const baseLisa = 'https://www.canva.com/design/DAG_JmgpRQA/HfmI6C6Yc-XZS6ADOxilcQ/view?utlId=h9854511ee0';
      const numInt = parseInt(colorObj.num, 10);
      if (!isNaN(numInt) && numInt >= 1 && numInt <= 51) {
        return `${baseLisa}#${numInt}`;
      }
      const cLow = norm(colorObj.name);
      for (const [k, pg] of Object.entries(LISA_SPECIAL_PAGES)) {
        if (cLow.includes(norm(k))) return `${baseLisa}#${pg}`;
      }
      return baseLisa;
    }
    const baseGen = 'https://www.canva.com/design/DAGp_Y2KeZE/5-ToqWvRMYasDw8iwu6TIw/view?utlId=h0899514f3a';
    if (refMeta && refMeta.canvaPage) {
      return `${baseGen}#${refMeta.canvaPage}`;
    }
    return baseGen;
  }

  // Motor generador de muestras de color HEX desde `CMAP` (§11)
  function adjustHexBrightness(hex, percent) {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    let r = parseInt(clean.slice(0, 2), 16);
    let g = parseInt(clean.slice(2, 4), 16);
    let b = parseInt(clean.slice(4, 6), 16);

    if (percent > 0) {
      r = Math.round(r + (255 - r) * (percent / 100));
      g = Math.round(g + (255 - g) * (percent / 100));
      b = Math.round(b + (255 - b) * (percent / 100));
    } else {
      const factor = 1 + (percent / 100);
      r = Math.round(r * factor);
      g = Math.round(g * factor);
      b = Math.round(b * factor);
    }
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function extractColorsForName(colorName) {
    const low = colorName.toLowerCase();
    const detected = [];

    // Ordenar claves de CMAP de más largas a más cortas para coincidir primero frases compuestas ("azul rey", "verde menta")
    const sortedKeys = Object.keys(CMAP).sort((a, b) => b.length - a.length);
    let remaining = low;

    sortedKeys.forEach(kw => {
      if (remaining.includes(kw) && detected.length < 5) {
        const hexList = CMAP[kw];
        hexList.forEach(h => {
          if (detected.length < 5) detected.push(h);
        });
        remaining = remaining.replace(kw, ' ');
      }
    });

    if (detected.length === 0) {
      detected.push('#8E8E8E', '#D0D5D8');
    }

    // Aplicar modificadores de tono (§11: neón +15%, claro +40%, medio -15%, oscuro -40%, pastel +55%)
    let mod = 0;
    if (low.includes('pastel')) mod = 45;
    else if (low.includes('claro')) mod = 28;
    else if (low.includes('neón') || low.includes('neon')) mod = 15;
    else if (low.includes('medio')) mod = -15;
    else if (low.includes('oscuro')) mod = -32;

    if (mod !== 0 && detected.length === 1) {
      return [adjustHexBrightness(detected[0], mod)];
    }
    return detected;
  }

  function buildSwatchBackgroundCss(refCode, colorName) {
    const colors = extractColorsForName(colorName);
    const c0 = colors[0] || '#888';
    const c1 = colors[1] || c0;
    const c2 = colors[2] || c1;

    if (refCode === 'RF13') {
      // Pimienta: puntos moteados
      return `radial-gradient(circle at 30% 30%, ${c1} 18%, transparent 20%), radial-gradient(circle at 70% 65%, ${c2} 16%, transparent 18%), radial-gradient(circle at 40% 75%, ${c1} 14%, transparent 16%), ${c0}`;
    }
    if (refCode === 'RF15') {
      // Zebra: rayas diagonales
      return `repeating-linear-gradient(135deg, ${c0} 0px, ${c0} 4px, ${c1} 4px, ${c1} 8px)`;
    }
    if (refCode === 'RF14' || colors.length === 2) {
      // Candy / Bicolor
      return `linear-gradient(135deg, ${c0} 50%, ${c1} 50%)`;
    }
    if (colors.length >= 3) {
      return `conic-gradient(${colors.map((c, i) => `${c} ${(i * 100) / colors.length}% ${((i + 1) * 100) / colors.length}%`).join(', ')})`;
    }
    return c0;
  }

  function colorAllowedForSize(colorObj, sizeMm) {
    const n = colorObj.name.toLowerCase();
    if (n.includes('solo #8') && Number(sizeMm) !== 8) return false;
    if (n.includes('solo #6 y #8') && Number(sizeMm) !== 6 && Number(sizeMm) !== 8) return false;
    return true;
  }

  function renderNeoprenoStudio() {
    const refGrid = document.getElementById('neoRefGrid');
    const sizesRow = document.getElementById('neoSizesRow');
    const tiersGrid = document.getElementById('neoTiersGrid');
    const swatchesBox = document.getElementById('neoSwatchesContainer');
    const ringBlock = document.getElementById('neoRingStepBlock');
    const ballStage = document.getElementById('neoBallPreviewStage');
    const summaryBox = document.getElementById('neoLiveSummaryText');
    const canvaRefLink = document.getElementById('neoCanvaColorLink');

    if (!refGrid) return;

    const currentRefObj = NEO_REFS.find(r => r.ref === state.neoForm.ref) || NEO_REFS[0];
    if (!currentRefObj.sizes.includes(Number(state.neoForm.size))) {
      state.neoForm.size = currentRefObj.sizes.includes(8) ? 8 : currentRefObj.sizes[0];
    }

    // 1. Renderizar tarjetas de las 13 referencias
    refGrid.innerHTML = NEO_REFS.map(r => `
      <button type="button" class="neo-ref-card ${r.ref === currentRefObj.ref ? 'active' : ''}" data-ref="${r.ref}">
        <span class="neo-ref-code">${r.ref} · Pág. ${r.canvaPage}</span>
        <span class="neo-ref-name">${escapeHtml(r.name)}</span>
        <span class="neo-ref-meta">${r.colors.length} colores · #${r.sizes.join(', #')}</span>
      </button>
    `).join('');

    refGrid.querySelectorAll('.neo-ref-card').forEach(btn => {
      btn.addEventListener('click', () => {
        state.neoForm.ref = btn.getAttribute('data-ref');
        state.neoForm.colorIdx = 0;
        state.neoForm.dirty = true;
        renderNeoprenoStudio();
      });
    });

    // 2. Renderizar píldoras de tamaño (mm)
    sizesRow.innerHTML = currentRefObj.sizes.map(sz => `
      <button type="button" class="neo-size-pill ${Number(state.neoForm.size) === sz ? 'active' : ''}" data-size="${sz}">
        #${sz} (${sz} mm)
      </button>
    `).join('');

    sizesRow.querySelectorAll('.neo-size-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.neoForm.size = parseInt(btn.getAttribute('data-size'), 10);
        state.neoForm.dirty = true;
        renderNeoprenoStudio();
      });
    });

    // Color seleccionado actualmente
    const activeColorObj = currentRefObj.colors[state.neoForm.colorIdx] || currentRefObj.colors[0];
    const minQty = getNeoMinQty(currentRefObj.ref, state.neoForm.size, activeColorObj.num);
    if (state.neoForm.qty < minQty) {
      state.neoForm.qty = minQty;
      const qtyInp = document.getElementById('neoQtyInput');
      if (qtyInp) qtyInp.value = minQty;
    }

    // 3. Renderizar tabla de 4 tramos de precio (§9.2 y §9.3)
    const tiers = getNeoTiersForSelection(currentRefObj.ref, state.neoForm.size, activeColorObj.num);
    const q = state.neoForm.qty;
    const activeTierIdx = q >= 1000 ? 3 : (q >= 500 ? 2 : (q >= 100 ? 1 : 0));

    if (!tiers) {
      tiersGrid.innerHTML = `
        <div class="neo-tier-box active-tier" style="grid-column: 1 / -1;">
          <span class="neo-tier-range">Tarifa especial para ${currentRefObj.ref} #${state.neoForm.size}</span>
          <span class="neo-tier-price" style="color:var(--teal);">💬 Precio por confirmar en WhatsApp</span>
        </div>
      `;
    } else {
      const labels = ['12 a 99 und', '100 a 499 und', '500 a 999 und', '1.000+ und'];
      tiersGrid.innerHTML = tiers.map((priceVal, idx) => `
        <div class="neo-tier-box ${idx === activeTierIdx && priceVal !== null ? 'active-tier' : ''}">
          <span class="neo-tier-range">${labels[idx]}</span>
          <span class="neo-tier-price">${priceVal === null ? 'Mín. 100 und' : fmtCOP(priceVal) + ' c/u'}</span>
        </div>
      `).join('');
    }

    // 4. Renderizar cuadrícula de muestras de color (Swatches)
    const qCol = norm(state.neoForm.colorSearch);
    let swatchesHtml = '';
    currentRefObj.colors.forEach((cObj, idx) => {
      if (qCol && !norm(`${cObj.num} ${cObj.name}`).includes(qCol)) return;
      const allowed = colorAllowedForSize(cObj, state.neoForm.size);
      const bgCss = buildSwatchBackgroundCss(currentRefObj.ref, cObj.name);
      const isSelected = idx === state.neoForm.colorIdx;
      swatchesHtml += `
        <button type="button" class="neo-color-item ${isSelected ? 'active' : ''}" data-cidx="${idx}" ${!allowed ? 'disabled title="Solo disponible en tamaño #8"' : ''}>
          <span class="swatch-circle" style="background:${bgCss};"></span>
          <span class="neo-color-text">
            <span class="neo-color-num">Color #${escapeHtml(cObj.num)}</span>
            <span class="neo-color-name" title="${escapeHtml(cObj.name)}">${escapeHtml(cObj.name)}</span>
          </span>
        </button>
      `;
    });

    swatchesBox.innerHTML = swatchesHtml || `<div style="grid-column:1/-1;padding:16px;text-align:center;color:var(--muted);">No hay colores que coincidan con "${escapeHtml(state.neoForm.colorSearch)}". Puedes usar la casilla de "Otro color" abajo.</div>`;

    swatchesBox.querySelectorAll('.neo-color-item').forEach(btn => {
      btn.addEventListener('click', () => {
        state.neoForm.colorIdx = parseInt(btn.getAttribute('data-cidx'), 10);
        state.neoForm.customColor = '';
        const customInp = document.getElementById('neoCustomColorInput');
        if (customInp) customInp.value = '';
        state.neoForm.dirty = true;
        renderNeoprenoStudio();
      });
    });

    // 5. Mostrar/ocultar selector de color de aro/argolla
    if (ringBlock) {
      ringBlock.style.display = currentRefObj.hasRing ? 'block' : 'none';
    }

    // 6. Renderizar Vista Previa 3D interactiva de la bola de neopreno
    const extractedHexes = extractColorsForName(activeColorObj.name);
    const mainHex = extractedHexes[0] || '#222';
    const secHex = extractedHexes[1] || mainHex;
    const radiusPx = 22 + Number(state.neoForm.size) * 2.4;

    const ringStroke = state.neoForm.metal.includes('Plateado') ? '#D0D7DC'
      : (state.neoForm.metal.includes('Rosado') ? '#E6A498' : '#E5C158');

    if (ballStage) {
      ballStage.innerHTML = `
        <svg width="160" height="125" viewBox="0 0 160 125">
          <defs>
            <radialGradient id="neoLiveGrad" cx="35%" cy="30%" r="68%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
              <stop offset="35%" stop-color="${mainHex}"/>
              <stop offset="80%" stop-color="${secHex}"/>
              <stop offset="100%" stop-color="#0a0a0a"/>
            </radialGradient>
          </defs>
          <ellipse cx="80" cy="108" rx="${radiusPx * 0.75}" ry="6" fill="rgba(0,0,0,0.16)"/>
          <circle cx="80" cy="58" r="${radiusPx}" fill="url(#neoLiveGrad)" stroke="rgba(0,0,0,0.25)" stroke-width="1.2"/>
          ${currentRefObj.ref === 'RF2' ? `
            <line x1="${80 - radiusPx * 0.4}" y1="${58 - radiusPx * 0.85}" x2="${80 - radiusPx * 0.4}" y2="${58 + radiusPx * 0.85}" stroke="rgba(255,255,255,0.45)" stroke-width="2.2"/>
            <line x1="80" y1="${58 - radiusPx * 0.95}" x2="80" y2="${58 + radiusPx * 0.95}" stroke="rgba(255,255,255,0.45)" stroke-width="2.2"/>
            <line x1="${80 + radiusPx * 0.4}" y1="${58 - radiusPx * 0.85}" x2="${80 + radiusPx * 0.4}" y2="${58 + radiusPx * 0.85}" stroke="rgba(255,255,255,0.45)" stroke-width="2.2"/>
          ` : ''}
          ${currentRefObj.hasRing ? `
            <rect x="76" y="${58 - radiusPx - 3}" width="8" height="${radiusPx * 2 + 6}" rx="3" fill="${ringStroke}" stroke="#5A4310" stroke-width="0.8"/>
          ` : ''}
        </svg>
      `;
    }

    const unitPrice = getNeoUnitPrice(currentRefObj.ref, state.neoForm.size, activeColorObj.num, state.neoForm.qty);
    const photoUrl = getNeoCanvaPhotoUrl(currentRefObj.ref, activeColorObj);
    if (canvaRefLink) {
      canvaRefLink.href = photoUrl;
      canvaRefLink.textContent = `📷 Ver foto de ${currentRefObj.ref} #${activeColorObj.num} en Canva ↗`;
    }

    if (summaryBox) {
      const customCol = state.neoForm.customColor.trim();
      const colDisplay = customCol ? `Otro: ${customCol}` : `#${activeColorObj.num} ${activeColorObj.name}`;
      summaryBox.innerHTML = `
        <div style="font-weight:800;font-size:15px;color:var(--fg);">
          ${currentRefObj.ref} (${escapeHtml(currentRefObj.name)}) · Bola #${state.neoForm.size} (${state.neoForm.size} mm)
        </div>
        <div style="font-size:13.5px;color:var(--fg-secondary);margin-top:2px;">
          Color: <strong>${escapeHtml(colDisplay)}</strong>
          ${currentRefObj.hasRing ? ` · Aro/Argolla: <strong>${escapeHtml(state.neoForm.metal)}</strong>` : ''}
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line);display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-size:13px;color:var(--muted);">${state.neoForm.qty} und × ${unitPrice > 0 ? fmtCOP(unitPrice) : 'Por confirmar'}</span>
          <strong class="num" style="font-size:18px;color:var(--teal);">
            ${unitPrice > 0 ? fmtCOP(unitPrice * state.neoForm.qty) : 'Por WhatsApp'}
          </strong>
        </div>
      `;
    }
  }

  function addCurrentNeoprenoToQuote() {
    const currentRefObj = NEO_REFS.find(r => r.ref === state.neoForm.ref) || NEO_REFS[0];
    const activeColorObj = currentRefObj.colors[state.neoForm.colorIdx] || currentRefObj.colors[0];
    const minQty = getNeoMinQty(currentRefObj.ref, state.neoForm.size, activeColorObj.num);
    const qty = Math.max(minQty, parseInt(state.neoForm.qty, 10) || minQty);
    const customCol = state.neoForm.customColor.trim();
    const unitK = getNeoUnitPrice(currentRefObj.ref, state.neoForm.size, activeColorObj.num, qty);
    const photoUrl = getNeoCanvaPhotoUrl(currentRefObj.ref, activeColorObj);

    const neoEntry = {
      id: Date.now() + Math.random(),
      r: currentRefObj.ref,
      rName: currentRefObj.name,
      s: state.neoForm.size,
      cn: customCol ? 'Otro' : activeColorObj.num,
      cname: customCol ? customCol : activeColorObj.name,
      m: currentRefObj.hasRing ? state.neoForm.metal : '',
      q: qty,
      k: unitK,
      photoUrl
    };

    state.neo.push(neoEntry);
    state.neoForm.dirty = false;
    savePersistedState();
    updateCartBar();
    renderNeoAddedMiniList();
    showToast(`✅ Agregado: ${qty} und de ${neoEntry.r} #${neoEntry.s} (${neoEntry.cname})`);
  }

  function renderNeoAddedMiniList() {
    const box = document.getElementById('neoAddedLinesPreview');
    if (!box) return;
    if (state.neo.length === 0) {
      box.innerHTML = '';
      return;
    }
    box.innerHTML = `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);">
        <div style="font-size:12.5px;font-weight:800;color:var(--teal);text-transform:uppercase;margin-bottom:8px;">
          ✓ Líneas de Neopreno en tu Cotización (${state.neo.length}):
        </div>
        <div style="display:grid;gap:6px;">
          ${state.neo.map((item, idx) => `
            <div style="display:flex;justify-content:space-between;align-items:center;background:var(--card);padding:8px 12px;border-radius:8px;border:1px solid var(--line);font-size:13px;">
              <span>
                <strong>${item.q} und</strong> · ${item.r} #${item.s} · #${escapeHtml(item.cn)} ${escapeHtml(item.cname)}
                ${item.m ? ` · Aro ${escapeHtml(item.m)}` : ''}
              </span>
              <span style="display:flex;align-items:center;gap:10px;">
                <strong class="num">${item.k > 0 ? fmtCOP(item.q * item.k) : 'Por confirmar'}</strong>
                <button type="button" class="remove-neo-line-btn" data-idx="${idx}" style="color:var(--warn);font-weight:800;" title="Quitar línea">✕</button>
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    box.querySelectorAll('.remove-neo-line-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        state.neo.splice(idx, 1);
        savePersistedState();
        updateCartBar();
        renderNeoAddedMiniList();
      });
    });
  }

  // ==========================================================================
  // CÁLCULO DE TOTALES Y BARRA INFERIOR DE COTIZACIÓN (#cartbar)
  // ==========================================================================
  function calculateQuoteTotals() {
    let prodUnits = 0;
    let prodRefs = 0;
    let prodTotal = 0;

    Object.entries(state.cart).forEach(([idStr, qty]) => {
      const q = Number(qty) || 0;
      if (q <= 0) return;
      const prod = BY_ID[idStr];
      if (!prod) return;
      prodRefs++;
      prodUnits += q;
      const unitK = getEffectiveUnitPrice(prod, q);
      prodTotal += unitK * q;
    });

    let neoUnits = 0;
    let neoTotal = 0;
    let hasNeoPendingPrice = false;

    state.neo.forEach(n => {
      neoUnits += Number(n.q) || 0;
      if (n.k > 0) {
        neoTotal += n.q * n.k;
      } else {
        hasNeoPendingPrice = true;
      }
    });

    const grandTotal = prodTotal + neoTotal;
    return {
      prodRefs,
      prodUnits,
      prodTotal,
      neoLines: state.neo.length,
      neoUnits,
      neoTotal,
      hasNeoPendingPrice,
      grandTotal,
      isEmpty: prodRefs === 0 && state.neo.length === 0
    };
  }

  function updateCartBar() {
    const totals = calculateQuoteTotals();
    const cartbar = document.getElementById('cartbar');
    const topCounterPill = document.getElementById('topOrderCountPill');
    const quickCartCount = document.getElementById('quickCartFilterCount');
    const totalEl = document.getElementById('cartbarTotalVal');
    const countEl = document.getElementById('cartbarCountTxt');
    const progFill = document.getElementById('minProgressFill');
    const progLabel = document.getElementById('minProgressLabel');

    const totalItemsBadge = totals.prodRefs + totals.neoLines;
    if (topCounterPill) {
      topCounterPill.textContent = totalItemsBadge;
    }
    if (quickCartCount) {
      quickCartCount.textContent = `(${totals.prodRefs})`;
    }

    if (!cartbar) return;
    cartbar.classList.toggle('visible', !totals.isEmpty);

    if (totalEl) {
      totalEl.textContent = fmtCOP(totals.grandTotal) + ' COP';
    }
    if (countEl) {
      const parts = [];
      if (totals.prodUnits > 0) parts.push(`${totals.prodUnits} pzs (${totals.prodRefs} ref)`);
      if (totals.neoLines > 0) parts.push(`${totals.neoLines} lín. neopreno`);
      countEl.textContent = parts.join(' + ') || '0 productos';
    }

    const pct = Math.min(100, Math.round((totals.grandTotal / MIN_ORDER) * 100));
    const met = totals.grandTotal >= MIN_ORDER || totals.hasNeoPendingPrice;
    if (progFill) {
      progFill.style.width = `${pct}%`;
      progFill.classList.toggle('met', met);
    }
    if (progLabel) {
      progLabel.classList.toggle('met', met);
      if (met) {
        progLabel.textContent = '✓ Pedido mínimo ($30.000) alcanzado';
      } else {
        const missing = MIN_ORDER - totals.grandTotal;
        progLabel.textContent = `Faltan ${fmtCOP(missing)} para el mínimo ($30.000)`;
      }
    }
  }

  // ==========================================================================
  // MODAL DE COTIZACIÓN ("TU PEDIDO") Y FORMATO EXACTO DE MENSAJE WHATSAPP (§12)
  // ==========================================================================
  function openQuoteDrawer() {
    // Guardia de olvido de neopreno (`neoGuard`, §7.3)
    if (state.neoForm.dirty && state.neo.length === 0) {
      const confirmAdd = window.confirm(
        '¿Deseas agregar al pedido las bolas de neopreno que estabas configurando antes de abrir tu cotización?'
      );
      if (confirmAdd) {
        addCurrentNeoprenoToQuote();
      } else {
        state.neoForm.dirty = false;
      }
    }

    renderQuoteDrawerContent();
    const modal = document.getElementById('quoteSheetModal');
    if (modal) modal.classList.add('open');
  }

  function renderQuoteDrawerContent() {
    const listContainer = document.getElementById('quoteItemsList');
    const summaryBanner = document.getElementById('quoteTotalsSummary');
    if (!listContainer || !summaryBanner) return;

    const totals = calculateQuoteTotals();

    if (totals.isEmpty) {
      listContainer.innerHTML = `
        <div style="text-align:center;padding:28px 16px;background:var(--bg);border-radius:12px;border:1px dashed var(--line-strong);">
          <p style="font-weight:700;color:var(--fg);margin-bottom:6px;">Tu cotización está vacía</p>
          <p style="font-size:13.5px;color:var(--muted);">Usa los botones <strong>+</strong> en cualquier producto del catálogo o configura bolas de neopreno para armar tu pedido.</p>
        </div>
      `;
      summaryBanner.innerHTML = '';
      return;
    }

    let itemsHtml = '';

    // 1. Productos del catálogo
    Object.entries(state.cart).forEach(([idStr, qty]) => {
      const q = Number(qty) || 0;
      if (q <= 0) return;
      const prod = BY_ID[idStr];
      if (!prod) return;
      const unitK = getEffectiveUnitPrice(prod, q);
      const sub = unitK * q;
      const note = state.cnote[prod.i] || '';
      const canvaUrl = getProductCanvaUrl(prod);

      itemsHtml += `
        <div class="quote-line-item">
          <div class="quote-line-info">
            <div class="quote-line-title">
              <span class="num" style="color:var(--teal);">${q} ×</span> ${escapeHtml(prod.n)}
              ${prod.t ? `<span style="font-weight:500;color:var(--muted);">(${escapeHtml(prod.t)})</span>` : ''}
            </div>
            <div class="quote-line-sub">
              ${escapeHtml(prod.l)} › ${escapeHtml(prod.s)} · <span class="num">${fmtCOP(unitK)} c/u</span>
              ${canvaUrl ? ` · <a href="${escapeHtml(canvaUrl)}" target="_blank" rel="noopener" style="color:var(--cat);font-weight:700;">📷 Pág. ${prod.p}</a>` : ''}
            </div>
            <div style="margin-top:6px;">
              <input type="text" class="custom-note-input quote-item-note" data-id="${prod.i}"
                placeholder="Nota de color, baño o letras (opcional)"
                value="${escapeHtml(note)}" style="font-size:12.5px;padding:5px 8px;" />
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="step">
              <button type="button" class="q-dec" data-id="${prod.i}">−</button>
              <input type="number" class="q-inp" data-id="${prod.i}" value="${q}" min="0" />
              <button type="button" class="q-inc" data-id="${prod.i}">+</button>
            </div>
            <strong class="num" style="min-width:82px;text-align:right;font-size:15px;color:var(--fg);">
              ${fmtCOP(sub)}
            </strong>
          </div>
        </div>
      `;
    });

    // 2. Líneas de Neopreno
    state.neo.forEach((n, idx) => {
      const sub = n.k > 0 ? n.q * n.k : 0;
      itemsHtml += `
        <div class="quote-line-item" style="border-left:4px solid var(--hi);">
          <div class="quote-line-info">
            <div class="quote-line-title">
              <span class="num" style="color:var(--cat);">${n.q} und ·</span> Neopreno ${escapeHtml(n.r)} (${escapeHtml(n.rName)}) #${n.s}
            </div>
            <div class="quote-line-sub">
              Color #${escapeHtml(n.cn)} ${escapeHtml(n.cname)}
              ${n.m ? ` · Aro/Argolla: ${escapeHtml(n.m)}` : ''}
              · ${n.k > 0 ? `${fmtCOP(n.k)} c/u` : 'Precio por confirmar en WhatsApp'}
              ${n.photoUrl ? ` · <a href="${escapeHtml(n.photoUrl)}" target="_blank" rel="noopener" style="color:var(--cat);font-weight:700;">📷 Foto</a>` : ''}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <strong class="num" style="font-size:15px;">${n.k > 0 ? fmtCOP(sub) : 'Por confirmar'}</strong>
            <button type="button" class="btn outline q-remove-neo" data-idx="${idx}" style="padding:6px 10px;font-size:12px;color:var(--warn);">
              Quitar
            </button>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = itemsHtml;

    summaryBanner.innerHTML = `
      <div style="background:var(--goldsoft);border:1.5px solid var(--gold);border-radius:12px;padding:14px 18px;display:flex;flex-direction:column;gap:6px;">
        ${totals.prodUnits > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:13.5px;">
            <span>Subtotal Productos (${totals.prodUnits} und):</span>
            <strong class="num">${fmtCOP(totals.prodTotal)} COP</strong>
          </div>
        ` : ''}
        ${totals.neoLines > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:13.5px;">
            <span>Subtotal Neopreno (${totals.neoUnits} und):</span>
            <strong class="num">${fmtCOP(totals.neoTotal)} COP ${totals.hasNeoPendingPrice ? '(+ líneas por confirmar)' : ''}</strong>
          </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:6px;border-top:1px solid var(--gold-border);font-size:18px;font-weight:800;color:var(--fg);">
          <span>TOTAL COTIZACIÓN:</span>
          <span class="num" style="color:var(--teal);">${fmtCOP(totals.grandTotal)} COP</span>
        </div>
        ${totals.hasNeoPendingPrice ? `<div style="font-size:12px;color:var(--info);">* Algunas referencias de neopreno tienen precio por confirmar directamente con el asesor en WhatsApp.</div>` : ''}
      </div>
    `;

    // Eventos dentro del modal de cotización
    listContainer.querySelectorAll('.q-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        updateProductQty(id, (state.cart[id] || 0) + 1);
        renderQuoteDrawerContent();
      });
    });

    listContainer.querySelectorAll('.q-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        updateProductQty(id, Math.max(0, (state.cart[id] || 0) - 1));
        renderQuoteDrawerContent();
      });
    });

    listContainer.querySelectorAll('.q-inp').forEach(inp => {
      inp.addEventListener('change', () => {
        const id = parseInt(inp.getAttribute('data-id'), 10);
        updateProductQty(id, Math.max(0, parseInt(inp.value, 10) || 0));
        renderQuoteDrawerContent();
      });
    });

    listContainer.querySelectorAll('.quote-item-note').forEach(inp => {
      inp.addEventListener('input', () => {
        const id = parseInt(inp.getAttribute('data-id'), 10);
        state.cnote[id] = inp.value;
        savePersistedState();
      });
    });

    listContainer.querySelectorAll('.q-remove-neo').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        state.neo.splice(idx, 1);
        savePersistedState();
        updateCartBar();
        renderNeoAddedMiniList();
        renderQuoteDrawerContent();
      });
    });
  }

  // Validación del nombre del cliente (§7.4: obligatorio ≥ 2 caracteres)
  function validateCustomerName() {
    const nameInput = document.getElementById('custName');
    const warnBanner = document.getElementById('custNameWarn');
    const nameVal = (state.customer.name || '').trim();
    if (nameVal.length < 2) {
      if (nameInput) {
        nameInput.classList.add('invalid');
        nameInput.focus();
      }
      if (warnBanner) warnBanner.style.display = 'block';
      showToast('⚠️ Escribe tu nombre (mínimo 2 letras) para enviar o copiar tu pedido.');
      return false;
    }
    if (nameInput) nameInput.classList.remove('invalid');
    if (warnBanner) warnBanner.style.display = 'none';
    return true;
  }

  // Construcción del mensaje de texto exacto para WhatsApp (§12.1)
  function buildWhatsAppOrderText() {
    const totals = calculateQuoteTotals();
    const c = state.customer;
    const lines = [];

    lines.push('*Pedido - Cauchos KSM*');
    lines.push('(Por favor confirmar disponibilidad)');
    lines.push(`Nombre: ${c.name.trim()}`);
    if (c.phone.trim()) lines.push(`Teléfono: ${c.phone.trim()}`);
    if (c.city.trim()) lines.push(`Ciudad: ${c.city.trim()}`);
    if (c.idNum.trim()) lines.push(`Cédula: ${c.idNum.trim()}`);
    if (c.address.trim()) lines.push(`Dirección: ${c.address.trim()}`);
    lines.push('');

    if (totals.prodRefs > 0) {
      lines.push('*Productos*');
      Object.entries(state.cart).forEach(([idStr, qty]) => {
        const q = Number(qty) || 0;
        if (q <= 0) return;
        const prod = BY_ID[idStr];
        if (!prod) return;
        const unitK = getEffectiveUnitPrice(prod, q);
        const sub = unitK * q;
        const note = (state.cnote[prod.i] || '').trim();
        const sizePart = prod.t ? ` (${prod.t})` : '';
        const notePart = note ? ` · Color/Letra: ${note}` : '';
        lines.push(`${q} x ${prod.n}${sizePart}${notePart} · ${prod.l} · ${fmtCOP(unitK)} COP c/u = *${fmtCOP(sub)} COP*`);

        // Enlace de foto en Canva (no se incluye en Balines según §12.1)
        if (!prod.l.startsWith('Balines') && prod.u && prod.p) {
          lines.push(`   📷 Foto *pág. ${prod.p}*: ${prod.u}#${prod.p}`);
        }
      });
      lines.push(`*Total productos: ${totals.prodUnits} und · ${fmtCOP(totals.prodTotal)} COP*`);
      lines.push('');
    }

    if (totals.neoLines > 0) {
      lines.push('*Neopreno*');
      state.neo.forEach(n => {
        const metalPart = n.m ? ` · aro/argolla ${n.m}` : '';
        const pricePart = n.k > 0
          ? ` · ${fmtCOP(n.k)} c/u = *${fmtCOP(n.q * n.k)}*`
          : ` · *Precio por confirmar*`;
        lines.push(`${n.q} und · ${n.r} #${n.s} #${n.cn} ${n.cname}${metalPart}${pricePart}`);
        if (n.photoUrl) {
          lines.push(`   Foto: ${n.photoUrl}`);
        }
      });
      lines.push(`*Total neopreno: ${fmtCOP(totals.neoTotal)} COP${totals.hasNeoPendingPrice ? ' (+ por confirmar)' : ''}*`);
      lines.push('');
    }

    lines.push(`*TOTAL PEDIDO: ${fmtCOP(totals.grandTotal)} COP*`);
    return lines.join('\n');
  }

  function sendOrderToWhatsAppChannel(phone) {
    const totals = calculateQuoteTotals();
    if (totals.isEmpty) {
      showToast('Agrega al menos un producto a tu cotización primero.');
      return;
    }
    if (!validateCustomerName()) return;
    const text = buildWhatsAppOrderText();
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }

  // ==========================================================================
  // GENERADOR DE TARJETA IMAGEN DEL PEDIDO ("PANTALLAZO" CANVAS 1080px — §12.2)
  // ==========================================================================
  function renderOrderReceiptCanvas() {
    const canvas = document.getElementById('orderReceiptCanvas');
    if (!canvas) return null;

    const totals = calculateQuoteTotals();
    const prodEntries = Object.entries(state.cart)
      .filter(([, q]) => q > 0)
      .map(([idStr, q]) => ({ prod: BY_ID[idStr], q: Number(q) }))
      .filter(x => x.prod);

    const W = 1080;
    const PAD = 48;
    const rowH = 68;
    const headerH = 175;
    const custH = 145;
    const prodsH = prodEntries.length > 0 ? 55 + prodEntries.length * rowH : 0;
    const neoH = state.neo.length > 0 ? 55 + state.neo.length * rowH : 0;
    const totalsH = 150;
    const footerH = 95;
    const H = headerH + custH + prodsH + neoH + totalsH + footerH + 40;

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Fondo general
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Cabecera Teal (#2F4A55)
    ctx.fillStyle = '#2F4A55';
    ctx.fillRect(0, 0, W, headerH);

    // Franja dorada superior
    ctx.fillStyle = '#9A7220';
    ctx.fillRect(0, headerH - 6, W, 6);

    ctx.fillStyle = '#E2BC63';
    ctx.font = 'bold 20px Helvetica, Arial, sans-serif';
    ctx.fillText('CAUCHOS KSM · JOYERÍA Y BISUTERÍA (COLOMBIA)', PAD, 52);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText('COTIZACIÓN DE PEDIDO', PAD, 104);

    const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillStyle = '#D9DEE0';
    ctx.font = '22px Helvetica, Arial, sans-serif';
    ctx.fillText(`Fecha: ${dateStr} · Estado: Por confirmar disponibilidad`, PAD, 144);

    let y = headerH + 28;

    // Caja de Datos del Cliente
    ctx.fillStyle = '#F4F6F7';
    ctx.fillRect(PAD, y, W - PAD * 2, 110);
    ctx.strokeStyle = '#D9DEE0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PAD, y, W - PAD * 2, 110);

    ctx.fillStyle = '#1F2A2E';
    ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
    ctx.fillText(`Cliente: ${state.customer.name || 'Sin especificar'}`, PAD + 20, y + 38);

    ctx.fillStyle = '#5E6A6E';
    ctx.font = '21px Helvetica, Arial, sans-serif';
    ctx.fillText(
      `Tel: ${state.customer.phone || '—'}   |   Ciudad: ${state.customer.city || '—'}   |   C.C./NIT: ${state.customer.idNum || '—'}`,
      PAD + 20,
      y + 70
    );
    ctx.fillText(`Dirección: ${state.customer.address || '—'}`, PAD + 20, y + 98);

    y += 135;

    // Tabla de Productos
    if (prodEntries.length > 0) {
      ctx.fillStyle = '#9A7220';
      ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
      ctx.fillText(`PRODUCTOS SELECCIONADOS (${totals.prodUnits} UND)`, PAD, y + 26);
      y += 42;

      prodEntries.forEach((entry, idx) => {
        const { prod, q } = entry;
        const unitK = getEffectiveUnitPrice(prod, q);
        const sub = unitK * q;
        const note = (state.cnote[prod.i] || '').trim();

        if (idx % 2 === 0) {
          ctx.fillStyle = '#F4F6F7';
          ctx.fillRect(PAD, y, W - PAD * 2, rowH);
        }

        ctx.fillStyle = '#1F2A2E';
        ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
        const titleTxt = `${q} × ${prod.n} ${prod.t ? '(' + prod.t + ')' : ''}`;
        ctx.fillText(titleTxt.slice(0, 52), PAD + 14, y + 28);

        ctx.fillStyle = '#5E6A6E';
        ctx.font = '19px Helvetica, Arial, sans-serif';
        const metaTxt = `${prod.l}${note ? ' · Nota: ' + note : ''}${prod.p ? ' · Canva Pág. ' + prod.p : ''}`;
        ctx.fillText(metaTxt.slice(0, 68), PAD + 14, y + 54);

        ctx.fillStyle = '#2F4A55';
        ctx.font = 'bold 23px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(fmtCOP(sub), W - PAD - 14, y + 40);
        ctx.textAlign = 'left';

        y += rowH;
      });
      y += 14;
    }

    // Tabla de Neopreno
    if (state.neo.length > 0) {
      ctx.fillStyle = '#C8691C';
      ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
      ctx.fillText(`BOLAS DE NEOPRENO (${totals.neoUnits} UND)`, PAD, y + 26);
      y += 42;

      state.neo.forEach((n, idx) => {
        if (idx % 2 === 0) {
          ctx.fillStyle = '#FDF8F2';
          ctx.fillRect(PAD, y, W - PAD * 2, rowH);
        }
        ctx.fillStyle = '#1F2A2E';
        ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
        ctx.fillText(`${n.q} und · ${n.r} (${n.rName}) #${n.s} mm`, PAD + 14, y + 28);

        ctx.fillStyle = '#5E6A6E';
        ctx.font = '19px Helvetica, Arial, sans-serif';
        ctx.fillText(`Color #${n.cn}: ${n.cname}${n.m ? ' · Aro: ' + n.m : ''}`.slice(0, 68), PAD + 14, y + 54);

        ctx.fillStyle = '#2F4A55';
        ctx.font = 'bold 23px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(n.k > 0 ? fmtCOP(n.q * n.k) : 'Por confirmar', W - PAD - 14, y + 40);
        ctx.textAlign = 'left';

        y += rowH;
      });
      y += 14;
    }

    // Caja de Total General (#F3E7C9)
    ctx.fillStyle = '#F3E7C9';
    ctx.fillRect(PAD, y, W - PAD * 2, 110);
    ctx.strokeStyle = '#9A7220';
    ctx.lineWidth = 2;
    ctx.strokeRect(PAD, y, W - PAD * 2, 110);

    ctx.fillStyle = '#1F2A2E';
    ctx.font = 'bold 28px Helvetica, Arial, sans-serif';
    ctx.fillText('TOTAL COTIZACIÓN ESTIMADO:', PAD + 24, y + 52);

    ctx.fillStyle = '#2F4A55';
    ctx.font = 'bold 38px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${fmtCOP(totals.grandTotal)} COP`, W - PAD - 24, y + 55);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#5B4E1A';
    ctx.font = '19px Helvetica, Arial, sans-serif';
    ctx.fillText(
      'Pedido mínimo $30.000 COP · Sujeto a disponibilidad · Valor de envío confirmado por asesor en WhatsApp',
      PAD + 24,
      y + 90
    );

    y += 130;

    // Pie de tarjeta
    ctx.fillStyle = '#F2EEE6';
    ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = '#5E6A6E';
    ctx.font = '19px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Cauchos KSM · WhatsApp Tienda: 310 433 7951 | Mayorista: 316 259 9541 | Neox: 322 260 4729',
      W / 2,
      H - 28
    );
    ctx.textAlign = 'left';

    return canvas;
  }

  function openPantallazoModal() {
    const totals = calculateQuoteTotals();
    if (totals.isEmpty) {
      showToast('Agrega productos a tu cotización antes de generar la tarjeta.');
      return;
    }
    if (!validateCustomerName()) {
      openQuoteDrawer();
      return;
    }
    renderOrderReceiptCanvas();
    const modal = document.getElementById('pantallazoModal');
    if (modal) modal.classList.add('open');
  }

  async function copyCanvasImageToClipboard() {
    const canvas = renderOrderReceiptCanvas();
    if (!canvas) return;
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
        showToast('📋 ¡Imagen copiada! Ahora abre el WhatsApp elegido y pégala en el chat.');
      } else {
        downloadCanvasAsPng();
      }
    } catch (e) {
      downloadCanvasAsPng();
    }
  }

  function downloadCanvasAsPng() {
    const canvas = renderOrderReceiptCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    const cleanName = norm(state.customer.name || 'cliente').replace(/\s+/g, '_');
    link.download = `Cotizacion_KSM_${cleanName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('💾 Imagen de tu cotización descargada en tu dispositivo.');
  }

  // Generador de PDF nativo autónomo (sin depender de CDNs externos) a partir del Canvas de alta resolución
  function downloadOrderAsPdf() {
    const totals = calculateQuoteTotals();
    if (totals.isEmpty) {
      showToast('Agrega productos a tu cotización primero.');
      return;
    }
    if (!validateCustomerName()) return;
    const canvas = renderOrderReceiptCanvas();
    if (!canvas) return;

    try {
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64 = jpegDataUrl.split(',')[1];
      const imgBytes = atob(base64);
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Dimensiones en puntos PDF (ancho A4 = 595.28 pt, alto proporcional)
      const pdfW = 595.28;
      const pdfH = Math.round((imgH / imgW) * pdfW * 100) / 100;

      const streamCmd = `q\n${pdfW} 0 0 ${pdfH} 0 0 cm\n/Im0 Do\nQ\n`;
      const objects = [];
      objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
      objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
      objects.push(
        `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW} ${pdfH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
      );
      objects.push(
        `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n` +
        imgBytes +
        '\nendstream\nendobj\n'
      );
      objects.push(
        `5 0 obj\n<< /Length ${streamCmd.length} >>\nstream\n${streamCmd}endstream\nendobj\n`
      );

      let pdfStr = '%PDF-1.4\n';
      const offsets = [];
      objects.forEach(obj => {
        offsets.push(pdfStr.length);
        pdfStr += obj;
      });
      const xrefOffset = pdfStr.length;
      pdfStr += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      offsets.forEach(off => {
        pdfStr += String(off).padStart(10, '0') + ' 00000 n \n';
      });
      pdfStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

      const uint8 = new Uint8Array(pdfStr.length);
      for (let i = 0; i < pdfStr.length; i++) {
        uint8[i] = pdfStr.charCodeAt(i) & 0xff;
      }
      const blob = new Blob([uint8], { type: 'application/pdf' });
      const link = document.createElement('a');
      const cleanName = norm(state.customer.name || 'cliente').replace(/\s+/g, '_');
      link.download = `Pedido_Cauchos_KSM_${cleanName}.pdf`;
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      showToast('📄 PDF descargado. Adjúntalo en WhatsApp con el ícono de clip (📎 → Documento).');
    } catch (err) {
      downloadCanvasAsPng();
    }
  }

  // ==========================================================================
  // ASISTENTE CONCIERGE KSM (#ayuBox) — §13
  // ==========================================================================
  function appendChatMessage(sender, htmlContent) {
    const box = document.getElementById('assistantMessages');
    if (!box) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = htmlContent;
    box.appendChild(bubble);
    box.scrollTop = box.scrollHeight;
  }

  function handleAssistantQuery(rawInput) {
    const text = (rawInput || '').trim();
    if (!text) return;
    appendChatMessage('user', escapeHtml(text));

    const q = norm(text);

    // 1. Verificar palabras clave de Joyería 18K (§13)
    if (/oring|o-ring|correa|hublot|cartier|versace|canal|ranura|bulgari|mortadela|exclusiv|18\s*k|oro 18/i.test(q)) {
      appendChatMessage(
        'bot',
        `💎 <strong>Joyería Oro 18K:</strong> Eso lo tenemos en nuestro catálogo exclusivo de Joyería Oro 18K (separadores mín. 50 und, modelos exclusivos de neopreno, orings, correas y mortadelas).<br><br>
        <a href="https://claude.ai/artifact/FgquqwfhHdULUhq3DcdMPB" target="_blank" rel="noopener" class="btn primary" style="margin-top:4px;padding:6px 12px;font-size:12.5px;">Abrir Catálogo Joyería 18K ↗</a>`
      );
      return;
    }

    // 2. Preguntas frecuentes predefinidas (§13)
    if (q.includes('como hago') || q.includes('como cotizar') || q.includes('pasos')) {
      appendChatMessage(
        'bot',
        `<strong>Así haces tu pedido en Cauchos KSM:</strong><br>
        1. Busca el producto o filtra por línea y toca <strong>+</strong>.<br>
        2. Si pide color, baño o letra, elígelo en la tarjeta.<br>
        3. Para bolas de neopreno, usa el <strong>Estudio de Neopreno</strong>.<br>
        4. Toca <strong>Ver mi cotización</strong> abajo, escribe tu nombre y ciudad.<br>
        5. Envíalo con 1 clic por <strong>WhatsApp</strong> (en texto, imagen pantallazo o PDF).`
      );
      return;
    }
    if (q.includes('minimo') || q.includes('mínimo')) {
      appendChatMessage(
        'bot',
        `🛍️ <strong>Pedido mínimo:</strong> Nuestro pedido mínimo en bisutería es de <strong>$30.000 COP</strong>. Puedes combinar dijes de rodio, acero, oro laminado, aretería, piedras, hilos y bolas de neopreno hasta completarlo.`
      );
      return;
    }
    if (q.includes('envio') || q.includes('pago') || q.includes('tarjeta') || q.includes('transferencia')) {
      appendChatMessage(
        'bot',
        `🚚 <strong>Envíos y Pagos:</strong> Enviamos a toda Colombia y al exterior 🌎. El valor del envío te lo confirma un asesor según tu ciudad o país.<br><br>
        💳 <strong>Pagos:</strong> Recibimos tarjeta de crédito por nuestro link seguro (Colombia y exterior), transferencia bancaria u otros medios por WhatsApp.`
      );
      return;
    }
    if (q.includes('asesor') || q.includes('whatsapp') || q.includes('telefono')) {
      appendChatMessage(
        'bot',
        `👤 <strong>Nuestros canales oficiales de WhatsApp:</strong><br>
        • <a href="https://wa.me/573104337951?text=Hola%2C%20vengo%20del%20cat%C3%A1logo%20Cauchos%20KSM." target="_blank" style="color:var(--wa);font-weight:700;">Tienda Al Detal (310 433 7951) ↗</a><br>
        • <a href="https://wa.me/573162599541?text=Hola%2C%20vengo%20del%20cat%C3%A1logo%20Cauchos%20KSM." target="_blank" style="color:var(--wa);font-weight:700;">Mayorista (316 259 9541) ↗</a><br>
        • <a href="https://wa.me/573222604729?text=Hola%2C%20vengo%20del%20cat%C3%A1logo%20Cauchos%20KSM." target="_blank" style="color:var(--wa);font-weight:700;">Tienda Neox (322 260 4729) ↗</a>`
      );
      return;
    }

    // 3. Búsqueda directa de productos en el catálogo
    const matches = DATA.filter(p => matchesSearchQuery(p, text) && p.v !== 'AGOTADO').slice(0, 5);
    if (matches.length > 0) {
      switchWorkspaceTab('dijes');
      state.query = text;
      const qInp = document.getElementById('q');
      if (qInp) qInp.value = text;
      updateClearSearchBtn();
      renderProductCatalog();

      appendChatMessage(
        'bot',
        `Encontré <strong>${matches.length}+</strong> referencias para "<em>${escapeHtml(text)}</em>" y filtré el catálogo por ti:<br>` +
        matches.map(m => `• <strong>#${m.i} ${escapeHtml(m.n)}</strong> (${m.v})`).join('<br>')
      );
      return;
    }

    appendChatMessage(
      'bot',
      `No encontré una coincidencia exacta para "${escapeHtml(text)}", pero puedes usar los filtros de línea arriba o consultar directamente con un asesor en WhatsApp.`
    );
  }

  // Cambio entre las 2 Pestañas Principales (Dijes e Insumos vs Pedido de Bolas de Neopreno)
  function switchWorkspaceTab(tabName) {
    const isNeo = tabName === 'neopreno';
    const dijesPanel = document.getElementById('workspaceDijesPanel');
    const neoPanel = document.getElementById('workspaceNeoprenoPanel');
    const btnDijes = document.getElementById('tabBtnDijes');
    const btnNeo = document.getElementById('tabBtnNeopreno');

    if (dijesPanel) dijesPanel.style.display = isNeo ? 'none' : 'block';
    if (neoPanel) neoPanel.style.display = isNeo ? 'block' : 'none';
    if (btnDijes) btnDijes.classList.toggle('active', !isNeo);
    if (btnNeo) btnNeo.classList.toggle('active', isNeo);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================================
  // INICIALIZACIÓN DE EVENTOS DEL DOM
  // ==========================================================================
  function initApp() {
    loadPersistedState();

    // Sincronizar campos del cliente con el estado cargado
    const custFields = [
      ['custName', 'name'],
      ['custPhone', 'phone'],
      ['custCity', 'city'],
      ['custIdNum', 'idNum'],
      ['custAddress', 'address']
    ];
    custFields.forEach(([domId, key]) => {
      const el = document.getElementById(domId);
      if (el) {
        el.value = state.customer[key] || '';
        el.addEventListener('input', () => {
          state.customer[key] = el.value;
          if (key === 'name' && el.value.trim().length >= 2) {
            el.classList.remove('invalid');
            const w = document.getElementById('custNameWarn');
            if (w) w.style.display = 'none';
          }
          savePersistedState();
        });
      }
    });

    // Renderizar controles iniciales, catálogo y estudio de neopreno
    renderAllCatalogControls();
    renderProductCatalog();
    renderNeoprenoStudio();
    renderNeoAddedMiniList();
    updateCartBar();

    // Eventos de las 2 Pestañas Principales (Dijes vs Neopreno)
    const tabBtnDijes = document.getElementById('tabBtnDijes');
    const tabBtnNeopreno = document.getElementById('tabBtnNeopreno');
    if (tabBtnDijes) {
      tabBtnDijes.addEventListener('click', () => switchWorkspaceTab('dijes'));
    }
    if (tabBtnNeopreno) {
      tabBtnNeopreno.addEventListener('click', () => switchWorkspaceTab('neopreno'));
    }
    document.querySelectorAll('.go-neopreno-tab').forEach(btn => {
      btn.addEventListener('click', () => switchWorkspaceTab('neopreno'));
    });
    document.querySelectorAll('.go-dijes-tab').forEach(btn => {
      btn.addEventListener('click', () => switchWorkspaceTab('dijes'));
    });

    // Si la URL entra con #neopreno, activar la pestaña Neopreno
    if (window.location.hash === '#neopreno') {
      switchWorkspaceTab('neopreno');
    }

    // Botón Desplegable de Filtros Secundarios (⚙️ Filtros y Orden)
    const toggleExtraBtn = document.getElementById('toggleExtraFiltersBtn');
    const extraCollapse = document.getElementById('extraFiltersCollapse');
    if (toggleExtraBtn && extraCollapse) {
      toggleExtraBtn.addEventListener('click', () => {
        const isOpen = extraCollapse.classList.toggle('open');
        toggleExtraBtn.setAttribute('aria-expanded', String(isOpen));
        updateExtraFiltersBadge();
      });
    }

    // Botón rápido "🛒 En mi pedido (X)"
    const quickCartBtn = document.getElementById('quickCartFilterBtn');
    if (quickCartBtn) {
      quickCartBtn.addEventListener('click', () => {
        state.specialFilter = state.specialFilter === 'in-cart' ? 'all' : 'in-cart';
        const specSel = document.getElementById('specialFilterSelect');
        if (specSel) specSel.value = state.specialFilter;
        renderAllCatalogControls();
        renderProductCatalog();
      });
    }

    // Botón Mostrar/Ocultar Tarjetas de Categoría al inicio
    const toggleCatsBtn = document.getElementById('toggleCategoriesShowcaseBtn');
    if (toggleCatsBtn) {
      toggleCatsBtn.addEventListener('click', () => {
        categoriesShowcaseHiddenByUser = !categoriesShowcaseHiddenByUser;
        toggleCatsBtn.textContent = categoriesShowcaseHiddenByUser
          ? 'Mostrar tarjetas de categorías ▼'
          : 'Ocultar tarjetas de categorías ▲';
        renderCategoriesBentoGrid();
      });
    }

    // Buscador #q
    const qInput = document.getElementById('q');
    if (qInput) {
      qInput.addEventListener('input', () => {
        state.query = qInput.value;
        updateClearSearchBtn();
        renderProductCatalog();
      });
    }
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        state.query = '';
        if (qInput) qInput.value = '';
        updateClearSearchBtn();
        renderProductCatalog();
      });
    }

    // Selects de filtros adaptados
    const sizeSelect = document.getElementById('sizeFilterSelect');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', () => {
        state.sizeFilter = sizeSelect.value;
        renderProductCatalog();
      });
    }

    const priceSelect = document.getElementById('priceFilterSelect');
    if (priceSelect) {
      priceSelect.addEventListener('change', () => {
        state.priceFilter = priceSelect.value;
        renderProductCatalog();
      });
    }

    const specialSelect = document.getElementById('specialFilterSelect');
    if (specialSelect) {
      specialSelect.addEventListener('change', () => {
        state.specialFilter = specialSelect.value;
        renderProductCatalog();
      });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        state.sortBy = sortSelect.value;
        renderProductCatalog();
      });
    }

    const hideSoldOutCheck = document.getElementById('hideSoldOutCheck');
    if (hideSoldOutCheck) {
      hideSoldOutCheck.addEventListener('change', () => {
        state.hideSoldOut = hideSoldOutCheck.checked;
        const lbl = hideSoldOutCheck.closest('.toggle-chip');
        if (lbl) lbl.classList.toggle('active', state.hideSoldOut);
        renderProductCatalog();
      });
    }

    // Switcher de vista Grid / Compacta
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.viewMode = btn.getAttribute('data-view');
        document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderProductCatalog();
      });
    });

    // Limpiar todos los filtros
    const clearAllBtn = document.getElementById('clearAllFiltersBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', resetAllFilters);
    }

    // Controles del Estudio de Neopreno
    const neoColorSearch = document.getElementById('neoColorSearchInput');
    if (neoColorSearch) {
      neoColorSearch.addEventListener('input', () => {
        state.neoForm.colorSearch = neoColorSearch.value;
        renderNeoprenoStudio();
      });
    }

    const neoCustomColor = document.getElementById('neoCustomColorInput');
    if (neoCustomColor) {
      neoCustomColor.addEventListener('input', () => {
        state.neoForm.customColor = neoCustomColor.value;
        state.neoForm.dirty = true;
        renderNeoprenoStudio();
      });
    }

    const neoMetalSelect = document.getElementById('neoMetalSelect');
    if (neoMetalSelect) {
      neoMetalSelect.addEventListener('change', () => {
        state.neoForm.metal = neoMetalSelect.value;
        state.neoForm.dirty = true;
        renderNeoprenoStudio();
      });
    }

    const neoQtyInput = document.getElementById('neoQtyInput');
    if (neoQtyInput) {
      neoQtyInput.addEventListener('input', () => {
        state.neoForm.qty = Math.max(1, parseInt(neoQtyInput.value, 10) || 1);
        state.neoForm.dirty = true;
        renderNeoprenoStudio();
      });
    }

    document.querySelectorAll('.qty-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qVal = parseInt(btn.getAttribute('data-q'), 10);
        state.neoForm.qty = qVal;
        if (neoQtyInput) neoQtyInput.value = qVal;
        state.neoForm.dirty = true;
        renderNeoprenoStudio();
      });
    });

    const addNeoBtn = document.getElementById('addNeoToOrderBtn');
    if (addNeoBtn) {
      addNeoBtn.addEventListener('click', addCurrentNeoprenoToQuote);
    }

    // Botones para abrir el modal de Cotización
    document.querySelectorAll('.open-quote-btn').forEach(btn => {
      btn.addEventListener('click', openQuoteDrawer);
    });

    // Botones para abrir el modal de Pantallazo
    document.querySelectorAll('.open-pantallazo-btn').forEach(btn => {
      btn.addEventListener('click', openPantallazoModal);
    });

    // Botón para abrir Hub de Catálogos Canva
    document.querySelectorAll('.open-catalogs-hub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = document.getElementById('catalogsHubModal');
        if (m) m.classList.add('open');
      });
    });

    // Cerrar modales
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close-modal');
        const m = document.getElementById(targetId);
        if (m) m.classList.remove('open');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });

    // Botones de envío a WhatsApp (Tienda, Mayorista, Neox)
    document.querySelectorAll('.send-wa-channel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.getAttribute('data-phone');
        sendOrderToWhatsAppChannel(phone);
      });
    });

    // Copiar texto del pedido
    const copyTextBtn = document.getElementById('copyOrderTextBtn');
    if (copyTextBtn) {
      copyTextBtn.addEventListener('click', async () => {
        if (!validateCustomerName()) return;
        const txt = buildWhatsAppOrderText();
        try {
          await navigator.clipboard.writeText(txt);
          showToast('📋 Texto de la cotización copiado al portapapeles.');
        } catch (e) {
          showToast('Selecciona el canal de WhatsApp para enviar el mensaje.');
        }
      });
    }

    // Vaciar pedido
    const clearOrderBtn = document.getElementById('clearOrderBtn');
    if (clearOrderBtn) {
      clearOrderBtn.addEventListener('click', () => {
        if (!window.confirm('¿Deseas vaciar todos los productos y líneas de neopreno de tu cotización actual?')) return;
        state.cart = {};
        state.cnote = {};
        state.neo = [];
        savePersistedState();
        renderProductCatalog();
        renderNeoAddedMiniList();
        updateCartBar();
        renderQuoteDrawerContent();
        showToast('Cotización vaciada.');
      });
    }

    // Copiar, Descargar Imagen del Pantallazo y Descargar PDF
    const copyImgBtn = document.getElementById('copyCanvasImgBtn');
    if (copyImgBtn) {
      copyImgBtn.addEventListener('click', copyCanvasImageToClipboard);
    }
    const dlImgBtn = document.getElementById('downloadCanvasImgBtn');
    if (dlImgBtn) {
      dlImgBtn.addEventListener('click', downloadCanvasAsPng);
    }
    document.querySelectorAll('.download-pdf-btn').forEach(btn => {
      btn.addEventListener('click', downloadOrderAsPdf);
    });

    // Tema claro / oscuro
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('ksm_theme', next); } catch (e) {}
      });
    }

    // Botón Ir al Inicio (#toTop)
    const toTopBtn = document.getElementById('toTopBtn');
    if (toTopBtn) {
      window.addEventListener('scroll', () => {
        toTopBtn.classList.toggle('visible', window.scrollY > 500);
      }, { passive: true });
      toTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Asistente KSM
    const fabAssistant = document.getElementById('fabAssistantBtn');
    const assistantDrawer = document.getElementById('assistantDrawer');
    const closeAssistant = document.getElementById('closeAssistantBtn');
    if (fabAssistant && assistantDrawer) {
      fabAssistant.addEventListener('click', () => {
        assistantDrawer.classList.toggle('open');
      });
    }
    if (closeAssistant && assistantDrawer) {
      closeAssistant.addEventListener('click', () => {
        assistantDrawer.classList.remove('open');
      });
    }

    document.querySelectorAll('.assistant-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        handleAssistantQuery(btn.getAttribute('data-ask'));
      });
    });

    const assistantSendBtn = document.getElementById('assistantSendBtn');
    const assistantInput = document.getElementById('assistantInput');
    if (assistantSendBtn && assistantInput) {
      assistantSendBtn.addEventListener('click', () => {
        handleAssistantQuery(assistantInput.value);
        assistantInput.value = '';
      });
      assistantInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          handleAssistantQuery(assistantInput.value);
          assistantInput.value = '';
        }
      });
    }

    // Poblar el Hub de Catálogos Oficiales de Canva
    const hubGrid = document.getElementById('catalogsHubGrid');
    if (hubGrid) {
      hubGrid.innerHTML = CATALOGS_HUB.map(c => `
        <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener" class="prod-card" style="text-decoration:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="min-order-pill">${escapeHtml(c.tag)}</span>
            <span style="color:var(--cat);font-weight:800;font-size:13px;">Abrir ↗</span>
          </div>
          <div style="font-weight:800;font-size:15.5px;color:var(--fg);margin-top:4px;">📷 ${escapeHtml(c.title)}</div>
          <div style="font-size:13px;color:var(--muted);">${escapeHtml(c.sub)}</div>
        </a>
      `).join('');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
