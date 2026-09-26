import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MetricCard from '../components/charts/MetricCard';
import BurndownChart from '../components/charts/BurndownChart';
import VelocityBarChart from '../components/charts/VelocityBarChart';
import BreakdownBarChart from '../components/charts/BreakdownBarChart';
import DonutChart from '../components/charts/DonutChart';

describe('Project Report Components Tests', () => {
    test('MetricCard renders title, value, subtitle, and progress', () => {
        render(
            <MetricCard
                title="Completed Issues"
                value={42}
                subtitle="75% of work done"
                icon="✅"
                color="#36b37e"
                progress={75}
            />
        );

        expect(screen.getByText('Completed Issues')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('75% of work done')).toBeInTheDocument();
    });

    test('BurndownChart renders ideal and actual labels', () => {
        const mockPoints = [
            { Date: '2026-05-01', DisplayLabel: 'Day 0', IdealRemaining: 20, ActualRemaining: 20, CompletedOnThisDay: 0 },
            { Date: '2026-05-02', DisplayLabel: 'Day 1', IdealRemaining: 10, ActualRemaining: 15, CompletedOnThisDay: 5 },
            { Date: '2026-05-03', DisplayLabel: 'Day 2', IdealRemaining: 0, ActualRemaining: 0, CompletedOnThisDay: 15 }
        ];

        render(<BurndownChart dataPoints={mockPoints} totalStoryPoints={20} />);

        expect(screen.getByText('Guideline (Ideal)')).toBeInTheDocument();
        expect(screen.getByText('Actual Remaining')).toBeInTheDocument();
        expect(screen.getByText('Day 0')).toBeInTheDocument();
    });

    test('VelocityBarChart renders sprints and average velocity banner', () => {
        const mockSprints = [
            { sprintId: 1, sprintName: 'Sprint 1', committedStoryPoints: 20, completedStoryPoints: 18, completionPercentage: 90, status: 'Completed' },
            { sprintId: 2, sprintName: 'Sprint 2', committedStoryPoints: 25, completedStoryPoints: 22, completionPercentage: 88, status: 'Completed' }
        ];

        render(<VelocityBarChart sprints={mockSprints} averageVelocity={20} />);

        expect(screen.getByText(/Average Velocity: 20 pts/i)).toBeInTheDocument();
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
        expect(screen.getByText('Sprint 2')).toBeInTheDocument();
    });

    test('BreakdownBarChart renders categories and count badges', () => {
        const items = [
            { name: 'Highest', colorHex: '#ff5630', count: 5, percentage: 50 },
            { name: 'Low', colorHex: '#36b37e', count: 5, percentage: 50 }
        ];

        render(<BreakdownBarChart title="Priority Breakdown" items={items} />);

        expect(screen.getByText('Priority Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Highest')).toBeInTheDocument();
        expect(screen.getByText('Low')).toBeInTheDocument();
    });

    test('DonutChart renders slices and center metric', () => {
        const items = [
            { label: 'Completed', value: 15, color: '#36b37e' },
            { label: 'Remaining', value: 5, color: '#4c9aff' }
        ];

        render(<DonutChart items={items} centerValue="75%" centerLabel="Done" />);

        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('Done')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Remaining')).toBeInTheDocument();
    });
});
