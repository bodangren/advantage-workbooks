import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComprehensionQuestionsEditor } from '../ComprehensionQuestionsEditor';

describe('ComprehensionQuestionsEditor', () => {
  const defaultProps = {
    comprehension_questions: [] as { number: number; question: string; options: string[] }[],
    short_answer_question: '',
    short_answer_hint: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Comprehension Questions card with all fields', () => {
    render(<ComprehensionQuestionsEditor {...defaultProps} />);

    expect(screen.getByText('Comprehension Questions')).toBeInTheDocument();
    expect(screen.getByLabelText(/Questions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Short Answer Question/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Short Answer Hint/i)).toBeInTheDocument();
  });

  it('renders with pre-filled values', () => {
    const questions = [
      { number: 1, question: 'What is the capital of France?', options: ['Paris', 'London', 'Rome'] },
    ];
    render(
      <ComprehensionQuestionsEditor
        {...defaultProps}
        comprehension_questions={questions}
        short_answer_question="Why did you choose that answer?"
        short_answer_hint="Use evidence from the text"
      />
    );

    expect(screen.getByLabelText(/Questions/i)).toHaveValue(JSON.stringify(questions));
    expect(screen.getByLabelText(/Short Answer Question/i)).toHaveValue('Why did you choose that answer?');
    expect(screen.getByLabelText(/Short Answer Hint/i)).toHaveValue('Use evidence from the text');
  });

  it('calls onChange with parsed JSON when comprehension_questions changes', () => {
    render(<ComprehensionQuestionsEditor {...defaultProps} />);

    const questions = [
      { number: 1, question: 'New question?', options: ['A', 'B'] },
    ];
    const textarea = screen.getByLabelText(/Questions/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(questions) } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('comprehension_questions', questions);
  });

  it('handles invalid JSON gracefully', () => {
    render(<ComprehensionQuestionsEditor {...defaultProps} />);

    const textarea = screen.getByLabelText(/Questions/i);
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('calls onChange when short_answer_question changes', () => {
    render(<ComprehensionQuestionsEditor {...defaultProps} />);

    const textarea = screen.getByLabelText(/Short Answer Question/i);
    fireEvent.change(textarea, { target: { value: 'New short answer question' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('short_answer_question', 'New short answer question');
  });

  it('calls onChange when short_answer_hint changes', () => {
    render(<ComprehensionQuestionsEditor {...defaultProps} />);

    const input = screen.getByLabelText(/Short Answer Hint/i);
    fireEvent.change(input, { target: { value: 'New hint' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('short_answer_hint', 'New hint');
  });

  it('renders placeholder text when values are empty', () => {
    render(<ComprehensionQuestionsEditor {...defaultProps} />);

    expect(screen.getByPlaceholderText(/{"number": 1/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Short answer question prompt/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/at least two complete sentences/i)).toBeInTheDocument();
  });
});
