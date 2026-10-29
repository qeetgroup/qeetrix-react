import { CopyIcon } from "@qeetrix/icons/icons/copy";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { IconButton } from "../../button/button";
import { Composer, Conversation, Turn } from "./conversation";

describe("Composer", () => {
  it("sends on Enter, adds a line on Shift+Enter, and clears once sent", async () => {
    const onSend = vi.fn();
    await render(<Composer onSend={onSend} autoFocus />);
    const field = page.getByRole("textbox", { name: "Message" });
    await expect.element(field).toHaveFocus();
    await expect.element(page.getByRole("button", { name: "Send" })).toBeDisabled();
    await userEvent.keyboard("Who can{Shift>}{Enter}{/Shift}reset passwords?");
    expect((field.element() as HTMLTextAreaElement).value).toBe("Who can\nreset passwords?");
    await userEvent.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith("Who can\nreset passwords?");
    await expect.element(field).toHaveValue("");
  });

  it("turns Send into Stop while an answer streams, and Enter doesn't send", async () => {
    const onSend = vi.fn();
    const onStop = vi.fn();
    await render(<Composer onSend={onSend} onStop={onStop} streaming />);
    await userEvent.click(page.getByRole("textbox", { name: "Message" }));
    await userEvent.keyboard("More{Enter}");
    expect(onSend).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
  });
});

function Chat() {
  const [turns, setTurns] = useState<string[]>([]);
  return (
    <div style={{ display: "grid", inlineSize: 360 }}>
      <Conversation style={{ blockSize: 240 }}>
        {turns.map((text, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a test's turns
          <Turn key={index} speaker={index % 2 ? "assistant" : "user"}>
            {text}
          </Turn>
        ))}
      </Conversation>
      <Composer
        onSend={(text) =>
          setTurns((all) => [...all, text, `About “${text}”: ${"Yes. ".repeat(40)}`])
        }
      />
    </div>
  );
}

describe("Conversation and Turn", () => {
  it("is a polite log that follows new turns while the reader is at the bottom", async () => {
    const { container } = await render(<Chat />);
    const log = page.getByRole("log", { name: "Conversation" });
    await expect.element(log).toHaveAttribute("aria-live", "polite");
    await userEvent.click(page.getByRole("textbox", { name: "Message" }));
    await userEvent.keyboard("First{Enter}");
    await userEvent.keyboard("Second{Enter}");
    const scroller = container.querySelector("[data-slot=conversation]") as HTMLElement;
    await expect
      .poll(() => Math.round(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight))
      .toBe(0);
  });

  it("names each speaker for screen readers; the person's turns sit at the end on the tint", async () => {
    await render(
      <Conversation style={{ inlineSize: 400 }}>
        <Turn speaker="user">Who has admin?</Turn>
        <Turn speaker="assistant">Three people.</Turn>
      </Conversation>,
    );
    const turns = page.getByRole("log").element().querySelectorAll("[data-slot=turn]");
    expect([...turns].map((turn) => turn.textContent)).toEqual([
      "You said:Who has admin?",
      "Answer:Three people.",
    ]);
    const question = turns[0]?.querySelector("[data-slot=turn-content]") as HTMLElement;
    expect(getComputedStyle(question).backgroundColor).toBe(
      tokenColor("--qx-color-bg-neutral-subtle"),
    );
    const log = page.getByRole("log").element().getBoundingClientRect();
    expect(Math.round(question.getBoundingClientRect().right)).toBe(Math.round(log.right));
  });

  it("thinks while an answer has no words yet, and says when a turn fails", async () => {
    await render(
      <Conversation>
        <Turn speaker="assistant" streaming />
        <Turn speaker="assistant" error="Qeet AI couldn't answer. Try again." />
      </Conversation>,
    );
    await expect.element(page.getByText("Thinking…")).toBeVisible();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Qeet AI couldn't answer. Try again.");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 16, inlineSize: 400 }}>
          <Conversation>
            <Turn speaker="user">Who can reset passwords?</Turn>
            <Turn
              speaker="assistant"
              actions={
                <IconButton icon={CopyIcon} aria-label="Copy answer" size="sm" tone="neutral" />
              }
            >
              Admins and the Help desk role can reset passwords.
            </Turn>
            <Turn speaker="assistant" streaming />
          </Conversation>
          <Composer
            onSend={() => {}}
            placeholder="Ask about users or roles"
            note="Qeet AI can be wrong."
          />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Conversation");
  });
});
