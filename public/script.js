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
            activitiesContainer: document.getElementById('activitiesContainer'),
            activitiesCount: document.getElementById('activitiesCount'),
            tableHeaders: document.getElementById('tableHeaders'),
            activitiesTableBody: document.getElementById('activitiesTableBody'),
            dateFilter1: document.getElementById('dateFilter1'),
            dateFilter2: document.getElementById('dateFilter2'),
            dateFilter3: document.getElementById('dateFilter3'),
            dateFilter4: document.getElementById('dateFilter4'),
            customDateSlider: document.getElementById('customDateSlider'),
            dateRange: document.getElementById('dateRange'),
            selectedDate: document.getElementById('selectedDate'),
            dayOfWeek: document.getElementById('dayOfWeek')
        };
        
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
        
        // Custom date slider listener
        this.elements.dateRange.addEventListener('input', (e) => this.handleSliderChange(e.target.value));
        
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
        this.updateSliderDisplay(1);
    }

    /**
     * Handle slider change
     */
    handleSliderChange(value) {
        this.updateSliderDisplay(parseInt(value));
        
        // Apply single date filter - create date string directly
        const targetDate = new Date();
        const baliTime = new Date(targetDate.getTime() + (8 * 60 * 60 * 1000));
        baliTime.setDate(baliTime.getDate() + parseInt(value));
        
        const dateStr = baliTime.toISOString().split('T')[0];
        this.currentDateRange = [dateStr, dateStr];
        this.applyDateFilter([dateStr, dateStr]);
    }

    /**
     * Update slider display text
     */
    updateSliderDisplay(dayOffset) {
        const targetDate = new Date();
        const baliTime = new Date(targetDate.getTime() + (8 * 60 * 60 * 1000));
        baliTime.setDate(baliTime.getDate() + dayOffset);
        
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const dateStr = baliTime.toLocaleDateString('en-US', options);
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[baliTime.getDay()];
        
        this.elements.selectedDate.textContent = dayOffset === 1 ? 'Tomorrow' : dateStr;
        this.elements.dayOfWeek.textContent = dayName;
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
        this.elements.activitiesContainer.style.display = 'none';
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
            
            const response = await fetch(`${this.apiBaseUrl}/activities`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            if (!data.success) {
                throw new Error(data.message || 'API returned unsuccessful response');
            }
            
            this.currentData = data.data;
            
            // Apply the default filter (filter1) to the new data
            if (this.elements.dateFilter1 && this.elements.dateFilter1.dataset.dateRange && this.elements.dateFilter1.dataset.dateRange !== 'custom') {
                try {
                    const defaultDateRange = JSON.parse(this.elements.dateFilter1.dataset.dateRange);
                    this.currentDateRange = defaultDateRange;
                    this.applyDateFilter(defaultDateRange);
                } catch (error) {
                    console.error('Error parsing default date range:', error);
                    // Fallback: show all data
                    this.displayActivities(this.currentData);
                }
            } else {
                // Fallback: show all data
                this.displayActivities(this.currentData);
            }
            
        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError(this.getErrorMessage(error));
        }
    }
    
    /**
     * Display activities data (new method name)
     */
    displayActivities(activities) {
        this.isLoading = false;
        this.hideAllStates();
        
        // Update count
        this.elements.activitiesCount.textContent = `${activities.length} villas`;
        
        // Generate table headers and data
        if (activities.length > 0) {
            this.generateCustomTableHeaders();
            this.populateCustomTableData(activities);
        }
        
        this.elements.activitiesContainer.style.display = 'block';
        this.elements.refreshBtn.disabled = false;
        
        // Remove spinning animation
        const refreshIcon = this.elements.refreshBtn.querySelector('i');
        refreshIcon.classList.remove('fa-spin');
        
        // Create filter description
        let filterDesc = '';
        switch (this.currentFilter) {
            case 'tomorrow':
                filterDesc = 'tomorrow';
                break;
            case '7days':
                filterDesc = 'next 7 days';
                break;
            case '14days':
                filterDesc = 'next 14 days';
                break;
        }
        
        this.updateStatus('success', `${activities.length} villas available for ${filterDesc}`);
        this.updateLastUpdated();
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
