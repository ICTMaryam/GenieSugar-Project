// assets/js/api.js - Complete API Helper Functions for GenieSugar

const API_BASE_URL = 'http://localhost:5000/api';

// ==================== API Client Class ====================

class GenieSugarAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Get authentication token
    getToken() {
        return this.token || localStorage.getItem('token');
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.getToken()) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // ==================== AUTHENTICATION ====================

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return data;
    }

    async login(credentials) {
        // Accept either {email, password} object or separate email, password
        const loginData = typeof credentials === 'object' 
            ? credentials 
            : { email: credentials, password: arguments[1] };
            
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });

        if (data.success && data.token) {
            this.setToken(data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    }

    logout() {
        this.clearAuth();
        window.location.href = 'login.html';
    }

    // ==================== GLUCOSE ====================

    async getGlucoseReadings(days = 7) {
        return await this.request(`/glucose?days=${days}`);
    }

    async addGlucoseReading(reading) {
        return await this.request('/glucose', {
            method: 'POST',
            body: JSON.stringify(reading)
        });
    }

    async syncDexcom() {
        return await this.request('/glucose/sync-dexcom', {
            method: 'POST'
        });
    }

    // ==================== FOOD LOGS ====================

    async getFoodLogs() {
        return await this.request('/food-logs');
    }

    async addFoodLog(foodData) {
        return await this.request('/food-logs', {
            method: 'POST',
            body: JSON.stringify(foodData)
        });
    }

    async deleteFoodLog(logId) {
        return await this.request(`/food-logs/${logId}`, {
            method: 'DELETE'
        });
    }

    // ==================== APPOINTMENTS ====================

    async getAppointments() {
        return await this.request('/appointments');
    }

    async createAppointment(appointmentData) {
        return await this.request('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    }

    async updateAppointment(appointmentId, updates) {
        return await this.request(`/appointments/${appointmentId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    }

    async cancelAppointment(appointmentId) {
        return await this.request(`/appointments/${appointmentId}`, {
            method: 'DELETE'
        });
    }

    // ==================== DOCTOR ====================

    async getDoctorPatients(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/doctor/patients?${params}`);
    }

    async getPatientDetails(patientId, days = 7) {
        return await this.request(`/doctor/patients/${patientId}?days=${days}`);
    }

    async addDoctorComment(patientId, commentText) {
        return await this.request(`/doctor/patients/${patientId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ comment_text: commentText })
        });
    }

    async getDoctorAppointments() {
        return await this.request('/doctor/appointments');
    }

    async exportPatientReport(patientId, format = 'pdf') {
        return await this.request(`/doctor/patients/${patientId}/export?format=${format}`);
    }

    // ==================== AI CHATBOT ====================

    async sendChatMessage(message) {
        return await this.request('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    // ==================== REPORTS ====================

    async generateReport(reportType, dateRange) {
        return await this.request('/reports/generate', {
            method: 'POST',
            body: JSON.stringify({ type: reportType, dateRange })
        });
    }

    async exportData(format = 'csv', dateRange = {}) {
        return await this.request(`/reports/export?format=${format}`, {
            method: 'POST',
            body: JSON.stringify(dateRange)
        });
    }

    // ==================== PROFILE ====================

    async getProfile() {
        return await this.request('/profile');
    }

    async updateProfile(profileData) {
        return await this.request('/profile', {
            method: 'PATCH',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(oldPassword, newPassword) {
        return await this.request('/profile/change-password', {
            method: 'POST',
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Format date to readable string
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Get glucose status
function getGlucoseStatus(value) {
    if (value < 70) return { text: 'Low', color: '#FF6B6B', class: 'danger' };
    if (value > 180) return { text: 'High', color: '#FFC107', class: 'warning' };
    return { text: 'Normal', color: '#4CAF50', class: 'success' };
}

// Calculate statistics
function calculateStats(values) {
    if (!values || values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = values.length % 2 === 0
        ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
        : sorted[Math.floor(values.length / 2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        mean: mean,
        median: median,
        stdDev: stdDev
    };
}

// Show notification toast
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    const strength = {
        score: 0,
        message: '',
        isValid: password.length >= minLength
    };
    
    if (password.length >= minLength) strength.score += 25;
    if (hasUpperCase && hasLowerCase) strength.score += 25;
    if (hasNumbers) strength.score += 25;
    if (hasSpecialChar) strength.score += 25;
    
    if (strength.score < 50) strength.message = 'Weak';
    else if (strength.score < 75) strength.message = 'Medium';
    else strength.message = 'Strong';
    
    return strength;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Download data as file
function downloadFile(data, filename, type = 'text/csv') {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Export data to CSV
function exportToCSV(data, filename = 'geniesugar-data.csv') {
    if (!data || data.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            return typeof value === 'string' && value.includes(',')
                ? `"${value.replace(/"/g, '""')}"`
                : value;
        }).join(','))
    ].join('\n');
    
    downloadFile(csvContent, filename, 'text/csv');
}

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ==================== EXPORT API INSTANCE ====================

const api = new GenieSugarAPI();

// Make API available globally
window.GenieSugarAPI = api;
window.apiUtils = {
    formatDate,
    formatTimeAgo,
    getGlucoseStatus,
    calculateStats,
    showNotification,
    validateEmail,
    validatePassword,
    formatNumber,
    downloadFile,
    exportToCSV,
    isAuthenticated,
    getCurrentUser,
    requireAuth
};

// Check authentication on page load (except for public pages)
document.addEventListener('DOMContentLoaded', function() {
    const publicPages = ['index.html', 'login.html', 'register.html', 'forgot-password.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (!publicPages.includes(currentPage) && !isAuthenticated()) {
        window.location.href = 'login.html';
    }
});

// Handle token expiration
window.addEventListener('storage', function(e) {
    if (e.key === 'token' && !e.newValue) {
        window.location.href = 'login.html';
    }
});