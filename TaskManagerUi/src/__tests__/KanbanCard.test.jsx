import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import KanbanCard from '../components/KanbanCard';

describe('KanbanCard Component Tests', () => {
    const mockCard = {
        taskId: 101,
        userId: 10,
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

    beforeEach(() => {
        localStorage.clear();
    });

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

    test('should restrict dragging and show locked indicator when user is not owner and not admin', () => {
        // User with ID 99 (not owner of card with userId 10)
        const fakePayload = btoa(JSON.stringify({
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "User",
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "99"
        }));
        localStorage.setItem('token', `fake.${fakePayload}.sig`);

        const handlePermissionDenied = vi.fn();
        const { container } = render(
            <KanbanCard
                card={mockCard}
                index={0}
                onCardClick={vi.fn()}
                onPermissionDenied={handlePermissionDenied}
            />
        );

        // Lock indicator should be displayed
        expect(screen.getByText('🔒 Locked')).toBeInTheDocument();

        // Card should not be draggable
        const cardElement = container.querySelector('.jira-card');
        expect(cardElement.getAttribute('draggable')).toBe('false');

        // Drag start should trigger permission denied
        fireEvent.dragStart(cardElement, {
            dataTransfer: { setData: vi.fn(), effectAllowed: '' }
        });
        expect(handlePermissionDenied).toHaveBeenCalled();
    });

    test('should allow dragging when user is the owner of the card', () => {
        // User with ID 10 (owner of card with userId 10)
        const fakePayload = btoa(JSON.stringify({
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "User",
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "10"
        }));
        localStorage.setItem('token', `fake.${fakePayload}.sig`);

        const { container } = render(
            <KanbanCard
                card={mockCard}
                index={0}
                onCardClick={vi.fn()}
            />
        );

        expect(screen.queryByText('🔒 Locked')).toBeNull();
        const cardElement = container.querySelector('.jira-card');
        expect(cardElement.getAttribute('draggable')).toBe('true');
    });

    test('should allow dragging any card when user is Admin', () => {
        // Admin user with ID 99
        const fakePayload = btoa(JSON.stringify({
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin",
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "99"
        }));
        localStorage.setItem('token', `fake.${fakePayload}.sig`);

        const { container } = render(
            <KanbanCard
                card={mockCard}
                index={0}
                onCardClick={vi.fn()}
            />
        );

        expect(screen.queryByText('🔒 Locked')).toBeNull();
        const cardElement = container.querySelector('.jira-card');
        expect(cardElement.getAttribute('draggable')).toBe('true');
    });
});
