/**
 * index.js
 * Entry point for the Melody Transcriber frontend application
 */
import './styles/main.css';
import App from './App';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create the application instance
  const app = new App();
});
