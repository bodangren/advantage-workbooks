import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArticleEditor } from '../ArticleEditor';
import type { ArticleImage } from '@/lib/workbook-schema';

vi.mock('@/components/image-upload', () => ({
  ImageUpload: ({ label, currentUrl }: { label: string; currentUrl: string }) => (
    <div data-testid="image-upload">{label}: {currentUrl || 'none'}</div>
  ),
}));

describe('ArticleEditor', () => {
  const defaultProps = {
    article_url: '',
    article_caption: '',
    article_image_url: '',
    article_images: [] as ArticleImage[],
    article_paragraphs: [] as { number: number; text: string }[],
    projectId: 'test-project',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Article card with all fields', () => {
    render(<ArticleEditor {...defaultProps} />);

    expect(screen.getByText('Article')).toBeInTheDocument();
    expect(screen.getByLabelText(/Article URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Image Caption/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Article Paragraphs/i)).toBeInTheDocument();
  });

  it('renders with pre-filled values', () => {
    render(<ArticleEditor {...defaultProps} article_url="https://example.com" article_caption="Test caption" />);

    expect(screen.getByLabelText(/Article URL/i)).toHaveValue('https://example.com');
    expect(screen.getByLabelText(/Image Caption/i)).toHaveValue('Test caption');
  });

  it('calls onChange when article_url changes', () => {
    render(<ArticleEditor {...defaultProps} />);

    const input = screen.getByLabelText(/Article URL/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('article_url', 'https://example.com');
  });

  it('calls onChange when article_caption changes', () => {
    render(<ArticleEditor {...defaultProps} />);

    const input = screen.getByLabelText(/Image Caption/i);
    fireEvent.change(input, { target: { value: 'New caption' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('article_caption', 'New caption');
  });

  it('calls onChange when article_paragraphs is edited as JSON', () => {
    render(<ArticleEditor {...defaultProps} />);

    const textarea = screen.getByLabelText(/Article Paragraphs/i);
    fireEvent.change(textarea, { target: { value: '[{"number": 1, "text": "Test paragraph"}]' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('article_paragraphs', [{ number: 1, text: 'Test paragraph' }]);
  });

  it('renders article images section with Add Image button', () => {
    render(<ArticleEditor {...defaultProps} />);

    expect(screen.getByText(/Additional Article Images/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Image/i })).toBeInTheDocument();
  });

  it('calls onChange to add a new article image', () => {
    render(<ArticleEditor {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /Add Image/i });
    fireEvent.click(addButton);

    expect(defaultProps.onChange).toHaveBeenCalledWith('article_images', [
      { url: '', caption: '', position: 'inline-para-1' },
    ]);
  });

  it('renders existing article images', () => {
    const existingImages: ArticleImage[] = [
      { url: 'https://example.com/img1.jpg', caption: 'Caption 1', position: 'hero' },
    ];
    render(<ArticleEditor {...defaultProps} article_images={existingImages} />);

    expect(screen.getByDisplayValue('Caption 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hero')).toBeInTheDocument();
  });

  it('calls onChange to remove an article image', () => {
    const existingImages: ArticleImage[] = [
      { url: 'https://example.com/img1.jpg', caption: 'Caption 1', position: 'hero' },
    ];
    render(<ArticleEditor {...defaultProps} article_images={existingImages} />);

    const deleteButton = screen.getByRole('button', { name: '' });
    fireEvent.click(deleteButton);

    expect(defaultProps.onChange).toHaveBeenCalledWith('article_images', []);
  });
});