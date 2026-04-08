import { useState, useRef, useEffect } from 'react';
import { Download, Folder } from 'lucide-react';
import { toPng } from 'html-to-image';
import { ThumbnailPreview, ThumbnailData } from './ThumbnailPreview';
import { ThumbnailControls } from './ThumbnailControls';
import { ProjectList, Project } from './ProjectList';
import { Button } from './ui/button';
import { Card } from './ui/card';

// ── キャプチャ本体 ──────────────────────────────────────────────────
// html-to-image は SVG foreignObject を使いブラウザのネイティブレンダリング
// エンジンで描画する。html2canvas と異なり flexbox / gap / oklch 等の
// モダン CSS を完全にサポートし、プレビューと出力が一致する。
// プレビュー要素は親コンテナで transform:scale(0.6) されているが、
// html-to-image は指定サイズで描画するので元要素をそのまま渡せる。
async function captureElement(el: HTMLElement): Promise<string> {
  await document.fonts.ready;

  return await toPng(el, {
    width: 1200,
    height: 630,
    pixelRatio: 2,
    skipAutoScale: true,
    style: {
      transform: 'none',
      transformOrigin: 'unset',
    },
  });
}

export function ThumbnailEditor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('thumbnailProjects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed);
        if (parsed.length > 0) {
          setSelectedProjectId(parsed[0].id);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('thumbnailProjects', JSON.stringify(projects));
    }
  }, [projects]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleAddProject = (name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      thumbnailData: {
        title: name,
        subtitle: 'Designer Portfolio 2026',
        tag: 'Design Work',
        template: 'modern',
        backgroundColor: '#FAFAF8',
        textColor: '#0B0B0B',
        accentColor: '#5B5BD6',
        deviceType: 'none',
      },
    };
    setProjects([...projects, newProject]);
    setSelectedProjectId(newProject.id);
  };

  const handleDeleteProject = (id: string) => {
    const updatedProjects = projects.filter((p) => p.id !== id);
    setProjects(updatedProjects);
    if (selectedProjectId === id) {
      setSelectedProjectId(updatedProjects.length > 0 ? updatedProjects[0].id : null);
    }
  };

  const handleUpdateThumbnail = (data: ThumbnailData) => {
    if (!selectedProjectId) return;
    setProjects(
      projects.map((p) =>
        p.id === selectedProjectId ? { ...p, thumbnailData: data } : p
      )
    );
  };

  const handleDownload = async () => {
    if (!previewRef.current || !selectedProject) return;

    setIsDownloading(true);
    try {
      const dataUrl = await captureElement(previewRef.current);
      const link = document.createElement('a');
      link.download = `${selectedProject.name}-thumbnail-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    for (const project of projects) {
      setSelectedProjectId(project.id);
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (previewRef.current) {
        try {
          const dataUrl = await captureElement(previewRef.current);
          const link = document.createElement('a');
          link.download = `${project.name}-thumbnail.png`;
          link.href = dataUrl;
          link.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Download failed for ${project.name}:`, error);
        }
      }
    }
    setIsDownloading(false);
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F4F3F0', fontFamily: "'Avenir', 'Avenir Next', 'Century Gothic', 'Noto Sans JP', sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#5B5BD6' }} />
            <h1
              className="text-3xl"
              style={{ letterSpacing: '-0.02em', fontWeight: 600, color: '#0B0B0B' }}
            >
              サムネイルジェネレーター
            </h1>
          </div>
          <p style={{ color: '#717182', fontSize: '0.9rem', letterSpacing: '0.01em', paddingLeft: '16px' }}>
            デザイナーポートフォリオ用のカスタマイズ可能なサムネイルを作成
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Project List Section */}
          <div className="lg:col-span-1">
            <ProjectList
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onAddProject={handleAddProject}
              onDeleteProject={handleDeleteProject}
            />
            {projects.length > 1 && (
              <Button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                variant="outline"
                className="w-full mt-4 gap-2"
              >
                <Folder className="w-4 h-4" />
                すべてダウンロード
              </Button>
            )}
          </div>

          {/* Preview and Controls Section */}
          <div className="lg:col-span-3">
            {selectedProject ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Preview Section */}
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl">{selectedProject.name}</h2>
                      <Button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {isDownloading ? 'ダウンロード中...' : 'ダウンロード'}
                      </Button>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 overflow-auto">
                      <div
                        className="inline-block"
                        style={{ transform: 'scale(0.6)', transformOrigin: 'top left' }}
                      >
                        <ThumbnailPreview
                          ref={previewRef}
                          data={selectedProject.thumbnailData}
                        />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500 text-center">
                      1200 × 630 px (OGP画像推奨サイズ)
                    </div>
                  </Card>
                </div>

                {/* Controls Section */}
                <div className="lg:col-span-1">
                  <Card className="p-6">
                    <h2 className="text-xl mb-6">カスタマイズ</h2>
                    <ThumbnailControls
                      data={selectedProject.thumbnailData}
                      onDataChange={handleUpdateThumbnail}
                    />
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">作品を選択してください</p>
                  <p className="text-sm mt-2">
                    左側の「追加」ボタンから新しい作品を追加できます
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
