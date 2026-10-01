import type { PlatformTab } from '../types';

export interface RegisteredExportContext {
  previewKey: PlatformTab;
  data: unknown;
  fontCss: string;
}

const contexts = new WeakMap<HTMLElement, RegisteredExportContext>();

export function registerExportContext(
  element: HTMLElement,
  context: RegisteredExportContext
): void {
  contexts.set(element, context);
  element.dataset.auPreviewKey = context.previewKey;
  element.dataset.auCanonicalExportSource = 'true';
}

export function getRegisteredExportContext(
  element: HTMLElement
): RegisteredExportContext | null {
  if (
    element.dataset.floatingPreviewClone === 'true'
    || element.closest('[data-floating-preview-mirror="true"]')
  ) {
    return null;
  }
  return contexts.get(element) || null;
}

export function findRegisteredExportElement(root: ParentNode = document): HTMLElement | null {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>('[data-au-canonical-export-source="true"]')
  );

  return candidates.find((element) => getRegisteredExportContext(element)) || null;
}
