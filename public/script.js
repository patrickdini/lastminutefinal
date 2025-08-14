/**
 * Activities Dashboard JavaScript
 * Handles frontend interactions and API communication
 */

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
            emptyState: document.getElementById('emptyState'),
            offersContainer: document.getElementById('offersContainer'),
            offersCount: document.getElementById('offersCount'),
            villaCards: document.getElementById('villaCards'),
            dateFilter1: document.getElementById('dateFilter1'),
            dateFilter2: document.getElementById('dateFilter2'),
            dateFilter3: document.getElementById('dateFilter3'),
            dateFilter4: document.getElementById('dateFilter4'),
            customDateSlider: document.getElementById('customDateSlider'),
            startDateRange: document.getElementById('startDateRange'),
            endDateRange: document.getElementById('endDateRange'),
            sliderRange: document.getElementById('sliderRange'),
            selectedStartDate: document.getElementById('selectedStartDate'),
            startDayOfWeek: document.getElementById('startDayOfWeek'),
            selectedEndDate: document.getElementById('selectedEndDate'),
            endDayOfWeek: document.getElementById('endDayOfWeek'),
            adultsCount: document.getElementById('adultsCount'),
            childrenCount: document.getElementById('childrenCount')
        };
        
        // Guest count properties
        this.selectedAdults = 2; // Default to 2 adults
        this.selectedChildren = 0; // Default to no children
        
        this.initializeEventListeners();
        this.setupDynamicDateFilters();
        this.setupMobileGuestSelectors();
        this.loadActivities();
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        this.elements.retryBtn.addEventListener('click', () => this.loadActivities());
        
        // Date filter listeners
        this.elements.dateFilter1.addEventListener('click', () => this.handleDateFilterClick('filter1'));
        this.elements.dateFilter2.addEventListener('click', () => this.handleDateFilterClick('filter2'));
        this.elements.dateFilter3.addEventListener('click', () => this.handleDateFilterClick('filter3'));
        this.elements.dateFilter4.addEventListener('click', () => this.handleDateFilterClick('filter4'));
        
        // Custom date slider listeners
        this.elements.startDateRange.addEventListener('input', () => this.handleDualSliderChange());
        this.elements.endDateRange.addEventListener('input', () => this.handleDualSliderChange());
        
        // Guest count listeners
        this.elements.adultsCount.addEventListener('change', () => this.handleGuestCountChange());
        this.elements.childrenCount.addEventListener('change', () => this.handleGuestCountChange());
        
        // Auto-refresh every 5 minutes (reduced frequency)
        setInterval(() => {
            if (!this.isLoading) {
                this.loadActivities(true); // Silent refresh
            }
        }, 300000);
    }
    
    /**
     * Get current date in Bali time zone (UTC+8)
     */
    getBaliDate(offsetDays = 0) {
        const now = new Date();
        // Convert to Bali time (UTC+8)
        const baliTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        baliTime.setDate(baliTime.getDate() + offsetDays);
        return baliTime.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }

    /**
     * Get current day of week in Bali time (0 = Sunday, 1 = Monday, etc.)
     */
    getBaliDayOfWeek() {
        const now = new Date();
        const baliTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        return baliTime.getDay();
    }

    /**
     * Setup dynamic date filters based on current day of week
     */
    setupDynamicDateFilters() {
        const dayOfWeek = this.getBaliDayOfWeek(); // 0 = Sunday, 1 = Monday, etc.
        const today = new Date();
        const baliTime = new Date(today.getTime() + (8 * 60 * 60 * 1000));
        
        // Determine filter configuration based on day of week
        let filters;
        if ([1, 2, 3, 6, 0].includes(dayOfWeek)) { // Mon, Tue, Wed, Sat, Sun
            filters = this.getWeekdayFilters(baliTime);
        } else { // Thu, Fri
            filters = this.getThurFriFilters(baliTime);
        }
        
        // Update filter boxes
        this.updateFilterBoxes(filters);
        
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
        
        const nextWeekendSaturday = new Date(nextWeekEnd);
        nextWeekendSaturday.setDate(nextWeekEnd.getDate() + 1);
        
        const nextWeekendSunday = new Date(nextWeekendSaturday);
        nextWeekendSunday.setDate(nextWeekendSaturday.getDate() + 1);
        
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
                subtitle: this.formatDateRange(nextWeekendSaturday, nextWeekendSunday),
                icon: 'fas fa-calendar-week',
                dateRange: [nextWeekendSaturday, nextWeekendSunday]
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
        this.selectedAdults = parseInt(this.elements.adultsCount.value);
        this.selectedChildren = parseInt(this.elements.childrenCount.value);
        
        console.log(`Guest count changed: ${this.selectedAdults} adults, ${this.selectedChildren} children`);
        
        // Re-filter the current data with new guest requirements
        if (this.currentData) {
            if (this.filteredData && this.filteredData.length > 0) {
                this.displayActivities(this.filteredData);
            } else {
                this.displayActivities(this.currentData);
            }
        }
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
     * Apply date filter to current data
     */
    applyDateFilter(dateRange) {
        if (!this.currentData) return;
        
        // If dateRange is already string format [startStr, endStr], use directly
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
                this.displayActivities(this.currentData);
                return;
            }
        } else {
            console.error('Invalid dateRange format:', dateRange);
            this.displayActivities(this.currentData);
            return;
        }
        
        // Store the filter range for use in generateOffersFromData
        this.currentDateRange = [startStr, endStr];
        
        // Display activities - let generateOffersFromData handle the filtering
        this.displayActivities(this.currentData);
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
        this.elements.emptyState.style.display = 'none';
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
     * Show empty state
     */
    showEmpty() {
        this.isLoading = false;
        this.hideAllStates();
        this.elements.emptyState.style.display = 'block';
        

    }
    
    /**
     * Load activities from API
     */
    async loadActivities(silent = false) {
        try {
            this.showLoading(silent);
            
            console.log('Fetching from:', `${this.apiBaseUrl}/activities`);
            const response = await fetch(`${this.apiBaseUrl}/activities`);
            console.log('Response status:', response.status, response.statusText);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            if (!data.success) {
                throw new Error(data.message || 'API returned unsuccessful response');
            }
            
            this.currentData = data.data;
            
            // Show all data initially - filters will be applied when user clicks them
            await this.displayActivities(this.currentData);
            
        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError(this.getErrorMessage(error));
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
                for (let nights = 1; nights <= maxNights; nights++) {
                    const checkInDateObj = new Date(checkInDate);
                    const checkOutDateObj = new Date(checkInDateObj);
                    checkOutDateObj.setDate(checkInDateObj.getDate() + nights);
                    const checkOutDateStr = checkOutDateObj.toISOString().split('T')[0];
                    
                    // No need to check date range again - workingData is already filtered
                    
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
                }
            });
        });

        // Sort offers by check-in date, then by villa name, then by nights
        return offers.sort((a, b) => {
            const dateCompare = new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
            if (dateCompare !== 0) return dateCompare;
            
            const villaCompare = a.villa.localeCompare(b.villa);
            if (villaCompare !== 0) return villaCompare;
            
            return a.nights - b.nights;
        });
    }

    /**
     * Display offers data
     */
    async displayActivities(activities) {
        this.isLoading = false;
        this.hideAllStates();
        
        // Generate offers from activities data
        const offers = this.generateOffersFromData(activities);
        
        // Update count
        this.elements.offersCount.textContent = `${offers.length} offers`;
        
        // Generate villa cards
        if (offers.length > 0) {
            await this.generateVillaCards(offers);
        }
        
        this.elements.offersContainer.style.display = 'block';
        

    }

    /**
     * Generate villa cards from offers
     */
    async generateVillaCards(offers) {
        // Group offers by villa, then by check-in date
        const villaGroups = this.groupOffersByVillaAndDate(offers);
        
        const villaCardsHtml = await Promise.all(
            Object.keys(villaGroups).map(async villaName => {
                const villaOffers = villaGroups[villaName];
                const firstOffer = Object.values(villaOffers)[0][0]; // Get first offer for villa details
                
                return await this.generateVillaCard(villaName, firstOffer, villaOffers);
            })
        );
        
        this.elements.villaCards.innerHTML = villaCardsHtml.join('');
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
                    
                    // Create night selector buttons
                    const nightSelector = dateOffers.map(offer => {
                        const isActive = offer.nights === defaultOffer.nights;
                        return `<button class="night-selector-btn ${isActive ? 'active' : ''}" 
                                       data-nights="${offer.nights}" 
                                       data-card-id="${cardId}"
                                       onclick="app.selectNights('${cardId}', ${offer.nights}, '${villaName}', '${checkInDate}')">
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
        
        // Calculate difference in days
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
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
            const offer = villaOffers.find(o => 
                o.villa === villaName && 
                o.checkIn.split('T')[0] === checkInDate.split('T')[0] && 
                o.nights === nights
            );
            
            if (!offer) {
                console.error('Offer not found for', villaName, checkInDate, nights);
                return;
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
        }
    }

    /**
     * Handle booking button click
     */
    handleBooking(villaName, checkInDate, nights) {
        console.log(`Booking: ${villaName}, Check-in: ${checkInDate}, Nights: ${nights}`);
        this.showNotification(`Booking ${villaName} for ${nights} night${nights === 1 ? '' : 's'} starting ${this.formatDateForDisplay(checkInDate)}`, 'success');
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

// Handle window errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
