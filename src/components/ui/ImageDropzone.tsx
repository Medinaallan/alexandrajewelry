import { useRef, useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageDropzoneProps {
  value?: string;
  onChange: (base64: string, filename: string) => void;
  onClear?: () => void;
  label?: string;
}

export function ImageDropzone({ value, onChange, onClear, label = 'Arrastra la imagen o haz clic para subir' }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target!.result as string, file.name);
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) processFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  if (value) {
    return (
      <div style={{ position: 'relative' }}>
        <img
          src={value}
          alt="Preview"
          style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'block' }}
        />
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <X size={12} />
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Cambiar imagen
        </button>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          background: dragging ? 'rgba(201,164,93,0.06)' : 'transparent',
        }}
      >
        <Upload size={22} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>{label}</span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>PNG, JPG, WEBP</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
    </div>
  );
}
