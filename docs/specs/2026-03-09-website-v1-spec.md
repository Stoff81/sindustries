# Stoffer Industries Website V1 Spec

## Goal
Ship a credible first public website for Stoffer Industries that is fast, simple, and easy to evolve.

This is a deliberately lightweight v1: enough to establish the brand, explain what Stoffer Industries is, and create a clear contact/call-to-action path without disappearing into brand-system or CMS work.

## Recommendation summary
- **Information architecture:** Home, About, Contact
- **Content approach:** concise, plain-English copy with a builder-operator tone
- **Implementation path:** create a small `apps/website` Vite + React app in the existing monorepo
- **Initial runtime target:** local running version first; deployment can follow once Tom signs off on copy/visual direction
- **Design posture:** use the existing brand spec as a light guide, not a mandate for pixel-perfect brand exploration

## Why this path
The repo already uses a monorepo with front-end apps under `apps/`, and `apps/tasks` proves the local app pattern already exists. Reusing that shape is the fastest maintainable route:

- consistent with the current repo structure
- low setup overhead
- easy to run locally
- easy to evolve from a simple landing site into a richer product/company shell later
- avoids introducing a new framework or CMS before it is justified

A CMS is unnecessary for v1. A pure static HTML page would be fast, but adding a small `apps/website` app keeps the structure aligned with the existing stack and makes later evolution cleaner.

## V1 success criteria
1. A visitor can understand what Stoffer Industries is within a few seconds.
2. The site feels credible and intentional, not placeholder-ish.
3. Tom can review and adjust copy/design direction without a big rebuild.
4. The site can run locally from the repo with minimal ceremony.
5. Follow-up ideas are kept out of v1 unless they directly support launch.

## Audience assumptions
Primary early audiences:
- people Tom knows who are checking out the brand
- potential collaborators or clients
- future users/customers landing from links or product references

Their first questions are likely:
- What is Stoffer Industries?
- What do they make or plan to make?
- Is this a consultancy, a product studio, or a personal brand?
- How do I contact Tom / start a conversation?

## Recommended information architecture

### 1. Home
Purpose: communicate brand, positioning, and next action quickly.

Suggested sections:
- Hero
- Short positioning statement
- What Stoffer Industries does
- Principles / way of working
- Current focus
- CTA to contact / start a conversation

### 2. About
Purpose: give more context on the company and founder story without overdoing biography.

Suggested sections:
- What Stoffer Industries is
- Why it exists
- How it works
- Founder / operator note about Tom

### 3. Contact
Purpose: give a simple way to reach out.

Suggested sections:
- short invitation to get in touch
- preferred contact method(s)
- optional simple contact form later, but not required for v1

For v1, a `mailto:` CTA or clearly listed contact destination is acceptable if no better channel is ready.

## Draft messaging

### Core positioning
**Stoffer Industries builds practical digital products, systems, and tools with speed, precision, and long-term thinking.**

### Hero options
Option A:
- **Build useful things. Run them well.**
- Stoffer Industries is the workshop for digital products, systems, and experiments designed to compound over time.

Option B:
- **A builder’s shop for modern software.**
- Stoffer Industries creates focused products and internal tools with an operator’s mindset: fast to ship, clear to use, built to last.

Option C:
- **Products, systems, and experiments — built with intent.**
- Stoffer Industries is where software ideas become practical tools, sharper workflows, and durable digital businesses.

### Plain-language explanation
Stoffer Industries is Tom Stoffer’s builder-operator company: a home for creating software products, internal tools, and experiments that solve real problems without unnecessary complexity.

### What we do
Suggested bullets:
- Build focused software products
- Create internal tools and automation
- Turn messy workflows into usable systems
- Ship small, learn quickly, and improve steadily

### Principles
Suggested bullets:
- Start simple
- Ship useful work early
- Prefer durable systems over noise
- Use automation to remove repetition
- Keep tools fast, clear, and editable

### Current focus
Suggested copy:
Stoffer Industries is in its early build phase. The current focus is creating the operating system behind the work: internal tools, workflow automation, and the first public-facing product surfaces.

### Contact CTA
Suggested copy:
If you want to collaborate, compare notes, or see what’s being built, get in touch.

## Recommended implementation details

### App shape
Create `apps/website` as a minimal Vite + React site.

Recommended scope:
- landing page with section-based layout
- separate routes for `/`, `/about`, and `/contact` if cheap to add
- otherwise a single-page site with anchored sections is acceptable for first pass

Preferred choice: simple routes for the three pages, because the task explicitly calls for that minimum structure and it keeps future growth straightforward.

### Styling approach
- keep CSS local and simple
- use the existing brand spec as directional input for colors, tone, and typography
- avoid animation-heavy or branding-heavy implementation in v1
- optimize for readability and confidence over flair

### Content/data approach
Hard-code copy in v1.

Rationale:
- fastest path
- simplest editing surface in code
- avoids premature CMS or content model decisions

## Non-goals for v1
- full logo system exploration
- advanced motion design
- CMS integration
- blog/news system
- case studies
- SEO deep dive beyond basic title/description/meta
- analytics instrumentation beyond simple later follow-up
- polished contact form backend unless already trivial

## Follow-up tasks to capture separately
These should become separate tasks rather than expanding v1:
- domain + deployment productionization
- final copy pass after Tom review
- visual polish / custom illustration / logo refinement
- contact form backend and spam protection
- analytics / privacy-conscious tracking
- legal pages (privacy, terms) if needed
- product pages once real offerings exist

## Recommended immediate build plan
1. Scaffold `apps/website` in the monorepo using the same local dev pattern as other apps.
2. Implement the three-page structure: Home, About, Contact.
3. Add the draft copy from this spec.
4. Apply light brand styling using the existing palette/direction.
5. Run locally and capture screenshots for Tom review.
6. After Tom review, decide whether to keep iterating locally or prepare deployment.

## Open questions for Tom
These do not block the first local build, but should be confirmed before calling the task complete:
- preferred public contact method
- whether the site should lean more toward product studio, holding company, or personal builder brand
- whether Tom wants his name/photo prominent on v1
- preferred domain if not already decided
- whether launch should wait for stronger visual identity polish

## Decision
Proceed with a lightweight monorepo-native `apps/website` implementation using draft copy and a simple three-page structure. This is the fastest path that satisfies the task acceptance criteria while keeping aesthetic sign-off with Tom before closure.
