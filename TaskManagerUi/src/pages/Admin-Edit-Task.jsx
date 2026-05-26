import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TaskForm from "../components/TaskForm";
import useTaskEditor from "../hooks/useTaskEditor";

const AdminEditTask = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { task, handleChange, handleSave } = useTaskEditor(
        id,
        () => navigate("/AdminAllTasks"),
        () => navigate("/AdminAllTasks")
    );

    return (
        <TaskForm
            task={task}
            handleChange={handleChange}
            handleSave={handleSave}
            onCancel={() => navigate("/AdminAllTasks")}
            title="✏️ Edit Task (Admin)"
        />
    );
};

export default AdminEditTask;