'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentProps, OptiFormsSelectionElementContentType } from '@optimizely/cms-sdk';
import { getSelectionOptions } from '@optimizely/cms-sdk/forms/validation';
import {
  FormElement,
  getPreviewUtils,
  useFormField,
} from '@optimizely/cms-sdk/forms/react';
import {
  controlClass,
  errorTextClass,
  labelClass,
  requiredMarkClass,
} from './formStyles';

type FormSelectionProps = {
  content: ContentProps<typeof OptiFormsSelectionElementContentType>;
};

export default function FormSelection({ content }: FormSelectionProps) {
  const options = getSelectionOptions(content);
  const isMulti = content.AllowMultiSelect === true;

  const defaultValue = isMulti
    ? options.filter(o => o.selected).map(o => o.value).join(',')
    : (options.find(o => o.selected)?.value ?? '');

  const {
    value,
    setValue,
    inputRef,
    onBlur,
    errorId,
    errorProps,
    errors,
    showErrors,
    isRequired,
  } = useFormField<HTMLDivElement>({
    content,
    defaultValue,
  });

  const { pa } = getPreviewUtils(content);

  if (isMulti) {
    return (
      <FormElement content={content}>
        <div className='flex-1 space-y-2'>
          {content.Label && (
            <label className={labelClass} {...pa('Label')}>
              {content.Label}
              {isRequired && <span className={requiredMarkClass}>*</span>}
            </label>
          )}
          <MultiSelectDropdown
            options={options}
            value={value}
            setValue={setValue}
            onBlur={onBlur}
            inputRef={inputRef}
            placeholder={content.Placeholder || '-- Select --'}
            tooltip={content.Tooltip ?? ''}
            showErrors={showErrors}
            errorId={errorId}
            pa={pa}
          />
          {showErrors && (
            <div {...errorProps} className='space-y-1'>
              {errors.map(message => (
                <p key={message} className={errorTextClass}>
                  {message}
                </p>
              ))}
            </div>
          )}
        </div>
      </FormElement>
    );
  }

  return (
    <FormElement content={content}>
      <div className='flex-1 space-y-2'>
        {content.Label && (
          <label
            htmlFor={content.SubmissionFieldName ?? content.Label ?? ''}
            className={labelClass}
            {...pa('Label')}
          >
            {content.Label}
            {isRequired && <span className={requiredMarkClass}>*</span>}
          </label>
        )}
        <div ref={inputRef}>
          <select
            id={content.SubmissionFieldName ?? content.Label ?? ''}
            name={content.SubmissionFieldName ?? content.Label ?? ''}
            value={value}
            onChange={e => { setValue(e.target.value); onBlur(); }}
            onBlur={onBlur}
            title={content.Tooltip ?? ''}
            aria-invalid={showErrors}
            aria-describedby={errorId}
            className={controlClass(showErrors)}
            {...pa('Options')}
          >
            <option value=''>
              {content.Placeholder || '-- Select --'}
            </option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {showErrors && (
          <div {...errorProps} className='space-y-1'>
            {errors.map(message => (
              <p key={message} className={errorTextClass}>
                {message}
              </p>
            ))}
          </div>
        )}
      </div>
    </FormElement>
  );
}

type SelectionOption = { label: string; value: string; selected?: boolean };

function MultiSelectDropdown({
  options,
  value,
  setValue,
  onBlur,
  inputRef,
  placeholder,
  tooltip,
  showErrors,
  errorId,
  pa,
}: {
  options: SelectionOption[];
  value: string;
  setValue: (v: string) => void;
  onBlur: () => void;
  inputRef: React.RefObject<HTMLDivElement | null>;
  placeholder: string;
  tooltip: string;
  showErrors: boolean;
  errorId: string | undefined;
  pa: ReturnType<typeof getPreviewUtils>['pa'];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = new Set(value ? value.split(',') : []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (optionValue: string) => {
    const next = new Set(selected);
    if (next.has(optionValue)) {
      next.delete(optionValue);
    } else {
      next.add(optionValue);
    }
    setValue(Array.from(next).join(','));
    onBlur();
  };

  const selectedLabels = options
    .filter(o => selected.has(o.value))
    .map(o => o.label);

  return (
    <div ref={containerRef} className='relative'>
      <div ref={inputRef}>
        <button
          type='button'
          onClick={() => setOpen(prev => !prev)}
          title={tooltip}
          aria-invalid={showErrors}
          aria-describedby={errorId}
          aria-expanded={open}
          className={`${controlClass(showErrors)} flex items-center justify-between text-left`}
        >
          <span className={selectedLabels.length ? 'text-foreground' : 'text-foreground2'}>
            {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
          </span>
          <svg
            className={`ml-2 h-4 w-4 shrink-0 text-foreground2 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      </div>
      {open && (
        <ul
          role='listbox'
          aria-multiselectable='true'
          className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-foreground/15 bg-background shadow-lg'
          {...pa('Options')}
        >
          {options.map(option => {
            const isSelected = selected.has(option.value);
            return (
              <li
                key={option.value}
                role='option'
                aria-selected={isSelected}
                onClick={() => toggle(option.value)}
                className='flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-background2'
              >
                <span>{option.label}</span>
                {isSelected && (
                  <svg className='h-4 w-4 shrink-0 text-key1' viewBox='0 0 20 20' fill='currentColor'>
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
