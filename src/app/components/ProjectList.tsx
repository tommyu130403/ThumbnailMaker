import { Plus, Trash2, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useState } from 'react';

export interface Project {
  id: string;
  name: string;
  thumbnailData: {
    title: string;
    subtitle: string;
    tag: string;
    template: 'modern';
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    deviceType: 'laptop' | 'mobile' | 'both' | 'none';
    laptopImage?: string;
    mobileImage?: string;
  };
}

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
}

export function ProjectList({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
}: ProjectListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleAdd = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsAdding(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl">作品リスト</h2>
        <Button
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          追加
        </Button>
      </div>

      {isAdding && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
          <Input
            placeholder="作品名を入力"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewProjectName('');
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} className="flex-1">
              作成
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewProjectName('');
              }}
              className="flex-1"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>作品がありません</p>
            <p className="text-sm mt-1">「追加」ボタンから作品を追加してください</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer group ${
                selectedProjectId === project.id
                  ? 'border-[#5B5BD6] bg-[#5B5BD6]/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => onSelectProject(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-12 h-12 rounded flex-shrink-0"
                    style={{
                      background:
                        project.thumbnailData.template === 'gradient'
                          ? `linear-gradient(135deg, ${project.thumbnailData.backgroundColor}, ${project.thumbnailData.accentColor})`
                          : project.thumbnailData.backgroundColor,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {project.thumbnailData.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {selectedProjectId === project.id && (
                    <Edit3 className="w-4 h-4" style={{ color: '#5B5BD6' }} />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}