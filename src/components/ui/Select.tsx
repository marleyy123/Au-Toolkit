import React, { Children, isValidElement, useLayoutEffect, useRef, useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type OptionElement = React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>;

interface Props extends Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, 'id' | 'className' | 'style' | 'disabled' | 'title' | 'aria-label' | 'aria-labelledby' | 'aria-describedby'> {
  value: string | number;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  name?: string;
  required?: boolean;
}

function collectOptions(children: React.ReactNode): OptionElement[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ children?: React.ReactNode }>(child)) return [];
    return child.type === 'option' ? [child as OptionElement] : collectOptions(child.props.children);
  });
}

export function Select({ value, onValueChange, children, className = '', name, required, disabled, ...props }: Props) {
  const { isDark } = useTheme();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [label, setLabel] = useState<string>();
  const [dark, setDark] = useState(false);
  const options = collectOptions(children);
  const selected = options.find(option => String(option.props.value ?? '') === String(value));
  const encode = (raw: string | number | undefined) => `value:${raw ?? ''}`;

  useLayoutEffect(() => {
    if (props['aria-label'] || props['aria-labelledby']) return;
    const trigger = triggerRef.current;
    const wrappingLabel = trigger?.closest('label');
    if (wrappingLabel) {
      const copy = wrappingLabel.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('button, select, [data-select-placeholder]').forEach(element => element.remove());
      setLabel(copy.textContent?.trim() || undefined);
    } else if (trigger?.previousElementSibling?.tagName === 'LABEL') {
      setLabel(trigger.previousElementSibling.textContent?.trim() || undefined);
    }
  }, [props['aria-label'], props['aria-labelledby'], children]);

  const renderItems = (items: React.ReactNode, groupDisabled = false): React.ReactNode => Children.toArray(items).map((child, index) => {
    if (!isValidElement<{ children?: React.ReactNode; label?: string; disabled?: boolean }>(child)) return null;
    if (child.type === React.Fragment) return <React.Fragment key={child.key ?? index}>{renderItems(child.props.children, groupDisabled)}</React.Fragment>;
    if (child.type === 'optgroup') return (
      <SelectPrimitive.Group key={child.key ?? index}>
        <SelectPrimitive.Label className="au-select-group-label">{child.props.label}</SelectPrimitive.Label>
        {renderItems(child.props.children, groupDisabled || child.props.disabled)}
      </SelectPrimitive.Group>
    );
    if (child.type !== 'option') return null;
    const option = child as OptionElement;
    if (option.props.hidden) return null;
    return (
      <SelectPrimitive.Item key={encode(option.props.value as string | number | undefined)} value={encode(option.props.value as string | number | undefined)} disabled={groupDisabled || option.props.disabled} className="au-select-item">
        <SelectPrimitive.ItemIndicator className="au-select-check"><Check size={14} /></SelectPrimitive.ItemIndicator>
        <SelectPrimitive.ItemText>{option.props.children}</SelectPrimitive.ItemText>
      </SelectPrimitive.Item>
    );
  });

  return (
    <SelectPrimitive.Root value={selected && !selected.props.hidden ? encode(value) : ''}
      onValueChange={next => onValueChange(next.slice('value:'.length))} disabled={disabled} name={name} required={required}
      onOpenChange={open => {
        if (!open) return;
        const editor = triggerRef.current?.closest('.au-editor');
        setDark(editor ? editor.classList.contains('dark') : isDark || !!triggerRef.current?.closest('.dark'));
      }}>
      <SelectPrimitive.Trigger ref={triggerRef} {...props} data-theme={isDark ? 'dark' : 'light'} aria-label={props['aria-label'] || label} className={`au-select-trigger ${className}`}>
        <span className="au-select-value"><SelectPrimitive.Value>{selected?.props.children}</SelectPrimitive.Value></span>
        <SelectPrimitive.Icon asChild><ChevronDown size={14} aria-hidden="true" /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" sideOffset={6} collisionPadding={8} data-theme={dark ? 'dark' : 'light'} className="au-select-content">
          <SelectPrimitive.ScrollUpButton className="au-select-scroll"><ChevronUp size={14} /></SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="au-select-viewport">{renderItems(children)}</SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="au-select-scroll"><ChevronDown size={14} /></SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
