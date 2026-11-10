# Documentación Completa del Proyecto — Catálogo y Cotizador Cauchos KSM

> **Versión del Sistema:** 5.0 (Actualizada con interfaz responsive mobile-first, 0 emojis, diseño no genérico, iconografía Material Symbols Outlined, selector interactivo de baño de metal, estudio 3D de neopreno con 786 colores, consola de filtros progresiva y exportación a WhatsApp).
> **Fecha:** Noviembre 2026.
> **Empresa:** Cauchos KSM · Joyería y Bisutería (Colombia).

---

## 1. Resumen Ejecutivo y Ficha Técnica

| Parámetro | Detalle |
|---|---|
| **Nombre oficial** | Catálogo Interactivo y Cotizador Oficial Cauchos KSM |
| **Tipo de aplicación** | Single Page Application (SPA) estática optimizada para e-commerce conversacional vía WhatsApp. Funciona 100% en el navegador del cliente sin backend ni base de datos centralizada. |
| **Moneda oficial** | Peso Colombiano (**COP**), formateado bajo locale `es-CO` (ej. `$30.000 COP`). |
| **Pedido mínimo** | **$30.000 COP** para bisutería e insumos (combinable entre neopreno, dijes, hilos, piedras, balines y aretes). |
| **Público objetivo** | Clientes mayoristas, joyeros, artesanos y compradores al detal en Colombia e internacionalmente. Tráfico predominante (>80%) desde dispositivos móviles (smartphones). |
| **Repositorio GitHub** | `https://github.com/Huesly/catalogoksm` (Rama `main`). |
| **Archivos del proyecto** | `index.html` (estructura semántica), `styles.css` (hoja de estilos y tokens), `app.js` (lógica de estado y eventos), `data.js` (base de datos de 1.179 productos y neopreno), `Catalogo_Cauchos_KSM_Standalone.html` (distribuible autónomo 100% autocontenido de ~584 KB). |
| **Librerías externas (CDN)** | Google Fonts (`Plus Jakarta Sans`, `Inter`, `Material Symbols Outlined`), `jsPDF 2.5.1` (descarga de PDF), `html2canvas 1.4.1` (captura gráfica). |

---

## 2. Paleta de Colores Oficial (Design Tokens)

El sistema visual de Cauchos KSM respeta estrictamente la identidad corporativa definida en la documentación institucional, implementada mediante variables CSS (`:root`) tanto para modo claro como para modo oscuro adaptativo (`prefers-color-scheme` o selector manual `[data-theme="dark"]`).

### 2.1 Tokens Principales del Sistema

| Token CSS | Modo Claro | Modo Oscuro | Uso Semántico y Reglas de Aplicación |
|---|---|---|---|
| `--bg` | `#F6F4EF` | `#12191C` | Fondo principal de la aplicación. Tono crema cálido artesanal que reduce la fatiga visual. |
| `--bg-elevated` | `#EFECE4` | `#162024` | Fondo de contenedores secundarios y cintas desplazables. |
| `--card` | `#FFFFFF` | `#1A2428` | Superficie de tarjetas de producto, modales y consolas. |
| `--card-hover` | `#FCFBF9` | `#212E33` | Estado hover de tarjetas de producto y botones suaves. |
| `--fg` | `#1F2A2E` | `#ECE7DC` | Texto primario de alto contraste y títulos principales. |
| `--fg-secondary` | `#39484E` | `#C8C2B4` | Texto secundario y etiquetas de soporte. |
| `--muted` | `#5E6A6E` | `#A3ADB0` | Metadatos, tarifas por volumen, calibres y ayudas. |
| `--line` | `#E3DED3` | `#2C3A3F` | Bordes sutiles y divisores estructurales. |
| `--line-strong` | `#CFC8B8` | `#3D4F56` | Bordes de inputs, controles de búsqueda y bordes activos. |
| `--teal` | `#2F4A55` | `#9FC3CF` | **Verde Azulado Institucional KSM:** Color de marca principal. Títulos de cabecera, botón de acción primaria, encabezados de modales y acentos corporativos. |
| `--teal-hover` | `#233841` | `#B8D5DF` | Interacción hover sobre componentes institucionales teal. |
| `--teal-soft` | `#E9F0F2` | `rgba(159,195,207,0.14)` | Fondos de chips activos y badges de categorías. |
| `--onteal` | `#FFFFFF` | `#10181B` | Texto en alto contraste sobre superficies `--teal`. |
| `--gold` | `#9A7220` | `#E2BC63` | **Dorado Institucional KSM:** Eyebrows, subtítulos de sección, acentos de lujo, bordes de foco y números de paso. |
| `--gold-bright` | `#C69632` | `#F0CF7B` | Variante luminosa del dorado para estados activos. |
| `--goldsoft` | `#F3E7C9` | `#3A3220` | **Dorado Suave:** Fondo de fila/tarjeta con producto agregado al pedido, cajas de información y alertas clave. |
| `--gold-border` | `#DEC484` | `#6B582D` | Borde de productos agregados al pedido. |
| `--cat` | `#C8691C` | `#F29A4A` | **Naranja Quemado:** Color exclusivo asignado a botones de apertura de catálogos fotográficos en Canva ("Ver catálogo con fotos"). |
| `--cat-hover` | `#A95512` | `#F7B06E` | Hover de botones de catálogo Canva. |
| `--cat-soft` | `#FDF1E6` | `rgba(242,154,74,0.15)` | Píldoras de aviso sobre Canva y fotos de referencia. |
| `--oncat` | `#FFFFFF` | `#1A1008` | Texto sobre naranja quemado. |
| `--hi` | `#F28C1B` | `#FFA53D` | **Naranja Destacado:** Color reservado para el ecosistema de Bolas de Neopreno, botones "AGREGAR NEOPRENO" y llamadas clave a la acción. |
| `--onhi` | `#2A1600` | `#2A1600` | Texto sobre naranja destacado. |
| `--hidark` | `#B8620A` | `#C26F12` | Sombra inferior 3D del botón de adición de neopreno. |
| `--hi-soft` | `#FFF4E5` | `rgba(255,165,61,0.14)` | Píldoras del estudio de neopreno. |
| `--wa` | `#1E8E4E` | `#3CC57A` | **Verde WhatsApp:** Botones de despacho directo a WhatsApp, confirmación y cierre de cotización. |
| `--wa-hover` | `#17723E` | `#57D38F` | Hover sobre botones de WhatsApp. |
| `--wa-soft` | `#E8F6EE` | `rgba(60,197,122,0.15)` | Fondos de confirmación de pedido y éxito. |
| `--onwa` | `#FFFFFF` | `#08140D` | Texto sobre verde WhatsApp. |
| `--warn` | `#A3242F` | `#F08A92` | Rojo para etiquetas de "AGOTADO", advertencia de nombre obligatorio y validaciones críticas. |
| `--warnsoft` | `#F8E3E3` | `#3A2023` | Fondo de cajas de advertencia y etiquetas de agotado. |
| `--info` | `#5B4E1A` | `#E7D490` | Avisos informativos secundarios. |
| `--shade` | `rgba(20,28,31,0.45)` | `rgba(0,0,0,0.6)` | Velo de fondo oscuro para modales (backdrop). |

### 2.2 Colores de Baños Metálicos (Selector de Color / Acabado)
Los dijes y herrajes cuentan con selector de baño directo que inyecta el acabado seleccionado en la nota del producto:
- **Dorado:** Fondo `#F3D46B`, Borde `#B8892B`.
- **Plateado:** Fondo `#E4E7EA`, Borde `#8A9399`.
- **Negro:** Fondo `#222222`, Borde `#000000`, Texto `#FFFFFF`.
- **Rosado (Rose Gold):** Fondo `#F2C1B6`, Borde `#C27C6E`.

### 2.3 Colores de Identidad Nacional y Exportación de Tarjeta
- **Bandera de Colombia:** Amarillo `#FCD116` (50%), Azul `#003893` (25%), Rojo `#CE1126` (25%).
- **Tarjeta Pantallazo (Canvas 1080 px):** Fondo `#E9E5DC`, Tarjeta `#FFFFFF`, Texto `#1F2A2E`, Acento Teal `#2F4A55`, Dorado `#9A7220`, Filas pares `#F4F6F7`, Total `#F3E7C9`, Pie `#F2EEE6`.

---

## 3. Sistema Tipográfico e Iconografía

### 3.1 Tipografías

```css
--font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

1. **`Plus Jakarta Sans` (Display & Títulos):**
   - Utilizada en el logotipo, cabecera principal (`h1`), títulos de sección (`h2`), nombres de referencias en tarjetas y encabezados de modales.
   - Pesos implementados: `500` (Medium), `600` (SemiBold), `700` (Bold) y `800` (ExtraBold).
   - Aporta modernidad, carácter artesanal y un acabado limpio no genérico.

2. **`Inter` (Cuerpo, UI y Números):**
   - Empleada para todo el contenido de lectura, descripciones, stepper numérico, etiquetas de inputs, tabla de tarifas por volumen y listas de pedido.
   - Pesos implementados: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold).
   - Optimiza la legibilidad en pantallas retina y pantallas pequeñas de celular. Los valores monetarios y contadores numéricos utilizan la clase auxiliar `.num` para espaciado tabular alineado.

3. **Escala Modular de Tamaños:**
   - **Hero H1:** `clamp(24px, 5.5vw, 36px)`, interlineado `1.15`, tracking `-0.025em`.
   - **Título de Sección H2:** `clamp(18px, 4vw, 24px)`.
   - **Nombre de Producto en Tarjeta:** `15px`, peso `700`.
   - **Cuerpo Base:** `14.5px` (desktop) / `14px` (móvil), interlineado `1.5`.
   - **Eyebrow / Subtítulos:** `11.5px`, mayúsculas con espaciado de tracking `0.08em` a `0.14em`.
   - **Inputs de Formulario:** `16px` para evitar el zoom involuntario de Safari en iOS.

### 3.2 Iconografía (Norma Estricta: 0 Emojis)
Por requerimiento expreso de diseño UI/UX profesional, **se erradicaron los 85 emojis del catálogo**, sustituyéndolos al 100% por glifos vectoriales de Google Fonts:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
```

- Todos los iconos se renderizan mediante la clase `.material-symbols-outlined` con soporte para variantes `.icon-sm` (16-18 px) y alineación óptica vertical.
- Ejemplos de mapeo:
  - Carrito / Cotización: `receipt_long`, `shopping_bag`.
  - Neopreno: `radio_button_checked`.
  - Catálogos Canva: `photo_library`, `photo_camera`.
  - WhatsApp: `chat`.
  - Filtros y Búsqueda: `search`, `mic`, `tune`, `filter_alt_off`.
  - Categorías: `diamond` (Dijes), `auto_awesome` (Religiosos), `local_florist` (Candongas), `spa` (Van Cleef), `crown` (Coronas).

---

## 4. Estructura y Arquitectura de la Página (DOM & Componentes)

La aplicación sigue una arquitectura SPA organizada en capas lógicas:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Toast Notifications Container (#toastContainer)              │
├─────────────────────────────────────────────────────────────────┤
│ 2. Topbar Minimalista (.topbar)                                 │
│    - Bandera Colombia + Eyebrow institucional                   │
│    - Botones: Catálogos Canva (12) | Configurar Neopreno |       │
│      Joyería 18K | Selector de Tema Claro/Oscuro                │
├─────────────────────────────────────────────────────────────────┤
│ 3. Cabecera Hero (.hero-clean)                                  │
│    - Emblema KSM Cauchos                                        │
│    - Eyebrow de pedido mínimo $30.000 COP                       │
│    - H1 Catálogo de Dijes, Insumos y Neopreno                   │
│    - Acceso rápido a Ver mi cotización (con contador activo)    │
├─────────────────────────────────────────────────────────────────┤
│ 4. Pestañas Principales (.workspace-tabs)                       │
│    [ Pestaña 1: Dijes e Insumos ]   [ Pestaña 2: Neopreno ]     │
├─────────────────────────────────────────────────────────────────┤
│ 5. PESTAÑA 1: CATÁLOGO DE DIJES E INSUMOS                       │
│    5.1 Consola de Filtros Progresiva Sticky (.filter-console)   │
│        - Buscador en vivo con debounce + Reconocimiento de Voz  │
│        - Botón "En mi pedido (N)"                               │
│        - Botón "Filtros" (abre cajón de orden/precios/medidas)   │
│        - Toggle "Tarjetas / Lista" (modo mayorista)             │
│        - Píldora de total de referencias filtradas              │
│        - Chips de búsqueda rápida móvil (Coronas, San Benito...)│
│        - Cinta deslizante de las 11 Líneas                      │
│        - Cinta progresiva de Subcategorías (solo al elegir línea)│
│    5.2 Bento Grid de Tarjetas Visuales de Categorías            │
│    5.3 Banner contextual de la línea seleccionada               │
│    5.4 Listado de Productos (#catalogListContainer)             │
│        - Agrupado por Línea y Subsección                        │
│        - Tarjeta de producto: Nombre, Medida, Ref Canva,        │
│          Chips de Baño de Metal (Dorado, Plateado...),          │
│          Campo para letras/hilos, Stepper - [input] +           │
├─────────────────────────────────────────────────────────────────┤
│ 6. PESTAÑA 2: ESTUDIO DE BOLAS DE NEOPRENO                      │
│    6.1 Columna de Configuración:                                │
│        - Paso 1: Grid de 13 Referencias (RF2 a RF18)            │
│        - Paso 2: Selector de Calibre (# Bola en mm) + Tarifas   │
│        - Paso 3: Selector visual de 786 Colores + Buscador      │
│        - Paso 4: Selector de Color de Aro Metálico (en RF c/aro)│
│    6.2 Columna de Previsualización:                             │
│        - Renderizador 3D SVG de la bola en tiempo real          │
│        - Enlace directo a la página fotográfica en Canva        │
│        - Selector de cantidad con presets (12, 50, 100, 1000)   │
│        - Botón AGREGAR NEOPRENO AL PEDIDO                       │
├─────────────────────────────────────────────────────────────────┤
│ 7. Pie de Página Institucional (.site-footer)                   │
├─────────────────────────────────────────────────────────────────┤
│ 8. Barra Fija Inferior de Cotización (#cartbar)                 │
│    - Total acumulado COP + N productos                          │
│    - Medidor visual progresivo del mínimo ($30.000 COP)         │
│    - Botón "Tarjeta / Pantallazo"                               │
│    - Botón "Ver y Enviar a WhatsApp"                            │
├─────────────────────────────────────────────────────────────────┤
│ 9. Utilidades Flotantes (.floating-utils)                       │
│    - Botón Ir Arriba (#toTopBtn)                                │
│    - Botón Asistente KSM (#fabAssistantBtn)                     │
│    - Cajón del Asistente Virtual Concierge (#assistantDrawer)   │
├─────────────────────────────────────────────────────────────────┤
│ 10. Modales del Sistema                                         │
│    10.1 Modal "Tu Cotización / Pedido" (#quoteSheetModal)       │
│    10.2 Modal Tarjeta Imagen / Pantallazo (#pantallazoModal)    │
│    10.3 Modal de Escala Real en Milímetros (#refScaleModal)     │
│    10.4 Modal Hub de los 12 Catálogos Canva (#catalogsHubModal) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. El Catálogo de Productos y Modelo de Datos

### 5.1 Estructura de las 11 Líneas del Catálogo

| # | Línea Oficial | Subsecciones | Productos | Catálogo Fotográfico Canva |
|---|---|---|---|---|
| **1** | **Dijes de Rodio** | 16 | 270 | [Canva Rodio](https://www.canva.com/design/DAGqDQOwlGc/E-rr06EkaxPSJN5lanE9nw/view?utlId=hb6789571a5#4) |
| **2** | **Línea Económica** | 2 | 97 | [Canva Económica](https://www.canva.com/design/DAGqDQOwlGc/E-rr06EkaxPSJN5lanE9nw/view?utlId=hb6789571a5#37) |
| **3** | **Dijes de Acero** | 9 | 121 | [Canva Acero](https://www.canva.com/design/DAGqDQOwlGc/E-rr06EkaxPSJN5lanE9nw/view?utlId=hb6789571a5#47) |
| **4** | **Aretería** | 5 | 200 | [Canva Aretería](https://www.canva.com/design/DAG6ddmaU1g/-MGAhu6BNKj-VZgWvQpUnw/view?utlId=hd2aaca2614) |
| **5** | **Dijes de Oro Laminado** | 11 | 251 | [Canva Oro Laminado](https://www.canva.com/design/DAGu1-l6yWk/1-OKgmnGH753NfCbi5l11A/view?utlId=h377c089cd1) |
| **6** | **Pulseras de Expansión** | 1 | 18 | [Canva Pulseras](https://www.canva.com/design/DAGwi0_tw3U/497wHRwirqxpHhsQwboqwg/view?utlId=h7ef8ba78a1) |
| **7** | **Fimo y Piedras** | 6 | 139 | [Canva Fimo y Piedras](https://www.canva.com/design/DAGxGr5Opp8/_XxjyCDY5IReU8CfKbuM3w/view?utlId=h927c7fde8f) |
| **8** | **Hilos** | 4 | 19 | [Canva Hilos](https://www.canva.com/design/DAG7919S-Z0/FTITqZew4HkdKH9IghKA5g/view?utlId=h063d365bbb) |
| **9** | **Balines Oro Laminado** | 4 | 34 | Fotos base64 embebidas / Canva general |
| **10** | **Balines de Rodio** | 3 | 15 | Sin foto individual (Venta por unidad / docena) |
| **11** | **Balines de Acero** | 3 | 15 | Sin foto individual (Venta por unidad / docena) |
| **TOTAL** | **11 Líneas** | **59 Subsecciones** | **1.179 Referencias** | **12 Enlaces oficiales** |

### 5.2 Esquema del Objeto de Producto (`DATA[i]`)

```javascript
{
  i: 142,                       // ID numérico único correlativo (clave del carrito)
  l: "Dijes de Rodio",          // Línea principal
  s: "Calaveras y Gladiador",   // Subsección temática
  p: 8,                         // Número de página en el catálogo Canva
  n: "Gladiador Romano Circon", // Nombre descriptivo del producto
  t: "14x18 mm",                // Calibre / Medida física
  v: "$4.500",                  // Valor formateado o "AGOTADO"
  k: 4500,                      // Precio numérico unitario en COP (0 = sin precio/agotado)
  o: "1 a 11 und $4.500 · 12+ und $4.000", // Tarifa por volumen
  u: "https://www.canva.com/..." // URL base específica de Canva si difiere de la línea
}
```

---

## 6. Ecosistema de Bolas de Neopreno (13 Referencias · 786 Colores)

El estudio de neopreno permite configurar piezas por combinación de **Referencia (RF) + Diámetro (# Bola en mm) + Número y Nombre de Color + Acabado del Aro Metálico**.

### 6.1 Matriz de Referencias y Características

| Ref. | Nombre Técnico | Calibres Disponibles (mm) | Colores | Requiere Aro Metálico |
|---|---|---|---|---|
| **RF3** | Bola Lisa | 3, 4, 5, 6, 7, 8, 10 | 54 | No |
| **RF2** | Bola con 3 Ranuras | 4, 5, 6, 7, 8, 10 | 50 | No |
| **RF5** | Bola + Aro 1,5 mm | 6, 8 | 67 | **Sí** (Dorado, Plateado, Rosado...) |
| **RF6** | Bola con Aro 1,5 + 2 Argollas | 6, 8 | 81 | **Sí** |
| **RF7** | Bola con 3 Argollas | 8 | 58 | **Sí** |
| **RF10** | Bola con 2 Argollas | 6, 8 | 56 | **Sí** |
| **RF11** | Bola + 1 Argolla | 5, 6, 8 | 90 | **Sí** |
| **RF12** | Camufladas | 4, 5, 6, 7, 8, 10 | 147 | No |
| **RF13** | Pimienta | 4, 5, 6, 7, 8, 10 | 49 | No |
| **RF14** | Candy | 4, 5, 6, 7, 8, 10 | 27 | No |
| **RF15** | Zebra | 6, 8 | 60 | No |
| **RF17** | Volcánica | 6, 8 | 20 | No |
| **RF18** | Bandera | 6, 8 | 27 | No |

### 6.2 Escala de Tarifas por Tramo de Cantidad (COP / Unidad)

El sistema recalcula el valor unitario automáticamente de acuerdo a la cantidad ingresada:
1. **Tramo 1 (12 a 99 unidades):** Tarifa por docena. *(Algunas referencias de alta demanda exigen compra mínima de 100 unidades y no se comercializan en este tramo).*
2. **Tramo 2 (100 a 499 unidades):** Tarifa mayorista por cien.
3. **Tramo 3 (500 a 999 unidades):** Tarifa medio mayoreo.
4. **Tramo 4 (1.000+ unidades):** Tarifa por millar (mejor precio garantizado).

*Ejemplos representativos de tarifa base:*
- **RF3 (Bola Lisa 6 mm):** 12-99: `$150` | 100-499: `$110` | 500-999: `$75` | 1.000+: `$70` COP.
- **RF2 (Bola 3 Ranuras 8 mm):** 12-99: `$200` | 100-499: `$150` | 500-999: `$150` | 1.000+: `$120` COP.
- **RF5 (Bola + Aro 1,5 en 8 mm):** 12-99: `$800` | 100-499: `$600` | 500-999: `$600` | 1.000+: `$500` COP.
- **RF6 (Aro 1,5 + 2 Argollas en 8 mm):** 12-99: `$1.000` | 100-499: `$800` | 500-999: `$800` | 1.000+: `$750` COP.

---

## 7. Canales Oficiales de Despacho y Reglas de Negocio

### 7.1 Directorio de Contacto WhatsApp

La cotización se despacha directamente a los chats oficiales del equipo comercial de Cauchos KSM:

| Canal | Número Internacional | Destinatario y Función |
|---|---|---|
| **Tienda (Detal)** | `+57 310 433 7951` | Atención a compras minoristas, bisutería al detal y asesoría personalizada. |
| **Mayorista** | `+57 316 259 9541` | Asesoría de compras por volumen, millares de neopreno y pedidos comerciales. |
| **Tienda Neox** | `+57 322 260 4729` | Línea especializada Neox para orings, herrajes y pedidos especiales. |

### 7.2 Reglas de Negocio Implementadas

1. **Pedido Mínimo:** `$30.000 COP`. La barra inferior `#cartbar` muestra un medidor con porcentaje de llenado y alerta visual si el subtotal acumulado es inferior.
2. **Validación de Nombre del Cliente:** Es **estrictamente obligatorio** ingresar el nombre del cliente (mínimo 2 caracteres). Si el campo `#custName` está vacío, el sistema bloquea los botones de envío a WhatsApp, despliega la advertencia `#custNameWarn` y hace scroll automático al campo.
3. **Guardia Anti-Olvido de Neopreno (`neoGuard`):** Si el usuario interactuó con el formulario de neopreno seleccionando referencia, color y cantidad pero abre el pedido sin hacer clic en "AGREGAR NEOPRENO", el sistema emite una alerta confirmando si desea añadir la pieza antes de generar el resumen.
4. **Selector Interactivo de Baño de Metal:** Al hacer clic en un chip de acabado metálico (Dorado, Plateado, Negro, Rosado) en cualquier producto:
   - Se inyecta inmediatamente el texto en el campo de notas del producto.
   - Si la cantidad estaba en 0, se auto-incrementa a 1.
   - El chip queda resaltado con estilo `.metal-chip.active`.
   - Se guarda el estado en el carrito y se actualiza el contador.

---

## 8. Formatos de Salida de la Cotización

El cliente puede despachar o respaldar su pedido en 3 modalidades independientes:

### 8.1 Mensaje de Texto Enriquecido para WhatsApp
Se genera mediante URI encodeada (`https://api.whatsapp.com/send?phone=...&text=...`):
- Encabezado con datos del cliente (Nombre, Teléfono, Ciudad, Cédula, Dirección de entrega).
- Detalle línea por línea con cantidad, nombre, baño seleccionado o desglose de letras, medida física y subtotal en COP.
- Sección dedicada de bolas de neopreno desglosadas por `REF + Calibre mm + # Color y Nombre + Color de Aro + Cantidad + Subtotal`.
- Subtotal consolidado en COP y nota de verificación de existencias.

### 8.2 Tarjeta Gráfica "Pantallazo" (Canvas 1080 px)
Diseñada especialmente para contrarrestar errores tipográficos en WhatsApp:
- Renderiza un recibo visual de alta resolución en un elemento `<canvas>` de 1080 px de ancho.
- Incluye membrete con la bandera de Colombia, logotipo de Cauchos KSM, fecha/hora, datos del cliente y tabla cebra contrastada.
- Ofrece el botón **"COPIAR LA FOTO DE MI PEDIDO"** que utiliza la API `navigator.clipboard.write([new ClipboardItem(...)])` para pegar la imagen directamente en la conversación de WhatsApp.
- Botón adicional para descargar en archivo `.png`.

### 8.3 Documento PDF Descargable
Generado en el cliente utilizando la librería `jsPDF`:
- Archivo estructurado listo para imprimir o enviar como documento adjunto (`clip 📎 → Documento`).
- Incluye numeración de página y firma legal de derechos reservados de Cauchos KSM.

---

## 9. Próximas Mejoras en Curso

1. **Replicación de Modelos de Bolas desde Canva (RF2 a RF18):**
   - Integración con las skills instaladas (`canvas-design`, `frontend-design`, `theme-factory`).
   - Calibración de ranuras exactas (RF2), cortes de estrías, anillos metálicos fotorealistas (RF5 a RF11) y patrones complejos (Camufladas RF12, Pimienta RF13, Candy RF14, Zebra RF15, Volcánica RF17, Bandera RF18).
   - Generación de vistas previas SVG/Canvas con iluminación especular y acabado mate/brillante idéntico al catálogo físico.
