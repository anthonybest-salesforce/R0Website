# Gray Rock Brand Guidelines

**Tagline:** *"The Neutral Standard."* — A stable, unwavering foundation for data and strategy.

---

## Brand Overview

Gray Rock is a premium brand built on stability, clarity, and trust. The identity conveys solidity and professionalism through a restrained color palette, clean typography, and a distinctive mountain-inspired logo. The brand voice is explicitly neutral—no superlatives, no hype—just facts and outcomes.

---

## Logo

### Logo Variants

| Variant | Use Case | File |
|---------|----------|------|
| **BlueGray** | Primary—light backgrounds (headers, white/light pages) | `images/logo.png` |
| **White** | Dark backgrounds (dark sections, overlays) | `images/logo-white.png` |
| **Block** | Full lockup on dark blue-gray backgrounds | `images/logo-block.png` |

### Logo Specifications

- **Graphic element:** Stylized mountain range with three peaks—central peak tallest, flanked by smaller peaks. Clean, geometric, minimalist.
- **Text:** "GRAY ROCK" in bold, uppercase, sans-serif. Always use "GRAY" (American spelling) not "GREY."
- **Minimum size:** Ensure logo remains legible; avoid scaling below ~24px height for the icon.
- **Clear space:** Maintain adequate padding around the logo; do not crowd with other elements.

### Logo Usage

- Use **BlueGray** on white, light gray (#F5F5F5), or light backgrounds.
- Use **White** on black, dark blue-gray (#344558, #353946), or dark backgrounds.
- Use **Block** for full lockup on brand-colored dark sections.
- Do not stretch, skew, or add effects (shadows, outlines) to the logo.

---

## Color Palette

*"50 Shades of Functional"* — A restrained, professional palette.

| Name | Hex | Use |
|------|-----|-----|
| **Obsidian** | `#353946` | Headings, primary text, primary buttons |
| **Slate** | `#344558` | Banners, dark blocks, secondary text |
| **Basalt** | `#235476` | Links, CTAs, accents, highlights |
| **Shale** | `#617ea3` | Icons, muted text |
| **Pebble** | `#afc5de` | Borders, dividers, UI elements |
| **Silt** | `#F5F5F5` | Page background (light gray) |
| **White** | `#FFFFFF` | Cards, surfaces, containers |

### CSS Custom Properties

```css
--brand-primary: #353946;    /* Obsidian */
--brand-secondary: #344558;  /* Slate */
--brand-accent: #235476;     /* Basalt */
--brand-text-muted: #617ea3; /* Shale */
--brand-border: #afc5de;    /* Pebble */
--brand-background: #F5F5F5; /* Silt */
--brand-surface: #FFFFFF;    /* White */
```

---

## Typography

| Element | Font | Weight | Notes |
|---------|------|--------|-------|
| **Headlines** | Inter Tight | 600–700 (Bold) | Clean, utilitarian |
| **Body** | Roboto Mono | 400–500 | Monospace for data/logic feel |
| **Brand name** | All-caps | Bold | 200% letter-spacing for premium feel |

### Font URLs

```html
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Font Stack

```css
font-family: 'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-family: 'Roboto Mono', monospace;
```

---

## Voice & Tone

**Explicitly neutral.** No superlatives. No "innovative," "disruptive," or "synergy." Just facts.

### Do

- "Gray Rock provides a points-based system for beverage purchases."
- "Data. Systems. Strategy."
- "Results are measurable. Outcomes are documented."

### Don't

- "Experience the revolutionary future of retail loyalty!"
- "Game-changing solutions"
- "Best-in-class innovation"

---

## Templates & Assets

The Gray Rock Brand Kit includes:

- **Email template** — Max-width 600px, email-safe
- **Report template** — Max-width 1200px, Chart.js support
- **Website template** — Responsive, mobile breakpoints

All templates use `{{content}}` as the placeholder for injected content.

---

## File References

| Asset | Path |
|-------|------|
| Logo (BlueGray) | `public/images/logo.png` |
| Logo (White) | `public/images/logo-white.png` |
| Logo (Block) | `public/images/logo-block.png` |

The full Gray Rock Brand Kit (MeshMesh) includes email, report, and website templates. Extract from `MeshMesh - Gray Rock Brand Kit.zip` for template files and `brand-config.json`.

---

## Summary

Gray Rock is **the neutral standard**—stable, clear, and trustworthy. Every visual and verbal choice should reinforce that identity: restrained colors, clean typography, factual voice, and a logo that stands for solidity and strength.
