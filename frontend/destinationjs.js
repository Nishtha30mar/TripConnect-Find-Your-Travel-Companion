// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get tomorrow's date
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Helper function to get date 3 days later
function getThreeDaysLater() {
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  return threeDaysLater.toISOString().split('T')[0];
}

// Save search parameters to session storage
function saveSearchParams(formData) {
  sessionStorage.setItem('lastSearchParams', JSON.stringify(formData));
}

// Save search results to session storage
function saveSearchResults(packages) {
  sessionStorage.setItem('lastSearchResults', JSON.stringify(packages));
}

// Get search parameters from session storage or default
function getSearchParams() {
  const savedParams = sessionStorage.getItem('lastSearchParams');
  if (savedParams) {
    try {
      return JSON.parse(savedParams);
    } catch (e) {
      console.error('Error parsing saved search params:', e);
    }
  }
  
  // Return empty defaults
  return {
    destination: '',
    startDate: '',
    endDate: '',
    budgetMin: '',
    budgetMax: '',
    travellers: ''
  };
}

// Helper function to remove hotel and food references from text
function removeHotelAndFood(text) {
  if (!text) return '';
  
  // Remove common hotel and accommodation related terms
  let cleaned = text
    .replace(/\d+\s*Nights?\s*/gi, '') // Remove "4 Nights", "5 Nights", etc.
    .replace(/\d+\s*Days?\s*/gi, '') // Remove "5 Days", etc.
    .replace(/\b(?:hotel|resort|inn|lodge|guesthouse|accommodation|stay|lodging|hostel|villa|cottage|suite|room|rooms)\b/gi, '')
    .replace(/\b(?:food|meal|breakfast|lunch|dinner|snacks|dining|restaurant|cafe|buffet|cuisine|gourmet)\b/gi, '')
    .replace(/\b(?:star|stars?)\b/gi, '') // Remove "5-Star", "5 Star", etc.
    .replace(/\b(?:boutique|luxury|premium|deluxe|standard|economy)\b/gi, '') // Remove hotel class terms
    .replace(/\s*\|\s*/g, ' ') // Replace "|" with space
    .replace(/\s+/g, ' ') // Clean up multiple spaces
    .replace(/^\s+|\s+$/g, '') // Trim
    .replace(/\s*,\s*,/g, ',') // Remove empty items from comma separation
    .replace(/^,\s*|\s*,$/g, ''); // Remove leading/trailing commas
    
  return cleaned;
}

// Populate destinations dropdown from database
async function loadDestinations() {
  try {
    const response = await fetch(`${API_BASE_URL}/packages/destinations`);
    const data = await response.json();
    
    if (data.success) {
      const destinationSelect = document.getElementById('destination');
      destinationSelect.innerHTML = '<option value="">Select destination</option>';
      
      data.destinations.forEach(destination => {
        const option = document.createElement('option');
        option.value = destination;
        option.textContent = destination;
        destinationSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading destinations:', error);
    const fallbackDestinations = ['Goa', 'Jaipur', 'Rishikesh', 'Manali', 'Ayodhya'];
    const destinationSelect = document.getElementById('destination');
    
    fallbackDestinations.forEach(destination => {
      const option = document.createElement('option');
      option.value = destination;
      option.textContent = destination;
      destinationSelect.appendChild(option);
    });
  }
}

// Fetch packages from API - MODIFIED: Show all packages that match destination and budget
async function fetchPackages(formData) {
  const loadingSpinner = document.getElementById('loadingSpinner');
  const packagesList = document.getElementById('packagesList');
  const resultsDiv = document.getElementById('results');
  const noResults = document.getElementById('noResults');
  const resultsCount = document.getElementById('resultsCount');
  
  loadingSpinner.style.display = 'block';
  packagesList.innerHTML = '';
  noResults.style.display = 'none';
  resultsDiv.style.display = 'block';
  
  try {
    // Calculate user's travel duration
    let userDurationDays = null;
    if (formData.startDate && formData.endDate) {
      userDurationDays = calculateDurationDays(formData.startDate, formData.endDate);
    }
    
    console.log('User requested duration:', userDurationDays, 'days');
    
    const response = await fetch(`${API_BASE_URL}/packages/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    loadingSpinner.style.display = 'none';
    
    if (data.success && data.packages.length > 0) {
      // Filter packages to show all that match destination and budget, regardless of duration
      // But add a note if duration doesn't match
      let filteredPackages = data.packages;
      
      // Add duration match info to each package
      filteredPackages = filteredPackages.map(pkg => {
        const packageDuration = pkg.duration_days;
        let durationMatch = false;
        let durationNote = '';
        
        if (userDurationDays) {
          if (packageDuration <= userDurationDays) {
            durationMatch = true;
            durationNote = `✓ Fits within your ${userDurationDays}-day trip`;
          } else {
            durationNote = `⚠️ Package is ${packageDuration} days, your trip is ${userDurationDays} days`;
          }
        }
        
        return {
          ...pkg,
          duration_match: durationMatch,
          duration_note: durationNote,
          user_duration: userDurationDays
        };
      });
      
      resultsCount.textContent = `${filteredPackages.length} package${filteredPackages.length !== 1 ? 's' : ''} found`;
      displayPackages(filteredPackages);
      noResults.style.display = 'none';
      saveSearchResults(filteredPackages);
    } else {
      resultsCount.textContent = '0 packages found';
      packagesList.innerHTML = '';
      noResults.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error fetching packages:', error);
    loadingSpinner.style.display = 'none';
    resultsCount.textContent = 'Error loading packages';
    packagesList.innerHTML = '<div style="color: #d32f2f; text-align: center; padding: 20px;">Failed to load packages. Please try again.</div>';
  }
}

// Display packages in the UI - MODIFIED: Added duration note and fixed book now button
function displayPackages(packages) {
  const packagesList = document.getElementById('packagesList');
  packagesList.innerHTML = '';
  
  console.log('Displaying packages:', packages.length);
  
  packages.forEach(pkg => {
    const packageCard = document.createElement('div');
    packageCard.className = 'package-card';
    
    // Clean title - remove hotel, food, and night references
    let cleanTitle = removeHotelAndFood(pkg.title);
    // If title becomes empty after cleaning, use a default
    if (!cleanTitle || cleanTitle === '') {
      cleanTitle = `${pkg.destination} Travel Package`;
    }
    
    // Clean features
    let features = pkg.included_features ? pkg.included_features : '';
    let cleanFeatures = removeHotelAndFood(features);
    
    // Take first 3 non-empty features after cleaning
    if (cleanFeatures) {
      const featuresArray = cleanFeatures.split(',').filter(f => f.trim().length > 0);
      cleanFeatures = featuresArray.slice(0, 3).join(', ');
    }
    
    if (!cleanFeatures || cleanFeatures === '') {
      cleanFeatures = 'Sightseeing and activities included';
    }
    
    const travellers = parseInt(document.getElementById('travellers').value) || 1;
    const totalPrice = pkg.price_per_person * travellers;
    
    // Create duration note HTML if exists
    const durationNoteHTML = pkg.duration_note ? `
      <div style="margin-top: 8px; font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; background: ${pkg.duration_match ? '#e8f5e9' : '#fff3e0'}; color: ${pkg.duration_match ? '#2e7d32' : '#e65100'};">
        ${pkg.duration_note}
      </div>
    ` : '';
    
    packageCard.innerHTML = `
      <div class="package-header">
        <div class="package-title">${escapeHtml(cleanTitle)}</div>
        <div class="package-price">₹${totalPrice.toLocaleString()} total</div>
      </div>
      <div class="package-details">
        <span class="package-detail">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          ${pkg.duration_days} days
        </span>
        <span class="package-detail">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
          </svg>
          ${pkg.min_travellers}-${pkg.max_travellers} people
        </span>
        <span class="package-detail">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
          ₹${pkg.price_per_person.toLocaleString()}/person
        </span>
      </div>
      <div class="package-features" title="${escapeHtml(pkg.included_features || '')}">
        ${escapeHtml(cleanFeatures)}
      </div>
      ${durationNoteHTML}
      <div class="package-actions">
        <button type="button" class="btn btn-small btn-details" data-package-id="${pkg.package_id}">
          Details
        </button>
        <button type="button" class="btn btn-small btn-book" data-package-id="${pkg.package_id}" data-package-title="${escapeHtml(pkg.title)}" data-package-destination="${escapeHtml(pkg.destination)}" data-package-price="${pkg.price_per_person}" data-package-duration="${pkg.duration_days}">
          Book Now
        </button>
      </div>
    `;
    
    packagesList.appendChild(packageCard);
  });
  
  addPackageButtonListeners();
}

// Add event listeners to package buttons - MODIFIED: Book now button redirects to checkout
function addPackageButtonListeners() {
  const packagesList = document.getElementById('packagesList');
  
  const newPackagesList = packagesList.cloneNode(true);
  packagesList.parentNode.replaceChild(newPackagesList, packagesList);
  
  newPackagesList.addEventListener('click', function(event) {
    let detailsBtn = event.target.closest('.btn-details');
    let bookBtn = event.target.closest('.btn-book');
    
    if (detailsBtn) {
      event.preventDefault();
      event.stopPropagation();
      
      const packageId = detailsBtn.getAttribute('data-package-id');
      
      if (packageId) {
        const currentFormData = {
          destination: document.getElementById('destination').value.trim(),
          startDate: document.getElementById('startDate').value,
          endDate: document.getElementById('endDate').value,
          budgetMin: document.getElementById('budgetMin').value,
          budgetMax: document.getElementById('budgetMax').value,
          travellers: document.getElementById('travellers').value
        };
        saveSearchParams(currentFormData);
        
        window.location.href = `package-details.html?id=${packageId}`;
      }
    }
    
    if (bookBtn) {
      event.preventDefault();
      event.stopPropagation();
      
      const packageId = bookBtn.getAttribute('data-package-id');
      const packageTitle = bookBtn.getAttribute('data-package-title');
      const packageDestination = bookBtn.getAttribute('data-package-destination');
      const packagePrice = bookBtn.getAttribute('data-package-price');
      const packageDuration = bookBtn.getAttribute('data-package-duration');
      const travellers = document.getElementById('travellers').value || 1;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      
      if (packageId) {
        // Prepare booking data to pass to checkout page
        const bookingData = {
          package_id: packageId,
          package_title: packageTitle,
          destination: packageDestination,
          price_per_person: parseFloat(packagePrice),
          duration_days: parseInt(packageDuration),
          travellers: parseInt(travellers),
          start_date: startDate,
          end_date: endDate
        };
        
        // Save booking data to sessionStorage
        sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
        
        // Also save the last search params
        const currentFormData = {
          destination: document.getElementById('destination').value.trim(),
          startDate: startDate,
          endDate: endDate,
          budgetMin: document.getElementById('budgetMin').value,
          budgetMax: document.getElementById('budgetMax').value,
          travellers: travellers
        };
        saveSearchParams(currentFormData);
        
        // Redirect to checkout page
        window.location.href = 'book-now.html';
      }
    }
  });
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to parse date
function parseDate(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Calculate duration in days - FIXED VERSION
function calculateDurationDays(startDateStr, endDateStr) {
  try {
    if (!startDateStr || !endDateStr) return null;
    
    console.log(`Calculating duration: ${startDateStr} to ${endDateStr}`);
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Reset time part to ensure accurate day calculation
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    
    console.log(`Duration calculated: ${daysDiff} days`);
    return daysDiff > 0 ? daysDiff : 1;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return null;
  }
}

// Save travel preferences - COMPLETELY FIXED VERSION
async function saveTravelPreferences() {
  try {
    const destination = document.getElementById('destination').value.trim();
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const budgetMin = document.getElementById('budgetMin').value ? parseInt(document.getElementById('budgetMin').value) : null;
    const budgetMax = document.getElementById('budgetMax').value ? parseInt(document.getElementById('budgetMax').value) : null;
    const travelers = document.getElementById('travellers').value ? parseInt(document.getElementById('travellers').value) : null;

    console.log('Saving travel preferences:', {
      destination,
      startDateInput,
      endDateInput,
      budgetMin,
      budgetMax,
      travelers
    });

    // Calculate duration
    let durationDays = null;
    if (startDateInput && endDateInput) {
      durationDays = calculateDurationDays(startDateInput, endDateInput);
      console.log('✅ Calculated duration days:', durationDays);
    }

    // Save to sessionStorage for travel-style page
    const searchData = {
      destination: destination,
      startDate: startDateInput,
      endDate: endDateInput,
      durationDays: durationDays,
      budgetMin: budgetMin,
      budgetMax: budgetMax,
      travellers: travelers,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('lastSearchParams', JSON.stringify(searchData));
    console.log('✅ Saved to sessionStorage:', searchData);

    // Get user ID from localStorage
    const userData = localStorage.getItem('user');
    let userId = null;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.user_id || user.id;
        console.log('User ID found:', userId);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // If user is logged in, save to database
    if (userId) {
      console.log('User logged in, saving to database...');
      
      const preferenceData = {
        user_id: userId,
        destination: destination,
        start_date: startDateInput,
        end_date: endDateInput,
        duration_days: durationDays,
        budget_min: budgetMin,
        budget_max: budgetMax,
        travelers_count: travelers,
        interests: null,
        companion_type: null,
        match_status: 'pending'
      };

      console.log('Sending to API - duration_days:', durationDays);
      console.log('Full payload:', JSON.stringify(preferenceData, null, 2));

      // Make API call to save travel preferences
      const response = await fetch(`${API_BASE_URL}/preferences/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferenceData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Travel preferences saved to database:', result);
        console.log('✅ Duration days saved:', result.duration_saved || durationDays);
        if (result.preference_id) {
          sessionStorage.setItem('lastPreferenceId', result.preference_id);
        }
        return true;
      } else {
        console.error('❌ Failed to save to database:', result.error);
        const tempPrefs = {
          ...preferenceData,
          timestamp: new Date().toISOString(),
          pending: true
        };
        localStorage.setItem('pending_travel_prefs', JSON.stringify(tempPrefs));
        console.log('✅ Saved to localStorage (pending):', tempPrefs);
        return false;
      }
    } else {
      console.log('No user logged in - saving to localStorage only');
      const tempPrefs = {
        destination: destination,
        start_date: startDateInput,
        end_date: endDateInput,
        duration_days: durationDays,
        budget_min: budgetMin,
        budget_max: budgetMax,
        travelers_count: travelers,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pending_travel_prefs', JSON.stringify(tempPrefs));
      console.log('✅ Saved to localStorage (pending) with duration:', durationDays);
      return false;
    }
  } catch (error) {
    console.error('Error saving travel preferences:', error);
    return false;
  }
}

// Basic client-side validation
function validateForm() {
  const destination = document.getElementById('destination').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const budgetMin = document.getElementById('budgetMin').value;
  const budgetMax = document.getElementById('budgetMax').value;
  const travellers = document.getElementById('travellers').value;

  if (!destination) {
    alert('Please select a destination.');
    return false;
  }

  if (!startDate || !endDate) {
    alert('Please select both start and end dates.');
    return false;
  }

  const startDateObj = parseDate(startDate);
  const endDateObj = parseDate(endDate);
  
  if (startDateObj > endDateObj) {
    alert('End date should be on or after the start date.');
    return false;
  }

  if (budgetMin && budgetMax) {
    const min = parseInt(budgetMin);
    const max = parseInt(budgetMax);
    
    if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
      alert('Please enter valid budget amounts.');
      return false;
    }

    if (min > max) {
      alert('Minimum budget cannot be greater than maximum budget.');
      return false;
    }
  }

  if (travellers) {
    const travellerCount = parseInt(travellers);
    if (isNaN(travellerCount) || travellerCount < 1) {
      alert('Please enter a valid number of travellers.');
      return false;
    }
  }

  return true;
}

// Handle "View packages" click
document.getElementById('viewPackagesBtn').addEventListener('click', async function (event) {
  event.preventDefault();
  event.stopPropagation();
  
  await saveTravelPreferences();
  
  if (!validateForm()) return;

  const formData = {
    destination: document.getElementById('destination').value.trim(),
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    budgetMin: document.getElementById('budgetMin').value || null,
    budgetMax: document.getElementById('budgetMax').value || null,
    travellers: document.getElementById('travellers').value || null
  };

  saveSearchParams(formData);
  console.log('Fetching packages with data:', formData);
  fetchPackages(formData);
});

// Handle "Customize your own trip" click
document.getElementById('customTripBtn').addEventListener('click', async function (event) {
  event.preventDefault();
  event.stopPropagation();
  
  await saveTravelPreferences();
  
  if (!validateForm()) return;
  
  const destination = document.getElementById('destination').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const budgetMin = document.getElementById('budgetMin').value;
  const budgetMax = document.getElementById('budgetMax').value;
  const travellers = document.getElementById('travellers').value;
  
  const durationDays = calculateDurationDays(startDate, endDate);
  
  const formData = {
    destination: destination,
    startDate: startDate,
    endDate: endDate,
    durationDays: durationDays,
    budgetMin: budgetMin,
    budgetMax: budgetMax,
    travellers: travellers
  };
  
  console.log('=== CUSTOMIZE TRIP ===');
  console.log('Duration days calculated:', durationDays);
  
  sessionStorage.setItem('lastSearchParams', JSON.stringify(formData));
  
  localStorage.setItem('pending_travel_prefs', JSON.stringify({
    destination: destination,
    start_date: startDate,
    end_date: endDate,
    duration_days: durationDays,
    budget_min: budgetMin,
    budget_max: budgetMax,
    travelers_count: travellers
  }));
  
  sessionStorage.setItem('tripType', 'custom');
  
  console.log('Redirecting to travel-style.html');
  window.location.href = 'travel-style.html';
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];
  
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  startDateInput.min = todayFormatted;
  endDateInput.min = todayFormatted;
  
  const urlParams = new URLSearchParams(window.location.search);
  const preserveSearch = urlParams.get('preserveSearch');
  
  if (preserveSearch === 'true') {
    const destination = urlParams.get('destination') || '';
    const startDate = urlParams.get('startDate') || '';
    const endDate = urlParams.get('endDate') || '';
    const budgetMin = urlParams.get('budgetMin') || '';
    const budgetMax = urlParams.get('budgetMax') || '';
    const travellers = urlParams.get('travellers') || '';
    
    document.getElementById('destination').value = destination;
    document.getElementById('startDate').value = startDate;
    document.getElementById('endDate').value = endDate;
    document.getElementById('budgetMin').value = budgetMin;
    document.getElementById('budgetMax').value = budgetMax;
    document.getElementById('travellers').value = travellers;
    
    const formData = {
      destination: destination,
      startDate: startDate,
      endDate: endDate,
      budgetMin: budgetMin,
      budgetMax: budgetMax,
      travellers: travellers
    };
    saveSearchParams(formData);
    
    if (destination) {
      const savedResults = sessionStorage.getItem('lastSearchResults');
      
      if (savedResults) {
        try {
          const packages = JSON.parse(savedResults);
          console.log('Restoring saved search results:', packages.length);
          displayPackages(packages);
          
          document.getElementById('results').style.display = 'block';
          document.getElementById('resultsCount').textContent = `${packages.length} package${packages.length !== 1 ? 's' : ''} found`;
          document.getElementById('noResults').style.display = 'none';
        } catch (e) {
          console.error('Error parsing saved results:', e);
          autoSearchWithDelay(formData);
        }
      } else {
        autoSearchWithDelay(formData);
      }
    }
  } else {
    startDateInput.placeholder = 'YYYY-MM-DD';
    endDateInput.placeholder = 'YYYY-MM-DD';
    document.getElementById('budgetMin').value = '';
    document.getElementById('budgetMin').placeholder = 'Min';
    document.getElementById('budgetMax').value = '';
    document.getElementById('budgetMax').placeholder = 'Max';
    document.getElementById('travellers').value = '';
    document.getElementById('travellers').placeholder = 'Number of travellers';
  }
  
  loadDestinations();
  
  const pendingPrefs = localStorage.getItem('pending_travel_prefs');
  if (pendingPrefs) {
    try {
      const prefs = JSON.parse(pendingPrefs);
      document.getElementById('destination').value = prefs.destination || '';
      if (prefs.start_date) document.getElementById('startDate').value = prefs.start_date;
      if (prefs.end_date) document.getElementById('endDate').value = prefs.end_date;
      if (prefs.budget_min) document.getElementById('budgetMin').value = prefs.budget_min;
      if (prefs.budget_max) document.getElementById('budgetMax').value = prefs.budget_max;
      if (prefs.travelers_count) document.getElementById('travellers').value = prefs.travelers_count;
    } catch (e) {
      console.error('Error parsing pending preferences:', e);
    }
  }
  
  document.getElementById('tripForm').addEventListener('submit', function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  });
});

// Helper function for auto-search with delay
function autoSearchWithDelay(formData) {
  setTimeout(() => {
    const searchData = {
      destination: formData.destination,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
      budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
      travellers: formData.travellers ? parseInt(formData.travellers) : null
    };
    fetchPackages(searchData);
  }, 300);
}