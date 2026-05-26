import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StatsCard from '../components/StatsCard';

describe("StatsCard Component Presentation Tests", () => {
    test("should render title and count parameters cleanly", () => {
        render(<StatsCard title="Completed Tasks" count={42} className="completed" />);
        
        expect(screen.getByText("Completed Tasks")).toBeInTheDocument();
        expect(screen.getByText("42")).toBeInTheDocument();
    });

    test("should fallback to 0 if count is missing or undefined", () => {
        render(<StatsCard title="Pending Tasks" count={undefined} className="pending" />);
        
        expect(screen.getByText("Pending Tasks")).toBeInTheDocument();
        expect(screen.getByText("0")).toBeInTheDocument(); // Checks count || 0 logical fallbacks
    });
});