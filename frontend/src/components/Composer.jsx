import { useRef, useState } from 'react';
import { IconSend } from './icons';

const MAX_HEIGHT = 160; // px, about six lines

export default function Composer({ onSend, disabled, room }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const canSend = !disabled && text.trim().length > 0;

  const resize = () => {
    const el = inputRef.current;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  };

  const submit = () => {
    if (!canSend) return;
    if (onSend(text)) {
      setText('');
      // Collapse back to one line once React has cleared the value.
      requestAnimationFrame(resize);
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a line. Ignore Enter while an IME
    // (Japanese, Chinese, Korean...) is still composing a character.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="px-4 pb-4 pt-2 sm:px-6 sm:pb-5"
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-3xl border border-line bg-surface p-2 shadow-sm transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <label htmlFor="message" className="sr-only">
            Message #{room}
          </label>
          <textarea
            id="message"
            ref={inputRef}
            rows={1}
            value={text}
            disabled={disabled}
            onChange={(e) => {
              setText(e.target.value);
              resize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Waiting for the connection…' : `Message #${room}`}
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-[opacity,background-color,transform] hover:bg-accent-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <IconSend size={20} />
          </button>
        </div>
        <p className="mt-2 hidden px-4 text-xs text-ink-3 sm:block">
          Enter sends. Shift+Enter adds a new line.
        </p>
      </div>
    </form>
  );
}
