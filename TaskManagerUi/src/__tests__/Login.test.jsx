import { test, expect, vi, beforeEach, describe } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Login from "../pages/Login";

vi.mock("axios", () => ({
    default: {
        post: vi.fn(),
    },
}));

vi.mock("jwt-decode", () => ({
    jwtDecode: vi.fn(),
}));

describe("Login Page Component Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.spyOn(window, "alert").mockImplementation(() => {});
        delete window.location;
        window.location = { href: "" };
    });

    test("should render login form with email, password fields and button", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        expect(screen.getByText("Login")).toBeInTheDocument();
        expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });

    test("should update email and password fields on user input", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Password");

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        expect(emailInput.value).toBe("test@example.com");
        expect(passwordInput.value).toBe("password123");
    });

    test("should redirect Admin to Admin-dashboard after successful login", async () => {
        const { jwtDecode } = await import("jwt-decode");
        jwtDecode.mockReturnValue({
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin"
        });

        axios.post = vi.fn(() => Promise.resolve({
            data: { token: "mock.admin.token" }
        }));

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Email"), {
            target: { value: "admin@test.com" }
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "admin123" }
        });
        fireEvent.click(screen.getByText("Login"));

        await waitFor(() => {
            expect(localStorage.getItem("token")).toBe("mock.admin.token");
            expect(window.location.href).toBe("/Admin-dashboard");
        });
    });

    test("should redirect User to dashboard after successful login", async () => {
        const { jwtDecode } = await import("jwt-decode");
        jwtDecode.mockReturnValue({
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "User"
        });

        axios.post = vi.fn(() => Promise.resolve({
            data: { token: "mock.user.token" }
        }));

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Email"), {
            target: { value: "user@test.com" }
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "user123" }
        });
        fireEvent.click(screen.getByText("Login"));

        await waitFor(() => {
            expect(localStorage.getItem("token")).toBe("mock.user.token");
            expect(window.location.href).toBe("/dashboard");
        });
    });

    test("should show alert on login failure", async () => {
        axios.post = vi.fn(() => Promise.reject(new Error("Invalid credentials")));

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Email"), {
            target: { value: "wrong@test.com" }
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "wrongpass" }
        });
        fireEvent.click(screen.getByText("Login"));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("Invalid Email or Password!");
        });
    });

    test("should have register link that navigates to /register", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const registerLink = screen.getByText("Register");
        expect(registerLink).toBeInTheDocument();
        expect(registerLink.getAttribute("href")).toBe("/register");
    });
});