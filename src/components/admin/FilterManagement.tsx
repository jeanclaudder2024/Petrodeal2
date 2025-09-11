import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Filter, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface FilterOption {
  id: string;
  filter_type: string;
  value: string;
  label: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const FILTER_TYPES = [
  { value: 'oil_type', label: 'Oil Types' },
  { value: 'region', label: 'Regions' },
  { value: 'vessel_status', label: 'Vessel Status' },
  { value: 'port_type', label: 'Port Types' },
  { value: 'refinery_type', label: 'Refinery Types' },
  { value: 'cargo_type', label: 'Cargo Types' }
];

const FilterManagement: React.FC = () => {
  const { user } = useAuth();
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [selectedFilterType, setSelectedFilterType] = useState<string>('oil_type');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFilter, setNewFilter] = useState({
    filter_type: 'oil_type',
    value: '',
    label: '',
    description: '',
    sort_order: 0
  });

  useEffect(() => {
    fetchFilterOptions();
  }, [selectedFilterType]);

  const fetchFilterOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('filter_options')
        .select('*')
        .eq('filter_type', selectedFilterType)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFilterOptions(data || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to fetch filter options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFilter = async () => {
    if (!newFilter.value || !newFilter.label) {
      toast.error('Value and label are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('filter_options')
        .insert({
          ...newFilter,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Filter option added successfully');
      setIsAddDialogOpen(false);
      setNewFilter({
        filter_type: selectedFilterType,
        value: '',
        label: '',
        description: '',
        sort_order: 0
      });
      fetchFilterOptions();
    } catch (error) {
      console.error('Error adding filter option:', error);
      toast.error('Failed to add filter option');
    }
  };

  const handleUpdateFilter = async (id: string, updates: Partial<FilterOption>) => {
    try {
      const { error } = await supabase
        .from('filter_options')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Filter option updated successfully');
      setEditingId(null);
      fetchFilterOptions();
    } catch (error) {
      console.error('Error updating filter option:', error);
      toast.error('Failed to update filter option');
    }
  };

  const handleDeleteFilter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this filter option?')) return;

    try {
      const { error } = await supabase
        .from('filter_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Filter option deleted successfully');
      fetchFilterOptions();
    } catch (error) {
      console.error('Error deleting filter option:', error);
      toast.error('Failed to delete filter option');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await handleUpdateFilter(id, { is_active: isActive });
  };

  const filteredFilterTypes = FILTER_TYPES.filter(type => type.value === selectedFilterType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Management
          </CardTitle>
          <CardDescription>
            Manage dynamic filter options that can be used across vessels, ports, and refineries pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedFilterType} onValueChange={setSelectedFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select filter type" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flame-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter Option
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Filter Option</DialogTitle>
                  <DialogDescription>
                    Create a new filter option for {FILTER_TYPES.find(t => t.value === selectedFilterType)?.label}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="filter-type">Filter Type</Label>
                    <Select value={newFilter.filter_type} onValueChange={(value) => setNewFilter({...newFilter, filter_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="value">Value *</Label>
                    <Input
                      id="value"
                      value={newFilter.value}
                      onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                      placeholder="e.g., crude_oil"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="label">Label *</Label>
                    <Input
                      id="label"
                      value={newFilter.label}
                      onChange={(e) => setNewFilter({...newFilter, label: e.target.value})}
                      placeholder="e.g., Crude Oil"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newFilter.description}
                      onChange={(e) => setNewFilter({...newFilter, description: e.target.value})}
                      placeholder="Description of this filter option..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sort-order">Sort Order</Label>
                    <Input
                      id="sort-order"
                      type="number"
                      value={newFilter.sort_order}
                      onChange={(e) => setNewFilter({...newFilter, sort_order: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddFilter} className="flame-button">
                    Add Filter Option
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Value</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterOptions.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell>
                      {editingId === option.id ? (
                        <Input
                          value={option.value}
                          onChange={(e) => setFilterOptions(prev => 
                            prev.map(item => item.id === option.id ? {...item, value: e.target.value} : item)
                          )}
                          className="h-8"
                        />
                      ) : (
                        <code className="text-sm bg-muted px-2 py-1 rounded">{option.value}</code>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === option.id ? (
                        <Input
                          value={option.label}
                          onChange={(e) => setFilterOptions(prev => 
                            prev.map(item => item.id === option.id ? {...item, label: e.target.value} : item)
                          )}
                          className="h-8"
                        />
                      ) : (
                        option.label
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === option.id ? (
                        <Textarea
                          value={option.description || ''}
                          onChange={(e) => setFilterOptions(prev => 
                            prev.map(item => item.id === option.id ? {...item, description: e.target.value} : item)
                          )}
                          className="h-16 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {option.description || 'No description'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={option.is_active}
                          onCheckedChange={(checked) => handleToggleActive(option.id, checked)}
                        />
                        <Badge variant={option.is_active ? "default" : "secondary"}>
                          {option.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === option.id ? (
                        <Input
                          type="number"
                          value={option.sort_order}
                          onChange={(e) => setFilterOptions(prev => 
                            prev.map(item => item.id === option.id ? {...item, sort_order: parseInt(e.target.value) || 0} : item)
                          )}
                          className="h-8 w-20"
                        />
                      ) : (
                        option.sort_order
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingId === option.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateFilter(option.id, {
                                value: option.value,
                                label: option.label,
                                description: option.description,
                                sort_order: option.sort_order
                              })}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(null);
                                fetchFilterOptions();
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(option.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteFilter(option.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filterOptions.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No filter options found for {FILTER_TYPES.find(t => t.value === selectedFilterType)?.label}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FilterManagement;