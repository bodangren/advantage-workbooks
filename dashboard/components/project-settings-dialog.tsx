'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

interface ProjectMetadata {
  seriesName: string;
  levelNumber: string;
  cefrLevel: string;
}

interface ProjectSettingsDialogProps {
  projectId: string;
}

// Exact mapping from v1
const LEVEL_OPTIONS = [
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

export function ProjectSettingsDialog({ projectId }: ProjectSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('3.1');

  useEffect(() => {
    if (open) {
      loadMetadata();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/metadata`);
      if (response.ok) {
        const data = await response.json();
        // Find the matching level option
        const option = LEVEL_OPTIONS.find(
          opt => opt.value === data.levelNumber
        );
        if (option) {
          setSelectedLevel(data.levelNumber);
        }
      }
    } catch (error) {
      console.error('Failed to load metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedOption = LEVEL_OPTIONS.find(opt => opt.value === selectedLevel);
      if (!selectedOption) return;

      const metadata: ProjectMetadata = {
        seriesName: selectedOption.series,
        levelNumber: selectedOption.value,
        cefrLevel: selectedOption.cefr,
      };

      const response = await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });

      if (response.ok) {
        setOpen(false);
        window.location.reload();
      } else {
        console.error('Failed to save metadata');
      }
    } catch (error) {
      console.error('Failed to save metadata:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = LEVEL_OPTIONS.find(opt => opt.value === selectedLevel);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings className="mr-2 h-4 w-4" />
        Workbook Settings
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Workbook Settings</DialogTitle>
            <DialogDescription>
              Select the workbook level. The series name and CEFR level are automatically determined.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading settings...
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="level">Workbook Level</Label>
                <Select
                  value={selectedLevel}
                  onValueChange={setSelectedLevel}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOption && (
                <div className="rounded-lg border p-3 space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">Series:</span> {selectedOption.series}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">CEFR Level:</span> {selectedOption.cefr}
                  </div>
                  <div className="text-sm font-medium text-primary mt-2">
                    Header will show: Reading Advantage • {selectedOption.series} {selectedOption.value} • {selectedOption.cefr}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
