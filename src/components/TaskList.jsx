// src/components/TaskList.jsx
import React from 'react';

// TaskItem component now includes a checkbox and handles completion toggle
function TaskItem({ task, onToggleComplete }) { // Added onToggleComplete prop
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  }

  const handleCheckboxChange = (event) => {
    // Call the handler passed from the parent (App.jsx via TaskList)
    // Pass the task ID and the *new* completed status
    onToggleComplete(task.id, event.target.checked);
  };

  // Style for completed tasks
  const taskStyle = {
    border: '1px solid #ccc',
    padding: '10px',
    marginBottom: '10px',
    listStyle: 'none',
    backgroundColor: task.completed ? '#f0f0f0' : '#fff', // Lighter background for completed
    borderRadius: '4px',
    display: 'flex', // Use flexbox for alignment
    alignItems: 'center' // Align items vertically
  };

  const descriptionStyle = {
    flexGrow: 1, // Allow description to take up available space
    marginLeft: '10px', // Space between checkbox and text
    textDecoration: task.completed ? 'line-through' : 'none', // Strikethrough completed tasks
    color: task.completed ? '#888' : 'inherit' // Dim completed task text
  };


  return (
      <li style={taskStyle}>
         {/* Checkbox for completion status */}
         <input
            type="checkbox"
            checked={!!task.completed} // Ensure it's a boolean
            onChange={handleCheckboxChange}
            style={{ marginRight: '10px' }} // Add some space to the right
         />
         <div style={descriptionStyle}> {/* Wrap text content */}
            <strong>{task.processedDescription || task.originalInput}</strong> <br/>
            <small>Original: {task.originalInput}</small><br/>
            <span style={{fontWeight: 'bold', color: task.priority === 'High' ? 'red' : (task.priority === 'Medium' ? 'orange' : 'inherit')}}>
              Priority: {task.priority || 'N/A'}
            </span> |
            <span> Tags: {task.tags?.join(', ') || 'None'} </span> |
            <span> Added: {formatDate(task.createdAt)}</span>
            {/* Display updated time if available */}
            {task.updatedAt && (
                <> | <span> Updated: {formatDate(task.updatedAt)}</span></>
            )}
         </div>
         {/* Add delete button later */}
      </li>
  );
}


// TaskList now accepts and passes down onToggleComplete
function TaskList({ tasks, isLoading, onToggleComplete }) { // Added onToggleComplete prop
  if (isLoading && tasks.length === 0) {
    return <p>Loading tasks...</p>;
  }

  if (!isLoading && tasks.length === 0) {
    return <p>No tasks match the current filters or none added yet.</p>;
  }

  return (
      <>
        {isLoading && <p style={{fontStyle: 'italic', color: '#555'}}>Updating tasks...</p>}
        <ul style={{paddingLeft: 0}}>
          {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete} // Pass the handler down
              />
          ))}
        </ul>
      </>
  );
}

export default TaskList;
