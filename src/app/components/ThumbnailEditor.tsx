import { useState, useRef, useEffect } from 'react';
import { Download, Folder } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ThumbnailPreview, ThumbnailData } from './ThumbnailPreview';
import { ThumbnailControls } from './ThumbnailControls';
import { ProjectList, Project } from './ProjectList';
import { Button } from './ui/button';
import { Card } from './ui/card';

// ── oklch → rgb 変換ユーティリティ ────────────────────────────────────
function oklchToRgb(l: number, c: number, h: number, alpha?: number): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  const lc = l_ ** 3, mc = m_ ** 3, sc = s_ ** 3;
  const r  = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const g  = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bv = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc;
  const gc = (x: number) => {
    const v = Math.max(0, Math.min(1, x));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  };
  const rr = Math.round(gc(r) * 255);
  const gg = Math.round(gc(g) * 255);
  const bb = Math.round(gc(bv) * 255);
  return alpha !== undefined && alpha < 1
    ? `rgba(${rr},${gg},${bb},${alpha})`
    : `rgb(${rr},${gg},${bb})`;
}

function convertOklch(val: string): string {
  return val.replace(
    /oklch\(\s*([\d.]+%?|none)\s+([\d.]+|none)\s+([\d.]+|none)(?:\s*\/\s*([\d.]+%?|none))?\s*\)/gi,
    (_, l, c, h, alpha) => {
      const lNum = l === 'none' ? 0 : (l.endsWith('%') ? parseFloat(l) / 100 : parseFloat(l));
      const cNum = c === 'none' ? 0 : parseFloat(c);
      const hNum = h === 'none' ? 0 : parseFloat(h);
      const aNum = alpha && alpha !== 'none'
        ? (alpha.endsWith('%') ? parseFloat(alpha) / 100 : parseFloat(alpha))
        : undefined;
      return oklchToRgb(lNum, cNum, hNum, aNum);
    }
  );
}

// ── キャプチャ本体 ──────────────────────────────────────────────────
// ① transform:scale の親コンテナの影響を受けないよう画面外に 1200×630 のラッパーを作成
// ② html2canvas の onclone コールバックで cloned document の <style> タグを書き換え、
//    Tailwind v4 が使う oklch() カラー変数をすべて rgb() に変換してから描画させる
async function captureElement(el: HTMLElement) {
  // フォントが完全に読み込まれるまで待機する。
  // 未ロードのままだとクローンドキュメントでフォールバックフォントが使われ、
  // メトリクス差異によってタイトルの上下余白がプレビューとずれる原因になる。
  await document.fonts.ready;

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:fixed;left:-99999px;top:0;width:1200px;height:630px;overflow:hidden;z-index:-1;pointer-events:none;';

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'unset';
  clone.style.width = '1200px';
  clone.style.height = '630px';
  clone.style.position = 'relative';

  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  try {
    return await html2canvas(wrap, {
      width: 1200,
      height: 630,
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: async (clonedDoc) => {
        // html2canvas のクローンドキュメントでは UA スタイルシートの
        // margin-block-start/end が h1 等に再適用され、inline の margin-top:0 を
        // 上書きしてしまう。先頭に !important リセットを注入して打ち消す。
        const uaReset = clonedDoc.createElement('style');
        uaReset.textContent = 'h1,h2,h3,h4,h5,h6{margin-block-start:0!important;margin-block-end:0!important;}';
        clonedDoc.head.prepend(uaReset);

        // メインドキュメントのフォントフェイスをクローンドキュメントにコピーすることで、
        // html2canvas 内部のレンダリング時に正しいフォントメトリクスが使われるようにする。
        for (const fontFace of document.fonts.values()) {
          clonedDoc.fonts.add(fontFace);
        }
        await clonedDoc.fonts.ready;

        // html2canvas が内部で作るクローンドキュメントの <style> タグを直接書き換える。
        // Tailwind v4 は --color-* 変数を oklch() で定義しており、
        // html2canvas の CSS パーサーがこれを解釈できずエラーになる。
        // すべての oklch() を数学変換で rgb() に置換することで回避する。
        clonedDoc.querySelectorAll('style').forEach((styleEl) => {
          const css = styleEl.textContent ?? '';
          if (css.includes('oklch')) {
            styleEl.textContent = convertOklch(css);
          }
        });

        // 本番ビルドでは CSS が <link rel="stylesheet"> 外部ファイルになるため、
        // <style> タグへの変換だけでは oklch が処理されず html2canvas がエラーになる。
        // 外部 CSS をフェッチして同一オリジンのものはインライン <style> に差し替える。
        const linkEls = Array.from(
          clonedDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
        );
        await Promise.all(
          linkEls.map(async (linkEl) => {
            const href = linkEl.href;
            if (!href) return;
            try {
              const res = await fetch(href);
              const css = await res.text();
              const styleEl = clonedDoc.createElement('style');
              styleEl.textContent = css.includes('oklch') ? convertOklch(css) : css;
              linkEl.parentNode?.replaceChild(styleEl, linkEl);
            } catch {
              // 外部オリジン（Google Fonts 等）は CORS でブロックされる場合があるため無視
            }
          })
        );
      },
    });
  } finally {
    document.body.removeChild(wrap);
  }
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
      const canvas = await captureElement(previewRef.current);
      const link = document.createElement('a');
      link.download = `${selectedProject.name}-thumbnail-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
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
          const canvas = await captureElement(previewRef.current);
          const link = document.createElement('a');
          link.download = `${project.name}-thumbnail.png`;
          link.href = canvas.toDataURL('image/png');
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
