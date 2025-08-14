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