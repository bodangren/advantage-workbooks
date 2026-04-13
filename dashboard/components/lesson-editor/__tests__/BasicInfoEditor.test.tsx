import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BasicInfoEditor } from '../BasicInfoEditor';

describe('BasicInfoEditor', () => {
  it('renders Basic Information card with all input fields', () => {
    const onChange = () => {};
    render(
      <BasicInfoEditor
        lesson_number="1"
        lesson_title="Test Title"
        level_name="Level 1"
        cefr_level="A1"
        genre="Adventure"
        onChange={onChange}
      />
    );

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Lesson Number/i)).toHaveValue('1');
    expect(screen.getByLabelText(/Lesson Title/i)).toHaveValue('Test Title');
    expect(screen.getByLabelText(/Level Name/i)).toHaveValue('Level 1');
    expect(screen.getByLabelText(/CEFR Level/i)).toHaveValue('A1');
    expect(screen.getByLabelText(/Genre/i)).toHaveValue('Adventure');
  });

  it('calls onChange when lesson_number changes', () => {
    const onChange = vi.fn();
    render(
      <BasicInfoEditor
        lesson_number=""
        lesson_title=""
        level_name=""
        cefr_level=""
        genre=""
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/Lesson Number/i);
    fireEvent.change(input, { target: { value: '2' } });

    expect(onChange).toHaveBeenCalledWith('lesson_number', '2');
  });

  it('calls onChange when lesson_title changes', () => {
    const onChange = vi.fn();
    render(
      <BasicInfoEditor
        lesson_number=""
        lesson_title=""
        level_name=""
        cefr_level=""
        genre=""
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/Lesson Title/i);
    fireEvent.change(input, { target: { value: 'New Title' } });

    expect(onChange).toHaveBeenCalledWith('lesson_title', 'New Title');
  });

  it('calls onChange when cefr_level changes', () => {
    const onChange = vi.fn();
    render(
      <BasicInfoEditor
        lesson_number=""
        lesson_title=""
        level_name=""
        cefr_level=""
        genre=""
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/CEFR Level/i);
    fireEvent.change(input, { target: { value: 'B1' } });

    expect(onChange).toHaveBeenCalledWith('cefr_level', 'B1');
  });
});