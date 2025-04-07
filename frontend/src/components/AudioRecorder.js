/**
 * AudioRecorder.js
 * Handles microphone access, recording, and frequency analysis
 */
class AudioRecorder {
    constructor(frequencyDisplayCanvas, statusElement) {
        this.audioContext = null;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.analyser = null;
        this.frequencyData = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.maxRecordingTime = 30000; // 30 seconds max
        this.recordingTimer = null;
        
        // DOM elements
        this.canvas = frequencyDisplayCanvas;
        this.canvasCtx = this.canvas.getContext('2d');
        this.statusElement = statusElement;
        
        // Frequency display properties
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        // Bind methods
        this.toggleRecording = this.toggleRecording.bind(this);
        this.startRecording = this.startRecording.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
        this.drawFrequencyData = this.drawFrequencyData.bind(this);
        this.processAudioData = this.processAudioData.bind(this);
    }
    
    /**
     * Initialize the audio context and prepare for recording
     */
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaStream = stream;
            
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Connect the microphone stream to the analyser
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            
            // Set up canvas for frequency display
            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas.bind(this));
            
            // Initialize but don't start the recorder yet
            this.mediaRecorder = new MediaRecorder(stream);
            this.setupMediaRecorderEvents();
            
            return true;
        } catch (error) {
            console.error('Error initializing audio recorder:', error);
            this.statusElement.textContent = 'Microphone access denied';
            return false;
        }
    }
    
    /**
     * Set up event handlers for the MediaRecorder
     */
    setupMediaRecorderEvents() {
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            this.processAudioData();
        };
    }
    
    /**
     * Toggle recording state
     */
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    /**
     * Start recording audio from the microphone
     */
    startRecording() {
        if (!this.mediaRecorder || this.isRecording) return;
        
        this.recordedChunks = [];
        this.mediaRecorder.start(100); // Collect data in 100ms chunks
        this.isRecording = true;
        this.statusElement.textContent = 'Recording...';
        
        // Start visualizing the frequency data
        this.visualize();
        
        // Set maximum recording time
        this.recordingTimer = setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
            }
        }, this.maxRecordingTime);
        
        // Dispatch event that recording has started
        const event = new CustomEvent('recordingStarted');
        document.dispatchEvent(event);
    }
    
    /**
     * Stop recording audio
     */
    stopRecording() {
        if (!this.mediaRecorder || !this.isRecording) return;
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.statusElement.textContent = 'Processing...';
        
        // Clear the recording timer
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        // Dispatch event that recording has stopped
        const event = new CustomEvent('recordingStopped');
        document.dispatchEvent(event);
    }
    
    /**
     * Process the recorded audio data
     */
    processAudioData() {
        if (this.recordedChunks.length === 0) {
            this.statusElement.textContent = 'No audio recorded';
            return;
        }
        
        // Create a blob from the recorded chunks
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        
        // Create an audio URL and dispatch event with the blob
        const audioUrl = URL.createObjectURL(audioBlob);
        const event = new CustomEvent('audioProcessed', { 
            detail: { 
                audioBlob: audioBlob,
                audioUrl: audioUrl
            }
        });
        document.dispatchEvent(event);
        
        this.statusElement.textContent = 'Ready to record';
    }
    
    /**
     * Start visualizing audio frequencies
     */
    visualize() {
        // Clear the canvas
        this.canvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // If not recording, stop the visualization
        if (!this.isRecording) return;
        
        // Draw the frequency data
        this.drawFrequencyData();
        
        // Request the next frame
        requestAnimationFrame(this.visualize.bind(this));
    }
    
    /**
     * Draw frequency data on the canvas
     */
    drawFrequencyData() {
        // Get the current frequency data
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        // Clear the canvas
        this.canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        this.canvasCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Set line width and color
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = 'rgb(229, 57, 53)';
        
        // Draw the frequency data
        const bufferLength = this.analyser.frequencyBinCount;
        const barWidth = (this.canvasWidth / bufferLength) * 2.5;
        let x = 0;
        
        this.canvasCtx.beginPath();
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = this.frequencyData[i] / 255 * this.canvasHeight;
            
            if (i === 0) {
                this.canvasCtx.moveTo(x, this.canvasHeight - barHeight);
            } else {
                this.canvasCtx.lineTo(x, this.canvasHeight - barHeight);
            }
            
            x += barWidth;
        }
        
        this.canvasCtx.stroke();
    }
    
    /**
     * Resize the canvas to match its display size
     */
    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        // Check if the canvas size needs to be updated
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.canvasWidth = displayWidth;
            this.canvasHeight = displayHeight;
        }
    }
    
    /**
     * Clean up resources when the component is destroyed
     */
    cleanup() {
        // Stop any ongoing recording
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // Stop the media stream tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        // Close the audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.resizeCanvas);
    }
}

export default AudioRecorder;