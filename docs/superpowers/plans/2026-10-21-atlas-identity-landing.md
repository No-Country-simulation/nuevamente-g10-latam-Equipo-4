# Atlas Identity and Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish Atlas as the product name, move the existing local workspace to `/workspace` with Chat first in its sidebar, and create the approved chat-first landing page at `/`.

**Architecture:** Keep the existing Atlas client component as the single workspace implementation and mount it from a new App Router `/workspace` route. Replace the root page with a server-rendered landing page that links to the workspace, using the current Atelier tokens, local brand assets, and no added dependencies.

**Tech Stack:** Next.js App Router, React 19, TypeScript, existing global CSS tokens and local PNG brand/tutor assets.

**Spec:** `docs/superpowers/specs/2026-10-21-atlas-brand-and-landing-design.md`

## Global Constraints

- The product name is **Atlas** and its descriptor is **IA Agents For Education**; **NovaMente** is the company/brand behind Atlas.
- Do not change application behavior, APIs, data models, agent permissions, memory consent, or integrations.
- Do not add authentication, user accounts, public groups, payments, or external services.
- Do not publish the app to the Internet. This remains a local loopback workspace; public deployment still requires authentication and multi-user isolation.
- Do not claim that Atlas is free, universally accessible, proven to improve learning outcomes, or powered by a configured remote model unless the corresponding capability is actually verified.
- Do not fabricate example answers, citations, benchmarks, user counts, testimonials, partner endorsements, or provider readiness.
- Preserve the existing Atelier system: dark editorial canvas, restrained coral brand accent, mint used for evidence, Instrument Serif display headings, Plus Jakarta Sans UI and JetBrains Mono utility labels.
- Use responsive layouts, visible focus, semantic headings/links, reduced motion, and 44px minimum touch targets for primary touch controls.
- Prefer existing packages and CSS tokens. Do not add dependencies for the landing page.

## Review Focus

- Direct navigation or refresh at `/workspace` must render the existing app without losing its query/API behavior — verify direct route load, refresh, and bootstrap readiness in browser smoke.
- The landing CTA must navigate to the local workspace rather than an external service — assert its `href` is `/workspace` and follow it.
- Mobile viewport can compress navigation and CTA content — inspect at 390px and assert no horizontal overflow or clipped CTA.
- Keyboard-only visitors must be able to identify and activate the primary CTA — verify link semantics, visible focus, and Enter navigation.
- Illustrative chat UI must not read as a real generated answer or cite a fictional source — inspect visible labels/copy and ensure no synthetic citation is presented as evidence.

---

## File Map

- `apps/web/app/page.tsx` — root route; render the landing page.
- `apps/web/app/workspace/page.tsx` — new workspace route; mount the existing `Atlas` component.
- `apps/web/app/workspace/layout.tsx` — route-specific workspace metadata.
- `apps/web/components/landing.tsx` — semantic landing sections, product/brand identity, chat-first hero, feature summary, and workspace CTA.
- `apps/web/components/atlas.tsx` — sidebar order and visible product/company naming only; preserve workspace interaction behavior.
- `apps/web/app/layout.tsx` — root metadata defaults and document language where required; avoid duplicating global providers/styles.
- `apps/web/app/globals.css` — landing-only responsive styles using existing Atelier and brand tokens; preserve existing workspace rules.
- `docs/STATUS.md` — record the implemented and validated identity, landing, route, and navigation changes.

## Task 1: Route the Existing Workspace to `/workspace`

**Files:**
- Create: `apps/web/app/workspace/page.tsx`
- Create: `apps/web/app/workspace/layout.tsx`

**Interfaces:**
- Consumes: existing default export `Atlas` from `@/components/atlas`.
- Produces: the existing workspace at `/workspace`; no duplicate component or behavior.

- [ ] **Step 1: Capture the current root workspace behavior**

  Open the running app at `/` and record that the existing workspace renders its primary header, sidebar, bootstrap status, and current selected page. Do not change data or trigger state-changing actions.

- [ ] **Step 2: Mount the existing workspace at `/workspace`**

  Create `apps/web/app/workspace/page.tsx` whose default server component renders `<Atlas />`. Add route-specific metadata in `apps/web/app/workspace/layout.tsx` with title `Atlas | Workspace` and a description identifying the local learning workspace, not a public service.

- [ ] **Step 3: Verify `/workspace` before changing `/`**

  Run the web typecheck and open `http://localhost:3000/workspace`; confirm the existing sidebar, workspace screens, and bootstrap all render.

  Run: `npm run typecheck -w @atlas/web`

  Expected: PASS; browser shows the current workspace at `/workspace`.

## Task 2: Present Atlas as the Product and Put Chat First

**Files:**
- Modify: `apps/web/components/atlas.tsx`

**Interfaces:**
- Consumes: existing `nav` array and `Sidebar()` renderer.
- Produces: visible navigation ordered with `Canais dos agentes` before `Estúdio de adaptação`; brand hierarchy reads Atlas as product and NovaMente as company.

- [ ] **Step 1: Verify current sidebar order and labels**

  At `/workspace`, inspect the accessibility tree. Confirm current first learning option is `Estúdio de adaptação` and the sidebar currently presents NovaMente as the prominent wordmark.

- [ ] **Step 2: Reorder the existing navigation entries**

  In the `nav` declaration, place `{group:'Aprendizagem', id:'chat', label:'Canais dos agentes', icon:MessageSquare}` before the existing studio entry. Keep all ids, labels, icons, group membership, and navigation handlers unchanged. Do not change `useState<Tab>('studio')`; the request is for sidebar order, not a first-run tab change.

- [ ] **Step 3: Correct product/company hierarchy in workspace identity**

  In `Sidebar()` and the workspace footer, present **Atlas** as the system name and **by NovaMente** as its company attribution. Retain the existing NovaMente brand mark and tutor image assets. Use `IA Agents For Education` as the descriptor if it fits the existing identity block without obscuring navigation.

- [ ] **Step 4: Verify navigation and visible naming**

  At `/workspace`, verify the first sidebar button is `Canais dos agentes`, the second is `Estúdio de adaptação`, choosing each still opens the same screen, and visible product naming identifies Atlas rather than NovaMente Atlas.

  Run: `npm run typecheck -w @atlas/web`

  Expected: PASS; browser navigation remains functional.

## Task 3: Build the Chat-First Atlas Landing at `/`

**Files:**
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/components/landing.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`

**Interfaces:**
- Consumes: same-origin `/workspace` destination; existing `/brand/novamente-mark.png` and tutor assets; current CSS custom properties/fonts.
- Produces: a server-rendered landing component with semantic sections and a real `<a href="/workspace">` primary CTA.

- [ ] **Step 1: Define a browser-smoke checklist for the landing**

  Record the acceptance checks from Review Focus: product/company naming, chat-first hero, motivation of more accessible/personalized education, truthful feature list, real `/workspace` link, mobile layout, keyboard focus, and no fictional source citation. No new test dependency is needed.

- [ ] **Step 2: Implement the landing structure**

  Create `Landing()` in `apps/web/components/landing.tsx` as a server component. Include:
  1. A compact identity header: Atlas product name, `IA Agents For Education`, NovaMente company attribution, and an `Entrar no Atlas` link to `/workspace`.
  2. The approved chat-first hero: headline about learning adapted to the learner, concise copy about access/personalization, a primary `/workspace` CTA, and a visual showing the Lumi tutor.
  3. A clear demonstration label around any illustrative chat copy. Do not display an invented document/page citation or describe the illustration as a real model response.
  4. A concise feature section grounded in the current app: five tutors, learning materials/practice, and source inspection.
  5. A section stating the motivation as a goal: making education easier to access and more adapted to each person. Do not claim measured efficacy or guaranteed outcomes.
  6. A final `/workspace` CTA.

- [ ] **Step 3: Style only landing-specific classes**

  Add `.landing-*` rules in `globals.css`, referencing the existing Atelier CSS variables and local fonts. Create mobile-first layouts with a single-column hero on narrow screens, collapse navigation links as needed, keep CTA at least 44px high, add visible `:focus-visible` treatment, and respect `prefers-reduced-motion`. Avoid external fonts, external image hosts, new color systems, and edits to existing workspace selectors unless required for coexistence.

- [ ] **Step 4: Render the landing from the root route**

  Replace the root route implementation with `<Landing />`; keep the existing Atlas workspace mounted only from `/workspace`. Update root metadata to title `Atlas — IA Agents For Education` and a short, truthful description of personalized learning with sources.

- [ ] **Step 5: Verify landing and workspace routes in the browser**

  At `/`, verify the page has one primary product identity, both CTA links target `/workspace`, the chat visual is marked illustrative, and no fictional citation appears. At 390px, 820px, and 1440px, verify no horizontal overflow, cut-off navigation, or clipped CTA. Follow a CTA and confirm `/workspace` renders the same workspace.

  Run: `npm run typecheck -w @atlas/web`

  Expected: PASS.

## Task 4: Update Status and Run Final Verification

**Files:**
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Update the interface status**

  Amend the existing Interface row to describe the Atlas by NovaMente identity, chat-first sidebar, root landing, and workspace route only after those changes are complete. Do not mark unrelated integrations or product capabilities ready.

- [ ] **Step 2: Run focused validation**

  Run:

  ```powershell
  npm run typecheck -w @atlas/web
  npm run build -w @atlas/web
  ```

  Expected: both commands exit successfully. Inspect `apps/web/app/workspace/layout.tsx` and route metadata after build; restore any automatic `next-env.d.ts` mutation if the build changes it, without reverting unrelated user changes.

- [ ] **Step 3: Run browser route smoke**

  Check `/` at 390px, 820px, and 1440px; activate the CTA with keyboard; confirm it navigates to `/workspace`; confirm the Chat and Studio sidebar choices still work; confirm no browser console error or horizontal overflow. Do not upload files, create groups, consent to Dreamer, or delete memories as part of this smoke.

  Expected: all route, responsive, identity, and non-destructive interaction checks pass.

## Spec Coverage Self-Review

- Product/company naming, existing marks, and chat-first navigation: Task 2.
- Root landing, approved chat-first direction, accurate motivation/features, CTA, and `/workspace` journey: Task 3.
- Existing local workspace behavior and its route: Task 1.
- Atelier design, responsive layout, accessibility, dependency restraint, no unsupported claims, and local-only scope: Tasks 3–4 and Review Focus checks.
- Status/documentation update and build/typecheck/browser validation: Task 4.
