// Supabase configuration
const SUPABASE_URL = 'https://kpoldeocfcukimwcacvy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pfXmpK134vKVzWbpXbcnEQ_gpADCzDd';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage buckets
const STORAGE_BUCKETS = {
    DOCUMENTS: 'documents',
    IMAGES: 'images'
};

// Global state
window.appState = {
    user: null,
    currentPage: 'dashboard',
    loading: false,
    notifications: []
};

// Toast notification system
window.showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

// Loading overlay
window.showLoading = () => {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading"></div>';
    document.body.appendChild(overlay);
};

window.hideLoading = () => {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
};

// Format currency
window.formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Format date
window.formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};

// Format datetime
window.formatDateTime = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(date));
};