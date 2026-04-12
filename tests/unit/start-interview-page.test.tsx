import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StartInterviewPage } from "@/components/start-interview-page";

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
    render(<StartInterviewPage />);

    expect(screen.getByText("Start Interview")).toBeInTheDocument();
    expect(screen.getByText("Practice a real system design room, not a chatbot.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: "Avi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start interview" }));

    expect(createSession).toHaveBeenCalledWith({
      candidateName: "Avi",
      mode: "practice",
      teammateSpecialization: "sre_infra",
    });
  });
});
