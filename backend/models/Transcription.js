/**
 * Transcription.js
 * Mongoose schema for music transcriptions
 */
const mongoose = require('mongoose');

// Schema for simple notes
const SimpleNoteSchema = new mongoose.Schema({
    note: {
        type: String,
        required: true
    },
    octave: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // Duration in seconds
        required: true
    },
    startTime: {
        type: Number, // Start time in seconds
        required: true
    }
}, { _id: false });

// Schema for complex chords
const ChordSchema = new mongoose.Schema({
    root: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    notes: [{
        type: String
    }],
    startTime: {
        type: Number, // Start time in seconds
        required: true
    },
    endTime: {
        type: Number, // End time in seconds
        required: true
    },
    duration: {
        type: Number, // Duration in seconds
        required: true
    }
}, { _id: false });

// Schema for sheet music notation
const SheetMusicNoteSchema = new mongoose.Schema({
    pitch: {
        type: String,
        required: true
    },
    octave: {
        type: Number,
        required: true
    },
    duration: {
        type: String, // 'whole', 'half', 'quarter', etc.
        required: true
    },
    startTime: {
        type: Number, // Start time in seconds
        required: true
    }
}, { _id: false });

const SheetMusicSchema = new mongoose.Schema({
    notes: [SheetMusicNoteSchema],
    timeSignature: {
        numerator: {
            type: Number,
            default: 4
        },
        denominator: {
            type: Number,
            default: 4
        }
    },
    clef: {
        type: String,
        default: 'treble'
    }
}, { _id: false });

// Main Transcription schema
const TranscriptionSchema = new mongoose.Schema({
    recording: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recording',
        required: true
    },
    // Original pitch data
    rawPitchData: [{
        frequency: Number,
        note: {
            name: String,
            octave: Number,
            frequency: Number,
            cents: Number
        },
        startTime: Number,
        endTime: Number
    }],
    // Simple note representation (C, D, E, etc.)
    simpleNotes: [SimpleNoteSchema],
    // Complex chord representation (CMaj7, Dm, etc.)
    complexChords: [ChordSchema],
    // Sheet music representation
    sheetMusic: SheetMusicSchema,
    // Key signature detection
    detectedKey: {
        type: String,
        default: 'C'
    },
    // Tempo detection (BPM)
    detectedTempo: {
        type: Number,
        default: 120
    },
    // Additional metadata
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transcription', TranscriptionSchema);