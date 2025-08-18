# Villa UI Components Documentation

## Villa Card Structure

Each villa is rendered as a `.champion-offer-card` with the following key components:

### 1. Hero Section
- **Carousel Images**: Multiple villa photos with navigation
- **Price Overlay**: Shows rate in millions IDR
- **Pool Type Overlay**: Displays pool type (Private/Shared)

### 2. Savings Banner
- **Condition**: Only shown when `savings > 0`
- **Content**: "You Save X.XM (XX%) !"
- **Styling**: Gold accent color background

### 3. Show Details Button
- **Condition**: Only shown when savings banner exists
- **Function**: `toggleVillaDetails(button)` 
- **States**:
  - Collapsed: "Show Detailed Offer" with down chevron
  - Expanded: "Hide Details" with up chevron

### 4. Collapsible Details Section
- **Class**: `.villa-details-collapsible`
- **Default**: `display: none`
- **Contains**:
  - Villa tagline and description
  - Check-in information
  - Included perks display
  - Booking options (multiple dates)
  - "BOOK NOW" button

## Booking Options Within Villa

When flexibility is applied, villas show multiple booking options:

### Timeline Display
- **Multiple Check-in Dates**: Different dates within flexibility window
- **Selection Mechanism**: `selectChampionNights(cardId, offerId)`
- **Active State**: `.active` class on selected option
- **Dynamic Updates**: Price, dates, perks change with selection

### Booking Option Structure
```html
<div class="booking-option">
  <button class="night-selector-btn" data-offer-id="123">
    Aug 27 (2n)
  </button>
</div>
```

## State Classes

### Villa Expansion
- **Button State**: `.expanded` class
- **Content State**: `display: block/none` on `.villa-details-collapsible`

### Offer Selection  
- **Button State**: `.active` class on selected booking option
- **Content Updates**: Dynamic text/price updates via `data-field` attributes

## Data Attributes

### Villa Cards
- `data-offer-id`: Primary offer identifier
- `data-current-offer`: JSON string of current offer data
- `data-images`: JSON array of villa images

### Booking Options
- `data-offer-id`: Specific offer identifier for selection
- `data-card-id`: Parent villa card identifier

### Content Fields
- `data-field="duration"`: Nights display
- `data-field="price"`: Price display  
- `data-field="dates"`: Date range display
- `data-field="perks"`: Perks container
- `data-field="book-btn"`: Booking button

## Event Handlers

### Villa Expansion
```javascript
onclick="app.toggleVillaDetails(this)"
```

### Offer Selection
```javascript
onclick="app.selectChampionNights('${cardId}', '${offerId}')"
```

### Booking Action
```javascript
onclick="app.handleChampionBooking('${offerId}', '${villaKey}')"
```

## CSS Classes

### Core Structure
- `.champion-offer-card`: Main villa container
- `.champion-hero`: Image and overlay section
- `.champion-content`: Collapsible content area
- `.villa-details-collapsible`: Expandable details section

### Interactive Elements
- `.show-details-btn`: Expansion toggle button
- `.night-selector-btn`: Booking option selector
- `.champion-book-btn`: Main booking button

### State Classes
- `.expanded`: Applied to expanded details button
- `.active`: Applied to selected booking option
- `.selected`: Applied to selected flexibility pill

## Responsive Behavior
- Mobile-first design with CSS Grid/Flexbox
- Cards stack vertically on mobile
- Image carousels maintain aspect ratio
- Touch-friendly button sizing