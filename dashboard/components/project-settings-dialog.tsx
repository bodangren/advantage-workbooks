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
import { ensureMetadataLevelOption, getWorkbookLevelOptions } from '@/lib/constants';

interface ProjectMetadata {
  seriesName: string;
  levelNumber: string;
  cefrLevel: string;
  type?: 'primary' | 'secondary';
}

interface ProjectSettingsDialogProps {
  projectId: string;
}

export function ProjectSettingsDialog({ projectId }: ProjectSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('3.1');
  const [type, setType] = useState<'primary' | 'secondary'>('secondary');
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);

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
        const data = await response.json() as ProjectMetadata;
        const projectType = data.type || 'secondary';
        setMetadata(data);
        setType(projectType);
        setSelectedLevel(data.levelNumber);
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
      const levels = ensureMetadataLevelOption(getWorkbookLevelOptions(type), metadata);
      const selectedOption = levels.find(opt => opt.value === selectedLevel);
      if (!selectedOption) return;

      const updatedMetadata: ProjectMetadata = {
        seriesName: selectedOption.series,
        levelNumber: selectedOption.value,
        cefrLevel: selectedOption.cefr,
        type: type,
      };

      const response = await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMetadata),
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

  const levelOptions = ensureMetadataLevelOption(getWorkbookLevelOptions(type), metadata);
  const selectedOption = levelOptions.find(opt => opt.value === selectedLevel);

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
