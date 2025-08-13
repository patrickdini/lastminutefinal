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
            refreshBtn: document.getElementById('refreshBtn'),
            healthBtn: document.getElementById('healthBtn'),
            retryBtn: document.getElementById('retryBtn'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            lastUpdated: document.getElementById('lastUpdated'),
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
        this.loadActivities();
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        this.elements.refreshBtn.addEventListener('click', () => this.loadActivities());
        this.elements.healthBtn.addEventListener('click', () => this.checkHealth());
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
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            if (!this.isLoading) {
                this.loadActivities(true); // Silent refresh
            }
        }, 30000);
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
        
        // Calculate upcoming weekend from tomorrow onwards
        const nextSaturday = new Date(tomorrow);
        const daysUntilSaturday = (6 - tomorrow.getDay() + 7) % 7;
        if (daysUntilSaturday === 0) { // Tomorrow is Saturday
            // Use tomorrow as Saturday
        } else {
            nextSaturday.setDate(tomorrow.getDate() + daysUntilSaturday);
        }
        
        const nextSunday = new Date(nextSaturday);
        nextSunday.setDate(nextSaturday.getDate() + 1);
        
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
                subtitle: this.formatDateRange(nextSaturday, nextSunday),
                icon: 'fas fa-calendar-alt',
                dateRange: [nextSaturday, nextSunday]
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
     * Get weekend date range starting from tomorrow onwards
     */
    getWeekendRange(currentDate) {
        // Start from tomorrow
        const tomorrow = new Date(currentDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const saturday = new Date(tomorrow);
        const sunday = new Date(tomorrow);
        
        const tomorrowDay = tomorrow.getDay();
        const daysUntilSaturday = (6 - tomorrowDay + 7) % 7;
        
        if (daysUntilSaturday === 0) { // Tomorrow is Saturday
            sunday.setDate(tomorrow.getDate() + 1);
            return [tomorrow, sunday];
        } else if (tomorrowDay === 0) { // Tomorrow is Sunday
            saturday.setDate(tomorrow.getDate() - 1);
            return [saturday, tomorrow];
        } else { // Weekday - get upcoming weekend
            saturday.setDate(tomorrow.getDate() + daysUntilSaturday);
            sunday.setDate(saturday.getDate() + 1);
            return [saturday, sunday];
        }
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
        
        // Filter the data
        this.filteredData = this.currentData.filter(activity => {
            const activityDate = activity.EntryDate.split('T')[0]; // Extract date part only
            return activityDate >= startStr && activityDate <= endStr;
        });
        
        this.displayActivities(this.filteredData);
    }
    

    
    /**
     * Update status indicator
     */
    updateStatus(status, message) {
        const statusDot = this.elements.statusIndicator.querySelector('.status-dot');
        statusDot.className = `status-dot ${status}`;
        this.elements.statusText.textContent = message;
    }
    
    /**
     * Update last updated timestamp
     */
    updateLastUpdated() {
        const now = new Date();
        this.elements.lastUpdated.textContent = `Last updated: ${now.toLocaleString()}`;
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
        
        this.elements.refreshBtn.disabled = true;
        this.updateStatus('loading', 'Loading...');
        
        // Add spinning animation to refresh button
        const refreshIcon = this.elements.refreshBtn.querySelector('i');
        refreshIcon.classList.add('fa-spin');
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
        this.elements.refreshBtn.disabled = false;
        
        // Remove spinning animation
        const refreshIcon = this.elements.refreshBtn.querySelector('i');
        refreshIcon.classList.remove('fa-spin');
        
        this.updateStatus('error', 'Error occurred');
    }
    
    /**
     * Show empty state
     */
    showEmpty() {
        this.isLoading = false;
        this.hideAllStates();
        this.elements.emptyState.style.display = 'block';
        this.elements.refreshBtn.disabled = false;
        
        // Remove spinning animation
        const refreshIcon = this.elements.refreshBtn.querySelector('i');
        refreshIcon.classList.remove('fa-spin');
        
        this.updateStatus('success', 'No availability for selected dates');
        this.updateLastUpdated();
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
            this.displayActivities(this.currentData);
            
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
        
        // Use existing filtered data if available from date filter, otherwise apply default filter
        let workingData = data;
        let dateRangeDesc = "all data";
        
        if (this.filteredData && this.filteredData.length > 0) {
            workingData = this.filteredData;
            dateRangeDesc = "filtered date range";
        } else if (this.currentDateRange && Array.isArray(this.currentDateRange)) {
            // Apply the current date range filter
            const [startDate, endDate] = this.currentDateRange;
            const startStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
            const endStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
            
            workingData = data.filter(record => {
                const activityDate = record.EntryDate.split('T')[0];
                return activityDate >= startStr && activityDate <= endStr;
            });
            dateRangeDesc = `${startStr} to ${endStr}`;
        } else {
            // Default to next 7 days from tomorrow
            const today = new Date();
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            const weekLater = new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const startStr = tomorrow.toISOString().split('T')[0];
            const endStr = weekLater.toISOString().split('T')[0];
            
            workingData = data.filter(record => {
                const activityDate = record.EntryDate.split('T')[0];
                return activityDate >= startStr && activityDate <= endStr;
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
                    checkInDateObj.setDate(checkInDateObj.getDate() + nights);
                    const checkOutDateStr = checkInDateObj.toISOString().split('T')[0];
                    
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
                        pool: checkInRecord.Pool,
                        totalRate: checkInRecord.LowestRateAmount * nights
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
    displayActivities(activities) {
        this.isLoading = false;
        this.hideAllStates();
        
        // Generate offers from activities data
        const offers = this.generateOffersFromData(activities);
        
        // Update count
        this.elements.offersCount.textContent = `${offers.length} offers`;
        
        // Generate villa cards
        if (offers.length > 0) {
            this.generateVillaCards(offers);
        }
        
        this.elements.offersContainer.style.display = 'block';
        this.elements.refreshBtn.disabled = false;
        
        // Remove spinning animation
        const refreshIcon = this.elements.refreshBtn.querySelector('i');
        refreshIcon.classList.remove('fa-spin');
        
        this.updateStatus('success', `${offers.length} offers available`);
        this.updateLastUpdated();
    }

    /**
     * Generate villa cards from offers
     */
    generateVillaCards(offers) {
        // Group offers by villa, then by check-in date
        const villaGroups = this.groupOffersByVillaAndDate(offers);
        
        this.elements.villaCards.innerHTML = Object.keys(villaGroups)
            .map(villaName => {
                const villaOffers = villaGroups[villaName];
                const firstOffer = Object.values(villaOffers)[0][0]; // Get first offer for villa details
                
                return this.generateVillaCard(villaName, firstOffer, villaOffers);
            }).join('');
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
    generateVillaCard(villaName, villaDetails, villaOffers) {
        const villaClass = villaDetails.villaClass || '';
        const villaDescription = this.getVillaDescription(villaName);
        
        // Generate check-in date groups
        const checkinGroups = Object.keys(villaOffers)
            .sort() // Sort dates chronologically
            .map(checkInDate => {
                const dateOffers = villaOffers[checkInDate];
                const checkinDay = this.getDayOfWeek(new Date(checkInDate + 'T00:00:00'));
                
                return `
                    <div class="checkin-group">
                        <div class="checkin-date-header">
                            Check-in: ${checkinDay}, ${this.formatDateForDisplay(checkInDate)}
                        </div>
                        <div class="booking-options">
                            ${dateOffers.map(offer => `
                                <div class="booking-option">
                                    <div class="booking-info">
                                        <div class="booking-duration">
                                            ${offer.nights} ${offer.nights === 1 ? 'Night' : 'Nights'}
                                        </div>
                                        <div class="booking-dates">
                                            ${this.formatDateForDisplay(offer.checkIn)} - ${this.formatDateForDisplay(offer.checkOut)}
                                        </div>
                                    </div>
                                    <div class="booking-price">
                                        <div class="rate">${this.formatRate(offer.rate)}</div>
                                    </div>
                                    <button class="book-btn" onclick="app.handleBooking('${villaName}', '${offer.checkIn}', ${offer.nights})">
                                        Book
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        
        return `
            <div class="villa-card">
                <div class="villa-card-header">
                    ${villaClass ? `<div class="villa-class-badge">${villaClass}</div>` : ''}
                    <div class="villa-name">${villaName}</div>
                    <div class="villa-subtitle">${villaName} - ${villaClass} Retreat</div>
                    <div class="villa-description">${villaDescription}</div>
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
                    ${checkinGroups}
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
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    /**
     * Get day of week from date
     */
    getDayOfWeek(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
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
     * Check database health
     */
    async checkHealth() {
        try {
            this.elements.healthBtn.disabled = true;
            const healthIcon = this.elements.healthBtn.querySelector('i');
            healthIcon.classList.add('fa-spin');
            
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            
            if (data.success) {
                this.updateStatus('success', 'Connection excellent');
                this.showNotification('Live connection to villa data confirmed', 'success');
            } else {
                this.updateStatus('error', 'Connection issue');
                this.showNotification(`Connection check failed: ${data.message}`, 'error');
            }
            
        } catch (error) {
            console.error('Health check error:', error);
            this.updateStatus('error', 'Health check failed');
            this.showNotification('Failed to check database health', 'error');
        } finally {
            this.elements.healthBtn.disabled = false;
            const healthIcon = this.elements.healthBtn.querySelector('i');
            healthIcon.classList.remove('fa-spin');
        }
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ActivitiesDashboard();
});

// Handle window errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
