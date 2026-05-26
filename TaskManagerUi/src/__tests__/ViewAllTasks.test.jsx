import { test, expect, vi, beforeEach, describe } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import ViewAllTasks from "../pages/viewalltask";

const mockNavigate = vi.fn();
let mockParams = { userId: undefined };

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockParams,
    };
});

vi.mock("axios", () => ({
    default: {
        delete: vi.fn(),
    },
}));

describe("ViewAllTasks Page Component Tests", () => {
    const setMockToken = (role) => {
        const payload = btoa(JSON.stringify({
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": role
        }));
        localStorage.setItem("token", `header.${payload}.signature`);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockParams = { userId: undefined };
        vi.spyOn(window, "confirm").mockImplementation(() => true);
        vi.spyOn(console, "error").mockImplementation(() => {});
        setMockToken("User");
    });

    test("should redirect to login if no authentication token is present", async () => {
        localStorage.removeItem('token');

        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

        render(
            <MemoryRouter>
                <ViewAllTasks />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    test("should fetch user specific tasks if token belongs to normal User role", async () => {
        setMockToken("User");
        const mockData = [{ taskId: 101, title: "User Private Task", taskPriority: "Medium", taskStatus: "Pending" }];

        global.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockData)
        }));

        render(
            <MemoryRouter>
                <ViewAllTasks />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("User Private Task")).toBeInTheDocument();
        });
    });

    test("should fetch managed target client tasks if Admin token is active with a userId param parameter", async () => {
        setMockToken("Admin");
        mockParams = { userId: "user-786" };

        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

        render(
            <MemoryRouter>
                <ViewAllTasks />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("https://localhost:7127/api/Task/user-tasks/user-786", expect.any(Object));
        });
    });

    test("should display a clean red error block message if the API endpoint response returns not ok", async () => {
        setMockToken("User");
        global.fetch = vi.fn(() => Promise.resolve({ ok: false }));

        render(
            <MemoryRouter>
                <ViewAllTasks />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Failed to fetch tasks")).toBeInTheDocument();
        });
    });

    test("should switch visibility elements correctly when user toggles priority filter option selections", async () => {
        setMockToken("User");
        const contextualTasks = [
            { taskId: 1, title: "Urgent Fix", taskPriority: "High", taskStatus: "Pending" },
            { taskId: 2, title: "Documentation work", taskPriority: "Low", taskStatus: "Completed" }
        ];

        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(contextualTasks) }));

        render(
            <MemoryRouter>
                <ViewAllTasks />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Urgent Fix")).toBeInTheDocument();
        });

        const selectDropdown = screen.getByLabelText("Filter Priority:");
        fireEvent.change(selectDropdown, { target: { value: "High" } });

        await waitFor(() => {
            expect(screen.queryByText("Documentation work")).not.toBeInTheDocument();
        });
    });

    test("should fire handle deleteTask logic workflow safely upon confirm window interaction approval", async () => {
        setMockToken("User");
        const singleTaskArray = [{ taskId: 99, title: "Target Task For Erase", taskPriority: "Low", taskStatus: "Pending" }];
        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(singleTaskArray) }));
        axios.delete = vi.fn(() => Promise.resolve({ status: 200 }));

        render(
            <MemoryRouter>
                <ViewAllTasks />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Target Task For Erase")).toBeInTheDocument();
        });

        const targetDeleteButton = screen.getByText("Delete");
        fireEvent.click(targetDeleteButton);

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith("https://localhost:7127/api/Task/delete-task/99", expect.any(Object));
        });
    });

    test("should gracefully handle and log error if delete API promise context structure rejects", async () => {
        setMockToken("User");
        const singleTaskArray = [{ taskId: 99, title: "Target Task", taskPriority: "Low", taskStatus: "Pending" }];
        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(singleTaskArray) }));

        const deleteError = new Error("Network Disconnect");
        axios.delete = vi.fn(() => Promise.reject(deleteError));

        render(
            <MemoryRouter>
                <ViewAllTasks />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Target Task")).toBeInTheDocument();
        });

        const targetDeleteButton = screen.getByText("Delete");
        fireEvent.click(targetDeleteButton);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith("Error deleting task:", deleteError);
        });
    });

    test("should execute router reverse navigation context when back action button is triggered", async () => {
        setMockToken("User");
        global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

        render(
            <MemoryRouter>
                <ViewAllTasks />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        });

        const backButton = screen.getByText("← Back");
        fireEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});