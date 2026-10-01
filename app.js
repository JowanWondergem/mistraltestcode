// Configuration for the gallery
const CONFIG = {
    // Unsplash API configuration
    api: {
        baseUrl: 'https://api.unsplash.com',
        accessKey: 'YOUR_UNSPLASH_ACCESS_KEY', // Replace with your actual Unsplash access key
        // For demo purposes, we'll use a fallback if no key is provided
        fallbackImages: [
            // Nature images
            { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400', category: 'nature', photographer: 'Freestocks' },
            { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400', category: 'nature', photographer: 'Sean Oulashin' },
            { url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400', category: 'nature', photographer: 'Joshua Earle' },
            { url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400', category: 'nature', photographer: 'Jared Erondu' },
            
            // Adventure images
            { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', category: 'adventure', photographer: 'Bernd Dittrich' },
            { url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400', category: 'adventure', photographer: 'Luca Bravo' },
            { url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400', category: 'adventure', photographer: 'Jeroen den Otter' },
            { url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400', category: 'adventure', photographer: 'Robert Lukeman' },
            
            // Extreme sports images
            { url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400', category: 'extreme', photographer: 'Jared Rice' },
            { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', category: 'extreme', photographer: 'Sven Mieke' },
            { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', category: 'extreme', photographer: 'Allef Vinicius' },
            { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400', category: 'extreme', photographer: 'Timothy Meinberg' }
        ]
    },
    
    // Gallery settings
    gallery: {
        itemsPerCategory: 4, // Number of images per category
        totalItems: 12,     // Total images to display
        categories: ['nature', 'adventure', 'extreme']
    }
};

// DOM elements
const galleryElement = document.getElementById('gallery');
const loadingElement = document.querySelector('.loading');
const lastUpdatedElement = document.getElementById('last-updated');

// State management
let currentImages = [];
let lastFetchDate = null;

/**
 * Get images from Unsplash API for a specific category
 * @param {string} category - The category to search for
 * @param {number} count - Number of images to fetch
 * @returns {Promise<Array>} Array of image data
 */
async function fetchUnsplashImages(category, count = 4) {
    // If no access key, use fallback images
    if (!CONFIG.api.accessKey || CONFIG.api.accessKey === 'YOUR_UNSPLASH_ACCESS_KEY') {
        console.warn('No Unsplash access key provided. Using fallback images.');
        return getFallbackImages(category, count);
    }
    
    try {
        const response = await fetch(
            `${CONFIG.api.baseUrl}/search/photos?query=${category}&per_page=${count}&client_id=${CONFIG.api.accessKey}`
        );
        
        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results.map(result => ({
            url: result.urls.small,
            category: category,
            photographer: result.user.name,
            full: result.urls.regular,
            alt: result.alt_description || `${category} photo`
        }));
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        return getFallbackImages(category, count);
    }
}

/**
 * Get fallback images when API is not available
 * @param {string} category - The category to get images for
 * @param {number} count - Number of images to return
 * @returns {Array} Array of fallback image data
 */
function getFallbackImages(category, count) {
    const categoryImages = CONFIG.api.fallbackImages.filter(img => img.category === category);
    
    // If we don't have enough images for this category, use any available
    if (categoryImages.length < count) {
        const allImages = [...CONFIG.api.fallbackImages];
        return allImages.sort(() => 0.5 - Math.random()).slice(0, count);
    }
    
    return categoryImages.sort(() => 0.5 - Math.random()).slice(0, count);
}

/**
 * Get a seed based on the current date for consistent daily images
 * @returns {number} Seed value
 */
function getDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

/**
 * Shuffle array with a consistent seed for the same day
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Seed for randomization
 * @returns {Array} Shuffled array
 */
function seededShuffle(array, seed) {
    // Create a copy of the array
    const arr = [...array];
    
    // Use the seed to create a pseudo-random sequence
    let currentSeed = seed;
    
    return arr.sort(() => {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return (currentSeed / 233280) - 0.5;
    });
}

/**
 * Fetch all images for the gallery
 * @returns {Promise<Array>} Array of all image data
 */
async function fetchAllImages() {
    const allImages = [];
    
    // Check if we should use cached images from the same day
    const today = new Date().toDateString();
    if (lastFetchDate === today && currentImages.length > 0) {
        return currentImages;
    }
    
    // Fetch images for each category
    for (const category of CONFIG.gallery.categories) {
        const images = await fetchUnsplashImages(category, CONFIG.gallery.itemsPerCategory);
        allImages.push(...images);
    }
    
    // Shuffle all images with a consistent seed for the day
    const dailySeed = getDailySeed();
    const shuffledImages = seededShuffle(allImages, dailySeed);
    
    // Limit to the desired number of images
    currentImages = shuffledImages.slice(0, CONFIG.gallery.totalItems);
    lastFetchDate = today;
    
    return currentImages;
}

/**
 * Create a gallery item element
 * @param {Object} image - Image data
 * @returns {HTMLElement} Gallery item element
 */
function createGalleryItem(image) {
    const item = document.createElement('div');
    item.className = 'gallery-item fade-in';
    
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.alt || `${image.category} photo by ${image.photographer}`;
    img.loading = 'lazy';
    
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const category = document.createElement('div');
    category.className = 'category';
    category.textContent = image.category.charAt(0).toUpperCase() + image.category.slice(1);
    
    const photographer = document.createElement('div');
    photographer.className = 'photographer';
    photographer.textContent = `Photo: ${image.photographer}`;
    
    overlay.appendChild(category);
    overlay.appendChild(photographer);
    
    item.appendChild(img);
    item.appendChild(overlay);
    
    return item;
}

/**
 * Render the gallery with images
 * @param {Array} images - Array of image data
 */
function renderGallery(images) {
    // Clear existing gallery
    galleryElement.innerHTML = '';
    
    // Create and append gallery items
    images.forEach(image => {
        const item = createGalleryItem(image);
        galleryElement.appendChild(item);
    });
    
    // Hide loading indicator
    loadingElement.style.display = 'none';
    
    // Update last updated timestamp
    lastUpdatedElement.textContent = new Date().toLocaleString();
    
    // Add fade-in animation to items
    setTimeout(() => {
        const items = document.querySelectorAll('.gallery-item');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    }, 100);
}

/**
 * Initialize the gallery
 */
async function initGallery() {
    try {
        const images = await fetchAllImages();
        renderGallery(images);
    } catch (error) {
        console.error('Error initializing gallery:', error);
        loadingElement.textContent = 'Error loading images. Please try again later.';
    }
}

/**
 * Check if a new day has started and refresh images if needed
 */
function checkForNewDay() {
    const today = new Date().toDateString();
    
    if (lastFetchDate !== today) {
        // New day detected, refresh the gallery
        loadingElement.style.display = 'block';
        initGallery();
    }
}

// Surprise Me Functionality
function initSurpriseMe() {
    const surpriseInput = document.getElementById('surpriseInput');
    const surpriseBtn = document.getElementById('surpriseBtn');
    const surprisePopup = document.getElementById('surprisePopup');
    const surpriseImage = document.getElementById('surpriseImage');
    const surpriseClose = document.getElementById('surpriseClose');
    const surpriseTitle = document.getElementById('surpriseTitle');
    const surpriseDescription = document.getElementById('surpriseDescription');
    
    if (!surpriseInput || !surpriseBtn || !surprisePopup) return;
    
    // Expanded fallback images organized by specific keywords for better matching
    const fallbackSurpriseImages = {
        // Nature categories
        ocean: [
            'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800',
            'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800'
        ],
        sea: [
            'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800'
        ],
        beach: [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
            'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800'
        ],
        mountain: [
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            'https://images.unsplash.com/photo-1464822759844-d150baec93d5?w=800'
        ],
        forest: [
            'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
        ],
        nature: [
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
            'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
            'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800'
        ],
        // Adventure categories
        adventure: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'
        ],
        hike: [
            'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'
        ],
        travel: [
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
        ],
        // Extreme sports
        extreme: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
        ],
        surf: [
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
        ],
        ski: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
        ],
        // Animals
        animal: [
            'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800',
            'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800'
        ],
        wildlife: [
            'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800',
            'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800'
        ],
        // Weather and sky
        sunset: [
            'https://images.unsplash.com/photo-1509909756405-be0199881695?w=800',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
        ],
        sunrise: [
            'https://images.unsplash.com/photo-1509909756405-be0199881695?w=800',
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
        ],
        // Generic fallback
        default: [
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'
        ]
    };
    
    // Improved keyword matching function
    function getMatchingImages(query) {
        const queryLower = query.toLowerCase().trim();
        
        // Direct keyword matching
        const keywordMap = {
            'ocean': 'ocean',
            'sea': 'sea',
            'beach': 'beach',
            'mountain': 'mountain',
            'mountains': 'mountain',
            'forest': 'forest',
            'nature': 'nature',
            'landscape': 'nature',
            'adventure': 'adventure',
            'hike': 'hike',
            'hiking': 'hike',
            'travel': 'travel',
            'extreme': 'extreme',
            'surf': 'surf',
            'surfing': 'surf',
            'ski': 'ski',
            'skiing': 'ski',
            'animal': 'animal',
            'animals': 'animal',
            'wildlife': 'wildlife',
            'sunset': 'sunset',
            'sunrise': 'sunrise'
        };
        
        // Check for exact match
        if (keywordMap[queryLower]) {
            const category = keywordMap[queryLower];
            if (fallbackSurpriseImages[category]) {
                return fallbackSurpriseImages[category];
            }
        }
        
        // Check for partial matches (e.g., "ocean view" should match "ocean")
        for (const [keyword, category] of Object.entries(keywordMap)) {
            if (queryLower.includes(keyword)) {
                if (fallbackSurpriseImages[category]) {
                    return fallbackSurpriseImages[category];
                }
            }
        }
        
        // Return default images
        return fallbackSurpriseImages.default;
    }
    
    // Get random image from Unsplash based on query
    async function fetchSurpriseImage(query) {
        // If no query, use a random nature image
        if (!query || query.trim() === '') {
            query = 'nature';
        }
        
        // Always try Unsplash API first if access key is available
        if (CONFIG.api.accessKey && CONFIG.api.accessKey !== 'YOUR_UNSPLASH_ACCESS_KEY') {
            try {
                // Use Unsplash API to search for images based on the exact query
                const response = await fetch(
                    `${CONFIG.api.baseUrl}/search/photos?query=${encodeURIComponent(query)}&per_page=20&client_id=${CONFIG.api.accessKey}`
                );
                
                if (!response.ok) {
                    throw new Error(`Unsplash API error: ${response.status}`);
                }
                
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    // Get a random image from the results
                    const randomIndex = Math.floor(Math.random() * data.results.length);
                    return data.results[randomIndex].urls.regular;
                }
                
                // If no results for specific query, try a broader search
                const broadResponse = await fetch(
                    `${CONFIG.api.baseUrl}/search/photos?query=${encodeURIComponent(query)}&per_page=20&client_id=${CONFIG.api.accessKey}`
                );
                const broadData = await broadResponse.json();
                if (broadData.results && broadData.results.length > 0) {
                    const randomIndex = Math.floor(Math.random() * broadData.results.length);
                    return broadData.results[randomIndex].urls.regular;
                }
                
            } catch (error) {
                console.error('Error fetching from Unsplash API:', error);
            }
        }
        
        // Use improved fallback matching
        const matchingImages = getMatchingImages(query);
        return matchingImages[Math.floor(Math.random() * matchingImages.length)];
    }
    
    // Close popup
    function closeSurprisePopup() {
        surprisePopup.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Close on X button
    surpriseClose.addEventListener('click', closeSurprisePopup);
    
    // Close on background click
    surprisePopup.addEventListener('click', (e) => {
        if (e.target === surprisePopup) {
            closeSurprisePopup();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSurprisePopup();
        }
    });
    
    // Handle Surprise Me button click
    surpriseBtn.addEventListener('click', async () => {
        const query = surpriseInput.value.trim();
        
        if (!query) {
            surpriseInput.placeholder = 'Please enter a topic...';
            surpriseInput.style.borderColor = '#dc3545';
            setTimeout(() => {
                surpriseInput.placeholder = 'e.g., mountains, ocean, forest, wildlife...';
                surpriseInput.style.borderColor = '';
            }, 2000);
            return;
        }
        
        // Show loading state
        surpriseBtn.disabled = true;
        surpriseBtn.textContent = 'Loading...';
        surpriseInput.disabled = true;
        
        try {
            const imageUrl = await fetchSurpriseImage(query);
            
            // Set popup content
            surpriseImage.src = imageUrl;
            surpriseImage.alt = `Surprise image about ${query}`;
            surpriseTitle.textContent = `Here's your ${query}!`;
            surpriseDescription.textContent = `A random image about "${query}"`;
            
            // Show popup
            surprisePopup.classList.add('active');
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('Error loading surprise image:', error);
            surpriseTitle.textContent = 'Oops!';
            surpriseDescription.textContent = 'Could not load an image. Please try again.';
            surprisePopup.classList.add('active');
            document.body.style.overflow = 'hidden';
        } finally {
            // Reset button
            surpriseBtn.disabled = false;
            surpriseBtn.textContent = 'Surprise Me';
            surpriseInput.disabled = false;
            surpriseInput.focus();
        }
    });
    
    // Allow pressing Enter in the input field
    surpriseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            surpriseBtn.click();
        }
    });
}

// Sidebar toggle functionality
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        // Start with sidebar collapsed
        sidebar.classList.remove('open');
        sidebarToggle.classList.remove('open');
        
        // Toggle sidebar on button click
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarToggle.classList.toggle('open');
            sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
                sidebarToggle.classList.remove('open');
            }
        });
        
        // Prevent clicks inside sidebar from closing it
        sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Highlight active menu item
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    menuLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Image Popup Functionality
function initImagePopup() {
    const popup = document.getElementById('imagePopup');
    const popupImage = document.getElementById('popupImage');
    const popupClose = document.getElementById('popupClose');
    const popupAnimation = document.getElementById('popupAnimation');
    const popupTitle = document.getElementById('popupTitle');
    const popupDescription = document.getElementById('popupDescription');
    
    if (!popup || !popupImage || !popupClose) return;
    
    // Close popup
    function closePopup() {
        popup.classList.remove('active');
        popupAnimation.className = 'popup-animation';
        document.body.style.overflow = '';
    }
    
    popupClose.addEventListener('click', closePopup);
    
    // Close on background click
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closePopup();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePopup();
        }
    });
    
    // Click handler for gallery items
    document.getElementById('gallery')?.addEventListener('click', (e) => {
        const galleryItem = e.target.closest('.gallery-item');
        if (!galleryItem) return;
        
        const img = galleryItem.querySelector('img');
        const category = galleryItem.querySelector('.category')?.textContent || 'default';
        const photographer = galleryItem.querySelector('.photographer')?.textContent || '';
        
        if (img) {
            // Set popup content
            popupImage.src = img.src;
            popupImage.alt = img.alt;
            
            // Set animation based on category
            popupAnimation.className = 'popup-animation';
            const categoryLower = category.toLowerCase();
            
            if (categoryLower.includes('nature')) {
                popupAnimation.classList.add('nature');
                popupTitle.textContent = 'Nature in Motion';
                popupDescription.textContent = 'Experience the beauty of nature coming to life';
            } else if (categoryLower.includes('adventure')) {
                popupAnimation.classList.add('adventure');
                popupTitle.textContent = 'Adventure Awaits';
                popupDescription.textContent = 'Feel the thrill of exploration and discovery';
            } else if (categoryLower.includes('extreme')) {
                popupAnimation.classList.add('extreme');
                popupTitle.textContent = 'Extreme Action';
                popupDescription.textContent = 'Witness the intensity of extreme sports';
            } else {
                popupAnimation.classList.add('default');
                popupTitle.textContent = 'Image Animation';
                popupDescription.textContent = 'Watch the animation for 5 seconds';
            }
            
            // Add photographer info if available
            if (photographer) {
                popupDescription.textContent += ` - ${photographer}`;
            }
            
            // Show popup
            popup.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Auto-close after 5 seconds
            setTimeout(closePopup, 5000);
        }
    });
}

// Initialize the gallery when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    initSidebar();
    initImagePopup();
    initSurpriseMe();
    
    // Check for new day every hour
    setInterval(checkForNewDay, 60 * 60 * 1000);
});

// Also check when the page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkForNewDay();
    }
});
