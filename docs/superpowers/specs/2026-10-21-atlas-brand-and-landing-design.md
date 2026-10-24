# Atlas identity and chat-first landing page

Date: 2026-10-21
Status: approved by user on 2026-10-21

## Intent

Present Atlas as an education product by NovaMente, make its chat-first
learning experience clear to new visitors, and give them a direct route into
the existing local workspace.

The product name is **Atlas** and its descriptor is **IA Agents For Education**.
**NovaMente** is the company/brand behind Atlas, not the system name. The user
chose the chat-first landing direction and described the purpose as easier
access to education and education adapted to each person.

## Goals

- Correct product naming wherever the web interface presents the system name.
- Keep NovaMente's existing logo/mark and Atelier visual identity.
- Put **Canais dos agentes** (the chat) before **Estúdio de adaptação** in the
  workspace sidebar.
- Make the existing workspace available at `/workspace`.
- Present a polished landing page at `/` that introduces the problem, explains
  the actual Atlas experience and features, and has a clear CTA to `/workspace`.
- Design mobile-first and preserve accessibility, focus-mode/low-stimulation
  expectations and reduced-motion behavior.

## Non-goals

- Do not change application behavior, APIs, data models, agent permissions,
  memory consent, or integrations.
- Do not add authentication, user accounts, public groups, payments, or
  external services.
- Do not publish the app to the Internet. This remains a local loopback
  workspace; public deployment still requires authentication and
  multi-user isolation.
- Do not claim that Atlas is free, universally accessible, proven to improve
  learning outcomes, or powered by a configured remote model unless the
  corresponding capability is actually verified.
- Do not fabricate example answers, citations, benchmarks, user counts,
  testimonials, partner endorsements, or provider readiness.

## Approved direction and user journey

The user chose mockup **A — Começar pela conversa**. The landing opens with the
Atlas identity, a chat-first visual, and the promise of learning at one's own
pace, with a clear CTA. It then explains the problem and how the current
product responds, using the existing NovaMente palette, typography, logo, and
five tutor marks.

The visitor journey is:

1. Open `/` and understand that Atlas aims to make education easier to access
   and more personal.
2. See how a learner can talk to a tutor, use learning formats, and inspect
   source evidence.
3. Choose the CTA to open `/workspace`.
4. Arrive in the existing Atlas workspace with the chat listed first.

The workspace remains usable at `/workspace` without sign-in, as it is a local
single-workspace product. Do not expose it as an unauthenticated public
Internet service.

## Content and evidence rules

- State the brand relationship explicitly: **Atlas**, by **NovaMente**.
- Use **IA Agents For Education** as the product descriptor, not a claim of
  verified educational efficacy.
- Ground feature copy in the product's implemented behavior: five tutors,
  chat grounded in selected documents, learning materials (tutorial,
  flashcards, quiz, summary), source references, and practice.
- Make the motivation about easier access and adapting education to a learner;
  present it as the product's goal, not a measured outcome.
- Any illustrative chat mockup must be explicitly labeled as a demonstration,
  use no fabricated document citation or claim to be a real generated answer,
  or be replaced by a truthful product-interface preview.
- Do not describe local lexical demo mode as semantic embeddings or remote AI.

## Visual direction

- Preserve the existing Atelier system from `docs/SPEC.md` and
  `apps/web/app/globals.css`: dark editorial canvas, restrained coral brand
  accent, mint used for evidence, Instrument Serif display headings, Plus
  Jakarta Sans UI and JetBrains Mono utility labels.
- Retain the NovaMente mark/wordmark assets and the custom marks of Nilo, Lumi,
  Prisma, Fio, and Soma. Position NovaMente as the company attribution; make
  Atlas the prominent product wordmark.
- Keep the interface calm and readable rather than adopting a generic
  SaaS/AI dashboard visual language.
- Use responsive layouts, visible focus, semantic headings/links, reduced
  motion, and 44px minimum touch targets for primary touch controls.
- Prefer existing packages and CSS tokens. Do not add dependencies for the
  landing page.

## Implementation scope

- `apps/web/app/page.tsx`: render the landing page at `/`.
- `apps/web/app/workspace/page.tsx`: render the existing `Atlas` workspace at
  `/workspace`.
- `apps/web/components/landing.tsx` (or a similarly named component): build
  the landing content and CTA.
- `apps/web/components/atlas.tsx`: correct system/company presentation and
  move the chat item before the studio item in sidebar navigation. Keep the
  existing features and state behavior unchanged.
- `apps/web/app/layout.tsx`: update metadata to identify Atlas and its
  education purpose, without marketing claims beyond verified behavior.
- `apps/web/app/globals.css`: add responsive landing styles using existing
  Atelier/brand tokens; avoid changing unrelated workspace styling.
- `docs/STATUS.md`: document only the landing/brand/navigation changes that
  are actually implemented and validated.

The initial active workspace view is left to the builder unless existing
navigation behavior makes it consequential; the user explicitly requested
Chat to be the first sidebar option, not necessarily an automatic active tab.

## Acceptance criteria

- `/` renders the landing page and has a working same-origin CTA to
  `/workspace`.
- `/workspace` renders the existing workspace and preserves its current
  behaviors and data.
- The sidebar's first learning option is **Canais dos agentes**, followed by
  **Estúdio de adaptação**.
- Visible system naming identifies **Atlas**; NovaMente is identified as the
  company/brand, not as the product name.
- Landing uses existing NovaMente/tutor assets and matches the Atelier visual
  system.
- Responsive checks at 390px, 820px, and 1440px show no horizontal overflow,
  clipped primary actions, or inaccessible content.
- Navigation, source access, upload, chat, and stateful workspace controls
  remain unchanged in behavior.
- Landing copy contains no fabricated citations, unverifiable integrations,
  or unsupported efficacy claims.
- Typecheck, production build, and a browser smoke covering `/` → CTA →
  `/workspace` pass.

## Decisions still open for the builder

- Select the simplest App Router placement for shared root layout and
  route-specific metadata; avoid duplicating the workspace implementation.
- Use the approved chat-first mockup as visual direction, not as permission to
  present illustrative content as real model output.
- Keep the existing first-run workspace tab unless a verified interaction
  requirement warrants changing it.
