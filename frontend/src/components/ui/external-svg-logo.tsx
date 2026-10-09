import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ExternalSvgLogoProps {
  src: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorMode?: 'primary' | 'mono' | 'gradient';
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

/**
 * Component để load SVG từ file external và thay đổi màu theo theme
 * Cách sử dụng:
 * 1. Tải SVG về và đặt trong public/assets/
 * 2. Sử dụng: <ExternalSvgLogo src="/assets/logo.svg" colorMode="primary" />
 */
export function ExternalSvgLogo({ 
  src, 
  className, 
  size = 'md', 
  colorMode = 'primary' 
}: ExternalSvgLogoProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(src);
        let svgText = await response.text();

        // Xóa width/height cứng trong file SVG
        svgText = svgText
        .replace(/(width|height)="[^"]*"/g, '')
        .replace('<svg', '<svg width="100%" height="100%"');
        
        // Thay thế fill colors để sử dụng CSS variables
        if (colorMode === 'primary') {
          svgText = svgText.replace(/fill="[^"]*"/g, 'fill="hsl(var(--primary))"');
          svgText = svgText.replace(/stroke="[^"]*"/g, 'stroke="hsl(var(--primary))"');
        } else if (colorMode === 'mono') {
          svgText = svgText.replace(/fill="[^"]*"/g, 'fill="hsl(var(--muted-foreground))"');
          svgText = svgText.replace(/stroke="[^"]*"/g, 'stroke="hsl(var(--muted-foreground))"');
        }
        
        // Thêm class để transition smooth
        svgText = svgText.replace('<svg', '<svg class="transition-colors duration-200"');
        
        setSvgContent(svgText);
      } catch (error) {
        console.error('Failed to load SVG:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSvg();
  }, [src, colorMode]);

  if (loading) {
    return (
      <div className={cn(
        sizeMap[size], 
        "bg-muted animate-pulse rounded",
        className
      )} />
    );
  }

  return (
    <div
      className={cn(sizeMap[size], className)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

/**
 * Hook để tạo CSS mask cho SVG (cách khác)
 * Cho phép sử dụng SVG như background và thay đổi màu qua CSS
 */
export function useSvgMask(src: string) {
  return {
    maskImage: `url(${src})`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: `url(${src})`,
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
  };
}

/**
 * Component sử dụng CSS mask technique
 * Cách này cho phép thay đổi màu đơn giản hơn nhưng chỉ work với single color
 */
interface SvgMaskLogoProps {
  src: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

export function SvgMaskLogo({ 
  src, 
  className, 
  size = 'md',
  color = 'hsl(var(--primary))'
}: SvgMaskLogoProps) {
  const maskStyle = useSvgMask(src);

  return (
    <div
      className={cn(
        sizeMap[size],
        "transition-colors duration-200",
        className
      )}
      style={{
        ...maskStyle,
        backgroundColor: color,
      }}
    />
  );
} 