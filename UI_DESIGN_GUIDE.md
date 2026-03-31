# Charity Token UI Design System

## Brand Identity

The Charity Token app uses a premium fintech design inspired by the official Charity Token Project logo with a focus on trustworthiness, humanitarian values, futuristic aesthetics, and global empowerment.

## Color Palette

### Primary Colors
- **Deep Navy Blue**: `#0A1628` - Primary background (trustworthy, professional)
- **Teal Cyan**: `#00CEC9` - Primary interactive elements (modern, hopeful)
- **Emerald Green**: `#00B894` - Secondary accent (growth, sustainability)

### Supporting Colors
- **Pearl White**: `#F0F4F8` - Text and content (clean, readable)
- **Light Grey**: `#8FA3BF` - Muted foreground (secondary information)
- **Card Background**: `#0F1F35` - Elevated surfaces (subtle contrast)

### Functional Colors
- **Red**: `#FF6B6B` - Destructive/error states
- **Cyan/Teal Gradients**: `#00CEC9 → #00B894` - All interactive elements

## Typography

### Font Scale
- **Headings (H1)**: 48-56px, Bold (900), White (#F0F4F8)
- **Headings (H2)**: 32-36px, Bold (700), White (#F0F4F8)
- **Headings (H3)**: 20-24px, Bold (700), White (#F0F4F8)
- **Body Text**: 14-16px, Regular (400), Light Grey (#8FA3BF)
- **Labels**: 12-14px, Semibold (600), White (#F0F4F8)

### Font Family
- **Primary**: Geist Sans (system font stack)
- **Monospace**: Geist Mono

## Component Design

### Buttons

#### Primary Button (.charity-btn-primary)
```
- Background: Gradient teal-to-emerald (#00CEC9 → #00B894)
- Text: White, Bold
- Padding: py-2.5 px-6
- Border Radius: rounded-lg
- Shadow: Glow effect with shadow-lg hover:shadow-cyan-500/30
- Hover: Darker gradient shades
- States: Hover (enhanced glow), Focus (ring), Disabled (opacity)
```

#### Secondary Button (.charity-btn-secondary)
```
- Border: 2px solid rgba(0, 206, 201, 0.5)
- Text: Cyan (#00CEC9), Semibold
- Background: Transparent, hover:bg-cyan-500/10
- Padding: py-2.5 px-6
- Border Radius: rounded-lg
- Hover: Stronger border, glow effect
- Focus: ring-2 ring-cyan-400
```

### Cards

#### Glow Card (.charity-glow-card)
```
- Background: #0F1F35 (card color)
- Border: 2px solid rgba(0, 206, 201, 0.3)
- Border Radius: rounded-lg
- Transition: 300ms ease
- Hover: 
  - border-cyan-400/60
  - shadow-lg shadow-cyan-500/20
  - Subtle gradient overlay glow
- Padding: Flexible (p-6, p-8, p-12)
```

### Input Fields
```
- Background: #0F1F35 (card color)
- Border: 1px solid rgba(0, 206, 201, 0.3)
- Text: #F0F4F8 (white)
- Placeholder: #8FA3BF (muted)
- Focus:
  - border-cyan-400
  - ring-cyan-500/30
- Padding: px-3 py-2
- Border Radius: rounded-md
```

## Layout & Spacing

### Background
The main background uses a `.charity-bg` class with:
- Solid navy: `#0A1628`
- Radial gradient overlays with cyan/emerald at low opacity
- Creates depth without overwhelming the content

### Decorative Elements

#### Network Nodes (.network-node)
- Circular elements (various sizes: 64px to 384px)
- Border: 1px solid rgba(0, 206, 201, 0.3)
- Blur effect
- Positioned absolutely for depth
- Opacity: Subtle background decoration

#### Leaf Accents (.leaf-accent)
- Lucide-react Leaf icon
- Used in logo and brand elements
- Color: Cyan to Emerald gradient

### Spacing Scale
- Extra Small: 4px (gap-1, p-1)
- Small: 8px (gap-2, p-2)
- Medium: 16px (gap-4, p-4)
- Large: 24px (gap-6, p-6)
- Extra Large: 32px (gap-8, p-8)
- XXL: 48px (gap-12, p-12)

## Page Templates

### Landing Page
1. **Header**: Logo + nav with outline secondary button for sign in
2. **Hero**: Large heading, subtext, CTA buttons
3. **Role Cards**: Two glow cards (beneficiary/philanthropist) with icons
4. **How It Works**: 3-column grid with numbered circles
5. **Stats**: 4-column grid with glow cards
6. **Activation Methods**: 3 cards showing payment options
7. **CTA Section**: Final call to action
8. **Footer**: Simple text footer

### Auth Pages (Login/Register)
1. **Background**: charity-bg with network nodes
2. **Container**: Max-width card centered
3. **Logo**: Leaf icon + brand name with gradient text
4. **Form**: Input fields with proper styling
5. **Error Messages**: Red background with icon
6. **Link**: Cyan text for secondary actions

## Visual Hierarchy

1. **Primary Focus**: Glowing teal buttons, gradient text
2. **Secondary Focus**: Glow cards with teal borders
3. **Tertiary**: Muted text and borders
4. **Background**: Network nodes and gradients (supporting)

## Accessibility

- **Contrast**: All text meets WCAG AA standards
- **Interactive Elements**: Minimum 44x44px touch targets
- **Focus States**: Clear ring focus indicators
- **Icons**: Paired with text labels
- **Color**: Not solely reliant for meaning

## Animation & Interactions

### Transitions
- Standard: 300ms ease
- Hover effects: Scale 1.05 on stats, border/shadow on cards
- Button glow: Shadow effect on hover

### Hover States
- Buttons: Darker gradient + enhanced glow
- Cards: Border brightening + shadow enhancement
- Text Links: Color transition

## CSS Classes

### Utility Classes
```
.charity-bg              // Main background styling
.charity-btn-primary    // Primary button style
.charity-btn-secondary  // Secondary button style
.charity-glow-card      // Card with glow effect
.charity-text-gradient  // Cyan to emerald text gradient
.charity-gradient       // Cyan to green background gradient
.network-node          // Circular decorative element
.leaf-accent           // Leaf icon styling
.charity-card-glow     // Card pseudo-element glow
```

## Implementation Notes

### Dark Mode
- All colors are designed for dark theme
- No light mode toggle (dark-first design)
- Colors meet dark theme standards

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly on mobile (larger buttons, better spacing)

### Performance
- GPU-accelerated transforms on hover
- Minimal repaints with opacity/transform changes
- Optimized SVG/icon usage

## Brand Voice in UI

- **Trustworthy**: Deep colors, clean typography
- **Humanitarian**: Leaf motif, empowering messaging
- **Futuristic**: Glowing effects, gradients, network nodes
- **Global**: Inclusive design, accessible patterns

---

This design system ensures a cohesive, premium, and empowering experience across the entire Charity Token application.
