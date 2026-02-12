# Command Center v4 — Design System

## Philosophy

Every token, every value, every component exists for a reason. This design system follows the Jobs/Ive principle: **simplicity is architecture**. If a token isn't used, it doesn't exist. If a component can be simpler, it must be.

Mobile-first. Responsive as enhancement, not afterthought.

## Color Palette

### Semantic Colors

Colors serve meaning, not decoration. Restrained palette — every color has a job.

#### Light Mode

```css
/* Backgrounds */
--color-bg-primary:       #FFFFFF;        /* Main content background */
--color-bg-secondary:     #F9FAFB;        /* Cards, panels, sidebar */
--color-bg-tertiary:      #F3F4F6;        /* Inset areas, code blocks */
--color-bg-inverse:       #111827;        /* Inverted sections */

/* Text */
--color-text-primary:     #111827;        /* Headings, primary content */
--color-text-secondary:   #6B7280;        /* Descriptions, metadata */
--color-text-tertiary:    #9CA3AF;        /* Placeholders, disabled text */
--color-text-inverse:     #FFFFFF;        /* Text on inverse backgrounds */

/* Borders */
--color-border-primary:   #E5E7EB;        /* Card borders, dividers */
--color-border-secondary: #F3F4F6;        /* Subtle separators */
--color-border-focus:     #4F46E5;        /* Focus rings */

/* Interactive */
--color-accent:           #4F46E5;        /* Primary actions, active states */
--color-accent-hover:     #4338CA;        /* Hover state */
--color-accent-subtle:    #EEF2FF;        /* Accent background (tags, pills) */

/* Status — used sparingly, only for meaning */
--color-status-success:   #059669;        /* Done, completed, healthy */
--color-status-warning:   #D97706;        /* Attention needed, planned */
--color-status-danger:    #DC2626;        /* Blocked, error, critical */
--color-status-info:      #2563EB;        /* Active, in progress */
--color-status-neutral:   #6B7280;        /* Idle, no status */

/* Status backgrounds (subtle) */
--color-status-success-bg: #ECFDF5;
--color-status-warning-bg: #FFFBEB;
--color-status-danger-bg:  #FEF2F2;
--color-status-info-bg:    #EFF6FF;
```

#### Dark Mode

```css
/* Backgrounds */
--color-bg-primary:       #0F1117;
--color-bg-secondary:     #1A1D27;
--color-bg-tertiary:      #242733;
--color-bg-inverse:       #FFFFFF;

/* Text */
--color-text-primary:     #F9FAFB;
--color-text-secondary:   #9CA3AF;
--color-text-tertiary:    #6B7280;
--color-text-inverse:     #111827;

/* Borders */
--color-border-primary:   #2D3141;
--color-border-secondary: #1F2233;
--color-border-focus:     #818CF8;

/* Interactive */
--color-accent:           #818CF8;
--color-accent-hover:     #6366F1;
--color-accent-subtle:    #1E1B4B;

/* Status colors remain the same but with dark backgrounds */
--color-status-success:   #34D399;
--color-status-warning:   #FBBF24;
--color-status-danger:    #F87171;
--color-status-info:      #60A5FA;
--color-status-neutral:   #9CA3AF;

--color-status-success-bg: #064E3B;
--color-status-warning-bg: #451A03;
--color-status-danger-bg:  #450A0A;
--color-status-info-bg:    #1E3A5F;
```

### Project Colors

Each project gets an accent color for visual identification. 8 options, no more:

```css
--color-project-indigo:   #4F46E5;
--color-project-emerald:  #059669;
--color-project-amber:    #D97706;
--color-project-rose:     #E11D48;
--color-project-cyan:     #0891B2;
--color-project-violet:   #7C3AED;
--color-project-orange:   #EA580C;
--color-project-slate:    #475569;
```

## Typography

One typeface family. No mixing. Inter (system fallback: -apple-system, sans-serif).

```css
--font-family:            'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Scale — based on 1.200 minor third ratio */
--font-size-xs:           0.75rem;   /* 12px — metadata, timestamps */
--font-size-sm:           0.875rem;  /* 14px — secondary text, table cells */
--font-size-base:         1rem;      /* 16px — body text, inputs */
--font-size-lg:           1.125rem;  /* 18px — card titles, section headers */
--font-size-xl:           1.25rem;   /* 20px — page section headers */
--font-size-2xl:          1.5rem;    /* 24px — page titles */
--font-size-3xl:          1.875rem;  /* 30px — dashboard hero numbers */

/* Weights — three only */
--font-weight-normal:     400;       /* Body text */
--font-weight-medium:     500;       /* Labels, table headers, metadata */
--font-weight-semibold:   600;       /* Headings, emphasis, numbers */

/* Line heights */
--line-height-tight:      1.25;      /* Headings */
--line-height-normal:     1.5;       /* Body */
--line-height-relaxed:    1.75;      /* Long-form text */

/* Letter spacing */
--tracking-tight:         -0.01em;   /* Large headings */
--tracking-normal:        0;         /* Everything else */
```

**Rules:**
- No `font-weight: 700` (bold). Semibold (600) is the max. Calm, not loud.
- No ALL CAPS. No letter-spacing on body text.
- Maximum 3 font sizes per screen. If you need a 4th, the hierarchy is wrong.

## Spacing

8px base grid. Everything aligns to multiples of 4px.

```css
--space-0:   0;
--space-1:   0.25rem;   /* 4px */
--space-2:   0.5rem;    /* 8px */
--space-3:   0.75rem;   /* 12px */
--space-4:   1rem;      /* 16px */
--space-5:   1.25rem;   /* 20px */
--space-6:   1.5rem;    /* 24px */
--space-8:   2rem;      /* 32px */
--space-10:  2.5rem;    /* 40px */
--space-12:  3rem;      /* 48px */
--space-16:  4rem;      /* 64px */
```

**Usage:**
- Component internal padding: `--space-3` to `--space-4`
- Between components: `--space-4` to `--space-6`
- Section gaps: `--space-8` to `--space-12`
- Page margins: `--space-4` (mobile), `--space-8` (tablet), `--space-12` (desktop)

## Border Radius

```css
--radius-sm:    4px;     /* Inputs, small pills */
--radius-md:    8px;     /* Cards, dropdowns */
--radius-lg:    12px;    /* Panels, modals */
--radius-xl:    16px;    /* Dashboard hero cards */
--radius-full:  9999px;  /* Circular elements, status dots */
```

## Shadows

Subtle, layered. Shadows create depth hierarchy, not decoration.

```css
/* Light mode */
--shadow-xs:    0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md:    0 4px 6px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
--shadow-lg:    0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04);
--shadow-xl:    0 20px 25px rgba(0, 0, 0, 0.10), 0 8px 10px rgba(0, 0, 0, 0.04);

/* Dark mode — shadows are subtler, use lighter values */
--shadow-xs:    0 1px 2px rgba(0, 0, 0, 0.2);
--shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
--shadow-md:    0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
--shadow-lg:    0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2);
```

**Usage:**
- Cards at rest: `--shadow-sm`
- Cards on hover: `--shadow-md`
- Modals/panels: `--shadow-lg`
- Dropdowns: `--shadow-md`

## Transitions

Consistent physics. Everything moves the same way.

```css
--transition-fast:     150ms cubic-bezier(0.4, 0, 0.2, 1);    /* Hovers, focus */
--transition-normal:   200ms cubic-bezier(0.4, 0, 0.2, 1);    /* Panels, toggles */
--transition-slow:     300ms cubic-bezier(0.4, 0, 0.2, 1);    /* Page transitions */
--transition-spring:   400ms cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Bouncy reveals */
```

**Rules:**
- Never exceed 400ms for any animation
- No decorative animations — every motion serves navigation or state change
- Prefer `transform` and `opacity` — never animate `width`, `height`, or `margin`

## Z-Index Scale

```css
--z-base:       0;
--z-dropdown:   100;
--z-sticky:     200;
--z-overlay:    300;
--z-modal:      400;
--z-toast:      500;
```

## Breakpoints

Mobile-first. Enhance upward.

```css
/* Mobile: default (0 – 639px) */
/* Tablet: */  @media (min-width: 640px)  { }
/* Desktop: */ @media (min-width: 1024px) { }
/* Wide: */    @media (min-width: 1280px) { }
```

No more than these 4 breakpoints. If something doesn't work in between, the component design is wrong.

## Grid

```css
/* Mobile: single column */
/* Tablet: 2 columns (cards), sidebar + content */
/* Desktop: sidebar (240px fixed) + content area (fluid, max 1200px) */
/* Wide: sidebar (280px fixed) + content area (fluid, max 1400px) */
```

Content area max-width prevents text from becoming unreadable on ultrawide displays.

## Components

See LEGOS.md (06-LEGOS.md) for full component specifications including all states.
