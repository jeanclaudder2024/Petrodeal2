import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Save, 
  X, 
  Type, 
  Shield,
  FileText,
  Check
} from 'lucide-react';
import type { DocumentTemplate } from './types';
import { FONT_OPTIONS, FONT_SIZES } from './types';

interface CMSTemplateEditorProps {
  template: DocumentTemplate;
  onSave: (updates: Partial<DocumentTemplate>) => Promise<boolean>;
  onClose: () => void;
}

export function CMSTemplateEditor({ template, onSave, onClose }: CMSTemplateEditorProps) {
  const [formData, setFormData] = useState({
    title: template.title || template.name || '',
    description: template.description || '',
    font_family: template.font_family || 'Arial',
    font_size: template.font_size || 12,
    requires_broker_membership: template.requires_broker_membership || false,
    is_active: template.is_active,
    supports_pdf: template.supports_pdf || false
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData({
      title: template.title || template.name || '',
      description: template.description || '',
      font_family: template.font_family || 'Arial',
      font_size: template.font_size || 12,
      requires_broker_membership: template.requires_broker_membership || false,
      is_active: template.is_active,
      supports_pdf: template.supports_pdf || false
    });
    setSaved(false);
  }, [template]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onSave({
        title: formData.title,
        description: formData.description,
        font_family: formData.font_family,
        font_size: formData.font_size,
        requires_broker_membership: formData.requires_broker_membership,
        is_active: formData.is_active,
        supports_pdf: formData.supports_pdf
      });
      if (success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with file info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{template.file_name}</h3>
            <p className="text-xs text-muted-foreground">
              {template.placeholders?.length || 0} placeholders detected
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Basic Info Section */}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">Display Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter a display title for this template"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of what this template is for..."
            rows={2}
            className="resize-none"
          />
        </div>
      </div>

      <Separator />

      {/* Font Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Type className="h-4 w-4 text-muted-foreground" />
          Typography Settings
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font Family</Label>
            <Select
              value={formData.font_family}
              onValueChange={(value) => setFormData(prev => ({ ...prev, font_family: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(font => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font Size</Label>
            <Select
              value={formData.font_size.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, font_size: parseInt(value) }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}pt
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Access Options */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Access & Export Options
        </div>

        <div className="space-y-3 bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Active</Label>
              <p className="text-xs text-muted-foreground">Make template available for use</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Broker Members Only</Label>
              <p className="text-xs text-muted-foreground">Restrict to broker membership holders</p>
            </div>
            <Switch
              checked={formData.requires_broker_membership}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_broker_membership: checked }))}
            />
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">PDF Export</Label>
              <p className="text-xs text-muted-foreground">Allow PDF download in addition to DOCX</p>
            </div>
            <Switch
              checked={formData.supports_pdf}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, supports_pdf: checked }))}
            />
          </div>
        </div>
      </div>

      {/* Placeholders Preview */}
      {template.placeholders && template.placeholders.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Detected Placeholders ({template.placeholders.length})
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {template.placeholders.slice(0, 12).map((p, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-mono">
                  {p}
                </Badge>
              ))}
              {template.placeholders.length > 12 && (
                <Badge variant="outline" className="text-xs">
                  +{template.placeholders.length - 12} more
                </Badge>
              )}
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="h-9">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="h-9 min-w-[100px]">
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Saved
            </>
          ) : saving ? (
            'Saving...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
