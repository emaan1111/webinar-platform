# Offer Display Visual Guide

## With All Features Enabled

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  MOTHERHOOD BALANCE PROGRAM         ┃  ← Title (Large, Bold)
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                     ┃
┃  A transformative program designed  ┃  ← Description
┃  for Muslim mothers seeking balance ┃
┃                                     ┃
┃  ┌───────────────────────────────┐ ┃
┃  │ ⏰ Offer ends in 2:45         │ ┃  ← Countdown Timer
┃  └───────────────────────────────┘ ┃     (Pulsing red gradient)
┃                                     ┃
┃  ✓ Islamic parenting principles    ┃  ← Bullet Points
┃  ✓ Self-care for mothers           ┃     (with checkmarks)
┃  ✓ Time management strategies      ┃
┃  ✓ Supportive community            ┃
┃                                     ┃
┃  $197  ~~$399~~  [ 50% OFF ]       ┃  ← Pricing Section
┃  ^^^^   ^^^^^^^   ^^^^^^^^^^^      ┃     Main, Crossed, Badge
┃  (big)  (strike)  (orange pill)    ┃
┃                                     ┃
┃  ╔════════════════════════════╗    ┃
┃  ║  Join the Program Now   → ║    ┃  ← CTA Button
┃  ╚════════════════════════════╝    ┃     (Full width, primary color)
┃                                     ┃
┃  🔒 Secure Payment                  ┃  ← Trust Badge
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Minimal Configuration (No Optional Fields)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  SPECIAL COURSE BUNDLE              ┃  ← Title
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                     ┃
┃                                     ┃
┃  $197                               ┃  ← Price Only
┃                                     ┃
┃                                     ┃
┃  ╔════════════════════════════╗    ┃
┃  ║   Get This Offer        → ║    ┃  ← CTA Button
┃  ╚════════════════════════════╝    ┃
┃                                     ┃
┃  🔒 Secure Payment                  ┃  ← Trust Badge
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## With Countdown Only

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  FLASH SALE BUNDLE                  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                     ┃
┃  Get instant access to everything   ┃
┃                                     ┃
┃  ┌───────────────────────────────┐ ┃
┃  │ ⏰ Offer ends in 0:45         │ ┃  ← Urgency!
┃  └───────────────────────────────┘ ┃
┃                                     ┃
┃  $97                                ┃
┃                                     ┃
┃  ╔════════════════════════════╗    ┃
┃  ║   Grab It Now           → ║    ┃
┃  ╚════════════════════════════╝    ┃
┃                                     ┃
┃  🔒 Secure Payment                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## With Discount Pricing

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  EARLY BIRD SPECIAL                 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                     ┃
┃  Limited spots available            ┃
┃                                     ┃
┃  $147  ~~$297~~  [ 50% OFF TODAY ] ┃  ← Value emphasis
┃                                     ┃
┃  ╔════════════════════════════╗    ┃
┃  ║   Lock In Your Spot     → ║    ┃
┃  ╚════════════════════════════╝    ┃
┃                                     ┃
┃  🔒 Secure Payment                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Animation States

### Countdown Timer Animation
```
Normal State:    ┌─────────────────────┐
                 │ ⏰ Offer ends in 2:45│
                 └─────────────────────┘

Pulse State:     ┏━━━━━━━━━━━━━━━━━━━━━┓
(Every 2s)       ┃ ⏰ Offer ends in 2:45┃  ← Slightly larger
                 ┗━━━━━━━━━━━━━━━━━━━━━┛      + brighter shadow
```

### Clock Icon Animation
```
Tick Animation:  ⏰  →  🕐  →  ⏰  (subtle rotation)
```

## Color Scheme

### Countdown Timer
- **Background**: Linear gradient from `#ff6b6b` to `#ee5a24` (red to orange)
- **Text**: White
- **Shadow**: Orange glow (`rgba(238, 90, 36, 0.3)`)
- **Animation**: Pulsing every 2 seconds

### Pricing
- **Main Price**: Large, bold, primary color (blue/purple)
- **Original Price**: Smaller, gray, strikethrough
- **Discount Badge**: Orange background, white text, pill shape

### CTA Button
- **Background**: Primary color (blue/purple)
- **Hover**: Secondary color + lift effect
- **Text**: White, bold

## Responsive Behavior

### Desktop (>768px)
```
┌─────────────┬────────────────────┐
│             │                    │
│   VIDEO     │    OFFER SIDEBAR   │
│             │    (Full offer     │
│   PLAYER    │     displayed)     │
│             │                    │
│             │                    │
└─────────────┴────────────────────┘
```

### Mobile (<768px)
```
┌─────────────┐
│             │
│   VIDEO     │
│   PLAYER    │
│             │
└─────────────┘
      ▼
┌─────────────┐
│   OFFER     │
│   (Full     │
│   Width)    │
└─────────────┘
```

## Timing Examples

### Countdown Display Format
- **300 seconds** → "Offer ends in 5:00"
- **185 seconds** → "Offer ends in 3:05"
- **65 seconds** → "Offer ends in 1:05"
- **9 seconds** → "Offer ends in 0:09"
- **0 seconds** → Countdown disappears (offer stays visible)

### Video Timestamp Examples
- **30 minutes** → Enter: `1800` (30 × 60)
- **45 minutes** → Enter: `2700` (45 × 60)
- **1 hour** → Enter: `3600` (60 × 60)

## User Experience Flow

1. **Before Offer Time**
   - Offer section not visible
   - User watching webinar

2. **Offer Appears** (at videoTimestamp)
   - Smooth fade-in animation
   - Brief highlight effect (3px border glow)
   - Countdown starts (if configured)

3. **During Offer Display**
   - Countdown ticks down every second
   - Pulsing animation draws attention
   - All configured elements visible

4. **Countdown Expires**
   - Timer reaches 0:00
   - Countdown element disappears
   - Offer remains visible
   - Other elements unchanged

5. **Offer Hides** (at hideAfter or video end)
   - Fade-out animation
   - Next offer appears (if scheduled)

## Field Configuration Impact

| Field | If Set | If Empty/Not Set |
|-------|--------|------------------|
| **Countdown Duration** | Shows pulsing timer | No timer shown |
| **Bullet Points** | Shows list with checkmarks | No bullets section |
| **Original Price** | Shows strikethrough price | Only main price |
| **Discount Label** | Shows orange badge | No badge |
| **Description** | Shows above countdown | Offer starts with countdown |
| **Hide After** | Disappears at time | Shows until video ends |

## CSS Classes Reference

```css
.offerContainer       /* Main offer box */
.offerTitle          /* Title text */
.offerDescription    /* Description paragraph */
.offerCountdown      /* Countdown timer bar */
.offerFeatures       /* Bullet points container */
.offerFeature        /* Individual bullet */
.offerFeatureIcon    /* Checkmark icon */
.offerPrice          /* Pricing section */
.priceCurrent        /* Main price */
.priceOriginal       /* Crossed-out price */
.priceDiscount       /* Discount badge */
.ctaButton           /* Call-to-action button */
.trustIndicators     /* Trust badges section */
```

## Testing Scenarios

### Scenario 1: Full-Featured Offer
- Set all fields
- Verify each element appears
- Check countdown counts down
- Verify timing

### Scenario 2: Minimal Offer
- Only required fields
- Verify no optional elements show
- Check clean appearance

### Scenario 3: Countdown Only
- Set countdown but not bullets/original price
- Verify only countdown and price show

### Scenario 4: No Countdown
- Leave countdown blank
- Verify offer works without timer

### Scenario 5: Multiple Offers
- Create 2-3 offers at different times
- Verify they appear/disappear correctly
- Check no overlap occurs
