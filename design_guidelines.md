# Smart Shopping List Application - Design Guidelines

## Design Approach: Modern Productivity System

**Selected Approach:** Design System with Productivity App Inspiration  
**Primary References:** Notion (clean layouts), Todoist (list management), Linear (typography & spacing)  
**Rationale:** This is a utility-focused application requiring efficient data display, quick interactions, and clear information hierarchy. The design prioritizes usability while maintaining visual appeal through thoughtful use of color and space.

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 250 70% 50% (vibrant blue - actions, CTAs)
- Secondary: 210 15% 25% (dark slate - text, headers)
- Background: 0 0% 98% (off-white)
- Surface: 0 0% 100% (white cards)
- Success: 142 70% 45% (green - completed items)
- Warning: 38 92% 50% (orange - urgent items)
- Error: 0 72% 51% (red - alerts)
- Border: 220 13% 91% (light gray)

**Dark Mode:**
- Primary: 250 70% 60% (lighter blue for contrast)
- Secondary: 210 20% 98% (light text)
- Background: 222 47% 11% (deep slate)
- Surface: 217 33% 17% (elevated dark cards)
- Success: 142 70% 55%
- Warning: 38 92% 60%
- Error: 0 72% 61%
- Border: 217 20% 25%

### B. Typography

**Font Stack:**
- Primary: 'Inter', -apple-system, system-ui, sans-serif
- Headings: 'Cal Sans' or 'Inter' with weight 600-700
- Monospace: 'JetBrains Mono' (for order IDs, quantities)

**Scale:**
- Hero/H1: text-4xl md:text-5xl, font-bold, tracking-tight
- H2: text-2xl md:text-3xl, font-semibold
- H3: text-xl font-semibold
- Body: text-base, leading-relaxed
- Small: text-sm
- Micro: text-xs (labels, metadata)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Card padding: p-6
- Section spacing: py-12 md:py-20
- Element gaps: gap-4 or gap-6
- Container max-width: max-w-7xl
- Content max-width: max-w-4xl

**Grid Structure:**
- Lists: Single column on mobile, 2-3 columns on desktop for list overview
- Products: Grid with 2-4 columns (responsive)
- Dashboard: Flexible grid with auto-fit minmax pattern

### D. Component Library

**Navigation:**
- Top navbar: Sticky, backdrop-blur, with logo, main nav, user menu
- Mobile: Hamburger menu with slide-in drawer
- Breadcrumbs for deep navigation (lists > items)

**Lists & Items:**
- List cards: Rounded corners (rounded-xl), shadow-sm, hover:shadow-md transition
- List items: Checkbox, item name, quantity badge, action menu (three dots)
- Drag handles for reordering
- Status indicators: Color-coded dots (urgent=orange, completed=green)

**Forms:**
- Input fields: Rounded borders, focus:ring-2 with primary color
- NLP input: Large textarea with "Try: 3 kg apples" placeholder
- Dropdown selects with search capability
- Toggle switches for preferences

**Cards:**
- Product cards: Image thumbnail, title, price, stock indicator, add-to-list button
- Order cards: Order number, date, status badge, item count, total price
- Elevated appearance with subtle borders

**Data Display:**
- Tables: Minimal borders, alternating row backgrounds, sticky headers
- Stats: Large numbers with small labels underneath
- Badges: Pill-shaped for status (rounded-full, px-3 py-1, text-xs)

**AI Agent Interfaces:**
- Chat widget: Bottom-right floating button, expands to chat panel
- NLP parser: Inline feedback showing parsed entities (quantity in blue, item in green)
- Recommendations: Horizontal scrolling cards with "Add to list" quick action
- Agent status indicators: Pulsing dot when processing

**Buttons:**
- Primary: bg-primary text-white, px-6 py-2.5, rounded-lg, font-medium
- Secondary: border-2 border-primary text-primary, hover:bg-primary/10
- Ghost: text-primary hover:bg-primary/10
- Icon buttons: p-2 rounded-md hover:bg-gray-100

**Modals & Overlays:**
- Modal backdrop: bg-black/50 backdrop-blur-sm
- Modal content: rounded-2xl, max-w-lg, p-8
- Slide-in panels for filters/settings (from right)

### E. Interactions & Feedback

**Micro-interactions:**
- Checkbox animations: Scale and color transition on check
- Item completion: Strike-through with fade effect
- Add to cart: Brief scale animation on button
- Loading states: Skeleton screens for lists, spinner for actions

**Notifications:**
- Toast notifications: Top-right, slide-in animation
- Inline alerts: Rounded containers with icon and message
- Success: Green border-l-4 accent
- Error: Red border-l-4 accent

**Animations:** Use sparingly
- Page transitions: Subtle fade (100ms)
- Hover states: scale-105 on cards
- Modal entrance: Scale from 95% to 100% with fade

---

## Page-Specific Layouts

**Dashboard/Home:**
- Hero section: Welcome message, quick stats (lists count, items pending, recent orders)
- Quick actions: Large buttons for "Create List", "Browse Products", "View Orders"
- Recent lists: Grid of 3-4 list cards with preview of first 3 items

**Shopping Lists Page:**
- Header: Page title, "Create New List" button
- List grid: 2-3 columns of list cards
- Each card shows: list name, item count, last updated, quick preview
- Sidebar filter: Filter by date, status, tags

**List Detail Page:**
- List header: Title (editable inline), share button, settings dropdown
- NLP input: Prominent input at top - "Add items in plain text"
- Items section: Grouped by status (pending, urgent, completed)
- Collapsible completed items section
- Bottom action bar: "Add to cart" or "Create order" button

**Product Catalog:**
- Search bar with filters (category, price range, in-stock)
- Grid layout: 3-4 columns of product cards
- Each card: Image, name, price, stock badge, quick-add button
- Pagination or infinite scroll

**Orders Page:**
- Order history table/cards
- Filters: Date range, status, payment method
- Each order: Expandable to show order items
- Status timeline visualization

**AI Agent Panels:**
- Chatbot: Floating chat bubble, expands to chat window with message history
- Recommendations: Dedicated section showing "Based on your history" cards
- NLP feedback: Inline parsing results with entity highlighting

---

## Images

**Product Images:**
- Product cards: Square thumbnails (1:1 ratio), 200x200px minimum
- Product detail: Larger image with zoom capability
- Placeholder for missing images: Subtle gradient with product icon

**No Hero Image:** This is a utility app focused on functionality over marketing appeal

**Icons:** Use Heroicons (outline for navigation, solid for status indicators)

---

## Responsive Behavior

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Mobile: Single column, bottom navigation, full-width cards
- Tablet: 2-column grids, sidebar filters become dropdowns
- Desktop: Multi-column layouts, persistent sidebars, hover states active