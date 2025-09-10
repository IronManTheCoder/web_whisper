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
  console.log('Initializing popup...');
  
  // Set up event listeners
  voiceButton.addEventListener('mousedown', startRecording);
  voiceButton.addEventListener('mouseup', stopRecording);
  voiceButton.addEventListener('mouseleave', stopRecording); // Stop if mouse leaves button
  settingsLink.addEventListener('click', openSettings);
  
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
  if (isRecording) return;
  
  console.log('Starting voice recording...');
  
  try {
    // Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000 // Good for speech recognition
      } 
    });
    
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
    updateStatus('❌ Microphone access denied', 'ready');
    
    // Show helpful message
    if (error instanceof Error && error.name === 'NotAllowedError') {
      alert('Please allow microphone access to use voice commands.');
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

console.log('✅ Web Whisper Popup Script Ready');
