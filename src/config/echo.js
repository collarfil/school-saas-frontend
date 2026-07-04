import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make pusher-js available globally (required by Laravel Echo)
window.Pusher = Pusher;

// Get auth token from localStorage
const token = localStorage.getItem('token');

// Initialize Echo to connect to your Reverb server
const echo = new Echo({
    broadcaster: 'reverb',          // Tell Echo to use Reverb
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: 'http://localhost:8000/api/v1/broadcasting/auth',
    auth: {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    },
});

export default echo;