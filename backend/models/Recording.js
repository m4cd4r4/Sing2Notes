/**
 * Recording.js
 * Mongoose schema for user recordings
 */
const mongoose = require('mongoose');

const RecordingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a recording name'],
        trim: true,
        maxlength: [100, 'Recording name cannot exceed 100 characters'],
        default: 'Untitled Recording'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    audioFile: {
        type: String, // Path to audio file on server
        required: true
    },
    duration: {
        type: Number, // Duration in seconds
        default: 0
    },
    fileSize: {
        type: Number, // Size in bytes
        default: 0
    },
    transcription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transcription'
    },
    metadata: {
        type: Object,
        default: {}
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Set up text index for search
RecordingSchema.index({
    name: 'text',
    'tags': 'text'
});

module.exports = mongoose.model('Recording', RecordingSchema);