// Very simple background script for Chrome extension
// This will definitely load and then we can add functionality

console.log('Background script loaded successfully');

// Set up alarm for data fetching every 3 hours
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed, setting up alarm');
  // Fetch stories immediately
  fetchTopStories();
  // Set up alarm to refresh every 3 hours (180 minutes)
  chrome.alarms.create('fetchStories', { periodInMinutes: 180 });
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetchStories') {
    console.log('Alarm triggered: time to fetch stories');
    fetchTopStories();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  if (message.action === 'getStories') {
    // Check if stories exist in storage, if not fetch them immediately
    chrome.storage.local.get(['stories', 'lastFetched'], (result) => {
      console.log('Storage result:', result);
      
      if (result.stories && result.stories.length > 0) {
        console.log(`Found ${result.stories.length} stories in storage`);
        sendResponse({ stories: result.stories });
      } else {
        console.log('No stories found in storage, fetching now...');
        // Fetch stories immediately if none exist
        fetchTopStories()
          .then(stories => {
            console.log(`Fetched ${stories.length} stories`);
            sendResponse({ stories: stories });
          })
          .catch(error => {
            console.error('Error fetching stories:', error);
            sendResponse({ stories: [], error: error.message });
          });
      }
    });
    return true; // Required for async response
  }
  
  if (message.action === 'fetchNow') {
    console.log('Manually triggered fetch');
    fetchTopStories()
      .then(stories => sendResponse({ success: true, count: stories.length }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Required for async response
  }
});

// Function to fetch top stories from HackerNews API
async function fetchTopStories() {
  try {
    console.log('Fetching top stories directly from HackerNews API');
    
    // HackerNews API endpoints
    const TOP_STORIES_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
    const ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item/';
    
    // Get top stories
    const response = await fetch(TOP_STORIES_URL);
    const storyIds = await response.json();
    
    // Take top 100 stories
    const top100Ids = storyIds.slice(0, 100);
    
    // Fetch all 100 stories
    const storyPromises = top100Ids.map(async (id) => {
      const response = await fetch(`${ITEM_URL}${id}.json`);
      return await response.json();
    });
    
    const stories = await Promise.all(storyPromises);
    
    // Format stories
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const formattedStories = stories.map(story => ({
      title: story.title,
      url: story.url,
      score: story.score,
      by: story.by,
      time: story.time,
      descendants: story.descendants || 0,
      id: story.id,
      fetchDate: today
    }));
    
    // Store in Chrome's local storage
    chrome.storage.local.set({ 
      stories: formattedStories, 
      lastFetched: Date.now() 
    }, () => {
      console.log(`Successfully stored ${formattedStories.length} stories in local storage`);
    });
    
    return formattedStories;
  } catch (error) {
    console.error('Error fetching stories:', error);
    throw error;
  }
}
