'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FolderOpen } from 'lucide-react';
import { saveSelectedGroups, getSelectedGroups } from '@/lib/start-analysis';

export function UseCaseSelector({ onSelectionChange }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load use case groups
  useEffect(() => {
    async function loadGroups() {
      try {
        const response = await fetch('/api/use-case-groups');
        if (response.ok) {
          const data = await response.json();
          setGroups(data.groups || []);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();

    // Load previously selected groups
    const saved = getSelectedGroups();
    if (saved.length > 0) {
      setSelectedGroups(saved);
      onSelectionChange?.(saved);
    }
  }, []);

  const toggleGroup = (groupId) => {
    setSelectedGroups((prev) => {
      const newSelection = prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId];
      
      // Save to localStorage
      saveSelectedGroups(newSelection);
      
      // Notify parent
      onSelectionChange?.(newSelection);
      
      return newSelection;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Use Case Groups</CardTitle>
          <CardDescription>
            No use case groups found. Create groups in the Knowledge Base section.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Use Cases to Analyze</CardTitle>
        <CardDescription>
          Choose which security use cases to include in the analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4">
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/20 transition-all duration-150 cursor-pointer select-none"
                onClick={() => toggleGroup(group.id)}
              >
                <Checkbox
                  checked={selectedGroups.includes(group.id)}
                  onCheckedChange={() => toggleGroup(group.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{group.name}</span>
                    {group._count?.useCases > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {group._count.useCases} use cases
                      </Badge>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {selectedGroups.length > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium">
              {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
