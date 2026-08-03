import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WritingPromptEditor } from '../WritingPromptEditor';

vi.mock('@/components/image-upload', () => ({
  ImageUpload: ({ currentUrl, onUploadSuccess }: { currentUrl?: string; onUploadSuccess: (url: string) => void }) => (
    <div>
      <span data-testid="image-upload-url">{currentUrl || 'none'}</span>
      <button type="button" onClick={() => onUploadSuccess('https://example.com/new.jpg')}>
        upload
      </button>
    </div>
  ),
}));

describe('WritingPromptEditor', () => {
  const defaultProps = {
    writing_prompt: '',
    writing_plan_prompts: [] as string[],
    writing_sentence_frames: [] as string[],
    projectId: 'test-project',
    imagePrompt: '',
    generatingImage: false,
    augmenting: false,
    currentVisualBreakImageUrl: '',
    onChange: vi.fn(),
    onImagePromptChange: vi.fn(),
    onGenerateImagePrompt: vi.fn(),
    onGenerateImage: vi.fn(),
    onVisualBreakImageUpload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Writing Prompt card with all fields', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    expect(screen.getAllByText('Writing Prompt').length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Writing Prompt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Writing Plan Prompts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Writing Sentence Frames/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/AI Image Prompt/i)).toBeInTheDocument();
  });

  it('renders with pre-filled values', () => {
    render(
      <WritingPromptEditor
        {...defaultProps}
        writing_prompt="Write about your discovery"
        writing_plan_prompts={['Main idea:', 'Details:']}
        writing_sentence_frames={['First, I will...']}
      />
    );

    expect(screen.getByLabelText(/Writing Prompt/i)).toHaveValue('Write about your discovery');
    expect(screen.getByLabelText(/Writing Plan Prompts/i)).toHaveValue(JSON.stringify(['Main idea:', 'Details:']));
    expect(screen.getByLabelText(/Writing Sentence Frames/i)).toHaveValue(JSON.stringify(['First, I will...']));
  });

  it('calls onChange when writing_prompt changes', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    const textarea = screen.getByLabelText(/Writing Prompt/i);
    fireEvent.change(textarea, { target: { value: 'New writing prompt' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('writing_prompt', 'New writing prompt');
  });

  it('calls onChange with parsed JSON when writing_plan_prompts changes', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    const prompts = ['Main idea:', 'Key details:'];
    const textarea = screen.getByLabelText(/Writing Plan Prompts/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(prompts) } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('writing_plan_prompts', prompts);
  });

  it('calls onChange with parsed JSON when writing_sentence_frames changes', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    const frames = ['First, I will...'];
    const textarea = screen.getByLabelText(/Writing Sentence Frames/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(frames) } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('writing_sentence_frames', frames);
  });

  it('handles invalid JSON gracefully', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    const textarea = screen.getByLabelText(/Writing Plan Prompts/i);
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('calls onGenerateImagePrompt when Generate Prompt is clicked', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Generate Prompt/i });
    fireEvent.click(button);

    expect(defaultProps.onGenerateImagePrompt).toHaveBeenCalled();
  });

  it('calls onGenerateImage when Create Image is clicked', () => {
    render(<WritingPromptEditor {...defaultProps} imagePrompt="A classroom scene" />);

    const button = screen.getByRole('button', { name: /Create Image/i });
    fireEvent.click(button);

    expect(defaultProps.onGenerateImage).toHaveBeenCalled();
  });

  it('disables Create Image when image prompt is empty', () => {
    render(<WritingPromptEditor {...defaultProps} imagePrompt="" />);

    const button = screen.getByRole('button', { name: /Create Image/i });
    expect(button).toBeDisabled();
  });

  it('shows generating state while image is being generated', () => {
    render(<WritingPromptEditor {...defaultProps} imagePrompt="x" generatingImage />);

    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create Image/i })).not.toBeInTheDocument();
  });

  it('calls onImagePromptChange when image prompt is edited', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    const textarea = screen.getByLabelText(/AI Image Prompt/i);
    fireEvent.change(textarea, { target: { value: 'Edited prompt' } });

    expect(defaultProps.onImagePromptChange).toHaveBeenCalledWith('Edited prompt');
  });

  it('renders the current visual break image URL', () => {
    render(<WritingPromptEditor {...defaultProps} currentVisualBreakImageUrl="https://example.com/break.jpg" />);

    expect(screen.getByTestId('image-upload-url')).toHaveTextContent('https://example.com/break.jpg');
  });

  it('forwards visual break image uploads to the callback', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(defaultProps.onVisualBreakImageUpload).toHaveBeenCalledWith('https://example.com/new.jpg');
  });

  it('renders placeholder text when values are empty', () => {
    render(<WritingPromptEditor {...defaultProps} />);

    expect(screen.getByPlaceholderText(/Writing prompt for students/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Main idea \/ discovery/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/"First, I will\.\.\."/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Click 'Generate Prompt'/i)).toBeInTheDocument();
  });
});
