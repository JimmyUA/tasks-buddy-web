// src/services/api.js

import {auth} from '../firebaseConfig'; // Import Firebase Auth instance

const BASE_URL = 'https://tasks-backend-281276958363.us-central1.run.app/api/v1'; // Adjust if your backend API is hosted elsewhere

// --- MOCK DATA (Remove when connecting to real backend) ---
let mockTasks = [
  {
    id: '1',
    originalInput: 'Prepare presentation for Monday',
    processedDescription: 'Prep Monday presentation slides',
    priority: 'High',
    tags: ['work', 'urgent', 'meeting'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completed: false // Add completion status
  }, // ~1 day ago
  {
    id: '4',
    originalInput: 'Follow up on client email Acme',
    processedDescription: 'Follow up on Acme Corp email',
    priority: 'High',
    tags: ['work', 'client'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    completed: false // Add completion status
  }, // ~1 hour ago (Newer High Prio)
  {
    id: '2',
    originalInput: 'buy milk groceries eggs bread',
    processedDescription: 'Buy milk, groceries, eggs, and bread',
    priority: 'Medium',
    tags: ['personal', 'errands'],
    createdAt: new Date().toISOString(),
    completed: false // Add completion status
  }, // Now
  {
    id: '5',
    originalInput: 'Book dentist appointment',
    processedDescription: 'Book dentist check-up',
    priority: null,
    tags: ['personal', 'health'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    completed: true // Add completion status (example)
  }, // ~2 days ago (No priority)
  {
    id: '3',
    originalInput: 'Draft blog post about AI task planning',
    processedDescription: 'Draft AI blog post',
    priority: 'Low',
    tags: ['work', 'writing'],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    completed: false // Add completion status
  }, // ~2 days ago
  {
    id: '6',
    originalInput: 'Quick call with Bob RE project Zephyr',
    processedDescription: 'Call Bob (Project Zephyr)',
    priority: 'Medium',
    tags: ['work', 'meeting'],
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    completed: false // Add completion status
  } // ~4 hours ago
];
let nextId = 7;

// --- END MOCK DATA ---

async function request(url, options = {}) {
  // --- Get Token from Firebase Auth ---
  let token = null;
  if (auth.currentUser) { // Check if a user is logged in
    try {
      token = await auth.currentUser.getIdToken(); // Get the Firebase ID token
      // console.log("Fetched Firebase ID Token:", token); // For debugging
    }
    catch (error) {
      console.error("Error getting Firebase ID token:", error);
      // Handle error appropriately - maybe sign out user or throw specific error
      // For now, we'll proceed without a token, likely causing a 401
    }
  } else {
    console.log("No Firebase user logged in, skipping token fetch.");
  }
  // --- End Token Fetching ---


  options.headers = {
    // Default headers
    'Content-Type': 'application/json',
    'Accept': 'application/json', // Good practice to add Accept header
    // Conditionally add Authorization header ONLY if token exists
    ...(token && {'Authorization': `Bearer ${token}`})
  };

  try {
    console.log(`Sending API Request: ${options.method || 'GET'} ${BASE_URL}${url}`);
    const response = await fetch(BASE_URL + url, options);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      }
      catch (e) {
        errorData = {detail: `${response.status} ${response.statusText}`}; // Include status code in fallback
      }
      console.error(`API Error Response (${response.status}):`, errorData);

      // If backend sends 401, provide a clearer message maybe
      if (response.status === 401) {
        throw new Error(errorData.detail || 'Authentication failed or token expired. Please log in again.');
      }

      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }
    // Check if response body exists before parsing JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    } else {
      // Handle non-JSON responses if necessary, or return null/empty object
      console.log("Received non-JSON response, content-type:", contentType);
      return null; // Or handle text/other types if expected
    }

  }
  catch (error) {
    console.error("API Request Function Error:", error);
    // Re-throw the formatted error
    throw new Error(error.message || 'An unknown network error occurred.');
  }
}

export const fetchTasks = () => {
  return request('/tasks/', {method: 'GET'});
};

export const addTask = (rawInput) => {
  return request('/tasks/', {
    method: 'POST',
    // Note: 'Content-Type' is set in the request helper now
    body: JSON.stringify({rawInput}),
  });
};

export const updateTaskCompletion = (taskId, completed) => {
  console.log(`API call: Updating task ${taskId} completion to ${completed}`);
  return request(`/tasks/${taskId}/complete`, {
    method: 'PUT',
    body: JSON.stringify({ completed }), // Send body as {"completed": boolean}
  });
};


// Add functions for login, signup, preferences later
// export const login = (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
// export const fetchPreferences = () => request('/preferences', { method: 'GET' });
// export const updatePreferences = (prefs) => request('/preferences', { method: 'PUT', body: JSON.stringify(prefs) });
