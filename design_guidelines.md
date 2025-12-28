# GenieSugar Design Guidelines

## Design Approach

**Selected System:** Material Design 3 with Healthcare Optimization  
**Justification:** Information-dense medical application requiring clear data hierarchy, established patterns for trust, and robust component library for charts and forms.

**Core Principles:**
- Clarity over decoration (medical data must be instantly readable)
- Consistent hierarchy (patient safety depends on clear information architecture)
- Accessibility-first (healthcare compliance requirement)

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for numerical data, glucose readings)

**Scale:**
- Hero/Dashboard Headers: text-4xl font-bold (Inter)
- Section Headers: text-2xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Data Labels: text-sm font-medium
- Glucose Values: text-3xl font-bold (JetBrains Mono)
- Timestamps/Meta: text-xs font-normal

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16  
**Component Padding:** p-6 (cards), p-8 (sections), p-4 (forms)  
**Vertical Rhythm:** space-y-6 (default), space-y-8 (major sections)

**Grid Structure:**
- Dashboard: 3-column grid (lg:grid-cols-3) for metric cards
- Forms: Single column max-w-2xl centered
- Tables/Lists: Full width with max-w-6xl
- Charts: 2-column split (lg:grid-cols-2) for comparative views

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with logo left, navigation center, user menu right
- Height: h-16
- Items: Dashboard, Logs, Reports, Care Team, Profile
- Mobile: Hamburger menu (slide-out drawer)

**Role-Specific Navigation:**
- Patient: Primary nav with all features
- Physician/Dietitian: Simplified nav focusing on patient list + reports
- Admin: Separate admin panel with user management

### Dashboard Widgets

**Metric Cards (3-column grid):**
- Latest glucose reading with large numerical display (JetBrains Mono, text-4xl)
- 7-day average with trend indicator (↑↓)
- Alert count badge (high/low readings)
- Card structure: p-6, rounded-xl, shadow-sm, border

**Trend Chart Widget:**
- Full-width chart area
- Height: h-80
- Include: Line graph with time-based x-axis, glucose range y-axis
- Legend and date range selector integrated

**Recent Activity Feed:**
- Last 5 entries (glucose/food/activity)
- List items with icon, description, timestamp
- "View All" link at bottom

### Forms & Input

**Glucose Entry Form:**
- Large numeric input for value (text-2xl, JetBrains Mono)
- DateTime picker (native HTML5 input)
- Optional note textarea
- Clear validation messages below each field
- Submit button: Full-width on mobile, fixed-width on desktop

**Food/Activity Logs:**
- Multi-field forms in single-column layout
- Dropdowns for meal type/activity type
- Text inputs for descriptions
- Duration/portion fields side-by-side (grid-cols-2)

**Validation:**
- Inline error messages (text-sm, positioned below field)
- Success states with checkmark icons
- Required field indicators (asterisk)

### Data Displays

**Log Tables:**
- Alternating row treatment for readability
- Sticky headers on scroll
- Actions column (edit/delete icons) aligned right
- Mobile: Stack as cards with key info

**Reports Section:**
- Date range filter at top (from/to pickers)
- Chart tabs: Daily, Weekly, Monthly views
- Summary stats cards above charts (grid-cols-4)
- Export buttons: CSV (primary), PDF (secondary)

### Care Team Management

**Patient Sharing Interface:**
- Care team member cards (grid-cols-2 lg:grid-cols-3)
- Each card: Avatar, name, role, permission toggles
- Add member button prominent (top-right)
- Revoke access as destructive action (confirmation modal)

**Provider Dashboards:**
- Patient list with search/filter
- Each patient row: Name, last reading, alert status, last sync time
- Click row to view full patient dashboard

### Modals & Overlays

**Standard Modal:**
- Max-width: max-w-lg
- Backdrop: Semi-transparent overlay
- Close button: Top-right corner (X icon)
- Actions: Right-aligned at bottom (Cancel, Confirm)

---

## Page-Specific Layouts

### Landing Page
**Hero Section:** h-screen with centered content  
- Large headline (text-5xl)
- Subtitle (text-xl, max-w-2xl)
- CTA buttons: Login (primary), Register (secondary)
- Background: Medical/healthcare imagery (blurred backdrop)
- Buttons with backdrop-blur-sm treatment

**Features Grid:** 3 columns (lg:grid-cols-3)  
- Icon (Heroicons library)
- Title (text-xl)
- Description (text-base)
- Padding: py-20

**Footer:** Full-width with disclaimer text (educational use only)

### Dashboard (Patient)
**Layout:** Sidebar + main content
- Sidebar: w-64, fixed left (navigation items)
- Main: ml-64, p-8
- Mobile: Sidebar collapses, hamburger menu

**Widget Grid:** 
- Top row: 3 metric cards (grid-cols-3)
- Middle: Full-width chart (h-96)
- Bottom: 2-column (Recent logs left, Quick actions right)

### Reports Page
- Filter bar: Sticky top, py-4, bg-white, shadow-sm
- Chart area: Full-width, h-96
- Stats grid below: grid-cols-4, gap-4
- Export section: Right-aligned buttons

---

## Icons & Assets

**Icon Library:** Heroicons (CDN)  
**Common Icons:**
- Glucose: Beaker
- Food: Cake
- Activity: Fire
- Reports: ChartBar
- Settings: Cog
- User: UserCircle
- Alert: ExclamationTriangle

---

## Images

**Hero Image (Landing):**
- Description: Clean, professional healthcare setting - modern clinic or patient using digital health device
- Treatment: Blur overlay (backdrop-blur-md) with gradient
- Placement: Full-screen background for hero section
- Buttons: Implement backdrop-blur-sm for glass-morphism effect

**Dashboard (No images):** Data-focused interface, no decorative imagery

**Profile Avatars:** Use placeholder circles with user initials for all user profiles

---

## Accessibility Standards

- All form inputs include visible labels (not just placeholders)
- Focus states: 2px outline with offset
- Color contrast: WCAG AA minimum for all text
- Keyboard navigation: Full support with visible focus indicators
- ARIA labels for all interactive elements and data visualizations
- Screen reader announcements for glucose alerts

---

## Responsive Breakpoints

- Mobile: < 768px (single column, stacked cards)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (3-column grids, sidebar visible)