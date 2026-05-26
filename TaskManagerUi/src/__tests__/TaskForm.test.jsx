import { test, expect, vi, describe } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TaskForm from '../components/TaskForm';

describe("TaskForm Interactive Operations Tests", () => {
    const defaultMockTask = {
        title: "Build Systems",
        descriptions: "Verify Sonar Profile Parameters",
        taskPriority: "High",
        taskStatus: "InProgress",
        dueDate: "2026-05-26"
    };

    const mockChangeHandler = vi.fn();
    const mockSaveHandler = vi.fn((e) => e.preventDefault());
    const mockCancelHandler = vi.fn();

    test("binds matching entity properties to structural fields and captures user events hooks", () => {
        render(
            <TaskForm 
                task={defaultMockTask}
                handleChange={mockChangeHandler}
                handleSave={mockSaveHandler}
                onCancel={mockCancelHandler}
                title="Update Operational Context"
            />
        );

        // Value match check validations
        expect(screen.getByLabelText("Task Title").value).toBe("Build Systems");
        expect(screen.getByLabelText("Description").value).toBe("Verify Sonar Profile Parameters");
        expect(screen.getByLabelText("Priority").value).toBe("High");
        expect(screen.getByLabelText("Status").value).toBe("InProgress");
        expect(screen.getByLabelText("Due Date").value).toBe("2026-05-26");

        // Fire text value input adjustments change trigger
        const inputTitleField = screen.getByLabelText("Task Title");
        fireEvent.change(inputTitleField, { target: { value: "Refactored System Stack" } });
        expect(mockChangeHandler).toHaveBeenCalled();

        // Fire Back layout button clicking flow simulation
        const closeBtn = screen.getByText("Cancel & Go Back");
        fireEvent.click(closeBtn);
        expect(mockCancelHandler).toHaveBeenCalled();

        // Submit operational processing validation execution trigger
        const saveSubmitBtn = screen.getByText("💾 Save Changes");
        fireEvent.click(saveSubmitBtn);
        expect(mockSaveHandler).toHaveBeenCalled();
    });
});