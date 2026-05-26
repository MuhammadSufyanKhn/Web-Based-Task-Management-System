import { useState, useEffect } from "react";
import axios from "axios";

const useTaskEditor = (id, navigateOnError, navigateOnSuccess) => {
    const [task, setTask] = useState({
        title: "",
        descriptions: "",
        taskPriority: "Medium",
        dueDate: "",
        taskStatus: "Pending"
    });

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (!id) return;
        const fetchTask = async () => {
            try {
                const res = await axios.get(`https://localhost:7127/api/Task/${id}`, { headers });
                if (res.data.dueDate) {
                    res.data.dueDate = res.data.dueDate.split("T")[0];
                }
                setTask(res.data);
            } catch (err) {
                console.error("Failed to fetch task details:", err);
                alert("Failed to fetch task details");
                navigateOnError();
            }
        };
        fetchTask();
    }, [id]);

    const handleChange = (e) => {
        setTask(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`https://localhost:7127/api/Task/update-task/${id}`, task, { headers });
            alert("Task Updated!");
            navigateOnSuccess();
        } catch (err) {
            console.error("Error updating task", err);
        }
    };

    return { task, handleChange, handleSave };
};

export default useTaskEditor;