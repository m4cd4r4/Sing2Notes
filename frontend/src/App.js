/**
 * App.js
 * Main application logic for the Melody Transcriber
 */
import AudioRecorder from './components/AudioRecorder.js';
import NotationDisplay from './components/NotationDisplay.js';
import UserAuth from './components/UserAuth.js';
import SavedRecordings from './components/SavedRecordings.js';
import PitchDetection from './services/pitchDetection.js';

class App {
    constructor() {
        // App state
        this.isRecording = false;
        this.currentAudioBlob = null;
        this.currentTranscription = null;
        
        // Initialize services
        this.pitchDetection = new PitchDetection();
        
        // Initialize DOM elements
        this.initDomElements();
        
        // Initialize components
        this.initComponents();
        
        // Add event listeners
        this.setupEventListeners();
    }
    
    /**
     * Initialize references to DOM elements
     */
    initDomElements() {
        // Record button
        this.recordButton = document.getElementById('record-button');
        this.recordingStatus = document.getElementById('recording-status');
        
        // Display containers
        this.frequencyDisplayCanvas = document.getElementById('frequency-display');
        this.simpleNotesContainer = document.getElementById('simple-notes-display');
        this.complexChordsContainer = document.getElementById('complex-chords-display');
        this.sheetMusicContainer = document.getElementById('sheet-music-display');
        
        // Tab buttons
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        
        // Save controls
        this.recordingNameInput = document.getElementById('recording-name');
        this.saveButton = document.getElementById('save-button');
        
        // Auth container
        this.authContainer = document.getElementById('auth-container');
        
        // Saved recordings
        this.savedRecordingsContainer = document.getElementById('saved-recordings-list');
        this.savedRecordingsSection = document.getElementById('saved-recordings-section');
    }
    
    /**
     * Initialize app components
     */
    initComponents() {
        // Audio recorder
        this.audioRecorder = new AudioRecorder(
            this.frequencyDisplayCanvas,
            this.recordingStatus
        );
        
        // Initialize audio recorder
        this.audioRecorder.initialize().then(success => {
            if (!success) {
                this.showError('Could not access microphone. Please check permissions and try again.');
            }
        });
        
        // Notation displays
        this.sheetMusicDisplay = new NotationDisplay(this.sheetMusicContainer);
        
        // User authentication
        this.userAuth = new UserAuth(this.authContainer);
        
        // Saved recordings
        this.savedRecordings = new SavedRecordings(
            this.savedRecordingsContainer,
            this.userAuth
        );
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Record button
        this.recordButton.addEventListener('click', () => {
            this.toggleRecording();
        });
        
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });
        
        // Save button
        this.saveButton.addEventListener('click', () => {
            this.saveRecording();
        });
        
        // Listen for audio processing
        document.addEventListener('audioProcessed', (event) => {
            this.handleAudioProcessed(event.detail);
        });
        
        // Listen for recording state changes
        document.addEventListener('recordingStarted', () => {
            this.isRecording = true;
            this.recordButton.classList.add('recording');
            this.clearResults();
        });
        
        document.addEventListener('recordingStopped', () => {
            this.isRecording = false;
            this.recordButton.classList.remove('recording');
        });
        
        // Listen for auth state changes
        document.addEventListener('userLoggedIn', () => {
            this.updateSaveButtonState();
        });
        
        document.addEventListener('userLoggedOut', () => {
            this.updateSaveButtonState();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.sheetMusicDisplay) {
                this.sheetMusicDisplay.handleResize();
            }
        });
    }
    
    /**
     * Toggle recording state
     */
    toggleRecording() {
        this.audioRecorder.toggleRecording();
    }
    
    /**
     * Handle processed audio data
     * @param {Object} audioData - Processed audio data
     */
    async handleAudioProcessed(audioData) {
        this.currentAudioBlob = audioData.audioBlob;
        this.recordingStatus.textContent = 'Analyzing audio...';
        
        try {
            // Create an AudioContext
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Convert blob to ArrayBuffer
            const arrayBuffer = await audioData.audioBlob.arrayBuffer();
            
            // Decode the audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Analyze the audio
            const transcriptionResult = await this.pitchDetection.analyzeAudio(audioBuffer);
            this.currentTranscription = transcriptionResult;
            
            // Update the displays
            this.updateDisplays(transcriptionResult);
            
            // Enable save button
            this.updateSaveButtonState();
            
            this.recordingStatus.textContent = 'Analysis complete';
        } catch (error) {
            console.error('Error analyzing audio:', error);
            this.recordingStatus.textContent = 'Error analyzing audio';
            this.showError('Failed to analyze audio. Please try recording again.');
        }
    }
    
    /**
     * Update displays with transcription results
     * @param {Object} transcription - Transcription results
     */
    updateDisplays(transcription) {
        // Update simple notes display
        this.updateSimpleNotesDisplay(transcription.simpleNotes);
        
        // Update complex chords display
        this.updateComplexChordsDisplay(transcription.complexChords);
        
        // Update sheet music display
        this.sheetMusicDisplay.renderNotation(transcription.sheetMusic);
    }
    
    /**
     * Update simple notes display
     * @param {Array} simpleNotes - Simple notes data
     */
    updateSimpleNotesDisplay(simpleNotes) {
        if (!simpleNotes || simpleNotes.length === 0) {
            this.simpleNotesContainer.innerHTML = '<p>No notes detected</p>';
            return;
        }
        
        const notesHtml = simpleNotes.map(note => {
            const durationMs = Math.round(note.duration * 1000);
            return `
                <div class="note-item">
                    <span class="note-name">${note.note}</span>
                    <span class="note-octave">${note.octave}</span>
                    <span class="note-duration">(${durationMs} ms)</span>
                </div>
            `;
        }).join('');
        
        this.simpleNotesContainer.innerHTML = `
            <div class="notes-list">
                ${notesHtml}
            </div>
        `;
    }
    
    /**
     * Update complex chords display
     * @param {Array} complexChords - Complex chords data
     */
    updateComplexChordsDisplay(complexChords) {
        if (!complexChords || complexChords.length === 0) {
            this.complexChordsContainer.innerHTML = '<p>No chords detected</p>';
            return;
        }
        
        const chordsHtml = complexChords.map(chord => {
            const durationMs = Math.round(chord.duration * 1000);
            const notesText = chord.notes.join(', ');
            
            return `
                <div class="chord-item">
                    <span class="chord-name">${chord.root} ${chord.type}</span>
                    <span class="chord-notes">(${notesText})</span>
                    <span class="chord-duration">${durationMs} ms</span>
                </div>
            `;
        }).join('');
        
        this.complexChordsContainer.innerHTML = `
            <div class="chords-list">
                ${chordsHtml}
            </div>
        `;
    }
    
    /**
     * Switch between tabs
     * @param {String} tabId - ID of the tab to switch to
     */
    switchTab(tabId) {
        // Update tab buttons
        this.tabButtons.forEach(button => {
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update tab panes
        this.tabPanes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }
    
    /**
     * Save the current recording
     */
    async saveRecording() {
        if (!this.currentAudioBlob || !this.userAuth.isLoggedIn()) {
            return;
        }
        
        const recordingName = this.recordingNameInput.value.trim() || 'Untitled Recording';
        
        try {
            this.saveButton.disabled = true;
            this.saveButton.textContent = 'Saving...';
            
            await this.savedRecordings.saveRecording({
                name: recordingName,
                audioBlob: this.currentAudioBlob,
                transcription: this.currentTranscription
            });
            
            // Clear input
            this.recordingNameInput.value = '';
            
            // Show saved message
            this.saveButton.textContent = 'Saved!';
            
            // Reset after a delay
            setTimeout(() => {
                this.saveButton.textContent = 'Save Recording';
                this.saveButton.disabled = false;
            }, 2000);
            
            // Show saved recordings section
            this.savedRecordingsSection.classList.remove('hidden');
        } catch (error) {
            console.error('Error saving recording:', error);
            this.saveButton.textContent = 'Save Recording';
            this.saveButton.disabled = false;
            this.showError('Failed to save recording. Please try again.');
        }
    }
    
    /**
     * Clear all results displays
     */
    clearResults() {
        this.simpleNotesContainer.innerHTML = '';
        this.complexChordsContainer.innerHTML = '';
        
        if (this.sheetMusicDisplay) {
            this.sheetMusicDisplay.drawPlaceholder();
        }
        
        this.currentAudioBlob = null;
        this.currentTranscription = null;
        
        // Disable save button
        this.updateSaveButtonState();
    }
    
    /**
     * Update save button state based on current conditions
     */
    updateSaveButtonState() {
        const canSave = this.currentAudioBlob && this.userAuth.isLoggedIn();
        this.saveButton.disabled = !canSave;
        
        if (!canSave && this.currentAudioBlob && !this.userAuth.isLoggedIn()) {
            this.saveButton.title = 'Please log in to save recordings';
        } else {
            this.saveButton.title = '';
        }
    }
    
    /**
     * Show an error message
     * @param {String} message - Error message to display
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after a delay
        setTimeout(() => {
            errorDiv.classList.add('fade-out');
            setTimeout(() => {
                errorDiv.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

export default App;