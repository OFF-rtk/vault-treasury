# Vault Treasury — Design System

> Professional fintech design system for treasury management operations.

---

## Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Trust & Security** | Blue-dominant palette, lock icons, clear status indicators |
| **Data-First** | Content hierarchy, ample whitespace, minimal chrome |
| **Efficiency** | Quick actions, keyboard shortcuts, minimal clicks |
| **Clarity** | No ambiguity in status, clear call-to-action buttons |

---

## Color System

### Primary Palette (Trust Blue)

```css
--primary-50:  #eff6ff;   /* Lightest - Backgrounds */
--primary-100: #dbeafe;   /* Hover states */
--primary-200: #bfdbfe;   /* Borders, dividers */
--primary-500: #3b82f6;   /* Primary buttons, links */
--primary-600: #2563eb;   /* Primary hover */
--primary-700: #1d4ed8;   /* Active states */
--primary-900: #1e3a8a;   /* Dark accents */
```

### Semantic Colors

```css
/* Success - Approved, Completed */
--success-50:  #f0fdf4;
--success-500: #22c55e;
--success-700: #15803d;

/* Warning - Pending, Review Required */
--warning-50:  #fffbeb;
--warning-500: #f59e0b;
--warning-700: #b45309;

/* Danger - Rejected, Blocked, Critical */
--danger-50:  #fef2f2;
--danger-500: #ef4444;
--danger-700: #b91c1c;

/* Neutral - UI Chrome, Text */
--gray-50:  #f9fafb;   /* Page background */
--gray-100: #f3f4f6;   /* Card backgrounds */
--gray-200: #e5e7eb;   /* Borders */
--gray-400: #9ca3af;   /* Muted text */
--gray-600: #4b5563;   /* Secondary text */
--gray-900: #111827;   /* Primary text */
```

### Dark Mode

```css
--dark-bg:      #0f172a;   /* Slate 900 */
--dark-card:    #1e293b;   /* Slate 800 */
--dark-border:  #334155;   /* Slate 700 */
--dark-text:    #f1f5f9;   /* Slate 100 */
--dark-muted:   #94a3b8;   /* Slate 400 */
```

---

## Typography

### Font Stack

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

### Scale

| Token | Size | Weight | Use Case |
|-------|------|--------|----------|
| `display` | 36px | 600 | Page titles |
| `heading-1` | 24px | 600 | Section headers |
| `heading-2` | 20px | 600 | Card titles |
| `heading-3` | 16px | 600 | Subsection headers |
| `body` | 14px | 400 | Default text |
| `body-sm` | 13px | 400 | Secondary info |
| `caption` | 12px | 400 | Labels, timestamps |
| `mono` | 13px | 400 | Amounts, IDs, codes |

### Money Display

```css
/* Always use tabular figures for amounts */
.amount {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* Positive amounts */
.amount-positive { color: var(--success-600); }

/* Negative amounts */
.amount-negative { color: var(--danger-600); }
```

---

## Spacing & Layout

### Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### Layout Grid

```
┌────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)  │        MAIN CONTENT (fluid)         │
│  ─────────────────────  │  ────────────────────────────────── │
│  • Logo                 │  ┌─────────────────────────────────┐ │
│  • Navigation           │  │  Page Header + Breadcrumbs      │ │
│  • Quick Actions        │  ├─────────────────────────────────┤ │
│                         │  │                                 │ │
│  ─────────────────────  │  │  Content Area                   │ │
│  • User Info            │  │  (max-width: 1280px, centered)  │ │
│  • Settings             │  │                                 │ │
│                         │  └─────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Components (Shadcn UI)

### Required Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add separator
```

### Button Variants

| Variant | Use Case |
|---------|----------|
| `default` | Primary actions (Approve, Submit) |
| `destructive` | Dangerous actions (Reject, Deactivate) |
| `outline` | Secondary actions (Cancel, Back) |
| `ghost` | Tertiary actions (Edit, View) |
| `link` | Navigation links |

### Status Badges

```tsx
// Payment Status
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>
<Badge variant="secondary">Draft</Badge>

// User Status
<Badge variant="success">Active</Badge>
<Badge variant="destructive">Deactivated</Badge>
<Badge variant="warning">Pending Approval</Badge>
```

---

## Data Display

### Tables

```
┌─────────────────────────────────────────────────────────────────────┐
│ □  Reference    │ Beneficiary      │ Amount      │ Status  │ Action│
├─────────────────────────────────────────────────────────────────────┤
│ □  PAY-2024-001 │ Acme Corp        │ $125,000.00 │ Pending │ ••• ▼ │
│ □  PAY-2024-002 │ Global Supplies  │  $45,750.00 │ Pending │ ••• ▼ │
│ □  PAY-2024-003 │ Tech Solutions   │  $89,200.00 │ Approved│ ••• ▼ │
└─────────────────────────────────────────────────────────────────────┘
  ↑ Checkbox       ↑ Left-aligned     ↑ Right-aligned  ↑ Badge  ↑ Dropdown
```

**Rules:**
- Numbers always right-aligned with monospace font
- Status always uses badges
- Actions in dropdown menu (Edit, View Details, Approve, Reject)
- Checkbox for bulk actions

### Cards (Metrics)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Pending Queue   │  │ Today's Volume  │  │ Approval Rate   │
│                 │  │                 │  │                 │
│      12         │  │  $1,245,000     │  │      94.2%      │
│                 │  │                 │  │                 │
│ ↑ 3 from yday   │  │ ↓ 12% vs avg    │  │ ↑ 2.1% vs week  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Payment Queue UI

### Priority Status Indicators

| Priority | Visual Treatment |
|----------|------------------|
| **Critical** | Red left border, red badge, top of list |
| **High** | Orange left border, amber badge |
| **Normal** | No border, gray badge |
| **Low** | Gray text, bottom of list |

### Quick Action Buttons

```
┌─────────────────────────────────────────────────────────────────────┐
│  PAY-2024-001  │  Acme Corp  │  $125,000.00  │  ┌────────────────┐  │
│                │             │               │  │ ✓ Approve      │  │
│  Wire Transfer │  Due: Today │  CRITICAL     │  │ ✗ Reject       │  │
│                │             │               │  │ ⋯ More         │  │
│                │             │               │  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Challenge Modal (Behavioral 2FA)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Security Verification                        │
│                                                                     │
│   Please type the following text to verify your identity:          │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │  "The quick brown fox jumps over the lazy dog near the   │    │
│   │   river bank on a warm summer afternoon."                 │    │
│   └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │  _                                                        │    │
│   │                                                           │    │
│   └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│   ████████████░░░░░░░░░░░░░░░░░░░  45% complete                    │
│                                                                     │
│                                             [ Cancel ] [ Verify ]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Icons

### Recommended: Lucide Icons (works with Shadcn)

```bash
npm install lucide-react
```

| Icon | Use |
|------|-----|
| `CheckCircle` | Approved, Success |
| `XCircle` | Rejected, Error |
| `Clock` | Pending, Waiting |
| `AlertTriangle` | Warning, Review |
| `Lock` | Security, Locked |
| `Shield` | Protection, Verified |
| `DollarSign` | Payments, Amounts |
| `Building` | Accounts, Organizations |
| `User` | User management |
| `Settings` | Configuration |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | Min 4.5:1 for text, 3:1 for UI |
| Focus indicators | 2px ring, offset for all interactive |
| Keyboard nav | All actions reachable via keyboard |
| Screen readers | Proper ARIA labels on all elements |
| Motion | Respect `prefers-reduced-motion` |

---

## Animations (Snappy & Minimal)

> **Philosophy:** Instant feedback, no waiting. Animations should feel *crisp* — users shouldn't notice them, but would miss them if gone.

### Timing Constants

```css
/* CSS Variables */
--duration-instant: 50ms;    /* Micro-feedback (press states) */
--duration-fast: 120ms;      /* Quick transitions */
--duration-normal: 200ms;    /* Standard animations */
--duration-slow: 300ms;      /* Modals, overlays */

/* Easing - "Snappy" curve */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* Starts fast, ends smooth */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### Using Framer Motion

```bash
npm install framer-motion
```

---

### Button Press (Tactile Feedback)

```tsx
// Snappy scale on press - feels like a real button
<motion.button
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.05, ease: "easeOut" }}
>
  Approve
</motion.button>
```

---

### Card Hover (Subtle Lift)

```tsx
// Micro shadow lift - indicates interactivity
<motion.div
  whileHover={{ 
    y: -2,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  }}
  transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
>
  <PaymentCard />
</motion.div>
```

---

### Modal (Fast Enter, Faster Exit)

```tsx
// Enter: scale + fade from below
// Exit: quick fade out
const modalVariants = {
  hidden: { 
    opacity: 0, 
    y: 8,
    scale: 0.98 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.1 }  // Fast exit
  }
};
```

---

### Table Row (Hover Highlight)

```tsx
// Subtle background shift on hover - premium feel
<motion.tr
  whileHover={{ 
    backgroundColor: "rgba(59, 130, 246, 0.04)"  // Faint blue tint
  }}
  transition={{ duration: 0.12 }}
/>
```

```css
/* CSS alternative */
tr {
  transition: background-color 120ms ease-out;
}
tr:hover {
  background-color: var(--primary-50);
}
```

---

### Interactive Elements (Premium Subtle Effects)

```css
/* Buttons - color shift on hover, not just opacity */
.btn-primary {
  background: var(--primary-500);
  transition: background-color 120ms ease-out, 
              box-shadow 120ms ease-out;
}
.btn-primary:hover {
  background: var(--primary-600);
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

/* Input focus - soft glow ring */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  border-color: var(--primary-400);
  transition: box-shadow 150ms ease-out, border-color 150ms ease-out;
}

/* Cards - border color shift on hover */
.card {
  border: 1px solid var(--gray-200);
  transition: border-color 120ms ease-out;
}
.card:hover {
  border-color: var(--gray-300);
}

/* Navigation items - background slide */
.nav-item {
  position: relative;
  transition: color 120ms ease-out;
}
.nav-item:hover {
  color: var(--primary-600);
}
.nav-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--primary-50);
  border-radius: 6px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 120ms ease-out;
}
.nav-item:hover::before {
  transform: scaleX(1);
}

/* Amount cells - subtle emphasis on hover */
.amount:hover {
  color: var(--gray-900);  /* Slightly darker */
}
```

---

### Toast Notifications

```tsx
// Slide in from right, slide out right
const toastVariants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 50, opacity: 0 }
};

// Duration: 120ms enter, 80ms exit
```

---

### Loading States (No Spinners)

```tsx
// Skeleton shimmer instead of spinners
// Feels less "waiting", more "loading content"
<motion.div
  className="skeleton"
  animate={{ 
    backgroundPosition: ["200% 0", "-200% 0"] 
  }}
  transition={{ 
    duration: 1.5, 
    repeat: Infinity,
    ease: "linear"
  }}
/>
```

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-100) 0%,
    var(--gray-50) 50%,
    var(--gray-100) 100%
  );
  background-size: 200% 100%;
}
```

---

### Progress Bar (Challenge Modal)

```tsx
// Smooth progress updates
<motion.div
  className="progress-fill"
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.1, ease: "easeOut" }}
/>
```

---

### Animation Reference Table

| Element | Trigger | Effect | Duration |
|---------|---------|--------|----------|
| Button | Press | Scale to 0.97 | 50ms |
| Button | Hover | Background color shift | 120ms |
| Card | Hover | Border color shift | 120ms |
| Table row | Hover | Faint blue background | 120ms |
| Input | Focus | Soft glow ring | 150ms |
| Nav item | Hover | Background slide + color | 120ms |
| Modal | Enter | Fade + Y 8px + scale | 200ms |
| Modal | Exit | Fade only | 100ms |
| Toast | Enter | X 100→0 | 120ms |
| Toast | Exit | X 0→50 | 80ms |
| Dropdown | Open | Scale 0.95→1, fade | 120ms |
| Dropdown | Close | Fade only | 80ms |
| Dropdown | Open | Scale 0.95→1, fade | 120ms |
| Dropdown | Close | Fade only | 80ms |

---

### Reduced Motion

```tsx
// Always respect user preferences
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// In Framer Motion
<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
/>
```

---

## File Structure

```
frontend/
├── app/
│   └── globals.css          # CSS variables, base styles
├── components/
│   ├── ui/                   # Shadcn components
│   └── treasury/
│       ├── PaymentCard.tsx
│       ├── MetricCard.tsx
│       ├── StatusBadge.tsx
│       └── ChallengeModal.tsx
└── lib/
    └── cn.ts                 # clsx + tailwind-merge
```
