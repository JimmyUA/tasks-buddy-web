// src/App.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AddTaskForm from './components/AddTaskForm';
import TaskList from './components/TaskList';
import TaskControls from './components/TaskControls';
// Import the new API function
import { addTask, fetchTasks, updateTaskCompletion } from './services/api';
import './App.css';
// --- Import Firebase Auth ---
import { auth } from './firebaseConfig';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

// Define priority order helper
const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
const getPriorityValue = (priority) => priorityOrder[priority] || 99;

function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Store REAL user object or null
  const [authLoading, setAuthLoading] = useState(true); // Track initial auth state loading

  const [sortCriteria, setSortCriteria] = useState('priority');
  const [activeTags, setActiveTags] = useState([]);

  // --- Effect to listen for Auth State Changes ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? `User: ${user.uid}` : "No User");
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- loadTasks ---
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
      // Ensure completed field is always present and boolean for consistency
      const tasksWithCompletion = fetchedTasks.map(task => ({ ...task, completed: !!task.completed }));
      setTasks(tasksWithCompletion || []);
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

  // --- Reload tasks when user logs in ---
  useEffect(() => {
    if (currentUser) {
      loadTasks();
    } else {
      setTasks([]);
      setActiveTags([]);
      setSortCriteria('priority');
    }
  }, [currentUser, loadTasks]);

  // --- Add Task Handler ---
  const handleAddTask = async (rawInput) => {
    if (!currentUser) {
      setError("Please log in to add tasks.");
      return;
    }
    setIsAdding(true);
    setError(null);
    try {
      const newTask = await addTask(rawInput);
      // Ensure new task has completed field
      setTasks(prevTasks => [{ ...newTask, completed: !!newTask.completed }, ...prevTasks]);
    }
    catch (err) {
      setError(err.message || 'Failed to add task.');
      console.error("Add task error:", err);
      // Consider reloading tasks on add failure to ensure consistency
      // loadTasks();
    }
    finally {
      setIsAdding(false);
    }
  };

  // --- Task Completion Handler (Optimistic Update) ---
  const handleToggleComplete = async (taskId, newCompletedStatus) => {
    if (!currentUser) {
      setError("Please log in to update tasks.");
      return;
    }

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return; // Task not found locally

    const originalTasks = [...tasks];
    const originalTask = tasks[taskIndex];

    // Optimistic UI update
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...originalTask, completed: newCompletedStatus };
    setTasks(updatedTasks);
    setError(null); // Clear previous errors

    try {
      // Make the API call
      const updatedTaskFromServer = await updateTaskCompletion(taskId, newCompletedStatus);
      // Update local state with server response (includes updatedAt)
      setTasks(prevTasks => {
          const finalTasks = [...prevTasks];
          const idx = finalTasks.findIndex(t => t.id === taskId);
          if (idx !== -1) {
              finalTasks[idx] = { ...updatedTaskFromServer, completed: !!updatedTaskFromServer.completed }; // Ensure boolean
          }
          return finalTasks;
      });

    } catch (err) {
      console.error("Failed to update task completion:", err);
      setError(err.message || 'Failed to update task status.');
      // Revert UI on error
      setTasks(originalTasks);
    }
  };
  // --- End Task Completion Handler ---


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
      // Put completed tasks at the bottom, regardless of sort criteria
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

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

  // --- Control Handlers ---
  const handleSortChange = (newCriteria) => { setSortCriteria(newCriteria); };
  const handleTagToggle = (tagToToggle) => {
    if (tagToToggle === null) {
      setActiveTags([]);
      return;
    }
    setActiveTags(prevTags => {
      if (prevTags.includes(tagToToggle)) {
        return prevTags.filter(t => t !== tagToToggle);
      } else {
        return [...prevTags, tagToToggle];
      }
    });
  };

  // --- Firebase Auth Handlers ---
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, provider);
      console.log("Google Sign-In Successful");
    }
    catch (error) {
      console.error("Google Sign-In Error:", error);
      setError(`Login failed: ${error.message}`);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Sign-Out successful");
      setTasks([]);
      setActiveTags([]);
      setSortCriteria('priority');
      setError(null); // Clear any errors on logout
    }
    catch (error) {
      console.error("Sign-Out Error:", error);
      setError(`Logout failed: ${error.message}`);
    }
  };
  // --- End Firebase Auth Handlers ---

  // --- Render Loading state ---
  if (authLoading) {
    return <div className="App"><p>Loading Authentication...</p></div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Task Planner</h1>
        {currentUser ? (
          <div style={{ float: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9em' }}>{currentUser.displayName || currentUser.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin} style={{ float: 'right' }}>Login with Google</button>
        )}
      </header>

      <main>
        {!currentUser ? (
          <div>
            <h2>Please Log In</h2>
            <p>Log in to manage your tasks.</p>
            {error && error.toLowerCase().includes('login failed') && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        ) : (
          <>
            <h2>Add New Task</h2>
            <AddTaskForm onAddTask={handleAddTask} isAdding={isAdding} />

            {/* Display general errors */} 
            {error && !error.toLowerCase().includes('login failed') && <p style={{ color: 'red' }}>Error: {error}</p>}

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
              isLoading={isLoading || isAdding} // Show loading during fetch or add
              onToggleComplete={handleToggleComplete} // Pass the handler down
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
