'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ProjectType = 'secondary' | 'primary';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultType?: ProjectType;
}

const SECONDARY_LEVELS = [
  { value: '1', series: 'Origins', cefr: 'A1', label: '1 - Origins' },
  { value: '2', series: 'Origins', cefr: 'A1', label: '2 - Origins' },
  { value: '3.1', series: 'Origins', cefr: 'A1', label: '3.1 - Origins' },
  { value: '3.2', series: 'Origins', cefr: 'A1', label: '3.2 - Origins' },
  { value: '4', series: 'Quest', cefr: 'A2', label: '4 - Quest' },
  { value: '5', series: 'Quest', cefr: 'A2', label: '5 - Quest' },
  { value: '6.1', series: 'Quest', cefr: 'A2', label: '6.1 - Quest' },
  { value: '6.2', series: 'Quest', cefr: 'A2', label: '6.2 - Quest' },
  { value: '7.1', series: 'Adventure', cefr: 'B1', label: '7.1 - Adventure' },
  { value: '7.2', series: 'Adventure', cefr: 'B1', label: '7.2 - Adventure' },
  { value: '8.1', series: 'Adventure', cefr: 'B1', label: '8.1 - Adventure' },
  { value: '8.2', series: 'Adventure', cefr: 'B1', label: '8.2 - Adventure' },
  { value: '8.3', series: 'Adventure', cefr: 'B1', label: '8.3 - Adventure' },
  { value: '9.1', series: 'Adventure', cefr: 'B1', label: '9.1 - Adventure' },
  { value: '9.2', series: 'Adventure', cefr: 'B1', label: '9.2 - Adventure' },
  { value: '9.3', series: 'Adventure', cefr: 'B1', label: '9.3 - Adventure' },
  { value: '10.1', series: 'Hero', cefr: 'B2', label: '10.1 - Hero' },
  { value: '10.2', series: 'Hero', cefr: 'B2', label: '10.2 - Hero' },
  { value: '11.1', series: 'Hero', cefr: 'B2', label: '11.1 - Hero' },
  { value: '11.2', series: 'Hero', cefr: 'B2', label: '11.2 - Hero' },
  { value: '11.3', series: 'Hero', cefr: 'B2', label: '11.3 - Hero' },
  { value: '12.1', series: 'Hero', cefr: 'B2', label: '12.1 - Hero' },
  { value: '12.2', series: 'Hero', cefr: 'B2', label: '12.2 - Hero' },
  { value: '12.3', series: 'Hero', cefr: 'B2', label: '12.3 - Hero' },
  { value: '13.1', series: 'Legend', cefr: 'C1', label: '13.1 - Legend' },
  { value: '13.2', series: 'Legend', cefr: 'C1', label: '13.2 - Legend' },
  { value: '14.1', series: 'Legend', cefr: 'C1', label: '14.1 - Legend' },
  { value: '14.2', series: 'Legend', cefr: 'C1', label: '14.2 - Legend' },
  { value: '14.3', series: 'Legend', cefr: 'C1', label: '14.3 - Legend' },
  { value: '15.1', series: 'Legend', cefr: 'C1', label: '15.1 - Legend' },
  { value: '15.2', series: 'Legend', cefr: 'C1', label: '15.2 - Legend' },
  { value: '15.3', series: 'Legend', cefr: 'C1', label: '15.3 - Legend' },
];

const PRIMARY_LEVELS = [
  { value: '1.1', series: 'Phonics', cefr: 'Pre-A1', label: '1.1 - Phonics' },
  { value: '1.2', series: 'Phonics', cefr: 'Pre-A1', label: '1.2 - Phonics' },
  { value: '2.1', series: 'Starters', cefr: 'Pre-A1', label: '2.1 - Starters' },
  { value: '2.2', series: 'Starters', cefr: 'Pre-A1', label: '2.2 - Starters' },
  { value: '3.1', series: 'Movers', cefr: 'A1', label: '3.1 - Movers' },
  { value: '3.2', series: 'Movers', cefr: 'A1', label: '3.2 - Movers' },
  { value: '4.1', series: 'Flyers', cefr: 'A2', label: '4.1 - Flyers' },
  { value: '4.2', series: 'Flyers', cefr: 'A2', label: '4.2 - Flyers' },
];

export function CreateProjectDialog({ open, onOpenChange, onSuccess, defaultType = 'secondary' }: CreateProjectDialogProps) {
  const [type, setType] = useState<ProjectType>(defaultType);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const levelOptions = type === 'secondary' ? SECONDARY_LEVELS : PRIMARY_LEVELS;
  const selectedOption = levelOptions.find(opt => opt.value === selectedLevel);

  const generatedId = useMemo(() => {
    if (!selectedOption) return '';
    const series = selectedOption.series.toLowerCase().replace(/\s+/g, '-');
    const level = selectedOption.value.toLowerCase();
    const cefr = selectedOption.cefr.toLowerCase();
    return `${series}-${level}-${cefr}`;
  }, [selectedOption]);

  const handleTypeChange = (newType: string) => {
    setType(newType as ProjectType);
    setSelectedLevel('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedOption) {
      setError('Please select a workbook level');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          seriesName: selectedOption.series,
          levelNumber: selectedOption.value,
          cefrLevel: selectedOption.cefr,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        setSuccess(`Project "${project.id}" created successfully!`);
        setTimeout(() => {
          setSelectedLevel('');
          setSuccess('');
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      setError('An error occurred while creating the project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Create New Workbook Project</DialogTitle>
          <DialogDescription>
            Select the workbook type and level. The project directory name will be auto-generated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Workbook Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secondary">Secondary (Grades 7-12)</SelectItem>
                <SelectItem value="primary">Primary (Grades 3-6)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Workbook Level</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level..." />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOption && (
            <div className="rounded-lg border p-3 space-y-1.5 bg-muted/50">
              <div className="text-sm">
                <span className="font-medium">Series:</span> {selectedOption.series}
              </div>
              <div className="text-sm">
                <span className="font-medium">CEFR Level:</span> {selectedOption.cefr}
              </div>
              <div className="text-sm font-mono text-xs mt-2 p-1.5 bg-background rounded border">
                {type}/{generatedId}/
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!success || !selectedOption}>
              {loading ? 'Creating...' : success ? 'Created!' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
