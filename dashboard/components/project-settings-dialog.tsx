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

const SERIES_OPTIONS = [
  { value: 'Origins', label: 'Origins (A1)' },
  { value: 'Quest', label: 'Quest (A2)' },
  { value: 'Adventure', label: 'Adventure (B1)' },
  { value: 'Hero', label: 'Hero (B2)' },
  { value: 'Legend', label: 'Legend (C1)' },
];

const LEVEL_OPTIONS = [
  '3.1', '3.2', '3.3',
  '4.1', '4.2', '4.3',
  '5.1', '5.2', '5.3',
  '6.1', '6.2', '6.3',
  '7.1', '7.2', '7.3',
  '8.1', '8.2', '8.3',
  '9.1', '9.2', '9.3',
  '10.1', '10.2', '10.3',
  '11.1', '11.2', '11.3',
  '12.1', '12.2', '12.3',
  '13.1', '13.2', '13.3',
  '14.1', '14.2', '14.3',
  '15.1', '15.2', '15.3',
];

const CEFR_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export function ProjectSettingsDialog({ projectId }: ProjectSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<ProjectMetadata>({
    seriesName: 'Origins',
    levelNumber: '3.1',
    cefrLevel: 'A1',
  });

  useEffect(() => {
    if (open) {
      loadMetadata();
    }
  }, [open]);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/metadata`);
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
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
      const response = await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });

      if (response.ok) {
        setOpen(false);
        // Optionally trigger a refresh of the parent component
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
              Configure the series name, level, and CEFR level for this workbook.
              This will appear in the lesson headers.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading settings...
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="seriesName">Series Name</Label>
                <Select
                  value={metadata.seriesName}
                  onValueChange={(value) =>
                    setMetadata({ ...metadata, seriesName: value })
                  }
                >
                  <SelectTrigger id="seriesName">
                    <SelectValue placeholder="Select series" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERIES_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="levelNumber">Level Number</Label>
                <Select
                  value={metadata.levelNumber}
                  onValueChange={(value) =>
                    setMetadata({ ...metadata, levelNumber: value })
                  }
                >
                  <SelectTrigger id="levelNumber">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cefrLevel">CEFR Level</Label>
                <Select
                  value={metadata.cefrLevel}
                  onValueChange={(value) =>
                    setMetadata({ ...metadata, cefrLevel: value })
                  }
                >
                  <SelectTrigger id="cefrLevel">
                    <SelectValue placeholder="Select CEFR level" />
                  </SelectTrigger>
                  <SelectContent>
                    {CEFR_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                <strong>Preview:</strong> Reading Advantage • {metadata.seriesName}{' '}
                {metadata.levelNumber} • {metadata.cefrLevel}
              </div>
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
