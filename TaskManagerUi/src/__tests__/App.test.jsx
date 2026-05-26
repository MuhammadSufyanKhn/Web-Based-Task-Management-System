import { test, expect, vi, describe, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../App';

describe("App Component Routing Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    test('renders without crashing and redirects to login by default', () => {
        render(<App />);
        expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });

    test('should block protected route and show login when no token is present', () => {
        localStorage.removeItem('token');
        render(<App />);
        expect(screen.getByText("Welcome Back")).toBeInTheDocument();
        expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

   // Valid token injection checking authenticated condition path branches
    test('should allow rendering of layout matching protected routes when a valid token layout structure exists', () => {
        const dummyPayload = btoa(JSON.stringify({
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "User"
        }));
        localStorage.setItem('token', `header.${dummyPayload}.signature`);
        
        // Browser ki window location history ko /dashboard par force karte hain
        window.history.pushState({}, 'Dashboard Page', '/dashboard');
        
        render(<App />);
        
        // Ab chunki path /dashboard hai aur token bhi hai, to login ka text screen par nahi aana chahiye
        expect(screen.queryByText("Welcome Back")).not.toBeInTheDocument();
    });
});