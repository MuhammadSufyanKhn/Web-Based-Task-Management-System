import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BacklogIssueRow from '../components/BacklogIssueRow';

describe('BacklogIssueRow Component Tests', () => {
    const mockIssue = {
        taskId: 201,
        issueKey: 'TASK-201',
        title: 'Build Jira Backlog UI',
        issueTypeName: 'Story',
        priorityName: 'High',
        statusDisplayName: 'In Progress',
        statusCategory: 'InProgress',
        storyPoints: 8,
        userName: 'Alice Smith',
        epicName: 'Core Platform',
        epicColor: '#ff5630',
        labels: ['Sprint-1']
    };

    test('should render issue key, title, epic badge, and story points', () => {
        const handleClick = vi.fn();
        render(<BacklogIssueRow issue={mockIssue} index={0} onIssueClick={handleClick} />);

        expect(screen.getByText('TASK-201')).toBeInTheDocument();
        expect(screen.getByText('Build Jira Backlog UI')).toBeInTheDocument();
        expect(screen.getByText('⚡ Core Platform')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    test('should invoke onIssueClick when row is clicked', () => {
        const handleClick = vi.fn();
        render(<BacklogIssueRow issue={mockIssue} index={0} onIssueClick={handleClick} />);

        fireEvent.click(screen.getByText('Build Jira Backlog UI'));
        expect(handleClick).toHaveBeenCalledWith(201);
    });
});
