import { useRef, useState } from 'react';

const MAX_HEIGHT = 144; // px, about six lines

export default function Composer({ onSend, disabled, room }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const resize = () => {
    const el = inputRef.current;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  };

  const submit = () => {
    if (disabled || !text.trim()) return;
    if (onSend(text)) {
      setText('');
      // Collapse back to a single line once React has cleared the value.
      requestAnimationFrame(resize);
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line. Ignore Enter while an IME
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
      className="border-t border-gray-700 bg-gray-800/60 px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
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
          placeholder={disabled ? 'Waiting for connection…' : `Message #${room}`}
          className="max-h-36 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-gray-700 bg-gray-900 px-3.5 py-2.5 text-[15px] text-white placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="h-11 rounded-xl bg-green-600 px-5 font-semibold text-white transition-colors hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
        >
          Send
        </button>
      </div>
    </form>
  );
}
