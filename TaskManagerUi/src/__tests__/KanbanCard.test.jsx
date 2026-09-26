import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import KanbanCard from '../components/KanbanCard';

describe('KanbanCard Component Tests', () => {
    const mockCard = {
        taskId: 101,
        issueKey: 'TASK-101',
        title: 'Implement OAuth Flow',
        issueTypeName: 'Story',
        priorityName: 'High',
        priorityColor: '#FF7452',
        storyPoints: 5,
        dueDate: '2026-12-31T00:00:00Z',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        componentName: 'Authentication',
        labels: ['Security', 'Backend']
    };

    test('should render issue key, title, story points, and labels', () => {
        const handleClick = vi.fn();
        render(<KanbanCard card={mockCard} index={0} onCardClick={handleClick} />);

        expect(screen.getByText('TASK-101')).toBeInTheDocument();
        expect(screen.getByText('Implement OAuth Flow')).toBeInTheDocument();
        expect(screen.getByText('5 pts')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Backend')).toBeInTheDocument();
        expect(screen.getByText('📦 Authentication')).toBeInTheDocument();
    });

    test('should invoke onCardClick when clicked', () => {
        const handleClick = vi.fn();
        render(<KanbanCard card={mockCard} index={0} onCardClick={handleClick} />);

        fireEvent.click(screen.getByText('Implement OAuth Flow'));
        expect(handleClick).toHaveBeenCalledWith(101);
    });
});
