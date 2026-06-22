import { useRef } from "react";

const BTN =
  "rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-bg";

interface Props {
  hasReference: boolean;
  onLoad: (img: HTMLImageElement) => void;
  onClear: () => void;
}

export function ReferenceLoader({ hasReference, onLoad, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => onLoad(img);
    img.src = URL.createObjectURL(file);
    e.target.value = "";
  };

  if (hasReference) {
    return (
      <button onClick={onClear} className={BTN}>
        Remove reference
      </button>
    );
  }

  return (
    <>
      <button onClick={() => inputRef.current?.click()} className={BTN}>
        Reference
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </>
  );
}
