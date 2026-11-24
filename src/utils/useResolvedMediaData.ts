import React from 'react';
import { resolveLocalImageReference } from './imageManager';

const isRef = (v: unknown): v is string =>
  typeof v === 'string' &&
  (v.startsWith('au-local-media://') || v.startsWith('au-cloud-media://'));

const collectRefs = (v: unknown, out: Set<string>) => {
  if (isRef(v)) out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => collectRefs(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectRefs(x, out));
};

const replaceRefs = (v: any, map: Map<string, string>): any => {
  if (isRef(v)) return map.get(v) ?? '';
  if (Array.isArray(v)) return v.map((x) => replaceRefs(x, map));
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, replaceRefs(x, map)]));
  }
  return v;
};

export function useResolvedMediaData<T>(data: T): T {
  const cache = React.useRef(new Map<string, string>());
  const [version, bump] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const refs = new Set<string>();
    collectRefs(data, refs);
    const missing = [...refs].filter((r) => !cache.current.has(r));
    if (!missing.length) return;

    Promise.all(
      missing.map(async (r) => {
        try {
          cache.current.set(r, (await resolveLocalImageReference(r)) || '');
        } catch {
          cache.current.set(r, '');
        }
      })
    ).then(() => { if (!cancelled) bump((n) => n + 1); });

    return () => { cancelled = true; };
  }, [data]);

  return React.useMemo(() => replaceRefs(data, cache.current), [data, version]);
}