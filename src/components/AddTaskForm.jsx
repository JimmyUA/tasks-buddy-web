// src/components/AddTaskForm.jsx
import React, {useState} from 'react';

function AddTaskForm({onAddTask, isAdding}) {
  const [taskText, setTaskText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskText.trim() || isAdding) {
      return; // Don't add empty tasks or if already adding
    }
    onAddTask(taskText);
    setTaskText(''); // Clear input after submission
  };

  return (
      <form onSubmit={handleSubmit} style={{marginBottom: '20px'}}>
        <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="Dump your task here..."
            disabled={isAdding}
            style={{width: '70%', padding: '10px', marginRight: '10px'}}
        />
        <button type="submit" disabled={isAdding || !taskText.trim()} style={{padding: '10px'}}>
          {isAdding ? 'Adding...' : 'Add Task'}
        </button>
      </form>
  );
}

export default AddTaskForm;