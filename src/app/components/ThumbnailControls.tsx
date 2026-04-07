import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ThumbnailData } from './ThumbnailPreview';
import { Upload, X, Plus } from 'lucide-react';
import { useRef, useState } from 'react';

interface ThumbnailControlsProps {
  data: ThumbnailData;
  onDataChange: (data: ThumbnailData) => void;
}

interface ColorPreset {
  bg: string;
  text: string;
  accent: string;
  custom?: boolean;
}

const deviceTypes: Array<{ value: ThumbnailData['deviceType']; label: string }> = [
  { value: 'none', label: 'なし' },
  { value: 'laptop', label: 'ラップトップ' },
  { value: 'mobile', label: 'モバイル' },
  { value: 'both', label: '両方' },
];

const DEFAULT_PRESETS: ColorPreset[] = [
  { bg: '#FAFAF8', text: '#0B0B0B', accent: '#5B5BD6' },
  { bg: '#0B0B0E', text: '#F5F4F0', accent: '#A8FF78' },
  { bg: '#0F0A1E', text: '#F0EBE3', accent: '#E94A8E' },
  { bg: '#1A1A2E', text: '#E0DEFF', accent: '#7C73E6' },
  { bg: '#F0EBE3', text: '#1A1714', accent: '#D4541A' },
  { bg: '#0D1F2D', text: '#F5F5F0', accent: '#00C9B1' },
];

const STORAGE_KEY = 'thumbnail_custom_presets';

function loadCustomPresets(): ColorPreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: ColorPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function ThumbnailControls({ data, onDataChange }: ThumbnailControlsProps) {
  const laptopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const [customPresets, setCustomPresets] = useState<ColorPreset[]>(loadCustomPresets);
  const [hoveredCustomIdx, setHoveredCustomIdx] = useState<number | null>(null);

  const updateData = (updates: Partial<ThumbnailData>) => {
    onDataChange({ ...data, ...updates });
  };

  const handleLaptopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateData({ laptopImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMobileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateData({ mobileImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLaptopImage = () => {
    updateData({ laptopImage: undefined });
    if (laptopFileInputRef.current) laptopFileInputRef.current.value = '';
  };

  const handleRemoveMobileImage = () => {
    updateData({ mobileImage: undefined });
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = '';
  };

  const applyPreset = (preset: ColorPreset) => {
    updateData({
      backgroundColor: preset.bg,
      textColor: preset.text,
      accentColor: preset.accent,
    });
  };

  const addCurrentAsPreset = () => {
    const newPreset: ColorPreset = {
      bg: data.backgroundColor,
      text: data.textColor,
      accent: data.accentColor,
      custom: true,
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
  };

  const deleteCustomPreset = (index: number) => {
    const updated = customPresets.filter((_, i) => i !== index);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setHoveredCustomIdx(null);
  };

  const isCurrentColor = (preset: ColorPreset) =>
    preset.bg === data.backgroundColor &&
    preset.text === data.textColor &&
    preset.accent === data.accentColor;

  return (
    <div className="space-y-6">
      {/* タイトル・サブタイトル */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder="プロジェクトタイトル"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="subtitle">サブタイトル</Label>
          <Input
            id="subtitle"
            value={data.subtitle}
            onChange={(e) => updateData({ subtitle: e.target.value })}
            placeholder="説明文"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="tag">タグ</Label>
          <Input
            id="tag"
            value={data.tag ?? ''}
            onChange={(e) => updateData({ tag: e.target.value })}
            placeholder="Design Work"
            className="mt-1.5"
          />
        </div>
      </div>

      {/* デバイスモックアップ */}
      <div>
        <Label className="mb-3 block">デバイスモックアップ</Label>
        <div className="grid grid-cols-2 gap-2">
          {deviceTypes.map((device) => (
            <Button
              key={device.value}
              variant={data.deviceType === device.value ? 'default' : 'outline'}
              onClick={() => updateData({ deviceType: device.value })}
              className="w-full"
              size="sm"
            >
              {device.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ラップトップ画像 */}
      {(data.deviceType === 'laptop' || data.deviceType === 'both') && (
        <div>
          <Label className="mb-3 block">ラップトップ画像</Label>
          {data.laptopImage ? (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                <img src={data.laptopImage} alt="Laptop preview" className="w-full h-32 object-cover" />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveLaptopImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => laptopFileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                画像を変更
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => laptopFileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              画像をアップロード
            </Button>
          )}
          <input
            ref={laptopFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLaptopImageUpload}
            className="hidden"
          />
        </div>
      )}

      {/* モバイル画像 */}
      {(data.deviceType === 'mobile' || data.deviceType === 'both') && (
        <div>
          <Label className="mb-3 block">モバイル画像</Label>
          {data.mobileImage ? (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                <img src={data.mobileImage} alt="Mobile preview" className="w-full h-32 object-cover" />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveMobileImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => mobileFileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                画像を変更
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => mobileFileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              画像をアップロード
            </Button>
          )}
          <input
            ref={mobileFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleMobileImageUpload}
            className="hidden"
          />
        </div>
      )}

      {/* カラープリセット */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>カラープリセット</Label>
          <button
            onClick={addCurrentAsPreset}
            title="現在のカラーをプリセットに追加"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-dashed border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            現在の色を保存
          </button>
        </div>

        {/* デフォルトプリセット */}
        <div className="grid grid-cols-6 gap-1.5 mb-2">
          {DEFAULT_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              title={`bg: ${preset.bg} / text: ${preset.text} / accent: ${preset.accent}`}
              className="relative h-10 rounded-md transition-all overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${preset.bg} 40%, ${preset.accent} 40%, ${preset.accent} 60%, ${preset.text} 60%)`,
                outline: isCurrentColor(preset) ? `2px solid ${preset.accent}` : '2px solid transparent',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>

        {/* カスタムプリセット */}
        {customPresets.length > 0 && (
          <>
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">カスタム</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {customPresets.map((preset, index) => (
                <div
                  key={index}
                  className="relative h-10 group"
                  onMouseEnter={() => setHoveredCustomIdx(index)}
                  onMouseLeave={() => setHoveredCustomIdx(null)}
                >
                  <button
                    onClick={() => applyPreset(preset)}
                    className="w-full h-full rounded-md transition-all overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, ${preset.bg} 40%, ${preset.accent} 40%, ${preset.accent} 60%, ${preset.text} 60%)`,
                      outline: isCurrentColor(preset) ? `2px solid ${preset.accent}` : '2px solid transparent',
                      outlineOffset: '2px',
                    }}
                  />
                  {hoveredCustomIdx === index && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomPreset(index);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* カスタムカラー */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="bgColor">背景色</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="bgColor"
              type="color"
              value={data.backgroundColor}
              onChange={(e) => updateData({ backgroundColor: e.target.value })}
              className="w-20 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={data.backgroundColor}
              onChange={(e) => updateData({ backgroundColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="textColor">テキスト色</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="textColor"
              type="color"
              value={data.textColor}
              onChange={(e) => updateData({ textColor: e.target.value })}
              className="w-20 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={data.textColor}
              onChange={(e) => updateData({ textColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="accentColor">アクセント色</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="accentColor"
              type="color"
              value={data.accentColor}
              onChange={(e) => updateData({ accentColor: e.target.value })}
              className="w-20 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={data.accentColor}
              onChange={(e) => updateData({ accentColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}