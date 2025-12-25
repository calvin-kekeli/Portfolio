// ========================================
// PORTFOLIO VISITOR TRACKING SYSTEM
// Level 1: Google Analytics + WhatsApp Notifications
// ========================================

// ============ CONFIGURATION ============
const CONFIG = {
    // WhatsApp Notification Settings (CallMeBot)
    whatsapp: {
        enabled: true,  // Set to false to disable WhatsApp notifications
        apiKey: 'YOUR_API_KEY_HERE',  // Get from CallMeBot
        phoneNumber: '233559338519'  // Your phone number (country code + number, no + or spaces)
    },
    
    // Tracking Settings
    tracking: {
        trackOnce: true,  // Only track once per session
        saveLocally: true  // Save visitor data locally for admin dashboard
    }
};

// ============ VISITOR DATA COLLECTION ============
async function collectVisitorData() {
    try {
        // Get approximate location using IP
        const locationData = await fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .catch(() => ({
                city: 'Unknown',
                country: 'Unknown',
                country_code: 'XX',
                ip: 'Unknown'
            }));
        
        // Detect device type
        const userAgent = navigator.userAgent;
        let deviceType = 'Desktop';
        if (/Mobile|Android|iPhone/i.test(userAgent)) {
            deviceType = 'Mobile';
        } else if (/Tablet|iPad/i.test(userAgent)) {
            deviceType = 'Tablet';
        }
        
        // Get browser info
        let browserName = 'Unknown';
        if (userAgent.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
        } else if (userAgent.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
        } else if (userAgent.indexOf('Safari') > -1) {
            browserName = 'Safari';
        } else if (userAgent.indexOf('Edge') > -1) {
            browserName = 'Edge';
        }
        
        // Get current page
        const currentPage = window.location.pathname === '/' ? 'Home' : 
                           window.location.hash.replace('#', '') || 'Home';
        
        // Compile visitor data
        const visitorData = {
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            location: `${locationData.city}, ${locationData.country}`,
            country: locationData.country,
            countryCode: locationData.country_code,
            ip: locationData.ip,
            device: deviceType,
            browser: browserName,
            page: currentPage,
            referrer: document.referrer || 'Direct Traffic',
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language || 'Unknown'
        };
        
        return visitorData;
        
    } catch (error) {
        console.error('Error collecting visitor data:', error);
        return null;
    }
}

// ============ WHATSAPP NOTIFICATION ============
async function sendWhatsAppNotification(visitorData) {
    if (!CONFIG.whatsapp.enabled) {
        console.log('WhatsApp notifications disabled');
        return;
    }
    
    if (CONFIG.whatsapp.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('⚠️ WhatsApp API Key not configured. Skipping notification.');
        return;
    }
    
    try {
        // Format message for WhatsApp
        const message = `
🔔 *New Portfolio Visitor!*
━━━━━━━━━━━━━━━━━━━
📍 *Location:* ${visitorData.location}
🌍 *Country:* ${visitorData.countryCode}
⏰ *Time:* ${visitorData.time}
📱 *Device:* ${visitorData.device}
🌐 *Browser:* ${visitorData.browser}
📄 *Page:* ${visitorData.page}
🔗 *Source:* ${visitorData.referrer}
💻 *Screen:* ${visitorData.screenResolution}
🗣️ *Language:* ${visitorData.language}
━━━━━━━━━━━━━━━━━━━
        `.trim();
        
        // CallMeBot API endpoint
        const url = `https://api.callmebot.com/whatsapp.php?phone=${CONFIG.whatsapp.phoneNumber}&text=${encodeURIComponent(message)}&apikey=${CONFIG.whatsapp.apiKey}`;
        
        // Send notification
        const response = await fetch(url, { mode: 'no-cors' });
        
        console.log('✅ WhatsApp notification sent successfully!');
        
    } catch (error) {
        console.error('❌ Failed to send WhatsApp notification:', error);
    }
}

// ============ LOCAL STORAGE (For Admin Dashboard) ============
function saveVisitorLocally(visitorData) {
    if (!CONFIG.tracking.saveLocally) return;
    
    try {
        // Get existing visits
        const allVisits = JSON.parse(localStorage.getItem('all_visits') || '[]');
        
        // Add new visit
        allVisits.push(visitorData);
        
        // Keep only last 100 visits to avoid storage issues
        if (allVisits.length > 100) {
            allVisits.shift();
        }
        
        // Save back to localStorage
        localStorage.setItem('all_visits', JSON.stringify(allVisits));
        
        // Update visit counter
        const totalVisits = parseInt(localStorage.getItem('total_visits') || '0') + 1;
        localStorage.setItem('total_visits', totalVisits.toString());
        
        console.log(`📊 Visit #${totalVisits} recorded locally`);
        
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// ============ MAIN TRACKING FUNCTION ============
async function trackVisitor() {
    // Check if already tracked this session
    if (CONFIG.tracking.trackOnce && sessionStorage.getItem('visitor_tracked')) {
        console.log('✓ Visitor already tracked this session');
        return;
    }
    
    console.log('🔍 Tracking new visitor...');
    
    // Collect data
    const visitorData = await collectVisitorData();
    
    if (!visitorData) {
        console.error('Failed to collect visitor data');
        return;
    }
    
    // Display in console for debugging
    console.log('📊 Visitor Data:', visitorData);
    
    // Send WhatsApp notification
    await sendWhatsAppNotification(visitorData);
    
    // Save locally
    saveVisitorLocally(visitorData);
    
    // Mark as tracked for this session
    sessionStorage.setItem('visitor_tracked', 'true');
    
    // Also set a flag in localStorage for unique visitor tracking
    if (!localStorage.getItem('unique_visitor')) {
        localStorage.setItem('unique_visitor', 'true');
        console.log('🎉 New unique visitor!');
    } else {
        console.log('👋 Returning visitor!');
    }
    
    console.log('✅ Tracking complete!');
}

// ============ INITIALIZE TRACKING ============
// Wait for page to fully load before tracking
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisitor);
} else {
    trackVisitor();
}

// ============ ANALYTICS HELPER FUNCTIONS ============
// Export functions for admin dashboard
window.PortfolioAnalytics = {
    // Get all visits
    getAllVisits: function() {
        return JSON.parse(localStorage.getItem('all_visits') || '[]');
    },
    
    // Get total visit count
    getTotalVisits: function() {
        return parseInt(localStorage.getItem('total_visits') || '0');
    },
    
    // Get today's visits
    getTodayVisits: function() {
        const visits = this.getAllVisits();
        const today = new Date().toDateString();
        return visits.filter(v => new Date(v.timestamp).toDateString() === today);
    },
    
    // Get visits by country
    getVisitsByCountry: function() {
        const visits = this.getAllVisits();
        const byCountry = {};
        visits.forEach(v => {
            byCountry[v.country] = (byCountry[v.country] || 0) + 1;
        });
        return byCountry;
    },
    
    // Clear all data
    clearData: function() {
        if (confirm('Are you sure you want to clear all tracking data?')) {
            localStorage.removeItem('all_visits');
            localStorage.removeItem('total_visits');
            sessionStorage.removeItem('visitor_tracked');
            console.log('✅ All tracking data cleared');
        }
    }
};

// ============ CONSOLE MESSAGE ============
console.log('%c🛡️ Portfolio Tracking Active', 'color: #00ff9d; font-size: 16px; font-weight: bold;');
console.log('%cVisitor tracking and analytics enabled', 'color: #00b8ff; font-size: 12px;');
console.log('%cType PortfolioAnalytics in console to access analytics functions', 'color: #c0c0c0; font-size: 10px;');
