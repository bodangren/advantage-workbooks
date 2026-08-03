import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LessonStatusBanners } from '../LessonStatusBanners';

const baseProps = {
  formError: undefined,
  saveSuccess: false,
  augmentSuccess: false,
  imageGenSuccess: false,
  sourceGeneratedSuccess: false,
};

describe('LessonStatusBanners', () => {
  it('renders nothing when no messages are active', () => {
    render(<LessonStatusBanners {...baseProps} />);

    expect(screen.queryByText('Lesson saved successfully!')).not.toBeInTheDocument();
    expect(screen.queryByText(/Pedagogical content auto-filled/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Visual break image generated/)).not.toBeInTheDocument();
    expect(screen.queryByText('Lesson generated successfully.')).not.toBeInTheDocument();
  });

  it('renders the form error banner', () => {
    render(<LessonStatusBanners {...baseProps} formError="Failed to save lesson" />);

    expect(screen.getByText('Failed to save lesson')).toBeInTheDocument();
  });

  it('renders the save success banner', () => {
    render(<LessonStatusBanners {...baseProps} saveSuccess />);

    expect(screen.getByText('Lesson saved successfully!')).toBeInTheDocument();
  });

  it('renders the augment success banner', () => {
    render(<LessonStatusBanners {...baseProps} augmentSuccess />);

    expect(
      screen.getByText('✨ Pedagogical content auto-filled! Review the generated fields and save when ready.')
    ).toBeInTheDocument();
  });

  it('renders the image generation success banner', () => {
    render(<LessonStatusBanners {...baseProps} imageGenSuccess />);

    expect(
      screen.getByText('🎨 Visual break image generated successfully! Check the Writing Prompt section.')
    ).toBeInTheDocument();
  });

  it('renders the source generated banner with a status role', () => {
    render(<LessonStatusBanners {...baseProps} sourceGeneratedSuccess />);

    expect(screen.getByRole('status')).toHaveTextContent('Lesson generated successfully.');
  });

  it('renders multiple banners when several messages are active', () => {
    render(<LessonStatusBanners {...baseProps} formError="Oops" saveSuccess />);

    expect(screen.getByText('Oops')).toBeInTheDocument();
    expect(screen.getByText('Lesson saved successfully!')).toBeInTheDocument();
  });
});
