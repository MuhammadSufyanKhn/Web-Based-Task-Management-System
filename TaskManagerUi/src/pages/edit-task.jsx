import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import TaskForm from "../components/TaskForm";
import useTaskEditor from "../hooks/useTaskEditor";

const EditTask = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

    const { task, handleChange, handleSave } = useTaskEditor(
        id,
        () => navigate("/dashboard"),
        () => navigate(`/view-all-tasks/${userId}`)
    );

    return (
        <TaskForm
            task={task}
            handleChange={handleChange}
            handleSave={handleSave}
            onCancel={() => navigate(-1)}
            title="✏️ Edit Task Details"
        />
    );
};

export default EditTask;