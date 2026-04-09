import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonFromSourceModal } from '@/components/lesson-from-source-modal';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

global.fetch = vi.fn();

describe('LessonFromSourceModal Component', () => {
  const mockOnSuccess = vi.fn();
  const projectId = 'test-project';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<LessonFromSourceModal projectId={projectId} onSuccess={mockOnSuccess} />);
    
    const button = screen.getByRole('button', { name: /new lesson from source/i });
    fireEvent.click(button);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows CEFR level selector in modal', () => {
    render(<LessonFromSourceModal projectId={projectId} onSuccess={mockOnSuccess} />);
    
    const button = screen.getByRole('button', { name: /new lesson from source/i });
    fireEvent.click(button);
    
    const cefrSelect = screen.getByLabelText(/cefr level/i);
    expect(cefrSelect).toBeInTheDocument();
  });

  it('disables Generate Lesson button when both inputs are empty', () => {
    render(<LessonFromSourceModal projectId={projectId} onSuccess={mockOnSuccess} />);
    
    const button = screen.getByRole('button', { name: /new lesson from source/i });
    fireEvent.click(button);
    
    const generateButton = screen.getByRole('button', { name: /generate lesson/i });
    expect(generateButton).toBeDisabled();
  });

  it('shows error when source is too short', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Source text too short' }),
    });

    render(<LessonFromSourceModal projectId={projectId} onSuccess={mockOnSuccess} />);
    
    const openButton = screen.getByRole('button', { name: /new lesson from source/i });
    fireEvent.click(openButton);
    
    const textarea = screen.getByPlaceholderText(/paste your article text/i);
    fireEvent.change(textarea, { target: { value: 'Short text' } });
    
    const generateButton = screen.getByRole('button', { name: /generate lesson/i });
    expect(generateButton).toBeDisabled();
  });

  it('toggles between text and URL input modes', () => {
    render(<LessonFromSourceModal projectId={projectId} onSuccess={mockOnSuccess} />);
    
    const button = screen.getByRole('button', { name: /new lesson from source/i });
    fireEvent.click(button);
    
    expect(screen.getByPlaceholderText(/paste your article text/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/https:\/\/example\.com/i)).not.toBeInTheDocument();
    
    const urlTab = screen.getByRole('button', { name: /url/i });
    fireEvent.click(urlTab);
    
    expect(screen.getByPlaceholderText(/https:\/\/example\.com/i)).toBeInTheDocument();
    
    const textTab = screen.getByRole('button', { name: /paste text/i });
    fireEvent.click(textTab);
    
    expect(screen.getByPlaceholderText(/paste your article text/i)).toBeInTheDocument();
  });

  it('accepts URL input in URL mode', () => {
    render(<LessonFromSourceModal projectId={projectId} onSuccess={mockOnSuccess} />);
    
    const button = screen.getByRole('button', { name: /new lesson from source/i });
    fireEvent.click(button);
    
    const urlTab = screen.getByRole('button', { name: /url/i });
    fireEvent.click(urlTab);
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/example\.com/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/article' } });
    
    expect(urlInput).toHaveValue('https://example.com/article');
  });

  it('closes modal when cancel button is clicked', () => {
    render(<LessonFromSourceModal projectId={projectId} onSuccess={mockOnSuccess} />);
    
    const openButton = screen.getByRole('button', { name: /new lesson from source/i });
    fireEvent.click(openButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});