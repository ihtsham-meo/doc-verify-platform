'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label:    string;
  error?:   string;
  hint?:    string;
}

const FormInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300">
        {label}
      </label>
      <input
        ref={ref}
        {...props}
        className={`
          w-full px-4 py-2.5 rounded-lg bg-gray-800 border text-white
          placeholder-gray-500 text-sm transition-colors outline-none
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-600 hover:border-gray-500'}
          ${props.className ?? ''}
        `}
      />
      {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
      {hint && !error && <p className="text-gray-500 text-xs mt-0.5">{hint}</p>}
    </div>
  )
);

FormInput.displayName = 'FormInput';
export default FormInput;