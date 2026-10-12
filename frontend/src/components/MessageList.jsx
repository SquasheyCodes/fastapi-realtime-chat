import { useLayoutEffect, useRef, useState } from 'react';
import Avatar from './Avatar';

const BOTTOM_THRESHOLD = 80; // px from the bottom that still counts as "at the bottom"

export default function MessageList({ messages, username, room }) {
  const scrollerRef = useRef(null);
  const stickRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  const handleScroll = () => {
    const el = scrollerRef.current;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    stickRef.current = nearBottom;
    setAtBottom(nearBottom);
  };

  // Follow new messages while the reader is at the bottom (or just sent one).
  // If they scrolled up to read history, leave them where they are.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const last = messages[messages.length - 1];
    const sentByMe = last?.kind === 'chat' && last.user === username;
    if (el && (stickRef.current || sentByMe)) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, username]);

  const jumpToLatest = () => {
    const el = scrollerRef.current;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label={`Messages in ${room}`}
        className="h-full overflow-y-auto px-4 py-4 sm:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold text-gray-200">
              No messages in #{room} yet
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Write the first one below.
            </p>
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col">
            {messages.map((msg, i) => {
              if (msg.kind === 'presence') {
                return (
                  <li
                    key={msg.id}
                    className="my-3 text-center text-xs text-gray-500"
                  >
                    {msg.user} {msg.status === 'online' ? 'joined' : 'left'}
                  </li>
                );
              }

              const mine = msg.user === username;
              const prev = messages[i - 1];
              const startsGroup =
                !prev || prev.kind !== 'chat' || prev.user !== msg.user;

              return (
                <li
                  key={msg.id}
                  className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''} ${
                    startsGroup ? 'mt-4' : 'mt-1'
                  }`}
                >
                  <div className="w-9 shrink-0">
                    {startsGroup && !mine && <Avatar name={msg.user} />}
                  </div>
                  <div
                    className={`flex min-w-0 max-w-[80%] flex-col ${
                      mine ? 'items-end' : 'items-start'
                    }`}
                  >
                    {startsGroup && !mine && (
                      <span className="mb-1 px-1 text-xs font-medium text-gray-400">
                        {msg.user}
                      </span>
                    )}
                    <p
                      className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed ${
                        mine
                          ? 'rounded-br-md bg-green-600 text-white'
                          : 'rounded-bl-md bg-gray-800 text-gray-100'
                      }`}
                    >
                      {msg.content}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-gray-600 bg-gray-800 px-4 py-1.5 text-sm text-gray-100 shadow-lg transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
        >
          Jump to latest
        </button>
      )}
    </div>
  );
}
