// DOM elements
const storiesGrid = document.getElementById('stories-grid');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const lastUpdatedElement = document.getElementById('last-updated-time');
const storyCountElement = document.getElementById('story-count');
const searchInput = document.getElementById('search');
const sortBySelect = document.getElementById('sort-by');
const refreshBtn = document.getElementById('refresh-btn');
const themeToggle = document.getElementById('theme-toggle');

// Store stories in memory
let stories = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize theme
    initializeTheme();
    
    // Load stories
    await loadStories();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing page:', error);
    showError();
  }
});

// Load stories from Chrome storage or fetch if needed
async function loadStories() {
  try {
    showLoading();
    
    // Get stories from background script
    stories = await getStoriesFromBackground();
    
    // Update last updated time
    updateLastUpdatedTime();
    
    // Render stories
    renderStories(stories);
    
    // Update story count
    storyCountElement.textContent = stories.length;
    
    hideLoading();
  } catch (error) {
    console.error('Error loading stories:', error);
    showError();
  }
}

// Render stories in grid layout
function renderStories(storiesToRender) {
  // Clear existing stories
  storiesGrid.innerHTML = '';
  
  // Show stories grid
  storiesGrid.classList.remove('hidden');
  
  // Create story cards
  storiesToRender.forEach(story => {
    const card = document.createElement('div');
    card.className = 'story-card';
    
    // Format time
    const storyTime = new Date(story.time * 1000);
    const timeFormatted = storyTime.toLocaleString();
    
    // Create author initials for avatar
    const authorInitials = story.by.substring(0, 2).toUpperCase();
    
    // Get hostname for tag
    let hostname = '';
    try {
      if (story.url) {
        hostname = new URL(story.url).hostname.replace('www.', '');
      } else {
        hostname = 'news.ycombinator.com';
      }
    } catch (e) {
      hostname = 'news.ycombinator.com';
    }
    
    card.innerHTML = `
      <div class="story-header">
        <div class="author-info">
          <div class="author-avatar">${authorInitials}</div>
          <div>
            <div class="author-name">${story.by}</div>
            <div class="story-date">${timeFormatted}</div>
          </div>
        </div>
        <div class="story-tags">
          <span class="tag">${hostname}</span>
        </div>
      </div>
      <div class="story-body">
        <div class="story-title">
          <a href="${story.url || `https://news.ycombinator.com/item?id=${story.id}`}" target="_blank">
            ${story.title}
          </a>
        </div>
      </div>
      <div class="story-footer">
        <div class="story-stats">
          <div class="story-score">${story.score}</div>
          <div class="story-comments">${story.descendants || 0}</div>
        </div>
        <a href="${story.url || `https://news.ycombinator.com/item?id=${story.id}`}" class="story-link" target="_blank">
          Visit
        </a>
      </div>
    `;
    
    storiesGrid.appendChild(card);
  });
}

// Filter stories based on search
function filterStories() {
  const searchTerm = searchInput.value.toLowerCase();
  const sortBy = sortBySelect.value;
  
  // Filter stories
  let filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchTerm) || 
    story.by.toLowerCase().includes(searchTerm)
  );
  
  // Sort stories
  filteredStories.sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'time':
        return b.time - a.time;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'comments':
        return (b.descendants || 0) - (a.descendants || 0);
      default:
        return b.score - a.score;
    }
  });
  
  // Render filtered stories
  renderStories(filteredStories);
  
  // Update story count
  storyCountElement.textContent = filteredStories.length;
}

// Update last updated time
function updateLastUpdatedTime() {
  chrome.storage.local.get('lastFetched', (result) => {
    if (result.lastFetched) {
      const lastFetched = new Date(result.lastFetched);
      lastUpdatedElement.textContent = lastFetched.toLocaleString();
    } else {
      lastUpdatedElement.textContent = 'Never';
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', filterStories);
  
  // Sort select
  sortBySelect.addEventListener('change', filterStories);
  
  // Refresh button - fetch directly from HackerNews API
  refreshBtn.addEventListener('click', async () => {
    try {
      showLoading();
      console.log('Manually refreshing stories');
      
      // Request fresh data from HackerNews API via background script
      await chrome.runtime.sendMessage({ action: 'fetchNow' });
      
      // Wait a moment for the background script to process and save the data
      setTimeout(async () => {
        // Reload stories from storage
        await loadStories();
        console.log('Stories refreshed successfully');
      }, 1500);
    } catch (error) {
      console.error('Error refreshing stories:', error);
      showError();
    }
  });
  
  // Theme toggle
  themeToggle.addEventListener('change', () => {
    toggleTheme();
  });
}

// Show loading state
function showLoading() {
  loadingElement.classList.remove('hidden');
  errorElement.classList.add('hidden');
  storiesGrid.classList.add('hidden');
}

// Hide loading state
function hideLoading() {
  loadingElement.classList.add('hidden');
}

// Show error state
function showError() {
  loadingElement.classList.add('hidden');
  errorElement.classList.remove('hidden');
  storiesGrid.classList.add('hidden');
}

// Function to get stories from local storage or background script
async function getStoriesFromBackground() {
  return new Promise((resolve, reject) => {
    // First try to get stories from local storage
    chrome.storage.local.get(['stories', 'lastFetched'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error accessing local storage:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      
      // Check if we have stories and if they're relatively fresh (less than 3 hours old)
      const now = Date.now();
      const threeHoursInMs = 3 * 60 * 60 * 1000;
      
      if (result.stories && result.stories.length > 0 && 
          result.lastFetched && (now - result.lastFetched < threeHoursInMs)) {
        // Stories exist and are fresh, use them
        console.log(`Using ${result.stories.length} stories from local storage`);
        resolve(result.stories);
      } else {
        // Either no stories or they're old, fetch new ones
        console.log('No recent stories in storage, requesting fresh data');
        
        // Request the background script to fetch fresh data
        chrome.runtime.sendMessage(
          { action: 'fetchNow' },
          fetchResponse => {
            if (chrome.runtime.lastError) {
              console.error('Error requesting fresh data:', chrome.runtime.lastError);
              // If we have old stories, better use them than nothing
              if (result.stories && result.stories.length > 0) {
                console.log('Using older stories from storage as fallback');
                resolve(result.stories);
              } else {
                reject(chrome.runtime.lastError);
              }
            } else {
              // After fetching, get the updated stories from storage
              chrome.storage.local.get('stories', (freshResult) => {
                if (freshResult.stories && freshResult.stories.length > 0) {
                  console.log(`Got ${freshResult.stories.length} fresh stories`);
                  resolve(freshResult.stories);
                } else {
                  reject(new Error('Failed to get fresh stories'));
                }
              });
            }
          }
        );
      }
    });
  });
}

// Theme management functions
function initializeTheme() {
  // Check if user has a saved theme preference
  chrome.storage.local.get('theme', (result) => {
    if (result.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.checked = true;
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.checked = false;
    }
  });
}

// Toggle between light and dark themes
function toggleTheme() {
  if (themeToggle.checked) {
    // Switch to dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
    chrome.storage.local.set({ theme: 'dark' });
  } else {
    // Switch to light theme
    document.documentElement.setAttribute('data-theme', 'light');
    chrome.storage.local.set({ theme: 'light' });
  }
}
