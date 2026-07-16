# Product

## Register

product

## Platform

web

## Users

General-purpose form builder serving two overlapping audiences: business/professional teams (internal ops, freelancers, small businesses collecting surveys, applications, registrations, client intake) and education/training contexts (instructors running quizzes and graded coursework through the built-in assignment mode). No single audience to design for exclusively — the tool must read as credible and unambiguous to both an internal admin building a form and an external respondent (customer, client, or student) filling one out, often on a first visit with no prior trust established.

## Product Purpose

Lets non-developers build dependable structured-data-collection instruments: a drag-and-drop form builder, public/restricted sharing (email allowlists, response limits, open/close windows), response collection with analytics and CSV/JSON export, and an assignment mode that scores submissions against correct answers and produces grades. Exists to remove the gap between "I need to collect structured data or grade an assessment" and having a working, presentable form — without engineering effort. Success is measured by two trust events: respondents complete the form because it reads as legitimate, and admins act on the resulting data because they trust it's accurate.

## Brand Personality

Precise, restrained, dependable. Institutional/authoritative register — closer to an audit platform or LMS gradebook than a consumer SaaS tool. Confidence is communicated through structure and clarity, not visual excitement: no hype copy, no playful motion, no decorative flourish that isn't earning its place. The system should feel like the same institution end to end — the public marketing surface and the working dashboard must not read as two different products with two different levels of seriousness.

## Anti-references

The current landing page (`src/app/page.tsx`) is the concrete anti-reference: gradient blue-to-purple background, gradient-clipped hero text, emoji used as UI iconography, hype copy ("Actually Convert", "Trusted by 10,000+ users worldwide"), bouncy hover-scale transforms on cards and buttons, generic three-card feature grid. None of this survives the redesign. Beyond that specific pattern: no dark-mode-as-default (light-first, paper-like baseline regardless of current dev-tool fashion), and color usage stays minimal even past removing the gradient — near-monochrome with at most one restrained accent color, not a "branded" multi-color palette.

## Design Principles

1. **One system, no split register** — the marketing surface and the working product read as the same institution, not a marketing veneer bolted onto a utilitarian tool.
2. **Confidence through restraint** — remove decoration before adding it; every visual choice earns its place by improving legibility or trust, never by adding personality for its own sake.
3. **Structure carries the hierarchy** — typography, spacing, and grid do the persuasive work that color and imagery do in louder registers; color is reserved, not default.
4. **Trust is legible at a glance** — every state (empty, loading, error, success, graded-correct/incorrect) is deliberately designed for both the admin building forms and the respondent filling them; nothing is left at framework default.
5. **Accessible by default** — WCAG 2.1 AA is the floor on every surface, not a pass applied at the end, given the mixed business/education audience this serves.

## Accessibility & Inclusion

WCAG 2.1 AA baseline across the whole product: 4.5:1 minimum contrast for body text (3:1 for large text, ≥18px or bold ≥14px), full keyboard navigation, visible focus states on every interactive element, `prefers-reduced-motion` alternatives for all motion. Given the assignment-mode/grading use case, correctness in graded results must never rely on color alone (pair with icon/text). Placeholder text held to the same 4.5:1 floor as body text, not the lighter default muted-gray.
