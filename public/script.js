// Shared JavaScript utilities for Spy Word Game

// Utility functions
const GameUtils = {
    // Format time in MM:SS format
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },

    // Validate nickname
    validateNickname(nickname) {
        if (!nickname || !nickname.trim()) {
            return 'Nickname is required';
        }
        
        if (nickname.trim().length > 20) {
            return 'Nickname must be 20 characters or less';
        }
        
        // Check for invalid characters
        if (!/^[a-zA-Z0-9\s\u00C0-\u017F\u0600-\u06FF]+$/.test(nickname.trim())) {
            return 'Nickname contains invalid characters';
        }
        
        return null;
    },

    // Sanitize text input
    sanitizeText(text) {
        return text.trim().replace(/[<>'"]/g, '');
    },

    // Generate random ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    // Format player count for display
    formatPlayerCount(count) {
        if (count === 0) return 'No players';
        if (count === 1) return '1 player';
        return `${count} players`;
    },

    // Calculate spy count based on total players
    calculateSpyCount(totalPlayers) {
        return Math.max(Math.floor(totalPlayers / 3), 1);
    },

    // Check if device is mobile
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Audio utilities
const AudioUtils = {
    context: null,

    async initialize() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            return true;
        } catch (error) {
            console.warn('Audio context initialization failed:', error);
            return false;
        }
    },

    playBeep(frequency = 800, duration = 200, volume = 0.3) {
        if (!this.context) return;

        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(volume, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration / 1000);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration / 1000);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    },

    playAlarmSequence() {
        if (!this.context) return;

        const frequencies = [800, 1000, 800, 1000, 800];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playBeep(freq, 300, 0.4);
            }, index * 400);
        });
    }
};

// Notification utilities
const NotificationUtils = {
    permission: 'default',

    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
            return this.permission === 'granted';
        }
        return false;
    },

    show(title, options = {}) {
        if (this.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/icon.png',
                badge: '/icon.png',
                tag: 'spy-game',
                requireInteraction: true,
                ...options
            });

            // Auto-close after 10 seconds
            setTimeout(() => {
                notification.close();
            }, 10000);

            return notification;
        }
        return null;
    }
};

// Storage utilities
const StorageUtils = {
    set(key, value) {
        try {
            localStorage.setItem(`spy_game_${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Storage set failed:', error);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`spy_game_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Storage get failed:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(`spy_game_${key}`);
            return true;
        } catch (error) {
            console.warn('Storage remove failed:', error);
            return false;
        }
    },

    clear() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('spy_game_'));
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.warn('Storage clear failed:', error);
            return false;
        }
    }
};

// UI utilities
const UIUtils = {
    showMessage(elementId, message, type = 'info', duration = 5000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = message;
        element.className = `${type}-message`;
        element.style.display = 'block';

        if (duration > 0) {
            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        }
    },

    hideMessage(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },

    toggleElement(elementId, show = null) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (show === null) {
            element.classList.toggle('hidden');
        } else if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    },

    updateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    },

    updateHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    },

    setLoading(elementId, loading = true) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (loading) {
            element.disabled = true;
            const spinner = '<span class="spinner"></span> ';
            if (!element.innerHTML.includes('spinner')) {
                element.innerHTML = spinner + element.textContent;
            }
        } else {
            element.disabled = false;
            element.innerHTML = element.textContent.replace(/^.*spinner.*>\s*/, '');
        }
    }
};

// Connection utilities
const ConnectionUtils = {
    isOnline: navigator.onLine,
    listeners: [],

    initialize() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyListeners('online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyListeners('offline');
        });
    },

    addListener(callback) {
        this.listeners.push(callback);
    },

    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    },

    notifyListeners(status) {
        this.listeners.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.warn('Connection listener error:', error);
            }
        });
    }
};

// Initialize utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ConnectionUtils.initialize();
    NotificationUtils.requestPermission();
    AudioUtils.initialize();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameUtils,
        AudioUtils,
        NotificationUtils,
        StorageUtils,
        UIUtils,
        ConnectionUtils
    };
}