// Popup Script - Controls the extension's user interface
// Handles voice recording and user interactions

console.log('🎤 Web Whisper Popup Script Loaded');

// DOM elements
const statusElement = document.getElementById('status') as HTMLDivElement;
const voiceButton = document.getElementById('voiceButton') as HTMLButtonElement;
const transcriptionElement = document.getElementById('transcription') as HTMLDivElement;
const settingsLink = document.getElementById('settingsLink') as HTMLAnchorElement;

// State management
let isRecording = false;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  console.log('🟢 Initializing popup...');
  console.log('voiceButton element:', voiceButton);
  console.log('settingsLink element:', settingsLink);
  
  // Set up event listeners
  console.log('Setting up mousedown listener...');
  voiceButton.addEventListener('mousedown', startRecording);
  console.log('Setting up mouseup listener...');
  voiceButton.addEventListener('mouseup', stopRecording);
  console.log('Setting up mouseleave listener...');
  voiceButton.addEventListener('mouseleave', stopRecording); // Stop if mouse leaves button
  
  // Add a simple click listener for testing
  console.log('Adding test click listener...');
  voiceButton.addEventListener('click', () => {
    console.log('🟡 Button clicked! (click event)');
  });
  console.log('Setting up settings click listener...');
  settingsLink.addEventListener('click', openSettings);
  
  console.log('✅ All event listeners set up');
  
  // Get current tab info
  await updateTabInfo();
  
  updateStatus('Ready to listen', 'ready');
}

async function updateTabInfo() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_TAB_INFO'
    });
    
    if (response.success) {
      console.log('Current tab:', response.tabInfo);
      // We could show tab-specific info here in the future
    }
  } catch (error) {
    console.error('Error getting tab info:', error);
  }
}

async function startRecording() {
  console.log('🔴 startRecording() function called!');
  
  if (isRecording) {
    console.log('Already recording, returning...');
    return;
  }
  
  console.log('Starting voice recording...');
  console.log('Navigator.mediaDevices available:', !!navigator.mediaDevices);
  console.log('getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
  
  try {
    // Check if microphone is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone not supported');
    }
    
    // Check current permissions first
    console.log('Checking microphone permissions...');
    updateStatus('🔍 Checking microphone access...', 'processing');
    
    // Request microphone permission with user-friendly error handling
    console.log('Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000 // Good for speech recognition
      } 
    });
    
    console.log('✅ Microphone access granted!');
    
    // Set up MediaRecorder
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = handleRecordingComplete;
    
    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms
    isRecording = true;
    
    updateStatus('🎙️ Recording... (release to process)', 'recording');
    updateButton('recording');
    
  } catch (error) {
    console.error('Error starting recording:', error);
    console.error('Error name:', (error as any)?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Handle different types of microphone errors
    if (error instanceof DOMException || (error instanceof Error)) {
      switch (error.name) {
        case 'NotAllowedError':
          updateStatus('❌ Microphone access denied', 'ready');
          console.log('NotAllowedError: User denied microphone access or extension lacks permission');
          showMicrophoneHelp();
          break;
        case 'NotFoundError':
          updateStatus('❌ No microphone found', 'ready');
          console.log('NotFoundError: No microphone hardware detected');
          alert('No microphone detected. Please connect a microphone and try again.');
          break;
        case 'NotReadableError':
          updateStatus('❌ Microphone in use', 'ready');
          console.log('NotReadableError: Microphone is being used by another application');
          alert('Microphone is being used by another application. Please close other apps and try again.');
          break;
        case 'OverconstrainedError':
          updateStatus('❌ Microphone constraints error', 'ready');
          console.log('OverconstrainedError: Requested microphone settings not available');
          alert('Microphone settings not supported. Trying with default settings...');
          // Try again with simpler settings
          trySimpleRecording();
          break;
        case 'SecurityError':
          updateStatus('❌ Security error', 'ready');
          console.log('SecurityError: Extension context security issue');
          alert('Security error. Please reload the extension and try again.');
          break;
        default:
          updateStatus('❌ Microphone error', 'ready');
          console.error('Unknown microphone error:', error.name, error.message);
          alert(`Microphone error: ${error.name} - ${error.message}`);
      }
    } else {
      updateStatus('❌ Unknown error', 'ready');
      console.error('Non-standard error:', typeof error, error);
    }
  }
}

async function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  
  console.log('Stopping voice recording...');
  
  isRecording = false;
  mediaRecorder.stop();
  
  // Stop all audio tracks
  const stream = mediaRecorder.stream;
  stream.getTracks().forEach(track => track.stop());
  
  updateStatus('🔄 Processing your command...', 'processing');
  updateButton('processing');
}

async function handleRecordingComplete() {
  console.log('Recording complete, processing audio...');
  
  if (audioChunks.length === 0) {
    updateStatus('❌ No audio recorded', 'ready');
    updateButton('ready');
    return;
  }
  
  // Create audio blob
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
  console.log('Audio blob created:', audioBlob.size, 'bytes');
  
  // For now, we'll simulate speech recognition
  // Later we'll replace this with actual Whisper processing
  await simulateSpeechRecognition(audioBlob);
}

async function simulateSpeechRecognition(audioBlob: Blob) {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, show a placeholder transcription
    const simulatedText = "search for red shoes under $100";
    
    updateTranscription(simulatedText);
    
    // Send command for processing
    await processVoiceCommand({
      text: simulatedText,
      confidence: 0.9,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error in speech recognition:', error);
    updateStatus('❌ Speech recognition failed', 'ready');
    updateButton('ready');
  }
}

async function processVoiceCommand(command: any) {
  try {
    console.log('Processing voice command:', command);
    
    const response = await chrome.runtime.sendMessage({
      type: 'PROCESS_VOICE_COMMAND',
      data: command
    });
    
    if (response.success) {
      updateStatus('✅ Command executed successfully', 'ready');
      console.log('Command result:', response.result);
    } else {
      updateStatus(`❌ ${response.error}`, 'ready');
    }
    
    updateButton('ready');
    
  } catch (error) {
    console.error('Error processing command:', error);
    updateStatus('❌ Command processing failed', 'ready');
    updateButton('ready');
  }
}

function updateStatus(message: string, type: 'ready' | 'recording' | 'processing') {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

function updateButton(state: 'ready' | 'recording' | 'processing') {
  voiceButton.className = `voice-button ${state}`;
  
  switch (state) {
    case 'ready':
      voiceButton.textContent = 'Hold to Speak';
      voiceButton.disabled = false;
      break;
    case 'recording':
      voiceButton.textContent = '🎙️ Recording...';
      voiceButton.disabled = false;
      break;
    case 'processing':
      voiceButton.textContent = '⏳ Processing...';
      voiceButton.disabled = true;
      break;
  }
}

function updateTranscription(text: string) {
  transcriptionElement.textContent = text;
  transcriptionElement.className = 'transcription';
}

function openSettings(event: Event) {
  event.preventDefault();
  console.log('Settings clicked - will implement later');
  // TODO: Open options page
}

async function trySimpleRecording() {
  console.log('Trying simple recording with basic constraints...');
  
  try {
    // Try with minimal constraints
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true // Just basic audio, no special settings
    });
    
    console.log('✅ Simple microphone access granted!');
    
    // Set up MediaRecorder with basic settings
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = handleRecordingComplete;
    
    // Start recording
    mediaRecorder.start();
    isRecording = true;
    
    updateStatus('🎙️ Recording... (basic mode)', 'recording');
    updateButton('recording');
    
  } catch (error) {
    console.error('Simple recording also failed:', error);
    updateStatus('❌ Microphone unavailable', 'ready');
    updateButton('ready');
  }
}

function showMicrophoneHelp() {
  const helpMessage = `
🎤 Microphone Access Required

To use voice commands, please:

1. Click the 🔒 lock icon in Chrome's address bar
2. Set "Microphone" to "Allow" 
3. Refresh this page and try again

Or:
1. Go to chrome://settings/content/microphone
2. Add this site to "Allow" list
  `;
  
  alert(helpMessage);
}

console.log('✅ Web Whisper Popup Script Ready');
