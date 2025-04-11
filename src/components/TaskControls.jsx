// src/components/TaskControls.jsx
import React from 'react';

function TaskControls({
                        allTags, // Array of unique tags: ['work', 'personal', 'urgent', ...]
                        sortCriteria, // Current sort: 'priority', 'newest', 'oldest'
                        activeTags, // Array of currently selected tags for filtering: ['work']
                        onSortChange, // Function to call when sort dropdown changes
                        onTagToggle, // Function to call when a tag is clicked (toggled)
                      }) {

  return (
      <div style={{marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#f9f9f9'}}>
        <h4>View Options</h4>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '20px'}}>
          {/* Sorting Dropdown */}
          <div>
            <label htmlFor="sort-select" style={{marginRight: '5px'}}>Sort by:</label>
            <select
                id="sort-select"
                value={sortCriteria}
                onChange={(e) => onSortChange(e.target.value)}
                style={{padding: '5px'}}
            >
              <option value="priority">Priority</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Tag Filtering */}
          {allTags.length > 0 && (
              <div>
                <span style={{marginRight: '5px'}}>Filter by Tag:</span>
                {allTags.map(tag => {
                  const isActive = activeTags.includes(tag);
                  return (
                      <button
                          key={tag}
                          onClick={() => onTagToggle(tag)}
                          style={{
                            marginRight: '5px',
                            marginBottom: '5px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            border: `1px solid ${isActive ? '#007bff' : '#ccc'}`,
                            backgroundColor: isActive ? '#007bff' : 'white',
                            color: isActive ? 'white' : 'black',
                            borderRadius: '12px',
                            fontSize: '0.9em'
                          }}
                      >
                        {tag}
                      </button>
                  );
                })}
                {activeTags.length > 0 && (
                    <button
                        onClick={() => onTagToggle(null)} // Special case to clear all tags
                        style={{
                          marginLeft: '10px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          border: `1px solid #dc3545`,
                          backgroundColor: 'white',
                          color: '#dc3545',
                          borderRadius: '12px',
                          fontSize: '0.9em'
                        }}
                    >
                      Clear Filters
                    </button>
                )}
              </div>
          )}
        </div>
      </div>
  );
}

export default TaskControls;