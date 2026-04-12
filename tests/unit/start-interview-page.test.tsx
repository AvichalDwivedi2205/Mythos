import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StartInterviewPage } from "@/components/start-interview-page";
import { ThemeProvider } from "@/components/theme-provider";

const push = vi.fn();
const createSession = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("convex/react", () => ({
  useMutation: () => createSession,
}));

describe("StartInterviewPage", () => {
  beforeEach(() => {
    push.mockReset();
    createSession.mockReset();
    createSession.mockResolvedValue({ sessionPublicId: "session-test1234" });
  });

  it("renders the setup form and starts a session", async () => {
    render(
      <ThemeProvider>
        <StartInterviewPage />
      </ThemeProvider>,
    );

    expect(screen.getByText("Start Interview")).toBeInTheDocument();
    expect(screen.getByText("Start a new session")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: "Avi" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Paste the role, team context, and technical expectations. The scenario keywords are inferred from this plus your resume.",
      ),
      { target: { value: "We need a senior backend engineer for real-time chat." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Start interview" }));

    expect(createSession).toHaveBeenCalledWith({
      candidateName: "Avi",
      mode: "practice",
      jobDescription: "We need a senior backend engineer for real-time chat.",
      resumeText: "",
      resumeSummary: "",
    });
  });
});
