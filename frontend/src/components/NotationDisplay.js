/**
 * NotationDisplay.js
 * Renders musical notation using VexFlow
 */
class NotationDisplay {
    constructor(container) {
        this.container = container;
        this.vf = null;           // VexFlow renderer
        this.context = null;      // Rendering context
        this.width = 0;           // Canvas width
        this.height = 0;          // Canvas height
        this.sheetMusicData = null; // Parsed sheet music data
        
        // Load VexFlow from CDN
        this.loadVexFlow().then(() => {
            this.initializeRenderer();
        });
    }
    
    /**
     * Load VexFlow library from CDN
     */
    async loadVexFlow() {
        return new Promise((resolve, reject) => {
            if (window.Vex) {
                resolve(window.Vex);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/vexflow/4.1.0/vexflow.min.js';
            script.async = true;
            
            script.onload = () => {
                resolve(window.Vex);
            };
            
            script.onerror = () => {
                this.displayError('Failed to load notation rendering library');
                reject(new Error('Failed to load VexFlow'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Initialize the VexFlow renderer
     */
    initializeRenderer() {
        try {
            // Clear the container
            this.container.innerHTML = '';
            
            // Create a div for the renderer
            const rendererDiv = document.createElement('div');
            rendererDiv.className = 'notation-renderer';
            this.container.appendChild(rendererDiv);
            
            // Get container dimensions
            this.width = this.container.clientWidth;
            this.height = 300; // Fixed height for now
            
            // Create VexFlow renderer
            this.vf = new Vex.Flow.Renderer(
                rendererDiv,
                Vex.Flow.Renderer.Backends.SVG
            );
            
            // Configure renderer
            this.vf.resize(this.width, this.height);
            this.context = this.vf.getContext();
            
            // Draw staff with placeholder message
            this.drawPlaceholder();
        } catch (error) {
            console.error('Error initializing notation renderer:', error);
            this.displayError('Error initializing notation renderer');
        }
    }
    
    /**
     * Draw placeholder music staff
     */
    drawPlaceholder() {
        if (!this.context) return;
        
        try {
            // Clear the context
            this.context.clear();
            
            // Create a stave
            const stave = new Vex.Flow.Stave(10, 40, this.width - 20);
            
            // Add clef and time signature
            stave.addClef('treble').addTimeSignature('4/4');
            
            // Draw the stave
            stave.setContext(this.context).draw();
            
            // Add placeholder text
            this.context.save();
            this.context.font = '16px Arial';
            this.context.fillText('Record audio to see notation', 150, 30);
            this.context.restore();
        } catch (error) {
            console.error('Error drawing placeholder notation:', error);
        }
    }
    
    /**
     * Render musical notation from sheet music data
     * @param {Object} sheetMusicData - Sheet music data from pitch detection
     */
    renderNotation(sheetMusicData) {
        if (!this.context || !sheetMusicData) return;
        
        this.sheetMusicData = sheetMusicData;
        
        try {
            // Clear the context
            this.context.clear();
            
            // Get notes from the sheet music data
            const notes = sheetMusicData.notes;
            
            // If no notes, draw a placeholder
            if (!notes || notes.length === 0) {
                this.drawPlaceholder();
                return;
            }
            
            // Configure number of measures based on note count
            const measuresPerLine = 4;
            const notesPerMeasure = 4; // Assuming 4/4 time for simplicity
            const totalMeasures = Math.ceil(notes.length / notesPerMeasure);
            const lines = Math.ceil(totalMeasures / measuresPerLine);
            
            // Adjust height based on number of lines
            const lineHeight = 100;
            const newHeight = lines * lineHeight + 50;
            
            if (newHeight !== this.height) {
                this.height = newHeight;
                this.vf.resize(this.width, this.height);
            }
            
            // Group notes into measures
            const measures = [];
            for (let i = 0; i < totalMeasures; i++) {
                const startIdx = i * notesPerMeasure;
                const endIdx = Math.min(startIdx + notesPerMeasure, notes.length);
                measures.push(notes.slice(startIdx, endIdx));
            }
            
            // Draw each line of the score
            for (let line = 0; line < lines; line++) {
                const lineY = line * lineHeight + 40;
                const lineWidth = this.width - 20;
                const staveWidth = lineWidth / Math.min(measuresPerLine, totalMeasures - line * measuresPerLine);
                
                // Draw measures for this line
                for (let m = 0; m < measuresPerLine && line * measuresPerLine + m < totalMeasures; m++) {
                    const measureIdx = line * measuresPerLine + m;
                    const measureNotes = measures[measureIdx];
                    
                    this.drawMeasure(
                        10 + m * staveWidth, 
                        lineY, 
                        staveWidth, 
                        measureNotes, 
                        measureIdx === 0,
                        sheetMusicData.clef
                    );
                }
            }
        } catch (error) {
            console.error('Error rendering notation:', error);
            this.displayError('Error rendering music notation');
        }
    }
    
    /**
     * Draw a single measure of music
     * @param {Number} x - X coordinate for the stave
     * @param {Number} y - Y coordinate for the stave
     * @param {Number} width - Width of the stave
     * @param {Array} notes - Notes to render in this measure
     * @param {Boolean} isFirstMeasure - Whether this is the first measure (for clef and time sig)
     * @param {String} clef - Clef to use ('treble', 'bass', etc.)
     */
    drawMeasure(x, y, width, measureNotes, isFirstMeasure, clef = 'treble') {
        // Create a stave
        const stave = new Vex.Flow.Stave(x, y, width);
        
        // Add clef and time signature to first measure only
        if (isFirstMeasure) {
            stave.addClef(clef).addTimeSignature('4/4');
        }
        
        // Draw the stave
        stave.setContext(this.context).draw();
        
        // If no notes in this measure, return
        if (measureNotes.length === 0) return;
        
        // Convert notes to VexFlow format
        const vfNotes = this.createVexFlowNotes(measureNotes);
        
        // Create a voice and add notes to it
        const voice = new Vex.Flow.Voice({
            num_beats: 4,
            beat_value: 4
        }).setMode(Vex.Flow.Voice.Mode.SOFT);
        
        voice.addTickables(vfNotes);
        
        // Format the notes to fit in the stave
        new Vex.Flow.Formatter()
            .joinVoices([voice])
            .format([voice], width - 50);
        
        // Draw the voice
        voice.draw(this.context, stave);
    }
    
    /**
     * Convert our note format to VexFlow notes
     * @param {Array} notes - Notes in our internal format
     * @returns {Array} VexFlow formatted notes
     */
    createVexFlowNotes(notes) {
        return notes.map(note => {
            // Convert our note data to VexFlow format
            const noteName = note.pitch + '/' + note.octave;
            const duration = note.duration || 'q'; // Default to quarter note
            
            // Create a StaveNote
            const staveNote = new Vex.Flow.StaveNote({
                clef: 'treble',
                keys: [noteName],
                duration: this.convertDuration(duration)
            });
            
            // Add accidental if needed
            if (note.pitch.includes('#')) {
                staveNote.addAccidental(0, new Vex.Flow.Accidental('#'));
            } else if (note.pitch.includes('b')) {
                staveNote.addAccidental(0, new Vex.Flow.Accidental('b'));
            }
            
            return staveNote;
        });
    }
    
    /**
     * Convert our duration format to VexFlow duration
     * @param {String} duration - Our duration format
     * @returns {String} VexFlow duration string
     */
    convertDuration(duration) {
        const durationMap = {
            'whole': 'w',
            'half': 'h',
            'quarter': 'q',
            'eighth': '8',
            'sixteenth': '16'
        };
        
        return durationMap[duration] || 'q'; // Default to quarter note
    }
    
    /**
     * Display an error message
     * @param {String} message - Error message to display
     */
    displayError(message) {
        this.container.innerHTML = `<div class="notation-error">${message}</div>`;
    }
    
    /**
     * Handle window resize events
     */
    handleResize() {
        if (!this.vf) return;
        
        const newWidth = this.container.clientWidth;
        
        if (newWidth !== this.width) {
            this.width = newWidth;
            this.vf.resize(this.width, this.height);
            
            if (this.sheetMusicData) {
                this.renderNotation(this.sheetMusicData);
            } else {
                this.drawPlaceholder();
            }
        }
    }
    
    /**
     * Clean up resources when component is destroyed
     */
    cleanup() {
        // Remove resize event listener if added
        window.removeEventListener('resize', this.handleResize);
        
        // Clean up VexFlow if needed
        if (this.context) {
            this.context.clear();
        }
    }
}

export default NotationDisplay;