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
            offersContainer: document.getElementById('offersContainer'),
            offersCount: document.getElementById('offersCount'),
            villaCards: document.getElementById('villaCards'),
            calendarGrid: document.getElementById('calendarGrid'),
            adultsCount: document.getElementById('adultsCount'),
            childrenCount: document.getElementById('childrenCount'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            loadMoreContainer: document.getElementById('loadMoreContainer'),
            loadMoreCount: document.getElementById('loadMoreCount')
        };
        
        // Calendar properties
        this.selectedCheckIn = null;
        this.selectedCheckOut = null;
        this.calendarDates = [];
        
        // Guest count properties
        this.selectedAdults = 2; // Default to 2 adults
        this.selectedChildren = 0; // Default to no children
        
        // Pagination properties
        this.currentOffset = 0;
        this.hasMoreOffers = false;
        
        this.initializeEventListeners();
        this.setupCalendar();
        this.setupMobileGuestSelectors();
        this.loadActivities();
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        this.elements.retryBtn.addEventListener('click', () => this.loadActivities());
        
        // Guest count listeners
        this.elements.adultsCount.addEventListener('change', () => this.handleGuestCountChange());
        this.elements.childrenCount.addEventListener('change', () => this.handleGuestCountChange());
        
        // Load more button listener
        this.elements.loadMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.loadMoreOffers();
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
        const today = new Date();
        const baliTime = new Date(today.getTime() + (8 * 60 * 60 * 1000)); // Convert to Bali time (UTC+8)
        
        this.renderCalendar();
    }
    
    /**
     * Render calendar grid with proper week alignment
     */
    renderCalendar() {
        // Clear existing day cells (keep headers)
        const existingDays = this.elements.calendarGrid.querySelectorAll('.calendar-date');
        existingDays.forEach(day => day.remove());

        const today = new Date();
        const baliTime = new Date(today.getTime() + (8 * 60 * 60 * 1000));

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
        this.currentOffset = 0; // Reset pagination
        this.hasMoreOffers = false;
        this.loadActivities();
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
        this.selectedAdults = parseInt(this.elements.adultsCount.value);
        this.selectedChildren = parseInt(this.elements.childrenCount.value);
        
        console.log(`Guest count changed: ${this.selectedAdults} adults, ${this.selectedChildren} children`);
        
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
    async loadActivities(silent = false, loadMore = false) {
        try {
            // Reset offset if not loading more
            if (!loadMore) {
                this.currentOffset = 0;
            }
            
            this.showLoading(silent);
            
            // Build query parameters based on current selections
            const queryParams = this.buildQueryParameters();
            // Add pagination parameters
            const paginationParams = `&offset=${this.currentOffset}&limit=3`;
            const url = `${this.apiBaseUrl}/activities?${queryParams}${paginationParams}`;
            
            console.log('Fetching champion offers from:', url);
            const response = await fetch(url);
            console.log('Response status:', response.status, response.statusText);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            if (!data.success) {
                throw new Error(data.message || 'API returned unsuccessful response');
            }
            
            // Handle pagination
            this.hasMoreOffers = data.pagination?.hasMore || false;
            
            // Update data based on whether we're loading more or starting fresh
            if (loadMore) {
                // Append new data to existing
                this.currentData = [...(this.currentData || []), ...data.data];
            } else {
                // Replace with fresh data
                this.currentData = data.data;
            }
            
            console.log(`Received ${data.count} champion offers:`, data.query_params);
            
            // Display the pre-calculated champion offers directly
            await this.displayActivities(this.currentData);
            
        } catch (error) {
            console.error('Error loading champion offers:', error);
            this.showError(this.getErrorMessage(error));
        }
    }
    
    /**
     * Load more offers (pagination)
     */
    async loadMoreOffers() {
        if (!this.hasMoreOffers || this.isLoading) {
            return;
        }
        
        // Store current scroll position
        const currentScrollY = window.scrollY;
        
        // Show loading state on button
        const loadMoreBtn = this.elements.loadMoreBtn;
        const originalText = loadMoreBtn.innerHTML;
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        try {
            // Increment offset by 3 (limit)
            this.currentOffset += 3;
            
            // Load more offers without resetting existing data
            await this.loadActivities(true, true); // Silent loading to prevent UI jump
            
            // Small delay to ensure content is rendered, then restore scroll
            setTimeout(() => {
                window.scrollTo(0, currentScrollY);
            }, 100);
            
        } catch (error) {
            console.error('Error loading more offers:', error);
            // Reset offset on error
            this.currentOffset -= 3;
        } finally {
            // Restore button state
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = originalText;
        }
    }
    
    /**
     * Update Load More button visibility and state
     */
    updateLoadMoreButton() {
        if (this.hasMoreOffers) {
            this.elements.loadMoreContainer.style.display = 'block';
            this.elements.loadMoreBtn.disabled = false;
            this.elements.loadMoreCount.textContent = '(3 more)';
        } else {
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
        if (this.currentDateRange && Array.isArray(this.currentDateRange)) {
            const [startDate, endDate] = this.currentDateRange;
            const startStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
            const endStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
            
            params.append('startDate', startStr);
            params.append('endDate', endStr);
        }
        // If no date range specified, API will use default (tomorrow + 7 days)
        
        return params.toString();
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
    async displayActivities(championOffers) {
        this.isLoading = false;
        this.hideAllStates();
        
        console.log('Displaying champion offers:', championOffers);
        
        // Transform champion offers to match expected format
        const offers = this.transformChampionOffers(championOffers);
        
        // Store current offers for night selection functionality
        this.currentOffers = offers;
        
        // Count updated but not displayed
        
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
        return championOffers.map(championOffer => {
            // Calculate check-out date
            const checkInDate = new Date(championOffer.EntryDate);
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkInDate.getDate() + championOffer.nights);
            
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
                
                // LMCurrentOffers specific
                offer_id: championOffer.offer_id,
                attractiveness_score: championOffer.attractiveness_score,
                perks_included: championOffer.perks_included,
                perk_ids: championOffer.perk_ids || [],
                has_wow_factor: championOffer.has_wow_factor_perk
            };
        });
    }

    /**
     * Generate champion villa cards with night selectors (grouped by villa/date)
     */
    async generateChampionCards(offers) {
        console.log('Generating champion cards for', offers.length, 'offers');
        
        // Group offers by villa and checkin date
        const villaDateGroups = this.groupChampionOffersByVillaAndDate(offers);
        
        const villaCardsHtml = await Promise.all(
            Object.keys(villaDateGroups).map(async villaKey => {
                const dateGroups = villaDateGroups[villaKey];
                const firstOffer = Object.values(dateGroups)[0][0]; // Get first offer for villa details
                
                return await this.generateChampionVillaCardWithNights(villaKey, firstOffer, dateGroups);
            })
        );
        
        // For load more, append to existing content instead of replacing
        if (this.currentOffset > 0) {
            // Append new cards to existing ones
            this.elements.villaCards.insertAdjacentHTML('beforeend', villaCardsHtml.join(''));
        } else {
            // Replace all content for fresh load
            this.elements.villaCards.innerHTML = villaCardsHtml.join('');
        }
        
        // Show or hide Load More button
        this.updateLoadMoreButton();
    }
    
    /**
     * Group champion offers by villa name and checkin date
     */
    groupChampionOffersByVillaAndDate(offers) {
        const groups = {};
        
        offers.forEach(offer => {
            const villaKey = offer.villa_display_name || offer.villa;
            const checkinDate = offer.checkIn.split('T')[0]; // Normalize date format
            
            if (!groups[villaKey]) {
                groups[villaKey] = {};
            }
            
            if (!groups[villaKey][checkinDate]) {
                groups[villaKey][checkinDate] = [];
            }
            
            groups[villaKey][checkinDate].push(offer);
        });
        
        // Sort offers within each checkin date by nights ascending and store best attractiveness_score
        Object.keys(groups).forEach(villa => {
            Object.keys(groups[villa]).forEach(checkinDate => {
                groups[villa][checkinDate].sort((a, b) => a.nights - b.nights);
            });
        });
        
        return groups;
    }
    
    /**
     * Generate champion villa card with night selectors for multiple checkin dates
     */
    async generateChampionVillaCardWithNights(villaKey, villaDetails, dateGroups) {
        const tagline = villaDetails.tagline || villaDetails.villa_display_name || villaKey;
        const description = villaDetails.description || this.getVillaDescription(villaKey);
        const imageUrls = this.parseImageUrls(villaDetails.image_urls);
        const specifications = this.formatVillaSpecs(villaDetails);
        
        // Generate booking sections for each checkin date with night selectors
        const checkinSections = await Promise.all(
            Object.keys(dateGroups)
                .sort() // Sort dates chronologically
                .map(async checkinDate => {
                    const nightOptions = dateGroups[checkinDate];
                    
                    // Find the option with highest attractiveness_score as default
                    const defaultOffer = nightOptions.reduce((best, current) => 
                        current.attractiveness_score > best.attractiveness_score ? current : best
                    );
                    
                    // Create unique card ID
                    const cardId = `${villaKey.replace(/\s+/g, '')}-${checkinDate}`;
                    
                    // Format check-in date display
                    const checkInDateObj = new Date(checkinDate + 'T00:00:00');
                    const checkinDay = this.getDayOfWeek(checkInDateObj);
                    const daysFromNow = this.calculateDaysFromNow(checkInDateObj);
                    
                    // Create night selector buttons
                    const nightSelector = nightOptions.map(offer => {
                        const isActive = offer.offer_id === defaultOffer.offer_id;
                        return `<button class="night-selector-btn ${isActive ? 'active' : ''}" 
                                       data-nights="${offer.nights}" 
                                       data-offer-id="${offer.offer_id}"
                                       data-card-id="${cardId}"
                                       onclick="app.selectChampionNights('${cardId}', '${offer.offer_id}'); return false;">
                                    ${offer.nights === 1 ? '①' : offer.nights === 2 ? '②' : offer.nights === 3 ? '③' : '④'}
                                </button>`;
                    }).join('');
                    
                    // Format default offer details
                    const perksDisplay = defaultOffer.perks_included ? `
                        <div class="perks-included">
                            <i class="fas fa-gift"></i>
                            <span>${defaultOffer.perks_included}</span>
                        </div>
                    ` : '';
                    
                    const showFaceValue = defaultOffer.faceValue > defaultOffer.totalRate;
                    const faceValueDisplay = showFaceValue ? `
                        <div class="face-value-crossed" data-field="face-value">
                            Face Value: ${this.formatRate(defaultOffer.faceValue)}
                        </div>
                    ` : '';
                    
                    const savingsDisplay = showFaceValue ? `
                        <div class="savings-highlight" data-field="savings">
                            You Save: ${this.formatRate(defaultOffer.savings)} (${(defaultOffer.savingsPercent * 100).toFixed(1)}%)
                        </div>
                    ` : '';
                    
                    return `
                        <div class="checkin-group champion-checkin-group" data-card-id="${cardId}">
                            <div class="checkin-date-header">
                                Check-in: ${checkinDay}, ${this.formatDateForDisplay(checkinDate)}${daysFromNow}
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
                                            ${perksDisplay}
                                        </div>
                                        <div class="booking-dates" data-field="dates">
                                            ${this.formatDateForDisplay(checkinDate)} - ${this.formatDateForDisplay(defaultOffer.checkOut)}
                                        </div>
                                    </div>
                                    <div class="booking-price">
                                        ${faceValueDisplay}
                                        <div class="rate" data-field="price">Your Price: ${this.formatRate(defaultOffer.totalRate)}</div>
                                        ${savingsDisplay}
                                    </div>
                                    <button class="book-btn champion-book-btn" data-field="book-btn" 
                                            data-offer-id="${defaultOffer.offer_id}"
                                            onclick="app.handleChampionBooking('${defaultOffer.offer_id}', '${villaKey}', '${checkinDate}', ${defaultOffer.nights})">
                                        Book Champion Offer
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                })
        );
        
        return `
            <div class="villa-card champion-offer">
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
                    
                    ${specifications ? `
                        <div class="villa-specifications">
                            ${specifications}
                        </div>
                    ` : ''}
                    
                    <div class="villa-description">
                        <p>${this.truncateText(description, 150)}</p>
                        ${this.formatKeyAmenities(villaDetails.key_amenities)}
                    </div>
                    
                    <div class="villa-details">
                        <div class="villa-detail-item">
                            <i class="fas fa-users"></i>
                            <span>${villaDetails.maxGuests} Guests</span>
                        </div>
                        <div class="villa-detail-item">
                            <i class="fas fa-bed"></i>
                            <span>${villaDetails.bedrooms || 'N/A'} Bedrooms</span>
                        </div>
                        <div class="villa-detail-item">
                            <i class="fas fa-swimming-pool"></i>
                            <span>${villaDetails.pool_type || 'Private Pool'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="villa-booking-options">
                    <div class="booking-section-title">Champion Offer Options:</div>
                    ${checkinSections.join('')}
                </div>
            </div>
        `;
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
    handleChampionBooking(offerId, villaName, checkInDate, nights) {
        console.log(`Champion booking action: Offer ID ${offerId}, ${villaName}: ${nights} nights starting ${checkInDate}`);
        this.showNotification(`Champion Offer Booking! Offer ID: ${offerId}, Villa: ${villaName}, ${nights} nights starting ${this.formatDateForDisplay(checkInDate)}`, 'success');
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

// Handle window errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
