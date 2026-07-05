# PLAN — DODODEX V2

> Hoja de ruta ejecutable. Cada fase termina en un estado **usable y commiteado** (nada a medias).
> Base: [ANALISIS.md](ANALISIS.md). Uso personal por ahora → sin bloqueos legales (imágenes/marca se revisarían solo si se comercializa).

## Stack (decidido)

| Capa | Elección | Por qué |
|---|---|---|
| Build/UI | Vite + React 19 + TypeScript | Rápido, estándar, tipado fuerte para el motor de cálculo |
| Estilos | Tailwind CSS v4 + tokens CSS propios | Design system "Ámbar y hueso" dark-first |
| Estado | Zustand | Simple, sin boilerplate |
| Persistencia | Dexie (IndexedDB) | Local-first, sin cuenta, export/import JSON |
| Rutas | React Router | SPA con deep-links por criatura |
| PWA | vite-plugin-pwa | Offline total (lección de Dododex) |
| Tests | Vitest | El motor de stats exige tests exhaustivos |
| Datos especies | values.json de ARK Smart Breeding (MIT, con atribución) | Canónico, cubre ASA+ASE |

## Estructura del repo

```
/            docs (ANALISIS.md, PLAN.md, README.md)
/src
  /engine    ← motor puro TS (sin React): fórmulas, extractor, tipos. 100% testeado
  /data      ← values.json procesado + versionado de datos
  /store     ← Zustand + Dexie (biblioteca Mis Dinos, perfiles servidor, ajustes)
  /ui        ← design system (tokens, componentes base accesibles)
  /features  ← taming/, extractor/, library/, breeding/ ...
/scripts     ← ingesta/actualización de values.json
```

---

## FASE 0 — Fundaciones ✅ = hecho · 🔄 = en curso

- [x] Análisis de competencia y mecánicas (ANALISIS.md)
- [x] Repo git local + GitHub (privado) + primer push
- [ ] Scaffold Vite+React+TS, Tailwind, Vitest, estructura de carpetas
- [ ] CI mínima (GitHub Actions: typecheck + tests en push)

## FASE 1 — Datos de especies

- [ ] Script `scripts/fetch-values.mjs`: descarga values.json de ASB (+ guarda versión/fecha/commit de origen)
- [ ] Parser → formato propio tipado: `{ especie: { stats: [B,Iw,Id,Ta,Tm]×8, TBHM, ... } }`
- [ ] Separación/flags ASA vs ASE por especie (incl. `speedLevelable=false` en ASA)
- [ ] Atribución MIT de ASB visible (README + pantalla "Acerca de")
- [ ] **Criterio de salida:** cargar Rex/Argentavis/Gigantoraptor y validar 3 stats contra la wiki a mano

## FASE 2 — Motor de cálculo (el corazón) 🔥

- [ ] `engine/statFormula.ts` — fórmula forward: `V = (B(1+Lw·Iw·IwM)·TBHM·(1+IB·0.2·IBM)+Ta·TaM)(1+TE·Tm·TmM)(1+Ld·Id·IdM)`
- [ ] `engine/wildExtractor.ts` — distribución de puntos de un dino salvaje (paridad Dododex)
- [ ] `engine/tameBonus.ts` — TE, niveles bonus `floor(nivel·TE/2)`, decay de TE por comida
- [ ] `engine/postTameExtractor.ts` — ⭐ resolver pares enteros (Lw,Ld) por stat desde los 7 valores + nivel + TE + imprint; enumerar TODAS las combinaciones válidas; restricción `ΣLw = puntos salvajes`
- [ ] Reglas de versión: toggle ASA/ASE (Speed no-pool en ASA; imprint excl. Stamina/Oxígeno/Crafting)
- [ ] Multiplicadores de servidor: `PerLevelStatsMultiplier_*`, `TamingSpeedMultiplier`, `bUseSingleplayerSettings` (multiplicadores ocultos extra)
- [ ] Tests Vitest: casos oficiales + boosted + singleplayer + ambiguos (referencia cruzada con ASB)
- [ ] **Criterio de salida:** extraer correctamente un dino real del juego del usuario (validación manual)

## FASE 3 — Design system "Ámbar y hueso"

- [ ] Tokens CSS: 4 superficies dark + modo claro; acentos ámbar/hueso; paleta Okabe-Ito por stat (Salud #E69F00 · Estamina #56B4E9 · Oxígeno #0072B2 · Comida #009E73 · Peso #F0E442 · Melee #D55E00 · Velocidad #CC79A7)
- [ ] Componentes base accesibles: StatChip (color+icono+etiqueta, nunca color solo), Card bento, BottomNav, BottomSheet, Stepper numérico (targets ≥24px), focus ring ≥2px
- [ ] Tipografía: display geométrica + Inter para datos; tamaños en rem; control de tamaño de texto
- [ ] **Criterio de salida:** página de muestra que pasa axe-core sin errores AA

## FASE 4 — Features MVP

- [ ] **Buscador de criaturas** (lista + fuzzy search, thumbnail cards)
- [ ] **Calculadora de tameo**: comida/narcóticos/torpor/tiempo/TE/niveles bonus; resultado en card grande, desglose en expansores
- [ ] **Extractor salvaje** (pre-tame)
- [ ] ⭐ **Inspector post-tame**: formulario 7 stats → desglose de puntos por stat; UI de ambigüedad ("nunca subí este stat" ⇒ Ld=0); indicador de confianza
- [ ] ⭐ **Mis Dinos**: guardar dino extraído (nombre, especie, sexo, servidor, colores, Lw/Ld por stat); listar, filtrar y ordenar por stat ("mi mejor Rex en Melee"); export/import JSON
- [ ] **Perfiles de servidor**: multiplicadores globales y per-stat, guardados y conmutables; presets Oficial/Small Tribes/Singleplayer
- [ ] **Criterio de salida:** flujo completo tameo→extracción→guardado→consulta sin tocar otra app

## FASE 5 — PWA + pulido → v0.1 (release personal)

- [ ] PWA offline (precache datos especies), instalable en móvil
- [ ] Indicador de versión de datos + fecha en cada página
- [ ] Revisión a11y completa (teclado, 200% zoom, contraste) + Lighthouse ≥90 a11y
- [ ] Tag `v0.1.0` en GitHub

## FASE 6 — v1: Cría a fondo

- [ ] Árbol genealógico (padres/hijos en Mis Dinos) + contadores de mutación por línea
- [ ] Simulador de mutaciones con modelo correcto: ASA pools separados wild/mutado (herencia ligada), cap 255 sobre MUTADOS, 7.31%→~3.7%, **NO parar en 20/20**, 55% dos veces (valor y padre-fuente); traits Robust/Mutable; pluma Gigantoraptor = sesgo de herencia de stat
- [ ] Planificador de parejas ("qué pareja combina mis mejores stats")
- [ ] Scheduler de imprint: cuddles restantes, ¿100% alcanzable con mi multiplicador?, próxima ventana, alarmas
- [ ] Calculadora de trough/comida de cría (ítem MÁS votado del Canny de Dododex: 214 votos)
- [ ] Inventario de criopods (qué hay en cada criofrigo y dónde)

## FASE 7 — Futuro (solo si apetece)

- [ ] Mapas interactivos (1-2 mapas, capas accesibles) — lo mejor de Wikily
- [ ] Import de Game.ini/GameUserSettings.ini para perfiles de servidor
- [ ] Cuenta opcional + sync (si algún día se comparte con tribu)
- [ ] Loot tables + simulador de cajas; criaturas de mods
- [ ] Revisión legal (imágenes, marca, nombre) **solo si se comercializa**

---

## Reglas de trabajo

1. **Nada a medias**: cada sesión cierra su hito con commit (+push si hay red).
2. El motor (`/engine`) es TS puro sin dependencias de UI y no se toca sin tests.
3. Antes de implementar mecánicas: releer §5.2 de ANALISIS.md (trampas ASA/ASE verificadas).
4. Accesibilidad no es fase final: cada componente nace accesible.
5. Idioma de la UI: español primero (i18n-ready para inglés después).
