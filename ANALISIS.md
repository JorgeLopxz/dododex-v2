# Análisis a fondo: Dododex vs Wikily — y plan para "DODODEX V2"

> Investigación realizada el 06-07-2026 con agentes web sobre fuentes reales (webs, App Store/Play, Canny de Dododex, ark.wiki.gg, GitHub de ARK Smart Breeding). Nota: la web que llamas "Wikly" es en realidad **Wikily** (wikily.gg), de NX Software.

---

## 1. Resumen ejecutivo

- **Dododex** domina el nicho (12-15M jugadores, 4.9★ con ~50K valoraciones) por una razón: convierte cálculos complejos de tameo en una respuesta instantánea, con datos crowdsourced de 180K+ usuarios. Pero **no tiene nada para DESPUÉS del tameo**: ni inspector de stats post-tame, ni biblioteca de dinos propios, ni árbol genealógico, ni tracker de mutaciones.
- **Wikily** es el complemento casi perfecto: mapas interactivos, tablas de loot con simulador, plantillas de construcción importables in-game, calculadoras TEK/blueprints… pero es diminuta (~51 valoraciones iOS), sin comunidad, sin extractor de stats y con anuncios invasivos.
- **Tu observación es el gap nº1 confirmado**: en el propio tablón de peticiones de Dododex (Canny), las funciones más votadas sin construir son exactamente eso — *"Stat calculator for tamed dinos"* (141 votos, abierta desde **2017**), *"Savable stats / family trees"* (158 votos, desde **2016**), *"Imprint timer"* (150 votos). El creador de Dododex lleva **desde abril de 2021 buscando (y ofreciendo pagar a) un desarrollador JS** para construir el calculador post-tame… y sigue sin existir.
- **La oportunidad**: una app que sea "Dododex + ARK Smart Breeding + Wikily en una sola", centrada en **la gestión de TUS dinos** (dato que aporta el usuario, no la multitud → esquiva el moat de los 350M de tips de Dododex).

---

## 2. Análisis de Dododex

### 2.1 Fortalezas (lo que hay que heredar)
| Fortaleza | Detalle |
|---|---|
| Calculadora de tameo líder | Comida, narcóticos/bio toxin, torpor, tiempo, efectividad, por criatura/nivel/arma. "Mejor que la wiki", ~99% precisa. |
| Respuesta primero, detalle después | Divulgación progresiva: el resultado clave al instante, el desglose en expansores. Es SU secreto de UX. |
| Tips crowdsourced con votos | 350M+ tips, ratings de eficiencia de recolección de 180K+ usuarios. Su moat real. |
| Gratis + offline en móvil | Todo el contenido usable sin conexión y sin cuenta obligatoria. |
| Timers de cría persistentes | Maduración con alarma (y aviso 5 min antes) guardados en local storage, sin login. |
| Cobertura ASA al día | ~240 criaturas ASA, mapas nuevos (Astraeos, Lost Colony). ⚠️ *Mito desmentido: NO le faltan criaturas/mapas ASA.* |

### 2.2 Debilidades (confirmadas con evidencia)
1. **Sin inspector de stats post-tame (TU queja — CONFIRMADA y admitida por ellos)**. Su ayuda oficial dice literalmente: *"Dododex stat calculator is for wild stats ONLY"*. Tras domar, no puedes introducir tu dino y ver cuántos puntos cayeron en cada stat. 141 votos en Canny, "Under Review" desde 2017.
2. **Sin biblioteca de dinos propios**: no puedes guardar tus tameados, ni buscarlos ni compararlos. (Solo un checklist de especies "ya tameadas" desde v2.6, nov-2024 — no guarda stats).
3. **Sin árbol genealógico / tracker de mutaciones**: la gente usa Google Sheets + ARK Smart Breeding (Windows-only). Cita de un usuario en su Canny: *"I want the dododex to be a 1 stop shop"*.
4. **Anuncios = queja nº1**: el banner al refrescarse **resetea la navegación** (el kibble chart vuelve al dino anterior, los tips saltan arriba). Y el Pro de 4,99$ solo quita el banner pequeño — los anuncios a pantalla completa de la ARK Wiki siguen, y Pro **no aplica a la web**. Usuarios se sienten estafados.
5. **Sin cuenta/sync**: timers y checklist viven en local storage; se pierden al cambiar de dispositivo. Nada de compartir con la tribu.
6. **Multiplicadores de servidor incompletos**: solo globales; sin per-stat (`PerLevelStatsMultiplier_*`), lo que rompe los cálculos en servidores boosted (23 votos en Canny).
7. **Desktop de segunda**: la app de Overwolf tiene "muchas menos opciones que la móvil".
8. ⚠️ *Mito desmentido: la UI NO es anticuada* — las reviews la elogian. El problema real de UX son los anuncios, no el diseño.

---

## 3. Análisis de Wikily (wikily.gg)

### 3.1 Fortalezas (lo que hay que heredar)
| Fortaleza | Detalle |
|---|---|
| **Mapas interactivos** | 10 mapas oficiales + ~15 de mods; capas de recursos, spawns, cuevas, artefactos, cajas de loot; zonas de spawn clicables con % exacto. Dododex no tiene NADA de esto. |
| **Tablas de loot + simulador** | 804 tablas en 27 mapas, con % de drop, calidad, chance de blueprint; simulador de apertura de cajas y búsqueda inversa ("¿qué caja dropea este ítem?"). |
| **Plantillas de construcción** | ~1.500 builds de la comunidad subibles/importables in-game con el Template Hammer; categorías, likes, creadores verificados. |
| Suite de calculadoras amplia | TEK (generador/forcefield/clonación), blueprints de armadura/armas, daño, timers de demolición, generador de INI, PNG→PNT. |
| Páginas de criatura unificadas | Taming + breeding + spawn commands + XP + daño + resistencias + hitbox multipliers en una misma página. |
| Player Metrics | Estado de servidores oficiales en vivo, contador de jugadores, buscar amigos. |
| 21+ idiomas, diseño moderno oscuro | Estética actual, jerarquía con cards. |

### 3.2 Debilidades
1. **Sin tips de comunidad**: los consejos son del desarrollador, sin votos. No resolvió el cold-start comunitario.
2. **Sin extractor de stats** (ni siquiera el salvaje de Dododex): solo tabla estática de stats base.
3. **Anuncios "implacables"** (review de App Store: *"unrelenting and constantly interfere"*), premium de pago para quitarlos.
4. **Herramientas fragmentadas**: las calculadoras de taming/breeding solo se llegan desde cada página de criatura; el índice de Tools ni las lista. Mala descubribilidad.
5. **Ecosistema mínimo**: 51 valoraciones iOS, ~80 en Play, ~15-26K instalaciones. Cuentas en "Beta", bug de login con Cloudflare en la app, UX de cuevas del mapa criticada.
6. **Multi-juego** (Palworld, Once Human…): diluye el foco ARK.

---

## 4. Comparativa rápida

| Área | Dododex | Wikily | **Nuestra app** |
|---|---|---|---|
| Calculadora de tameo | ★★★★★ | ★★★★ | Heredar Dododex + presets por servidor |
| Stats de criatura salvaje (extractor) | ★★★★ (solo wild) | ✗ | **Wild + POST-TAME + criados** |
| Stats post-tame / puntos por stat | ✗ | ✗ | **★ Feature estrella** |
| Biblioteca "Mis dinos" | ✗ | ✗ | **Sí, con búsqueda/orden por stat** |
| Árbol genealógico + mutaciones | ✗ | ✗ | **Sí** |
| Timers cría/imprint | Parcial (local) | Calculadora | **Completo + sync en la nube** |
| Mapas interactivos | ✗ | ★★★★ | Heredar Wikily + capas accesibles |
| Loot tables + simulador | ✗ | ★★★★★ | Heredar (fase 2) |
| Plantillas de construcción | ✗ | ★★★★★ | Fase posterior |
| Tips comunidad | ★★★★★ (moat) | ✗ | No competir ahí al inicio; enlazar/planear a largo plazo |
| Anuncios | Invasivos | Invasivos | **Nunca interstitials; nunca resetear navegación** |
| Cuenta + sync + tribu | ✗ | Beta rota | **Sí (opcional, no forzada)** |

---

## 5. La feature estrella: Inspector de stats post-tame + "Mis Dinos"

### 5.1 Por qué es viable (matemática)
La fórmula de stats de ARK es **determinista e invertible** (ark.wiki.gg/wiki/Creature_stats_calculation):

```
V = (B·(1 + Lw·Iw·IwM) · TBHM · (1 + IB·0.2·IBM) + Ta·TaM) · (1 + TE·Tm·TmM) · (1 + Ld·Id·IdM)
```

- `B, Iw, Id, Ta, Tm, TBHM` = constantes por especie · `Lw` = niveles salvajes en el stat · `Ld` = niveles gastados post-tame · `TE` = efectividad · `IB` = imprint% · `*M` = multiplicadores de servidor.
- El usuario introduce los 7 valores de stats + nivel + TE + imprint → resolvemos los pares enteros `(Lw, Ld)` por stat, validando que `Σ Lw` = puntos salvajes del nivel conocido.
- **Referencia probada**: ARK Smart Breeding (open source, MIT) ya lo hace en Windows. Nosotros lo llevamos a web/móvil, donde **no existe ninguna opción** (los consoleros no tienen NADA hoy).

### 5.2 Reglas de implementación críticas (verificadas contra wiki.gg, jun-2026)
- **Ambigüedad**: un valor puede tener varias combinaciones `(Lw, Ld)` válidas → mostrar todas las candidatas y dejar fijar hechos ("nunca subí este stat ⇒ Ld=0"), como hace ASB con sus stats "en amarillo".
- **ASA ≠ ASE — hace falta toggle de versión**:
  - ASA: velocidad NO subible por defecto (ni salvaje ni tame) → Speed no es pool de puntos; ASE sí.
  - ASA: niveles salvajes y mutados en **pools separados** que se heredan juntos; cap de 255 sobre los MUTADOS. ASE: pool combinado, cap 255 sobre los salvajes.
  - Traits ASA (Gene Scanner): Robust +1.5/2.25/3.0% herencia del stat alto; Mutable +1.0/1.5/2.0% mutación. Pluma de Gigantoraptor = sesgo de HERENCIA de stat (hasta 75%), no de color.
- **Mutaciones**: 2.5%×3 rolls = 7.31% con ambos padres <20; **NO se detienen en 20/20** (baja a ~3.7% con un lado elegible). El contador 20 no es un tope real — codificarlo como tope es EL bug clásico.
- Herencia 55/45 se aplica DOS veces: al elegir valor de stat y al elegir padre-fuente de la mutación.
- Imprint: +20% a todos los stats salvo Stamina/Oxígeno/Crafting. El +30% daño/-30% recibido es un bonus SOLO montado por el imprinter — no mezclar en la extracción.
- Bonus de tameo: niveles extra = `floor(nivelSalvaje · TE / 2)`.
- Multiplicadores por servidor: soportar `PerLevelStatsMultiplier_DinoWild/_DinoTamed`, `TamingSpeedMultiplier`, `bUseSingleplayerSettings` (¡aplica multiplicadores ocultos extra!) y **perfiles de servidor guardados** — idealmente importando `Game.ini`/`GameUserSettings.ini`.

### 5.3 Alrededor del extractor
- **Biblioteca "Mis Dinos"**: guardar cada dino con su desglose Lw/Ld/mutaciones, especie, nombre, sexo, colores, servidor; ordenar/filtrar por stat ("¿cuál es mi mejor Rex en Melee?").
- **Árbol genealógico** + contadores de mutación por línea + **planificador de parejas** ("qué pareja combina mis mejores stats").
- **Inventario de criopods**: catálogo buscable de qué hay en cada criofrigo/vault y dónde.
- **Scheduler de imprint**: cuántos cuddles quedan, si el 100% es alcanzable con tu multiplicador de maduración, próxima ventana, qué pide (con alarma).
- **Compartir con la tribu**: biblioteca y timers compartidos (fase 2).

---

## 6. Diseño: "dinosaurio" con gusto, accesible e intuitivo

### 6.1 Concepto visual — "Ámbar y hueso"
- **Dark-first** con ≥4 superficies (fondo, card elevada, sub-card, overlay) — nada de un gris único plano. Modo claro derivado.
- Materiales ARK con sutileza: **ámbar/resina como acento cálido** (ADN fosilizado), **hueso/marfil para neutros**, piedra/metal envejecido como textura de fondo de MUY bajo contraste. Nunca textura detrás de texto.
- La propia ARK abandonó su HUD "de piedra" por uno translúcido "más descansado para la vista" (v256): esa es la lección — evocador, no kitsch. Nada de clip-art de dinos ni tipografías "Jurassic".
- Tipografía: display geométrica/industrial (eco del logo ARK) para títulos y nombres de criatura + sans neutra legible (Inter) para datos. Tamaños en `rem`, control de tamaño de texto para el usuario.
- Silueta del dino como elemento de identidad de cada página de criatura (siluetas propias, ver §8 legal).

### 6.2 Accesibilidad (WCAG 2.2 AA, medible)
- **Los stats de ARK son códigos de color → ese es el frente de accesibilidad nº1.** Paleta categórica **Okabe-Ito** (segura para daltonismo y distinguible en escala de grises): Salud #E69F00 · Estamina #56B4E9 · Oxígeno #0072B2 · Comida #009E73 · Peso #F0E442 · Melee #D55E00 · Velocidad #CC79A7 · Torpor neutro.
- **Nunca color solo** (WCAG 1.4.1): cada stat siempre con icono + etiqueta de texto. Prohibido rojo/verde como única codificación.
- Contraste 4.5:1 texto / 3:1 UI (7:1 en chips de datos si es posible); focus visible ≥2px con ≥3:1; targets ≥24×24px; navegación 100% teclado; texto reescalable 200% con reflow.
- **Navegación inferior** (pulgar) + bottom sheets para detalle: ~75% del uso móvil es a una mano y el 40% superior de la pantalla es zona muerta.
- Patrón "respuesta primero": resultado del cálculo en card grande tipo bento; desgloses en expansores.
- Indicador de **versión de datos/parche + fecha** en cada página (confianza).

### 6.3 Anti-patrones prohibidos (aprendidos de ellos)
- Interstitials o ads que resetean el estado de navegación (queja nº1 de Dododex).
- Desktop capado (error de Dododex/Overwolf) → web responsive con paridad total.
- Herramientas escondidas por página de criatura sin índice central (error de Wikily) → hub de herramientas + acceso desde criatura, ambos.
- Cuenta obligatoria: todo lo esencial debe funcionar sin login (local-first) y la cuenta solo añade sync/tribu.

---

## 7. Alcance por fases

### MVP (el wedge: nadie más lo tiene en web/móvil)
1. Base de datos de criaturas ASA+ASE con stats (fuente: values.json de ASB, MIT — ver §8).
2. **Extractor post-tame** con resolución de ambigüedad + toggle ASA/ASE.
3. **Biblioteca "Mis Dinos"** local-first (IndexedDB), export/import JSON.
4. Calculadora de tameo (paridad Dododex: comida/narcóticos/torpor/TE/niveles bonus).
5. Perfiles de servidor con multiplicadores per-stat.
6. Extractor salvaje (el de Dododex, pero también para lo que ellos no cubren).
7. PWA offline, dark-first, paleta Okabe-Ito, navegación inferior.

### v1
- Árbol genealógico + tracker/simulador de mutaciones (modelo ASA correcto) + planificador de parejas.
- Scheduler de imprint/cría con alarmas; calculadora de comida/trough (¡214 votos en el Canny de Dododex — su ítem más pedido!).
- Cuenta opcional + sync multi-dispositivo.
- Inventario de criopods.

### Después
- Mapas interactivos (empezar por 1-2 mapas, capas accesibles por teclado).
- Compartir con tribu / workspace compartido.
- Loot tables + simulador; plantillas de construcción; criaturas de mods (pipeline self-serve para modders).
- Tips de comunidad (solo cuando haya masa crítica).

---

## 8. Datos y legal (importante — verificado)

| Fuente | Licencia | ¿Usable comercialmente? |
|---|---|---|
| values.json de ARK Smart Breeding | MIT | ✅ Sí, con aviso de atribución (Copyright 2015 cadon) |
| Constantes numéricas del juego | Hechos (no ©, doctrina Feist) | ✅ Sí |
| ark.wiki.gg y Fandom (texto/imágenes) | CC BY-**NC**-SA | ❌ NO para app comercial — no scrapear |
| Imágenes/renders de criaturas de Wildcard | © Studio Wildcard | ❌ Riesgo alto — usar **siluetas/iconos propios** |
| Marca "ARK", logos, estilo dossier | ™ Wildcard | ❌ Requiere permiso; elegir nombre propio (no "Dododex V2" público) |

- Postura recomendada: seed desde values.json (MIT) + a medio plazo pipeline propio con el mod "ASB Export Gun" para estar al día de parches (coste operativo recurrente real).
- Precedente: Dododex opera comercialmente sin licencia pública de Wildcard desde hace años (tolerancia de facto), pero no es un safe harbor.

## 9. Riesgos y estrategia

| Riesgo | Mitigación |
|---|---|
| Dododex cierra el gap (publica semanalmente; ya hizo el checklist en v2.6) | Velocidad + profundidad: no solo el extractor, sino biblioteca+árbol+imprint como sistema integrado. Su dev lleva 4+ años sin poder construirlo. |
| Moat de 350M tips imposible de replicar | No competir en tips: competir en **datos del propio usuario** (tracking personal), donde el crowdsourcing no importa. |
| Datos desactualizados con cada parche | Indicador de versión de datos + pipeline de actualización + tests contra ASB. |
| Errores de extracción en servidores modificados | Perfiles de servidor + import de .ini + UI de ambigüedad honesta (nunca dar una respuesta "segura" que sea incorrecta). |
| Bugs de modelo de mutaciones (el clásico "20/20 = stop") | Implementar reglas de §5.2 verificadas; suite de tests con casos del wiki. |
