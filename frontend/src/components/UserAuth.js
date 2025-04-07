/**
 * UserAuth.js
 * Handles user authentication, registration, and session management
 */
class UserAuth {
    constructor(container) {
        this.container = container;
        this.currentUser = null;
        this.authToken = null;
        
        // API endpoints
        this.apiBaseUrl = '/api';
        this.endpoints = {
            login: `${this.apiBaseUrl}/auth/login`,
            register: `${this.apiBaseUrl}/auth/register`,
            logout: `${this.apiBaseUrl}/auth/logout`,
            validateToken: `${this.apiBaseUrl}/auth/validate`
        };
        
        // Init state from localStorage if available
        this.initFromStorage();
        
        // Render the appropriate UI
        this.render();
    }
    
    /**
     * Initialize auth state from localStorage
     */
    initFromStorage() {
        try {
            const authData = localStorage.getItem('melodyTranscriberAuth');
            
            if (authData) {
                const { user, token } = JSON.parse(authData);
                
                if (user && token) {
                    this.currentUser = user;
                    this.authToken = token;
                    
                    // Validate token on init
                    this.validateToken();
                }
            }
        } catch (error) {
            console.error('Error loading auth data from storage:', error);
            this.logout(false); // Logout without API call
        }
    }
    
    /**
     * Validate the current auth token
     */
    async validateToken() {
        if (!this.authToken) return;
        
        try {
            const response = await fetch(this.endpoints.validateToken, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                // Token is invalid, logout
                this.logout(false);
            }
        } catch (error) {
            console.error('Error validating token:', error);
            // If offline, keep the token for now
        }
    }
    
    /**
     * Render the auth component based on current state
     */
    render() {
        if (this.currentUser) {
            this.renderLoggedIn();
        } else {
            this.renderLoginForm();
        }
    }
    
    /**
     * Render the logged-in user view
     */
    renderLoggedIn() {
        this.container.innerHTML = `
            <div class="user-profile">
                <span class="user-greeting">Hello, ${this.currentUser.username}</span>
                <button id="logout-button" class="auth-button">Logout</button>
            </div>
        `;
        
        // Add event listener to logout button
        document.getElementById('logout-button').addEventListener('click', () => {
            this.logout();
        });
        
        // Dispatch user logged in event
        this.dispatchAuthEvent('userLoggedIn', { user: this.currentUser });
    }
    
    /**
     * Render the login form
     */
    renderLoginForm() {
        this.container.innerHTML = `
            <div class="auth-buttons">
                <button id="login-toggle" class="auth-button">Login</button>
                <button id="register-toggle" class="auth-button">Register</button>
            </div>
            <div id="auth-form-container"></div>
        `;
        
        // Add event listeners
        document.getElementById('login-toggle').addEventListener('click', () => {
            this.showLoginForm();
        });
        
        document.getElementById('register-toggle').addEventListener('click', () => {
            this.showRegisterForm();
        });
        
        // Show login form by default
        this.showLoginForm();
        
        // Dispatch user logged out event
        this.dispatchAuthEvent('userLoggedOut');
    }
    
    /**
     * Show the login form
     */
    showLoginForm() {
        const formContainer = document.getElementById('auth-form-container');
        
        formContainer.innerHTML = `
            <form id="login-form" class="auth-form">
                <div class="form-group">
                    <label for="login-username">Username</label>
                    <input type="text" id="login-username" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" required>
                </div>
                <div id="login-error" class="auth-error"></div>
                <button type="submit" class="submit-button">Login</button>
            </form>
        `;
        
        // Update active toggle
        document.getElementById('login-toggle').classList.add('active');
        document.getElementById('register-toggle').classList.remove('active');
        
        // Add form submit handler
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }
    
    /**
     * Show the registration form
     */
    showRegisterForm() {
        const formContainer = document.getElementById('auth-form-container');
        
        formContainer.innerHTML = `
            <form id="register-form" class="auth-form">
                <div class="form-group">
                    <label for="register-username">Username</label>
                    <input type="text" id="register-username" required>
                </div>
                <div class="form-group">
                    <label for="register-email">Email</label>
                    <input type="email" id="register-email" required>
                </div>
                <div class="form-group">
                    <label for="register-password">Password</label>
                    <input type="password" id="register-password" required>
                </div>
                <div class="form-group">
                    <label for="register-confirm-password">Confirm Password</label>
                    <input type="password" id="register-confirm-password" required>
                </div>
                <div id="register-error" class="auth-error"></div>
                <button type="submit" class="submit-button">Register</button>
            </form>
        `;
        
        // Update active toggle
        document.getElementById('login-toggle').classList.remove('active');
        document.getElementById('register-toggle').classList.add('active');
        
        // Add form submit handler
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
    }
    
    /**
     * Handle login form submission
     */
    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        
        // Reset error
        errorElement.textContent = '';
        
        try {
            // Call login API
            const response = await fetch(this.endpoints.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Store auth data
            this.setAuthData(data.user, data.token);
            
            // Update UI
            this.render();
        } catch (error) {
            errorElement.textContent = error.message || 'Login failed. Please try again.';
            console.error('Login error:', error);
        }
    }
    
    /**
     * Handle registration form submission
     */
    async handleRegistration() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const errorElement = document.getElementById('register-error');
        
        // Reset error
        errorElement.textContent = '';
        
        // Validate passwords match
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            return;
        }
        
        try {
            // Call register API
            const response = await fetch(this.endpoints.register, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // Auto-login after successful registration
            this.setAuthData(data.user, data.token);
            
            // Update UI
            this.render();
        } catch (error) {
            errorElement.textContent = error.message || 'Registration failed. Please try again.';
            console.error('Registration error:', error);
        }
    }
    
    /**
     * Set authentication data and store in localStorage
     * @param {Object} user - User data
     * @param {String} token - Authentication token
     */
    setAuthData(user, token) {
        this.currentUser = user;
        this.authToken = token;
        
        // Store in localStorage
        localStorage.setItem('melodyTranscriberAuth', JSON.stringify({
            user,
            token
        }));
        
        // Dispatch user logged in event
        this.dispatchAuthEvent('userLoggedIn', { user });
    }
    
    /**
     * Logout the current user
     * @param {Boolean} callApi - Whether to call the logout API endpoint
     */
    async logout(callApi = true) {
        if (callApi && this.authToken) {
            try {
                await fetch(this.endpoints.logout, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Logout API error:', error);
            }
        }
        
        // Clear auth data
        this.currentUser = null;
        this.authToken = null;
        localStorage.removeItem('melodyTranscriberAuth');
        
        // Update UI
        this.render();
        
        // Dispatch user logged out event
        this.dispatchAuthEvent('userLoggedOut');
    }
    
    /**
     * Dispatch authentication event
     * @param {String} eventName - Name of the event
     * @param {Object} detail - Event details
     */
    dispatchAuthEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * Get the current authentication token
     * @returns {String|null} Current auth token or null if not logged in
     */
    getAuthToken() {
        return this.authToken;
    }
    
    /**
     * Get the current user
     * @returns {Object|null} Current user or null if not logged in
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Check if a user is currently logged in
     * @returns {Boolean} True if user is logged in
     */
    isLoggedIn() {
        return !!this.currentUser && !!this.authToken;
    }
}

export default UserAuth;