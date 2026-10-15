import { useLayoutEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import { IconArrowDown } from './icons';

const BOTTOM_THRESHOLD = 80; // px from the bottom that still counts as "at the bottom"
const URL_PATTERN = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]'])/g;

// Turns http(s) links in a message into clickable links. Everything else stays
// plain text, which React escapes.
function Linkified({ text }) {
  return text.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default function MessageList({ messages, username, room }) {
  const scrollerRef = useRef(null);
  const stickRef = useRef(true);
  // Id of the last message when the reader scrolled away from the bottom.
  const [awayFromId, setAwayFromId] = useState(null);

  const handleScroll = () => {
    const el = scrollerRef.current;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    stickRef.current = nearBottom;
    if (nearBottom) {
      setAwayFromId(null);
    } else {
      setAwayFromId((prev) => prev ?? messages[messages.length - 1]?.id ?? -1);
    }
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

  const unread =
    awayFromId === null
      ? 0
      : messages.filter((m) => m.kind === 'chat' && m.id > awayFromId).length;

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
        className="h-full overflow-y-auto px-4 py-6 sm:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-display text-2xl font-bold tracking-tight">
              It’s quiet in #{room}
            </p>
            <p className="mt-2 max-w-xs text-ink-2">
              Messages sent here show up for everyone in the room right away.
              Say hello below.
            </p>
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col">
            {messages.map((msg, i) => {
              if (msg.kind === 'presence') {
                return (
                  <li
                    key={msg.id}
                    className="my-4 animate-fade text-center text-xs text-ink-3"
                  >
                    {msg.user} {msg.status === 'online' ? 'joined the room' : 'left the room'}
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
                  className={`flex animate-rise items-end gap-2.5 ${
                    mine ? 'flex-row-reverse' : ''
                  } ${startsGroup ? 'mt-4' : 'mt-1'}`}
                >
                  {!mine && (
                    <div className="w-8 shrink-0">
                      {startsGroup && <Avatar name={msg.user} size="sm" />}
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 max-w-[82%] flex-col sm:max-w-[70%] ${
                      mine ? 'items-end' : 'items-start'
                    }`}
                  >
                    {startsGroup && !mine && (
                      <span className="mb-1 px-1 text-xs font-semibold text-ink-2">
                        {msg.user}
                      </span>
                    )}
                    <p
                      className={`whitespace-pre-wrap break-words rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed ${
                        mine
                          ? 'rounded-br-md bg-accent text-white'
                          : 'rounded-bl-md border border-line bg-surface text-ink'
                      }`}
                    >
                      <Linkified text={msg.content} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {awayFromId !== null && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 animate-pop items-center gap-2 rounded-full border border-line bg-surface py-2 pl-4 pr-3.5 text-sm font-medium text-ink shadow-lg transition-colors hover:bg-sunken"
        >
          {unread > 0
            ? `${unread} new ${unread === 1 ? 'message' : 'messages'}`
            : 'Jump to latest'}
          <IconArrowDown size={16} />
        </button>
      )}
    </div>
  );
}
