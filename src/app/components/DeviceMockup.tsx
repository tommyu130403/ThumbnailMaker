// ニュートラルなシルバー／スペースグレーのフレームカラー
const LAPTOP_BEZEL = '#0d0d0d';   // スクリーン枠（ダークグレー）
const LAPTOP_BASE  = '#1c1c1c';   // ボトムベース（ダークシルバー）
const LAPTOP_HINGE = '#141414';   // ヒンジ部分
const MOBILE_FRAME = '#1a1a1a';   // モバイルフレーム（ダークシルバー）
const MOBILE_NOTCH = '#080808';   // ノッチ（ほぼブラック）

interface DeviceMockupProps {
  type: 'laptop' | 'mobile';
  image?: string;
}

export function DeviceMockup({ type, image }: DeviceMockupProps) {
  if (type === 'laptop') {
    return (
      <div className="relative w-[420px]">
        {/* Laptop Screen Bezel */}
        <div
          className="relative rounded-lg p-2 shadow-2xl"
          style={{ backgroundColor: LAPTOP_BEZEL }}
        >
          <div className="bg-white rounded overflow-hidden aspect-[16/10]">
            {image ? (
              <img
                src={image}
                alt="Laptop mockup"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <span className="text-sm">画像を追加</span>
              </div>
            )}
          </div>
        </div>
        {/* Laptop Base */}
        <div className="relative h-3 mt-1">
          <div
            className="absolute inset-0 rounded-b-lg"
            style={{ backgroundColor: LAPTOP_BASE }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-t"
            style={{ backgroundColor: LAPTOP_HINGE }}
          />
        </div>
      </div>
    );
  }

  // Mobile
  return (
    <div className="relative w-[240px]">
      {/* Mobile Frame */}
      <div
        className="relative rounded-[2.5rem] p-3 shadow-2xl"
        style={{ backgroundColor: MOBILE_FRAME }}
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-2xl z-10"
          style={{ backgroundColor: MOBILE_NOTCH }}
        />

        {/* Screen */}
        <div className="relative bg-white rounded-[2rem] overflow-hidden aspect-[9/19.5]">
          {image ? (
            <img
              src={image}
              alt="Mobile mockup"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              <span className="text-sm">画像を追加</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}