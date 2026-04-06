// profile.js - NEW FILE
(function() {
    'use strict';
    
    // Wait for page to load completely
    window.addEventListener('load', function() {
        // Wait 1.5 seconds to ensure page loads completely
        setTimeout(function() {
            // Get user data from localStorage
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            
            console.log('Profile.js: Checking login status...');
            console.log('Token exists:', !!token);
            console.log('User data exists:', !!userData);
            
            if (token && userData) {
                try {
                    // Parse the user data
                    const user = JSON.parse(userData);
                    console.log('User data found:', user);
                    
                    // Find the profile name element
                    const profileElement = document.querySelector('.profile-name');
                    console.log('Profile element found:', !!profileElement);
                    
                    // Update profile name if element exists and user has name
                    if (profileElement && user.name) {
                        profileElement.textContent = user.name;
                        console.log('✅ Profile name updated to:', user.name);
                    }
                    
                    // Optional: Try to fetch fresh profile data (silently)
                    fetchFreshProfile(token);
                    
                } catch (error) {
                    console.log('❌ Error parsing user data:', error);
                }
            } else {
                console.log('User not logged in or data missing');
            }
        }, 1500); // 1.5 second delay to avoid conflicts
    });
    
    // Function to fetch fresh profile data from backend (optional)
    async function fetchFreshProfile(token) {
        try {
            console.log('Trying to fetch fresh profile data...');
            
            const response = await fetch('http://localhost:5000/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Fresh profile response:', data);
                
                if (data.success && data.user) {
                    // Update localStorage with fresh data
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Update UI if needed
                    const profileElement = document.querySelector('.profile-name');
                    if (profileElement && data.user.name) {
                        profileElement.textContent = data.user.name;
                        console.log('✅ Fresh profile data loaded:', data.user.name);
                    }
                }
            } else {
                console.log('Profile endpoint returned error:', response.status);
            }
        } catch (error) {
            // Silently fail - use localStorage data
            console.log('⚠️ Using cached profile data (backend not reachable)');
        }
    }
})();