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

// Initialize the gallery when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    
    // Check for new day every hour
    setInterval(checkForNewDay, 60 * 60 * 1000);
});

// Also check when the page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkForNewDay();
    }
});
