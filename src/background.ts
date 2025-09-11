// Background Script - The "brain" of our extension
// Runs continuously and manages extension state

console.log('🎤 Web Whisper Background Script Started');

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  // Set default user preferences
  chrome.storage.sync.set({
    voiceActivation: 'push-to-talk',
    language: 'en-US',
    enableAnalytics: false
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔄 Background received message:', message);
  console.log('📍 Message sender:', sender);
  
  switch (message.type) {
    case 'PROCESS_VOICE_COMMAND':
      handleVoiceCommand(message.data, sender, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'GET_TAB_INFO':
      handleGetTabInfo(sender, sendResponse);
      return true;
      
    case 'UPDATE_STATUS':
      console.log('Status update:', message.status);
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});

async function handleVoiceCommand(commandData: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
  try {
    console.log('Processing voice command:', commandData);
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }
    
    // Send command to content script for execution
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXECUTE_VOICE_COMMAND',
      data: commandData
    });
    
    sendResponse({ success: true, result: response });
    
  } catch (error) {
    console.error('Error processing voice command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    sendResponse({ success: false, error: errorMessage });
  }
}

async function handleGetTabInfo(sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    sendResponse({
      success: true,
      tabInfo: {
        url: tab.url,
        title: tab.title,
        id: tab.id
      }
    });
    
  } catch (error) {
    console.error('Error getting tab info:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    sendResponse({ success: false, error: errorMessage });
  }
}

// Export types for other files to use
export interface VoiceCommand {
  text: string;
  intent: string;
  confidence: number;
  timestamp: Date;
}
