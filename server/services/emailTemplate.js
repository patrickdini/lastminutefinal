// server/services/emailTemplate.js
const fs = require('fs');
const path = require('path');

/**
 * Format date with standard Villa Tokay check-in/check-out times
 * @param {string} dateInput - Date string from booking data
 * @param {boolean} isCheckIn - true for check-in (2:00 PM), false for check-out (11:00 AM)
 */
function formatBaliDate(dateInput, isCheckIn = false) {
    // Parse just the date part, ignoring any time/timezone info
    const date = new Date(dateInput);
    
    const options = {
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        timeZone: 'UTC'
    };
    
    let formatted = date.toLocaleDateString('en-US', options);
    
    // Add standard Villa Tokay times
    if (isCheckIn) {
        formatted += ' (2:00 PM)';
    } else {
        formatted += ' (11:00 AM)';
    }
    
    return formatted;
}

/**
 * Format price in millions of rupiah with one decimal place
 */
function formatPrice(priceInRupiah) {
    const millions = priceInRupiah / 1000000;
    return `${millions.toFixed(1)}M IDR`;
}

/**
 * Generate transfer section content based on user preferences
 */
function generateTransferContent(needTransfer, interestedInPrivateBoat, transferLocation) {
    if (!needTransfer) {
        return `
            <div class="transfer-note">
                <div class="transfer-title">Getting to Villa Tokay</div>
                <p style="margin: 0; color: #4a4a47">
                    Do you need a door-to-door transfer? Our team can arrange seamless transport 
                    from anywhere in Bali directly to your villa. Just let us know – we're here 
                    to make your journey as effortless as your stay.
                </p>
            </div>
        `;
    }
    
    let content = `
        <div class="transfer-note">
            <div class="transfer-title">Your Door-to-Door Transfer</div>
            <p style="margin: 0; color: #4a4a47">
                To arrange your seamless journey from ${transferLocation || 'your location'}, 
                our team will contact you within 24 hours.`;
    
    if (interestedInPrivateBoat) {
        content += ` Since you're interested in our private boat option, we'll include 
                    those exclusive details as well.`;
    }
    
    content += `
            </p>
        </div>
    `;
    
    return content;
}

/**
 * Generate perks section HTML
 */
function generatePerksHtml(perks) {
    if (!perks || perks.length === 0) {
        return '<p style="color: #4a4a47; font-style: italic;">No additional perks selected</p>';
    }
    
    return perks.map(perk => `
        <div class="included-item">
            <span class="included-icon">✨</span>
            <span>${perk.activity_name} – ${perk.description}</span>
        </div>
    `).join('');
}

/**
 * Process booking confirmation email template
 */
function processConfirmationTemplate(bookingData) {
    try {
        // Read template file
        const templatePath = path.join(__dirname, '../../public/templates/confirmation_email.html');
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Calculate nights
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        // Format guest information
        const guestInfo = bookingData.children > 0 
            ? `${bookingData.adults} Adults, ${bookingData.children} Children`
            : `${bookingData.adults} Adults`;
        
        // Prepare villa features (extract from booking data if available)
        const villaFeatures = `${bookingData.bedrooms || 1} Bedroom • ${bookingData.bathrooms || 1} Bath • ${bookingData.viewType || 'Garden View'} • ${bookingData.poolType || 'Private Pool'}`;
        
        // Generate dynamic content sections
        const transferSection = generateTransferContent(
            bookingData.needTransfer,
            bookingData.interestedInPrivateBoat,
            bookingData.transferLocation
        );
        
        const perksHtml = generatePerksHtml(bookingData.perks);
        
        // Replace all placeholders
        const replacements = {
            '{{guestName}}': bookingData.firstName || 'Valued Guest',
            '{{villaName}}': bookingData.villaName || bookingData.villaDisplayName || bookingData.villaKey,
            '{{villaTagline}}': bookingData.tagline || '',
            '{{checkInDate}}': formatBaliDate(bookingData.checkIn, true),
            '{{checkOutDate}}': formatBaliDate(bookingData.checkOut, false), 
            '{{nights}}': nights,
            '{{guestInfo}}': guestInfo,
            '{{villaFeatures}}': villaFeatures,
            '{{totalPrice}}': formatPrice(bookingData.totalPrice || bookingData.totalRate || bookingData.rate),
            '{{perksSection}}': perksHtml,
            '{{transferSection}}': transferSection
        };
        
        // Apply all replacements
        Object.keys(replacements).forEach(placeholder => {
            const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
            template = template.replace(regex, replacements[placeholder]);
        });
        
        return template;
        
    } catch (error) {
        console.error('Error processing email template:', error);
        throw new Error('Failed to process email template');
    }
}

module.exports = {
    processConfirmationTemplate,
    formatBaliDate,
    formatPrice
};