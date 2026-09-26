import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PermissionModal from '../components/PermissionModal';

describe('PermissionModal Component Tests', () => {
    test('does not render when isOpen is false', () => {
        const { container } = render(
            <PermissionModal
                isOpen={false}
                onClose={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    test('renders title, message, and details when open', () => {
        render(
            <PermissionModal
                isOpen={true}
                title="You can't move this task"
                message="This task is assigned to another team member."
                details="Only the task owner or an administrator can move this task."
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText("You can't move this task")).toBeInTheDocument();
        expect(screen.getByText("This task is assigned to another team member.")).toBeInTheDocument();
        expect(screen.getByText("Only the task owner or an administrator can move this task.")).toBeInTheDocument();
        expect(screen.getByText('Got It')).toBeInTheDocument();
    });

    test('invokes onClose when "Got It" button is clicked', () => {
        const handleClose = vi.fn();
        render(
            <PermissionModal
                isOpen={true}
                onClose={handleClose}
            />
        );

        fireEvent.click(screen.getByText('Got It'));
        expect(handleClose).toHaveBeenCalled();
    });

    test('invokes onClose when close "✕" button is clicked', () => {
        const handleClose = vi.fn();
        render(
            <PermissionModal
                isOpen={true}
                onClose={handleClose}
            />
        );

        fireEvent.click(screen.getByText('✕'));
        expect(handleClose).toHaveBeenCalled();
    });
});
