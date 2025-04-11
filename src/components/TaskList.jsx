// src/components/TaskList.jsx
import React from 'react';

// TaskItem component remains the same as before...
function TaskItem({task}) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  }

  return (
      <li style={{border: '1px solid #ccc', padding: '10px', marginBottom: '10px', listStyle: 'none', backgroundColor: '#fff', borderRadius: '4px'}}>
        <strong>{task.processedDescription || task.originalInput}</strong> <br/>
        <small>Original: {task.originalInput}</small><br/>
        <span style={{fontWeight: 'bold', color: task.priority === 'High' ? 'red' : (task.priority === 'Medium' ? 'orange' : 'inherit')}}>
          Priority: {task.priority || 'N/A'}
      </span> |
        <span> Tags: {task.tags?.join(', ') || 'None'} </span> |
        <span> Added: {formatDate(task.createdAt)}</span>
        {/* Add buttons for complete/delete later */}
      </li>
  );
}


function TaskList({tasks, isLoading}) {
  if (isLoading && tasks.length === 0) {
    return <p>Loading tasks...</p>;
  }

  // Display message if loading results in an empty list, OR if filtering results in an empty list
  if (!isLoading && tasks.length === 0) {
    // Check if there are *any* tasks before filtering (a bit tricky here, might need total count from App)
    // Simpler approach: just say no tasks match criteria if list is empty after potential loading
    return <p>No tasks match the current filters or none added yet.</p>;
  }

  return (
      <>
        {isLoading && <p style={{fontStyle: 'italic', color: '#555'}}>Updating tasks...</p>}
        <ul style={{paddingLeft: 0}}>
          {tasks.map(task => (
              <TaskItem key={task.id} task={task}/>
          ))}
        </ul>
      </>
  );
}

export default TaskList;