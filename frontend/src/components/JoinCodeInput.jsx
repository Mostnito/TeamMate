import { useRef } from 'react';

export default function JoinCodeInput({ digits }) {
  const inputRefs = useRef([]);

  const handleChange = (i) => (e) => {
    digits[i].onChange(e);
    if (e.target.value && i < digits.length - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i) => (e) => {
    if (e.key === 'Backspace' && !digits[i].val && i > 0) {
      e.preventDefault();
      inputRefs.current[i - 1]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 14 }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          value={d.val}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          maxLength={1}
          style={{ width: 34, height: 40, textAlign: 'center', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', fontSize: 15, fontWeight: 600 }}
        />
      ))}
    </div>
  );
}
