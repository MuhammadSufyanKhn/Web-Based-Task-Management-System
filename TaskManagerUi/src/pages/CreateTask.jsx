import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 


const CreateTask = () => {
    const [task, setTask] = useState({ title: '', descriptions: '', taskPriority: 'Medium', dueDate: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://localhost:7127/api/task/create-task', task, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Task created successfully!");
            navigate('/dashboard');
        } catch (err) { alert("Error occured! please try again"); }
    };

    return (
        <div style={{ width: "100vw" }} className="dashboard-main"> 
            <div className="create-task-card">
                <h2 className="title" style={{border: 'none', fontSize: '24px'}}>✨ Create New Task</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Task Title</label>
                        <input type="text" className="custom-input" placeholder="What needs to be done?" required 
                               onChange={e => setTask({...task, title: e.target.value})} />
                    </div>
                    
                    <div className="form-group">
                        <label>Description</label>
                        <textarea className="custom-textarea" rows="3" placeholder="Add some details..." 
                                  onChange={e => setTask({...task, descriptions: e.target.value})}></textarea>
                    </div>

                    <div style={{display: 'flex', gap: '15px', marginBottom: '25px'}}>
                        <div style={{flex: 1}}>
                            <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Priority</label>
                            <select className="custom-select" onChange={e => setTask({...task, taskPriority: e.target.value})}>
                                <option value="Low">Low</option>
                                <option value="Medium" selected>Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div style={{flex: 1}}>
                            <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Due Date</label>
                            <input type="date" className="custom-input" onChange={e => setTask({...task, dueDate: e.target.value})} />
                        </div>
                    </div>

                    <button type="submit" className="add-btn" style={{width: '100%', padding: '14px', fontSize: '16px'}}>Save Task</button>
                    <button type="button" onClick={() => navigate('/dashboard')} 
                            style={{width: '100%', background: 'none', color: '#666', border: 'none', marginTop: '10px', cursor: 'pointer'}}>
                        Cancel & Go Back
                    </button>
                </form>
            </div>
        </div>
    );
};
export default CreateTask;