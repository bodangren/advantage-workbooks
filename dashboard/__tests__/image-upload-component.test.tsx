import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUpload } from '@/components/image-upload';
import '@testing-library/jest-dom';

// Mock fetch for upload
global.fetch = vi.fn();

describe('ImageUpload Component', () => {
  const mockOnUploadSuccess = vi.fn();
  const projectId = 'test-project';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload button and label', () => {
    render(<ImageUpload projectId={projectId} onUploadSuccess={mockOnUploadSuccess} label="Test Image" />);
    
    expect(screen.getByText('Test Image')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('displays preview when currentUrl is provided', () => {
    const currentUrl = 'images/test.jpg';
    render(<ImageUpload projectId={projectId} onUploadSuccess={mockOnUploadSuccess} currentUrl={currentUrl} />);
    
    expect(screen.getByText(`Current: ${currentUrl}`)).toBeInTheDocument();
    const img = screen.getByAltText('Preview') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    // In test environment, the src might be absolute or relative depending on setup,
    // so we check if it contains the URL
    expect(img.src).toContain(currentUrl);
  });

  it('displays error for invalid file type', async () => {
    render(<ImageUpload projectId={projectId} onUploadSuccess={mockOnUploadSuccess} />);
    
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Image') as HTMLInputElement; // Default label is 'Image'
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
    });
    expect(mockOnUploadSuccess).not.toHaveBeenCalled();
  });

  it('uploads file successfully and calls onUploadSuccess', async () => {
    // Mock successful fetch response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'images/uploaded.jpg' }),
    });

    render(<ImageUpload projectId={projectId} onUploadSuccess={mockOnUploadSuccess} />);
    
    const file = new File(['dummy image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Image') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnUploadSuccess).toHaveBeenCalledWith('images/uploaded.jpg');
    });
  });

  it('clears image when X button is clicked', () => {
    render(<ImageUpload projectId={projectId} onUploadSuccess={mockOnUploadSuccess} currentUrl="images/existing.jpg" />);
    
    const clearButton = screen.getByRole('button', { name: '' }); // X icon button might not have text
    // We can find it by looking for the X icon or checking button count if unique,
    // but best to rely on current implementation.
    // The component renders 2 buttons when currentUrl is present: Upload and Clear (X).
    // Let's verify we have the clear button.
    
    // Using a more robust selector if possible, or querying by the icon if we mocked lucide-react (we haven't).
    // Let's assume the second button is clear or try to find by SVG if rendered.
    // Since we didn't mock lucide-react, the SVG is rendered.
    
    // Easier approach: The clear button is the one rendered ONLY when currentUrl exists.
    // Let's click the button that is NOT "Upload".
    const buttons = screen.getAllByRole('button');
    const clearBtn = buttons.find(b => !b.textContent?.includes('Upload'));
    
    expect(clearBtn).toBeDefined();
    fireEvent.click(clearBtn!);
    
    expect(mockOnUploadSuccess).toHaveBeenCalledWith('');
  });

  it('shows local preview immediately after file selection (New Requirement)', async () => {
     render(<ImageUpload projectId={projectId} onUploadSuccess={mockOnUploadSuccess} />);
     
     const file = new File(['dummy image content'], 'test.jpg', { type: 'image/jpeg' });
     const input = screen.getByLabelText('Image') as HTMLInputElement;
     
     // Mock URL.createObjectURL
     const mockCreateObjectURL = vi.fn(() => 'blob:test-preview-url');
     global.URL.createObjectURL = mockCreateObjectURL;

     fireEvent.change(input, { target: { files: [file] } });

     // We expect to see the preview BEFORE upload finishes if we implement optimistic preview
     // or at least verifying that the component handles previews correctly.
     // *Self-correction:* The current component DOES NOT implement client-side preview before upload.
     // It only shows preview based on `currentUrl` prop.
     // The "New Requirement" for this phase is "real-time thumbnails".
     // This test acts as the spec for that feature.
     
     await waitFor(() => {
        const img = screen.getByAltText('Preview');
        expect(img).toBeInTheDocument();
        expect((img as HTMLImageElement).src).toContain('blob:test-preview-url');
     });
  });
});
