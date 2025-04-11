// src/App.jsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import AddTaskForm from './components/AddTaskForm';
import TaskList from './components/TaskList';
import TaskControls from './components/TaskControls';
import {addTask, fetchTasks} from './services/api';
import './App.css';
// --- Import Firebase Auth ---
import {auth} from './firebaseConfig';
import {GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut} from "firebase/auth";

// Define priority order helper
const priorityOrder = {'High': 1, 'Medium': 2, 'Low': 3};
const getPriorityValue = (priority) => priorityOrder[priority] || 99;

function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  // --- REMOVE THIS LINE ---
  // const [isAuthenticated, setIsAuthenticated] = useState(true); // REMOVE - No longer needed

  // --- USE THESE INSTEAD ---
  const [currentUser, setCurrentUser] = useState(null); // Store REAL user object or null
  const [authLoading, setAuthLoading] = useState(true); // Track initial auth state loading

  const [sortCriteria, setSortCriteria] = useState('priority');
  const [activeTags, setActiveTags] = useState([]);

  // --- Effect to listen for Auth State Changes (Correct) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? `User: ${user.uid}` : "No User");
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- loadTasks (Correct - depends on currentUser) ---
  const loadTasks = useCallback(async () => {
    if (!currentUser) {
      setTasks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log("Attempting to fetch tasks for user:", currentUser.uid);
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks || []);
    }
    catch (err) {
      setError(err.message || 'Failed to fetch tasks.');
      console.error("Fetch error:", err);
      if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
        console.warn("Received 401 Unauthorized, potentially expired token.");
      }
    }
    finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // --- Reload tasks when user logs in (Correct) ---
  useEffect(() => {
    if (currentUser) {
      loadTasks();
    } else {
      setTasks([]);
      setActiveTags([]);
      setSortCriteria('priority');
    }
  }, [currentUser, loadTasks]);

  // --- Add Task Handler (Correct - checks currentUser) ---
  const handleAddTask = async (rawInput) => {
    if (!currentUser) {
      setError("Please log in to add tasks.");
      return;
    }
    setIsAdding(true);
    setError(null);
    try {
      const newTask = await addTask(rawInput);
      setTasks(prevTasks => [newTask, ...prevTasks]);
    }
    catch (err) {
      setError(err.message || 'Failed to add task.');
      console.error("Add task error:", err);
      loadTasks();
    }
    finally {
      setIsAdding(false);
    }
  };

  // --- Calculate derived state: all unique tags ---
  const allTags = useMemo(() => {
    const tagSet = new Set();
    tasks.forEach(task => {
      task.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort(); // Return sorted array of unique tags
  }, [tasks]);
  // --- Calculate derived state: filtered and sorted tasks ---
  const filteredAndSortedTasks = useMemo(() => {
    let processedTasks = [...tasks];

    // 1. Filter by active tags
    if (activeTags.length > 0) {
      processedTasks = processedTasks.filter(task =>
                                                 activeTags.every(activeTag => task.tags?.includes(activeTag))
      );
    }

    // 2. Sort based on criteria
    processedTasks.sort((a, b) => {
      switch (sortCriteria) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority':
        default: // Fallback to priority sort
          const priorityDiff = getPriorityValue(a.priority) - getPriorityValue(b.priority);
          if (priorityDiff !== 0) return priorityDiff;
          // If priority is the same, sort by newest first as a secondary criterion
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return processedTasks;
  }, [tasks, sortCriteria, activeTags]); // Recalculate when these change

  // --- Control Handlers (Correct) ---
  const handleSortChange = (newCriteria) => { setSortCriteria(newCriteria); };
  const handleTagToggle = (tagToToggle) => {
    // Special case: null means clear all filters
    if (tagToToggle === null) {
      setActiveTags([]);
      return;
    }

    setActiveTags(prevTags => {
      if (prevTags.includes(tagToToggle)) {
        // Remove tag if already active
        return prevTags.filter(t => t !== tagToToggle);
      } else {
        // Add tag if not active
        return [...prevTags, tagToToggle];
      }
    });
  };

  // --- Firebase Auth Handlers ---
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setAuthLoading(true); // Show loading during popup
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting the user state
      console.log("Google Sign-In Successful");
    }
    catch (error) {
      console.error("Google Sign-In Error:", error);
      setError(`Login failed: ${error.message}`);
      setAuthLoading(false); // Hide loading on error
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Sign-Out successful");
      // onAuthStateChanged will set currentUser to null
      setTasks([]); // Explicitly clear tasks UI immediately
      setActiveTags([]);
      setSortCriteria('priority');
    }
    catch (error) {
      console.error("Sign-Out Error:", error);
      setError(`Logout failed: ${error.message}`);
    }
  };
  // --- End Firebase Auth Handlers ---

  // --- Render Loading state (Correct) ---
  if (authLoading) {
    return <div className="App"><p>Loading Authentication...</p></div>;
  }

  // --- CORRECTED RETURN STATEMENT ---
  return (
      <div className="App">
        <header className="App-header">
          <h1>AI Task Planner</h1>
          {/* --- Use currentUser to determine UI --- */}
          {currentUser ? (
              <div style={{float: 'right', display: 'flex', alignItems: 'center', gap: '10px'}}>
                {/* Display user info if available */}
                <span style={{fontSize: '0.9em'}}>{currentUser.displayName || currentUser.email}</span>
                <button onClick={handleLogout}>Logout</button>
              </div>
          ) : (
               // Show Login button if no user is logged in
               <button onClick={handleLogin} style={{float: 'right'}}>Login with Google</button>
           )}
        </header>

        <main>
          {/* --- Use currentUser to determine UI --- */}
          {!currentUser ? (
              // Show login prompt if no user
              <div>
                <h2>Please Log In</h2>
                <p>Log in to manage your tasks.</p>
                {/* Show login specific errors if any */}
                {error && error.toLowerCase().includes('login failed') && <p style={{color: 'red'}}>{error}</p>}
              </div>
          ) : (
               // Show task management UI if user is logged in
               <>
                 <h2>Add New Task</h2>
                 <AddTaskForm onAddTask={handleAddTask} isAdding={isAdding}/>

                 {/* Show general errors if any (and not a login error) */}
                 {error && !error.toLowerCase().includes('login failed') && <p style={{color: 'red'}}>Error: {error}</p>}

                 <TaskControls
                     allTags={allTags}
                     sortCriteria={sortCriteria}
                     activeTags={activeTags}
                     onSortChange={handleSortChange}
                     onTagToggle={handleTagToggle}
                 />

                 <h2>Your Tasks ({filteredAndSortedTasks.length})</h2>
                 <TaskList
                     tasks={filteredAndSortedTasks}
                     isLoading={isLoading || isAdding}
                 />
               </>
           )}
        </main>
      </div>
  );
}

export default App;