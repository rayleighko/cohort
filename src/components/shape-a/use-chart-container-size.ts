'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Measures chart container before mounting Recharts — avoids ResponsiveContainer
 * width/height -1 warnings when parent flex layout has no resolved size yet.
 */
export function useChartContainerSize(fixedHeight = 192) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height) || fixedHeight;
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedHeight]);

  return { ref, size, ready: size !== null && size.width > 0 };
}
