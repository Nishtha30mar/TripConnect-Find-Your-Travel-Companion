// DOM Elements
const form = document.getElementById('signupForm');
const sections = document.querySelectorAll('.form-section');
const steps = document.querySelectorAll('.step');
const successMessage = document.getElementById('successMessage');

const currentDate = new Date();
const maxDob = new Date(
  currentDate.getFullYear() - 18,
  currentDate.getMonth(),
  currentDate.getDate()
);

// INIT
document.addEventListener('DOMContentLoaded', () => {
  const dobInput = document.getElementById('dob');
  if (dobInput) {
    dobInput.max = maxDob.toISOString().split('T')[0];
  }

  setupEventListeners();
});

// EVENT LISTENERS
function setupEventListeners() {
  // Password toggle
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const icon = btn.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });

  // Gender selection
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gender-btn')
        .forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      clearError('genderError');
    });
  });

  // Real-time validation for fields
  document.getElementById('user_id').addEventListener('input', validateUserId);
  document.getElementById('name').addEventListener('input', validateName);
  document.getElementById('email').addEventListener('input', validateEmail);
  document.getElementById('phone_number').addEventListener('input', validatePhone);
  document.getElementById('dob').addEventListener('change', validateDOB);
  document.getElementById('location').addEventListener('change', validateLocation);
  document.getElementById('password').addEventListener('input', validatePassword);
  document.getElementById('confirmPassword').addEventListener('input', validateConfirmPassword);
  document.getElementById('terms').addEventListener('change', validateTerms);
}

// FORM SUBMISSION HANDLER
form.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Validate all sections before submission
  if (!validateAllSections()) {
    // Go to first section with error
    const firstErrorSection = findFirstErrorSection();
    if (firstErrorSection) {
      currentSectionIndex = firstErrorSection;
      showSection(currentSectionIndex);
    }
    return;
  }

  // Collect form data
  const data = {
    user_id: document.getElementById('user_id').value.trim(),
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone_number: document.getElementById('phone_number').value.trim(),
    password: document.getElementById('password').value,
    dob: document.getElementById('dob').value,
    gender: document.querySelector('.gender-btn.selected')?.dataset.value || '',
    location: document.getElementById('location').value
  };

  const submitBtn = document.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Signup failed. Please try again.');
    }

    // ========== CHANGE 1: STORE TOKEN AND USER DATA ==========
    if (result.token && result.user) {
      localStorage.setItem('tripconnect_auth_token', result.token);
      localStorage.setItem('tripconnect_user_data', JSON.stringify(result.user));
    }
    
    // SUCCESS: Show success message
    showSuccessMessage(data);
    
    // ========== CHANGE 2: UPDATE AUTH STATE ==========
    setAuthState(true, true); // User is both signed up AND logged in
    
  } catch (error) {
    alert(`Error: ${error.message}`);
    console.error('Signup error:', error);
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

/* ---------- VALIDATION FUNCTIONS ---------- */

function validateAllSections() {
  const section1Valid = validateSection1();
  const section2Valid = validateSection2();
  const section3Valid = validateSection3();
  
  return section1Valid && section2Valid && section3Valid;
}

function validateCurrentSection() {
  switch(currentSectionIndex) {
    case 1: return validateSection1();
    case 2: return validateSection2();
    case 3: return validateSection3();
    default: return false;
  }
}

function validateSection1() {
  const userIdValid = validateUserId();
  const nameValid = validateName();
  const emailValid = validateEmail();
  const phoneValid = validatePhone();
  
  return userIdValid && nameValid && emailValid && phoneValid;
}

function validateSection2() {
  const dobValid = validateDOB();
  const genderValid = validateGender();
  const locationValid = validateLocation();
  
  return dobValid && genderValid && locationValid;
}

function validateSection3() {
  const passwordValid = validatePassword();
  const confirmPasswordValid = validateConfirmPassword();
  const termsValid = validateTerms();
  
  return passwordValid && confirmPasswordValid && termsValid;
}

// Individual field validations
function validateUserId() {
  const userId = document.getElementById('user_id').value.trim();
  const errorElement = document.getElementById('user_idError');
  
  if (!userId) {
    showError(errorElement, 'User ID is required');
    return false;
  }
  
  if (userId.length < 4 || userId.length > 20) {
    showError(errorElement, 'Must be 4-20 characters');
    return false;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
    showError(errorElement, 'Only letters, numbers, and underscores allowed');
    return false;
  }
  
  clearError('user_idError');
  return true;
}

function validateName() {
  const name = document.getElementById('name').value.trim();
  const errorElement = document.getElementById('nameError');
  
  if (!name) {
    showError(errorElement, 'Full name is required');
    return false;
  }
  
  if (name.length < 2) {
    showError(errorElement, 'Name must be at least 2 characters');
    return false;
  }
  
  clearError('nameError');
  return true;
}

function validateEmail() {
  const email = document.getElementById('email').value.trim();
  const errorElement = document.getElementById('emailError');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    showError(errorElement, 'Email is required');
    return false;
  }
  
  if (!emailRegex.test(email)) {
    showError(errorElement, 'Invalid email format');
    return false;
  }
  
  clearError('emailError');
  return true;
}

function validatePhone() {
  const phone = document.getElementById('phone_number').value.trim();
  const errorElement = document.getElementById('phone_numberError');
  const phoneRegex = /^[6-9]\d{9}$/;
  
  if (!phone) {
    showError(errorElement, 'Mobile number is required');
    return false;
  }
  
  if (!phoneRegex.test(phone)) {
    showError(errorElement, 'Invalid 10-digit Indian mobile number');
    return false;
  }
  
  clearError('phone_numberError');
  return true;
}

function validateDOB() {
  const dob = document.getElementById('dob').value;
  const errorElement = document.getElementById('dobError');
  
  if (!dob) {
    showError(errorElement, 'Date of birth is required');
    return false;
  }
  
  const birthDate = new Date(dob);
  const age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  
  if (age < 18 || (age === 18 && monthDiff < 0)) {
    showError(errorElement, 'You must be at least 18 years old');
    return false;
  }
  
  clearError('dobError');
  return true;
}

function validateGender() {
  const genderSelected = document.querySelector('.gender-btn.selected');
  const errorElement = document.getElementById('genderError');
  
  if (!genderSelected) {
    showError(errorElement, 'Please select a gender');
    return false;
  }
  
  clearError('genderError');
  return true;
}

function validateLocation() {
  const location = document.getElementById('location').value;
  const errorElement = document.getElementById('locationError');
  
  if (!location) {
    showError(errorElement, 'Please select your location');
    return false;
  }
  
  clearError('locationError');
  return true;
}

function validatePassword() {
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('passwordError');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  
  if (!password) {
    showError(errorElement, 'Password is required');
    updatePasswordStrength(0, 'Weak');
    return false;
  }
  
  if (password.length < 8) {
    showError(errorElement, 'Minimum 8 characters required');
    updatePasswordStrength(0, 'Weak');
    return false;
  }
  
  // Password strength calculation
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const widthLevels = ['20%', '40%', '60%', '80%', '100%'];
  const colorLevels = ['#ff4444', '#ffbb33', '#ffbb33', '#00C851', '#00C851'];
  
  updatePasswordStrength(widthLevels[strength - 1], strengthLevels[strength - 1], colorLevels[strength - 1]);
  
  clearError('passwordError');
  return true;
}

function updatePasswordStrength(width, text, color = '#ff4444') {
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  
  if (strengthBar) strengthBar.style.width = width || '0%';
  if (strengthBar) strengthBar.style.backgroundColor = color;
  if (strengthText) strengthText.textContent = text || 'Password strength';
}

function validateConfirmPassword() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorElement = document.getElementById('confirmPasswordError');
  
  if (!confirmPassword) {
    showError(errorElement, 'Please confirm your password');
    return false;
  }
  
  if (password !== confirmPassword) {
    showError(errorElement, 'Passwords do not match');
    return false;
  }
  
  clearError('confirmPasswordError');
  return true;
}

function validateTerms() {
  const termsChecked = document.getElementById('terms').checked;
  const errorElement = document.getElementById('termsError');
  
  if (!termsChecked) {
    showError(errorElement, 'You must accept the terms and conditions');
    return false;
  }
  
  clearError('termsError');
  return true;
}

// Helper functions for error handling
function showError(element, message) {
  if (element) {
    element.style.display = 'flex';
    const span = element.querySelector('span');
    if (span) span.textContent = message;
  }
}

function clearError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
  }
}

function findFirstErrorSection() {
  if (!validateSection1()) return 1;
  if (!validateSection2()) return 2;
  if (!validateSection3()) return 3;
  return null;
}

/* ---------- NAVIGATION ---------- */

let currentSectionIndex = 1;

function showSection(index) {
  currentSectionIndex = index;
  sections.forEach(s => s.classList.remove('active'));
  steps.forEach(st => st.classList.remove('active'));

  document.getElementById(`section${index}`).classList.add('active');
  document.querySelector(`.step[data-step="${index}"]`).classList.add('active');
}

function nextSection() {
  if (!validateCurrentSection()) return;
  if (currentSectionIndex < 3) {
    currentSectionIndex++;
    showSection(currentSectionIndex);
  }
}

function prevSection() {
  if (currentSectionIndex > 1) {
    currentSectionIndex--;
    showSection(currentSectionIndex);
  }
}

/* ---------- SUCCESS MESSAGE ---------- */

function showSuccessMessage(data) {
  // Hide all form sections
  sections.forEach(section => {
    section.style.display = 'none';
  });
  
  // Hide progress steps
  document.querySelector('.progress-steps').style.display = 'none';
  
  // Show success message
  successMessage.style.display = 'block';
  
  // ========== CHANGE 3: ADD EXPLORE INDIA LINK CLICK HANDLER ==========
  // Update the Explore India button to use proper auth state
  const exploreBtn = document.querySelector('.success-message .nav-btn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', function(e) {
      setAuthState(true, true);
    });
  }
  
  // Populate success details
  document.getElementById('successDetails').innerHTML = `
    <div class="success-detail-item">
      <i class="fas fa-user"></i>
      <span><strong>User ID:</strong> ${data.user_id}</span>
    </div>
    <div class="success-detail-item">
      <i class="fas fa-envelope"></i>
      <span><strong>Email:</strong> ${data.email}</span>
    </div>
    <div class="success-detail-item">
      <i class="fas fa-phone"></i>
      <span><strong>Phone:</strong> +91 ${data.phone_number}</span>
    </div>
    <div class="success-detail-item">
      <i class="fas fa-city"></i>
      <span><strong>City:</strong> ${data.location}</span>
    </div>
  `;
}