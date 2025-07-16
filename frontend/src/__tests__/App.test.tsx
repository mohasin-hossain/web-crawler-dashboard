import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App", () => {
  it("renders without crashing and shows the login heading", () => {
    render(<App />);
    // Look for a heading that always appears on the login page
    expect(screen.getAllByText(/sign in|crawldash/i).length).toBeGreaterThan(0);
  });
});
