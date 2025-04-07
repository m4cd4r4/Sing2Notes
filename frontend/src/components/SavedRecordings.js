/**
 * SavedRecordings.js
 * Manages user's saved recordings
 */
class SavedRecordings {
    constructor(container, authService) {
        this.container = container;
        this.authService = authService;
        this.recordings = [];
        
        // API endpoints
        this.apiBaseUrl = '/api';
        this.endpoints = {
            recordings: `${this.apiBaseUrl}/recordings`,
            download: `${this.apiBaseUrl}/recordings/download`,
        };
        
        // Bind methods
        this.loadRecordings = this.loadRecordings.bind(this);
        this.renderRecordings = this.renderRecordings.bind(this);
        this.playRecording = this.playRecording.bind(this);
        this.deleteRecording = this.deleteRecording.bind(this);
        this.downloadSheet = this.downloadSheet.bind(this);
        
        // Listen for auth events
        document.addEventListener('userLoggedIn', this.loadRecordings);
        document.addEventListener('userLoggedOut', () => {
            this.recordings = [];
            this.renderRecordings();
        });
        
        // If user is already logged in, load recordings
        if (this.authService.isLoggedIn()) {
            this.loadRecordings();
        } else {
            this.renderNotLoggedIn();
        }
    }
    
    /**
     * Load user's saved recordings from API
     */
    async loadRecordings() {
        if (!this.authService.isLoggedIn()) {
            this.renderNotLoggedIn();
            return;
        }
        
        try {
            const response = await fetch(this.endpoints.recordings, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authService.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load recordings');
            }
            
            const data = await response.json();
            this.recordings = data.recordings || [];
            
            this.renderRecordings();
        } catch (error) {
            console.error('Error loading recordings:', error);
            this.renderError('Failed to load recordings. Please try again later.');
        }
    }
    
    /**
     * Render the list of saved recordings
     */
    renderRecordings() {
        // Only show this section if the user is logged in
        if (!this.authService.isLoggedIn()) {
            this.renderNotLoggedIn();
            return;
        }
        
        // Show the section
        this.container.closest('#saved-recordings-section').classList.remove('hidden');
        
        // If no recordings, show message
        if (this.recordings.length === 0) {
            this.container.innerHTML = `
                <div class="no-recordings-message">
                    <p>You don't have any saved recordings yet.</p>
                    <p>Record a melody and save it to see it here!</p>
                </div>
            `;
            return;
        }
        
        // Render recordings list
        const recordingsHtml = this.recordings.map(recording => {
            const date = new Date(recording.createdAt).toLocaleDateString();
            const time = new Date(recording.createdAt).toLocaleTimeString();
            
            return `
                <div class="saved-recording-item" data-id="${recording.id}">
                    <div class="saved-recording-info">
                        <h3>${recording.name || 'Untitled Recording'}</h3>
                        <p>Created: ${date} at ${time}</p>
                    </div>
                    <div class="saved-recording-actions">
                        <button class="play-recording" data-id="${recording.id}">
                            <i class="fas fa-play"></i> Play
                        </button>
                        <button class="download-sheet" data-id="${recording.id}">
                            <i class="fas fa-file-download"></i> Sheet Music
                        </button>
                        <button class="delete-recording" data-id="${recording.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.container.innerHTML = recordingsHtml;
        
        // Add event listeners to buttons
        this.container.querySelectorAll('.play-recording').forEach(button => {
            button.addEventListener('click', () => {
                this.playRecording(button.dataset.id);
            });
        });
        
        this.container.querySelectorAll('.download-sheet').forEach(button => {
            button.addEventListener('click', () => {
                this.downloadSheet(button.dataset.id);
            });
        });
        
        this.container.querySelectorAll('.delete-recording').forEach(button => {
            button.addEventListener('click', () => {
                this.deleteRecording(button.dataset.id);
            });
        });
    }
    
    /**
     * Render message when user is not logged in
     */
    renderNotLoggedIn() {
        // Hide the section
        this.container.closest('#saved-recordings-section').classList.add('hidden');
        this.container.innerHTML = '';
    }
    
    /**
     * Render error message
     * @param {String} message - Error message to display
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button id="retry-load-recordings">Try Again</button>
            </div>
        `;
        
        document.getElementById('retry-load-recordings').addEventListener('click', this.loadRecordings);
    }
    
    /**
     * Play a saved recording
     * @param {String} recordingId - ID of the recording to play
     */
    async playRecording(recordingId) {
        try {
            const response = await fetch(`${this.endpoints.recordings}/${recordingId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authService.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load recording');
            }
            
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            // Create audio element
            const audioElement = document.createElement('audio');
            audioElement.src = audioUrl;
            audioElement.controls = true;
            
            // Create modal for audio playback
            const modal = document.createElement('div');
            modal.className = 'playback-modal';
            
            // Find the recording name
            const recording = this.recordings.find(r => r.id === recordingId);
            const recordingName = recording ? recording.name || 'Untitled Recording' : 'Recording';
            
            modal.innerHTML = `
                <div class="playback-modal-content">
                    <h3>Playing: ${recordingName}</h3>
                    <div class="audio-container"></div>
                    <button class="close-modal">Close</button>
                </div>
            `;
            
            // Add to DOM
            document.body.appendChild(modal);
            modal.querySelector('.audio-container').appendChild(audioElement);
            
            // Add close event
            modal.querySelector('.close-modal').addEventListener('click', () => {
                audioElement.pause();
                modal.remove();
            });
            
            // Start playback
            audioElement.play();
        } catch (error) {
            console.error('Error playing recording:', error);
            alert('Failed to play recording. Please try again.');
        }
    }
    
    /**
     * Download sheet music for a recording
     * @param {String} recordingId - ID of the recording
     */
    async downloadSheet(recordingId) {
        try {
            const response = await fetch(`${this.endpoints.download}/${recordingId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authService.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to download sheet music');
            }
            
            // Get filename from Content-Disposition header if available
            let filename = 'sheet-music.pdf';
            const contentDisposition = response.headers.get('Content-Disposition');
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading sheet music:', error);
            alert('Failed to download sheet music. Please try again.');
        }
    }
    
    /**
     * Delete a saved recording
     * @param {String} recordingId - ID of the recording to delete
     */
    async deleteRecording(recordingId) {
        if (!confirm('Are you sure you want to delete this recording?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.endpoints.recordings}/${recordingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authService.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete recording');
            }
            
            // Remove from local array
            this.recordings = this.recordings.filter(recording => recording.id !== recordingId);
            
            // Re-render
            this.renderRecordings();
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('Failed to delete recording. Please try again.');
        }
    }
    
    /**
     * Save a new recording
     * @param {Object} recordingData - Recording data to save
     * @returns {Promise<Object>} Created recording
     */
    async saveRecording(recordingData) {
        if (!this.authService.isLoggedIn()) {
            throw new Error('You must be logged in to save recordings');
        }
        
        try {
            const formData = new FormData();
            formData.append('name', recordingData.name || 'Untitled Recording');
            formData.append('audio', recordingData.audioBlob);
            
            if (recordingData.transcription) {
                formData.append('transcription', JSON.stringify(recordingData.transcription));
            }
            
            const response = await fetch(this.endpoints.recordings, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authService.getAuthToken()}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to save recording');
            }
            
            const data = await response.json();
            
            // Add to local array and re-render
            this.recordings.unshift(data.recording);
            this.renderRecordings();
            
            return data.recording;
        } catch (error) {
            console.error('Error saving recording:', error);
            throw error;
        }
    }
    
    /**
     * Clean up resources when component is destroyed
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('userLoggedIn', this.loadRecordings);
        document.removeEventListener('userLoggedOut', this.renderRecordings);
    }
}

export default SavedRecordings;