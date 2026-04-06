// Rishikesh Itinerary Data
const itineraryData = {
    tripName: "Rishikesh Spiritual Adventure",
    tripDates: "02-05 April 2026",
    tripMembers: "4 Adventurers",
    budget: "₹12,500/person",
    
    days: [
        {
            day: 1,
            title: "Arrival & Spiritual Exploration",
            date: "April 02, 2026",
            activities: [
                {
                    time: "12:00 PM",
                    title: "Arrival in Rishikesh",
                    description: "Check into your riverside resort with stunning Ganges views. Welcome drink and briefing by your adventure guide."
                },
                {
                    time: "2:00 PM",
                    title: "Local Orientation & Temple Tour",
                    description: "Orientation about Rishikesh's spiritual spots followed by visits to ancient temples in the city."
                },
                {
                    time: "4:00 PM",
                    title: "Laxman Jhula & Ram Jhula Exploration",
                    description: "Walk across the famous suspension bridges, explore local markets, and witness the spiritual atmosphere."
                },
                {
                    time: "7:00 PM",
                    title: "Evening Ganga Aarti Experience",
                    description: "Attend the mesmerizing Ganga Aarti at Triveni Ghat - a spiritual experience with chants and floating lamps."
                }
            ]
        },
        {
            day: 2,
            title: "River Rafting & Adventure Day",
            date: "April 03, 2026",
            activities: [
                {
                    time: "7:00 AM",
                    title: "Sunrise Yoga by Ganges",
                    description: "Morning yoga session by the holy Ganges with certified instructor."
                },
                {
                    time: "9:00 AM",
                    title: "Rafting Safety Briefing & Preparation",
                    description: "Comprehensive safety briefing and equipment distribution for river rafting adventure."
                },
                {
                    time: "10:30 AM",
                    title: "White Water Rafting Expedition",
                    description: "16km rafting journey from Shivpuri to Rishikesh through Grade III-IV rapids - ultimate adventure experience!"
                },
                {
                    time: "2:00 PM",
                    title: "Cliff Jumping & Water Activities",
                    description: "Thrilling cliff jumping and body surfing sessions under expert supervision at safe spots."
                },
                {
                    time: "4:00 PM",
                    title: "Beach Games & Team Building",
                    description: "Organized beach games and team building activities on river banks."
                },
                {
                    time: "7:00 PM",
                    title: "Adventure Storytelling Session",
                    description: "Group sharing of rafting experiences and adventure stories with fellow travelers."
                }
            ]
        },
        {
            day: 3,
            title: "Yoga Capital & Nature Immersion",
            date: "April 04, 2026",
            activities: [
                {
                    time: "6:30 AM",
                    title: "Sunrise Meditation Session",
                    description: "Guided meditation at a peaceful spot overlooking the Ganges."
                },
                {
                    time: "8:30 AM",
                    title: "Visit Parmarth Niketan Ashram",
                    description: "Tour of Rishikesh's largest ashram and introduction to yoga philosophy."
                },
                {
                    time: "10:30 AM",
                    title: "Advanced Yoga Workshop",
                    description: "2-hour intensive yoga session focusing on advanced asanas and breathing techniques."
                },
                {
                    time: "1:00 PM",
                    title: "Nature Walk to Neer Garh Waterfall",
                    description: "Scenic hike through lush green trails to beautiful waterfall."
                },
                {
                    time: "4:00 PM",
                    title: "Visit Beatles Ashram",
                    description: "Explore the abandoned ashram where The Beatles stayed and composed music in 1968."
                },
                {
                    time: "6:00 PM",
                    title: "Garhwali Culture Workshop",
                    description: "Interactive session on local culture, traditions, and crafts of Garhwal region."
                }
            ]
        },
        {
            day: 4,
            title: "Wildlife Safari & Departure",
            date: "April 05, 2026",
            activities: [
                {
                    time: "6:00 AM",
                    title: "Farewell Yoga & Reflection",
                    description: "Final yoga session focusing on gratitude and inner peace."
                },
                {
                    time: "8:00 AM",
                    title: "Rajaji National Park Safari",
                    description: "Jeep safari to spot elephants, tigers, leopards, and diverse Himalayan bird species."
                },
                {
                    time: "11:00 AM",
                    title: "Visit Vashishta Gufa",
                    description: "Meditation in ancient cave where sage Vashishta meditated for years."
                },
                {
                    time: "1:00 PM",
                    title: "Kunjapuri Temple Excursion",
                    description: "Drive to temple offering panoramic sunrise views of Himalayan peaks."
                },
                {
                    time: "3:00 PM",
                    title: "Final Group Activity & Sharing",
                    description: "Group reflection session sharing experiences and takeaways from the journey."
                },
                {
                    time: "5:00 PM",
                    title: "Farewell Ceremony & Certificate Distribution",
                    description: "Traditional farewell with blessings and adventure completion certificates."
                },
                {
                    time: "7:00 PM",
                    title: "Departure from Rishikesh",
                    description: "Transfer to railway station/airport with beautiful memories of the adventure."
                }
            ]
        }
    ],
    
    // Pickup points data
    pickupPoints: [
        {
            name: "Rishikesh Railway Station",
            time: "11:00 AM",
            description: "Main pickup point with guide waiting with TripConnect sign"
        },
        {
            name: "Dehradun Airport",
            time: "10:30 AM",
            description: "Airport transfer with private vehicle"
        },
        {
            name: "Haridwar Junction",
            time: "11:30 AM",
            description: "Secondary pickup point near the temple area"
        }
    ],
    
    // Activities data
    activities: [
        {
            icon: "fas fa-water",
            title: "River Rafting",
            description: "Grade III-IV rapids"
        },
        {
            icon: "fas fa-spa",
            title: "Yoga Sessions",
            description: "Daily with experts"
        },
        {
            icon: "fas fa-hiking",
            title: "Nature Trekking",
            description: "Waterfall trails"
        },
        {
            icon: "fas fa-binoculars",
            title: "Wildlife Safari",
            description: "Rajaji National Park"
        },
        {
            icon: "fas fa-campground",
            title: "Riverside Camping",
            description: "Overnight experience"
        },
        {
            icon: "fas fa-utensils",
            title: "Cooking Class",
            description: "Local cuisine"
        }
    ]
};

// Application State
const TripApp = {
    currentDay: 1,
    selectedPaymentMethod: 'upi',
    isProcessingPayment: false,
    
    init: function() {
        this.renderItinerary();
        this.renderPickupPoints();
        this.renderActivities();
        this.bindEvents();
        this.setupPayment();
        this.updateUIFromURL();
    },
    
    renderItinerary: function() {
        const dayTabs = document.getElementById('dayTabs');
        const dayContent = document.getElementById('dayContent');
        
        // Clear existing content
        dayTabs.innerHTML = '';
        dayContent.innerHTML = '';
        
        // Create day tabs
        itineraryData.days.forEach(day => {
            const tab = document.createElement('button');
            tab.className = 'day-tab';
            if (day.day === this.currentDay) tab.classList.add('active');
            tab.textContent = `Day ${day.day}`;
            tab.dataset.day = day.day;
            tab.addEventListener('click', () => this.switchDay(day.day));
            dayTabs.appendChild(tab);
        });
        
        // Render current day content
        const currentDayData = itineraryData.days.find(d => d.day === this.currentDay);
        if (currentDayData) {
            dayContent.innerHTML = this.createDayContent(currentDayData);
        }
    },
    
    createDayContent: function(dayData) {
        let activitiesHTML = '';
        dayData.activities.forEach(activity => {
            activitiesHTML += `
                <div class="activity-item">
                    <div class="activity-time">
                        <i class="far fa-clock"></i>
                        <span>${activity.time}</span>
                    </div>
                    <div class="activity-details">
                        <h4>${activity.title}</h4>
                        <p>${activity.description}</p>
                    </div>
                </div>
            `;
        });
        
        return `
            <div class="day-title">
                <i class="fas fa-calendar-day"></i>
                <h3>${dayData.title} - ${dayData.date}</h3>
            </div>
            ${activitiesHTML}
        `;
    },
    
    renderPickupPoints: function() {
        const pickupList = document.getElementById('pickupList');
        if (!pickupList) return;
        
        pickupList.innerHTML = '';
        
        itineraryData.pickupPoints.forEach(point => {
            const item = document.createElement('div');
            item.className = 'pickup-item';
            item.innerHTML = `
                <div class="pickup-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="pickup-info">
                    <h4>${point.name}</h4>
                    <p><strong>Time:</strong> ${point.time}</p>
                    <p>${point.description}</p>
                </div>
            `;
            pickupList.appendChild(item);
        });
    },
    
    renderActivities: function() {
        const activitiesGrid = document.getElementById('activitiesGrid');
        if (!activitiesGrid) return;
        
        activitiesGrid.innerHTML = '';
        
        itineraryData.activities.forEach(activity => {
            const card = document.createElement('div');
            card.className = 'activity-card';
            card.innerHTML = `
                <i class="${activity.icon}"></i>
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            `;
            activitiesGrid.appendChild(card);
        });
    },
    
    switchDay: function(dayNumber) {
        this.currentDay = dayNumber;
        
        // Update active tab
        document.querySelectorAll('.day-tab').forEach(tab => {
            if (parseInt(tab.dataset.day) === dayNumber) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update day content
        const dayContent = document.getElementById('dayContent');
        const currentDayData = itineraryData.days.find(d => d.day === dayNumber);
        if (currentDayData) {
            dayContent.innerHTML = this.createDayContent(currentDayData);
        }
    },
    
    setupPayment: function() {
        // Payment method selection
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.payment-option').forEach(opt => 
                    opt.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.selectedPaymentMethod = e.currentTarget.dataset.method;
                console.log('Selected payment method:', this.selectedPaymentMethod);
            });
        });
        
        // Pay Now button
        const payNowBtn = document.getElementById('payNowBtn');
        if (payNowBtn) {
            payNowBtn.addEventListener('click', () => {
                if (!this.isProcessingPayment) {
                    this.processPayment();
                }
            });
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal('paymentModal');
            });
        });
        
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal('paymentModal');
            }
        });
    },
    
    bindEvents: function() {
        // Help button
        const helpBtn = document.querySelector('.btn-help');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                alert('Need help? Call our adventure support at 1800-123-ADVT or WhatsApp +91 98765 43210');
            });
        }
    },
    
    processPayment: function() {
        if (this.isProcessingPayment) return;
        
        this.isProcessingPayment = true;
        console.log('Processing payment with method:', this.selectedPaymentMethod);
        
        // Disable the pay button
        const payNowBtn = document.getElementById('payNowBtn');
        if (payNowBtn) {
            payNowBtn.disabled = true;
            payNowBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }
        
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal) {
            paymentModal.classList.add('show');
            
            // Update payment steps animation
            const steps = document.querySelectorAll('.step');
            let currentStep = 0;
            
            const paymentInterval = setInterval(() => {
                if (currentStep < steps.length) {
                    steps.forEach((step, index) => {
                        if (index <= currentStep) {
                            step.classList.add('active');
                            step.querySelector('i').className = 'fas fa-check';
                        } else {
                            step.classList.remove('active');
                            step.querySelector('i').className = index === 1 ? 'fas fa-spinner' : 'far fa-credit-card';
                        }
                    });
                    currentStep++;
                } else {
                    clearInterval(paymentInterval);
                    
                    // Show completion and redirect after a delay
                    setTimeout(() => {
                        this.closeModal('paymentModal');
                        this.redirectToRishikeshItinerary();
                    }, 1000);
                }
            }, 800);
        }
    },
    
    redirectToRishikeshItinerary: function() {
        // Collect trip details
        const totalAmount = document.getElementById('totalAmount').textContent;
        const perPerson = document.getElementById('perPersonCost').textContent;
        const tripDates = document.getElementById('tripDates').textContent;
        const tripMembers = document.getElementById('tripMembers').textContent;
        
        // Generate random booking ID
        const bookingId = 'TRISH' + Math.floor(100000 + Math.random() * 900000);
        
        // Create URL parameters
        const params = new URLSearchParams({
            bookingId: bookingId,
            amount: totalAmount.replace('₹', ''),
            perPerson: perPerson.replace('₹', ''),
            trip: itineraryData.tripName,
            method: this.selectedPaymentMethod,
            dates: tripDates,
            travellers: tripMembers.replace(' Adventurers', ''),
            status: 'confirmed',
            timestamp: new Date().toISOString()
        });
        
        // Show a quick success message
        const payNowBtn = document.getElementById('payNowBtn');
        if (payNowBtn) {
            payNowBtn.innerHTML = '<i class="fas fa-check"></i> Payment Successful!';
            payNowBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
        }
        
        // Redirect to rishikesh-itinerary.html with parameters
        setTimeout(() => {
            window.location.href = `rishikesh-itinerary.html?${params.toString()}`;
        }, 1500);
    },
    
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    },
    
    updateUIFromURL: function() {
        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        
        // Update trip details from URL parameters if they exist
        const startDate = urlParams.get('startDate');
        const endDate = urlParams.get('endDate');
        const travellers = urlParams.get('travellers');
        const budget = urlParams.get('budget');
        const interests = urlParams.getAll('interests');
        
        if (startDate && endDate) {
            const formattedDates = this.formatDates(startDate, endDate);
            document.getElementById('tripDates').textContent = formattedDates;
            
            // Update itinerary dates
            this.updateItineraryDates(startDate);
        }
        
        if (travellers) {
            document.getElementById('tripMembers').textContent = `${travellers} Adventurers`;
            this.updateCostForTravellers(parseInt(travellers));
        }
        
        if (budget) {
            document.getElementById('tripBudget').textContent = `Budget: ₹${budget}/person`;
        }
        
        if (interests.length > 0) {
            this.updateActivitiesBasedOnInterests(interests);
        }
    },
    
    formatDates: function(startDateStr, endDateStr) {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        const startFormatted = start.toLocaleDateString('en-IN', options);
        const endFormatted = end.toLocaleDateString('en-IN', options);
        
        return `${startFormatted} - ${endFormatted}`;
    },
    
    updateItineraryDates: function(startDateStr) {
        const startDate = new Date(startDateStr);
        
        // Update each day's date
        itineraryData.days.forEach((day, index) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + index);
            
            const options = { day: '2-digit', month: 'long', year: 'numeric' };
            day.date = dayDate.toLocaleDateString('en-IN', options);
        });
        
        // Re-render itinerary if needed
        if (this.currentDay === 1) {
            this.renderItinerary();
        }
    },
    
    updateCostForTravellers: function(numTravellers) {
        if (numTravellers !== 4) {
            // Calculate new costs based on number of travellers
            const baseCost = 53000;
            const perPerson = baseCost / 4;
            const newTotal = perPerson * numTravellers;
            const newPerPerson = newTotal / numTravellers;
            
            // Update total amount
            const totalAmountElement = document.getElementById('totalAmount');
            if (totalAmountElement) {
                totalAmountElement.textContent = `₹${newTotal.toLocaleString('en-IN')}`;
            }
            
            // Update per person cost
            const perPersonElement = document.getElementById('perPersonCost');
            if (perPersonElement) {
                perPersonElement.textContent = `₹${Math.round(newPerPerson).toLocaleString('en-IN')}`;
            }
            
            // Update payment button
            const payNowBtn = document.getElementById('payNowBtn');
            if (payNowBtn) {
                payNowBtn.innerHTML = `<i class="fas fa-lock"></i> Pay ₹${Math.round(newPerPerson).toLocaleString('en-IN')} Now`;
            }
        }
    },
    
    updateActivitiesBasedOnInterests: function(interests) {
        // This is a simplified version - in real app, you'd fetch appropriate activities
        console.log('User interests:', interests);
        
        // Update destination description based on interests
        const descElement = document.getElementById('destinationDesc');
        if (descElement && interests.length > 0) {
            let interestText = '';
            if (interests.includes('adventure')) {
                interestText = "Focus on thrilling river rafting and adventure sports. ";
            }
            if (interests.includes('spiritual')) {
                interestText += "Emphasis on yoga, meditation, and temple visits. ";
            }
            if (interests.includes('culture')) {
                interestText += "Includes local cultural experiences and heritage sites. ";
            }
            
            if (interestText) {
                descElement.textContent = `4 days of spiritual awakening, adventure, and natural beauty in the Yoga Capital of the World. ${interestText}Experience river rafting, yoga sessions, and temple visits in the foothills of the Himalayas.`;
            }
        }
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TripApp.init();
});