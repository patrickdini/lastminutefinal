// Villa Configuration Page JavaScript

let villaConfigurations = [];
let globalConfiguration = {};

// Load user information
async function loadUserInfo() {
    try {
        const response = await fetch('/admin/api/user');
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }
            throw new Error('Failed to load user info');
        }

        const data = await response.json();
        
        if (data.success && data.user) {
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = data.user.full_name || data.user.username;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/admin/api/logout', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = '/admin/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/admin/login';
        }
    });
}

// Load Villa Configurations from API
async function loadVillaConfigurations() {
    const villasGrid = document.getElementById('villas-grid');
    if (!villasGrid) return;

    try {
        villasGrid.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading villa configurations...</div>';

        const response = await fetch('/admin/api/villa-config');
        if (!response.ok) {
            throw new Error('Failed to load villa configurations');
        }

        const data = await response.json();
        if (data.success) {
            villaConfigurations = data.villas;
            globalConfiguration = data.globalConfig || {};
            
            // Log table structure for debugging
            if (data.tableStructure) {
                console.log('LMRoomDescription table structure:', data.tableStructure);
                console.log('Available fields:', data.tableStructure.map(col => col.Field));
            }
            
            // Log first villa to see all available fields
            if (data.villas && data.villas.length > 0) {
                console.log('Sample villa data:', data.villas[0]);
                console.log('All villa fields:', Object.keys(data.villas[0]));
            }
            
            renderVillaCards();
            updateGlobalSettings();
        } else {
            throw new Error(data.message || 'Failed to load villa configurations');
        }
    } catch (error) {
        console.error('Error loading villa configurations:', error);
        villasGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i> 
                <h3>Error Loading Configurations</h3>
                <p>${error.message}</p>
                <button onclick="loadVillaConfigurations()" class="btn-primary" style="margin-top: 15px;">
                    <i class="fas fa-retry"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Render Villa Cards
function renderVillaCards() {
    const villasGrid = document.getElementById('villas-grid');
    if (!villasGrid) return;

    const villaCards = villaConfigurations.map(villa => `
        <div class="villa-card" data-villa-id="${villa.villa_id}">
            <h3>
                ${villa.name || villa.villa_name || villa.villa_id}
                <span class="villa-status ${villa.active_status ? 'active' : 'inactive'}">
                    ${villa.active_status ? 'Active' : 'Inactive'}
                </span>
            </h3>
            <div class="villa-form">
                <div class="form-group">
                    <label for="name-${villa.villa_id}">Villa Name</label>
                    <input type="text" id="name-${villa.villa_id}" value="${villa.name || ''}" placeholder="Villa Name">
                </div>
                <div class="form-group">
                    <label for="class-${villa.villa_id}">Class</label>
                    <select id="class-${villa.villa_id}">
                        <option value="Masterpiece" ${villa.class === 'Masterpiece' ? 'selected' : ''}>Masterpiece</option>
                        <option value="Sanctuary" ${villa.class === 'Sanctuary' ? 'selected' : ''}>Sanctuary</option>
                        <option value="Premium" ${villa.class === 'Premium' ? 'selected' : ''}>Premium</option>
                        <option value="Standard" ${villa.class === 'Standard' ? 'selected' : ''}>Standard</option>
                        <option value="Budget" ${villa.class === 'Budget' ? 'selected' : ''}>Budget</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="villa-type-${villa.villa_id}">Villa Type</label>
                    <input type="text" id="villa-type-${villa.villa_id}" value="${villa.villa_type || ''}" placeholder="e.g. Standalone Villa">
                </div>
                <div class="form-group">
                    <label for="square-meters-${villa.villa_id}">Square Meters</label>
                    <input type="number" id="square-meters-${villa.villa_id}" value="${villa.square_meters || ''}" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label for="webpage-url-${villa.villa_id}">Webpage URL</label>
                    <input type="url" id="webpage-url-${villa.villa_id}" value="${villa.webpage_url || ''}" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label for="bedrooms-${villa.villa_id}">Bedrooms</label>
                    <input type="number" id="bedrooms-${villa.villa_id}" value="${villa.bedrooms || 1}" min="1" max="10">
                </div>
                <div class="form-group">
                    <label for="bathrooms-${villa.villa_id}">Bathrooms</label>
                    <input type="number" id="bathrooms-${villa.villa_id}" value="${villa.bathrooms || 1}" min="1" max="10">
                </div>
                <div class="form-group">
                    <label for="max-guests-${villa.villa_id}">Max Guests</label>
                    <input type="number" id="max-guests-${villa.villa_id}" value="${villa.max_guests || 2}" min="1" max="20">
                </div>
                <div class="form-group">
                    <label for="max-adults-${villa.villa_id}">Max Adults</label>
                    <input type="number" id="max-adults-${villa.villa_id}" value="${villa.max_adults || 2}" min="1" max="20">
                </div>
                <div class="form-group">
                    <label for="tagline-${villa.villa_id}">Tagline</label>
                    <input type="text" id="tagline-${villa.villa_id}" value="${villa.tagline || ''}" placeholder="Short villa tagline">
                </div>
                <div class="form-group">
                    <label for="description-${villa.villa_id}">Description</label>
                    <textarea id="description-${villa.villa_id}" rows="3" placeholder="Villa description">${villa.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="image-urls-${villa.villa_id}">Image URLs (JSON)</label>
                    <textarea id="image-urls-${villa.villa_id}" rows="2" placeholder='["url1", "url2"]'>${villa.image_urls || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="video-tour-url-${villa.villa_id}">Video Tour URL</label>
                    <input type="url" id="video-tour-url-${villa.villa_id}" value="${villa.video_tour_url || ''}" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label for="ideal-for-${villa.villa_id}">Ideal For</label>
                    <textarea id="ideal-for-${villa.villa_id}" rows="2" placeholder="Target audience description">${villa.ideal_for || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="is-featured-${villa.villa_id}">Featured Villa</label>
                    <select id="is-featured-${villa.villa_id}">
                        <option value="1" ${villa.is_featured ? 'selected' : ''}>Yes</option>
                        <option value="0" ${!villa.is_featured ? 'selected' : ''}>No</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="view-type-${villa.villa_id}">View Type</label>
                    <input type="text" id="view-type-${villa.villa_id}" value="${villa.view_type || ''}" placeholder="e.g. Ocean View, Garden View">
                </div>
                <div class="form-group">
                    <label for="pool-type-${villa.villa_id}">Pool Type</label>
                    <select id="pool-type-${villa.villa_id}">
                        <option value="Private Pool" ${villa.pool_type === 'Private Pool' ? 'selected' : ''}>Private Pool</option>
                        <option value="Shared Pool" ${villa.pool_type === 'Shared Pool' ? 'selected' : ''}>Shared Pool</option>
                        <option value="No Pool" ${villa.pool_type === 'No Pool' ? 'selected' : ''}>No Pool</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="key-amenities-${villa.villa_id}">Key Amenities</label>
                    <textarea id="key-amenities-${villa.villa_id}" rows="2" placeholder="List of key amenities">${villa.key_amenities || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="active-status-${villa.villa_id}">Status</label>
                    <select id="active-status-${villa.villa_id}">
                        <option value="1" ${villa.active_status ? 'selected' : ''}>Active</option>
                        <option value="0" ${!villa.active_status ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </div>
        </div>
    `).join('');

    villasGrid.innerHTML = villaCards;
}

// Update global settings form
function updateGlobalSettings() {
    const globalChildAge = document.getElementById('global-child-age-limit');
    if (globalChildAge && globalConfiguration.child_age_limit) {
        globalChildAge.value = globalConfiguration.child_age_limit.value || '12';
    }
}



// Save Villa Configurations
async function saveVillaConfigurations() {
    const saveBtn = document.getElementById('save-villa-config');
    const statusDiv = document.getElementById('villa-save-status');

    if (!saveBtn || !statusDiv) return;

    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const updates = [];
        const globalConfig = {};

        // Get global configuration values
        const globalChildAge = document.getElementById('global-child-age-limit');
        if (globalChildAge) {
            globalConfig.child_age_limit = globalChildAge.value;
        }

        for (const villa of villaConfigurations) {
            const villaUpdate = {
                villa_id: villa.villa_id,
                name: document.getElementById(`name-${villa.villa_id}`).value,
                class: document.getElementById(`class-${villa.villa_id}`).value,
                villa_type: document.getElementById(`villa-type-${villa.villa_id}`).value,
                square_meters: parseFloat(document.getElementById(`square-meters-${villa.villa_id}`).value) || null,
                webpage_url: document.getElementById(`webpage-url-${villa.villa_id}`).value,
                bedrooms: parseInt(document.getElementById(`bedrooms-${villa.villa_id}`).value),
                bathrooms: parseInt(document.getElementById(`bathrooms-${villa.villa_id}`).value),
                max_guests: parseInt(document.getElementById(`max-guests-${villa.villa_id}`).value),
                max_adults: parseInt(document.getElementById(`max-adults-${villa.villa_id}`).value),
                tagline: document.getElementById(`tagline-${villa.villa_id}`).value,
                description: document.getElementById(`description-${villa.villa_id}`).value,
                image_urls: document.getElementById(`image-urls-${villa.villa_id}`).value,
                video_tour_url: document.getElementById(`video-tour-url-${villa.villa_id}`).value,
                ideal_for: document.getElementById(`ideal-for-${villa.villa_id}`).value,
                is_featured: parseInt(document.getElementById(`is-featured-${villa.villa_id}`).value) === 1,
                view_type: document.getElementById(`view-type-${villa.villa_id}`).value,
                pool_type: document.getElementById(`pool-type-${villa.villa_id}`).value,
                key_amenities: document.getElementById(`key-amenities-${villa.villa_id}`).value,
                active_status: parseInt(document.getElementById(`active-status-${villa.villa_id}`).value) === 1
            };
            updates.push(villaUpdate);
        }

        const response = await fetch('/admin/api/villa-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                villas: updates,
                globalConfig: globalConfig
            })
        });

        const data = await response.json();

        if (data.success) {
            statusDiv.textContent = 'Configuration saved successfully!';
            statusDiv.className = 'status-message success';
            statusDiv.style.display = 'block';

            // Update local configurations
            villaConfigurations = updates;

            // Re-render cards to show updated status
            renderVillaCards();

            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        } else {
            throw new Error(data.message || 'Failed to save villa configurations');
        }
    } catch (error) {
        console.error('Error saving villa configurations:', error);
        statusDiv.textContent = `Error: ${error.message}`;
        statusDiv.className = 'status-message error';
        statusDiv.style.display = 'block';

        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save All Changes';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadVillaConfigurations();

    // Add event listener for save button
    const saveBtn = document.getElementById('save-villa-config');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveVillaConfigurations);
    }
});