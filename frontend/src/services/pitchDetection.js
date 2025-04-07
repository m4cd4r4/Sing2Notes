/**
 * pitchDetection.js
 * Service for analyzing audio and detecting musical pitches
 */
class PitchDetection {
    constructor() {
        // Note frequencies in Hz (A4 = 440Hz standard)
        this.noteFrequencies = {
            'C': 261.63,
            'C#': 277.18,
            'D': 293.66,
            'D#': 311.13,
            'E': 329.63,
            'F': 349.23,
            'F#': 369.99,
            'G': 392.00,
            'G#': 415.30,
            'A': 440.00,
            'A#': 466.16,
            'B': 493.88
        };
        
        // Different octave multipliers
        this.octaves = {
            0: 0.0625, // C0
            1: 0.125,  // C1
            2: 0.25,   // C2
            3: 0.5,    // C3
            4: 1,      // C4 (middle C)
            5: 2,      // C5
            6: 4,      // C6
            7: 8,      // C7
            8: 16      // C8
        };
        
        // Chord definitions (intervals from root note)
        this.chordDefinitions = {
            'Major': [0, 4, 7],           // Root, Major 3rd, Perfect 5th
            'Minor': [0, 3, 7],           // Root, Minor 3rd, Perfect 5th
            'Diminished': [0, 3, 6],      // Root, Minor 3rd, Diminished 5th
            'Augmented': [0, 4, 8],       // Root, Major 3rd, Augmented 5th
            'Major 7': [0, 4, 7, 11],     // Root, Major 3rd, Perfect 5th, Major 7th
            'Dominant 7': [0, 4, 7, 10],  // Root, Major 3rd, Perfect 5th, Minor 7th
            'Minor 7': [0, 3, 7, 10],     // Root, Minor 3rd, Perfect 5th, Minor 7th
            'Sus4': [0, 5, 7],            // Root, Perfect 4th, Perfect 5th
            'Sus2': [0, 2, 7]             // Root, Major 2nd, Perfect 5th
        };
        
        // Audio processing settings
        this.sampleRate = 44100;
        this.bufferSize = 4096;
        this.minFrequency = 80;    // Around E2
        this.maxFrequency = 1000;  // Around B5
    }
    
    /**
     * Process audio data and extract pitch information
     * @param {AudioBuffer} audioBuffer - The audio buffer to analyze
     * @returns {Object} Results of the pitch detection
     */
    async analyzeAudio(audioBuffer) {
        try {
            // Convert audio buffer to mono if needed
            const monoAudio = this.convertToMono(audioBuffer);
            
            // Segment the audio into chunks for analysis
            const segments = this.segmentAudio(monoAudio);
            
            // Detect pitches in each segment
            const pitchData = await this.detectPitches(segments);
            
            // Convert pitch data to musical notation
            const result = this.convertToMusicalNotation(pitchData);
            
            return result;
        } catch (error) {
            console.error('Error analyzing audio:', error);
            throw error;
        }
    }
    
    /**
     * Convert stereo audio to mono
     * @param {AudioBuffer} audioBuffer - The audio buffer to convert
     * @returns {Float32Array} Mono audio data
     */
    convertToMono(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        
        // If already mono, return the data
        if (numChannels === 1) {
            return audioBuffer.getChannelData(0);
        }
        
        // Convert to mono by averaging all channels
        const monoData = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            let sum = 0;
            for (let channel = 0; channel < numChannels; channel++) {
                sum += audioBuffer.getChannelData(channel)[i];
            }
            monoData[i] = sum / numChannels;
        }
        
        return monoData;
    }
    
    /**
     * Segment audio into smaller chunks for analysis
     * @param {Float32Array} audioData - The mono audio data
     * @returns {Array<Float32Array>} Array of audio segments
     */
    segmentAudio(audioData) {
        const segments = [];
        const segmentLength = this.bufferSize;
        const overlap = segmentLength / 2; // 50% overlap
        
        for (let i = 0; i < audioData.length - segmentLength; i += overlap) {
            const segment = audioData.slice(i, i + segmentLength);
            segments.push(segment);
        }
        
        return segments;
    }
    
    /**
     * Detect pitches in audio segments
     * @param {Array<Float32Array>} segments - Array of audio segments
     * @returns {Array<Object>} Array of detected pitches with timing information
     */
    async detectPitches(segments) {
        const pitches = [];
        const segmentDuration = this.bufferSize / this.sampleRate;
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            
            // Calculate time information
            const startTime = i * segmentDuration * 0.5; // Account for overlap
            const endTime = startTime + segmentDuration;
            
            // Use autocorrelation for pitch detection
            const frequency = this.detectPitchAutocorrelation(segment);
            
            // Only add if frequency is in our desired range
            if (frequency >= this.minFrequency && frequency <= this.maxFrequency) {
                const note = this.frequencyToNote(frequency);
                
                pitches.push({
                    frequency,
                    note,
                    startTime,
                    endTime
                });
            }
        }
        
        // Consolidate notes that are the same and adjacent
        return this.consolidateNotes(pitches);
    }
    
    /**
     * Detect the fundamental frequency using autocorrelation
     * @param {Float32Array} buffer - Audio buffer to analyze
     * @returns {Number} Detected frequency
     */
    detectPitchAutocorrelation(buffer) {
        // Apply window function to reduce spectral leakage
        const windowedBuffer = this.applyHannWindow(buffer);
        
        // Compute autocorrelation
        const autocorrelation = new Float32Array(this.bufferSize);
        for (let lag = 0; lag < this.bufferSize; lag++) {
            let sum = 0;
            for (let i = 0; i < this.bufferSize - lag; i++) {
                sum += windowedBuffer[i] * windowedBuffer[i + lag];
            }
            autocorrelation[lag] = sum;
        }
        
        // Find peaks in autocorrelation
        // Skip the first few indices to avoid detecting very high frequencies
        const minSamples = Math.floor(this.sampleRate / this.maxFrequency);
        const maxSamples = Math.ceil(this.sampleRate / this.minFrequency);
        
        let maxCorrelation = 0;
        let maxIndex = -1;
        
        for (let i = minSamples; i < maxSamples; i++) {
            if (autocorrelation[i] > maxCorrelation) {
                maxCorrelation = autocorrelation[i];
                maxIndex = i;
            }
        }
        
        // Calculate frequency from the peak index
        if (maxIndex > 0) {
            return this.sampleRate / maxIndex;
        } else {
            return 0; // No clear pitch detected
        }
    }
    
    /**
     * Apply Hann window function to reduce spectral leakage
     * @param {Float32Array} buffer - Audio buffer to process
     * @returns {Float32Array} Windowed buffer
     */
    applyHannWindow(buffer) {
        const windowedBuffer = new Float32Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            // Hann window function: 0.5 * (1 - cos(2π * i / (N-1)))
            const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (buffer.length - 1)));
            windowedBuffer[i] = buffer[i] * windowValue;
        }
        return windowedBuffer;
    }
    
    /**
     * Convert frequency to the closest musical note
     * @param {Number} frequency - The frequency in Hz
     * @returns {Object} Note information (name, octave, cents deviation)
     */
    frequencyToNote(frequency) {
        // A4 = 440Hz, 12 semitones per octave
        const a4 = 440.0;
        
        // Calculate semitone distance from A4
        const semitoneRatio = Math.pow(2, 1/12);
        const semitonesFromA4 = Math.round(12 * Math.log2(frequency / a4));
        
        // Calculate the exact frequency of the closest note
        const closestNoteFreq = a4 * Math.pow(semitoneRatio, semitonesFromA4);
        
        // Calculate cents deviation (-50 to +50 cents)
        const cents = Math.round(1200 * Math.log2(frequency / closestNoteFreq));
        
        // Calculate the note name and octave
        const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        
        // Convert semitones from A4 to note index and octave
        // A4 is at index 0 in the noteNames array and is in octave 4
        let noteIndex = (semitonesFromA4 + 9) % 12; // +9 to adjust from A to C as base
        if (noteIndex < 0) noteIndex += 12;
        
        // Calculate octave (C4 is middle C)
        let octave = 4 + Math.floor((semitonesFromA4 + 9) / 12);
        
        // Adjust octave for notes before C
        if (noteIndex < 3) { // A, A#, B
            octave -= 1;
        }
        
        return {
            name: noteNames[noteIndex],
            octave,
            frequency,
            cents
        };
    }
    
    /**
     * Consolidate adjacent notes that are the same
     * @param {Array<Object>} notes - Array of detected notes
     * @returns {Array<Object>} Consolidated notes
     */
    consolidateNotes(notes) {
        if (notes.length === 0) return [];
        
        const consolidated = [];
        let currentNote = { ...notes[0] };
        
        for (let i = 1; i < notes.length; i++) {
            const note = notes[i];
            
            // If the current note is the same as the previous, extend it
            if (note.note.name === currentNote.note.name && 
                note.note.octave === currentNote.note.octave &&
                Math.abs(note.startTime - currentNote.endTime) < 0.05) { // 50ms tolerance
                
                currentNote.endTime = note.endTime;
            } else {
                // Add the current note and start a new one
                consolidated.push(currentNote);
                currentNote = { ...note };
            }
        }
        
        // Add the last note
        consolidated.push(currentNote);
        
        return consolidated;
    }
    
    /**
     * Convert pitch data to musical notation formats
     * @param {Array<Object>} pitchData - Array of detected pitches
     * @returns {Object} Musical notation in different formats
     */
    convertToMusicalNotation(pitchData) {
        // Convert to simple notes (C, D, E, etc.)
        const simpleNotes = this.generateSimpleNotes(pitchData);
        
        // Convert to complex chords (C Major, Dm7, etc.)
        const complexChords = this.detectChords(pitchData);
        
        // Generate sheet music notation (for later rendering)
        const sheetMusic = this.generateSheetMusic(pitchData);
        
        return {
            simpleNotes,
            complexChords,
            sheetMusic,
            rawPitchData: pitchData
        };
    }
    
    /**
     * Generate simple note names from pitch data
     * @param {Array<Object>} pitchData - Array of detected pitches
     * @returns {Array<Object>} Simple note representation
     */
    generateSimpleNotes(pitchData) {
        return pitchData.map(pitch => {
            return {
                note: pitch.note.name.replace('#', '♯'), // Use proper sharp symbol
                octave: pitch.note.octave,
                duration: pitch.endTime - pitch.startTime,
                startTime: pitch.startTime
            };
        });
    }
    
    /**
     * Detect chords from a set of pitches
     * @param {Array<Object>} pitchData - Array of detected pitches
     * @returns {Array<Object>} Detected chords
     */
    detectChords(pitchData) {
        const chords = [];
        const timeWindow = 0.2; // 200ms time window for chord detection
        
        // Group notes by time windows
        const timeWindows = {};
        
        pitchData.forEach(pitch => {
            const windowKey = Math.floor(pitch.startTime / timeWindow);
            if (!timeWindows[windowKey]) {
                timeWindows[windowKey] = [];
            }
            timeWindows[windowKey].push(pitch);
        });
        
        // For each time window, detect chords
        Object.keys(timeWindows).forEach(windowKey => {
            const notes = timeWindows[windowKey];
            
            if (notes.length >= 2) { // Need at least 2 notes for a chord
                const startTime = Math.min(...notes.map(n => n.startTime));
                const endTime = Math.max(...notes.map(n => n.endTime));
                
                // Get unique notes (by name, ignoring octave)
                const uniqueNotes = Array.from(new Set(notes.map(n => n.note.name)));
                
                // Try to identify the chord
                const chord = this.identifyChord(uniqueNotes);
                
                if (chord) {
                    chords.push({
                        root: chord.root,
                        type: chord.type,
                        notes: uniqueNotes,
                        startTime,
                        endTime,
                        duration: endTime - startTime
                    });
                }
            }
        });
        
        return chords;
    }
    
    /**
     * Identify chord from a set of note names
     * @param {Array<String>} noteNames - Array of note names
     * @returns {Object|null} Identified chord or null if no match
     */
    identifyChord(noteNames) {
        if (noteNames.length < 2) return null;
        
        // Try each note as potential root
        for (const rootNote of noteNames) {
            // Convert all notes to semitone intervals from the root
            const intervals = noteNames.map(noteName => {
                return this.calculateInterval(rootNote, noteName);
            }).sort((a, b) => a - b);
            
            // Check against known chord definitions
            for (const [chordType, chordIntervals] of Object.entries(this.chordDefinitions)) {
                // Check if the intervals match this chord type
                if (this.intervalsMatchChord(intervals, chordIntervals)) {
                    return {
                        root: rootNote,
                        type: chordType
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Calculate semitone interval between two note names
     * @param {String} rootNote - Root note name
     * @param {String} noteName - Target note name
     * @returns {Number} Semitone interval (0-11)
     */
    calculateInterval(rootNote, noteName) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const rootIndex = notes.indexOf(rootNote);
        const noteIndex = notes.indexOf(noteName);
        
        if (rootIndex === -1 || noteIndex === -1) return 0;
        
        let interval = (noteIndex - rootIndex) % 12;
        if (interval < 0) interval += 12;
        
        return interval;
    }
    
    /**
     * Check if detected intervals match a chord pattern
     * @param {Array<Number>} detectedIntervals - Detected semitone intervals
     * @param {Array<Number>} chordIntervals - Chord definition intervals
     * @returns {Boolean} True if intervals match the chord
     */
    intervalsMatchChord(detectedIntervals, chordIntervals) {
        // For a match, we need to find at least 3 matching intervals
        // and have at least 75% of the chord tones present
        
        let matchCount = 0;
        
        for (const interval of chordIntervals) {
            if (detectedIntervals.includes(interval)) {
                matchCount++;
            }
        }
        
        const matchRatio = matchCount / chordIntervals.length;
        
        return matchCount >= 3 && matchRatio >= 0.75;
    }
    
    /**
     * Generate sheet music notation data
     * @param {Array<Object>} pitchData - Array of detected pitches
     * @returns {Object} Sheet music notation data
     */
    generateSheetMusic(pitchData) {
        // This is a simplified representation that will be used
        // by the notation renderer component
        
        const notes = pitchData.map(pitch => {
            // Determine note duration
            const durationMs = (pitch.endTime - pitch.startTime) * 1000;
            
            // Map duration to standard music notation
            // (whole, half, quarter, eighth, sixteenth notes)
            let notationType = 'quarter'; // Default
            
            if (durationMs >= 1000) {
                notationType = 'whole';
            } else if (durationMs >= 500) {
                notationType = 'half';
            } else if (durationMs >= 250) {
                notationType = 'quarter';
            } else if (durationMs >= 125) {
                notationType = 'eighth';
            } else {
                notationType = 'sixteenth';
            }
            
            return {
                pitch: pitch.note.name,
                octave: pitch.note.octave,
                duration: notationType,
                startTime: pitch.startTime
            };
        });
        
        // Organize notes into measures
        // Assume 4/4 time signature for simplicity
        const timeSignature = {
            numerator: 4,
            denominator: 4
        };
        
        // Return sheet music data
        return {
            notes,
            timeSignature,
            clef: 'treble'
        };
    }
}

export default PitchDetection;