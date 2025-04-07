# Sing2Notes

![Sing2Notes Logo](https://via.placeholder.com/800x200?text=Sing2Notes)

Sing2Notes is a web application that converts singing or humming to musical notation. With a simple recording interface, it transcribes melodies into simple notation, chord progressions, and professional sheet music.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## ✨ Features

- 🎤 **Record & Transcribe**: Capture vocal input through your microphone
- 🎵 **Multiple Notation Formats**:
  - Basic note names (C, D, E, F, G, A, B)
  - Complex chord notation (C Major 7, etc.)
  - Full sheet music with standard notation
- 📊 **Real-time Frequency Analysis**: Visualize your voice as you sing
- 🔐 **User Accounts**: Save, manage, and revisit your transcriptions
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🖨️ **Export Options**: Download your music as PDF sheet music

## 🖥️ Demo

![Application Demo](https://via.placeholder.com/800x450?text=Sing2Notes+Demo)

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Sing2Notes.git
   cd Sing2Notes
   ```

2. **Set up backend**
   ```bash
   cd backend
   npm install
   # Create .env file (see .env.example for required variables)
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Set up frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

### Using Docker

```bash
# Start all services
docker-compose up -d

# Access at http://localhost:3000
```

## 🧠 How It Works

Sing2Notes uses advanced audio processing algorithms to analyze vocal input:

1. **Recording**: Web Audio API captures microphone input
2. **Frequency Analysis**: Identifies fundamental frequencies using autocorrelation
3. **Pitch Detection**: Maps frequencies to musical notes
4. **Chord Recognition**: Identifies chord patterns from detected notes
5. **Notation Generation**: Renders sheet music using VexFlow

## 🔧 Technology Stack

### Frontend
- Vanilla JavaScript (ES6+)
- Web Audio API for audio recording and analysis
- VexFlow for sheet music rendering

### Backend
- Node.js with Express
- MongoDB for data storage
- JWT for authentication
- Multer for file upload handling

## 📁 Project Structure

```
Sing2Notes/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # UI components
│       ├── services/    # Audio processing & API communication
│       └── styles/      # CSS styles
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   └── middleware/      # Custom middleware
└── docker-compose.yml   # Docker configuration
```

## 🛣️ Roadmap

- [ ] Improve pitch detection for polyphonic (multi-note) input
- [ ] Add instrument selection for different sound profiles
- [ ] Implement social sharing features
- [ ] Support MIDI export format
- [ ] Create mobile application versions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

Project Link: [https://github.com/your-username/Sing2Notes](https://github.com/your-username/Sing2Notes)

## 🙏 Acknowledgments

- [VexFlow](https://github.com/0xfe/vexflow) for music notation rendering
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for audio processing
- All contributors and supporters of the project
