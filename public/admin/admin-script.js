// Admin Panel JavaScript

// Check which page we're on
const isLoginPage = window.location.pathname.includes('/admin/login');
const isDashboardPage = window.location.pathname.includes('/admin') && !isLoginPage;

// Login Page Functionality
if (isLoginPage) {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/admin/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to dashboard
                window.location.href = '/admin';
            } else {
                // Show error message
                errorMessage.textContent = data.message || 'Login failed. Please try again.';
                errorMessage.style.display = 'block';

                // Hide error after 5 seconds
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 5000);
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'An error occurred. Please try again later.';
            errorMessage.style.display = 'block';
        }
    });
}

// Dashboard Page Functionality
if (isDashboardPage) {
    // Load user information
    async function loadUserInfo() {
        try {
            const response = await fetch('/admin/api/user');
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Not authenticated, redirect to login
                    window.location.href = '/admin/login';
                    return;
                }
                throw new Error('Failed to load user info');
            }

            const data = await response.json();
            
            if (data.success && data.user) {
                // Update username display
                const userName = document.getElementById('userName');
                if (userName) {
                    userName.textContent = data.user.full_name || data.user.username;
                }

                // Update user role display
                const userRole = document.getElementById('userRole');
                if (userRole) {
                    const roleDisplay = data.user.role.replace('_', ' ').toUpperCase();
                    userRole.textContent = roleDisplay;
                    userRole.className = 'status-value';
                    
                    // Add role-specific styling
                    if (data.user.role === 'super_admin') {
                        userRole.style.color = '#AA7831';
                        userRole.style.fontWeight = '600';
                    }
                }

                // Check last sync time
                checkLastSync();
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    // Check last sync time
    async function checkLastSync() {
        try {
            const response = await fetch('/api/activities?limit=1');
            const data = await response.json();
            
            const lastSyncElement = document.getElementById('lastSync');
            if (lastSyncElement) {
                if (data.activities && data.activities.length > 0) {
                    const lastSyncTime = new Date(data.activities[0].LastSyncedAt);
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastSyncTime) / (1000 * 60));
                    
                    if (diffMinutes < 60) {
                        lastSyncElement.textContent = `${diffMinutes} minutes ago`;
                    } else if (diffMinutes < 1440) {
                        const hours = Math.floor(diffMinutes / 60);
                        lastSyncElement.textContent = `${hours} hour${hours > 1 ? 's' : ''} ago`;
                    } else {
                        const days = Math.floor(diffMinutes / 1440);
                        lastSyncElement.textContent = `${days} day${days > 1 ? 's' : ''} ago`;
                    }
                } else {
                    lastSyncElement.textContent = 'No data available';
                }
            }
        } catch (error) {
            console.error('Error checking last sync:', error);
            const lastSyncElement = document.getElementById('lastSync');
            if (lastSyncElement) {
                lastSyncElement.textContent = 'Unable to determine';
            }
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
                // Still redirect to login on error
                window.location.href = '/admin/login';
            }
        });
    }

    // Initialize dashboard
    loadUserInfo();

    // Refresh last sync time every minute
    setInterval(checkLastSync, 60000);

    // Villa Configuration Manager
    let villaConfigurations = [];

    // Open Villa Configuration Modal
    window.openVillaConfig = async function() {
        const modal = document.getElementById('villa-config-modal');
        if (modal) {
            modal.style.display = 'flex';
            await loadVillaConfigurations();
        }
    };

    // Close Villa Configuration Modal
    window.closeVillaConfig = function() {
        const modal = document.getElementById('villa-config-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

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
                renderVillaCards();
            } else {
                throw new Error(data.message || 'Failed to load villa configurations');
            }
        } catch (error) {
            console.error('Error loading villa configurations:', error);
            villasGrid.innerHTML = `
                <div class="loading-message" style="color: #f44336;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Error loading villa configurations: ${error.message}
                </div>
            `;
        }
    }

    // Render Villa Cards
    function renderVillaCards() {
        const villasGrid = document.getElementById('villas-grid');
        if (!villasGrid) return;

        const villaCards = villaConfigurations.map(villa => `
            <div class="villa-card" data-villa-id="${villa.id}">
                <h5>
                    ${villa.villa_name}
                    <span class="villa-status ${villa.active_status ? 'active' : 'inactive'}">
                        ${villa.active_status ? 'Active' : 'Inactive'}
                    </span>
                </h5>
                <div class="villa-form">
                    <div class="form-group">
                        <label for="bedrooms-${villa.id}">Bedrooms</label>
                        <input type="number" id="bedrooms-${villa.id}" value="${villa.bedrooms || 1}" min="1" max="10">
                    </div>
                    <div class="form-group">
                        <label for="max-adults-${villa.id}">Max Adults</label>
                        <input type="number" id="max-adults-${villa.id}" value="${villa.max_adults_per_unit || 2}" min="1" max="20">
                    </div>
                    <div class="form-group">
                        <label for="max-guests-${villa.id}">Max Total Guests</label>
                        <input type="number" id="max-guests-${villa.id}" value="${villa.max_guests_per_unit || 2}" min="1" max="20">
                    </div>
                    <div class="form-group">
                        <label for="privacy-${villa.id}">Privacy Level</label>
                        <select id="privacy-${villa.id}">
                            <option value="Private" ${villa.privacy_level === 'Private' ? 'selected' : ''}>Private</option>
                            <option value="Semi-Private" ${villa.privacy_level === 'Semi-Private' ? 'selected' : ''}>Semi-Private</option>
                            <option value="Shared" ${villa.privacy_level === 'Shared' ? 'selected' : ''}>Shared</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pool-${villa.id}">Pool Type</label>
                        <select id="pool-${villa.id}">
                            <option value="Private" ${villa.pool_type === 'Private' ? 'selected' : ''}>Private Pool</option>
                            <option value="Shared" ${villa.pool_type === 'Shared' ? 'selected' : ''}>Shared Pool</option>
                            <option value="None" ${villa.pool_type === 'None' ? 'selected' : ''}>No Pool</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="villa-class-${villa.id}">Villa Class</label>
                        <select id="villa-class-${villa.id}">
                            <option value="Luxury" ${villa.villa_class === 'Luxury' ? 'selected' : ''}>Luxury</option>
                            <option value="Premium" ${villa.villa_class === 'Premium' ? 'selected' : ''}>Premium</option>
                            <option value="Standard" ${villa.villa_class === 'Standard' ? 'selected' : ''}>Standard</option>
                            <option value="Budget" ${villa.villa_class === 'Budget' ? 'selected' : ''}>Budget</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="child-age-${villa.id}">Child Age Limit</label>
                        <input type="number" id="child-age-${villa.id}" value="${villa.child_age_limit || 12}" min="1" max="18">
                    </div>
                    <div class="form-group">
                        <label for="active-${villa.id}">Status</label>
                        <select id="active-${villa.id}">
                            <option value="1" ${villa.active_status ? 'selected' : ''}>Active</option>
                            <option value="0" ${!villa.active_status ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>
            </div>
        `).join('');

        villasGrid.innerHTML = villaCards;
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
            const globalChildAge = document.getElementById('global-child-age-limit').value;

            for (const villa of villaConfigurations) {
                const villaUpdate = {
                    id: villa.id,
                    villa_name: villa.villa_name,
                    bedrooms: parseInt(document.getElementById(`bedrooms-${villa.id}`).value),
                    max_adults_per_unit: parseInt(document.getElementById(`max-adults-${villa.id}`).value),
                    max_guests_per_unit: parseInt(document.getElementById(`max-guests-${villa.id}`).value),
                    privacy_level: document.getElementById(`privacy-${villa.id}`).value,
                    pool_type: document.getElementById(`pool-${villa.id}`).value,
                    villa_class: document.getElementById(`villa-class-${villa.id}`).value,
                    child_age_limit: parseInt(document.getElementById(`child-age-${villa.id}`).value),
                    active_status: parseInt(document.getElementById(`active-${villa.id}`).value) === 1
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
                    globalChildAge: parseInt(globalChildAge)
                })
            });

            const data = await response.json();

            if (data.success) {
                statusDiv.textContent = 'Configuration saved successfully!';
                statusDiv.className = 'status-message success';
                statusDiv.style.display = 'block';

                // Update local configurations
                villaConfigurations = updates;

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

    // Add event listener for save button
    document.addEventListener('DOMContentLoaded', () => {
        const saveBtn = document.getElementById('save-villa-config');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveVillaConfigurations);
        }

        // Close modal when clicking outside
        const modal = document.getElementById('villa-config-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeVillaConfig();
                }
            });
        }
    });
}

// Add click handlers for coming soon cards
document.addEventListener('DOMContentLoaded', () => {
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    
    dashboardCards.forEach(card => {
        const comingSoon = card.querySelector('.coming-soon');
        if (comingSoon) {
            card.style.cursor = 'default';
            card.addEventListener('click', (e) => {
                e.preventDefault();
                // Could add a tooltip or notification here
            });
        }
    });
});