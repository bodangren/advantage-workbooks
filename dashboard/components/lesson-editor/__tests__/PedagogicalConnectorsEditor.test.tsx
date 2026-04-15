import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PedagogicalConnectorsEditor } from '../PedagogicalConnectorsEditor';

describe('PedagogicalConnectorsEditor', () => {
  it('renders Pedagogical Connectors card with all input fields', () => {
    const onChange = () => {};
    render(
      <PedagogicalConnectorsEditor
        connection_question="What discovery have you made?"
        grammar_search_term="simple past"
        discussion_question="What would you do?"
        onChange={onChange}
      />
    );

    expect(screen.getByText('Pedagogical Connectors')).toBeInTheDocument();
    expect(screen.getByLabelText(/Connection Question/i)).toHaveValue('What discovery have you made?');
    expect(screen.getByLabelText(/Grammar Search Term/i)).toHaveValue('simple past');
    expect(screen.getByLabelText(/Discussion Question/i)).toHaveValue('What would you do?');
  });

  it('calls onChange when connection_question changes', () => {
    const onChange = vi.fn();
    render(
      <PedagogicalConnectorsEditor
        connection_question=""
        grammar_search_term=""
        discussion_question=""
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/Connection Question/i);
    fireEvent.change(input, { target: { value: 'New connection question' } });

    expect(onChange).toHaveBeenCalledWith('connection_question', 'New connection question');
  });

  it('calls onChange when grammar_search_term changes', () => {
    const onChange = vi.fn();
    render(
      <PedagogicalConnectorsEditor
        connection_question=""
        grammar_search_term=""
        discussion_question=""
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/Grammar Search Term/i);
    fireEvent.change(input, { target: { value: 'present perfect' } });

    expect(onChange).toHaveBeenCalledWith('grammar_search_term', 'present perfect');
  });

  it('calls onChange when discussion_question changes', () => {
    const onChange = vi.fn();
    render(
      <PedagogicalConnectorsEditor
        connection_question=""
        grammar_search_term=""
        discussion_question=""
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/Discussion Question/i);
    fireEvent.change(input, { target: { value: 'New discussion question' } });

    expect(onChange).toHaveBeenCalledWith('discussion_question', 'New discussion question');
  });

  it('renders placeholder text when values are empty', () => {
    const onChange = () => {};
    render(
      <PedagogicalConnectorsEditor
        connection_question=""
        grammar_search_term=""
        discussion_question=""
        onChange={onChange}
      />
    );

    expect(screen.getByPlaceholderText(/Question connecting article/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., simple past/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Open-ended question/i)).toBeInTheDocument();
  });
});