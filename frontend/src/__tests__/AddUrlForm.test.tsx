import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AddUrlForm } from "../components/forms/AddUrlForm";

describe("AddUrlForm", () => {
  it("renders and allows user to type a URL", async () => {
    render(<AddUrlForm onSubmit={async () => {}} asDialog={false} />);
    const input = screen.getByPlaceholderText(
      /example.com/i
    ) as HTMLInputElement;
    await userEvent.type(input, "https://example.com");
    expect(input.value).toBe("https://example.com");
  });
});
