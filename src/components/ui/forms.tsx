import { Children, cloneElement, forwardRef, isValidElement, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react'
import { ChevronDown, LoaderCircle, X } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ComponentSize = 'small' | 'medium' | 'large'
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; size?: ComponentSize; loading?: boolean; leadingIcon?: ReactNode }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', size = 'medium', loading = false, disabled, leadingIcon, children, className = '', ...props }, ref) {
  return <button ref={ref} className={`ui-button ui-button--${variant} ui-button--${size} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading ? <LoaderCircle aria-hidden="true" className="ui-spin" size={16} /> : leadingIcon}{children}</button>
})

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { error?: boolean }
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ error, className = '', ...props }, ref) { return <input ref={ref} className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`} aria-invalid={error || props['aria-invalid'] || undefined} {...props} /> })
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { error?: boolean }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ error, className = '', ...props }, ref) { return <textarea ref={ref} className={`ui-input ui-textarea ${error ? 'ui-input--error' : ''} ${className}`} aria-invalid={error || props['aria-invalid'] || undefined} {...props} /> })

export interface SelectOption { label: string; value: string; disabled?: boolean }
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { options: SelectOption[]; placeholder?: string; error?: boolean }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ options, placeholder, error, className = '', ...props }, ref) { return <select ref={ref} className={`ui-input ui-select ${error ? 'ui-input--error' : ''} ${className}`} aria-invalid={error || props['aria-invalid'] || undefined} {...props}>{placeholder && <option value="">{placeholder}</option>}{options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</select> })

export interface MultiSelectOption { label: string; value: string }
export interface MultiSelectProps { options: MultiSelectOption[]; value: string[]; onChange: (value: string[]) => void; placeholder?: string; disabled?: boolean; label?: string; id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }
export function MultiSelect({ options, value, onChange, placeholder = 'Pilih opsi', disabled, label = 'Pilih beberapa opsi', id, ...ariaProps }: MultiSelectProps) {
  const [open, setOpen] = useState(false); const generatedId = useId(); const controlId = id ?? generatedId
  const toggle = (option: string) => onChange(value.includes(option) ? value.filter(item => item !== option) : [...value, option])
  return <div className="ui-multiselect" onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
    <div id={controlId} className="ui-multiselect__control" onClick={() => !disabled && setOpen(!open)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(!open) } }} role="combobox" aria-expanded={open} aria-controls={`${controlId}-options`} aria-label={label} tabIndex={disabled ? -1 : 0} aria-disabled={disabled} {...ariaProps}>
      {value.length ? value.map(item => { const option = options.find(candidate => candidate.value === item); return <span className="ui-chip" key={item}>{option?.label ?? item}<button type="button" aria-label={`Hapus ${option?.label ?? item}`} disabled={disabled} onClick={event => { event.stopPropagation(); toggle(item) }}><X size={12} /></button></span> }) : <span className="ui-placeholder">{placeholder}</span>}
      <ChevronDown aria-hidden="true" size={16} />
    </div>
    {open && <div className="ui-multiselect__options" id={`${controlId}-options`} role="group" aria-label={label}>{options.map(option => <label key={option.value} className="ui-multiselect__option"><input type="checkbox" checked={value.includes(option.value)} disabled={disabled} onChange={() => toggle(option.value)} />{option.label}</label>)}{options.length === 0 && <p className="ui-muted">Tidak ada opsi tersedia.</p>}</div>}
  </div>
}

export interface DatePickerProps extends Omit<InputProps, 'type'> { placeholder?: string }
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(props, ref) { return <Input ref={ref} type="date" {...props} /> })

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: ReactNode }
export function Checkbox({ label, className = '', ...props }: CheckboxProps) { return <label className={`ui-choice ${className}`}><input type="checkbox" {...props} />{label && <span>{label}</span>}</label> }
export interface RadioOption { label: string; value: string; disabled?: boolean }
export interface RadioProps { name: string; value: string; options: RadioOption[]; onChange: (value: string) => void; disabled?: boolean; orientation?: 'horizontal' | 'vertical'; label?: string }
export function Radio({ name, value, options, onChange, disabled, orientation = 'vertical', label = name }: RadioProps) { return <div className={`ui-radio-group ui-radio-group--${orientation}`} role="radiogroup" aria-label={label}>{options.map(option => <label className="ui-choice" key={option.value}><input type="radio" name={name} value={option.value} checked={value === option.value} disabled={disabled || option.disabled} onChange={() => onChange(option.value)} /><span>{option.label}</span></label>)}</div> }
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: ReactNode }
export function Switch({ label, className = '', ...props }: SwitchProps) { return <label className={`ui-switch-row ${className}`}><span className="ui-switch"><input type="checkbox" role="switch" {...props} /><span aria-hidden="true" className="ui-switch__track" /></span>{label && <span>{label}</span>}</label> }

export interface FormFieldProps { label: string; htmlFor?: string; required?: boolean; hint?: string; error?: string; children: ReactNode; className?: string }
export function FormField({ label, htmlFor, required, hint, error, children, className = '' }: FormFieldProps) {
  const id = useId(); const controlId = htmlFor ?? id; const hintId = `${controlId}-hint`; const errorId = `${controlId}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  const controls = Children.map(children, child => isValidElement(child) ? cloneElement(child, { id: controlId, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined } as Record<string, unknown>) : child)
  return <div className={`ui-form-field ${className}`}><label htmlFor={controlId}>{label}{required && <span className="ui-required" aria-label="wajib diisi"> *</span>}</label>{controls}{hint && <p className="ui-hint" id={hintId}>{hint}</p>}{error && <p className="ui-error-text" id={errorId} role="alert">{error}</p>}</div>
}
export interface FormSectionProps { title: string; description?: string; children: ReactNode; divider?: boolean; className?: string }
export function FormSection({ title, description, children, divider, className = '' }: FormSectionProps) { return <section className={`ui-form-section ${divider ? 'ui-form-section--divider' : ''} ${className}`}><header><h3>{title}</h3>{description && <p>{description}</p>}</header><div className="ui-form-section__content">{children}</div></section> }
