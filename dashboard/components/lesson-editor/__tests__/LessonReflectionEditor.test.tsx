import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonReflectionEditor } from '../LessonReflectionEditor';

describe('LessonReflectionEditor', () => {
  const defaultProps = {
    reflection_focus: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Lesson Reflection card with textarea', () => {
    render(<LessonReflectionEditor {...defaultProps} />);

    expect(screen.getByText('Lesson Reflection')).toBeInTheDocument();
    expect(screen.getByLabelText(/Reflection Focus/i)).toBeInTheDocument();
  });

  it('renders with pre-filled value', () => {
    render(<LessonReflectionEditor {...defaultProps} reflection_focus="Today I learned that..." />);

    expect(screen.getByLabelText(/Reflection Focus/i)).toHaveValue('Today I learned that...');
  });

  it('calls onChange when reflection_focus changes', () => {
    render(<LessonReflectionEditor {...defaultProps} />);

    const textarea = screen.getByLabelText(/Reflection Focus/i);
    fireEvent.change(textarea, { target: { value: 'What surprised me most?' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('reflection_focus', 'What surprised me most?');
  });

  it('renders placeholder text when value is empty', () => {
    render(<LessonReflectionEditor {...defaultProps} />);

    expect(screen.getByPlaceholderText(/Today I learned:/i)).toBeInTheDocument();
  });
});
