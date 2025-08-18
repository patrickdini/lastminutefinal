/**
 * Activities Dashboard JavaScript
 * Handles frontend interactions and API communication
 * VERSION: CACHE_BUSTER_ROCKET_2025_08_18_V4
 */
console.log('🚀🚀🚀 SCRIPT LOADED - CACHE_BUSTER_ROCKET_2025_08_18_V4 🚀🚀🚀');

class ActivitiesDashboard {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentData = null;
        this.filteredData = null;
        this.isLoading = false;
        this.currentFilter = 'default'; // Default filter
        this.currentDateRange = null;
        
        // DOM elements
        this.elements = {
            retryBtn: document.getElementById('retryBtn'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            offersContainer: document.getElementById('offersContainer'),
            championOffers: document.getElementById('championOffers'),
            calendarGrid: document.getElementById('calendarGrid'),
            // Guest picker elements
            guestSummary: document.getElementById('guestSummary'),
            guestDetails: document.getElementById('guestDetails'),
            totalGuests: document.getElementById('totalGuests'),
            adultsCount: document.getElementById('adultsCount'),
            childrenCount: document.getElementById('childrenCount'),
            adultsMinusBtn: document.getElementById('adultsMinusBtn'),
            adultsPlusBtn: document.getElementById('adultsPlusBtn'),
            childrenMinusBtn: document.getElementById('childrenMinusBtn'),
            childrenPlusBtn: document.getElementById('childrenPlusBtn')
        };
        
        // Calendar properties
        this.selectedCheckIn = null;
        this.selectedCheckOut = null;
        this.calendarDates = [];
        
        // Guest count properties
        this.selectedAdults = 2; // Default to 2 adults
        this.selectedChildren = 0; // Default to no children
        this.maxAdults = 12;
        this.maxChildren = 8;
        
        // Pagination properties (removed - no longer needed)
        // this.currentOffset = 0;
        // this.hasMoreOffers = false;
        
        // Cached offers for extension functionality
        this.cachedOffers = [];
        this.cacheLoaded = false;
        
        // State management key
        this.stateKey = 'villaTokenUserState';
        
        // Pending flexibility restore (for timing issues)
        this.pendingFlexibilityRestore = null;
        
        this.initializeEventListeners();
        this.setupCalendar();
        this.setupGuestPicker();
        // Load saved state and only set defaults if no state was restored
        const stateWasRestored = this.loadUserState();
        if (!stateWasRestored) {
            this.setDefaultDateSelection();
        } else {
            // State was restored, apply the calendar filter with restored dates
            this.updateCalendarDisplay();
            
            // Add a delay to ensure all UI elements are properly restored, including flexibility
            setTimeout(() => {
                // Restore flexibility after DOM is fully initialized
                console.log('DEBUG: About to restore flexibility, pendingFlexibilityRestore =', this.pendingFlexibilityRestore);
                if (this.pendingFlexibilityRestore) {
                    console.log('Final flexibility restoration to:', this.pendingFlexibilityRestore);
                    this.setSelectedFlexibility(this.pendingFlexibilityRestore);
                    
                    // Double-check it worked
                    setTimeout(() => {
                        const finalCheck = this.getSelectedFlexibility();
                        console.log('Final flexibility verification:', finalCheck);
                        if (finalCheck !== this.pendingFlexibilityRestore) {
                            console.error('Flexibility restoration FAILED! Expected:', this.pendingFlexibilityRestore, 'Got:', finalCheck);
                        }
                        this.pendingFlexibilityRestore = null; // Clear pending restore
                    }, 50);
                } else {
                    console.log('DEBUG: No pending flexibility to restore');
                }
                
                console.log('Applying calendar filter with restored state...');
                this.applyCalendarFilter();
            }, 300);
        }
        this.initializeImageCarousels();
        this.initializeGalleryModal();
        this.loadOffersCache();
    }
    
    /**
     * Load offers cache for extension functionality
     */
    async loadOffersCache() {
        try {
            console.log('Loading offers cache...');
            const response = await fetch('/api/cached-offers');
            const data = await response.json();
            
            if (data.success && data.data) {
                this.cachedOffers = data.data;
                this.cacheLoaded = true;
                console.log('Loaded', this.cachedOffers.length, 'offers into cache');
                
                // Debug: Show unique villa names in cache
                const uniqueVillas = [...new Set(this.cachedOffers.map(offer => offer.villa_display_name))];
                console.log('Unique villa names in cache:', uniqueVillas);
            }
        } catch (error) {
            console.error('Error loading offers cache:', error);
        }
    }

    /**
     * Save current user state to localStorage
     */
    saveUserState(flexibility = null) {
        try {
            // Get flexibility directly if not provided
            const currentFlexibility = flexibility || (() => {
                const selectedPill = document.querySelector('.flexibility-pill.selected');
                return selectedPill ? selectedPill.dataset.flexibility : 'exact';
            })();
            console.log('DEBUG: Saving flexibility value:', currentFlexibility);
            
            const state = {
                selectedAdults: this.selectedAdults,
                selectedChildren: this.selectedChildren,
                selectedCheckIn: this.selectedCheckIn,
                selectedCheckOut: this.selectedCheckOut,
                currentFilter: this.currentFilter,
                currentDateRange: this.currentDateRange,
                selectedFlexibility: currentFlexibility,
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.stateKey, JSON.stringify(state));
            console.log('User state saved with flexibility:', currentFlexibility);
        } catch (error) {
            console.error('Error saving user state:', error);
        }
    }

    /**
     * Load user state from localStorage and apply it
     */
    loadUserState() {
        try {
            const savedState = localStorage.getItem(this.stateKey);
            if (!savedState) {
                console.log('No saved user state found');
                return false;
            }

            const state = JSON.parse(savedState);
            
            // Check if state is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            if (Date.now() - state.timestamp > maxAge) {
                console.log('Saved state too old, clearing');
                this.clearUserState();
                return false;
            }

            console.log('Loading saved user state:', state);
            console.log('DEBUG: Loaded flexibility value:', state.selectedFlexibility);

            // Restore guest counts
            if (state.selectedAdults) {
                this.selectedAdults = state.selectedAdults;
            }
            if (state.selectedChildren) {
                this.selectedChildren = state.selectedChildren;
            }

            // Restore date selections
            if (state.selectedCheckIn) {
                this.selectedCheckIn = state.selectedCheckIn;
            }
            if (state.selectedCheckOut) {
                this.selectedCheckOut = state.selectedCheckOut;
            }
            if (state.currentDateRange) {
                this.currentDateRange = state.currentDateRange;
            }

            // Restore filter
            if (state.currentFilter) {
                this.currentFilter = state.currentFilter;
            }

            // Update UI elements to reflect loaded state
            this.updateGuestDisplay();
            this.updateGuestButtons();
            
            // Store flexibility for later restoration after DOM is fully ready
            this.pendingFlexibilityRestore = state.selectedFlexibility;
            console.log('DEBUG: Set pendingFlexibilityRestore to:', this.pendingFlexibilityRestore);

            console.log('User state restored successfully');
            return true;
        } catch (error) {
            console.error('Error loading user state:', error);
            this.clearUserState();
            return false;
        }
    }

    /**
     * Clear saved user state
     */
    clearUserState() {
        try {
            localStorage.removeItem(this.stateKey);
            console.log('User state cleared');
        } catch (error) {
            console.error('Error clearing user state:', error);
        }
    }

    /**
     * Get currently selected flexibility value
     */
    getSelectedFlexibility() {
        const allPills = document.querySelectorAll('.flexibility-pill');
        const selectedPill = document.querySelector('.flexibility-pill.selected');
        
        console.log('getSelectedFlexibility() debug:');
        console.log('- Total pills found:', allPills.length);
        console.log('- Selected pill found:', !!selectedPill);
        
        if (allPills.length > 0) {
            allPills.forEach((pill, index) => {
                console.log(`- Pill ${index}: data-flexibility="${pill.dataset.flexibility}", selected=${pill.classList.contains('selected')}`);
            });
        }
        
        const flexibility = selectedPill ? selectedPill.dataset.flexibility : 'exact';
        console.log('- Final flexibility value:', flexibility);
        return flexibility;
    }

    /**
     * Set selected flexibility pill
     */
    setSelectedFlexibility(flexibility) {
        const pills = document.querySelectorAll('.flexibility-pill');
        console.log('Setting flexibility to:', flexibility, 'Pills found:', pills.length);
        
        pills.forEach(pill => {
            pill.classList.remove('selected');
            if (pill.dataset.flexibility === flexibility) {
                pill.classList.add('selected');
                console.log('Selected pill with flexibility:', pill.dataset.flexibility);
            }
        });
        
        // Verify the selection was applied
        const selectedPill = document.querySelector('.flexibility-pill.selected');
        console.log('Current selected pill:', selectedPill?.dataset.flexibility || 'none');
    }

    /**
     * Find extension offers in cached data
     */
    findExtensionOffers(villaDisplayName, checkinDate, nights, adults, children) {
        if (!this.cacheLoaded) {
            console.error('Cache not loaded yet');
            return [];
        }

        console.log('Searching cache for:', villaDisplayName, checkinDate, nights, 'nights');
        
        // First try exact match
        let matchingOffers = this.cachedOffers.filter(offer => {
            const offerCheckin = offer.checkin_date ? new Date(offer.checkin_date).toISOString().split('T')[0] : null;
            const matchesVilla = offer.villa_display_name === villaDisplayName;
            const matchesDate = offerCheckin === checkinDate;
            const matchesNights = offer.nights === parseInt(nights);
            const matchesAdults = offer.adults >= parseInt(adults);
            const matchesChildren = offer.children >= parseInt(children);
            
            return matchesVilla && matchesDate && matchesNights && matchesAdults && matchesChildren;
        });

        // If no exact match, try to find offers for the same villa with compatible nights
        if (matchingOffers.length === 0) {
            console.log('No exact match found, searching for compatible offers...');
            
            matchingOffers = this.cachedOffers.filter(offer => {
                const offerCheckin = offer.checkin_date ? new Date(offer.checkin_date).toISOString().split('T')[0] : null;
                const matchesVilla = offer.villa_display_name === villaDisplayName;
                const matchesDate = offerCheckin === checkinDate;
                const matchesAdults = offer.adults >= parseInt(adults);
                const matchesChildren = offer.children >= parseInt(children);
                
                // Accept any night count for now - we'll use the pricing as base
                return matchesVilla && matchesDate && matchesAdults && matchesChildren;
            });
            
            if (matchingOffers.length > 0) {
                console.log(`Found ${matchingOffers.length} compatible offers with different night counts`);
                
                // Adjust the pricing for the requested night count
                matchingOffers = matchingOffers.map(offer => ({
                    ...offer,
                    nights: parseInt(nights),
                    price_for_guests: parseFloat((parseFloat(offer.price_for_guests) / offer.nights * parseInt(nights)).toFixed(2)),
                    total_face_value: parseFloat((parseFloat(offer.total_face_value) / offer.nights * parseInt(nights)).toFixed(2)),
                    guest_savings_value: parseFloat((parseFloat(offer.guest_savings_value) / offer.nights * parseInt(nights)).toFixed(2))
                }));
            }
        }

        console.log('Found', matchingOffers.length, 'matching offers in cache');
        return matchingOffers;
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => this.loadActivities());
        }
        
        // Flexibility pills event listeners
        const flexibilityPills = document.querySelectorAll('.flexibility-pill');
        console.log('DEBUG: initializeEventListeners() - Found', flexibilityPills.length, 'flexibility pills');
        flexibilityPills.forEach((pill, index) => {
            console.log(`DEBUG: Pill ${index}: data-flexibility="${pill.dataset.flexibility}", text="${pill.textContent}"`);
            pill.addEventListener('click', (event) => {
                console.log('🔥 CLICK DETECTED ON PILL:', pill.dataset.flexibility, event);
                
                // Get fresh pill references to avoid stale NodeList issues
                const currentPills = document.querySelectorAll('.flexibility-pill');
                console.log('DEBUG: Found', currentPills.length, 'pills on click');
                
                // Remove selected class from all pills
                currentPills.forEach(p => p.classList.remove('selected'));
                // Add selected class to clicked pill
                pill.classList.add('selected');
                
                console.log('DEBUG: Set selected class on pill with data-flexibility:', pill.dataset.flexibility);
                
                // Get flexibility directly (bypassing broken method)
                const selectedPill = document.querySelector('.flexibility-pill.selected');
                const flexibility = selectedPill ? selectedPill.dataset.flexibility : 'exact';
                console.log('🎯 FIXED: Using direct approach, flexibility =', flexibility);
                
                // Save user state when flexibility changes
                this.saveUserState(flexibility);
                
                // Apply the filter with new flexibility
                this.applyCalendarFilter();
                
                // Only reload if we have a date range selected
                if (this.currentDateRange && this.currentDateRange.startDate && this.currentDateRange.endDate) {
                    this.loadActivities();
                }
            });
        });
        
        // Auto-refresh every 5 minutes (reduced frequency)
        setInterval(() => {
            if (!this.isLoading) {
                this.loadActivities(true); // Silent refresh
            }
        }, 300000);
    }
    
    /**
     * Setup calendar with proper week alignment
     */
    setupCalendar() {
        this.renderCalendar();
    }
    
    /**
     * Render calendar grid with proper week alignment
     */
    renderCalendar() {
        // Clear existing day cells (keep headers)
        const existingDays = this.elements.calendarGrid.querySelectorAll('.calendar-date');
        existingDays.forEach(day => day.remove());

        // Get current Bali time using corrected calculation
        const baliToday = this.getBaliDate(0);
        const baliTime = new Date(baliToday);

        // Create array of next 15 days (today + 14)
        const dates = [];
        for (let i = 0; i < 15; i++) {
            const date = new Date(baliTime);
            date.setDate(baliTime.getDate() + i);
            dates.push(date);
        }

        // Find the Monday of the week containing the first date
        const firstDate = dates[0];
        const startOfWeek = new Date(firstDate);
        const dayOfWeek = firstDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as end of week
        startOfWeek.setDate(firstDate.getDate() + mondayOffset);

        // Find the end of the week containing the last date
        const lastDate = dates[dates.length - 1];
        const endOfWeek = new Date(lastDate);
        const lastDayOfWeek = lastDate.getDay();
        const sundayOffset = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek; // Days until Sunday
        endOfWeek.setDate(lastDate.getDate() + sundayOffset);

        // Generate calendar grid starting from Monday
        const currentDate = new Date(startOfWeek);
        this.calendarDates = []; // Reset the dates array
        let cellIndex = 0; // Track DOM cell position
        
        while (currentDate <= endOfWeek) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-date';
            dayCell.dataset.cellIndex = cellIndex; // Always set cell index
            
            // Check if this date is in our 15-day range
            const isInRange = dates.some(d => 
                d.getFullYear() === currentDate.getFullYear() &&
                d.getMonth() === currentDate.getMonth() &&
                d.getDate() === currentDate.getDate()
            );
            
            if (isInRange) {
                const dateIndex = this.calendarDates.length; // Use current array length as index
                
                dayCell.textContent = currentDate.getDate();
                dayCell.dataset.date = currentDate.toISOString().split('T')[0];
                dayCell.dataset.dateIndex = dateIndex; // Store the index in the DOM
                
                // Store date info for later reference
                this.calendarDates.push({
                    date: new Date(currentDate),
                    day: currentDate.getDate(),
                    isToday: currentDate.getTime() === baliTime.getTime(),
                    isSelectable: currentDate.getTime() !== baliTime.getTime(), // Today is not selectable
                    cellIndex: cellIndex // Store which DOM cell this corresponds to
                });
                
                // Disable today (first date) but keep it visible
                if (currentDate.getTime() === baliTime.getTime()) {
                    dayCell.classList.add('disabled');
                } else {
                    dayCell.addEventListener('click', () => this.handleDateClick(dateIndex));
                }
            } else {
                // Empty cell for dates not in our range but needed for week structure
                dayCell.classList.add('empty');
            }
            
            this.elements.calendarGrid.appendChild(dayCell);
            currentDate.setDate(currentDate.getDate() + 1);
            cellIndex++;
        }
        
        console.log('Calendar generated with', this.calendarDates.length, 'selectable dates');
    }
    
    /**
     * Set default date selection: check-in tomorrow, check-out day after tomorrow
     */
    setDefaultDateSelection() {
        // Default: check-in tomorrow (index 1), check-out day after tomorrow (index 2)
        if (this.calendarDates.length >= 3) {
            this.selectedCheckIn = 1;
            this.selectedCheckOut = 2;
            this.updateCalendarDisplay();
            
            console.log('Default dates selected: Check-in tomorrow, Check-out day after tomorrow');
            
            // Automatically load available offers for default dates
            this.applyCalendarFilter();
        }
    }

    /**
     * Handle calendar date click
     */
    handleDateClick(index) {
        console.log('Date clicked, index:', index, 'Total dates:', this.calendarDates.length);
        const dateInfo = this.calendarDates[index];
        console.log('Date info:', dateInfo);
        
        if (!dateInfo || !dateInfo.isSelectable) {
            console.log('Date not selectable:', dateInfo);
            return;
        }
        
        console.log('Before click - CheckIn:', this.selectedCheckIn, 'CheckOut:', this.selectedCheckOut);
        
        if (this.selectedCheckIn === null) {
            // First click - set check-in
            this.selectedCheckIn = index;
            this.selectedCheckOut = null;
            console.log('Set check-in to:', index);
        } else if (this.selectedCheckOut === null) {
            // Second click - set check-out
            if (index <= this.selectedCheckIn) {
                // If clicked date is before or same as check-in, reset and make it new check-in
                this.selectedCheckIn = index;
                this.selectedCheckOut = null;
                console.log('Reset check-in to:', index);
            } else {
                this.selectedCheckOut = index;
                console.log('Set check-out to:', index);
            }
        } else {
            // Both dates selected - start over with new check-in
            this.selectedCheckIn = index;
            this.selectedCheckOut = null;
            console.log('Reset selection, new check-in:', index);
        }
        
        // Save user state when dates are selected
        this.saveUserState();
        
        this.updateCalendarDisplay();
        
        // If both dates are selected, trigger filtering
        if (this.selectedCheckIn !== null && this.selectedCheckOut !== null) {
            this.applyCalendarFilter();
        }
    }
    
    /**
     * Update calendar visual display
     */
    updateCalendarDisplay() {
        // Clear all styling from calendar dates
        const allDateElements = this.elements.calendarGrid.querySelectorAll('.calendar-date');
        allDateElements.forEach(element => {
            element.classList.remove('selected', 'in-range');
        });
        
        // Apply styling to selected dates based on cellIndex
        if (this.selectedCheckIn !== null) {
            const checkInCellIndex = this.calendarDates[this.selectedCheckIn]?.cellIndex;
            if (checkInCellIndex !== undefined) {
                const checkInElement = this.elements.calendarGrid.querySelector(`[data-cell-index="${checkInCellIndex}"]`);
                if (checkInElement) checkInElement.classList.add('selected');
            }
        }
        
        if (this.selectedCheckOut !== null) {
            const checkOutCellIndex = this.calendarDates[this.selectedCheckOut]?.cellIndex;
            if (checkOutCellIndex !== undefined) {
                const checkOutElement = this.elements.calendarGrid.querySelector(`[data-cell-index="${checkOutCellIndex}"]`);
                if (checkOutElement) checkOutElement.classList.add('selected');
            }
        }
        
        // Apply in-range styling
        if (this.selectedCheckIn !== null && this.selectedCheckOut !== null) {
            const startCellIndex = this.calendarDates[this.selectedCheckIn]?.cellIndex;
            const endCellIndex = this.calendarDates[this.selectedCheckOut]?.cellIndex;
            
            if (startCellIndex !== undefined && endCellIndex !== undefined) {
                for (let i = 0; i < this.calendarDates.length; i++) {
                    if (i > this.selectedCheckIn && i < this.selectedCheckOut) {
                        const rangeCellIndex = this.calendarDates[i]?.cellIndex;
                        if (rangeCellIndex !== undefined) {
                            const rangeElement = this.elements.calendarGrid.querySelector(`[data-cell-index="${rangeCellIndex}"]`);
                            if (rangeElement) rangeElement.classList.add('in-range');
                        }
                    }
                }
            }
        }
        
        console.log('Calendar display updated - CheckIn:', this.selectedCheckIn, 'CheckOut:', this.selectedCheckOut);
    }
    
    /**
     * Set default dates (tomorrow to tomorrow + 3 days)
     */
    setDefaultDates() {
        // Find the first selectable date (tomorrow)
        let tomorrowIndex = -1;
        let dayAfterTomorrowIndex = -1;
        
        for (let i = 0; i < this.calendarDates.length; i++) {
            const dateInfo = this.calendarDates[i];
            if (dateInfo && dateInfo.isSelectable) {
                if (tomorrowIndex === -1) {
                    tomorrowIndex = i; // First selectable date (tomorrow)
                } else if (dayAfterTomorrowIndex === -1) {
                    dayAfterTomorrowIndex = i; // Second selectable date
                    break;
                }
            }
        }
        
        if (tomorrowIndex !== -1 && dayAfterTomorrowIndex !== -1) {
            this.selectedCheckIn = tomorrowIndex;
            this.selectedCheckOut = dayAfterTomorrowIndex;
            this.updateCalendarDisplay();
            this.applyCalendarFilter();
        } else {
            // No default loading since we require specific dates
            console.log('No default dates available - calendar dates required for search');
        }
    }
    
    /**
     * Apply calendar date filter
     */
    applyCalendarFilter() {
        if (this.selectedCheckIn === null || this.selectedCheckOut === null) return;
        
        const checkInDate = this.calendarDates[this.selectedCheckIn].date;
        const checkOutDate = this.calendarDates[this.selectedCheckOut].date;
        
        const startDate = checkInDate.toISOString().split('T')[0];
        const endDate = checkOutDate.toISOString().split('T')[0];
        
        console.log('Calendar filter applied:', startDate, 'to', endDate);
        
        this.currentDateRange = { startDate, endDate };
        this.loadActivities();
    }
    
    /**
     * Setup guest picker functionality
     */
    setupGuestPicker() {
        this.updateGuestDisplay();
        this.updateGuestButtons();
    }

    /**
     * Toggle guest details visibility
     */
    toggleGuestDetails() {
        this.elements.guestDetails.classList.toggle('open');
        this.elements.guestSummary.classList.toggle('open');
    }

    /**
     * Change guest count
     */
    changeGuestCount(type, delta) {
        const current = type === 'adults' ? this.selectedAdults : this.selectedChildren;
        const minValue = type === 'adults' ? 1 : 0;
        const maxValue = type === 'adults' ? this.maxAdults : this.maxChildren;
        
        const newValue = Math.max(minValue, Math.min(maxValue, current + delta));
        
        if (newValue !== current) {
            if (type === 'adults') {
                this.selectedAdults = newValue;
            } else {
                this.selectedChildren = newValue;
            }
            
            this.updateGuestDisplay();
            this.updateGuestButtons();
            this.handleGuestCountChange();
        }
    }

    /**
     * Update guest display
     */
    updateGuestDisplay() {
        // Update individual counts
        this.elements.adultsCount.textContent = this.selectedAdults;
        this.elements.childrenCount.textContent = this.selectedChildren;
        
        // Update total display
        const total = this.selectedAdults + this.selectedChildren;
        this.elements.totalGuests.textContent = `${total} guest${total !== 1 ? 's' : ''}`;
    }

    /**
     * Update guest buttons state
     */
    updateGuestButtons() {
        // Update adults buttons
        this.elements.adultsMinusBtn.disabled = this.selectedAdults <= 1;
        this.elements.adultsPlusBtn.disabled = this.selectedAdults >= this.maxAdults;
        
        // Update children buttons
        this.elements.childrenMinusBtn.disabled = this.selectedChildren <= 0;
        this.elements.childrenPlusBtn.disabled = this.selectedChildren >= this.maxChildren;
    }

    /**
     * Get current date in Bali time zone (UTC+8)
     */
    getBaliDate(offsetDays = 0) {
        const now = new Date();
        // Convert to Bali time (UTC+8) - get current UTC offset and add 8 hours
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const baliTime = new Date(utcTime + (8 * 60 * 60 * 1000));
        baliTime.setDate(baliTime.getDate() + offsetDays);
        return baliTime.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }

    /**
     * Get current day of week in Bali time (0 = Sunday, 1 = Monday, etc.)
     */
    getBaliDayOfWeek() {
        const now = new Date();
        // Convert to Bali time (UTC+8) - get current UTC offset and add 8 hours
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const baliTime = new Date(utcTime + (8 * 60 * 60 * 1000));
        return baliTime.getDay();
    }

    /**
     * Setup dynamic date filters based on current day of week
     */
    setupDynamicDateFilters() {
        const dayOfWeek = this.getBaliDayOfWeek(); // 0 = Sunday, 1 = Monday, etc.
        const today = new Date();
        // Convert to Bali time (UTC+8) - get current UTC offset and add 8 hours
        const utcTime = today.getTime() + (today.getTimezoneOffset() * 60000);
        const baliTime = new Date(utcTime + (8 * 60 * 60 * 1000));
        
        // Determine filter configuration based on day of week
        let filters;
        if ([1, 2, 3, 6, 0].includes(dayOfWeek)) { // Mon, Tue, Wed, Sat, Sun
            filters = this.getWeekdayFilters(baliTime);
        } else { // Thu, Fri
            filters = this.getThurFriFilters(baliTime);
        }
        
        // Sort filters chronologically by start date (excluding custom date picker)
        const sortedFilters = this.sortFiltersByDate(filters);
        
        // Update filter boxes
        this.updateFilterBoxes(sortedFilters);
        
        // Set default active filter
        this.setActiveFilter('filter1');
    }

    /**
     * Get filter configuration for Mon/Tue/Wed/Sat/Sun
     */
    getWeekdayFilters(baliTime) {
        // Start from tomorrow in Bali time
        const tomorrow = new Date(baliTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Calculate "This Week" from tomorrow onwards
        const remainingThisWeek = new Date(tomorrow);
        const dayOfWeek = tomorrow.getDay();
        const daysUntilSunday = 7 - dayOfWeek; // Days from tomorrow until end of week (Sunday)
        
        const endOfWeek = new Date(tomorrow);
        endOfWeek.setDate(tomorrow.getDate() + daysUntilSunday - 1); // End on Sunday
        
        const nextWeekStart = new Date(endOfWeek);
        nextWeekStart.setDate(nextWeekStart.getDate() + 1); // Next Monday
        
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // Next Sunday
        
        return {
            filter1: {
                title: 'This Week',
                subtitle: this.formatDateRange(tomorrow, endOfWeek),
                icon: 'fas fa-calendar-week',
                dateRange: [tomorrow, endOfWeek]
            },
            filter2: {
                title: 'This Weekend',
                subtitle: this.getWeekendSubtitle(baliTime),
                icon: 'fas fa-calendar-alt',
                dateRange: this.getWeekendRange(baliTime)
            },
            filter3: {
                title: 'Next Week',
                subtitle: this.formatDateRange(nextWeekStart, nextWeekEnd),
                icon: 'fas fa-calendar-plus',
                dateRange: [nextWeekStart, nextWeekEnd]
            },
            filter4: {
                title: 'Pick Your Date',
                subtitle: 'Choose any date',
                icon: 'fas fa-calendar-check',
                dateRange: 'custom'
            }
        };
    }

    /**
     * Get filter configuration for Thu/Fri
     */
    getThurFriFilters(baliTime) {
        // Start from tomorrow
        const tomorrow = new Date(baliTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Calculate upcoming weekend (Fri-Sun) from tomorrow onwards
        const [nextFriday, nextSunday] = this.getWeekendRange(baliTime);
        
        const nextWeekStart = new Date(nextSunday);
        nextWeekStart.setDate(nextSunday.getDate() + 1); // Monday after this weekend
        
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        
        // Calculate next weekend (Friday-Sunday after next week)
        const nextWeekendFriday = new Date(nextWeekEnd);
        nextWeekendFriday.setDate(nextWeekEnd.getDate() + 1); // Friday after next week
        
        const nextWeekendSunday = new Date(nextWeekendFriday);
        nextWeekendSunday.setDate(nextWeekendFriday.getDate() + 2); // Sunday after next week
        
        return {
            filter1: {
                title: 'This Weekend',
                subtitle: this.formatDateRange(nextFriday, nextSunday),
                icon: 'fas fa-calendar-alt',
                dateRange: [nextFriday, nextSunday]
            },
            filter2: {
                title: 'Next Week',
                subtitle: this.formatDateRange(nextWeekStart, nextWeekEnd),
                icon: 'fas fa-calendar-plus',
                dateRange: [nextWeekStart, nextWeekEnd]
            },
            filter3: {
                title: 'Next Weekend',
                subtitle: this.formatDateRange(nextWeekendFriday, nextWeekendSunday),
                icon: 'fas fa-calendar-week',
                dateRange: [nextWeekendFriday, nextWeekendSunday]
            },
            filter4: {
                title: 'Pick Your Date',
                subtitle: 'Choose any date',
                icon: 'fas fa-calendar-check',
                dateRange: 'custom'
            }
        };
    }

    /**
     * Get weekend date range (Friday-Sunday)
     */
    getWeekendRange(currentDate) {
        const today = new Date(currentDate);
        const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        
        let friday, sunday;
        
        if (currentDay === 5) { // Today is Friday - this weekend starts today
            friday = new Date(today); // Today (Friday)
            sunday = new Date(today);
            sunday.setDate(today.getDate() + 2); // Day after tomorrow (Sunday)
        } else if (currentDay === 6) { // Today is Saturday - this weekend started yesterday
            friday = new Date(today);
            friday.setDate(today.getDate() - 1); // Yesterday (Friday)
            sunday = new Date(today);
            sunday.setDate(today.getDate() + 1); // Tomorrow (Sunday)
        } else if (currentDay === 0) { // Today is Sunday - this weekend started 2 days ago
            friday = new Date(today);
            friday.setDate(today.getDate() - 2); // Friday 2 days ago
            sunday = new Date(today); // Today (Sunday)
        } else { // Monday-Thursday - get upcoming weekend (Fri-Sun)
            let daysUntilFriday = (5 - currentDay + 7) % 7; // Days from today to Friday
            if (daysUntilFriday === 0) daysUntilFriday = 7; // If calculation gives 0, get next Friday
            
            friday = new Date(today);
            friday.setDate(today.getDate() + daysUntilFriday);
            sunday = new Date(friday);
            sunday.setDate(friday.getDate() + 2);
        }
        
        return [friday, sunday];
    }

    /**
     * Get weekend subtitle text
     */
    getWeekendSubtitle(currentDate) {
        const [saturday, sunday] = this.getWeekendRange(currentDate);
        return this.formatDateRange(saturday, sunday);
    }

    /**
     * Format date range as "Aug 17-18" or "Aug 17 - Sep 1" for cross-month
     */
    formatDateRange(startDate, endDate) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const startMonth = months[startDate.getMonth()];
        const endMonth = months[endDate.getMonth()];
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        
        if (startDate.getMonth() === endDate.getMonth()) {
            return `${startMonth} ${startDay}-${endDay}`;
        } else {
            return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
        }
    }

    /**
     * Sort filters chronologically by start date (custom filter always last)
     */
    sortFiltersByDate(filters) {
        // Convert filters to array for sorting
        const filterArray = Object.entries(filters).map(([key, value]) => ({
            key,
            ...value
        }));
        
        // Sort by start date (custom filter goes last)
        filterArray.sort((a, b) => {
            if (a.dateRange === 'custom') return 1;
            if (b.dateRange === 'custom') return -1;
            
            const startA = a.dateRange[0];
            const startB = b.dateRange[0];
            return startA.getTime() - startB.getTime();
        });
        
        // Convert back to object with sequential filter IDs
        const sortedFilters = {};
        filterArray.forEach((filter, index) => {
            const filterId = `filter${index + 1}`;
            sortedFilters[filterId] = {
                title: filter.title,
                subtitle: filter.subtitle,
                icon: filter.icon,
                dateRange: filter.dateRange
            };
        });
        
        return sortedFilters;
    }

    /**
     * Update filter box content
     */
    updateFilterBoxes(filters) {
        Object.keys(filters).forEach(filterKey => {
            const elementKey = `dateFilter${filterKey.slice(-1)}`; // Convert filter1 -> dateFilter1
            const element = this.elements[elementKey];
            const filter = filters[filterKey];
            
            if (element) {
                element.querySelector('i').className = filter.icon;
                element.querySelector('.filter-title').textContent = filter.title;
                element.querySelector('.filter-subtitle').textContent = filter.subtitle;
                
                // Store date range as simple date strings instead of Date objects
                if (filter.dateRange === 'custom') {
                    element.dataset.dateRange = 'custom';
                } else {
                    const [start, end] = filter.dateRange;
                    const startStr = start.toISOString().split('T')[0];
                    const endStr = end.toISOString().split('T')[0];
                    element.dataset.dateRange = JSON.stringify([startStr, endStr]);
                }
            }
        });
    }

    /**
     * Handle date filter click
     */
    handleDateFilterClick(filterId) {
        this.setActiveFilter(filterId);
        
        if (filterId === 'filter4') {
            // Show custom date slider
            this.elements.customDateSlider.style.display = 'block';
            this.setupDateSlider();
        } else {
            // Hide custom date slider
            this.elements.customDateSlider.style.display = 'none';
            
            // Apply filter based on date range
            const elementKey = `dateFilter${filterId.slice(-1)}`; // Convert filter1 -> dateFilter1
            const element = this.elements[elementKey];
            if (element && element.dataset.dateRange) {
                const dateRange = JSON.parse(element.dataset.dateRange);
                this.currentDateRange = dateRange;
                this.applyDateFilter(dateRange);
            }
        }
    }

    /**
     * Set active filter visually
     */
    setActiveFilter(filterId) {
        // Remove active class from all filters
        ['filter1', 'filter2', 'filter3', 'filter4'].forEach(id => {
            this.elements[`dateFilter${id.slice(-1)}`].classList.remove('active');
        });
        
        // Add active class to selected filter
        this.elements[`dateFilter${filterId.slice(-1)}`].classList.add('active');
    }

    /**
     * Setup date slider for custom date selection
     */
    setupDateSlider() {
        // Initialize with default values: start = 1 (tomorrow), end = 7 (week from tomorrow)
        this.elements.startDateRange.value = 1;
        this.elements.endDateRange.value = 7;
        this.updateDualSliderDisplay();
        this.updateSliderRange();
    }

    /**
     * Handle dual slider change
     */
    handleDualSliderChange() {
        let startValue = parseInt(this.elements.startDateRange.value);
        let endValue = parseInt(this.elements.endDateRange.value);
        
        // Ensure end is always after start
        if (endValue <= startValue) {
            endValue = startValue + 1;
            this.elements.endDateRange.value = endValue;
        }
        
        this.updateDualSliderDisplay();
        this.updateSliderRange();
        
        // Apply date range filter
        const startDate = this.getDateFromOffset(startValue);
        const endDate = this.getDateFromOffset(endValue);
        
        this.currentDateRange = [startDate, endDate];
        this.applyDateFilter([startDate, endDate]);
    }

    /**
     * Handle guest count change
     */
    handleGuestCountChange() {
        console.log(`Guest count changed: ${this.selectedAdults} adults, ${this.selectedChildren} children`);
        
        // Save user state when guest count changes
        this.saveUserState();
        
        // Pagination removed - no reset needed
        
        // Reload offers with new guest requirements
        this.loadActivities();
    }

    /**
     * Get date string from day offset
     */
    getDateFromOffset(dayOffset) {
        const targetDate = new Date();
        const baliTime = new Date(targetDate.getTime() + (8 * 60 * 60 * 1000));
        baliTime.setDate(baliTime.getDate() + dayOffset);
        return baliTime.toISOString().split('T')[0];
    }

    /**
     * Update dual slider display text
     */
    updateDualSliderDisplay() {
        const startOffset = parseInt(this.elements.startDateRange.value);
        const endOffset = parseInt(this.elements.endDateRange.value);
        
        // Update start date display
        const startDate = new Date();
        const startBaliTime = new Date(startDate.getTime() + (8 * 60 * 60 * 1000));
        startBaliTime.setDate(startBaliTime.getDate() + startOffset);
        
        const startOptions = { month: 'short', day: 'numeric' };
        const startDateStr = startBaliTime.toLocaleDateString('en-US', startOptions);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const startDayName = dayNames[startBaliTime.getDay()];
        
        this.elements.selectedStartDate.textContent = startOffset === 1 ? 'Tomorrow' : startDateStr;
        this.elements.startDayOfWeek.textContent = startDayName;
        
        // Update end date display
        const endDate = new Date();
        const endBaliTime = new Date(endDate.getTime() + (8 * 60 * 60 * 1000));
        endBaliTime.setDate(endBaliTime.getDate() + endOffset);
        
        const endDateStr = endBaliTime.toLocaleDateString('en-US', startOptions);
        const endDayName = dayNames[endBaliTime.getDay()];
        
        this.elements.selectedEndDate.textContent = endDateStr;
        this.elements.endDayOfWeek.textContent = endDayName;
    }

    /**
     * Update slider range visual indicator
     */
    updateSliderRange() {
        const startValue = parseInt(this.elements.startDateRange.value);
        const endValue = parseInt(this.elements.endDateRange.value);
        const max = 60;
        
        const startPercent = ((startValue - 1) / (max - 1)) * 100;
        const endPercent = ((endValue - 1) / (max - 1)) * 100;
        
        this.elements.sliderRange.style.left = startPercent + '%';
        this.elements.sliderRange.style.width = (endPercent - startPercent) + '%';
    }

    /**
     * Apply date filter and reload offers
     */
    applyDateFilter(dateRange) {
        // Convert date range to proper format
        let startStr, endStr;
        
        if (Array.isArray(dateRange) && dateRange.length === 2) {
            const [start, end] = dateRange;
            
            // If already strings in YYYY-MM-DD format, use directly
            if (typeof start === 'string' && start.match(/^\d{4}-\d{2}-\d{2}$/)) {
                startStr = start;
                endStr = end;
            } else if (start instanceof Date && end instanceof Date) {
                // Convert Date objects to strings
                startStr = start.toISOString().split('T')[0];
                endStr = end.toISOString().split('T')[0];
            } else {
                console.error('Invalid date format in dateRange:', dateRange);
                return;
            }
        } else {
            console.error('Invalid dateRange format:', dateRange);
            return;
        }
        
        // Store the filter range and reload offers with new date range
        this.currentDateRange = [startStr, endStr];
        console.log(`Date filter applied: ${startStr} to ${endStr}`);
        
        // Reload offers with the new date range
        this.loadActivities();
    }
    

    

    
    /**
     * Show loading state
     */
    showLoading(silent = false) {
        this.isLoading = true;
        
        if (!silent) {
            this.hideAllStates();
            this.elements.loadingSpinner.style.display = 'block';
        }
        

        

    }
    
    /**
     * Hide all content states
     */
    hideAllStates() {
        this.elements.loadingSpinner.style.display = 'none';
        this.elements.errorMessage.style.display = 'none';
        this.elements.offersContainer.style.display = 'none';
    }
    
    /**
     * Show error state
     */
    showError(message) {
        this.isLoading = false;
        this.hideAllStates();
        this.elements.errorMessage.style.display = 'block';
        this.elements.errorText.textContent = message;
        

    }
    
    /**
     * Show empty state (removed - no longer needed)
     */
    showEmpty() {
        this.isLoading = false;
        this.hideAllStates();
        // Empty state removed - show offers container with no data
        this.elements.offersContainer.style.display = 'block';
    }
    
    /**
     * Load activities from API with current filter parameters
     */
    async loadActivities(silent = false) {
        try {
            this.showLoading(silent);
            
            // Build query parameters based on current selections
            const queryParams = this.buildQueryParameters();
            const url = `${this.apiBaseUrl}/activities?${queryParams}`;
            
            console.log('Fetching available offers from:', url);
            const response = await fetch(url);
            console.log('Response status:', response.status, response.statusText);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            if (!data.success) {
                throw new Error(data.message || 'API returned unsuccessful response');
            }
            
            // Store all offers (no pagination needed)
            this.currentData = data.data;
            
            console.log(`Received ${data.data.length} available offers:`, data.metadata);
            console.log('Displaying available offers:', this.currentData);
            
            // Display all available offers directly
            await this.displayActivities(this.currentData);
            
        } catch (error) {
            console.error('Error loading available offers:', error);
            this.showError(this.getErrorMessage(error));
        }
    }
    
    /**
     * Load more offers (removed - no longer needed)
     */
    async loadMoreOffers() {
        // Functionality removed - all offers are now loaded at once
        console.log('Load more functionality disabled - all offers loaded at once');
        return;
    }
    
    /**
     * Update Load More button visibility and state (removed - no longer needed)
     */
    updateLoadMoreButton() {
        // Always hide Load More button since all offers are loaded at once
        if (this.elements.loadMoreContainer) {
            this.elements.loadMoreContainer.style.display = 'none';
        }
    }
    
    /**
     * Build query parameters for the API based on current selections
     */
    buildQueryParameters() {
        const params = new URLSearchParams();
        
        // Add guest counts
        params.append('adults', this.selectedAdults.toString());
        params.append('children', this.selectedChildren.toString());
        
        // Add date range if available
        if (this.currentDateRange && this.currentDateRange.startDate && this.currentDateRange.endDate) {
            params.append('checkinDate', this.currentDateRange.startDate);
            params.append('checkoutDate', this.currentDateRange.endDate);
        }
        // If no date range specified, API will use default (tomorrow + 7 days)
        
        // Add flexibility parameter with fallback
        const flexibility = this.getSelectedFlexibility();
        const safeFlexibility = flexibility || 'exact';
        console.log('Building query with flexibility:', safeFlexibility);
        params.append('flexibility', safeFlexibility);
        
        return params.toString();
    }
    
    getSelectedFlexibility() {
        const selectedPill = document.querySelector('.flexibility-pill.selected');
        return selectedPill ? selectedPill.dataset.flexibility : 'exact';
    }
    
    /**
     * Handle booking option selection
     */
    selectBookingOption(offerId, villaKey, optionIndex) {
        console.log(`Selecting booking option ${optionIndex} for villa ${villaKey}, offer ${offerId}`);
        
        // Find the villa card
        const villaCard = document.querySelector(`[data-offer-id="${offerId}"]`).closest('.champion-offer-card');
        if (!villaCard) {
            console.error('Villa card not found');
            return;
        }
        
        // Update selected state for booking option buttons
        const bookingButtons = villaCard.querySelectorAll('.booking-option-btn');
        bookingButtons.forEach((btn, index) => {
            if (index === optionIndex) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        // Update the villa card's data to reflect the selected booking option
        const selectedButton = bookingButtons[optionIndex];
        if (selectedButton) {
            const newOfferId = selectedButton.getAttribute('data-offer-id');
            villaCard.setAttribute('data-offer-id', newOfferId);
            
            // Update the book button to use the new offer ID
            const bookButton = villaCard.querySelector('.champion-book-btn');
            if (bookButton) {
                const currentOnclick = bookButton.getAttribute('onclick');
                const updatedOnclick = currentOnclick.replace(/handleChampionBooking\('([^']+)'/, `handleChampionBooking('${newOfferId}'`);
                bookButton.setAttribute('onclick', updatedOnclick);
                console.log('Updated book button for offer:', newOfferId);
            }
        }
    }
    
    /**
     * Generate all possible booking offers from available villa data
     */
    generateOffersFromData(data) {
        const offers = [];
        
        // Determine which data to work with
        let workingData = data;
        let dateRangeDesc = "all data";
        
        if (this.currentDateRange && Array.isArray(this.currentDateRange)) {
            // Apply the current date range filter - filter ALL data to check-in dates within range
            const [startDate, endDate] = this.currentDateRange;
            const startStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
            const endStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
            
            // Filter data to only include records where EntryDate (check-in) is within the selected range
            workingData = data.filter(record => {
                const checkInDate = record.EntryDate.split('T')[0];
                return checkInDate >= startStr && checkInDate <= endStr;
            });
            dateRangeDesc = `${startStr} to ${endStr}`;
        } else {
            // Default to next 7 days from tomorrow in Bali time
            const now = new Date();
            const baliTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
            const tomorrow = new Date(baliTime);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const weekLater = new Date(tomorrow);
            weekLater.setDate(tomorrow.getDate() + 7);
            
            const startStr = tomorrow.toISOString().split('T')[0];
            const endStr = weekLater.toISOString().split('T')[0];
            
            workingData = data.filter(record => {
                const checkInDate = record.EntryDate.split('T')[0];
                return checkInDate >= startStr && checkInDate <= endStr;
            });
            dateRangeDesc = `${startStr} to ${endStr} (default)`;
        }
        
        // Filter for available rooms only
        let availableData = workingData.filter(record => record.AvailabilityCount > 0);
        
        // Apply guest capacity filtering
        const totalGuests = this.selectedAdults + this.selectedChildren;
        availableData = availableData.filter(record => {
            const maxAdults = record.MaxAdultsPerUnit || 0;
            const maxGuests = record.MaxGuestsPerUnit || 0;
            
            // Check both adult capacity and total guest capacity
            return this.selectedAdults <= maxAdults && totalGuests <= maxGuests;
        });
        
        console.log(`Generating offers from ${availableData.length} available records (${dateRangeDesc}) for ${this.selectedAdults} adults, ${this.selectedChildren} children`);
        
        if (availableData.length === 0) {
            console.log('No available rooms found matching your guest requirements and date range');
            return [];
        }
        
        // Group available data by villa
        const villaGroups = {};
        availableData.forEach(record => {
            const villa = record.UserRoomDisplayName;
            if (!villaGroups[villa]) {
                villaGroups[villa] = [];
            }
            villaGroups[villa].push(record);
        });

        // For each villa, find continuous availability periods and generate offers
        Object.keys(villaGroups).forEach(villaName => {
            const records = villaGroups[villaName].sort((a, b) => 
                new Date(a.EntryDate).getTime() - new Date(b.EntryDate).getTime()
            );

            // Generate offers for each possible check-in date
            records.forEach((checkInRecord, index) => {
                const checkInDate = checkInRecord.EntryDate;
                
                // Count consecutive available days from this check-in date
                let consecutiveDays = 1;
                
                for (let i = index; i < records.length - 1; i++) {
                    const currentDate = new Date(records[i].EntryDate);
                    const nextDate = new Date(records[i + 1].EntryDate);
                    const diffDays = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
                    
                    if (diffDays === 1) {
                        consecutiveDays++;
                    } else {
                        break;
                    }
                }
                
                // Create offers for 1 to 4 nights (capped at 4 nights maximum)
                const maxNights = Math.min(consecutiveDays, 4);
                console.log(`Creating ${maxNights} night options for ${villaName} starting ${checkInDate} (consecutive days: ${consecutiveDays})`);
                
                for (let nights = 1; nights <= maxNights; nights++) {
                    const checkInDateObj = new Date(checkInDate);
                    const checkOutDateObj = new Date(checkInDateObj);
                    checkOutDateObj.setDate(checkInDateObj.getDate() + nights);
                    const checkOutDateStr = checkOutDateObj.toISOString().split('T')[0];
                    
                    // Verify all required dates are available for this booking
                    let allDatesAvailable = true;
                    for (let dayOffset = 0; dayOffset < nights; dayOffset++) {
                        const testDate = new Date(checkInDateObj);
                        testDate.setDate(checkInDateObj.getDate() + dayOffset);
                        const testDateStr = testDate.toISOString().split('T')[0];
                        
                        const isDateAvailable = records.some(record => 
                            record.EntryDate.split('T')[0] === testDateStr && record.AvailabilityCount > 0
                        );
                        
                        if (!isDateAvailable) {
                            allDatesAvailable = false;
                            break;
                        }
                    }
                    
                    if (allDatesAvailable) {
                        offers.push({
                            villa: villaName,
                            checkIn: checkInDate,
                            nights: nights,
                            checkOut: checkOutDateStr,
                            rate: checkInRecord.LowestRateAmount,
                            ratePlan: checkInRecord.RatePlanName,
                            bedrooms: checkInRecord.Bedrooms,
                            maxGuests: checkInRecord.MaxAdultsPerUnit,
                            villaClass: checkInRecord.UserDefinedClass,
                            class: checkInRecord.class,
                            pool: checkInRecord.Pool,
                            totalRate: checkInRecord.LowestRateAmount * nights,
                            // Enhanced villa data from LMRoomDescription
                            tagline: checkInRecord.tagline,
                            description: checkInRecord.description,
                            square_meters: checkInRecord.square_meters,
                            bathrooms: checkInRecord.bathrooms,
                            view_type: checkInRecord.view_type,
                            pool_type: checkInRecord.pool_type,
                            image_urls: checkInRecord.image_urls,
                            key_amenities: checkInRecord.key_amenities,
                            villa_display_name: checkInRecord.villa_display_name
                        });
                    } else {
                        console.log(`${nights} nights not available for ${villaName} starting ${checkInDate} - missing availability`);
                    }
                }
            });
        });

        // Sort offers by check-in date, then by villa name, then by nights
        const sortedOffers = offers.sort((a, b) => {
            const dateCompare = new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
            if (dateCompare !== 0) return dateCompare;
            
            const villaCompare = a.villa.localeCompare(b.villa);
            if (villaCompare !== 0) return villaCompare;
            
            return a.nights - b.nights;
        });
        
        // Store all offers for night selector functionality
        this.currentOffers = sortedOffers;
        
        return sortedOffers;
    }

    /**
     * Display pre-calculated champion offers
     */
    async displayActivities(availableOffers) {
        this.isLoading = false;
        this.hideAllStates();
        
        console.log('Displaying available offers:', availableOffers);
        
        // Transform offers to match expected format
        const offers = this.transformChampionOffers(availableOffers);
        
        // Store current offers for functionality - IMPORTANT for booking handler
        this.currentOffers = offers;
        console.log('Stored currentOffers with offer_ids:', offers.map(o => o.offer_id));
        
        // Generate villa cards
        if (offers.length > 0) {
            await this.generateChampionCards(offers);
        } else {
            this.showEmpty();
        }
        
        this.elements.offersContainer.style.display = 'block';
    }
    
    /**
     * Transform LMCurrentOffers champion data to match frontend expected format
     */
    transformChampionOffers(championOffers) {
        return championOffers.map((championOffer, index) => {
            // Calculate check-out date
            const checkInDate = new Date(championOffer.EntryDate);
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkInDate.getDate() + championOffer.nights);
            
            // Generate a unique offer_id if not present
            const offerId = championOffer.offer_id || 
                           `${championOffer.UserRoomDisplayName}_${championOffer.EntryDate}_${championOffer.nights}n_${index}`;
            
            return {
                // Core booking details
                villa: championOffer.UserRoomDisplayName,
                checkIn: championOffer.EntryDate,
                checkOut: checkOutDate.toISOString().split('T')[0],
                nights: championOffer.nights,
                
                // Pricing (from LMCurrentOffers)
                rate: parseFloat(championOffer.price_for_guests),
                totalRate: parseFloat(championOffer.price_for_guests), // Already total for all nights
                faceValue: parseFloat(championOffer.total_face_value),
                savings: parseFloat(championOffer.guest_savings_value),
                savingsPercent: parseFloat(championOffer.guest_savings_percent),
                
                // Villa details
                villa_display_name: championOffer.villa_display_name,
                tagline: championOffer.tagline,
                description: championOffer.description,
                square_meters: championOffer.square_meters,
                bathrooms: championOffer.bathrooms,
                bedrooms: championOffer.bedrooms, // Use lowercase from backend
                view_type: championOffer.view_type,
                pool_type: championOffer.pool_type,
                image_urls: championOffer.image_urls,
                key_amenities: championOffer.key_amenities,
                webpage_url: championOffer.webpage_url,
                
                // Booking constraints
                maxGuests: championOffer.MaxGuestsPerUnit,
                pool: championOffer.Pool,
                ratePlan: championOffer.RatePlanName,
                class: championOffer.class,
                
                // LMCurrentOffers specific - ensure offer_id is always present
                offer_id: offerId,
                attractiveness_score: championOffer.attractiveness_score,
                perks_included: championOffer.perks_included,
                perk_ids: championOffer.perk_ids || [],
                perks: championOffer.perks || [], // Detailed perk information from API
                has_wow_factor: championOffer.has_wow_factor_perk,
                
                // Enhanced filtering fields
                match_type: championOffer.match_type,
                original_checkin_date: championOffer.original_checkin_date,
                original_checkout_date: championOffer.original_checkout_date
            };
        });
    }

    /**
     * Generate special offer villa cards sorted by length of stay (multiple offers per villa allowed)
     */
    async generateChampionCards(offers) {
        console.log('Generating villa cards for', offers.length, 'offers');
        
        // Group offers by villa
        const villaGroups = this.groupChampionOffersByVilla(offers);
        console.log('Grouped into', Object.keys(villaGroups).length, 'villas');
        
        // For each villa, select the primary offer (longest stay first, then best savings)
        const villaCardsHtml = await Promise.all(
            Object.entries(villaGroups).map(async ([villaKey, villaOffers]) => {
                // Sort villa offers: longest stay first, then by best savings
                const sortedVillaOffers = villaOffers.sort((a, b) => {
                    if (b.nights !== a.nights) {
                        return b.nights - a.nights; // Longest stay first
                    }
                    return b.savingsPercent - a.savingsPercent; // Best savings second
                });
                
                const primaryOffer = sortedVillaOffers[0];
                
                console.log('Generating card for villa:', villaKey, 'with', villaOffers.length, 'booking options');
                console.log('Primary offer:', primaryOffer.checkIn, 'nights:', primaryOffer.nights);
                console.log('All options:', villaOffers.map(o => `${o.checkIn.split('T')[0]} (${o.nights}n)`));
                
                // Generate single card with all booking options for this villa
                return await this.generateChampionVillaCardWithTimeline(villaKey, primaryOffer, sortedVillaOffers);
            })
        );
        
        // Replace all content (no pagination needed)
        document.getElementById('championOffers').innerHTML = villaCardsHtml.join('');
        
        // Start carousels for all villa cards
        document.querySelectorAll('.champion-offer-card').forEach(card => {
            this.startCarousel(card);
        });
        
        // No load more button needed for special offers (all loaded at once)
    }
    
    /**
     * Group special offers by villa name only (not by date)
     */
    groupChampionOffersByVilla(offers) {
        const groups = {};
        
        offers.forEach(offer => {
            const villaKey = offer.villa_display_name || offer.villa;
            
            if (!groups[villaKey]) {
                groups[villaKey] = [];
            }
            
            groups[villaKey].push(offer);
        });
        
        // Sort offers within each villa by check-in date
        Object.keys(groups).forEach(villa => {
            groups[villa].sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
        });
        
        return groups;
    }
    
    /**
     * Generate booking options for a specific villa showing available stay options
     */
    generateBookingOptionsForOffer(primaryOffer, allOffers, villaKey) {
        console.log('Booking options generation for villa:', villaKey);
        console.log('Primary offer:', primaryOffer);
        console.log('All villa offers:', allOffers);
        
        // Extract unique booking options for this villa
        const bookingOptions = allOffers.map(offer => {
            const checkInDate = new Date(offer.checkIn);
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkInDate.getDate() + offer.nights);
            
            return {
                offerId: offer.offer_id,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                nights: offer.nights,
                checkInDay: checkInDate.getDate(),
                checkOutDay: checkOutDate.getDate(),
                checkInMonth: checkInDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                checkOutMonth: checkOutDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                rate: offer.totalRate,
                originalOffer: offer
            };
        });
        
        // Remove duplicates based on check-in and check-out dates
        const uniqueOptions = bookingOptions.filter((option, index, array) => {
            return array.findIndex(o => 
                o.checkIn.getTime() === option.checkIn.getTime() && 
                o.checkOut.getTime() === option.checkOut.getTime()
            ) === index;
        });
        
        // Sort by check-in date
        uniqueOptions.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
        
        console.log(`Found ${uniqueOptions.length} unique booking options for villa ${villaKey}`);
        
        if (uniqueOptions.length === 1) {
            // Single option: simple display
            const option = uniqueOptions[0];
            return `
                <div class="booking-options-container">
                    <div class="booking-options-title">Your Stay</div>
                    <div class="single-booking-option">
                        <div class="date-range">
                            <div class="date-circle selected">
                                ${option.checkInDay}
                            </div>
                            <div class="date-separator">—</div>
                            <div class="date-circle selected">
                                ${option.checkOutDay}
                            </div>
                        </div>
                        <div class="date-labels">
                            <div class="date-label">
                                ${option.checkInMonth} ${option.checkInDay}<br>
                                <small>Check-in</small>
                            </div>
                            <div class="date-label">
                                ${option.checkOutMonth} ${option.checkOutDay}<br>
                                <small>Check-out</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Multiple options: show buttons
            const optionButtons = uniqueOptions.map((option, index) => {
                const isSelected = index === 0; // First option selected by default
                const selectedClass = isSelected ? 'selected' : '';
                
                return `
                    <button class="booking-option-btn ${selectedClass}" 
                            onclick="app.selectBookingOption('${option.offerId}', '${villaKey}', ${index})"
                            data-offer-id="${option.offerId}">
                        <div class="date-range">
                            <div class="date-circle">
                                ${option.checkInDay}
                            </div>
                            <div class="date-separator">—</div>
                            <div class="date-circle">
                                ${option.checkOutDay}
                            </div>
                        </div>
                        <div class="option-details">
                            ${option.checkInMonth} ${option.checkInDay} — ${option.checkOutMonth} ${option.checkOutDay}
                            <small>${option.nights} nights</small>
                        </div>
                    </button>
                `;
            }).join('');
            
            return `
                <div class="booking-options-container">
                    <div class="booking-options-title">Choose Your Stay</div>
                    <div class="booking-options-list">
                        ${optionButtons}
                    </div>
                </div>
            `;
        }
    }
    

    
    /**
     * Check if date falls within an offer's range
     */
    isDateInOfferRange(date, offer) {
        const checkIn = new Date(offer.checkIn);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + offer.nights);
        
        return date >= checkIn && date <= checkOut;
    }

    /**
     * Generate special offer villa card with timeline (new design)
     */
    async generateChampionVillaCardWithTimeline(villaKey, primaryOffer, allVillaOffers) {
        const tagline = primaryOffer.tagline || primaryOffer.villa_display_name || villaKey;
        const imageUrls = this.parseImageUrls(primaryOffer.image_urls);
        
        // Format price (in millions)
        const priceInMillions = (primaryOffer.totalRate / 1000000).toFixed(1);
        
        // Calculate savings
        let savingsBanner = '';
        if (primaryOffer.savings && primaryOffer.savings > 0) {
            const savingsInMillions = (primaryOffer.savings / 1000000).toFixed(1);
            const savingsPercent = Math.round(primaryOffer.savingsPercent * 100);
            savingsBanner = `
                <div class="champion-savings-banner">
                    <i class="fas fa-tag"></i> You Save ${savingsInMillions}M (${savingsPercent}%) !
                </div>
            `;
        }
        
        // Format check-in date
        const checkInDate = new Date(primaryOffer.checkIn);
        const dayName = this.getDayOfWeek(checkInDate);
        const monthName = checkInDate.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = checkInDate.getDate();
        const daysFromNow = this.calculateDaysFromNow(checkInDate);
        const checkInText = `Check-in: ${dayName}, ${monthName} ${dayNum}${daysFromNow}`;
        
        // Generate perks display
        let perksHtml = '';
        if (primaryOffer.perks_included) {
            const perks = primaryOffer.perks_included.split(',').map(p => p.trim());
            const perkIcons = {
                'Cocktails': 'fas fa-cocktail',
                'Sunset Trip': 'fas fa-sun',
                'Massage': 'fas fa-spa',
                'Breakfast': 'fas fa-coffee',
                'Airport Transfer': 'fas fa-plane',
                'Snorkeling': 'fas fa-fish',
                'Yoga': 'fas fa-heart'
            };
            
            perksHtml = `
                <div class="champion-perks-section">
                    <div class="perks-label"><i class="fas fa-gift"></i> Included Perks</div>
                    <div class="perks-list">
                        ${perks.map(perk => `
                            <div class="perk-item">
                                <i class="${perkIcons[perk] || 'fas fa-check'}"></i>
                                <span>${perk}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Generate booking options using all villa offers
        const bookingOptionsHtml = this.generateBookingOptionsForOffer(primaryOffer, allVillaOffers, villaKey);
        
        // Generate carousel slides HTML
        const carouselSlides = imageUrls.map((url, index) => `
            <div class="carousel-slide">
                <img src="${url}" alt="${tagline} - Image ${index + 1}" class="champion-hero-image" data-villa="${villaKey}" data-index="${index}">
            </div>
        `).join('');
        
        // Store the current offer data on the card element for later retrieval
        const offerData = {
            checkIn: primaryOffer.checkIn,
            checkOut: primaryOffer.checkOut || this.calculateCheckoutDate(primaryOffer.checkIn, primaryOffer.nights),
            nights: primaryOffer.nights
        };
        
        return `
            <div class="champion-offer-card" data-offer-id="${primaryOffer.offer_id}" data-current-offer='${JSON.stringify(offerData)}' data-images='${JSON.stringify(imageUrls)}'>
                <!-- Hero Image with Overlays -->
                <div class="champion-hero">
                    <div class="carousel-container">
                        <div class="carousel-slides">
                            ${carouselSlides}
                        </div>
                    </div>
                    <div class="nights-overlay">
                        ${primaryOffer.pool_type || 'Pool'}
                    </div>
                    <div class="champion-price-overlay">
                        <div class="price-line">
                            <span class="currency">Rp</span>
                            <span class="amount">${priceInMillions}M</span>
                        </div>
                        <span class="nights-text">(${primaryOffer.nights} night${primaryOffer.nights > 1 ? 's' : ''})</span>
                    </div>
                </div>
                
                <!-- Savings Banner -->
                ${savingsBanner}
                
                <!-- Show Details Button -->
                ${savingsBanner ? `
                    <div class="show-details-container">
                        <button class="show-details-btn" onclick="app.toggleVillaDetails(this)">
                            <i class="fas fa-chevron-down"></i>
                            Show Detailed Offer
                        </button>
                    </div>
                ` : ''}
                
                <!-- Content Section -->
                <div class="champion-content">
                    <!-- Collapsible Details -->
                    <div class="villa-details-collapsible" style="display: none;">
                        <h3 class="champion-title">${tagline}</h3>
                        <div class="champion-checkin">${checkInText}</div>
                        
                        <!-- Included Perks -->
                        ${perksHtml}
                        
                        <!-- Booking Options -->
                        ${bookingOptionsHtml}
                        
                        <!-- Book Button -->
                        <button class="champion-book-btn" onclick="app.handleChampionBooking('${primaryOffer.offer_id}', '${villaKey}')">
                            BOOK NOW
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle stay extension from timeline
     */
    async extendStay(offerId, villaKey, extensionDate, extensionType) {
        console.log('Extending stay:', { offerId, villaKey, extensionDate, extensionType });
        
        // Show confirmation popup
        const confirmMessage = `Extend your stay to include ${extensionDate}?`;
        if (confirm(confirmMessage)) {
            try {
                // Find the current offer card
                const currentCard = document.querySelector(`[data-offer-id="${offerId}"]`);
                if (!currentCard) {
                    console.error('Current offer card not found');
                    return;
                }
                
                // Calculate new date range based on extension
                const newDateRange = this.calculateExtendedDateRange(currentCard, extensionDate, extensionType);
                console.log('Extended date range:', newDateRange);
                
                // Show loading state
                this.showExtensionLoadingState(currentCard);
                
                // Get current guest count from the application state
                const currentAdults = this.selectedAdults || '2';
                const currentChildren = this.selectedChildren || '0';
                console.log('Using guest count:', currentAdults, 'adults,', currentChildren, 'children');
                
                // Get extended offer from cache
                const extendedOffer = await this.getExtendedOfferFromCache(
                    villaKey, 
                    newDateRange.checkinDate, 
                    newDateRange.nights,
                    currentAdults, 
                    currentChildren
                );
                
                if (extendedOffer) {
                    console.log('Found extended offer in cache:', extendedOffer);
                    
                    // Update the calendar selection to reflect the extended dates
                    this.updateCalendarSelection(newDateRange.checkinDate, newDateRange.checkoutDate);
                    
                    // Replace the current card with updated offer data
                    await this.updateVillaCardWithExtendedOffer(currentCard, extendedOffer, villaKey, [extendedOffer]);
                    console.log('Villa card updated with extended offer');
                } else {
                    console.log('No matching offer found in cache for extension');
                    this.hideExtensionLoadingState(currentCard);
                    alert('Sorry, this villa is not available for the extended dates. Please try different dates.');
                }
                
            } catch (error) {
                console.error('Error extending stay:', error);
                alert('Sorry, there was an error extending your stay. Please try again.');
            }
        }
    }
    
    /**
     * Update calendar selection to reflect extended dates
     */
    updateCalendarSelection(newCheckinDate, newCheckoutDate) {
        // Find the calendar indices for the new dates
        const checkinDateStr = newCheckinDate;
        const checkoutDateStr = newCheckoutDate;
        
        for (let i = 0; i < this.calendarDates.length; i++) {
            const calDate = this.calendarDates[i].date.toISOString().split('T')[0];
            if (calDate === checkinDateStr) {
                this.selectedCheckIn = i;
            }
            if (calDate === checkoutDateStr) {
                this.selectedCheckOut = i;
            }
        }
        
        console.log('Updated calendar selection: check-in index', this.selectedCheckIn, 'check-out index', this.selectedCheckOut);
    }
    
    /**
     * Calculate new date range based on extension
     */
    calculateExtendedDateRange(currentCard, extensionDate, extensionType) {
        console.log('Calculating extended date range for extension:', extensionDate, 'type:', extensionType);
        
        // Get the current dates from the card's actual displayed offer
        const currentOffer = this.getCurrentOfferFromCard(currentCard);
        const currentCheckinDate = new Date(currentOffer.checkIn);
        const currentCheckoutDate = new Date(currentOffer.checkOut);
        
        console.log('Current booking from card: check-in', currentCheckinDate.toISOString().split('T')[0], 
                   'check-out', currentCheckoutDate.toISOString().split('T')[0]);
        
        let newCheckinDate, newCheckoutDate;
        
        if (extensionType === 'before') {
            // Extending backward: new check-in is extension date, check-out stays the same
            newCheckinDate = new Date(extensionDate);
            newCheckoutDate = new Date(currentCheckoutDate);
            console.log('Backward extension: moving check-in to', extensionDate);
        } else {
            // Extending forward: check-in stays the same, extend check-out by 1 day
            newCheckinDate = new Date(currentCheckinDate);
            newCheckoutDate = new Date(currentCheckoutDate);
            newCheckoutDate.setDate(newCheckoutDate.getDate() + 1); // Extend by 1 day
            console.log('Forward extension: extending check-out by 1 day from', 
                       currentCheckoutDate.toISOString().split('T')[0], 'to', 
                       newCheckoutDate.toISOString().split('T')[0]);
        }
        
        const result = {
            checkinDate: newCheckinDate.toISOString().split('T')[0],
            checkoutDate: newCheckoutDate.toISOString().split('T')[0],
            nights: Math.ceil((newCheckoutDate - newCheckinDate) / (1000 * 60 * 60 * 24))
        };
        
        console.log('Extended date range calculated:', result);
        return result;
    }
    
    /**
     * Get extended offer data from cache
     */
    async getExtendedOfferFromCache(villaDisplayName, checkinDate, nights, adults, children) {
        console.log('Getting extended offer from cache for:', villaDisplayName);
        
        // Find matching offers in cache
        const cachedOffers = this.findExtensionOffers(villaDisplayName, checkinDate, nights, adults, children);
        
        if (cachedOffers.length === 0) {
            console.log('No matching offers found in cache');
            return null;
        }
        
        // Use the first matching offer and convert it to the expected format
        const offer = cachedOffers[0];
        console.log('Found cached offer:', offer);
        
        // Convert cached offer to the format expected by the frontend
        const processedOffer = {
            villa: offer.villa_id || offer.UserRoomDisplayName,
            checkIn: offer.checkin_date,
            checkOut: this.calculateCheckoutDate(offer.checkin_date, offer.nights),
            nights: parseInt(offer.nights),
            rate: parseFloat(offer.price_for_guests),
            totalRate: parseFloat(offer.price_for_guests),
            faceValue: parseFloat(offer.total_face_value),
            savings: parseFloat(offer.guest_savings_value),
            savingsPercent: parseFloat(offer.guest_savings_percent),
            villa_display_name: offer.villa_display_name,
            tagline: offer.tagline,
            description: offer.description,
            square_meters: offer.square_meters,
            bathrooms: offer.bathrooms,
            bedrooms: offer.bedrooms,
            view_type: offer.view_type,
            pool_type: offer.pool_type,
            image_urls: offer.image_urls,
            key_amenities: offer.key_amenities,
            perks_included: offer.perks_included, // Keep original string format for villa card generation
            perk_ids: offer.perk_ids ? (typeof offer.perk_ids === 'string' ? JSON.parse(offer.perk_ids) : offer.perk_ids) : [],
            offer_id: `${offer.villa_id}_${offer.checkin_date}_${offer.nights}n`, // Generate unique ID for extended offers
            attractiveness_score: offer.attractiveness_score
        };
        
        return processedOffer;
    }
    
    /**
     * Get current offer data from card element
     */
    getCurrentOfferFromCard(cardElement) {
        // Get stored offer data from the card element
        const storedData = cardElement.dataset.currentOffer;
        if (storedData) {
            try {
                return JSON.parse(storedData);
            } catch (e) {
                console.error('Error parsing stored offer data:', e);
            }
        }
        
        // Fallback: use the current calendar selection
        const checkIn = this.calendarDates[this.selectedCheckIn].date.toISOString().split('T')[0];
        const checkOut = this.calendarDates[this.selectedCheckOut].date.toISOString().split('T')[0];
        const nights = this.selectedCheckOut - this.selectedCheckIn;
        
        return {
            checkIn: checkIn,
            checkOut: checkOut,
            nights: nights
        };
    }
    
    /**
     * Calculate checkout date from checkin and nights
     */
    calculateCheckoutDate(checkinDate, nights) {
        const checkin = new Date(checkinDate);
        const checkout = new Date(checkin);
        checkout.setDate(checkout.getDate() + nights);
        return checkout.toISOString().split('T')[0];
    }
    
    /**
     * Initialize image carousels for all villa cards
     */
    initializeImageCarousels() {
        // This will be called after villa cards are rendered
        this.carouselIntervals = new Map();
    }
    
    /**
     * Start carousel for a specific villa card
     */
    startCarousel(cardElement) {
        const slides = cardElement.querySelector('.carousel-slides');
        const slideElements = cardElement.querySelectorAll('.carousel-slide');
        
        if (!slides || slideElements.length <= 1) return;
        
        let currentIndex = 0;
        const slideInterval = 2000; // 2 seconds
        
        // Clear any existing interval for this card
        const offerId = cardElement.dataset.offerId;
        if (this.carouselIntervals.has(offerId)) {
            clearInterval(this.carouselIntervals.get(offerId));
        }
        
        // Start automatic sliding
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % slideElements.length;
            slides.style.transform = `translateX(-${currentIndex * 100}%)`;
        }, slideInterval);
        
        this.carouselIntervals.set(offerId, interval);
    }
    
    /**
     * Initialize gallery modal
     */
    initializeGalleryModal() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('imageModal')) {
            const modalHtml = `
                <div id="imageModal" class="modal">
                    <span class="close">&times;</span>
                    <span class="prev">&#10094;</span>
                    <span class="next">&#10095;</span>
                    <img class="modal-content" id="modalImage">
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        // Setup modal controls
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        const closeModal = document.querySelector('.modal .close');
        const prevButton = document.querySelector('.modal .prev');
        const nextButton = document.querySelector('.modal .next');
        
        this.galleryModal = {
            modal,
            modalImg,
            currentImages: [],
            currentIndex: 0
        };
        
        // Close modal
        closeModal.addEventListener('click', () => this.closeGallery());
        
        // Navigation
        nextButton.addEventListener('click', () => this.showNextGalleryImage());
        prevButton.addEventListener('click', () => this.showPrevGalleryImage());
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeGallery();
            }
        });
        
        // Delegate click events for villa images
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('champion-hero-image')) {
                const villaCard = e.target.closest('.champion-offer-card');
                if (villaCard) {
                    const images = JSON.parse(villaCard.dataset.images || '[]');
                    const index = parseInt(e.target.dataset.index || '0');
                    this.openGallery(images, index);
                }
            }
        });
    }
    
    /**
     * Open gallery modal
     */
    openGallery(images, startIndex = 0) {
        this.galleryModal.currentImages = images;
        this.galleryModal.currentIndex = startIndex;
        this.galleryModal.modal.style.display = 'flex';
        this.galleryModal.modalImg.src = images[startIndex];
        
        // Stop all carousels when modal is open
        this.carouselIntervals.forEach(interval => clearInterval(interval));
    }
    
    /**
     * Close gallery modal
     */
    closeGallery() {
        this.galleryModal.modal.style.display = 'none';
        
        // Restart carousels
        document.querySelectorAll('.champion-offer-card').forEach(card => {
            this.startCarousel(card);
        });
    }
    
    /**
     * Show next image in gallery
     */
    showNextGalleryImage() {
        const { currentImages } = this.galleryModal;
        this.galleryModal.currentIndex = (this.galleryModal.currentIndex + 1) % currentImages.length;
        this.galleryModal.modalImg.src = currentImages[this.galleryModal.currentIndex];
    }
    
    /**
     * Show previous image in gallery
     */
    showPrevGalleryImage() {
        const { currentImages } = this.galleryModal;
        this.galleryModal.currentIndex = (this.galleryModal.currentIndex - 1 + currentImages.length) % currentImages.length;
        this.galleryModal.modalImg.src = currentImages[this.galleryModal.currentIndex];
    }
    
    /**
     * Update villa card with extended offer data
     */
    async updateVillaCardWithExtendedOffer(currentCard, newOffer, villaKey, allExtendedOffers) {
        // Re-query with broader date range to capture all extension possibilities
        try {
            // Calculate extended date range to capture all possible extensions
            const checkInDate = new Date(newOffer.checkIn);
            const checkOutDate = new Date(newOffer.checkOut);
            
            // Query for 3 days before check-in and 3 days after check-out to capture all extensions
            const queryStartDate = new Date(checkInDate);
            queryStartDate.setDate(queryStartDate.getDate() - 3);
            
            const queryEndDate = new Date(checkOutDate);
            queryEndDate.setDate(queryEndDate.getDate() + 3);
            
            console.log(`Re-querying for ${villaKey} from ${queryStartDate.toISOString().split('T')[0]} to ${queryEndDate.toISOString().split('T')[0]}`);
            
            // Query with broader range to get all possible offers using GET parameters
            const queryParams = new URLSearchParams({
                checkinDate: queryStartDate.toISOString().split('T')[0],
                checkoutDate: queryEndDate.toISOString().split('T')[0], 
                adults: this.selectedAdults,
                children: this.selectedChildren
            });
            
            const response = await fetch(`/api/activities?${queryParams}`);

            // Instead of using the re-query response, always use the full cache for comprehensive extension checking
            console.log('Ignoring re-query, using full cache to find all villa offers for extension checking');
            
            // Get ALL cached offers for this villa across all dates
            const allCachedVillaOffers = this.cachedOffers.filter(offer => 
                offer.villa_display_name === villaKey
            );
            
            console.log(`Found ${allCachedVillaOffers.length} total cached offers for ${villaKey}`);
            
            // Convert cached offers to frontend format for timeline generation
            const formattedOffers = allCachedVillaOffers.map(offer => ({
                villa: offer.villa_id || offer.UserRoomDisplayName,
                checkIn: offer.checkin_date,
                checkOut: this.calculateCheckoutDate(offer.checkin_date, offer.nights),
                nights: offer.nights,
                rate: offer.price_for_guests,
                totalRate: offer.price_for_guests,
                faceValue: offer.total_face_value,
                savings: offer.guest_savings_value,
                savingsPercent: offer.guest_savings_percent,
                villa_display_name: offer.villa_display_name,
                tagline: offer.tagline,
                description: offer.description,
                square_meters: offer.square_meters,
                bathrooms: offer.bathrooms,
                bedrooms: offer.bedrooms,
                view_type: offer.view_type,
                pool_type: offer.pool_type,
                image_urls: offer.image_urls,
                perks_included: offer.perks_included,
                max_adults: offer.max_adults,
                max_children: offer.max_children
            }));
            
            // Generate new card HTML with the extended offer and ALL cached offers for proper extension checking
            const newCardHtml = await this.generateChampionVillaCardWithTimeline(villaKey, newOffer, formattedOffers);
            
            // Replace the current card with the new one
            currentCard.outerHTML = newCardHtml;
            
            // Start carousel for the new card
            const newCard = document.querySelector(`[data-offer-id="${newOffer.offer_id}"]`);
            if (newCard) {
                this.startCarousel(newCard);
            }
            
            console.log('Villa card updated with extended offer and all cached extension options');
        } catch (error) {
            console.error('Error re-querying offers:', error);
            
            // Fallback to original logic
            const villaOffers = allExtendedOffers.filter(offer => 
                offer.villa_display_name === villaKey || offer.villa === villaKey
            );
            
            const newCardHtml = await this.generateChampionVillaCardWithTimeline(villaKey, newOffer, villaOffers);
            currentCard.outerHTML = newCardHtml;
            
            console.log('Villa card updated with extended pricing and perks (error fallback)');
        }
    }
    
    /**
     * Show loading state during extension
     */
    showExtensionLoadingState(card) {
        const bookBtn = card.querySelector('.champion-book-btn');
        if (bookBtn) {
            bookBtn.textContent = 'UPDATING PRICING...';
            bookBtn.disabled = true;
            bookBtn.style.opacity = '0.6';
        }
    }
    
    /**
     * Hide loading state after extension
     */
    hideExtensionLoadingState(card) {
        const bookBtn = card.querySelector('.champion-book-btn');
        if (bookBtn) {
            bookBtn.disabled = false;
            bookBtn.style.opacity = '1';
        }
    }

    /**
     * Format price for display in price tag
     */
    formatPrice(rate) {
        return this.formatRate(rate);
    }

    /**
     * Generate savings display banner
     */
    generateSavingsDisplay(offer) {
        if (offer.savings && offer.savings > 0) {
            const savingsPercent = Math.round(offer.savingsPercent * 100);
            return `
                <div class="champion-savings-banner">
                    Save ${savingsPercent}% - You Save $${Math.round(offer.savings)}!
                </div>
            `;
        }
        return '';
    }

    /**
     * Generate perks display from offer data
     */
    generatePerksDisplay(offer) {
        if (offer.perks_included && offer.perks_included.trim()) {
            return `
                <div class="champion-perks">
                    <h4 class="perks-title">
                        <i class="fas fa-gift"></i>
                        Included Perks
                    </h4>
                    <div class="perks-list">
                        ${offer.perks_included.split(',').map(perk => `
                            <div class="perk-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${perk.trim()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        return '';
    }

    /**
     * Generate night selector buttons
     */
    generateNightSelector(dateGroups, primaryOffer) {
        // Get all available night options for the primary offer's date
        const primaryDate = primaryOffer.checkIn.split('T')[0];
        const nightOptions = dateGroups[primaryDate] || [primaryOffer];
        
        if (nightOptions.length <= 1) {
            return ''; // Don't show selector if only one option
        }

        return `
            <div class="champion-night-selector">
                <div class="night-selector-label">Extend your stay:</div>
                <div class="night-selector-buttons">
                    ${nightOptions.map(offer => `
                        <button class="night-selector-btn ${offer.offer_id === primaryOffer.offer_id ? 'active' : ''}" 
                                data-offer-id="${offer.offer_id}"
                                onclick="app.selectChampionNights('${offer.offer_id}')">
                            ${offer.nights}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Format check-in display
     */
    formatCheckInDisplay(offer) {
        const checkInDate = new Date(offer.checkIn);
        const dayName = this.getDayOfWeek(checkInDate);
        const formattedDate = this.formatDateForDisplay(offer.checkIn);
        const daysFromNow = this.calculateDaysFromNow(checkInDate);
        
        return `Check-in: ${dayName}, ${formattedDate}${daysFromNow}`;
    }

    /**
     * Handle champion booking button click
     */
    handleChampionBooking(offerId, villaKey) {
        console.log('handleChampionBooking called with:', offerId, villaKey);
        console.log('Available offer IDs in currentOffers:', this.currentOffers.map(o => o.offer_id));
        
        // Find the offer details - try both string and number comparison
        const offer = this.currentOffers.find(o => 
            o.offer_id == offerId || // Loose comparison for type mismatch
            o.offer_id === offerId || // Strict comparison
            String(o.offer_id) === String(offerId) // String comparison
        );
        
        if (!offer) {
            console.error('Offer not found:', offerId, '(type:', typeof offerId, ')');
            console.error('Available offers with IDs:', this.currentOffers.map(o => ({
                offer_id: o.offer_id,
                type: typeof o.offer_id,
                villa: o.villa_display_name
            })));
            alert('Sorry, this offer is no longer available. Please refresh the page and try again.');
            return;
        }

        console.log('Found offer:', offer);

        // Save user state before booking to preserve selections
        this.saveUserState();

        // Store complete booking data in sessionStorage for confirm-booking page
        const bookingData = {
            offerId: offerId,
            villaKey: villaKey,
            villaDisplayName: offer.villa_display_name,
            tagline: offer.tagline,
            description: offer.description,
            checkIn: offer.checkIn,
            checkOut: offer.checkOut,
            nights: offer.nights,
            adults: this.selectedAdults || 2,
            children: this.selectedChildren || 0,
            totalGuests: (this.selectedAdults || 2) + (this.selectedChildren || 0),
            rate: offer.rate,
            totalRate: offer.totalRate,
            faceValue: offer.faceValue,
            savings: offer.savings,
            savingsPercent: offer.savingsPercent,
            perks: offer.perks || [],
            imageUrls: offer.image_urls,
            bedrooms: offer.bedrooms,
            bathrooms: offer.bathrooms,
            squareMeters: offer.square_meters,
            viewType: offer.view_type,
            poolType: offer.pool_type,
            webpageUrl: offer.webpage_url,
            timestamp: Date.now()
        };

        console.log('Storing booking data:', bookingData);

        try {
            // Store in sessionStorage (clears when tab closes)
            sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
            console.log('Booking data stored in sessionStorage');
            
            // Navigate to confirm-booking page in same tab
            console.log('Navigating to /confirm-booking...');
            window.location.href = '/confirm-booking';
        } catch (error) {
            console.error('Error during booking process:', error);
            alert('There was an error processing your booking. Please try again.');
        }
    }

    /**
     * Select different offer when date selector is clicked
     */
    selectChampionOffer(offerId, villaKey) {
        // Find the offer
        const offer = this.currentOffers.find(o => o.offer_id === offerId);
        if (!offer) return;

        // Find the card container
        const card = document.querySelector(`[data-offer-id="${offer.offer_id}"]`).closest('.champion-offer-card');
        if (!card) return;

        // Update selected state on date selectors
        card.querySelectorAll('.date-selector-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');

        // Update the displayed information for this offer
        this.updateChampionCardDisplay(card, offer, villaKey);
    }
    
    /**
     * Select different night option for champion offer (legacy method)
     */
    selectChampionNights(offerId) {
        this.selectChampionOffer(offerId, null);
    }

    /**
     * Update champion card display when selection changes
     */
    updateChampionCardDisplay(card, offer, villaKey) {
        // Update price
        const priceInMillions = (offer.totalRate / 1000000).toFixed(1);
        const priceAmount = card.querySelector('.champion-price-overlay .amount');
        if (priceAmount) {
            priceAmount.textContent = `${priceInMillions}M`;
        }

        // Update savings banner
        const savingsBanner = card.querySelector('.champion-savings-banner');
        if (savingsBanner) {
            if (offer.savings && offer.savings > 0) {
                const savingsInMillions = (offer.savings / 1000000).toFixed(1);
                const savingsPercent = Math.round(offer.savingsPercent * 100);
                savingsBanner.innerHTML = `<i class="fas fa-tag"></i> You Save ${savingsInMillions}M (${savingsPercent}%) with this Special Offer!`;
                savingsBanner.style.display = 'block';
            } else {
                savingsBanner.style.display = 'none';
            }
        }

        // Update check-in date
        const checkInDate = new Date(offer.checkIn);
        const dayName = this.getDayOfWeek(checkInDate);
        const monthName = checkInDate.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = checkInDate.getDate();
        const daysFromNow = this.calculateDaysFromNow(checkInDate);
        const checkInText = `Check-in: ${dayName}, ${monthName} ${dayNum}${daysFromNow}`;
        
        const checkinElement = card.querySelector('.champion-checkin');
        if (checkinElement) {
            checkinElement.textContent = checkInText;
        }

        // Update book button
        const bookBtn = card.querySelector('.champion-book-btn');
        if (bookBtn) {
            bookBtn.textContent = `BOOK SPECIAL OFFER (${offer.nights} NIGHT${offer.nights > 1 ? 'S' : ''})`;
            bookBtn.onclick = () => this.handleChampionBooking(offer.offer_id, villaKey);
        }

        // Update card's data-offer-id
        card.dataset.offerId = offer.offer_id;

        // Update perks if they change with different nights
        if (offer.perks_included !== this.lastDisplayedPerks) {
            const perksContainer = card.querySelector('.champion-perks-section');
            if (perksContainer && offer.perks_included) {
                const perks = offer.perks_included.split(',').map(p => p.trim());
                const perkIcons = {
                    'Cocktails': 'fas fa-cocktail',
                    'Sunset Trip': 'fas fa-sun',
                    'Massage': 'fas fa-spa',
                    'Breakfast': 'fas fa-coffee',
                    'Airport Transfer': 'fas fa-plane',
                    'Snorkeling': 'fas fa-fish',
                    'Yoga': 'fas fa-heart'
                };
                
                perksContainer.innerHTML = `
                    <div class="perks-label"><i class="fas fa-gift"></i> Included Perks</div>
                    <div class="perks-list">
                        ${perks.map(perk => `
                            <div class="perk-item">
                                <i class="${perkIcons[perk] || 'fas fa-check'}"></i>
                                <span>${perk}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            this.lastDisplayedPerks = offer.perks_included;
        }
    }

    /**
     * Group offers by villa name and check-in date
     */
    groupOffersByVillaAndDate(offers) {
        const groups = {};
        
        offers.forEach(offer => {
            if (!groups[offer.villa]) {
                groups[offer.villa] = {};
            }
            
            if (!groups[offer.villa][offer.checkIn]) {
                groups[offer.villa][offer.checkIn] = [];
            }
            
            groups[offer.villa][offer.checkIn].push(offer);
        });
        
        // Sort offers within each check-in date by nights ascending
        Object.keys(groups).forEach(villa => {
            Object.keys(groups[villa]).forEach(checkInDate => {
                groups[villa][checkInDate].sort((a, b) => a.nights - b.nights);
            });
        });
        
        return groups;
    }

    /**
     * Generate individual villa card HTML
     */
    async generateVillaCard(villaName, villaDetails, villaOffers) {
        const villaClass = villaDetails.villaClass || '';
        const tagline = villaDetails.tagline || villaName;
        const description = villaDetails.description || this.getVillaDescription(villaName);
        const imageUrls = this.parseImageUrls(villaDetails.image_urls);
        const specifications = this.formatVillaSpecs(villaDetails);
        
        // Generate consolidated check-in date groups with night selector
        const checkinGroups = await Promise.all(
            Object.keys(villaOffers)
                .sort() // Sort dates chronologically
                .map(async checkInDate => {
                    const dateOffers = villaOffers[checkInDate];
                    const dateObj = new Date(checkInDate.includes('T') ? checkInDate : checkInDate + 'T00:00:00');
                    const checkinDay = this.getDayOfWeek(dateObj);
                    const daysFromNow = this.calculateDaysFromNow(dateObj);
                    
                    // Create unique card ID
                    const cardId = `${villaName.replace(/\s+/g, '')}-${checkInDate.split('T')[0]}`;
                    
                    // Default to 2 nights (or first available option)
                    const defaultOffer = dateOffers.find(offer => offer.nights === 2) || dateOffers[0];
                    const villaId = this.mapVillaNameToId(villaName);
                    
                    // Get perks for default selection
                    const defaultPerks = await this.fetchPerks(villaId, defaultOffer.nights, this.selectedAdults, this.selectedChildren);
                    const defaultPerksDisplay = this.formatPerksDisplay(defaultPerks);
                    const defaultFaceValue = this.calculateFaceValue(defaultOffer.rate, defaultOffer.nights, defaultPerks, this.selectedAdults, this.selectedChildren);
                    
                    // Create night selector buttons only for available night options
                    const availableNights = dateOffers.map(offer => offer.nights).sort((a, b) => a - b);
                    console.log(`Available nights for ${villaName} on ${checkInDate}:`, availableNights);
                    
                    const nightSelector = dateOffers.map(offer => {
                        const isActive = offer.nights === defaultOffer.nights;
                        return `<button class="night-selector-btn ${isActive ? 'active' : ''}" 
                                       data-nights="${offer.nights}" 
                                       data-card-id="${cardId}"
                                       onclick="app.selectNights('${cardId}', ${offer.nights}, '${villaName}', '${checkInDate}'); return false;">
                                    ${offer.nights === 1 ? '①' : offer.nights === 2 ? '②' : offer.nights === 3 ? '③' : '④'}
                                </button>`;
                    }).join('');
                    
                    return `
                        <div class="checkin-group" data-card-id="${cardId}">
                            <div class="checkin-date-header">
                                Check-in: ${checkinDay}, ${this.formatDateForDisplay(checkInDate)}${daysFromNow}
                            </div>
                            <div class="consolidated-booking-card">
                                <div class="night-selector">
                                    <label class="night-selector-label">Nights:</label>
                                    ${nightSelector}
                                </div>
                                <div class="booking-content">
                                    <div class="booking-info">
                                        <div class="booking-duration" data-field="duration">
                                            ${defaultOffer.nights} ${defaultOffer.nights === 1 ? 'Night' : 'Nights'}
                                        </div>
                                        <div data-field="perks">
                                            ${defaultPerksDisplay}
                                        </div>
                                        <div class="booking-dates" data-field="dates">
                                            ${this.formatDateForDisplay(defaultOffer.checkIn)} - ${this.formatDateForDisplay(defaultOffer.checkOut)}
                                        </div>
                                    </div>
                                    <div class="booking-price">
                                        <div data-field="face-value" style="${defaultFaceValue > defaultOffer.rate * defaultOffer.nights ? '' : 'display: none;'}">
                                            Face Value: ${this.formatRate(defaultFaceValue)}
                                        </div>
                                        <div class="rate" data-field="price">Your Price: ${this.formatRate(defaultOffer.rate * defaultOffer.nights)}</div>
                                    </div>
                                    <button class="book-btn" data-field="book-btn" onclick="app.handleBooking('${villaName}', '${checkInDate}', ${defaultOffer.nights})">
                                        Book
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                })
        );
        
        return `
            <div class="villa-card">
                ${imageUrls.length > 0 ? `
                    <div class="villa-image-gallery">
                        <div class="villa-image-container">
                            <img src="${imageUrls[0]}" alt="${tagline}" class="villa-main-image" loading="lazy">

                            ${villaDetails.class ? `<div class="villa-class-badge">${villaDetails.class}</div>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="villa-card-header">
                    <div class="villa-tagline">${tagline}</div>
                    <div class="villa-name-subtitle">${villaDetails.villa_display_name || villaName}</div>
                    
                    ${specifications ? `
                        <div class="villa-specifications">
                            ${specifications}
                        </div>
                    ` : ''}
                    
                    <div class="villa-description" data-expanded="false">
                        <div class="description-preview">
                            <p>${this.truncateText(description, 100)}</p>
                            ${description.length > 100 ? `<button class="expand-btn" onclick="toggleDescription(this)">Show more</button>` : ''}
                        </div>
                        <div class="description-full">
                            <p>${description}</p>
                            ${this.formatKeyAmenities(villaDetails.key_amenities)}
                            ${description.length > 100 ? `<button class="expand-btn" onclick="toggleDescription(this)">Show less</button>` : ''}
                        </div>
                    </div>
                    
                    <div class="villa-details">
                        <div class="villa-detail-item">
                            <i class="fas fa-users"></i>
                            <span>${villaDetails.maxGuests} Guests</span>
                        </div>
                        <div class="villa-detail-item">
                            <i class="fas fa-bed"></i>
                            <span>${villaDetails.bedrooms} ${villaDetails.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                        </div>
                        <div class="villa-detail-item">
                            <i class="fas fa-${villaDetails.pool === 'Private' ? 'lock' : 'users'}"></i>
                            <span>Pool: ${this.formatPoolInfo(villaDetails.pool)}</span>
                        </div>
                    </div>
                </div>
                <div class="villa-booking-options">
                    <div class="booking-section-title">Select Your Stay:</div>
                    ${checkinGroups.join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get villa description based on name
     */
    getVillaDescription(villaName) {
        const descriptions = {
            'Shore Villa': 'An exclusive sanctuary for the discerning traveler. Our two-bedroom Shore Villa offers unparalleled privacy and luxury.',
            'Garden Villa': 'Immerse yourself in tropical tranquility. Our Garden Villa provides an intimate escape surrounded by lush landscapes.',
            'Pool Villa': 'Experience ultimate luxury with your private pool. Our Pool Villa offers the perfect blend of comfort and exclusivity.',
            'Ocean Villa': 'Wake up to breathtaking ocean views. Our Ocean Villa delivers an unforgettable beachfront experience.',
            'Sunset Villa': 'Witness spectacular sunsets from your private terrace. Our Sunset Villa creates magical evening moments.'
        };
        
        return descriptions[villaName] || 'A luxury villa experience crafted for your perfect getaway on Gili Air.';
    }

    /**
     * Format date for display (e.g., "Aug 21")
     */
    formatDateForDisplay(dateString) {
        if (!dateString) return 'Invalid Date';
        
        // Handle various date formats
        let date;
        if (dateString.includes('T')) {
            date = new Date(dateString);
        } else {
            date = new Date(dateString + 'T00:00:00');
        }
        
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    /**
     * Get day of week from date
     */
    getDayOfWeek(date) {
        if (!date || isNaN(date.getTime())) {
            return 'Invalid';
        }
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    /**
     * Calculate days from now with "In xx days" format
     */
    calculateDaysFromNow(targetDate) {
        if (!targetDate || isNaN(targetDate.getTime())) {
            return '';
        }
        
        // Get current date in Bali timezone (UTC+8)
        const now = new Date();
        const baliNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const today = new Date(baliNow.getFullYear(), baliNow.getMonth(), baliNow.getDate());
        
        // Get target date without time
        const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        
        // Calculate difference in days - use Math.round for accurate day calculation
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return ' (Today)';
        } else if (diffDays === 1) {
            return ' (Tomorrow)';
        } else if (diffDays > 1) {
            return ` (In ${diffDays} days)`;
        } else {
            return ` (${Math.abs(diffDays)} days ago)`;
        }
    }
    
    /**
     * Generate custom table headers
     */
    generateCustomTableHeaders() {
        const headers = [
            'Date',
            'Villa/Room', 
            'Availability',
            'Rate',
            'Bedrooms',
            'Max Adults',
            'Max Guests',
            'Pool',
            'Class'
        ];
        
        this.elements.tableHeaders.innerHTML = '';
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            this.elements.tableHeaders.appendChild(th);
        });
    }
    
    /**
     * Populate table with custom data formatting
     */
    populateCustomTableData(activities) {
        this.elements.activitiesTableBody.innerHTML = '';
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            
            // Date (only date, not time)
            const dateCell = document.createElement('td');
            const date = new Date(activity.EntryDate);
            dateCell.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            row.appendChild(dateCell);
            
            // Villa/Room
            const roomCell = document.createElement('td');
            roomCell.innerHTML = `<strong>${this.escapeHtml(activity.UserRoomDisplayName || '')}</strong>`;
            row.appendChild(roomCell);
            
            // Availability
            const availCell = document.createElement('td');
            availCell.textContent = activity.AvailabilityCount || 0;
            availCell.className = activity.AvailabilityCount > 0 ? 'availability-available' : 'availability-none';
            row.appendChild(availCell);
            
            // Rate (convert to millions with 1 decimal place)
            const rateCell = document.createElement('td');
            const rate = parseFloat(activity.LowestRateAmount) || 0;
            const rateInMillions = rate / 1000000;
            rateCell.innerHTML = `<span class="rate">${rateInMillions.toFixed(1)}M</span>`;
            row.appendChild(rateCell);
            
            // Bedrooms
            const bedroomsCell = document.createElement('td');
            bedroomsCell.textContent = activity.Bedrooms || 0;
            row.appendChild(bedroomsCell);
            
            // Max Adults
            const adultsCell = document.createElement('td');
            adultsCell.textContent = activity.MaxAdultsPerUnit || 0;
            row.appendChild(adultsCell);
            
            // Max Guests
            const guestsCell = document.createElement('td');
            guestsCell.textContent = activity.MaxGuestsPerUnit || 0;
            row.appendChild(guestsCell);
            
            // Pool (with icons for Private vs Shared)
            const poolCell = document.createElement('td');
            const poolValue = (activity.Pool || '').toString().toLowerCase();
            if (poolValue.includes('private')) {
                poolCell.innerHTML = '<i class="fas fa-lock" style="color: #AA7831; margin-right: 5px;"></i>Private';
            } else if (poolValue.includes('shared')) {
                poolCell.innerHTML = '<i class="fas fa-users" style="color: #4CAF50; margin-right: 5px;"></i>Shared';
            } else {
                poolCell.textContent = activity.Pool || '';
            }
            row.appendChild(poolCell);
            
            // Class (with enhanced styling)
            const classCell = document.createElement('td');
            const classValue = (activity.UserDefinedClass || 'Normal').toString().toLowerCase();
            const classDisplay = activity.UserDefinedClass || 'Normal';
            const classCSS = classValue.includes('premium') ? 'premium' : 'normal';
            classCell.innerHTML = `<span class="villa-class ${classCSS}">${this.escapeHtml(classDisplay)}</span>`;
            row.appendChild(classCell);
            
            this.elements.activitiesTableBody.appendChild(row);
        });
    }
    

    
    /**
     * Format rate from amount to millions with 1 decimal place
     */
    formatRate(amount) {
        if (!amount) return '-';
        const rate = parseFloat(amount) || 0;
        const rateInMillions = rate / 1000000;
        return `${rateInMillions.toFixed(1)}M`;
    }

    /**
     * Format pool information with icons
     */
    formatPoolInfo(poolValue) {
        if (!poolValue) return '';
        const poolStr = poolValue.toString().toLowerCase();
        if (poolStr.includes('private')) {
            return '<i class="fas fa-lock" style="color: #AA7831; margin-right: 5px;"></i>Private';
        } else if (poolStr.includes('shared')) {
            return '<i class="fas fa-users" style="color: #4CAF50; margin-right: 5px;"></i>Shared';
        } else {
            return poolValue;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    

    
    /**
     * Show notification (simple alert for now, can be enhanced)
     */
    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        }
        
        if (error.message.includes('503')) {
            return 'Database service is temporarily unavailable. Please try again in a moment.';
        }
        
        if (error.message.includes('404')) {
            return 'The requested data could not be found. The table may not exist or may be empty.';
        }
        
        if (error.message.includes('401')) {
            return 'Database access denied. Please check the database credentials.';
        }
        
        if (error.message.includes('500')) {
            return 'An internal server error occurred. Please try again later.';
        }
        
        return error.message || 'An unexpected error occurred. Please try again.';
    }

    /**
     * Parse image URLs from database field
     */
    parseImageUrls(imageUrlsField) {
        if (!imageUrlsField) return [];
        
        try {
            // Try parsing as JSON array first
            if (imageUrlsField.startsWith('[')) {
                return JSON.parse(imageUrlsField);
            }
            
            // Otherwise, split by comma and clean up
            return imageUrlsField.split(',')
                .map(url => url.trim())
                .filter(url => url.length > 0);
        } catch (error) {
            console.log('Error parsing image URLs:', error);
            return [];
        }
    }

    /**
     * Format villa specifications
     */
    formatVillaSpecs(villaDetails) {
        const specs = [];
        
        if (villaDetails.square_meters) {
            specs.push(`<div class="spec-item"><i class="fas fa-expand-arrows-alt"></i> ${villaDetails.square_meters}m²</div>`);
        }
        
        if (villaDetails.bathrooms) {
            specs.push(`<div class="spec-item"><i class="fas fa-bath"></i> ${villaDetails.bathrooms} ${villaDetails.bathrooms === 1 ? 'Bath' : 'Baths'}</div>`);
        }
        
        if (villaDetails.view_type) {
            specs.push(`<div class="spec-item"><i class="fas fa-eye"></i> ${villaDetails.view_type}</div>`);
        }
        
        if (villaDetails.pool_type) {
            specs.push(`<div class="spec-item"><i class="fas fa-swimming-pool"></i> ${villaDetails.pool_type} Pool</div>`);
        }
        
        return specs.length > 0 ? specs.join('') : null;
    }

    /**
     * Truncate text for preview
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Toggle description expansion
     */
    toggleDescription(button) {
        const descriptionContainer = button.closest('.villa-description');
        const isExpanded = descriptionContainer.getAttribute('data-expanded') === 'true';
        descriptionContainer.setAttribute('data-expanded', !isExpanded);
        button.textContent = isExpanded ? 'Show more' : 'Show less';
    }

    /**
     * Setup mobile-specific guest selector labels
     */
    setupMobileGuestSelectors() {
        const updateGuestSelectLabels = () => {
            const isMobile = window.innerWidth <= 768;
            
            // Update adults selector
            const adultsSelect = this.elements.adultsCount;
            if (adultsSelect) {
                const adultsOptions = adultsSelect.querySelectorAll('option');
                adultsOptions.forEach(option => {
                    if (isMobile) {
                        option.textContent = option.getAttribute('data-mobile');
                    } else {
                        option.textContent = option.getAttribute('data-desktop');
                    }
                });
            }
            
            // Update children selector
            const childrenSelect = this.elements.childrenCount;
            if (childrenSelect) {
                const childrenOptions = childrenSelect.querySelectorAll('option');
                childrenOptions.forEach(option => {
                    if (isMobile) {
                        option.textContent = option.getAttribute('data-mobile');
                    } else {
                        option.textContent = option.getAttribute('data-desktop');
                    }
                });
            }
        };
        
        // Update on page load
        updateGuestSelectLabels();
        
        // Update on window resize
        window.addEventListener('resize', updateGuestSelectLabels);
    }

    /**
     * Fetch perks for a specific booking combination
     */
    async fetchPerks(villaId, nights, adults, children) {
        try {
            const response = await fetch(`/api/perks/${villaId}/${nights}/${adults}/${children}`);
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.perks : [];
            }
        } catch (error) {
            console.error('Error fetching perks:', error);
        }
        return [];
    }

    /**
     * Map villa display name to database villa_id
     */
    mapVillaNameToId(villaName) {
        const mapping = {
            'Pearl': 'Pearl',
            'Leaf': 'Leaf',
            'Shore': 'Shore',
            'Sunset Room': 'Sunset',
            'Swell 2BR': 'Swell 2BR',
            'Swell 3BR': 'Swell 3BR', 
            'Swell 4BR': 'Swell 4BR',
            'Tide': 'Tide',
            'Wave': 'Wave'
        };
        return mapping[villaName] || villaName;
    }

    /**
     * Calculate total face value (room cost + perks value)
     */
    calculateFaceValue(roomRate, nights, perks, adults, children) {
        // Base room cost (room rate × nights)
        const roomCost = roomRate * nights;
        
        // Calculate total perks value
        const perksValue = perks.reduce((total, perk) => {
            const facePrice = parseFloat(perk.face_price) || 0;
            
            // Check if perk is per person based on comments
            if (this.isPerPersonActivity(perk.comments)) {
                return total + (facePrice * (adults + children));
            } else {
                return total + facePrice;
            }
        }, 0);
        
        return roomCost + perksValue;
    }
    
    /**
     * Check if activity pricing is per person based on comments
     */
    isPerPersonActivity(comments) {
        if (!comments) return false;
        
        const lowerComments = comments.toLowerCase();
        
        // Per person indicators
        if (lowerComments.includes('per pax') || 
            lowerComments.includes('per person') ||
            lowerComments.includes('pp') ||
            lowerComments.includes('each person')) {
            return true;
        }
        
        // Fixed quantity indicators (not per person)
        if (lowerComments.match(/^\d+\s*pax$/i) || // "2 pax", "3 pax"
            lowerComments.match(/^\d+-\d+\s*pax$/i)) { // "2-3 pax"
            return false;
        }
        
        return false; // Default to fixed price
    }

    /**
     * Format perks for display
     */
    formatPerksDisplay(perks) {
        if (!perks || perks.length === 0) {
            return '';
        }
        
        // Show all perks
        const perkNames = perks.map(perk => perk.name);
        
        return `<div class="perks-display">🎁 ${perkNames.join(', ')}</div>`;
    }

    /**
     * Format key amenities from database field
     */
    formatKeyAmenities(keyAmenitiesField) {
        if (!keyAmenitiesField) return '';
        
        try {
            let amenities = [];
            
            // Try parsing as JSON array first
            if (keyAmenitiesField.startsWith('[')) {
                amenities = JSON.parse(keyAmenitiesField);
            } else {
                // Otherwise, split by comma and clean up
                amenities = keyAmenitiesField.split(',')
                    .map(amenity => amenity.trim())
                    .filter(amenity => amenity.length > 0);
            }
            
            if (amenities.length === 0) return '';
            
            return `
                <div class="key-amenities">
                    <h4 class="amenities-title">Key Amenities:</h4>
                    <ul class="amenities-list">
                        ${amenities.map(amenity => `<li><i class="fas fa-check"></i> ${amenity}</li>`).join('')}
                    </ul>
                </div>
            `;
        } catch (error) {
            console.log('Error parsing key amenities:', error);
            return '';
        }
    }

    /**
     * Handle night selection change in consolidated booking cards
     */
    async selectNights(cardId, nights, villaName, checkInDate) {
        try {
            // Prevent page refresh
            event.preventDefault();
            event.stopPropagation();
            // Update active button state
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (!card) return;
            
            // Remove active class from all buttons in this card
            card.querySelectorAll('.night-selector-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected button
            const selectedBtn = card.querySelector(`[data-nights="${nights}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('active');
            }
            
            // Calculate new checkout date
            const checkInDateObj = new Date(checkInDate.includes('T') ? checkInDate : checkInDate + 'T00:00:00');
            const checkOutDateObj = new Date(checkInDateObj);
            checkOutDateObj.setDate(checkInDateObj.getDate() + nights);
            const checkOutDateStr = checkOutDateObj.toISOString().split('T')[0];
            
            // Get villa rate for this date and night combination
            const villaOffers = this.currentOffers || [];
            const checkInDateStr = checkInDate.split('T')[0];
            
            // Debug logging
            console.log('Looking for offer:', villaName, checkInDateStr, nights);
            console.log('Available offers:', villaOffers.filter(o => o.villa === villaName && o.checkIn.split('T')[0] === checkInDateStr));
            
            const offer = villaOffers.find(o => 
                o.villa === villaName && 
                o.checkIn.split('T')[0] === checkInDateStr && 
                o.nights === nights
            );
            
            if (!offer) {
                console.error('Offer not found for', villaName, checkInDate, nights);
                console.log('All offers for villa:', villaOffers.filter(o => o.villa === villaName));
                
                // Show user-friendly error
                this.showNotification(`Sorry, ${nights} night${nights === 1 ? '' : 's'} not available for this date`, 'error');
                return false;
            }
            
            // Fetch new perks for the selected nights
            const villaId = this.mapVillaNameToId(villaName);
            const perks = await this.fetchPerks(villaId, nights, this.selectedAdults, this.selectedChildren);
            const perksDisplay = this.formatPerksDisplay(perks);
            const faceValue = this.calculateFaceValue(offer.rate, nights, perks, this.selectedAdults, this.selectedChildren);
            
            // Update the card content dynamically
            const duration = card.querySelector('[data-field="duration"]');
            const perksContainer = card.querySelector('[data-field="perks"]');
            const dates = card.querySelector('[data-field="dates"]');
            const faceValueElement = card.querySelector('[data-field="face-value"]');
            const price = card.querySelector('[data-field="price"]');
            const bookBtn = card.querySelector('[data-field="book-btn"]');
            
            if (duration) {
                duration.textContent = `${nights} ${nights === 1 ? 'Night' : 'Nights'}`;
            }
            
            if (perksContainer) {
                perksContainer.innerHTML = perksDisplay;
            }
            
            if (dates) {
                dates.textContent = `${this.formatDateForDisplay(checkInDate)} - ${this.formatDateForDisplay(checkOutDateStr)}`;
            }
            
            if (faceValueElement) {
                if (faceValue > offer.rate * nights) {
                    faceValueElement.textContent = `Face Value: ${this.formatRate(faceValue)}`;
                    faceValueElement.style.display = 'block';
                } else {
                    faceValueElement.style.display = 'none';
                }
            }
            
            if (price) {
                price.textContent = `Your Price: ${this.formatRate(offer.rate * nights)}`;
            }
            
            if (bookBtn) {
                bookBtn.onclick = () => this.handleBooking(villaName, checkInDate, nights);
            }
            
        } catch (error) {
            console.error('Error updating night selection:', error);
            this.showNotification('Error updating selection. Please try again.', 'error');
        }
        return false;
    }

    /**
     * Handle booking button click
     */
    handleBooking(villaName, checkInDate, nights) {
        console.log(`Booking: ${villaName}, Check-in: ${checkInDate}, Nights: ${nights}`);
        this.showNotification(`Booking ${villaName} for ${nights} night${nights === 1 ? '' : 's'} starting ${this.formatDateForDisplay(checkInDate)}`, 'success');
    }
    
    /**
     * Handle champion offer booking
     */

    
    /**
     * Toggle villa details visibility
     */
    toggleVillaDetails(button) {
        const card = button.closest('.champion-offer-card');
        const collapsibleSection = card.querySelector('.villa-details-collapsible');
        const isExpanded = button.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            button.classList.remove('expanded');
            button.innerHTML = '<i class="fas fa-chevron-down"></i> Show Detailed Offer';
            collapsibleSection.style.display = 'none';
        } else {
            // Expand
            button.classList.add('expanded');
            button.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Details';
            collapsibleSection.style.display = 'block';
        }
    }
    
    /**
     * Handle night selection change in champion offers
     */
    selectChampionNights(cardId, offerId) {
        try {
            event.preventDefault();
            event.stopPropagation();
            
            // Find the selected offer from current champion offers
            const selectedOffer = this.currentOffers.find(offer => offer.offer_id == offerId);
            
            if (!selectedOffer) {
                console.error('Selected champion offer not found:', offerId);
                this.showNotification('Error: Offer not found. Please refresh and try again.', 'error');
                return false;
            }
            
            console.log('Selected champion offer:', selectedOffer);
            
            // Update active button state
            const card = document.querySelector(`[data-card-id="${cardId}"]`);
            if (!card) {
                console.error('Card not found:', cardId);
                return false;
            }
            
            // Remove active class from all buttons in this card
            card.querySelectorAll('.night-selector-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected button
            const selectedBtn = card.querySelector(`[data-offer-id="${offerId}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('active');
            }
            
            // Update the card content dynamically with selected offer data
            const duration = card.querySelector('[data-field="duration"]');
            const perksContainer = card.querySelector('[data-field="perks"]');
            const dates = card.querySelector('[data-field="dates"]');
            const faceValueElement = card.querySelector('[data-field="face-value"]');
            const price = card.querySelector('[data-field="price"]');
            const savingsElement = card.querySelector('[data-field="savings"]');
            const bookBtn = card.querySelector('[data-field="book-btn"]');
            
            // Update duration
            if (duration) {
                duration.textContent = `${selectedOffer.nights} ${selectedOffer.nights === 1 ? 'Night' : 'Nights'}`;
            }
            
            // Update perks display
            if (perksContainer) {
                const perksDisplay = selectedOffer.perks_included ? `
                    <div class="perks-included">
                        <i class="fas fa-gift"></i>
                        <span>${selectedOffer.perks_included}</span>
                    </div>
                ` : '';
                perksContainer.innerHTML = perksDisplay;
            }
            
            // Update dates
            if (dates) {
                dates.textContent = `${this.formatDateForDisplay(selectedOffer.checkIn)} - ${this.formatDateForDisplay(selectedOffer.checkOut)}`;
            }
            
            // Update face value display
            const showFaceValue = selectedOffer.faceValue > selectedOffer.totalRate;
            if (faceValueElement) {
                if (showFaceValue) {
                    faceValueElement.textContent = `Face Value: ${this.formatRate(selectedOffer.faceValue)}`;
                    faceValueElement.style.display = 'block';
                } else {
                    faceValueElement.style.display = 'none';
                }
            }
            
            // Update price
            if (price) {
                price.textContent = `Your Price: ${this.formatRate(selectedOffer.totalRate)}`;
            }
            
            // Update savings display
            if (savingsElement) {
                if (showFaceValue) {
                    savingsElement.textContent = `You Save: ${this.formatRate(selectedOffer.savings)} (${(selectedOffer.savingsPercent * 100).toFixed(1)}%)`;
                    savingsElement.style.display = 'block';
                } else {
                    savingsElement.style.display = 'none';
                }
            }
            
            // Update booking button
            if (bookBtn) {
                bookBtn.setAttribute('data-offer-id', selectedOffer.offer_id);
                bookBtn.onclick = () => this.handleChampionBooking(
                    selectedOffer.offer_id, 
                    selectedOffer.villa_display_name || selectedOffer.villa, 
                    selectedOffer.checkIn.split('T')[0], 
                    selectedOffer.nights
                );
            }
            
            console.log(`Updated champion offer selection: ${selectedOffer.nights} nights, Offer ID ${offerId}`);
            
        } catch (error) {
            console.error('Error selecting champion nights:', error);
            this.showNotification('Error updating selection. Please try again.', 'error');
        }
        return false;
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Global variable for the app instance
let app;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new ActivitiesDashboard();
});

// Global function for description toggle
function toggleDescription(button) {
    const descriptionContainer = button.closest('.villa-description');
    const isExpanded = descriptionContainer.getAttribute('data-expanded') === 'true';
    descriptionContainer.setAttribute('data-expanded', !isExpanded);
    button.textContent = isExpanded ? 'Show more' : 'Show less';
}

// Global functions for guest picker
function toggleGuestDetails() {
    if (app) {
        app.toggleGuestDetails();
    }
}

function changeGuestCount(type, delta) {
    if (app) {
        app.changeGuestCount(type, delta);
    }
}

// Handle window errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
