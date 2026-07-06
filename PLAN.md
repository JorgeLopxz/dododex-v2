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
- [x] Repo git local + GitHub privado (JorgeLopxz/dododex-v2) con push
- [x] Scaffold Vite+React+TS, Tailwind, Vitest, estructura de carpetas
- [x] CI mínima (GitHub Actions: typecheck + tests + build en push)

## FASE 1 — Datos de especies ✅

- [x] `scripts/build-data.mjs`: descarga values.json + ASA-values.json de ASB, con versión/fecha
- [x] Parser → JSON compacto tipado + loader (`src/data/`); overlay ASA fusionado por blueprint
- [x] Flags de versión (Speed no-pool en ASA vía `statReceivesPoints`)
- [x] Atribución MIT de ASB (README + pie de la app)
- [x] **Criterio de salida:** Rex validado contra la wiki por test (B=1100, +220 HP/nivel, melee 210%)

## FASE 2 — Motor de cálculo (el corazón) 🔥

- [x] `engine/statFormula.ts` — fórmula forward completa (TBHM, imprint, Ta/Tm negativos, nerf oficial)
- [x] `engine/extractor.ts` — extractor salvaje (paridad Dododex)
- [x] Niveles bonus `floor(nivel·TE/2)` · [x] modelo TE por comida (engine/taming.ts, verificado vs ASB)
- [x] ⭐ `extractPostTame` — candidatos (Lw,Ld) por stat + DFS global con restricciones `ΣLw`/`ΣLd`
- [x] Reglas de versión: toggle ASA/ASE (Speed no-pool en ASA; imprint excl. Stamina/Oxígeno)
- [x] Estructura de multiplicadores `PerLevelStatsMultiplier_*` · [ ] `bUseSingleplayerSettings` + import .ini
- [x] Tests Vitest (14, round-trip deterministas) · [ ] casos cruzados contra ASB con datos reales (FASE 1)
- [ ] **Criterio de salida:** extraer correctamente un dino real del juego del usuario (validación manual)

## FASE 3 — Design system "Ámbar y hueso" (núcleo hecho)

- [x] Tokens CSS: 4 superficies dark + acentos ámbar/hueso + paleta Okabe-Ito por stat
- [x] StatChip accesible (color+icono+etiqueta), BottomNav, focus ring ≥2px, targets ≥24px
- [ ] Modo claro derivado · [ ] BottomSheet · [ ] tipografía display + control de tamaño de texto
- [ ] **Criterio de salida:** página de muestra que pasa axe-core sin errores AA

## FASE 4 — Features MVP

- [x] **Buscador de criaturas** (búsqueda por texto; pendiente: fuzzy + fichas de criatura)
- [x] **Calculadora de tameo**: dieta por especie, piezas/TE/niveles bonus/tiempo/narcóticos, TSM/FoodDrain/Sanguine (página /tameo)
  - Datos: tamingFoodData.json de ASB (dietas de 159 especies + valores f/a). Fórmulas verificadas contra Taming.cs (TE = 1/(1+TI·piezas/afinidad), torpor crumplecorn). Validado: Rex 150 = 17 kibble / 98.7% / +74 = Dododex.
- [x] **Extractor salvaje** (pre-tame) — modo 🌿 Salvaje en el Inspector, con puntos ocultos
- [x] ⭐ **Inspector post-tame**: valores → puntos por stat, ambigüedad honesta, toggle ASA/ASE, guardar
  - [ ] Mejora: checkbox "nunca subí este stat" (Ld=0) por stat para reducir ambigüedad
- [x] ⭐ **Mis Dinos**: biblioteca Dexie local-first, orden por stat, export/import JSON (falta: sexo/colores/notas en UI)
- [x] **Perfiles de servidor**: presets Oficial/Vanilla/Custom + PerLevelStatsMultiplier per-stat (página Ajustes)
- [x] **Criterio de salida:** flujo completo tameo→extracción→guardado→consulta sin tocar otra app ✅ MVP FUNCIONAL

## FASE 5 — PWA + pulido → v0.1 (release personal)

- [x] PWA offline (precache app + datos, 800 KiB), instalable en móvil (vite-plugin-pwa, iconos generados)
- [x] Indicador de versión de datos + fecha (pie de la app)
- [ ] Revisión a11y completa (teclado, 200% zoom, contraste) + Lighthouse ≥90 a11y
- [x] Tag `v0.1.0` en GitHub

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
