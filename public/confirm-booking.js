/**
 * Confirm Booking Page JavaScript
 * Handles booking confirmation form and data display
 */

class ConfirmBooking {
    constructor() {
        this.bookingData = null;
        this.formData = {};
        
        this.elements = {
            bookingSummary: document.getElementById('bookingSummary'),
            bookingForm: document.getElementById('bookingForm'),
            errorMessage: document.getElementById('errorMessage'),
            transfer: document.getElementById('transfer'),
            transferDetails: document.getElementById('transferDetails'),
            privateBoat: document.getElementById('privateBoat')
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the booking confirmation page
     */
    initialize() {
        // Load booking data from sessionStorage
        this.loadBookingData();
        
        if (this.bookingData) {
            this.displayBookingSummary();
            this.setupFormListeners();
        } else {
            this.showError();
        }
    }
    
    /**
     * Load booking data from sessionStorage
     */
    loadBookingData() {
        try {
            const data = sessionStorage.getItem('bookingData');
            if (data) {
                this.bookingData = JSON.parse(data);
                console.log('Loaded booking data:', this.bookingData);
            } else {
                console.log('No booking data found in sessionStorage');
            }
        } catch (error) {
            console.error('Error loading booking data:', error);
        }
    }
    
    /**
     * Display the booking summary with villa details
     */
    displayBookingSummary() {
        if (!this.bookingData) return;
        
        const {
            villaDisplayName,
            tagline,
            checkIn,
            checkOut,
            nights,
            adults,
            children,
            totalGuests,
            rate,
            totalRate,
            faceValue,
            savings,
            savingsPercent,
            perks,
            imageUrls,
            bedrooms,
            bathrooms,
            viewType,
            poolType
        } = this.bookingData;
        
        // Parse image URLs if they're a string
        let images = [];
        try {
            images = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
        } catch (e) {
            images = [];
        }
        
        // Format dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Calculate days until check-in (using Bali time)
        const today = this.getBaliDate(0);
        const daysUntilCheckIn = Math.round((checkInDate - today) / (1000 * 60 * 60 * 24));
        let checkInText = `Check-in: ${dayNames[checkInDate.getDay()]}, ${monthNames[checkInDate.getMonth()]} ${checkInDate.getDate()}`;
        
        if (daysUntilCheckIn === 0) {
            checkInText += ' (Today!)';
        } else if (daysUntilCheckIn === 1) {
            checkInText += ' (Tomorrow)';
        } else if (daysUntilCheckIn > 0) {
            checkInText += ` (In ${daysUntilCheckIn} days)`;
        }
        
        // Format perks HTML
        let perksHtml = '';
        // Perks are now displayed in the "What is included" section - no separate perks section needed
        
        // Format price in IDR
        const formatIDR = (amount) => {
            if (amount >= 1000000) {
                return `${(amount / 1000000).toFixed(1).replace(/\.0$/, '')}M IDR`;
            }
            return `${(amount / 1000).toFixed(0)}K IDR`;
        };
        
        // Generate the booking summary HTML
        const summaryHTML = `
            <img src="${images[0] || '/images/villa-placeholder.jpg'}" 
                 alt="${villaDisplayName}" 
                 class="summary-image">
            
            <div class="summary-content">
                <h2 class="villa-title">${tagline}</h2>
                
                <div class="villa-details">
                    <div class="villa-detail">
                        <i class="fas fa-bed"></i>
                        <span>${bedrooms} ${bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                    </div>
                    <div class="villa-detail">
                        <i class="fas fa-bath"></i>
                        <span>${bathrooms} ${bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                    </div>
                    ${viewType ? `
                        <div class="villa-detail">
                            <i class="fas fa-mountain"></i>
                            <span>${viewType}</span>
                        </div>
                    ` : ''}
                    ${poolType ? `
                        <div class="villa-detail">
                            <i class="fas fa-swimming-pool"></i>
                            <span>${poolType}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="check-in-info">
                    ${checkInText}
                </div>



                <div class="included-section">
                    <div class="included-title">What is included</div>
                    <div class="included-list">
                        <div class="included-item">
                            <i class="fas fa-bed"></i>
                            <span>${nights} ${nights === 1 ? 'night' : 'nights'} in ${villaDisplayName}</span>
                        </div>
                        <div class="included-item">
                            <i class="fas fa-car"></i>
                            <span>Organization of the transfer</span>
                        </div>
                        ${perks && perks.length > 0 ? perks.map(perk => `
                            <div class="included-item">
                                <i class="fas fa-gift"></i>
                                <span>${perk.activity_name}</span>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>

                <div class="stay-details">
                    <div class="stay-title">Your Stay</div>
                    <div class="date-display">
                        <span class="date-number">${checkInDate.getDate()}</span>
                        <span class="date-separator">—</span>
                        <span class="date-number">${checkOutDate.getDate()}</span>
                    </div>
                    <div class="date-range">
                        ${monthNames[checkInDate.getMonth()].toUpperCase()} ${checkInDate.getDate()} — 
                        ${monthNames[checkOutDate.getMonth()].toUpperCase()} ${checkOutDate.getDate()} • 
                        ${nights} ${nights === 1 ? 'night' : 'nights'}
                    </div>
                    <div class="guests-info">
                        <div class="guest-count">
                            <i class="fas fa-user"></i>
                            <span>${adults} ${adults === 1 ? 'Adult' : 'Adults'}</span>
                        </div>
                        ${children > 0 ? `
                            <div class="guest-count">
                                <i class="fas fa-child"></i>
                                <span>${children} ${children === 1 ? 'Child' : 'Children'}</span>
                            </div>
                        ` : ''}
                        <div class="guest-count">
                            <i class="fas fa-users"></i>
                            <span>${totalGuests} Total ${totalGuests === 1 ? 'Guest' : 'Guests'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="pricing-section">
                    <div class="price-row">
                        <span class="price-label">Original Price</span>
                        <span class="price-value original">${formatIDR(faceValue)}</span>
                    </div>
                    <div class="price-row">
                        <span class="price-label">Special Offer Savings</span>
                        <span class="price-value">-${formatIDR(savings)}</span>
                        <span class="savings-badge">${Math.round(savingsPercent * 100)}% OFF</span>
                    </div>
                    <div class="price-row price-total">
                        <span class="price-label">Total Price</span>
                        <span class="price-value">${formatIDR(totalRate)}</span>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.bookingSummary.innerHTML = summaryHTML;
    }
    
    /**
     * Get Bali date (UTC+8)
     */
    getBaliDate(daysOffset = 0) {
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const baliTime = new Date(utcTime + (8 * 3600000)); // UTC+8
        
        if (daysOffset !== 0) {
            baliTime.setDate(baliTime.getDate() + daysOffset);
        }
        
        // Reset to start of day
        baliTime.setHours(0, 0, 0, 0);
        return baliTime;
    }
    
    /**
     * Setup form event listeners
     */
    setupFormListeners() {
        // Transfer dropdown change
        this.elements.transfer.addEventListener('change', (e) => {
            if (e.target.value === 'yes') {
                this.elements.transferDetails.style.display = 'block';
            } else {
                this.elements.transferDetails.style.display = 'none';
            }
        });
        
        // Form submission
        this.elements.bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }
    
    /**
     * Handle form submission
     */
    async handleFormSubmit() {
        // Collect form data
        const formData = new FormData(this.elements.bookingForm);
        const bookingRequest = {
            // Booking details from sessionStorage
            offerId: this.bookingData.offerId,
            villaKey: this.bookingData.villaKey,
            villaName: this.bookingData.villaDisplayName,
            checkIn: this.bookingData.checkIn,
            checkOut: this.bookingData.checkOut,
            nights: this.bookingData.nights,
            adults: this.bookingData.adults,
            children: this.bookingData.children,
            totalGuests: this.bookingData.totalGuests,
            totalPrice: this.bookingData.totalRate,
            
            // Guest information from form
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            specialRequests: formData.get('specialRequests'),
            
            // Transfer details
            needTransfer: formData.get('transfer'),
            transferAddress: formData.get('transferAddress'),
            transferLocation: formData.get('transferLocation'),
            interestedInPrivateBoat: formData.get('privateBoat') === 'interested',
            
            // Timestamp
            submittedAt: new Date().toISOString()
        };
        
        console.log('Booking request:', bookingRequest);
        
        try {
            // Disable submit button and show loading state
            const submitBtn = this.elements.bookingForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            // Send booking request to server
            const response = await fetch('/api/confirm-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingRequest)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear sessionStorage
                sessionStorage.removeItem('bookingData');
                
                // Show success message
                this.showSuccessMessage(result.bookingId);
            } else {
                // Show error message
                alert('There was an error processing your booking. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('There was an error connecting to the server. Please try again.');
            
            // Re-enable submit button
            const submitBtn = this.elements.bookingForm.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Confirm Booking</span><i class="fas fa-arrow-right"></i>';
        }
    }
    
    /**
     * Show success message after booking
     */
    showSuccessMessage(bookingId) {
        const successHTML = `
            <div class="booking-summary" style="text-align: center; padding: 60px 40px;">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: #AA7831; margin-bottom: 20px;"></i>
                <h2 style="color: #FFFFFF; font-family: 'Crimson Text', serif; font-size: 2rem; margin-bottom: 16px;">
                    Booking Confirmed!
                </h2>
                <p style="color: #4A4A47; font-size: 1.1rem; margin-bottom: 24px;">
                    Thank you for choosing Villa Tokay. Your booking reference is:
                </p>
                <div style="background: rgba(170, 120, 49, 0.1); border: 2px solid #AA7831; border-radius: 8px; padding: 16px; margin: 24px auto; max-width: 300px;">
                    <strong style="color: #AA7831; font-size: 1.3rem; letter-spacing: 2px;">
                        ${bookingId || 'VT-' + Date.now().toString(36).toUpperCase()}
                    </strong>
                </div>
                <p style="color: #4A4A47; margin-bottom: 32px;">
                    We've sent a confirmation email with payment instructions and villa details.
                </p>
                <a href="/" class="submit-btn" style="text-decoration: none; display: inline-flex;">
                    <span>View More Special Offers</span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        
        // Replace the entire container content
        document.querySelector('.container').innerHTML = `
            <div class="header">
                <h1 class="brand-name">Villa Tokay</h1>
                <p class="tagline">Your island escape confirmed</p>
            </div>
            ${successHTML}
        `;
    }
    
    /**
     * Show error message when no booking data
     */
    showError() {
        this.elements.bookingSummary.style.display = 'none';
        document.querySelector('.form-section').style.display = 'none';
        this.elements.errorMessage.style.display = 'block';
    }
}

/**
 * Navigate back to offers while preserving user state
 */
function goBackToOffers() {
    // The user state is already saved in localStorage from the booking process
    // Just navigate back to the main page - the state will be restored automatically
    window.location.href = '/';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConfirmBooking();
});