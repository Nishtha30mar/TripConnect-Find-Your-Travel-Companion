// DOM Elements
const resetForm = document.getElementById('resetForm');
const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
const resetButton = document.getElementById('resetButton');
const messageDiv = document.getElementById('message');
const passwordRequirements = document.getElementById('passwordRequirements');
const passwordMatchDiv = document.getElementById('passwordMatch');

// Password requirement elements
const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqLowercase = document.getElementById('req-lowercase');
const reqNumber = document.getElementById('req-number');
const reqSpecial = document.getElementById('req-special');

// Password match elements
const matchIcon = document.getElementById('matchIcon');
const matchText = document.getElementById('matchText');

// Form validation state
let isEmailValid = false;
let isPasswordValid = false;
let isPasswordMatch = false;

// Configuration - Update this with your actual login page URL
const LOGIN_PAGE_URL = 'login.html'; // Change this to your actual login page URL

// Toggle password visibility
toggleNewPasswordBtn.addEventListener('click', function() {
    togglePasswordVisibility(newPasswordInput, toggleNewPasswordBtn);
});

toggleConfirmPasswordBtn.addEventListener('click', function() {
    togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn);
});

function togglePasswordVisibility(inputField, toggleButton) {
    const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
    inputField.setAttribute('type', type);
    
    // Toggle eye icon
    const icon = toggleButton.querySelector('i');
    if (type === 'text') {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Validate email
emailInput.addEventListener('input', function() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    isEmailValid = emailRegex.test(email);
    updateResetButton();
    
    // Visual feedback for email
    if (email === '') {
        emailInput.style.borderColor = '';
        emailInput.classList.remove('error');
    } else if (isEmailValid) {
        emailInput.style.borderColor = '#21c08b';
        emailInput.classList.remove('error');
    } else {
        emailInput.style.borderColor = '#ff4757';
        emailInput.classList.add('error');
    }
});

// Validate new password
newPasswordInput.addEventListener('input', function() {
    const password = newPasswordInput.value;
    
    // Show password requirements when user starts typing
    if (password.length > 0) {
        passwordRequirements.style.display = 'block';
    } else {
        passwordRequirements.style.display = 'none';
    }
    
    // Check each requirement
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    // Update requirement indicators
    updateRequirement(reqLength, hasMinLength);
    updateRequirement(reqUppercase, hasUppercase);
    updateRequirement(reqLowercase, hasLowercase);
    updateRequirement(reqNumber, hasNumber);
    updateRequirement(reqSpecial, hasSpecial);
    
    // Check if all requirements are met
    isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
    
    // Visual feedback for password field
    if (password === '') {
        newPasswordInput.style.borderColor = '';
        newPasswordInput.classList.remove('error');
    } else if (isPasswordValid) {
        newPasswordInput.style.borderColor = '#21c08b';
        newPasswordInput.classList.remove('error');
    } else {
        newPasswordInput.style.borderColor = '#ff4757';
        newPasswordInput.classList.add('error');
    }
    
    updateResetButton();
    checkPasswordMatch();
});

function updateRequirement(element, condition) {
    if (condition) {
        element.classList.remove('requirement-not-met');
        element.classList.add('requirement-met');
        element.querySelector('i').className = 'fas fa-check';
    } else {
        element.classList.remove('requirement-met');
        element.classList.add('requirement-not-met');
        element.querySelector('i').className = 'fas fa-times';
    }
}

// Check password match
confirmPasswordInput.addEventListener('input', checkPasswordMatch);

function checkPasswordMatch() {
    const password = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword === '') {
        passwordMatchDiv.style.display = 'none';
        confirmPasswordInput.style.borderColor = '';
        confirmPasswordInput.classList.remove('error');
        isPasswordMatch = false;
    } else if (password === confirmPassword) {
        passwordMatchDiv.style.display = 'flex';
        passwordMatchDiv.className = 'password-match match';
        matchIcon.innerHTML = '<i class="fas fa-check"></i>';
        matchText.textContent = 'Passwords match';
        confirmPasswordInput.style.borderColor = '#21c08b';
        confirmPasswordInput.classList.remove('error');
        isPasswordMatch = true;
    } else {
        passwordMatchDiv.style.display = 'flex';
        passwordMatchDiv.className = 'password-match not-match';
        matchIcon.innerHTML = '<i class="fas fa-times"></i>';
        matchText.textContent = 'Passwords do not match';
        confirmPasswordInput.style.borderColor = '#ff4757';
        confirmPasswordInput.classList.add('error');
        isPasswordMatch = false;
    }
    
    updateResetButton();
}

// Update reset button state
function updateResetButton() {
    if (isEmailValid && isPasswordValid && isPasswordMatch) {
        resetButton.disabled = false;
        resetButton.style.cursor = 'pointer';
    } else {
        resetButton.disabled = true;
        resetButton.style.cursor = 'not-allowed';
    }
}

// Redirect to actual login page
function redirectToLoginPage() {
    // In a real app, you might want to pass some data to the login page
    // For example, you could use localStorage or URL parameters
    
    // Option 1: Pass email via URL parameter (useful for auto-filling)
    const email = emailInput.value.trim();
    let redirectUrl = LOGIN_PAGE_URL;
    
    if (email) {
        // Add email as URL parameter for auto-fill
        redirectUrl += `?email=${encodeURIComponent(email)}`;
    }
    
    // Option 2: Store in localStorage (cleared when login page loads it)
    if (email) {
        localStorage.setItem('reset_email', email);
        // Clear after 5 minutes in case login page doesn't load
        setTimeout(() => localStorage.removeItem('reset_email'), 5 * 60 * 1000);
    }
    
    // Show redirect message
    messageDiv.innerHTML = `
        <div class="redirect-message">
            <div class="redirect-icon">
                <i class="fas fa-external-link-alt"></i>
            </div>
            <h3>Redirecting to Login Page</h3>
            <p>You will be redirected to the login page in <span id="countdown">5</span> seconds...</p>
            <p class="redirect-note">If you are not redirected automatically, <a href="${redirectUrl}" id="manualRedirectLink">click here</a>.</p>
        </div>
    `;
    messageDiv.className = 'message info-message';
    messageDiv.style.display = 'block';
    
    // Start countdown
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown === 0) {
            clearInterval(countdownInterval);
            performRedirect(redirectUrl);
        }
    }, 1000);
    
    // Manual redirect link
    document.getElementById('manualRedirectLink').addEventListener('click', function(e) {
        e.preventDefault();
        clearInterval(countdownInterval);
        performRedirect(redirectUrl);
    });
}

// Perform the actual redirect
function performRedirect(url) {
    // You can add any cleanup or analytics here
    console.log('Redirecting to login page:', url);
    
    // Actual redirect - replace this with your preferred method
    window.location.href = url;
    
    // If you want to open in same tab (standard):
    // window.location.href = url;
    
    // If you want to open in new tab:
    // window.open(url, '_blank');
}

// Handle form submission
resetForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading state
    resetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting Password...';
    resetButton.disabled = true;
    
    // Simulate API call to reset password
    setTimeout(() => {
        // In a real app, you would send the data to your server
        const resetData = {
            email: emailInput.value.trim(),
            newPassword: newPasswordInput.value,
            timestamp: new Date().toISOString()
        };
        
        console.log('Password reset request:', resetData);
        
        // Show success message with redirect option
        messageDiv.innerHTML = `
            <div class="success-message-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Password Reset Successful!</h3>
                <p>Your password has been updated successfully.</p>
                <p>You can now login with your new password.</p>
                <div class="success-actions">
                    <button class="login-redirect-btn" id="goToLoginBtn">
                        <i class="fas fa-sign-in-alt"></i> Go to Login Now
                    </button>
                    <button class="stay-here-btn" id="stayHereBtn">
                        <i class="fas fa-times"></i> Stay Here
                    </button>
                </div>
            </div>
        `;
        messageDiv.className = 'message success-message';
        messageDiv.style.display = 'block';
        
        // Reset button
        resetButton.innerHTML = '<i class="fas fa-redo-alt"></i> Reset Password';
        resetButton.disabled = true;
        
        // Add event listeners for buttons
        document.getElementById('goToLoginBtn').addEventListener('click', redirectToLoginPage);
        document.getElementById('stayHereBtn').addEventListener('click', function() {
            messageDiv.style.display = 'none';
            // Optionally reset form after successful reset
            resetForm.reset();
            passwordRequirements.style.display = 'none';
            passwordMatchDiv.style.display = 'none';
            
            // Reset validation state
            isEmailValid = false;
            isPasswordValid = false;
            isPasswordMatch = false;
            
            // Reset border colors
            emailInput.style.borderColor = '';
            newPasswordInput.style.borderColor = '';
            confirmPasswordInput.style.borderColor = '';
            emailInput.classList.remove('error');
            newPasswordInput.classList.remove('error');
            confirmPasswordInput.classList.remove('error');
        });
        
    }, 2000);
});

// Update the "Back to Login" link in the footer
document.addEventListener('DOMContentLoaded', function() {
    // Update existing "Back to Login" link
    const backToLoginLink = document.querySelector('.links a[href="#"]');
    if (backToLoginLink && backToLoginLink.textContent.includes('Back to Login')) {
        backToLoginLink.href = LOGIN_PAGE_URL;
        backToLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            redirectToLoginPage();
        });
    }
    
    // Also update any other login links
    const loginLinks = document.querySelectorAll('a[href*="login"]');
    loginLinks.forEach(link => {
        if (link.getAttribute('href') === '#') {
            link.href = LOGIN_PAGE_URL;
        }
    });
});

// Add CSS for the success and redirect messages
const redirectStyles = `
    .success-message-content {
        text-align: center;
        padding: 10px;
    }
    
    .success-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #21c08b, #1f6fe5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
        font-size: 24px;
        color: white;
        animation: scaleIn 0.5s ease;
    }
    
    .success-message-content h3 {
        color: #21c08b;
        font-size: 20px;
        margin-bottom: 10px;
        font-weight: 600;
    }
    
    .success-message-content p {
        color: #c0c7e4;
        margin-bottom: 8px;
        font-size: 14px;
    }
    
    .success-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
    }
    
    .login-redirect-btn {
        flex: 2;
        padding: 12px;
        background: linear-gradient(135deg, #1f6fe5, #4f8dff);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .login-redirect-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(31, 111, 229, 0.4);
    }
    
    .stay-here-btn {
        flex: 1;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        color: #c0c7e4;
        border: 2px solid rgba(122, 145, 211, 0.4);
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .stay-here-btn:hover {
        border-color: #4f8dff;
        color: white;
        transform: translateY(-2px);
    }
    
    .redirect-message {
        text-align: center;
        padding: 10px;
    }
    
    .redirect-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #4f8dff, #1f6fe5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
        font-size: 24px;
        color: white;
        animation: pulse 2s infinite;
    }
    
    .redirect-message h3 {
        color: #4f8dff;
        font-size: 20px;
        margin-bottom: 10px;
        font-weight: 600;
    }
    
    .redirect-message p {
        color: #c0c7e4;
        margin-bottom: 8px;
        font-size: 14px;
    }
    
    .redirect-message span {
        font-weight: 700;
        color: #4f8dff;
        font-size: 16px;
    }
    
    .redirect-note {
        font-size: 13px !important;
        color: #a0a7c4 !important;
        margin-top: 15px !important;
        padding-top: 10px !important;
        border-top: 1px solid rgba(122, 145, 211, 0.3) !important;
    }
    
    .redirect-note a {
        color: #4f8dff;
        text-decoration: none;
        font-weight: 600;
    }
    
    .redirect-note a:hover {
        text-decoration: underline;
    }
    
    .info-message {
        background: rgba(79, 141, 255, 0.15);
        color: #4f8dff;
        border: 1px solid rgba(79, 141, 255, 0.3);
    }
    
    @keyframes scaleIn {
        from {
            transform: scale(0);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = redirectStyles;
document.head.appendChild(styleSheet);