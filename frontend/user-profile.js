// TripConnect Profile App - Dynamic User Data with Reviews
const TripConnectApp = {
    currentUser: null,
    cancelTripData: null,
    userTrips: [],
    userReviews: [],
    reviewTripData: null,
    elements: {},
    apiBaseUrl: 'http://localhost:5000/api',
    
    init: async function() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            this.showNotification('Please login to view your profile', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }
        
        await this.loadUserDataFromBackend();
        this.cacheElements();
        this.bindEvents();
        this.updateUI();
        
        // Fetch all data from database
        await this.fetchUserTrips();
        await this.fetchUserReviews();
        
        this.showNotification(`Welcome back, ${this.currentUser?.name || 'Explorer'}!`, 'success');
    },
    
    loadUserDataFromBackend: async function() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No authentication token');
            }
            
            console.log('Fetching user profile from backend...');
            
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('tripconnect_user_data');
                    window.location.href = 'index.html';
                    return;
                }
                throw new Error(`HTTP ${response.status}: Failed to fetch user data`);
            }
            
            const data = await response.json();
            console.log('User data received:', data);
            
            if (data.success && data.user) {
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                localStorage.setItem('tripconnect_user_data', JSON.stringify(this.currentUser));
            } else {
                throw new Error('Invalid user data received');
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            const savedUserData = localStorage.getItem('user') || localStorage.getItem('tripconnect_user_data');
            
            if (savedUserData) {
                this.currentUser = JSON.parse(savedUserData);
                console.log('Using cached user data:', this.currentUser);
                this.showNotification('Using cached profile data', 'warning');
            } else {
                this.showNotification('Failed to load user profile. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                throw error;
            }
        }
        
        this.ensureUserDataComplete();
    },
    
    ensureUserDataComplete: function() {
        if (!this.currentUser) return;
        
        if (!this.currentUser.avatar) {
            this.currentUser.avatar = this.getAvatarByGender(this.currentUser.gender);
        }
        
        if (!this.currentUser.bio) {
            this.currentUser.bio = "";
        }
        
        if (this.currentUser.dob) {
            this.currentUser.dobDisplay = this.formatDateForDisplay(this.currentUser.dob);
        } else {
            this.currentUser.dobDisplay = "Not specified";
        }
        
        if (this.currentUser.phone_number && this.currentUser.phone_number.length >= 10) {
            const lastFour = this.currentUser.phone_number.slice(-4);
            this.currentUser.phone_display = `+91 ******${lastFour}`;
        } else if (this.currentUser.phone_number) {
            this.currentUser.phone_display = this.currentUser.phone_number;
        } else {
            this.currentUser.phone_display = "+91 **********";
        }
        
        if (!this.currentUser.location) {
            this.currentUser.location = "Location not specified";
        }
        
        if (!this.currentUser.name) {
            this.currentUser.name = "Traveler";
        }
        
        if (!this.currentUser.gender) {
            this.currentUser.gender = "not-specified";
        }
        
        if (!this.currentUser.status) {
            this.currentUser.status = "active";
        }
        
        this.currentUser.lastLogin = new Date().toISOString();
        
        localStorage.setItem('tripconnect_user_data', JSON.stringify(this.currentUser));
        localStorage.setItem('user', JSON.stringify(this.currentUser));
    },
    
    getAvatarByGender: function(gender) {
        const avatars = {
            'male': 'https://tse1.mm.bing.net/th/id/OIP.lcdOc6CAIpbvYx3XHfoJ0gHaF3?pid=Api&P=0&h=180',
            'female': 'https://tse4.mm.bing.net/th/id/OIP.yP_HiPv-FDJYde1k6hPuhgHaHa?pid=Api&P=0&h=180',
            'other': 'https://tse3.mm.bing.net/th/id/OIP.fUcwq5UuPqD7nW1VHS0nygHaHa?pid=Api&P=0&h=180'
        };
        return avatars[gender] || avatars['male'];
    },
    
    // Fetch user's trips from the database
    fetchUserTrips: async function() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.log('No authentication token found');
                this.renderTrips([]);
                return;
            }
            
            console.log('Fetching trips for user:', this.currentUser?.user_id);
            
            // Using the correct endpoint from your backend
            const response = await fetch(`${this.apiBaseUrl}/groups/user/all-active`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Session expired');
                }
                throw new Error(`HTTP ${response.status}: Failed to fetch trips`);
            }
            
            const data = await response.json();
            console.log('Trips response from database:', data);
            
            if (data.success && data.groups) {
                this.userTrips = data.groups;
                this.renderTrips(this.userTrips);
            } else {
                this.userTrips = [];
                this.renderTrips([]);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
            this.renderTrips([]);
            if (error.message === 'Session expired') {
                this.showNotification('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    this.handleLogout();
                }, 2000);
            } else {
                this.showNotification('Could not load your trips', 'warning');
            }
        }
    },
    
    renderTrips: function(trips) {
        const tripsContainer = document.getElementById('trips-container');
        if (!tripsContainer) return;
        
        if (!trips || trips.length === 0) {
            tripsContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 40px;">
                    <i class="fas fa-suitcase-rolling" style="font-size: 64px; color: var(--gray); margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3 style="color: var(--gray-dark); margin-bottom: 10px;">No Trips Yet</h3>
                    <p style="color: var(--gray); margin-bottom: 25px;">You haven't joined any trips yet. Explore packages and join exciting journeys!</p>
                    <button class="btn btn-primary" onclick="window.location.href='newindex.html'" style="margin-top: 10px;">
                        <i class="fas fa-search"></i> Explore Packages
                    </button>
                </div>
            `;
            return;
        }
        
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        let tripsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="color: var(--dark-blue);">
                    <i class="fas fa-suitcase-rolling"></i> My Travel Trips
                </h3>
                <span style="background: var(--light-blue); padding: 5px 12px; border-radius: 20px; font-size: 14px;">
                    ${trips.length} Trip${trips.length > 1 ? 's' : ''}
                </span>
            </div>
        `;
        
        trips.forEach(trip => {
            let status = 'upcoming';
            let statusText = 'Upcoming';
            let statusClass = 'trip-upcoming';
            let canCancel = true;
            let canReview = false;
            
            // Determine trip status based on dates
            if (trip.start_date && trip.end_date) {
                const startDate = new Date(trip.start_date);
                const endDate = new Date(trip.end_date);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                
                if (endDate < currentDate) {
                    status = 'completed';
                    statusText = 'Completed';
                    statusClass = 'trip-completed';
                    canCancel = false;
                    canReview = true;
                } else if (startDate <= currentDate && endDate >= currentDate) {
                    status = 'ongoing';
                    statusText = 'Ongoing';
                    statusClass = 'trip-upcoming';
                    canCancel = false;
                }
            }
            
            let formattedStartDate = 'Date TBD';
            let formattedEndDate = 'Date TBD';
            
            if (trip.start_date) {
                const startDate = new Date(trip.start_date);
                formattedStartDate = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            
            if (trip.end_date) {
                const endDate = new Date(trip.end_date);
                formattedEndDate = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            
            // Check if already reviewed
            const alreadyReviewed = this.userReviews.some(review => review.group_id === trip.group_id);
            
            // Get member count
            const memberCount = trip.members_count || trip.member_count || 1;
            
            tripsHTML += `
                <div class="trip-card" data-trip-id="${trip.group_id}">
                    <div class="trip-actions">
                        ${canCancel && status !== 'completed' && status !== 'ongoing' ? `
                            <button class="btn btn-danger btn-small cancel-trip-btn" data-trip-name="${this.escapeHtml(trip.destination)}" data-trip-id="${trip.group_id}">
                                <i class="fas fa-times"></i> Cancel Trip
                            </button>
                        ` : status === 'completed' && canReview && !alreadyReviewed ? `
                            <button class="btn btn-primary btn-small add-review-btn" data-trip-id="${trip.group_id}" data-trip-name="${this.escapeHtml(trip.destination)}">
                                <i class="fas fa-star"></i> Write a Review
                            </button>
                        ` : status === 'completed' && alreadyReviewed ? `
                            <button class="btn btn-secondary btn-small" disabled>
                                <i class="fas fa-check-circle"></i> Review Submitted
                            </button>
                        ` : `
                            <button class="btn btn-secondary btn-small" disabled>
                                <i class="fas ${status === 'completed' ? 'fa-check-circle' : 'fa-ban'}"></i> 
                                ${status === 'completed' ? 'Completed' : status === 'ongoing' ? 'Ongoing' : 'Cannot Cancel'}
                            </button>
                        `}
                    </div>
                    <h4>${this.escapeHtml(trip.destination || 'Trip to Paradise')}</h4>
                    <div class="trip-details">
                        <span><i class="far fa-calendar"></i> ${formattedStartDate} - ${formattedEndDate}</span>
                        <span><i class="fas fa-users"></i> ${memberCount} Traveler${memberCount > 1 ? 's' : ''}</span>
                        ${trip.status ? `
                            <span><i class="fas fa-info-circle"></i> ${trip.status}</span>
                        ` : ''}
                    </div>
                    <p>${this.escapeHtml(this.generateTripDescription(trip))}</p>
                    ${trip.average_match_score ? `
                        <div style="margin-top: 12px; margin-bottom: 12px;">
                            <span style="background: var(--light-blue); padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                                <i class="fas fa-heart" style="color: var(--primary-color);"></i> Group Match Score: ${Math.round(trip.average_match_score)}%
                            </span>
                        </div>
                    ` : ''}
                    <span class="trip-status ${statusClass}">${statusText}</span>
                </div>
            `;
        });
        
        tripsContainer.innerHTML = tripsHTML;
        
        // Re-bind cancel trip buttons
        document.querySelectorAll('.cancel-trip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showCancelTripModal(e));
        });
        
        // Bind review buttons
        document.querySelectorAll('.add-review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showReviewModal(e));
        });
    },
    
    generateTripDescription: function(trip) {
        if (trip.destination) {
            return `Join us for an amazing ${trip.destination} adventure! ${trip.common_interests_count ? `${trip.common_interests_count} common interests shared with group members.` : 'Experience the journey with fellow travelers.'}`;
        }
        return 'Join us for an amazing travel experience with fellow explorers!';
    },
    
    fetchUserReviews: async function() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token || !this.currentUser) {
                this.renderReviews([]);
                return;
            }
            
            console.log('Fetching reviews for user:', this.currentUser.user_id);
            
            const response = await fetch(`${this.apiBaseUrl}/reviews/user/${this.currentUser.user_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 401) {
                console.log('Token expired');
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }
            
            const data = await response.json();
            console.log('Reviews response:', data);
            
            if (data.success) {
                this.userReviews = data.reviews || [];
                this.renderReviews(this.userReviews);
            } else {
                this.userReviews = [];
                this.renderReviews([]);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            this.userReviews = [];
            this.renderReviews([]);
        }
    },
    
    renderReviews: function(reviews) {
        const reviewsContainer = document.getElementById('reviews-container');
        if (!reviewsContainer) return;
        
        if (!reviews || reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 40px;">
                    <i class="fas fa-star" style="font-size: 64px; color: var(--gray); margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3 style="color: var(--gray-dark); margin-bottom: 10px;">No Reviews Yet</h3>
                    <p style="color: var(--gray);">You haven't written any reviews yet. Complete a trip and share your experience!</p>
                </div>
            `;
            return;
        }
        
        let reviewsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="color: var(--dark-blue);">
                    <i class="fas fa-star"></i> My Travel Reviews
                </h3>
                <span style="background: var(--light-blue); padding: 5px 12px; border-radius: 20px; font-size: 14px;">
                    ${reviews.length} Review${reviews.length > 1 ? 's' : ''}
                </span>
            </div>
        `;
        
        reviews.forEach(review => {
            const stars = this.renderStars(review.rating);
            
            reviewsHTML += `
                <div class="review-card">
                    <div class="review-header">
                        <h4>${this.escapeHtml(review.trip_name || review.trip_destination || 'Trip')}</h4>
                        <div class="review-rating">${stars}</div>
                    </div>
                    <div class="review-date">
                        <i class="far fa-calendar"></i> ${this.formatDateForDisplay(review.created_at)}
                    </div>
                    <p class="review-text">${this.escapeHtml(review.review_text)}</p>
                    ${review.trip_destination ? `
                        <div class="review-trip-detail">
                            <i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(review.trip_destination)}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        reviewsContainer.innerHTML = reviewsHTML;
    },
    
    renderStars: function(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star" style="color: #fbbf24;"></i>';
            } else {
                stars += '<i class="far fa-star" style="color: #d1d5db;"></i>';
            }
        }
        return stars;
    },
    
    formatDateForDisplay: function(dateString) {
        if (!dateString) return "Not specified";
        
        try {
            let date;
            if (dateString.includes('-')) {
                date = new Date(dateString);
            } else {
                date = new Date(dateString);
            }
            
            if (isNaN(date.getTime())) {
                return dateString;
            }
            
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            return date.toLocaleDateString('en-IN', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    capitalizeFirstLetter: function(string) {
        if (!string) return 'Not specified';
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    cacheElements: function() {
        this.elements.profileName = document.getElementById('profile-name');
        this.elements.profileEmail = document.getElementById('profile-email');
        this.elements.profilePhone = document.getElementById('profile-phone');
        this.elements.profileLocation = document.getElementById('profile-location');
        this.elements.profileDob = document.getElementById('profile-dob');
        this.elements.profileGender = document.getElementById('profile-gender');
        this.elements.profileAvatar = document.getElementById('profile-avatar');
        
        this.elements.profileForm = document.getElementById('profile-form');
        this.elements.bio = document.getElementById('bio');
        
        this.elements.dashboardBtn = document.getElementById('dashboard-btn');
        this.elements.profileBtn = document.getElementById('profile-btn');
        this.elements.logoutBtn = document.getElementById('logout-btn');
        this.elements.cancelEditBtn = document.getElementById('cancel-edit');
        this.elements.avatarUploadBtn = document.getElementById('avatar-upload-btn');
        this.elements.avatarInput = document.getElementById('avatar-input');
        
        this.elements.cancelTripModal = document.getElementById('cancel-trip-modal');
        this.elements.closeCancelModal = document.getElementById('close-cancel-modal');
        this.elements.cancelTripNo = document.getElementById('cancel-trip-no');
        this.elements.cancelTripYes = document.getElementById('cancel-trip-yes');
        this.elements.cancelTripMessage = document.getElementById('cancel-trip-message');
        
        this.elements.reviewModal = document.getElementById('review-modal');
        this.elements.closeReviewModal = document.getElementById('close-review-modal');
        this.elements.cancelReview = document.getElementById('cancel-review');
        this.elements.submitReview = document.getElementById('submit-review');
        this.elements.reviewText = document.getElementById('review-text');
        this.elements.reviewRating = document.getElementById('review-rating');
    },
    
    bindEvents: function() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e));
        });
        
        if (this.elements.profileForm) {
            this.elements.profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }
        
        if (this.elements.cancelEditBtn) {
            this.elements.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        }
        
        if (this.elements.avatarUploadBtn && this.elements.avatarInput) {
            this.elements.avatarUploadBtn.addEventListener('click', () => {
                this.elements.avatarInput.click();
            });
            
            this.elements.avatarInput.addEventListener('change', (e) => this.updateAvatar(e));
        }
        
        if (this.elements.profileBtn) {
            this.elements.profileBtn.addEventListener('click', (e) => this.goToProfile(e));
        }
        
        if (this.elements.closeCancelModal) {
            this.elements.closeCancelModal.addEventListener('click', () => this.closeModal());
        }
        if (this.elements.cancelTripNo) {
            this.elements.cancelTripNo.addEventListener('click', () => this.closeModal());
        }
        if (this.elements.cancelTripYes) {
            this.elements.cancelTripYes.addEventListener('click', () => this.confirmCancelTrip());
        }
        
        if (this.elements.closeReviewModal) {
            this.elements.closeReviewModal.addEventListener('click', () => this.closeReviewModal());
        }
        if (this.elements.cancelReview) {
            this.elements.cancelReview.addEventListener('click', () => this.closeReviewModal());
        }
        if (this.elements.submitReview) {
            this.elements.submitReview.addEventListener('click', () => this.submitReview());
        }
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('#review-modal .rating-input i')) {
                const star = e.target.closest('#review-modal .rating-input i');
                const rating = parseInt(star.getAttribute('data-rating'));
                this.setRating(rating);
            }
        });
        
        window.addEventListener('click', (e) => {
            if (this.elements.cancelTripModal && e.target === this.elements.cancelTripModal) {
                this.closeModal();
            }
            if (this.elements.reviewModal && e.target === this.elements.reviewModal) {
                this.closeReviewModal();
            }
        });
        
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    },
    
    setRating: function(rating) {
        const stars = document.querySelectorAll('#review-modal .rating-input i');
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.className = 'fas fa-star';
                star.style.color = '#fbbf24';
            } else {
                star.className = 'far fa-star';
                star.style.color = '#d1d5db';
            }
        });
        document.getElementById('review-rating').value = rating;
    },
    
    submitReview: async function() {
        const rating = parseInt(document.getElementById('review-rating').value);
        const reviewText = document.getElementById('review-text').value.trim();
        
        if (rating === 0) {
            this.showNotification('Please select a rating', 'warning');
            return;
        }
        
        if (!reviewText) {
            this.showNotification('Please write your review', 'warning');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${this.apiBaseUrl}/reviews`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.currentUser.user_id,
                    group_id: parseInt(this.reviewTripData.trip_id),
                    rating: rating,
                    review_text: reviewText
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit review');
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Review submitted successfully!', 'success');
                this.closeReviewModal();
                await this.fetchUserReviews();
                await this.fetchUserTrips();
            } else {
                throw new Error(data.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            this.showNotification('Failed to submit review: ' + error.message, 'error');
        }
    },
    
    closeReviewModal: function() {
        if (this.elements.reviewModal) {
            this.elements.reviewModal.style.display = 'none';
        }
        this.reviewTripData = null;
    },
    
    updateUI: function() {
        if (!this.currentUser) return;
        
        const user = this.currentUser;
        
        if (this.elements.profileName) {
            this.elements.profileName.textContent = user.name || 'Traveler';
        }
        if (this.elements.profileEmail) {
            this.elements.profileEmail.textContent = user.email || 'No email provided';
        }
        
        const userIdElement = document.querySelector('.user-id');
        if (userIdElement) {
            let displayId = user.user_id || `TC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            userIdElement.textContent = `ID: ${displayId}`;
        }
        
        if (this.elements.profilePhone) {
            this.elements.profilePhone.textContent = user.phone_display || user.phone_number || '+91 **********';
        }
        if (this.elements.profileLocation) {
            this.elements.profileLocation.textContent = user.location || 'Location not specified';
        }
        if (this.elements.profileDob) {
            this.elements.profileDob.textContent = user.dobDisplay || user.dob || 'Date of birth not specified';
        }
        if (this.elements.profileGender) {
            this.elements.profileGender.textContent = this.capitalizeFirstLetter(user.gender || 'Not specified');
        }
        if (this.elements.profileAvatar) {
            this.elements.profileAvatar.src = user.avatar || this.getAvatarByGender(user.gender);
        }
        
        if (this.elements.bio) {
            this.elements.bio.value = user.bio || '';
        }
        
        document.title = `TripConnect - ${user.name || 'User'}'s Profile | Travel India`;
    },
    
    switchTab: function(e) {
        const targetTab = e.currentTarget.dataset.tab;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        e.currentTarget.classList.add('active');
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        if (targetTab === 'trips') {
            this.fetchUserTrips();
        } else if (targetTab === 'reviews') {
            this.fetchUserReviews();
        }
    },
    
    saveProfile: async function(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;
        
        const token = localStorage.getItem('token');
        const updatedBio = this.elements.bio ? this.elements.bio.value : '';
        
        // Show loading state
        const submitBtn = this.elements.profileForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        try {
            console.log('Updating bio for user:', this.currentUser.user_id);
            console.log('New bio:', updatedBio);
            
            const response = await fetch(`${this.apiBaseUrl}/auth/users/${this.currentUser.user_id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bio: updatedBio
                })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Update response:', data);
            
            if (response.ok && data.success) {
                if (data.user) {
                    this.currentUser = data.user;
                } else {
                    this.currentUser.bio = updatedBio;
                }
                
                this.saveUserData();
                this.updateUI();
                this.showNotification('✅ Profile updated successfully!', 'success');
                
                // Refresh trips and reviews
                await this.fetchUserTrips();
                await this.fetchUserReviews();
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
            
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('✅ Profile updated successfully!', 'success');
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    },
    
    saveUserData: function() {
        localStorage.setItem('tripconnect_user_data', JSON.stringify(this.currentUser));
        localStorage.setItem('user', JSON.stringify(this.currentUser));
    },
    
    cancelEdit: function() {
        if (this.elements.bio) {
            this.elements.bio.value = this.currentUser.bio || '';
        }
        this.showNotification('Changes discarded', 'info');
    },
    
    updateAvatar: async function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            if (file.size > 2 * 1024 * 1024) {
                this.showNotification('Image size should be less than 2MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                const avatarData = event.target.result;
                
                try {
                    const token = localStorage.getItem('token');
                    
                    const response = await fetch(`${this.apiBaseUrl}/auth/users/${this.currentUser.user_id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            avatar: avatarData
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        if (data.user) {
                            this.currentUser = data.user;
                        }
                        if (this.elements.profileAvatar) {
                            this.elements.profileAvatar.src = avatarData;
                        }
                        this.saveUserData();
                        this.showNotification('Profile picture updated!', 'success');
                    } else {
                        throw new Error(data.message || 'Failed to update avatar');
                    }
                    
                } catch (error) {
                    console.error('Error updating avatar:', error);
                    this.showNotification('Failed to update profile picture: ' + error.message, 'error');
                }
            };
            
            reader.readAsDataURL(file);
        }
    },
    
    goToProfile: function(e) {
        e.preventDefault();
        this.switchToTab('personal');
        this.showNotification('You are on your profile page.', 'info');
    },
    
    switchToTab: function(tabName) {
        const tabElement = document.querySelector(`[data-tab="${tabName}"]`);
        const contentElement = document.getElementById(tabName);
        
        if (tabElement) tabElement.classList.add('active');
        if (contentElement) contentElement.classList.add('active');
        
        document.querySelectorAll('.tab').forEach(t => {
            if (t !== tabElement) t.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content !== contentElement) content.classList.remove('active');
        });
    },
    
    showCancelTripModal: function(e) {
        e.preventDefault();
        
        const cancelBtn = e.target.closest('.cancel-trip-btn');
        
        if (cancelBtn.disabled) {
            this.showNotification('Cannot cancel this trip.', 'error');
            return;
        }
        
        const tripName = cancelBtn.getAttribute('data-trip-name');
        const tripId = cancelBtn.getAttribute('data-trip-id');
        const tripCard = cancelBtn.closest('.trip-card');
        
        this.cancelTripData = {
            tripName: tripName,
            tripId: tripId,
            tripCard: tripCard,
            cancelBtn: cancelBtn
        };
        
        if (this.elements.cancelTripMessage) {
            this.elements.cancelTripMessage.textContent = `Are you sure you want to cancel "${tripName}"?`;
        }
        
        if (this.elements.cancelTripModal) {
            this.elements.cancelTripModal.style.display = 'flex';
        }
    },
    
    closeModal: function() {
        if (this.elements.cancelTripModal) {
            this.elements.cancelTripModal.style.display = 'none';
        }
        this.cancelTripData = null;
    },
    
    confirmCancelTrip: async function() {
        if (!this.cancelTripData) return;
        
        const { tripName, tripId, tripCard } = this.cancelTripData;
        
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${this.apiBaseUrl}/groups/${tripId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to cancel trip');
            }
            
            if (tripCard && tripCard.parentNode) {
                tripCard.remove();
            }
            
            this.closeModal();
            this.showNotification(`Trip "${tripName}" has been cancelled successfully.`, 'success');
            
            setTimeout(() => {
                this.fetchUserTrips();
            }, 500);
            
        } catch (error) {
            console.error('Error cancelling trip:', error);
            this.showNotification('Failed to cancel trip: ' + error.message, 'error');
            this.closeModal();
        }
    },
    
    showReviewModal: function(e) {
        const btn = e.target.closest('.add-review-btn');
        const tripId = btn.getAttribute('data-trip-id');
        const tripName = btn.getAttribute('data-trip-name');
        
        this.reviewTripData = {
            trip_id: tripId,
            trip_name: tripName
        };
        
        document.getElementById('review-trip-name').textContent = tripName;
        document.getElementById('review-text').value = '';
        document.getElementById('review-rating').value = '0';
        
        const stars = document.querySelectorAll('#review-modal .rating-input i');
        stars.forEach(star => {
            star.className = 'far fa-star';
            star.style.color = '#d1d5db';
        });
        
        document.getElementById('review-modal').style.display = 'flex';
    },
    
    handleLogout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tripconnect_user_data');
        localStorage.removeItem('tripConnectAuth');
        window.location.href = 'index.html';
    },
    
    showNotification: function(message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container');
        
        if (!notificationContainer) {
            console.log('Notification:', message);
            alert(message);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-message">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        const autoRemove = setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeNotification(notification);
        });
    },
    
    removeNotification: function(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TripConnectApp.init();
});