import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter, Save, Download } from 'lucide-react';

interface TagFilterProps {
  tagCounts: Record<string, number>;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  filterLogic: 'AND' | 'OR';
  setFilterLogic: (logic: 'AND' | 'OR') => void;
}

export function TagFilter({ 
  tagCounts, 
  selectedTags, 
  onTagToggle, 
  onClearFilters,
  filterLogic,
  setFilterLogic
}: TagFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort tags by usage count (descending)
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1]);
  
  // Calculate max count for relative bar sizing
  const maxCount = Math.max(...Object.values(tagCounts), 1);
  
  // Filter tags based on search term
  const filteredTags = sortedTags.filter(([tag]) => 
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Card className="sticky top-4 h-[calc(100vh-6rem)] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Filter by Tags</span>
          <Badge variant="outline" className="font-normal">
            {Object.keys(tagCounts).length} tags
          </Badge>
        </CardTitle>
        <CardDescription>
          Select tags to filter your tickets
        </CardDescription>
      </CardHeader>
      
      <div className="px-4 pb-2">
        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 py-2 h-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {selectedTags.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Active Filters</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={onClearFilters}
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => onTagToggle(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {selectedTags.length > 1 && (
          <div className="flex items-center justify-between mb-4 border-y py-2">
            <span className="text-sm font-medium">Filter Logic:</span>
            <div className="flex gap-2">
              <Button
                variant={filterLogic === 'AND' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilterLogic('AND')}
              >
                Match ALL
              </Button>
              <Button
                variant={filterLogic === 'OR' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilterLogic('OR')}
              >
                Match ANY
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="flex-grow overflow-auto pb-6">
        <div className="space-y-1">
          {filteredTags.map(([tag, count]) => (
            <div 
              key={tag}
              className={`flex items-center py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer transition-colors ${
                selectedTags.includes(tag) ? 'bg-muted/80' : ''
              }`}
              onClick={() => onTagToggle(tag)}
            >
              <Checkbox 
                id={`tag-${tag}`}
                checked={selectedTags.includes(tag)}
                className="mr-2"
                onCheckedChange={() => onTagToggle(tag)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-0.5">
                  <label 
                    htmlFor={`tag-${tag}`}
                    className="text-sm font-medium cursor-pointer truncate"
                  >
                    {tag}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {count}
                  </span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/30"
                    style={{ width: `${Math.max(5, (count / maxCount) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredTags.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {searchTerm ? 'No tags match your search' : 'No tags available'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 