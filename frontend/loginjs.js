class TripConnectLogin {
    constructor() {
        this.API_URL = 'http://localhost:5000/api/auth/login';
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.loginForm = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePassword = document.getElementById('togglePassword');
        this.submitBtn = document.getElementById('submitBtn');
        this.btnText = document.getElementById('btnText');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.emailError = document.getElementById('emailError');
        this.passwordError = document.getElementById('passwordError');
        this.successMessage = document.getElementById('successMessage');
    }

    initEventListeners() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        const icon = this.togglePassword.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        // Simple validation
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Admin login
        if (email === 'admin@gmail.com' && password === 'Admin04@123') {
            this.handleAdminLogin();
            return;
        }

        this.setLoadingState(true);

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            // Store auth data
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // ✅ UPDATED: Store username for travel_preferences table
            // First try to get username from API response
            // If not available, use the full email without domain
            let username = '';
            
            if (result.user?.username) {
                // If API returns username directly
                username = result.user.username;
            } else {
                // Extract from email - keep the full local part including any underscores
                username = email.split('@')[0];
            }
            
            localStorage.setItem('username', username);
            
            // Also store the email for reference
            localStorage.setItem('userEmail', email);

            // Keep old auth state for backward compatibility
            localStorage.setItem('tripConnectAuth', JSON.stringify({
                signedUp: true,
                loggedIn: true
            }));

            console.log('✅ Login successful - Username stored:', username);
            console.log('✅ Email stored:', email);

            // Show success
            this.showSuccess();

            // Redirect to main page
            setTimeout(() => {
                window.location.href = 'newindex.html';
            }, 2000);

        } catch (error) {
            alert(error.message);
            this.setLoadingState(false);
        }
    }

    handleAdminLogin() {
        this.setLoadingState(true);

        // Simulate API delay
        setTimeout(() => {
            // Store admin data
            localStorage.setItem('token', 'admin_token_' + Date.now());
            localStorage.setItem('user', JSON.stringify({
                id: 'admin_001',
                email: 'admin@gmail.com',
                name: 'Administrator',
                role: 'admin',
                isAdmin: true
            }));
            
            // Store admin username
            localStorage.setItem('username', 'admin');
            localStorage.setItem('userEmail', 'admin@gmail.com');

            localStorage.setItem('tripConnectAuth', JSON.stringify({
                signedUp: true,
                loggedIn: true,
                isAdmin: true
            }));

            console.log('✅ Admin login successful - Username stored: admin');

            // Show success
            this.showSuccess();

            // Update success message for admin
            const successText = document.querySelector('.success-text');
            const successIcon = document.querySelector('.success-icon i');
            const dashboardLink = document.getElementById('dashboardLink');

            if (successText) {
                successText.textContent = 'Admin login successful! Redirecting to admin panel...';
            }

            if (successIcon) {
                successIcon.className = 'fas fa-user-shield';
            }

            if (dashboardLink) {
                dashboardLink.href = 'admin.html';
                dashboardLink.innerHTML = 'Go to Admin Panel <i class="fas fa-arrow-right"></i>';
            }

            // Redirect to admin page
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 2000);
        }, 1000);
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.submitBtn.disabled = true;
            this.loadingSpinner.classList.add('active');
            this.btnText.style.opacity = '0.3';
        } else {
            this.submitBtn.disabled = false;
            this.loadingSpinner.classList.remove('active');
            this.btnText.style.opacity = '1';
        }
    }

    showSuccess() {
        if (this.loginForm) this.loginForm.style.display = 'none';
        if (this.successMessage) this.successMessage.style.display = 'block';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new TripConnectLogin();
});