// assets/js/dashboard.js - GenieSugar Dashboard Logic

const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');
let glucoseChart = null;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load user data
    loadUserProfile();
    loadDashboardData();
    initializeCharts();
});

// ==================== USER PROFILE ====================

async function loadUserProfile() {
    const userName = document.getElementById('userName');
    const userInitials = document.getElementById('userInitials');
    const headerName = document.getElementById('headerName');

    if (user && user.name) {
        if (userName) userName.textContent = user.name;
        if (headerName) headerName.textContent = user.name.split(' ')[0];
        if (userInitials) {
            const initials = user.name.split(' ').map(n => n[0]).join('');
            userInitials.textContent = initials;
        }
    }
}

// ==================== DASHBOARD DATA ====================

async function loadDashboardData() {
    try {
        // Load glucose readings
        await loadGlucoseData(7);
        
        // Load food logs
        await loadFoodLogs();
        
        // Load statistics
        await loadStatistics();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading data', 'error');
    }
}

// ==================== GLUCOSE TRACKING ====================

async function loadGlucoseData(days = 7) {
    try {
        const response = await fetch(`${API_URL}/glucose?days=${days}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            updateGlucoseStats(data.readings);
            updateGlucoseChart(data.readings);
        }
    } catch (error) {
        console.error('Error loading glucose data:', error);
    }
}

function updateGlucoseStats(readings) {
    if (!readings || readings.length === 0) return;

    // Calculate statistics
    const values = readings.map(r => r.value);
    const avgGlucose = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    const lastReading = readings[0];
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const timeInRange = ((inRange / values.length) * 100).toFixed(0);

    // Update UI
    const avgElement = document.getElementById('avgGlucose');
    const lastElement = document.getElementById('lastReading');
    const lastTimeElement = document.getElementById('lastReadingTime');
    const rangeElement = document.getElementById('timeInRange');

    if (avgElement) avgElement.textContent = `${avgGlucose} mg/dL`;
    if (lastElement) lastElement.textContent = `${lastReading.value} mg/dL`;
    if (rangeElement) rangeElement.textContent = `${timeInRange}%`;
    
    if (lastTimeElement) {
        const time = formatTimeAgo(new Date(lastReading.timestamp));
        lastTimeElement.textContent = time;
    }
}

// ==================== CHARTS ====================

function initializeCharts() {
    const canvas = document.getElementById('glucoseChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    glucoseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Glucose (mg/dL)',
                data: [],
                borderColor: '#1565A6',
                backgroundColor: 'rgba(21, 101, 166, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#1565A6',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 40,
                    max: 250,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' mg/dL';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function updateGlucoseChart(readings) {
    if (!glucoseChart || !readings) return;

    const labels = readings.reverse().map(r => {
        const date = new Date(r.timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = readings.map(r => r.value);

    glucoseChart.data.labels = labels;
    glucoseChart.data.datasets[0].data = data;
    glucoseChart.update();
}

// ==================== FOOD LOGS ====================

async function loadFoodLogs() {
    try {
        const response = await fetch(`${API_URL}/food-logs`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            displayRecentMeals(data.logs);
        }
    } catch (error) {
        console.error('Error loading food logs:', error);
    }
}

function displayRecentMeals(logs) {
    const container = document.getElementById('recentMeals');
    if (!container || !logs) return;

    const recent = logs.slice(0, 3);
    
    container.innerHTML = recent.map(log => `
        <div class="activity-item">
            <div class="activity-icon">${getMealIcon(log.meal_type)}</div>
            <div class="activity-info">
                <h4>${log.food_name}</h4>
                <span>${log.calories || 0} cal • ${log.carbs || 0}g carbs</span>
            </div>
            <span class="activity-time">${formatTimeAgo(new Date(log.timestamp))}</span>
        </div>
    `).join('');
}

function getMealIcon(mealType) {
    const icons = {
        'breakfast': '🍳',
        'lunch': '🥗',
        'dinner': '🍽️',
        'snack': '🍎'
    };
    return icons[mealType] || '🍽️';
}

// ==================== STATISTICS ====================

async function loadStatistics() {
    // This would fetch aggregated statistics from backend
    // For now, we'll use dummy data
}

// ==================== MODALS ====================

function showAddGlucoseModal() {
    const modal = document.getElementById('addGlucoseModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('glucoseValue')?.focus();
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none');
}

async function submitGlucose() {
    const value = document.getElementById('glucoseValue')?.value;
    const context = document.getElementById('glucoseContext')?.value;
    const notes = document.getElementById('glucoseNotes')?.value;

    if (!value) {
        showNotification('Please enter a glucose value', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/glucose`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                reading_value: parseFloat(value),
                context: context,
                notes: notes
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Glucose reading added successfully!', 'success');
            closeModal();
            loadGlucoseData(7); // Reload data
            
            // Clear form
            document.getElementById('glucoseValue').value = '';
            document.getElementById('glucoseNotes').value = '';
        } else {
            showNotification(data.error || 'Failed to add reading', 'error');
        }
    } catch (error) {
        console.error('Error submitting glucose:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// ==================== DEXCOM SYNC ====================

async function syncDexcom() {
    showNotification('Syncing with Dexcom...', 'info');

    try {
        const response = await fetch(`${API_URL}/glucose/sync-dexcom`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`Synced ${data.readings_added} new readings!`, 'success');
            loadGlucoseData(7); // Reload data
        } else {
            showNotification(data.error || 'Sync failed', 'error');
        }
    } catch (error) {
        console.error('Error syncing Dexcom:', error);
        showNotification('Sync failed. Please try again.', 'error');
    }
}

// ==================== AI CHATBOT ====================

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const messagesContainer = document.getElementById('chatMessages');
    
    if (!input || !messagesContainer) return;
    
    const message = input.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat('user', message);
    input.value = '';

    // Show typing indicator
    const typingDiv = addMessageToChat('bot', 'Typing...');
    typingDiv.id = 'typingIndicator';

    try {
        const response = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        // Remove typing indicator
        document.getElementById('typingIndicator')?.remove();

        // Add AI response
        if (data.success) {
            addMessageToChat('bot', data.response);
        } else {
            addMessageToChat('bot', 'Sorry, I encountered an error. Please try again.');
        }
    } catch (error) {
        document.getElementById('typingIndicator')?.remove();
        addMessageToChat('bot', 'Sorry, I\'m having trouble connecting. Please try again later.');
        console.error('AI chat error:', error);
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessageToChat(type, text) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${type === 'bot' ? '🤖' : '👤'}</div>
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
    return messageDiv;
}

// ==================== TABS ====================

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    const tab = document.getElementById(tabName + 'Tab');
    if (tab) tab.classList.add('active');

    // Add active class to clicked nav item
    event?.target.closest('.nav-item')?.classList.add('active');
}

// ==================== UTILITIES ====================

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ==================== KEYBOARD SHORTCUTS ====================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearch')?.focus();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});