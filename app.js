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
document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    initSidebar();
    initImagePopup();
    initSurpriseMe();
    displayRandomQuote();
    displayDailyStory();
    
    // Check for new day every hour
    setInterval(checkForNewDay, 60 * 60 * 1000);
});

// Daily Train Commute Stories
const trainStories = [
    {
        title: "The Caffeinated Architect",
        character: "Liam - Architect at Urban Design Studio",
        text: "At 7:45 AM, Liam sprints to the 8:00 train like his life depends on it. His coffee sloshes dangerously close to the rim of his 'World's Okayest Architect' mug. Today's challenge: explaining to his client why their dream 'open-concept' house can't actually have the bathroom in the middle of the kitchen. As the train lurches forward, he realizes he's wearing mismatched socks - again. 'At least they're both black,' he mutters, as his coffee finally wins the battle against gravity, staining his white shirt. The day has only just begun."
    },
    {
        title: "The Zen Librarian's Secret Life",
        character: "Mira - Head Librarian at Willow Creek Public Library",
        text: "Mira glides onto the 8:00 train with the grace of someone who has never once raised her voice, even when that toddler colored on page 47 of 'War and Peace.' Her secret? She's actually a former punk rock drummer. The other commuters see a woman peacefully reading 'The Art of Mindful Breathing.' What they don't see is the air-drumming happening under her cardigan. When the train hits a bump, her bookmark falls out - it's a 1987 concert ticket for The Clash. She smiles. Some secrets are worth keeping."
    },
    {
        title: "The Baker Who Hates Bread",
        character: "Tom - Master Baker at Golden Crust Bakery",
        text: "Tom boards the train at 8:00 AM sharp, carrying a box of his famous sourdough. Ironically, he's deathly allergic to gluten. 'The ultimate sacrifice for my art,' he tells the curious stranger who always sits next to him. Today, that stranger is eating a sandwich. Tom's eye twitches as crumbs land on his pristine white baker's jacket. He fantasizes about a world where people understand the concept of 'personal space' and 'not eating gluten around a gluten-intolerant baker.' The train ride feels like an eternity."
    },
    {
        title: "The Dog Walker's Pack",
        character: "Jessa - Professional Dog Walker and Human Therapist",
        text: "Jessa steps onto the 8:00 train looking like she's been through a war - because she has. Her jacket is covered in fur, her shoes are suspiciously damp, and there's a tooth mark on her backpack. She's just walked 12 dogs, including Mr. Wiggles, who insists on stopping at every fire hydrant, and Lady, who believes squirrels are the enemy. As she collapses into her seat, she realizes she's still holding a poop bag. The man next to her subtly moves away. Jessa doesn't notice - she's already asleep."
    },
    {
        title: "The Startup CEO's Commute",
        character: "Raj - CEO of a Tech Startup (That Might Be Failing)",
        text: "Raj boards the train at 7:59 AM, already on his third phone call. 'No, Karen, we can't just pivot to selling avocado toast,' he says, while simultaneously texting his developer about a critical bug. His 'World's Best Boss' mug is empty - he forgot to drink his coffee again. The train's WiFi is spotty, which is probably for the best. His laptop battery is at 3%. His hope is at 2%. But his hype is at 100%. 'We're going to change the world,' he whispers to himself, as the train pulls into the next station."
    },
    {
        title: "The Retired Spy",
        character: "Margaret - Former Intelligence Operative (Now a Knitting Enthusiast)",
        text: "Margaret takes her usual seat by the window at exactly 8:00 AM. She's been retired for 5 years, but old habits die hard. She's already identified three suspicious characters: a man with a briefcase (definitely a bomb), a woman with a large purse (probably a gun), and a teenager with headphones (clearly a spy). She casually knits what looks like a scarf but is actually a coded message. The man next to her tries to make small talk. She tells him her name is 'Smith.' It's not."
    },
    {
        title: "The Kindergarten Teacher's Summer",
        character: "Emily - Kindergarten Teacher (On Summer Break)",
        text: "Emily steps onto the 8:00 train and does something she hasn't done in 9 months - she sits down without checking if anyone needs help with their shoelaces. It's summer break. She's wearing actual adult clothes, not paint-stained jeans. Her coffee is still hot. She hasn't had to explain why the sky is blue today. The man next to her spills his coffee. She doesn't even flinch. She's earned this peace. Then a child on the train drops their ice cream. Emily sighs. Some habits never truly leave you."
    },
    {
        title: "The Plumber's Philosophy",
        character: "Dave - Philosopher Plumber at Dave's Drain Delights",
        text: "Dave the plumber boards the 8:00 train, still wiping his hands on a rag. He's been thinking deeply about life's mysteries. 'Why do people only call me when things are going downhill?' he ponders. His phone rings - another emergency. 'Ma'am, I understand your toilet is overflowing, but have you considered that maybe the universe is trying to tell you something?' The other passengers give him strange looks. Dave doesn't notice. He's too busy contemplating the meaning of 'flush' in the grand scheme of things."
    },
    {
        title: "The Wedding Planner's Nightmare",
        character: "Sophia - Wedding Planner to the Stars (And Their Divorces)",
        text: "Sophia steps onto the train at 8:00 AM, already stressed. Last night's dream involved a bride, a groom, and a runaway pony. She's currently planning three weddings and one divorce (the divorce is between two of the couples getting married - it's complicated). Her phone buzzes: 'Sophia, the flowers are the wrong shade of white!' She takes a deep breath. The man next to her is eating a very messy breakfast sandwich. She envies his simple problems. The train lurches. She spills her coffee on her 'Team Bride' shirt. Some days, she thinks she should have been a florist."
    },
    {
        title: "The Gym Trainer's Day Off",
        character: "Marcus - Personal Trainer (Who Needs a Personal Trainer)",
        text: "Marcus boards the 8:00 train looking like he just stepped out of a fitness magazine. His muscles have muscles. His protein shake is perfectly measured. His willpower is unbreakable. Then he sees the breakfast buffet in the dining car. 'Just one muffin,' he tells himself. One muffin turns into three. Then a croissant. Then a danish. By the time he gets off the train, he's consumed enough carbs to fuel a small country. He looks at his fitness tracker in horror. 'Tomorrow,' he promises himself. Tomorrow he'll be perfect again."
    },
    {
        title: "The Mystery Novelist",
        character: "Agatha - Crime Writer with a Dark Secret",
        text: "Agatha sits in her usual seat, typing furiously on her laptop. She's working on her next bestseller, 'The Case of the Missing Left Sock.' The plot twist? The sock was in the dryer all along. The man across from her is giving her strange looks. She's been describing him in her head as 'the man with the suspicious mustache and the briefcase that might contain a body.' He sneezes. She writes it down. 'Perfect,' she thinks. 'That's how the murderer will be caught.' The train arrives at her stop. She packs up, leaving behind a trail of plot holes and red herrings."
    },
    {
        title: "The Barista's Secret Identity",
        character: "Lena - Barista by Day, Rock Star by Night",
        text: "Lena steps onto the 8:00 train, her apron still smelling like coffee and cinnamon. Last night, she performed for 500 screaming fans. This morning, she made 200 lattes. The contrast isn't lost on her. The woman next to her is complaining about her coffee being too hot. Lena wants to scream. Instead, she smiles and thinks about last night's encore. The train hits a bump. The woman's coffee spills. Lena feels a small, petty sense of satisfaction. Then she feels guilty. Then she remembers she's a rock star and gets over it."
    },
    {
        title: "The Accountant's Rebellion",
        character: "Gary - Accountant (With a Wild Side)",
        text: "Gary boards the 8:00 train looking like every other accountant in the world. His briefcase is neatly organized. His shoes are perfectly polished. His spreadsheet skills are unmatched. What his coworkers don't know is that Gary is also the lead singer in a heavy metal band called 'Debits and Credits.' The man next to him is listening to classical music. Gary wants to tell him about last weekend's gig, but he doesn't. He just smiles and thinks about the time he crowd-surfed over a mosh pit of tax auditors. The train arrives. Gary steps off, ready to face another day of numbers and silence."
    },
    {
        title: "The Veterinarian's Menagerie",
        character: "Dr. Amanda - Veterinarian and Animal Whisperer",
        text: "Amanda steps onto the 8:00 train, still covered in a fine layer of dog hair. Her scrubs have a paw print on them. She smells faintly of antiseptic and treats. The man next to her moves away slightly. She doesn't notice - she's too busy thinking about Mr. Whiskers, who came in yesterday with a sock stuck on his head. 'How?' she still wonders. The train lurches. She almost falls asleep. She's been on call for 36 hours straight. The woman across from her is knitting a sweater. Amanda envies her. Then she remembers she once delivered a litter of puppies in a knitting store and feels better."
    },
    {
        title: "The Actor Waiting for His Break",
        character: "Brandon - Actor/Barista/Part-Time Dog Walker",
        text: "Brandon boards the 8:00 train, rehearsing his lines for an audition later today. He's playing a 'tortured soul with a dark past.' He should know - he's been torturing his soul with part-time jobs for years. The man next to him is reading a newspaper. Brandon practices his 'intense stare' in the reflection of the window. The man notices and looks away. Brandon takes this as a sign of his incredible acting ability. The train arrives at his stop. He steps off, ready to face another day of rejection, coffee spills, and dog walks. His big break is coming. Maybe."
    },
    {
        title: "The Chef's Commuting Kitchen",
        character: "Marco - Executive Chef at Le Petit Bistro",
        text: "Marco steps onto the 8:00 train, his mind already at the restaurant. He's planning tonight's special: 'Seared Scallops with a Citrus Beurre Blanc and a Side of My Sanity.' The train's dining car smells like microwave burritos. Marco wants to cry. The woman next to him is eating a protein bar. He judges her silently. Then he remembers he once ate a gas station hot dog and forgives her. His phone buzzes - a text from his sous chef: 'We're out of truffles.' Marco's eye twitches. Some days, he thinks he should have been a florist."
    },
    {
        title: "The Teacher's Summer School",
        character: "Mr. Thompson - High School History Teacher",
        text: "Mr. Thompson boards the 8:00 train, still wearing his 'World's Okayest Teacher' mug from last year's Secret Santa. He's been teaching for 25 years. He's seen it all: the kid who fell asleep in his own drool, the girl who tried to bribe him with cookies (it worked), and the boy who asked if World War II was in color. Today, he's grading papers. The man next to him is reading a book about the Civil War. Mr. Thompson wants to quiz him. He resists. Barely. The train arrives. He steps off, ready to face another day of shaping young minds and pretending he knows all the answers."
    },
    {
        title: "The IT Guy's Digital Detox",
        character: "Kevin - IT Support Specialist",
        text: "Kevin boards the 8:00 train, his phone already buzzing with emails. 'My computer won't turn on,' reads the first one. 'Have you tried turning it off and on again?' he replies, without even thinking. He's been doing this for 10 years. He's seen it all: the user who spilled coffee on their keyboard (and then tried to dry it in the microwave), the woman who thought her monitor was a touchscreen, and the man who called to ask how to open a PDF. The train's WiFi is down. Kevin almost smiles. Then he remembers he still has to fix the printer when he gets to the office. The smile fades."
    },
    {
        title: "The Nurse's Compassion",
        character: "Sarah - ER Nurse at City General Hospital",
        text: "Sarah steps onto the 8:00 train, her shoes still slightly damp from last night's shift. She's seen things that would make most people faint. She's held hands, wiped tears, and explained complicated medical terms in simple language. The man next to her is coughing loudly. Sarah wants to diagnose him on the spot. She resists. Barely. The train lurches. She almost falls asleep. She's been running on coffee and sheer willpower for days. The woman across from her offers her a mint. Sarah takes it. It's the small kindnesses that keep her going."
    },
    {
        title: "The Lawyer's Conscience",
        character: "Daniel - Defense Attorney (Who Sometimes Questions His Life Choices)",
        text: "Daniel boards the 8:00 train, his briefcase filled with case files. He's defending a man who stole a traffic cone. 'It was a cry for help,' the man had said. Daniel had nodded seriously. The train is filled with the usual commuters. Daniel looks at them and wonders: which one of them has stolen a traffic cone? Which one of them needs his help? The man next to him is reading a book about ethics. Daniel wants to laugh. Then he remembers he once got a parking ticket and felt guilty for a week. The train arrives. He steps off, ready to defend the indefensible once again."
    },
    {
        title: "The Journalist's Scoop",
        character: "Clara - Investigative Journalist",
        text: "Clara steps onto the 8:00 train, her notebook already out. She's working on a groundbreaking story: 'The Mystery of the Missing Office Stapler.' The clues are piling up. Suspects are everywhere. The janitor? Too obvious. The intern? Too new. The CEO? Maybe. The train lurches. Her pen rolls off her notebook. She picks it up and writes: 'The stapler was last seen on Tuesday. Coincidence?' The man next to her is reading a tabloid. Clara judges him silently. Then she remembers she once wrote an article about a talking parrot and feels better."
    }
];

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
function displayDailyStory() {
    const storyTitleElement = document.getElementById('storyTitle');
    const storyCharacterElement = document.getElementById('storyCharacter');
    const storyTextElement = document.getElementById('storyText');
    const storyDateElement = document.getElementById('storyDate');
    
    if (!storyTitleElement || !storyCharacterElement || !storyTextElement || !storyDateElement) return;
    
    // Use a seed based on the date to get a consistent story for the day
    const seed = getStorySeed();
    const storyIndex = seed % trainStories.length;
    const story = trainStories[storyIndex];
    
    // Format the date nicely
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('en-US', options);
    
    // Display the story
    storyTitleElement.textContent = story.title;
    storyCharacterElement.textContent = story.character;
    storyTextElement.textContent = story.text;
    storyDateElement.textContent = `Today's commute: ${dateString}`;
}

// Also check when the page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkForNewDay();
    }
});
