import React, { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+44', country: 'GB', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: '+33', country: 'FR', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: '+34', country: 'ES', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: '+39', country: 'IT', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: '+49', country: 'DE', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: '+1', country: 'US', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: '+31', country: 'NL', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: '+32', country: 'BE', flag: '\u{1F1E7}\u{1F1EA}' },
  { code: '+41', country: 'CH', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: '+43', country: 'AT', flag: '\u{1F1E6}\u{1F1F9}' },
  { code: '+45', country: 'DK', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: '+46', country: 'SE', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: '+47', country: 'NO', flag: '\u{1F1F3}\u{1F1F4}' },
  { code: '+48', country: 'PL', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: '+351', country: 'PT', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: '+353', country: 'IE', flag: '\u{1F1EE}\u{1F1EA}' },
  { code: '+358', country: 'FI', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: '+61', country: 'AU', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: '+81', country: 'JP', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: '+86', country: 'CN', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: '+91', country: 'IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: '+971', country: 'AE', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: '+966', country: 'SA', flag: '\u{1F1F8}\u{1F1E6}' },
];

export default function PhoneInput({
  label,
  value = '',
  onChange,
  error,
  required = false,
  className = '',
}) {
  // Parse existing value to extract country code
  const parseValue = (val) => {
    if (!val) return { countryCode: '+44', number: '' };
    for (const cc of COUNTRY_CODES) {
      if (val.startsWith(cc.code)) {
        return { countryCode: cc.code, number: val.slice(cc.code.length).trim() };
      }
    }
    return { countryCode: '+44', number: val };
  };

  const { countryCode, number } = parseValue(value);
  const [selectedCode, setSelectedCode] = useState(countryCode);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setSelectedCode(newCode);
    onChange?.({ target: { value: number ? `${newCode} ${number}` : '' } });
  };

  const handleNumberChange = (e) => {
    const num = e.target.value.replace(/[^\d\s-]/g, '');
    onChange?.({ target: { value: num ? `${selectedCode} ${num}` : '' } });
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === selectedCode);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm text-slate-400">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="flex">
        <select
          value={selectedCode}
          onChange={handleCodeChange}
          className="rounded-l-lg px-2 py-2 text-sm text-white bg-slate-700 border border-r-0 border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shrink-0"
        >
          {COUNTRY_CODES.map((cc) => (
            <option key={cc.code + cc.country} value={cc.code}>
              {cc.flag} {cc.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          placeholder="Phone number"
          className={`
            w-full rounded-r-lg rounded-l-none px-3 py-2 text-sm text-white placeholder-slate-500
            bg-slate-800 border transition-colors duration-150 outline-none
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-slate-600'}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
