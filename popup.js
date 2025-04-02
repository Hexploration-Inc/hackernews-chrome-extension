// Use chrome.runtime.sendMessage to communicate with background page
// We'll store stories locally after fetching them

// DOM elements
const storiesList = document.getElementById('stories-list');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const lastUpdatedElement = document.getElementById('last-updated-time');
const storyCountElement = document.getElementById('story-count');
const searchInput = document.getElementById('search');
const sortBySelect = document.getElementById('sort-by');
const refreshBtn = document.getElementById('refresh-btn');

// Store stories in memory
let stories = [];

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadStories();
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError();
  }
});

// Load stories from Appwrite
async function loadStories() {
  try {
    showLoading();
    
    // Get stories from Appwrite via background script
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

// Render stories
function renderStories(storiesToRender) {
  // Clear existing stories
  storiesList.innerHTML = '';
  
  // Show stories list
  storiesList.classList.remove('hidden');
  
  // Create story elements
  storiesToRender.forEach(story => {
    const li = document.createElement('li');
    li.className = 'story-item';
    
    // Format time
    const storyTime = new Date(story.time * 1000);
    const timeFormatted = storyTime.toLocaleString();
    
    li.innerHTML = `
      <div class="story-score">${story.score}</div>
      <div class="story-content">
        <div class="story-title">
          <a href="${story.url || `https://news.ycombinator.com/item?id=${story.id}`}" target="_blank">
            ${story.title}
          </a>
        </div>
        <div class="story-meta">
          by ${story.by} • ${timeFormatted} • ${story.descendants || 0} comments
        </div>
      </div>
    `;
    
    storiesList.appendChild(li);
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
  const now = new Date();
  lastUpdatedElement.textContent = now.toLocaleString();
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', filterStories);
  
  // Sort select
  sortBySelect.addEventListener('change', filterStories);
  
  // Refresh button
  refreshBtn.addEventListener('click', loadStories);
}

// Show loading state
function showLoading() {
  loadingElement.classList.remove('hidden');
  errorElement.classList.add('hidden');
  storiesList.classList.add('hidden');
}

// Hide loading state
function hideLoading() {
  loadingElement.classList.add('hidden');
}

// Show error state
function showError() {
  loadingElement.classList.add('hidden');
  errorElement.classList.remove('hidden');
  storiesList.classList.add('hidden');
}

// Function to get stories from background script
async function getStoriesFromBackground() {
  return new Promise((resolve, reject) => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Send message to background script
    chrome.runtime.sendMessage(
      {
        action: 'getStories',
        date: today
      },
      response => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else if (response && response.error) {
          console.error('Error from background script:', response.error);
          reject(response.error);
        } else if (response && response.stories) {
          resolve(response.stories);
        } else {
          reject(new Error('Invalid response from background script'));
        }
      }
    );
  });
}
