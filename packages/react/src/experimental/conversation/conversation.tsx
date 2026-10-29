"use client";

import { ArrowUpIcon } from "@qeetrix/icons/icons/arrow-up";
import { SquareIcon } from "@qeetrix/icons/icons/square";
import { TriangleAlertIcon } from "@qeetrix/icons/icons/triangle-alert";
import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { Textarea } from "../../input/input";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { Spinner } from "../../spinner/spinner";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

type Strings = Partial<QeetrixMessages["conversation"]>;

// ---- Composer ---------------------------------------------------------------------------------

export interface ComposerProps extends Omit<ComponentProps<"form">, "onSubmit" | "children"> {
  /** Called with the message, trimmed, when it's sent. */
  onSend: (text: string) => void;
  /** An answer is on its way: Send becomes Stop, and Enter doesn't send. */
  streaming?: boolean;
  /** Called by Stop. */
  onStop?: () => void;
  /** The field's hint: "Ask about users, roles or sign-ins". */
  placeholder?: string;
  /** A line under the field: "Qeet AI can be wrong. Check what matters." */
  note?: ReactNode;
  /** Focus the field when it appears, as a panel that opens to chat does. */
  autoFocus?: boolean;
  /** How tall the field grows, in lines, before it scrolls. Default `8`. */
  maxRows?: number;
  /** This composer's strings, over QeetrixProvider's and the English defaults. */
  messages?: Strings;
}

/**
 * Where a message is written to an assistant: a field that grows with its text, Enter sends and
 * Shift+Enter adds a line (typing in an input method is left alone), and Send turns into Stop
 * while an answer streams.
 */
export function Composer({
  onSend,
  streaming = false,
  onStop,
  placeholder,
  note,
  autoFocus = false,
  maxRows = 8,
  messages,
  className,
  ...props
}: ComposerProps): ReactElement {
  const strings = useMessages("conversation", messages);
  const [draft, setDraft] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus) field.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const text = draft.trim();
    if (!text || streaming) return;
    onSend(text);
    setDraft("");
  };

  return (
    <form
      aria-label={strings.composer}
      {...props}
      className={cx("qx-composer", className)}
      data-slot="composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Textarea
        ref={field}
        value={draft}
        onValueChange={(value) => setDraft(value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        rows={1}
        maxRows={maxRows}
        placeholder={placeholder}
        aria-label={strings.composer}
      />
      {streaming ? (
        <IconButton icon={SquareIcon} variant="soft" aria-label={strings.stop} onClick={onStop} />
      ) : (
        <IconButton
          type="submit"
          icon={ArrowUpIcon}
          variant="solid"
          aria-label={strings.send}
          tooltip={strings.sendShortcut}
          disabled={!draft.trim()}
        />
      )}
      {note != null && (
        <p className="qx-composer-note" data-slot="composer-note">
          {note}
        </p>
      )}
    </form>
  );
}

// ---- Conversation and Turn --------------------------------------------------------------------

export interface ConversationProps extends Omit<ComponentProps<"div">, "children"> {
  /** The turns, oldest first. */
  children?: ReactNode;
  /** This conversation's strings, over QeetrixProvider's and the English defaults. */
  messages?: Strings;
}

/**
 * The transcript: it scrolls, following new turns and streamed text only while the reader is at
 * the bottom, and it's a polite log, so a screen reader hears what's added and not what's removed.
 */
export function Conversation({
  children,
  messages,
  className,
  ...props
}: ConversationProps): ReactElement {
  const strings = useMessages("conversation", messages);
  const scroller = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    const inner = log.current;
    if (!el || !inner || typeof ResizeObserver === "undefined") return;
    const follow = () => {
      if (pinned.current) el.scrollTop = el.scrollHeight;
    };
    follow();
    const observer = new ResizeObserver(follow);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      {...props}
      ref={scroller}
      className={cx("qx-conversation", className)}
      data-slot="conversation"
      onScroll={(event) => {
        const el = event.currentTarget;
        pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
    >
      <div
        ref={log}
        className="qx-conversation-log"
        role="log"
        aria-label={strings.log}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {children}
      </div>
    </div>
  );
}

export interface TurnProps extends Omit<ComponentProps<"div">, "children"> {
  /** Who's speaking: the person (at the end, on the neutral tint) or the assistant (across). */
  speaker: "user" | "assistant";
  /** The speaker's name for screen readers, before the turn. Default "You said:" or "Answer:". */
  speakerName?: string;
  /** The turn: text, or an answer's rendered Markdown. */
  children?: ReactNode;
  /** The answer is on its way: with no content yet, "Thinking…" and a spinner. */
  streaming?: boolean;
  /** The turn failed: why, as an alert under it. */
  error?: ReactNode;
  /** The turn's own actions (Copy, Edit, Regenerate): they show while it's hovered or focused. */
  actions?: ReactNode;
  /** This turn's strings, over QeetrixProvider's and the English defaults. */
  messages?: Strings;
}

/** One turn of a conversation: what the person asked, or the assistant's answer. */
export function Turn({
  speaker,
  speakerName,
  children,
  streaming = false,
  error,
  actions,
  messages,
  className,
  ...props
}: TurnProps): ReactElement {
  const strings = useMessages("conversation", messages);
  const empty = children == null || children === "";
  return (
    <div {...props} className={cx("qx-turn", className)} data-slot="turn" data-speaker={speaker}>
      <VisuallyHidden>
        {speakerName ?? (speaker === "user" ? strings.you : strings.answer)}
      </VisuallyHidden>
      {!empty ? (
        <div className="qx-turn-content" data-slot="turn-content">
          {children}
        </div>
      ) : streaming ? (
        <span className="qx-turn-thinking">
          <Spinner size="sm" decorative />
          {strings.thinking}
        </span>
      ) : null}
      {error != null && (
        <p className="qx-turn-error" role="alert">
          <TriangleAlertIcon shape="sharp" size={16} aria-hidden />
          {error}
        </p>
      )}
      {actions != null && !streaming && (
        <div className="qx-turn-actions" data-slot="turn-actions">
          {actions}
        </div>
      )}
    </div>
  );
}
