import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VocabularyEditor } from '../VocabularyEditor';

describe('VocabularyEditor', () => {
  const defaultProps = {
    vocabulary: [] as { word: string; phonetic?: string; definition: string; thai_definition?: string }[],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Vocabulary card with textarea', () => {
    render(<VocabularyEditor {...defaultProps} />);

    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    expect(screen.getByLabelText(/Vocabulary Items/i)).toBeInTheDocument();
  });

  it('renders with pre-filled vocabulary', () => {
    const vocab = [
      { word: 'example', definition: 'a thing characteristic of its kind' },
    ];
    render(<VocabularyEditor {...defaultProps} vocabulary={vocab} />);

    expect(screen.getByLabelText(/Vocabulary Items/i)).toHaveValue(JSON.stringify(vocab, null, 2));
  });

  it('calls onChange when vocabulary JSON is edited', () => {
    render(<VocabularyEditor {...defaultProps} />);

    const vocab = [
      { word: 'new-word', definition: 'a new definition' },
    ];
    const textarea = screen.getByLabelText(/Vocabulary Items/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(vocab) } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('vocabulary', vocab);
  });

  it('handles invalid JSON gracefully', () => {
    render(<VocabularyEditor {...defaultProps} />);

    const textarea = screen.getByLabelText(/Vocabulary Items/i);
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('renders vocabulary count hint', () => {
    const vocab = [
      { word: 'word1', definition: 'def1' },
      { word: 'word2', definition: 'def2' },
    ];
    render(<VocabularyEditor {...defaultProps} vocabulary={vocab} />);

    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
  });
});