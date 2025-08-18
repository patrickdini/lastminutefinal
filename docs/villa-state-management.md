# Villa State Management Documentation

## Overview
Villa Tokay booking system uses comprehensive state management to preserve user selections across page navigation and browser sessions.

## State Storage Systems

### 1. LocalStorage (`villaTokenUserState`)
**Purpose**: Persistent user preferences and search criteria  
**Lifetime**: 24 hours  
**Location**: `public/script.js` lines 128-230

**Currently Saved**:
- `selectedAdults`: Number of adult guests
- `selectedChildren`: Number of child guests  
- `selectedCheckIn`: Calendar index for check-in date
- `selectedCheckOut`: Calendar index for check-out date
- `currentFilter`: Date filter selection (default, weekend, etc.)
- `currentDateRange`: Specific date range selection
- `selectedFlexibility`: Flexibility pill selection (exact, 1, 2, 3 days)

**NOT Currently Saved**:
- ❌ Villa expansion state (Show/Hide Details)
- ❌ Selected offer within villa (when multiple booking options exist)

### 2. SessionStorage (`bookingData`)
**Purpose**: Booking confirmation data  
**Lifetime**: Browser tab session  
**Location**: `public/script.js` lines 2496-2534

**Contains**: Complete booking details for confirmation page

## State Management Functions

### Save State: `saveUserState(flexibility)`
- Captures current user selections
- Stores in localStorage with timestamp
- Called before booking navigation

### Load State: `loadUserState()`
- Retrieves and validates saved state (24-hour expiry)
- Restores user selections and UI state
- Returns false if no valid state found

### Clear State: `clearUserState()`
- Removes localStorage entry
- Used for reset/logout scenarios

## Villa Interaction States

### 1. Villa Expansion State
**Function**: `toggleVillaDetails(button)`  
**Location**: Lines 3448-3464  
**Mechanism**: 
- Toggles `expanded` class on button
- Shows/hides `.villa-details-collapsible` element
- Updates button text and icon

### 2. Offer Selection Within Villa
**Function**: `selectChampionNights(cardId, offerId)`  
**Location**: Lines 3467-3576  
**Mechanism**:
- Sets `active` class on selected booking option
- Updates villa card content (price, dates, perks)
- Modifies booking button behavior

## Navigation Flow

### Forward: Home → Confirmation
1. User clicks "BOOK NOW" → `handleChampionBooking()`
2. Saves current state → `saveUserState()`
3. Stores booking data → sessionStorage
4. Navigates to `/confirm-booking`

### Backward: Confirmation → Home  
1. User clicks "Back to Special Offers" → `goBackToOffers()`
2. Redirects to `/` homepage
3. State restored from localStorage → `loadUserState()`
4. **MISSING**: Villa expansion + offer selection restoration

## Enhancement Needed

To preserve villa expansion and offer selection states on back navigation:

1. **Extend State Management**: Add villa expansion and selected offer tracking
2. **Capture Pre-Booking State**: Save which villa was expanded and which offer selected
3. **Restoration Logic**: Restore villa expansion and highlight correct offer on return

## Key Files

- **Main Logic**: `public/script.js` (ActivitiesDashboard class)
- **Confirmation Page**: `public/confirm-booking.js` (goBackToOffers function)
- **State Key**: `'villaTokenUserState'` in localStorage