// Itinerary Data
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
    
    activities: [
        {
            icon: "fas fa-water",
            title: "River Rafting",
            description: "Grade III-IV rapids adventure"
        },
        {
            icon: "fas fa-spa",
            title: "Yoga Sessions",
            description: "Daily with certified instructors"
        },
        {
            icon: "fas fa-hiking",
            title: "Nature Trekking",
            description: "Waterfall trails exploration"
        },
        {
            icon: "fas fa-binoculars",
            title: "Wildlife Safari",
            description: "Rajaji National Park visit"
        },
        {
            icon: "fas fa-temple",
            title: "Temple Tours",
            description: "Spiritual site visits"
        },
        {
            icon: "fas fa-users",
            title: "Cultural Workshops",
            description: "Local culture immersion"
        }
    ]
};

// Application State
const ItineraryApp = {
    currentDay: 1,
    
    init: function() {
        this.renderDayTabs();
        this.renderDayContent();
        this.renderHighlights();
        this.bindEvents();
    },
    
    renderDayTabs: function() {
        const dayTabs = document.getElementById('dayTabs');
        dayTabs.innerHTML = '';
        
        itineraryData.days.forEach(day => {
            const tab = document.createElement('button');
            tab.className = 'day-tab';
            if (day.day === this.currentDay) tab.classList.add('active');
            tab.innerHTML = `
                <span>Day ${day.day}</span>
                <small>${day.title.split(' ')[0]}</small>
            `;
            tab.dataset.day = day.day;
            tab.addEventListener('click', () => this.switchDay(day.day));
            dayTabs.appendChild(tab);
        });
    },
    
    renderDayContent: function() {
        const dayContent = document.getElementById('dayContent');
        const currentDayData = itineraryData.days.find(d => d.day === this.currentDay);
        
        if (!currentDayData) return;
        
        dayContent.innerHTML = `
            <div class="day-header">
                <h2>${currentDayData.title}</h2>
                <div class="date">${currentDayData.date}</div>
            </div>
            <div class="activity-list">
                ${currentDayData.activities.map(activity => {
                    const [time, period] = activity.time.split(' ');
                    const timeNum = time.replace(/:00/, '');
                    
                    return `
                    <div class="activity-item">
                        <div class="activity-time">
                            <span class="time-number">${timeNum}</span>
                            <span class="time-period">${period}</span>
                        </div>
                        <div class="activity-details">
                            <h3>${activity.title}</h3>
                            <p>${activity.description}</p>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    renderHighlights: function() {
        const highlightsGrid = document.getElementById('highlightsGrid');
        highlightsGrid.innerHTML = '';
        
        itineraryData.activities.forEach(activity => {
            const card = document.createElement('div');
            card.className = 'highlight-card';
            card.innerHTML = `
                <i class="${activity.icon}"></i>
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            `;
            highlightsGrid.appendChild(card);
        });
    },
    
    switchDay: function(dayNumber) {
        this.currentDay = dayNumber;
        this.renderDayTabs();
        this.renderDayContent();
        
        // Scroll to top of itinerary content
        document.querySelector('.itinerary-content').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    },
    
    bindEvents: function() {
        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.showShareModal();
        });
        
        // Check all items button
        document.getElementById('checkAllBtn').addEventListener('click', () => {
            this.checkAllPackingItems();
        });
        
        // Copy link button
        document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
            this.copyShareLink();
        });
        
        // Share modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeShareModal();
        });
        
        // Share options
        document.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.handleShare(platform);
            });
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeShareModal();
            }
        });
    },
    
    showShareModal: function() {
        const modal = document.getElementById('shareModal');
        modal.style.display = 'flex';
    },
    
    closeShareModal: function() {
        const modal = document.getElementById('shareModal');
        modal.style.display = 'none';
    },
    
    checkAllPackingItems: function() {
        const checkboxes = document.querySelectorAll('.packing-category input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
        
        const button = document.getElementById('checkAllBtn');
        button.innerHTML = allChecked ? 
            '<i class="fas fa-check-double"></i> Check All Items' :
            '<i class="fas fa-times"></i> Uncheck All Items';
    },
    
    copyShareLink: function() {
        const input = document.querySelector('.share-link input');
        input.select();
        input.setSelectionRange(0, 99999);
        
        navigator.clipboard.writeText(input.value).then(() => {
            const button = document.getElementById('copyLinkBtn');
            const originalHTML = button.innerHTML;
            
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.background = 'var(--success)';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
            }, 2000);
        });
    },
    
    handleShare: function(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent('Rishikesh Adventure Itinerary - TripConnect');
        const text = encodeURIComponent('Check out this amazing 4-day Rishikesh adventure itinerary!');
        
        let shareUrl;
        
        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=${title}&body=${text}%20${url}`;
                break;
            case 'pdf':
                this.generatePDF();
                return;
            case 'link':
                this.copyShareLink();
                return;
        }
        
        window.open(shareUrl, '_blank');
        this.closeShareModal();
    },
    
    generatePDF: function() {
        alert('PDF generation would be implemented here in a real application. For now, use the Print feature (Ctrl+P) and save as PDF.');
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    ItineraryApp.init();
});