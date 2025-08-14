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
                ${villa.villa_name}
                <span class="villa-status ${villa.active_status ? 'active' : 'inactive'}">
                    ${villa.active_status ? 'Active' : 'Inactive'}
                </span>
            </h3>
            <div class="villa-form">
                <div class="form-group">
                    <label for="bedrooms-${villa.villa_id}">Bedrooms</label>
                    <input type="number" id="bedrooms-${villa.villa_id}" value="${villa.bedrooms || 1}" min="1" max="10">
                </div>
                <div class="form-group">
                    <label for="max-adults-${villa.villa_id}">Max Adults</label>
                    <input type="number" id="max-adults-${villa.villa_id}" value="${villa.max_adults_per_unit || 2}" min="1" max="20">
                </div>
                <div class="form-group">
                    <label for="max-guests-${villa.villa_id}">Max Total Guests</label>
                    <input type="number" id="max-guests-${villa.villa_id}" value="${villa.max_guests_per_unit || 2}" min="1" max="20">
                </div>
                <div class="form-group">
                    <label for="privacy-${villa.villa_id}">Privacy Level</label>
                    <select id="privacy-${villa.villa_id}">
                        <option value="Full Privacy" ${villa.privacy_level === 'Full Privacy' ? 'selected' : ''}>Full Privacy</option>
                        <option value="Semi-Private" ${villa.privacy_level === 'Semi-Private' ? 'selected' : ''}>Semi-Private</option>
                        <option value="Shared" ${villa.privacy_level === 'Shared' ? 'selected' : ''}>Shared</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="pool-${villa.villa_id}">Pool Type</label>
                    <select id="pool-${villa.villa_id}">
                        <option value="Private Pool" ${villa.pool_type === 'Private Pool' ? 'selected' : ''}>Private Pool</option>
                        <option value="Shared Pool" ${villa.pool_type === 'Shared Pool' ? 'selected' : ''}>Shared Pool</option>
                        <option value="None" ${villa.pool_type === 'None' ? 'selected' : ''}>No Pool</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="villa-class-${villa.villa_id}">Villa Class</label>
                    <select id="villa-class-${villa.villa_id}">
                        <option value="Premium" ${villa.villa_class === 'Premium' ? 'selected' : ''}>Premium</option>
                        <option value="Normal" ${villa.villa_class === 'Normal' ? 'selected' : ''}>Normal</option>
                        <option value="Standard" ${villa.villa_class === 'Standard' ? 'selected' : ''}>Standard</option>
                        <option value="Budget" ${villa.villa_class === 'Budget' ? 'selected' : ''}>Budget</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="child-age-${villa.villa_id}">Child Age Limit</label>
                    <input type="number" id="child-age-${villa.villa_id}" value="${villa.child_age_limit || 12}" min="1" max="18">
                </div>
                <div class="form-group">
                    <label for="active-${villa.villa_id}">Status</label>
                    <select id="active-${villa.villa_id}">
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

// Database Migration Function
async function runDatabaseMigration() {
    const migrationBtn = document.getElementById('migration-btn');
    const migrationStatus = document.getElementById('migration-status');
    
    if (!migrationBtn || !migrationStatus) return;
    
    try {
        migrationBtn.disabled = true;
        migrationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Migration...';
        migrationStatus.style.display = 'block';
        migrationStatus.textContent = 'Consolidating villa tables...';
        migrationStatus.className = 'status-message';
        
        const response = await fetch('/admin/api/migrate-villa-tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            migrationStatus.textContent = 'Migration completed successfully! Villa tables consolidated.';
            migrationStatus.className = 'status-message success';
            
            // Hide migration button after successful migration
            migrationBtn.style.display = 'none';
            
            // Reload villa configurations with new structure
            setTimeout(() => {
                loadVillaConfigurations();
                migrationStatus.style.display = 'none';
            }, 3000);
            
        } else {
            throw new Error(data.message || 'Migration failed');
        }
        
    } catch (error) {
        console.error('Migration error:', error);
        migrationStatus.textContent = `Migration failed: ${error.message}`;
        migrationStatus.className = 'status-message error';
        migrationBtn.disabled = false;
        migrationBtn.innerHTML = '<i class="fas fa-database"></i> Run Database Migration';
        
        setTimeout(() => {
            migrationStatus.style.display = 'none';
        }, 5000);
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
                villa_name: villa.villa_name,
                bedrooms: parseInt(document.getElementById(`bedrooms-${villa.villa_id}`).value),
                max_adults_per_unit: parseInt(document.getElementById(`max-adults-${villa.villa_id}`).value),
                max_guests_per_unit: parseInt(document.getElementById(`max-guests-${villa.villa_id}`).value),
                privacy_level: document.getElementById(`privacy-${villa.villa_id}`).value,
                pool_type: document.getElementById(`pool-${villa.villa_id}`).value,
                villa_class: document.getElementById(`villa-class-${villa.villa_id}`).value,
                active_status: parseInt(document.getElementById(`active-${villa.villa_id}`).value) === 1
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