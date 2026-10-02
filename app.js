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
        totalItems: 1,     // Now only 1 image to display
        categories: ['nature', 'adventure', 'extreme']
    }
};

// DOM elements
const singleImageContainer = document.getElementById('singleImageContainer');
const singleImageElement = document.getElementById('singleImage');
const pixelLoadingElement = document.getElementById('pixelLoading');
const loadingElement = document.querySelector('.loading');
const lastUpdatedElement = document.getElementById('last-updated');
const singleImagePopup = document.getElementById('singleImagePopup');
const popupSingleImage = document.getElementById('popupSingleImage');
const singleImageClose = document.getElementById('singleImageClose');
const popupSingleAnimation = document.getElementById('popupSingleAnimation');
const popupSingleTitle = document.getElementById('popupSingleTitle');
const popupSingleDescription = document.getElementById('popupSingleDescription');

// State management
let currentImage = null;
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
        // Use a random page to get different images on each fetch
        const randomPage = Math.floor(Math.random() * 100) + 1;
        const response = await fetch(
            `${CONFIG.api.baseUrl}/search/photos?query=${category}&per_page=${count}&page=${randomPage}&client_id=${CONFIG.api.accessKey}`
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
 * Shuffle array randomly for fresh images on each refresh
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function randomShuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Get a random category from the available categories
 * @returns {string} Random category
 */
function getRandomCategory() {
    const categories = CONFIG.gallery.categories;
    return categories[Math.floor(Math.random() * categories.length)];
}

/**
 * Fetch a single random image for the gallery
 * @returns {Promise<Object>} Single image data
 */
async function fetchSingleImage() {
    // Select a random category
    const category = getRandomCategory();
    
    // Fetch images for the selected category
    const images = await fetchUnsplashImages(category, 30);
    
    // If we got images, select a random one
    if (images.length > 0) {
        const randomIndex = Math.floor(Math.random() * images.length);
        currentImage = images[randomIndex];
        currentImage.category = category; // Ensure category is set
    } else {
        // Fallback to a generic image
        currentImage = {
            url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
            category: category,
            photographer: 'Freestocks',
            full: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
            alt: `${category} photo`
        };
    }
    
    lastFetchDate = new Date().toDateString();
    return currentImage;
}

/**
 * Create pixel explosion loading animation
 */
function createPixelExplosion() {
    const container = pixelLoadingElement;
    container.innerHTML = '';
    
    // Create 81 pixels in a 9x9 grid for the reversed explosion effect
    const pixelCount = 81;
    const size = 12;
    const spacing = 20;
    const startSize = 200;
    
    for (let i = 0; i < pixelCount; i++) {
        const pixel = document.createElement('div');
        pixel.className = `pixel n${i + 1}`;
        
        // Position pixels in a grid pattern that expands outward
        const row = Math.floor(i / 9);
        const col = i % 9;
        const center = startSize / 2;
        const x = center + (col - 4) * spacing;
        const y = center + (row - 4) * spacing;
        
        pixel.style.top = `${y}px`;
        pixel.style.left = `${x}px`;
        
        container.appendChild(pixel);
    }
    
    // Show the loading animation
    container.classList.remove('hidden');
}

/**
 * Hide pixel explosion loading animation
 */
function hidePixelExplosion() {
    if (pixelLoadingElement) {
        pixelLoadingElement.classList.add('hidden');
    }
}

/**
 * Render the single image with loading animation
 * @param {Object} image - Single image data
 */
function renderSingleImage(image) {
    if (!singleImageElement || !singleImageContainer) return;
    
    // Set the image source
    singleImageElement.src = image.url;
    singleImageElement.alt = image.alt || `${image.category} photo by ${image.photographer}`;
    singleImageElement.loading = 'eager';
    
    // Show loading animation
    createPixelExplosion();
    
    // When image loads, hide loading and show image
    singleImageElement.onload = function() {
        singleImageElement.classList.add('loaded');
        hidePixelExplosion();
        loadingElement.style.display = 'none';
        lastUpdatedElement.textContent = new Date().toLocaleString();
    };
    
    // Handle image load error
    singleImageElement.onerror = function() {
        // Use fallback image
        singleImageElement.src = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800';
        singleImageElement.alt = 'Fallback nature photo';
    };
    
    // Store the current image for popup
    currentImage = image;
}

/**
 * Initialize the single image gallery
 */
async function initSingleImage() {
    try {
        const image = await fetchSingleImage();
        renderSingleImage(image);
    } catch (error) {
        console.error('Error initializing single image:', error);
        loadingElement.textContent = 'Error loading image. Please try again later.';
    }
}

/**
 * Refresh the single image with a new random image
 */
function refreshSingleImage() {
    // Force a fresh fetch
    lastFetchDate = null;
    currentImage = null;
    loadingElement.style.display = 'block';
    
    // Clear the current image
    if (singleImageElement) {
        singleImageElement.classList.remove('loaded');
    }
    
    initSingleImage();
}

/**
 * Initialize single image click popup
 */
function initSingleImagePopup() {
    if (!singleImageContainer || !singleImagePopup) return;
    
    // Close popup
    function closeSingleImagePopup() {
        singleImagePopup.classList.remove('active');
        popupSingleAnimation.className = 'popup-animation';
        document.body.style.overflow = '';
    }
    
    singleImageClose.addEventListener('click', closeSingleImagePopup);
    
    // Close on background click
    singleImagePopup.addEventListener('click', (e) => {
        if (e.target === singleImagePopup) {
            closeSingleImagePopup();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSingleImagePopup();
        }
    });
    
    // Click handler for single image
    singleImageContainer.addEventListener('click', (e) => {
        if (!currentImage) return;
        
        // Set popup content
        popupSingleImage.src = currentImage.url || currentImage.full || currentImage.src;
        popupSingleImage.alt = currentImage.alt || `${currentImage.category} photo`;
        
        // Set animation based on category
        popupSingleAnimation.className = 'popup-animation';
        const categoryLower = (currentImage.category || '').toLowerCase();
        
        if (categoryLower.includes('nature')) {
            popupSingleAnimation.classList.add('nature');
            popupSingleTitle.textContent = 'Nature in Motion';
            popupSingleDescription.textContent = 'Experience the beauty of nature coming to life';
        } else if (categoryLower.includes('adventure')) {
            popupSingleAnimation.classList.add('adventure');
            popupSingleTitle.textContent = 'Adventure Awaits';
            popupSingleDescription.textContent = 'Feel the thrill of exploration and discovery';
        } else if (categoryLower.includes('extreme')) {
            popupSingleAnimation.classList.add('extreme');
            popupSingleTitle.textContent = 'Extreme Action';
            popupSingleDescription.textContent = 'Witness the intensity of extreme sports';
        } else {
            popupSingleAnimation.classList.add('default');
            popupSingleTitle.textContent = 'Image Animation';
            popupSingleDescription.textContent = 'Watch the animation for 5 seconds';
        }
        
        // Add photographer info if available
        if (currentImage.photographer) {
            popupSingleDescription.textContent += ` - Photo: ${currentImage.photographer}`;
        }
        
        // Show popup
        singleImagePopup.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Auto-close after 5 seconds
        setTimeout(closeSingleImagePopup, 5000);
    });
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
    
    // Generic fallback images that can be used for any query
    const genericFallbackImages = [
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
    ];
    
    // Get random image from Unsplash based on ANY query
    async function fetchSurpriseImage(query) {
        // If no query, use a random nature image
        if (!query || query.trim() === '') {
            query = 'nature';
        }
        
        // Always try Unsplash API first if access key is available
        if (CONFIG.api.accessKey && CONFIG.api.accessKey !== 'YOUR_UNSPLASH_ACCESS_KEY') {
            try {
                // Use Unsplash API to search for images based on the exact user query
                // Fetch 30 images to have a good selection
                const response = await fetch(
                    `${CONFIG.api.baseUrl}/search/photos?query=${encodeURIComponent(query)}&per_page=30&client_id=${CONFIG.api.accessKey}`
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
                
            } catch (error) {
                console.error('Error fetching from Unsplash API:', error);
            }
        }
        
        // If API is not available or no results, use a random generic fallback image
        // This ensures ANY text input will return an image
        return genericFallbackImages[Math.floor(Math.random() * genericFallbackImages.length)];
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

// BrainyQuote weird quotes collection
const weirdQuotes = [
    { quote: "Reality is merely an illusion, albeit a very persistent one.", author: "Albert Einstein" },
    { quote: "I used to be a baker, but I couldn't make enough dough.", author: "Unknown" },
    { quote: "I told my wife she was drawing her eyebrows too high. She looked surprised.", author: "Unknown" },
    { quote: "I'm reading a book about anti-gravity. It's impossible to put down.", author: "Unknown" },
    { quote: "I used to play piano by ear, but now I use my hands.", author: "Unknown" },
    { quote: "Why don't scientists trust atoms? Because they make up everything.", author: "Unknown" },
    { quote: "I told my doctor I broke my arm in two places. He told me to stop going to those places.", author: "Henny Youngman" },
    { quote: "Time flies like an arrow. Fruit flies like a banana.", author: "Groucho Marx" },
    { quote: "I am not young enough to know everything.", author: "Oscar Wilde" },
    { quote: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
    { quote: "I can resist everything except temptation.", author: "Oscar Wilde" },
    { quote: "The only way to get rid of a temptation is to yield to it.", author: "Oscar Wilde" },
    { quote: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
    { quote: "If you think you are too small to make a difference, try sleeping with a mosquito.", author: "Dalai Lama" },
    { quote: "The early bird gets the worm, but the second mouse gets the cheese.", author: "Steven Wright" },
    { quote: "I used to be indecisive. Now I'm not so sure.", author: "Unknown" },
    { quote: "What's the use of happiness? It can't buy you money.", author: "Henry Youngman" },
    { quote: "The more I see of men, the more I like dogs.", author: "Madame de Staël" },
    { quote: "I never forget a face, but in your case I'll be glad to make an exception.", author: "Groucho Marx" },
    { quote: "A day without sunshine is like, you know, night.", author: "Steve Martin" },
    { quote: "I am free of all prejudice. I hate everyone equally.", author: "W.C. Fields" }
];

/**
 * Display a random weird quote from BrainyQuote
 */
function displayRandomQuote() {
    const quoteElement = document.getElementById('randomQuote');
    const authorElement = document.getElementById('quoteAuthor');
    if (!quoteElement || !authorElement) return;
    const randomIndex = Math.floor(Math.random() * weirdQuotes.length);
    const { quote, author } = weirdQuotes[randomIndex];
    quoteElement.textContent = `"${quote}"`;
    authorElement.textContent = `— ${author}`;
}

// Initialize the gallery when the page loads


// Daily Train Commute Stories - 365 unique stories, one for each day of the year
const trainStories = [
    {title:"The Caffeinated Architect",character:"Liam - Architect at Urban Design Studio",text:"At 7:45 AM, Liam sprints to the 8:00 train like his life depends on it. His coffee sloshes dangerously close to the rim of his 'World's Okayest Architect' mug. Today's challenge: explaining to his client why their dream 'open-concept' house can't actually have the bathroom in the middle of the kitchen. As the train lurches forward, he realizes he's wearing mismatched socks - again. 'At least they're both black,' he mutters, as his coffee finally wins the battle against gravity, staining his white shirt. The day has only just begun, and he hasn't even reached the office yet. He takes a deep breath, adjusts his tie, and reminds himself that at least he's not the guy who designed that building shaped like a giant toaster."},
    {title:"The Zen Librarian's Secret Life",character:"Mira - Head Librarian at Willow Creek Public Library",text:"Mira glides onto the 8:00 train with the grace of someone who has never once raised her voice, even when that toddler colored on page 47 of 'War and Peace.' Her secret? She's actually a former punk rock drummer. The other commuters see a woman peacefully reading 'The Art of Mindful Breathing.' What they don't see is the air-drumming happening under her cardigan. When the train hits a bump, her bookmark falls out - it's a 1987 concert ticket for The Clash. She smiles. Some secrets are worth keeping. The teenager across the aisle is playing music without headphones. Mira resists the urge to confiscate his phone. Old habits die hard, but she's working on it."},
    {title:"The Baker Who Hates Bread",character:"Tom - Master Baker at Golden Crust Bakery",text:"Tom boards the train at 8:00 AM sharp, carrying a box of his famous sourdough. Ironically, he's deathly allergic to gluten. 'The ultimate sacrifice for my art,' he tells the curious stranger who always sits next to him. Today, that stranger is eating a sandwich. Tom's eye twitches as crumbs land on his pristine white baker's jacket. He fantasizes about a world where people understand the concept of 'personal space' and 'not eating gluten around a gluten-intolerant baker.' The train ride feels like an eternity. He pulls out his emergency inhaler, just in case. The sandwich-eater offers him a bite. Tom politely declines and silently weeps inside."},
    {title:"The Dog Walker's Pack",character:"Jessa - Professional Dog Walker and Human Therapist",text:"Jessa steps onto the 8:00 train looking like she's been through a war - because she has. Her jacket is covered in fur, her shoes are suspiciously damp, and there's a tooth mark on her backpack. She's just walked 12 dogs, including Mr. Wiggles, who insists on stopping at every fire hydrant, and Lady, who believes squirrels are the enemy. As she collapses into her seat, she realizes she's still holding a poop bag. The man next to her subtly moves away. Jessa doesn't notice - she's already asleep, dreaming of a world where dogs understand the concept of 'personal boundaries' and 'not licking strangers' faces.'"},
    {title:"The Startup CEO's Commute",character:"Raj - CEO of a Tech Startup (That Might Be Failing)",text:"Raj boards the train at 7:59 AM, already on his third phone call. 'No, Karen, we can't just pivot to selling avocado toast,' he says, while simultaneously texting his developer about a critical bug. His 'World's Best Boss' mug is empty - he forgot to drink his coffee again. The train's WiFi is spotty, which is probably for the best. His laptop battery is at 3%. His hope is at 2%. But his hype is at 100%. 'We're going to change the world,' he whispers to himself, as the train pulls into the next station. His phone buzzes with another notification: 'Server is down.' Raj takes a deep breath and remembers that every successful entrepreneur started with a dream and a lot of problems."},
    {title:"The Retired Spy",character:"Margaret - Former Intelligence Operative (Now a Knitting Enthusiast)",text:"Margaret takes her usual seat by the window at exactly 8:00 AM. She's been retired for 5 years, but old habits die hard. She's already identified three suspicious characters: a man with a briefcase (definitely a bomb), a woman with a large purse (probably a gun), and a teenager with headphones (clearly a spy). She casually knits what looks like a scarf but is actually a coded message. The man next to her tries to make small talk. She tells him her name is 'Smith.' It's not. He asks what she does for a living. 'I'm in... textiles,' she says, eyeing his suspiciously bulky jacket. The train lurches, and she subtly checks her watch - old habits indeed die hard."},
    {title:"The Kindergarten Teacher's Summer",character:"Emily - Kindergarten Teacher (On Summer Break)",text:"Emily steps onto the 8:00 train and does something she hasn't done in 9 months - she sits down without checking if anyone needs help with their shoelaces. It's summer break. She's wearing actual adult clothes, not paint-stained jeans. Her coffee is still hot. She hasn't had to explain why the sky is blue today. The man next to her spills his coffee. She doesn't even flinch. She's earned this peace. Then a child on the train drops their ice cream. Emily sighs and hands the child a napkin from her purse. Some habits never truly leave you. She catches herself humming 'The Wheels on the Bus' and quickly switches to a more age-appropriate tune. Maybe."},
    {title:"The Plumber's Philosophy",character:"Dave - Philosopher Plumber at Dave's Drain Delights",text:"Dave the plumber boards the 8:00 train, still wiping his hands on a rag. He's been thinking deeply about life's mysteries. 'Why do people only call me when things are going downhill?' he ponders. His phone rings - another emergency. 'Ma'am, I understand your toilet is overflowing, but have you considered that maybe the universe is trying to tell you something?' The other passengers give him strange looks. Dave doesn't notice. He's too busy contemplating the meaning of 'flush' in the grand scheme of things. A woman across the aisle is knitting. Dave wonders if she's ever had to unclog a drain with a knitting needle. He makes a mental note to ask, then remembers he probably shouldn't."},
    {title:"The Wedding Planner's Nightmare",character:"Sophia - Wedding Planner to the Stars (And Their Divorces)",text:"Sophia steps onto the train at 8:00 AM, already stressed. Last night's dream involved a bride, a groom, and a runaway pony. She's currently planning three weddings and one divorce (the divorce is between two of the couples getting married - it's complicated). Her phone buzzes: 'Sophia, the flowers are the wrong shade of white!' She takes a deep breath. The man next to her is eating a very messy breakfast sandwich. She envies his simple problems. The train lurches. She spills her coffee on her 'Team Bride' shirt. Some days, she thinks she should have been a florist. Then she remembers that florists have to deal with roses that won't open and brides who want peonies in December, and decides she's exactly where she belongs."},
    {title:"The Gym Trainer's Day Off",character:"Marcus - Personal Trainer (Who Needs a Personal Trainer)",text:"Marcus boards the 8:00 train looking like he just stepped out of a fitness magazine. His muscles have muscles. His protein shake is perfectly measured. His willpower is unbreakable. Then he sees the breakfast buffet in the dining car. 'Just one muffin,' he tells himself. One muffin turns into three. Then a croissant. Then a danish. By the time he gets off the train, he's consumed enough carbs to fuel a small country. He looks at his fitness tracker in horror. 'Tomorrow,' he promises himself. Tomorrow he'll be perfect again. He pulls out his phone to log his 'cheat meal' and accidentally drops it. As he bends to pick it up, he notices the man next to him eating a donut. Marcus weeps silently."},
    {title:"The Mystery Novelist",character:"Agatha - Crime Writer with a Dark Secret",text:"Agatha sits in her usual seat, typing furiously on her laptop. She's working on her next bestseller, 'The Case of the Missing Left Sock.' The plot twist? The sock was in the dryer all along. The man across from her is giving her strange looks. She's been describing him in her head as 'the man with the suspicious mustache and the briefcase that might contain a body.' He sneezes. She writes it down. 'Perfect,' she thinks. 'That's how the murderer will be caught.' The train arrives at her stop. She packs up, leaving behind a trail of plot holes and red herrings. As she walks away, she wonders if the man with the mustache will be her next victim. In her book, of course. Probably."},
    {title:"The Barista's Secret Identity",character:"Lena - Barista by Day, Rock Star by Night",text:"Lena steps onto the 8:00 train, her apron still smelling like coffee and cinnamon. Last night, she performed for 500 screaming fans. This morning, she made 200 lattes. The contrast isn't lost on her. The woman next to her is complaining about her coffee being too hot. Lena wants to scream. Instead, she smiles and thinks about last night's encore. The train hits a bump. The woman's coffee spills. Lena feels a small, petty sense of satisfaction. Then she feels guilty. Then she remembers she's a rock star and gets over it. She pulls out her phone to check the setlist for tonight's show and accidentally shows the woman next to her a photo of her crowd-surfing. The woman's jaw drops. Lena just winks."},
    {title:"The Accountant's Rebellion",character:"Gary - Accountant (With a Wild Side)",text:"Gary boards the 8:00 train looking like every other accountant in the world. His briefcase is neatly organized. His shoes are perfectly polished. His spreadsheet skills are unmatched. What his coworkers don't know is that Gary is also the lead singer in a heavy metal band called 'Debits and Credits.' The man next to him is listening to classical music. Gary wants to tell him about last weekend's gig, but he doesn't. He just smiles and thinks about the time he crowd-surfed over a mosh pit of tax auditors. The train arrives. Gary steps off, ready to face another day of numbers and silence. He adjusts his tie and reminds himself that tonight, he'll be screaming into a microphone instead of calculating depreciation."},
    {title:"The Veterinarian's Menagerie",character:"Dr. Amanda - Veterinarian and Animal Whisperer",text:"Amanda steps onto the 8:00 train, still covered in a fine layer of dog hair. Her scrubs have a paw print on them. She smells faintly of antiseptic and treats. The man next to her moves away slightly. She doesn't notice - she's too busy thinking about Mr. Whiskers, who came in yesterday with a sock stuck on his head. 'How?' she still wonders. The train lurches. She almost falls asleep. She's been on call for 36 hours straight. The woman across from her is knitting a sweater. Amanda envies her. Then she remembers she once delivered a litter of puppies in a knitting store and feels better. She pulls out her phone to check on a patient and shows the woman a photo of a very grumpy cat wearing a cone. The woman laughs. Amanda smiles. This is why she does what she does."},
    {title:"The Actor Waiting for His Break",character:"Brandon - Actor/Barista/Part-Time Dog Walker",text:"Brandon boards the 8:00 train, rehearsing his lines for an audition later today. He's playing a 'tortured soul with a dark past.' He should know - he's been torturing his soul with part-time jobs for years. The man next to him is reading a newspaper. Brandon practices his 'intense stare' in the reflection of the window. The man notices and looks away. Brandon takes this as a sign of his incredible acting ability. The train arrives at his stop. He steps off, ready to face another day of rejection, coffee spills, and dog walks. His big break is coming. Maybe. He checks his phone - no messages from his agent. He takes a deep breath and remembers that every great actor started somewhere. Probably at the bottom, like him."},
    {title:"The Chef's Commuting Kitchen",character:"Marco - Executive Chef at Le Petit Bistro",text:"Marco steps onto the 8:00 train, his mind already at the restaurant. He's planning tonight's special: 'Seared Scallops with a Citrus Beurre Blanc and a Side of My Sanity.' The train's dining car smells like microwave burritos. Marco wants to cry. The woman next to him is eating a protein bar. He judges her silently. Then he remembers he once ate a gas station hot dog and forgives her. His phone buzzes - a text from his sous chef: 'We're out of truffles.' Marco's eye twitches. Some days, he thinks he should have been a florist. Then he remembers that florists don't get to plate beautiful dishes and create culinary masterpieces. He takes a deep breath and starts mentally preparing his specials for the day."},
    {title:"The Teacher's Summer School",character:"Mr. Thompson - High School History Teacher",text:"Mr. Thompson boards the 8:00 train, still wearing his 'World's Okayest Teacher' mug from last year's Secret Santa. He's been teaching for 25 years. He's seen it all: the kid who fell asleep in his own drool, the girl who tried to bribe him with cookies (it worked), and the boy who asked if World War II was in color. Today, he's grading papers. The man next to him is reading a book about the Civil War. Mr. Thompson wants to quiz him. He resists. Barely. The train arrives. He steps off, ready to face another day of shaping young minds and pretending he knows all the answers. He pulls out his red pen and reminds himself that at least he's not the one taking the test."},
    {title:"The IT Guy's Digital Detox",character:"Kevin - IT Support Specialist",text:"Kevin boards the 8:00 train, his phone already buzzing with emails. 'My computer won't turn on,' reads the first one. 'Have you tried turning it off and on again?' he replies, without even thinking. He's been doing this for 10 years. He's seen it all: the user who spilled coffee on their keyboard (and then tried to dry it in the microwave), the woman who thought her monitor was a touchscreen, and the man who called to ask how to open a PDF. The train's WiFi is down. Kevin almost smiles. Then he remembers he still has to fix the printer when he gets to the office. The smile fades. He takes a deep breath and reminds himself that at least he's not the one who spilled coffee on the keyboard. Today."},
    {title:"The Nurse's Compassion",character:"Sarah - ER Nurse at City General Hospital",text:"Sarah steps onto the 8:00 train, her shoes still slightly damp from last night's shift. She's seen things that would make most people faint. She's held hands, wiped tears, and explained complicated medical terms in simple language. The man next to her is coughing loudly. Sarah wants to diagnose him on the spot. She resists. Barely. The train lurches. She almost falls asleep. She's been running on coffee and sheer willpower for days. The woman across from her offers her a mint. Sarah takes it. It's the small kindnesses that keep her going. She closes her eyes for a moment and thinks about the lives she's touched. Then she opens them and realizes she's missed her stop. Again."},
    {title:"The Lawyer's Conscience",character:"Daniel - Defense Attorney (Who Sometimes Questions His Life Choices)",text:"Daniel boards the 8:00 train, his briefcase filled with case files. He's defending a man who stole a traffic cone. 'It was a cry for help,' the man had said. Daniel had nodded seriously. The train is filled with the usual commuters. Daniel looks at them and wonders: which one of them has stolen a traffic cone? Which one of them needs his help? The man next to him is reading a book about ethics. Daniel wants to laugh. Then he remembers he once got a parking ticket and felt guilty for a week. The train arrives. He steps off, ready to defend the indefensible once again. He adjusts his tie and reminds himself that everyone deserves a defense, even traffic cone thieves."},
    {title:"The Journalist's Scoop",character:"Clara - Investigative Journalist",text:"Clara steps onto the 8:00 train, her notebook already out. She's working on a groundbreaking story: 'The Mystery of the Missing Office Stapler.' The clues are piling up. Suspects are everywhere. The janitor? Too obvious. The intern? Too new. The CEO? Maybe. The train lurches. Her pen rolls off her notebook. She picks it up and writes: 'The stapler was last seen on Tuesday. Coincidence?' The man next to her is reading a tabloid. Clara judges him silently. Then she remembers she once wrote an article about a talking parrot and feels better. She pulls out her phone to check her emails and sees a message from her editor: 'Where's that stapler story?' She sighs and gets back to work."},
    {title:"The Firefighter's Quiet Morning",character:"Ethan - Firefighter at Station 12",text:"Ethan steps onto the 8:00 train, still smelling faintly of smoke from last night's call. He's been a firefighter for 15 years, and he's seen it all - from cats in trees to full-blown infernos. Today, he's just trying to enjoy a quiet commute. The man next to him is complaining about his coffee being too cold. Ethan wants to tell him about the time he pulled a family out of a burning building, but he doesn't. He just smiles and sips his own coffee, which is the perfect temperature. The train lurches, and Ethan instinctively checks the exits. Old habits die hard. He pulls out his phone to check the weather - not for himself, but for the city he's sworn to protect."},
    {title:"The Mail Carrier's Route",character:"Frank - Mail Carrier with a Secret",text:"Frank boards the 8:00 train, his mailbag already half-full. He's been delivering mail for 30 years, rain or shine, snow or sleet. The other commuters don't know his secret: he's actually a published poet. His first collection, 'Letters to Strangers,' came out last year. The woman next to him is reading a romance novel. Frank wants to tell her about his poetry, but he doesn't. He just smiles and thinks about the time he delivered a letter that changed someone's life. The train arrives at his stop. He steps off, ready to deliver more than just mail. He adjusts his cap and reminds himself that every letter has a story."},
    {title:"The Taxi Driver's Stories",character:"Mohammed - Taxi Driver and Amateur Historian",text:"Mohammed steps onto the 8:00 train, still in his taxi driver uniform. He's been driving for 20 years, and he's seen it all. He's also an amateur historian with a particular interest in the city's past. The man next to him is reading a guidebook. Mohammed wants to tell him about the time he gave a tour to a famous historian, but he doesn't. He just smiles and thinks about the stories he's collected over the years. The train lurches, and Mohammed instinctively checks his watch. He's got a full day of driving ahead, and he can't wait to see what stories he'll collect today."},
    {title:"The Janitor's Wisdom",character:"Henry - Janitor at Lincoln High School",text:"Henry boards the 8:00 train, his mop and bucket securely stowed. He's been a janitor for 25 years, and he's seen it all - from food fights in the cafeteria to prom night disasters. He's also the unofficial counselor for the students, who come to him with their problems. The woman next to him is reading a self-help book. Henry wants to tell her that he's got more wisdom in his little finger than that book has in its entire pages, but he doesn't. He just smiles and thinks about the time he helped a student turn their life around. The train arrives at his stop. He steps off, ready to clean up more than just messes."},
    {title:"The Bus Driver's View",character:"Rosa - Bus Driver with a Green Thumb",text:"Rosa steps onto the 8:00 train, still in her bus driver uniform. She's been driving for 15 years, and she's seen it all. She's also an avid gardener with a particular love for roses. The man next to her is complaining about the weather. Rosa wants to tell him about the time she won a gardening competition, but she doesn't. She just smiles and thinks about her garden, which is her pride and joy. The train lurches, and Rosa instinctively checks her watch. She's got a full day of driving ahead, and she can't wait to get home to her garden. She pulls out her phone to check on the weather - not for herself, but for her roses."},
    {title:"The Security Guard's Watch",character:"James - Security Guard and Aspiring Novelist",text:"James boards the 8:00 train, his security guard uniform crisp and clean. He's been a security guard for 10 years, and he's seen it all. He's also an aspiring novelist with a particular love for mystery stories. The woman next to him is reading a mystery novel. James wants to tell her about his own novel, which is almost finished, but he doesn't. He just smiles and thinks about the time he caught a thief red-handed. The train arrives at his stop. He steps off, ready to protect and serve. He pulls out his notebook and jots down a few ideas for his novel, inspired by the people he's seen today."}
];

// Generate 365 stories - combining hand-written stories with algorithmic generation

function generateFullYearStories() {
    const baseStories = trainStories.slice();
    const allStories = [];
    
    const firstNames = ['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Hank','Ivy','Jack'];
    const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez'];
    const jobs = ['Architect','Librarian','Baker','Dog Walker','CEO','Spy','Teacher','Plumber'];
    const quirks = ['former punk rocker','allergic to gluten','wears mismatched socks','secret poet'];
    
    for (let i = 0; i < 340; i++) {
        const name = firstNames[i % firstNames.length] + ' ' + lastNames[(i * 3) % lastNames.length];
        const job = jobs[(i * 7) % jobs.length];
        const quirk = quirks[(i * 13) % quirks.length];
        const dayOfYear = i + 1;
        
        let story = `${name}, a ${quirk} ${job}, steps onto the 8:00 train on day ${dayOfYear} of the year. Today promises to be another interesting day with meetings, emails, and unexpected surprises. As the train lurches forward, they realize theyve forgotten something important. Probably their lunch. The person next to them is reading a book, and ${name} briefly envies their peaceful morning before diving back into their own busy world.`;
        
        allStories.push({
            title: `${name}'s Day ${dayOfYear} Commute`,
            character: `${name} - ${quirk} ${job}`,
            text: story
        });
    }
    
    return baseStories.concat(allStories);
}

const fullYearStories = generateFullYearStories();

/**
 * Get a seed based on the current date for consistent daily stories
 * @returns {number} Seed value
 */
function getStorySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

/**
 * Display a new train commute story every day
 */


document.addEventListener('DOMContentLoaded', () => {
    initSingleImage();
    initSidebar();
    initSingleImagePopup();
    initImagePopup();
    initSurpriseMe();
    displayRandomQuote();
    displayDailyStory();
    
    // Refresh gallery on page refresh - no daily caching
    // Check for new day every hour (kept for backward compatibility)
    setInterval(refreshSingleImage, 60 * 60 * 1000);
})

function displayDailyStory() {
    const storyTitleElement = document.getElementById('storyTitle');
    const storyCharacterElement = document.getElementById('storyCharacter');
    const storyTextElement = document.getElementById('storyText');
    const storyDateElement = document.getElementById('storyDate');
    
    if (!storyTitleElement || !storyCharacterElement || !storyTextElement || !storyDateElement) return;
    
    // Use a seed based on the date to get a consistent story for the day
    const seed = getStorySeed();
    const storyIndex = seed % fullYearStories.length;
    const story = fullYearStories[storyIndex];
    
    // Format the date nicely
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('en-US', options);
    
    // Display the story
    storyTitleElement.textContent = story.title;
    storyCharacterElement.textContent = story.character;
    storyTextElement.textContent = story.text;
    storyDateElement.textContent = `Today's commute: ${dateString}`;
}

// Also refresh when the page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        refreshSingleImage();
    }
});
