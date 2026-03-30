# Design System — Make It Easy

**Classifier:** APP UI (task-focused, data-dense, no marketing sections)

---

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| `cream` | `#F5F0E8` | Screen background |
| `creamCard` | `#FAFAF7` | Card/row/input background |
| `brown` | `#3D2B1F` | Primary text |
| `brownLight` | `#6B5E57` | Secondary text, labels |
| `brownMuted` | `#8A8A8A` | Placeholder, disabled, muted |
| `green` | `#4CAF73` | Primary action, success, active |
| `greenDark` | `#3D8F5A` | Pressed state of primary action |
| `red` | `#E55E4D` | Danger, error, expiry warning |
| `amber` | `#F5A623` | Warning, near-expiry, estimates |
| Border | `rgba(61,43,31,0.1)` | Input/card borders |
| Shadow | `rgba(61,43,31,0.06–0.2)` | Card shadows (light → FAB) |

**Rules:**
- Max 8 distinct hues — already at limit, do not add new colors
- Warm neutrals only — no blue, no purple, no cool grays
- Green is the ONLY accent. Amber and red are semantic only (warning/error)
- No gradient backgrounds
- No colored card borders (use colored text/values as accent instead)

---

## Typography

React Native system font (SF Pro on iOS, Roboto on Android).

| Role | Size | Weight |
|------|------|--------|
| Screen title | 22px | 700 |
| Section title | 17px | 700 |
| Body / row primary | 15–16px | 600 |
| Caption / label | 13–14px | 500–600 |
| Badge / tag | 11px | 600 |

**Rules:**
- Body text minimum 16px in forms and inputs
- Labels minimum 13px
- Heading scale: 22 → 17 → 15 (do not introduce 18, 20, 19 between them)
- Use '700' and '500–600' only — do not add '400' or '300' for new elements

---

## Spacing Scale

Base: 8px. All spacing should be multiples.

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 4px | Icon gaps, tiny padding |
| `sm` | 8px | Chip padding, small gaps |
| `md` | 16px | Screen horizontal padding, standard gap |
| `lg` | 24px | Section separation, large gaps |
| `xl` | 32px | Screen padding, empty state |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `sm` | 6px | Badge, expiry chip, checkbox |
| `md` | 12px | Card, row, input, button, modal |
| `lg` | 20px | Large sheet components (future) |
| FAB | 28px | Circular (56px ÷ 2) |

**Rule:** Never use 8, 9, 10, or 11 — pick sm (6) or md (12). No in-between values.

---

## Shadows

Three levels:
- **Subtle** (card, row): `shadowColor rgba(61,43,31,0.06), offset (0,1–2), radius 3–4, elevation 1`
- **Elevated** (modal, voice): `shadowColor rgba(61,43,31,0.1–0.15), offset (0,3), radius 6, elevation 4`
- **FAB**: `shadowColor rgba(61,43,31,0.2), offset (0,4), radius 8, elevation 6`

---

## Touch Targets

All interactive elements must be minimum `minHeight: 48` (or `height: 48/52`).

---

## Animation

- **Pulse (VoiceInput listening):** `Animated.loop`, scale 1→1.25→1, 700ms, ease-out/ease-in, useNativeDriver
- **Modal transitions:** `animationType="slide"` (React Native default)
- **No animations elsewhere yet** — add entrance animations before v1.0

**Rules:**
- Only animate `transform` and `opacity` (never width, height, or layout properties)
- Always `useNativeDriver: true`
- Duration 300–700ms for UI transitions
- Respect `prefers-reduced-motion` when Reanimated is added

---

## Component Rules

**Cards/Rows:** `backgroundColor: #FAFAF7, borderRadius: 12`. No colored borders. Shadow level: subtle.

**Buttons (primary):** `backgroundColor: #4CAF73, height: 52, borderRadius: 12`. Disabled: `rgba(76,175,115,0.5)`.

**Buttons (secondary/outline):** `borderWidth: 1.5, borderColor: #4CAF73, borderRadius: 12`. Text: green.

**FABs:** `width: 56, height: 56, borderRadius: 28`. Add icon: always at least 56x56.

**Empty states:** Must include: emoji anchor (48px) + descriptive text + primary action button. Never bare text alone.

**StatCards:** Use colored text value as accent. No colored card borders or top-border accents.

---

## Anti-Patterns (do not ship)

- Colored card borders (`borderTopWidth`, `borderLeftWidth` with accent color)
- Generic hero copy
- Gradient backgrounds
- Purple/blue/violet color scheme
- 3-column icon-in-circle feature grid
- Emoji as the ONLY brand identifier (logo should eventually be an SVG asset)
- Static loading indicators for states >1 second (use skeleton layouts)
- Bare text empty states with no visual anchor or action

---

## Known Gaps (backlog)

- [ ] Custom typeface (the warm brand needs a matching font — Fraunces, Playfair, or similar)
- [ ] Meal illustration assets (currently initials placeholders)
- [ ] Skeleton loading layouts (currently ActivityIndicator spinners)
- [ ] Entrance animations on list items
- [ ] Dark mode
- [ ] Tablet layout (currently portrait-only)
