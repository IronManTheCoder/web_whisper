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
  console.log('🔍 Looking for search inputs on:', window.location.hostname);
  
  // Find search inputs on the page
  const searchInputs = findSearchInputs();
  
  console.log('Found search inputs:', searchInputs.length);
  searchInputs.forEach((input, index) => {
    console.log(`Search input ${index}:`, {
      element: input,
      name: input.name,
      id: input.id,
      className: input.className,
      placeholder: input.placeholder,
      type: input.type
    });
  });
  
  if (searchInputs.length === 0) {
    console.log('❌ No search inputs found. Available inputs on page:');
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach((input, index) => {
      console.log(`Input ${index}:`, {
        element: input,
        name: input.name,
        id: input.id,
        className: input.className,
        placeholder: input.placeholder,
        type: input.type
      });
    });
    return 'No search box found on this page';
  }
  
  const searchInput = searchInputs[0];
  
  console.log('🎯 Attempting to fill search input with:', query);
  console.log('Search input before:', searchInput.value);
  
  // Fill in the search query
  searchInput.value = query;
  console.log('Search input after setting value:', searchInput.value);
  
  // Try different ways to trigger the input change
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  searchInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  // For Google, try focusing the input first
  searchInput.focus();
  
  // Wait a moment for any async processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('🔍 Attempting to submit search...');
  
  // Try to submit the search
  const form = searchInput.closest('form');
  console.log('Found form:', form);
  
  if (form) {
    console.log('Submitting via form...');
    form.dispatchEvent(new Event('submit', { bubbles: true }));
    // Also try submitting the form directly
    form.submit();
  } else {
    console.log('No form found, trying multiple submission methods...');
    
    // Method 1: Try clicking the search button
    const searchButtons = [
      document.querySelector('input[name="btnK"]'), // Google Search button
      document.querySelector('cr-searchbox-icon#icon'), // Google Chrome new tab search icon
      document.querySelector('button[aria-label*="Search" i]'),
      document.querySelector('button[type="submit"]'),
      document.querySelector('[role="button"][aria-label*="Search" i]'),
    ].filter(btn => btn && (btn as HTMLElement).offsetParent !== null); // Only visible buttons
    
    if (searchButtons.length > 0) {
      console.log('Found search button, clicking it...');
      (searchButtons[0] as HTMLElement).click();
    } else {
      console.log('No search button found, trying Enter key events...');
      
      // Method 2: Try multiple Enter key events
      const enterEvents = [
        new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }),
        new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }),
        new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, which: 13, bubbles: true })
      ];
      
      enterEvents.forEach(event => {
        searchInput.dispatchEvent(event);
      });
      
      // Method 3: Try triggering on the document (some sites listen globally)
      document.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        keyCode: 13, 
        which: 13, 
        bubbles: true 
      }));
      
      // Method 4: Try simulating user typing (some sites need this)
      setTimeout(() => {
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'Enter', 
          keyCode: 13, 
          which: 13, 
          bubbles: true
        }));
      }, 200);
    }
  }
  
  console.log('✅ Search submission attempted');
  return `Searched for: ${query}`;
}

function findSearchInputs(): HTMLInputElement[] {
  const selectors = [
    // Standard search input patterns
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[name*="search" i]',
    'input[id*="search" i]',
    'input[class*="search" i]',
    '.search-input input',
    '#search input',
    '[role="searchbox"]',
    
    // Google-specific patterns
    'input#input[type="search"]', // Google's Chrome new tab search box
    'input.gLFyf',  // Google's main search box class
    'input[name="q"]', // Google's search parameter
    'textarea[name="q"]', // Google sometimes uses textarea
    'input.baeIxf', // Google's current search box class (from debug)
    
    // Other major sites
    'input[name="field-keywords"]', // Amazon
    'input[id="twotabsearchtextbox"]', // Amazon
    'input[placeholder*="Search" i]', // Generic search with capital S
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
