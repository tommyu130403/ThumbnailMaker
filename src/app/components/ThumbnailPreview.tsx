import { forwardRef } from 'react';
import { DeviceMockup } from './DeviceMockup';

export interface ThumbnailData {
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
}

interface ThumbnailPreviewProps {
  data: ThumbnailData;
}

// ── 実寸比率の計算 ──────────────────────────────────────────────────
// MacBook Pro 14": 312.6mm、iPhone 15: 71.5mm → 比率 ≈ 4.37:1
// DeviceMockup のラップトップ基準幅 420px に対してスマホ幅を比例計算し、さらに 1.3 倍表示
const LAPTOP_W = 420;
const LAPTOP_H = 285; // 実測: スクリーン枠 269px + ベース 16px

const MOBILE_BASE_W = 240; // DeviceMockup のデフォルト幅
const MOBILE_BASE_H = 492; // 実測: スクリーン 468px + フレームパディング 24px

const REAL_WORLD_RATIO = 312.6 / 71.5;                           // ≈ 4.37
const MOBILE_REAL_W = Math.round(LAPTOP_W / REAL_WORLD_RATIO);   // ≈ 96px（実寸比率）
const MOBILE_TARGET_W = Math.round(MOBILE_REAL_W * 1.3);         // ≈ 125px（×1.3 示）
const MOBILE_SCALE = MOBILE_TARGET_W / MOBILE_BASE_W;            // ≈ 0.521
const MOBILE_TARGET_H = Math.round(MOBILE_BASE_H * MOBILE_SCALE); // ≈ 256px

const OVERLAP_PX = Math.round(MOBILE_TARGET_W * 0.2); // 20% 重ね ≈ 25px
const BOTH_W = LAPTOP_W + MOBILE_TARGET_W - OVERLAP_PX; // ≈ 520px
const BOTH_H = LAPTOP_H;                                 // ≈ 285px
const MOBILE_TOP = BOTH_H - MOBILE_TARGET_H;             // 下揃え ≈ 29px

const FONT = "'Avenir', 'Avenir Next', 'Century Gothic', 'Noto Sans JP', sans-serif";

export const ThumbnailPreview = forwardRef<HTMLDivElement, ThumbnailPreviewProps>(
  ({ data }, ref) => {

    // 「両方」モードのデバイスレイアウト
    const renderBothDevices = () => (
      <div
        className="relative"
        style={{ width: `${BOTH_W}px`, height: `${BOTH_H}px` }}
      >
        <div className="absolute" style={{ left: 0, top: 0 }}>
          <DeviceMockup type="laptop" image={data.laptopImage} />
        </div>
        <div
          className="absolute z-10"
          style={{
            right: 0,
            top: `${MOBILE_TOP}px`,
            width: `${MOBILE_TARGET_W}px`,
            height: `${MOBILE_TARGET_H}px`,
            overflow: 'visible',
          }}
        >
          <div
            style={{
              transform: `scale(${MOBILE_SCALE})`,
              transformOrigin: 'top left',
              width: `${MOBILE_BASE_W}px`,
              height: `${MOBILE_BASE_H}px`,
              pointerEvents: 'none',
            }}
          >
            <DeviceMockup type="mobile" image={data.mobileImage} />
          </div>
        </div>
      </div>
    );

    // デバイスエリア共通コンテナ：固定幅で中央揃え、テキストエリアに被らない
    const renderDeviceArea = () => {
      if (data.deviceType === 'none') return null;
      return (
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{ width: '540px', alignSelf: 'stretch' }}
        >
          {data.deviceType === 'laptop' && (
            <DeviceMockup type="laptop" image={data.laptopImage} />
          )}
          {data.deviceType === 'mobile' && (
            <DeviceMockup type="mobile" image={data.mobileImage} />
          )}
          {data.deviceType === 'both' && renderBothDevices()}
        </div>
      );
    };

    // ── Modern ─────────────────────────────────────────────────────────
    const renderModern = () => (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          backgroundColor: data.backgroundColor,
          fontFamily: FONT,
        }}
      >
        {/* Grid lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${data.textColor}08 1px, transparent 1px), linear-gradient(90deg, ${data.textColor}08 1px, transparent 1px)`,
            backgroundSize: '72px 72px',
          }}
        />

        {/* Glow blobs — filter:blur は html2canvas 非対応のため radial-gradient で代替 */}
        <div
          className="absolute rounded-full"
          style={{
            width: '560px',
            height: '560px',
            top: '-180px',
            right: '-120px',
            background: `radial-gradient(circle, ${data.accentColor}50 0%, ${data.accentColor}18 45%, transparent 70%)`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '320px',
            height: '320px',
            bottom: '-100px',
            left: '-60px',
            background: `radial-gradient(circle, ${data.accentColor}40 0%, ${data.accentColor}10 45%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 flex items-center justify-between h-full p-20 gap-12">
          <div className="flex-1 flex flex-col justify-center">
            {/* Label */}
            <div
              style={{
                color: data.accentColor,
                fontSize: '0.65rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase' as const,
                fontWeight: 500,
                marginBottom: '20px',
              }}
            >
              &#8212; {data.tag ?? 'Design Work'}
            </div>

            <h1
              style={{
                color: data.textColor,
                fontSize: '3rem',
                fontFamily: FONT,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                fontWeight: 600,
                marginTop: 0,
                marginBottom: '20px',
                padding: 0,
                textAlign: 'left' as const,
              }}
            >
              {data.title}
            </h1>

            {/* Accent dash */}
            <div
              style={{
                width: '24px',
                height: '2px',
                backgroundColor: data.accentColor,
                marginBottom: '14px',
              }}
            />

            <p
              style={{
                color: data.textColor,
                opacity: 0.55,
                fontSize: '1rem',
                letterSpacing: '0.025em',
                lineHeight: 1.6,
                fontFamily: FONT,
                fontWeight: 400,
              }}
            >
              {data.subtitle}
            </p>
          </div>
          {renderDeviceArea()}
        </div>
      </div>
    );

    const renderTemplate = () => {
      return renderModern();
    };

    return (
      <div
        ref={ref}
        className="w-[1200px] h-[630px] overflow-hidden"
      >
        {renderTemplate()}
      </div>
    );
  }
);

ThumbnailPreview.displayName = 'ThumbnailPreview';