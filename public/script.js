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
        this.currentFilter = 'tomorrow'; // Default filter
        
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
            filterTomorrow: document.getElementById('filterTomorrow'),
            filter7Days: document.getElementById('filter7Days'),
            filter14Days: document.getElementById('filter14Days')
        };
        
        this.initializeEventListeners();
        this.loadActivities();
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        this.elements.refreshBtn.addEventListener('click', () => this.loadActivities());
        this.elements.healthBtn.addEventListener('click', () => this.checkHealth());
        this.elements.retryBtn.addEventListener('click', () => this.loadActivities());
        
        // Filter button listeners
        this.elements.filterTomorrow.addEventListener('click', () => this.setFilter('tomorrow'));
        this.elements.filter7Days.addEventListener('click', () => this.setFilter('7days'));
        this.elements.filter14Days.addEventListener('click', () => this.setFilter('14days'));
        
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
     * Set filter and update display
     */
    setFilter(filterType) {
        this.currentFilter = filterType;
        
        // Update active button
        document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`[data-filter="${filterType}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Apply filter to current data
        if (this.currentData) {
            this.applyFilter();
        }
    }
    
    /**
     * Apply current filter to the data
     */
    applyFilter() {
        if (!this.currentData) return;
        
        let startDate, endDate;
        const today = this.getBaliDate();
        
        switch (this.currentFilter) {
            case 'tomorrow':
                startDate = this.getBaliDate(1); // Tomorrow
                endDate = startDate;
                break;
            case '7days':
                startDate = this.getBaliDate(1); // Tomorrow
                endDate = this.getBaliDate(7); // 7 days from today
                break;
            case '14days':
                startDate = this.getBaliDate(1); // Tomorrow
                endDate = this.getBaliDate(14); // 14 days from today
                break;
        }
        
        // Filter data: only show records with AvailabilityCount >= 1 and within date range
        this.filteredData = this.currentData.filter(record => {
            // Convert database date (ISO string) to YYYY-MM-DD format for comparison
            const recordDate = record.EntryDate ? record.EntryDate.split('T')[0] : '';
            const hasAvailability = record.AvailabilityCount && parseInt(record.AvailabilityCount) >= 1;
            const inDateRange = recordDate >= startDate && recordDate <= endDate;
            
            return hasAvailability && inDateRange;
        });
        
        // Update display
        if (this.filteredData.length === 0) {
            this.showEmpty();
        } else {
            this.showActivities(this.filteredData);
        }
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
        
        // Create filter description for empty state
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
        
        this.updateStatus('success', `No availability for ${filterDesc}`);
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
            
            // Apply current filter to the new data
            this.applyFilter();
            
        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError(this.getErrorMessage(error));
        }
    }
    
    /**
     * Show activities data
     */
    showActivities(activities) {
        this.isLoading = false;
        this.hideAllStates();
        
        // Update count
        this.elements.activitiesCount.textContent = `${activities.length} villas`;
        
        // Generate table headers dynamically from first record
        if (activities.length > 0) {
            this.generateTableHeaders(activities[0]);
            this.populateTableData(activities);
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
     * Generate table headers dynamically
     */
    generateTableHeaders(sampleRecord) {
        const headers = Object.keys(sampleRecord);
        this.elements.tableHeaders.innerHTML = '';
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = this.formatHeaderName(header);
            this.elements.tableHeaders.appendChild(th);
        });
    }
    
    /**
     * Format header names for display
     */
    formatHeaderName(header) {
        return header
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
    
    /**
     * Populate table with data
     */
    populateTableData(activities) {
        this.elements.activitiesTableBody.innerHTML = '';
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            
            Object.entries(activity).forEach(([key, value]) => {
                const cell = document.createElement('td');
                cell.innerHTML = this.formatCellValue(key, value);
                cell.className = this.getCellClass(key, value);
                row.appendChild(cell);
            });
            
            this.elements.activitiesTableBody.appendChild(row);
        });
    }
    
    /**
     * Format cell values for display
     */
    formatCellValue(key, value) {
        if (value === null || value === undefined) {
            return '<em style="color: #999;">null</em>';
        }
        
        // Handle different data types
        if (key.toLowerCase().includes('id')) {
            return `<strong>${value}</strong>`;
        }
        
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
            if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
                return new Date(value).toLocaleString();
            }
        }
        
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        
        if (typeof value === 'boolean') {
            return value ? '<i class="fas fa-check" style="color: #4CAF50;"></i>' : '<i class="fas fa-times" style="color: #f44336;"></i>';
        }
        
        if (typeof value === 'string' && value.length > 100) {
            return `<span title="${this.escapeHtml(value)}">${this.escapeHtml(value.substring(0, 100))}...</span>`;
        }
        
        return this.escapeHtml(String(value));
    }
    
    /**
     * Get CSS class for cell based on content
     */
    getCellClass(key, value) {
        if (key.toLowerCase().includes('id')) {
            return 'cell-id';
        }
        
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
            return 'cell-timestamp';
        }
        
        if (typeof value === 'number') {
            return 'cell-number';
        }
        
        return 'cell-text';
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
