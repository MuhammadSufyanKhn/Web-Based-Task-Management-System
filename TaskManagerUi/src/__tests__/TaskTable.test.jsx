import { test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import TaskTable from "../components/TaskTable"; 

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("TaskTable Component Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("should render empty fallback message when tasks array is empty", () => {
        render(
            <MemoryRouter>
                <TaskTable tasks={[]} onDelete={vi.fn()} emptyMessage="No tasks available today" />
            </MemoryRouter>
        );

        expect(screen.getByText("No tasks available today")).toBeInTheDocument();
    });

    test("should use default empty fallback message if emptyMessage prop is missing", () => {
        render(
            <MemoryRouter>
                <TaskTable tasks={[]} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText("No tasks found.")).toBeInTheDocument();
    });

    test("should render list of tasks correctly with formatted dates", () => {
        const mockTasks = [
            {
                taskId: "task-1",
                title: "Complete .NET Assignment",
                taskPriority: "High",
                taskStatus: "InProgress",
                dueDate: "2026-05-30T00:00:00"
            },
            {
                taskId: "task-2",
                title: "Fix React State Bug",
                taskPriority: "Medium",
                taskStatus: "Pending",
                dueDate: null 
            }
        ];

        render(
            <MemoryRouter>
                <TaskTable tasks={mockTasks} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText("Complete .NET Assignment")).toBeInTheDocument();
        expect(screen.getByText("High")).toBeInTheDocument();
        expect(screen.getByText("InProgress")).toBeInTheDocument();
        expect(screen.getByText("Fix React State Bug")).toBeInTheDocument();
        expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    test("should navigate to edit page when Edit button is clicked", () => {
        const mockTasks = [{ taskId: "123", title: "Test Route", taskPriority: "Low", taskStatus: "Pending", dueDate: "" }];

        render(
            <MemoryRouter>
                <TaskTable tasks={mockTasks} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        const editButton = screen.getByText("Edit");
        fireEvent.click(editButton);

        expect(mockNavigate).toHaveBeenCalledWith("/edit-task/123");
    });

    test("should navigate to details page when Details button is clicked", () => {
        const mockTasks = [{ taskId: "123", title: "Test Route", taskPriority: "Low", taskStatus: "Pending", dueDate: "" }];

        render(
            <MemoryRouter>
                <TaskTable tasks={mockTasks} onDelete={vi.fn()} />
            </MemoryRouter>
        );

        const detailsButton = screen.getByText("Details");
        fireEvent.click(detailsButton);

        expect(mockNavigate).toHaveBeenCalledWith("/ViewTaskDetails/123");
    });

    test("should trigger onDelete callback with correct id when Delete button is clicked", () => {
        const mockTasks = [{ taskId: "555", title: "Test Delete Call", taskPriority: "Low", taskStatus: "Pending", dueDate: "" }];
        const mockOnDelete = vi.fn();

        render(
            <MemoryRouter>
                <TaskTable tasks={mockTasks} onDelete={mockOnDelete} />
            </MemoryRouter>
        );

        const deleteButton = screen.getByText("Delete");
        fireEvent.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledWith("555");
    });
});