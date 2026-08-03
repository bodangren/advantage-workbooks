import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonPreviewModal } from '../LessonPreviewModal';

vi.mock('@/components/lesson-preview', () => ({
  default: ({ htmlContent, className }: { htmlContent: string; className?: string }) => (
    <div data-testid="lesson-preview" data-class={className}>
      {htmlContent}
    </div>
  ),
}));

describe('LessonPreviewModal', () => {
  it('renders the Lesson Preview heading and the preview html', () => {
    render(<LessonPreviewModal previewHtml="<p>hello</p>" onClose={() => {}} />);

    expect(screen.getByText('Lesson Preview')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-preview')).toHaveTextContent('<p>hello</p>');
  });

  it('passes the full-height class to the preview', () => {
    render(<LessonPreviewModal previewHtml="x" onClose={() => {}} />);

    expect(screen.getByTestId('lesson-preview')).toHaveAttribute('data-class', 'h-full');
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<LessonPreviewModal previewHtml="x" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '×' }));

    expect(onClose).toHaveBeenCalled();
  });
});
