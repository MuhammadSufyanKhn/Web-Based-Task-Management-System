import { test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import axios from "axios";
import useTaskEditor from "../hooks/useTaskEditor"; 

vi.mock("axios");

const TestHookComponent = ({ id, navigateOnError, navigateOnSuccess }) => {
    const { task, handleChange, handleSave } = useTaskEditor(id, navigateOnError, navigateOnSuccess);
    
    return (
        <form onSubmit={handleSave} data-testid="form">
            <input 
                data-testid="title-input" 
                name="title" 
                value={task.title} 
                onChange={handleChange} 
            />
            <input 
                data-testid="desc-input" 
                name="descriptions" 
                value={task.descriptions} 
                onChange={handleChange} 
            />
            <button type="submit">Save</button>
        </form>
    );
};

describe("useTaskEditor Custom Hook Tests", () => {
    const mockNavigateOnError = vi.fn();
    const mockNavigateOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem("token", "mock-jwt-token");
        vi.spyOn(window, "alert").mockImplementation(() => {});
    });

    test("should return early if no ID is provided", () => {
        render(
            <TestHookComponent 
                id={null} 
                navigateOnError={mockNavigateOnError} 
                navigateOnSuccess={mockNavigateOnSuccess} 
            />
        );
        expect(axios.get).not.toHaveBeenCalled();
    });

    test("should fetch task details successfully and split the date if T is present", async () => {
        const mockTaskData = {
            title: "Learn Vitest",
            descriptions: "Write test cases for custom hooks",
            taskPriority: "High",
            dueDate: "2026-05-26T20:00:00",
            taskStatus: "Pending"
        };

        axios.get.mockResolvedValueOnce({ data: mockTaskData });

        render(
            <TestHookComponent 
                id="123" 
                navigateOnError={mockNavigateOnError} 
                navigateOnSuccess={mockNavigateOnSuccess} 
            />
        );

        await waitFor(() => {
            const input = screen.getByTestId("title-input");
            expect(input.value).toBe("Learn Vitest");
        });
        
        expect(axios.get).toHaveBeenCalledWith("https://localhost:7127/api/Task/123", {
            headers: { Authorization: "Bearer mock-jwt-token" }
        });
    });

    test("should handle fetch error and call navigateOnError", async () => {
        axios.get.mockRejectedValueOnce(new Error("API Failure"));

        render(
            <TestHookComponent 
                id="123" 
                navigateOnError={mockNavigateOnError} 
                navigateOnSuccess={mockNavigateOnSuccess} 
            />
        );

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("Failed to fetch task details");
            expect(mockNavigateOnError).toHaveBeenCalled();
        });
    });

    test("should update task state when handleChange is called", async () => {
        axios.get.mockResolvedValueOnce({ data: { title: "Old Title" } });

        render(
            <TestHookComponent 
                id="123" 
                navigateOnError={mockNavigateOnError} 
                navigateOnSuccess={mockNavigateOnSuccess} 
            />
        );

        const input = screen.getByTestId("title-input");
        
        await waitFor(() => {
            expect(input.value).toBe("Old Title");
        });

        fireEvent.change(input, { target: { name: "title", value: "New Awesome Title" } });
        expect(input.value).toBe("New Awesome Title");
    });

    test("should update task details successfully on handleSave submit", async () => {
        axios.get.mockResolvedValueOnce({ data: { title: "Test Task" } });
        axios.put.mockResolvedValueOnce({ data: { success: true } });

        render(
            <TestHookComponent 
                id="123" 
                navigateOnError={mockNavigateOnError} 
                navigateOnSuccess={mockNavigateOnSuccess} 
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId("title-input").value).toBe("Test Task");
        });

        const form = screen.getByTestId("form");
        fireEvent.submit(form);

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                "https://localhost:7127/api/Task/update-task/123",
                expect.any(Object),
                { headers: { Authorization: "Bearer mock-jwt-token" } }
            );
            expect(window.alert).toHaveBeenCalledWith("Task Updated!");
            expect(mockNavigateOnSuccess).toHaveBeenCalled();
        });
    });

    test("should log error if handleSave API call fails", async () => {
        axios.get.mockResolvedValueOnce({ data: { title: "Test Task" } });
        axios.put.mockRejectedValueOnce(new Error("Update Failed"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(
            <TestHookComponent 
                id="123" 
                navigateOnError={mockNavigateOnError} 
                navigateOnSuccess={mockNavigateOnSuccess} 
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId("title-input").value).toBe("Test Task");
        });

        const form = screen.getByTestId("form");
        fireEvent.submit(form);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error updating task", expect.any(Error));
        });
    });
});