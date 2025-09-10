// Content Script - Runs on every web page
// Responsible for DOM analysis and action execution

console.log('🎤 Web Whisper Content Script Loaded on:', window.location.hostname);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'EXECUTE_VOICE_COMMAND':
      handleExecuteCommand(message.data, sendResponse);
      return true; // Keep message channel open
      
    case 'ANALYZE_PAGE':
      handleAnalyzePage(sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});

async function handleExecuteCommand(commandData: any, sendResponse: (response: any) => void) {
  try {
    console.log('Executing command:', commandData);
    
    // For now, we'll create a simple implementation
    // Later we'll replace this with our modular components
    const result = await executeBasicCommand(commandData);
    
    sendResponse({ success: true, result });
    
  } catch (error) {
    console.error('Error executing command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    sendResponse({ success: false, error: errorMessage });
  }
}

async function executeBasicCommand(commandData: any): Promise<string> {
  const text = commandData.text?.toLowerCase() || '';
  
  // Basic search functionality
  if (text.includes('search') || text.includes('find')) {
    const searchQuery = extractSearchQuery(text);
    return await performSearch(searchQuery);
  }
  
  // Basic navigation
  if (text.includes('next page') || text.includes('next')) {
    return await performNavigation('next');
  }
  
  if (text.includes('previous page') || text.includes('back')) {
    return await performNavigation('previous');
  }
  
  return 'Command not recognized';
}

function extractSearchQuery(text: string): string {
  // Simple extraction - remove common command words
  return text
    .replace(/search for|find|look for|show me/gi, '')
    .trim();
}

async function performSearch(query: string): Promise<string> {
  // Find search inputs on the page
  const searchInputs = findSearchInputs();
  
  if (searchInputs.length === 0) {
    return 'No search box found on this page';
  }
  
  const searchInput = searchInputs[0];
  
  // Fill in the search query
  searchInput.value = query;
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  searchInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Try to submit the search
  const form = searchInput.closest('form');
  if (form) {
    form.dispatchEvent(new Event('submit', { bubbles: true }));
  } else {
    // Try pressing Enter
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Enter', 
      bubbles: true 
    }));
  }
  
  return `Searched for: ${query}`;
}

function findSearchInputs(): HTMLInputElement[] {
  const selectors = [
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[name*="search" i]',
    'input[id*="search" i]',
    'input[class*="search" i]',
    '.search-input input',
    '#search input',
    '[role="searchbox"]'
  ];
  
  const inputs: HTMLInputElement[] = [];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el instanceof HTMLInputElement) {
        inputs.push(el);
      }
    });
  }
  
  return inputs;
}

async function performNavigation(direction: 'next' | 'previous'): Promise<string> {
  const navElements = findNavigationElements(direction);
  
  if (navElements.length === 0) {
    return `No ${direction} button found on this page`;
  }
  
  const element = navElements[0];
  element.click();
  
  return `Clicked ${direction} button`;
}

function findNavigationElements(direction: 'next' | 'previous'): HTMLElement[] {
  const nextSelectors = [
    'a[href*="page"]:contains("Next")',
    'button[aria-label*="next" i]',
    'a[aria-label*="next" i]',
    '.pagination .next',
    '.pager .next',
    '[data-testid*="next"]'
  ];
  
  const prevSelectors = [
    'a[href*="page"]:contains("Previous")',
    'button[aria-label*="previous" i]',
    'a[aria-label*="previous" i]',
    '.pagination .prev',
    '.pager .prev',
    '[data-testid*="prev"]'
  ];
  
  const selectors = direction === 'next' ? nextSelectors : prevSelectors;
  const elements: HTMLElement[] = [];
  
  for (const selector of selectors) {
    // Remove :contains() pseudo-selector for now (not supported in querySelectorAll)
    const cleanSelector = selector.replace(/:contains\([^)]*\)/g, '');
    const found = document.querySelectorAll(cleanSelector);
    found.forEach(el => {
      if (el instanceof HTMLElement) {
        elements.push(el);
      }
    });
  }
  
  return elements;
}

function handleAnalyzePage(sendResponse: (response: any) => void) {
  const analysis = {
    searchInputs: findSearchInputs().length,
    navigationElements: findNavigationElements('next').length + findNavigationElements('previous').length,
    url: window.location.href,
    title: document.title
  };
  
  console.log('Page analysis:', analysis);
  sendResponse({ success: true, analysis });
}

// Initialize content script
console.log('✅ Web Whisper Content Script Ready');
