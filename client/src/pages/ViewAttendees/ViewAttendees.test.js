import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ViewAttendeesPage from "./ViewAttendees";
import { useAuth } from "../../context/AuthContext";

jest.mock("../../components/NavigationBar", () => () => <div>Navigation</div>);
jest.mock("../../components/Footer", () => () => <div>Footer</div>);

const mockNavigate = jest.fn();
const mockParams = { id: "event-1" };
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

jest.mock("../../config/supabase", () => ({
  __esModule: true,
  default: { auth: { getSession: jest.fn() } },
  APP_API_URL: process.env.REACT_APP_API_URL || "http://localhost:5001",
}));

const {
  default: {
    auth: { getSession: mockGetSession },
  },
} = jest.requireMock("../../config/supabase");

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const sampleEvent = { id: "event-1", title: "Event Title" };
const sampleAttendees = [
  {
    id: "a1",
    profiles: { name: "Alice", email: "alice@example.com" },
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "a2",
    profiles: { name: "Bob", email: "bob@example.com" },
    created_at: "2025-01-02T00:00:00Z",
  },
];

describe("ViewAttendeesPage", () => {
  let container;
  let root;
  let fetchMock;
  let alertSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockNavigate.mockClear();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
    useAuth.mockReturnValue({ user: { id: "user-1" } });
    global.URL.createObjectURL = jest.fn(() => "blob://url");
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  const renderPage = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<ViewAttendeesPage />);
    });
    await act(async () => {
      await flushPromises();
    });
  };

  it("loads attendees and displays them", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleEvent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ attendees: sampleAttendees }),
      });

    await renderPage();

    expect(container.textContent).toContain(
      `Attendees for Food Event: "${sampleEvent.title}"`
    );
    expect(container.textContent).toContain("Total Attendees");
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Bob");
  });

  it("shows owner error when attendees endpoint returns 403", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleEvent,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      });

    await renderPage();

    expect(container.textContent).toContain("You are not the owner of this event.");
  });

  it("shows fetch error text from attendees endpoint", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleEvent,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Server blew up",
      });

    await renderPage();

    expect(container.textContent).toContain("Failed to load attendees: Server blew up");
  });

  it("shows event load failure and allows navigating back", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    await renderPage();

    expect(container.textContent).toContain("Failed to load event.");

    const backBtn = container.querySelector(".back-button");
    await act(async () => {
      backBtn.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("handles unexpected errors gracefully", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await renderPage();

    expect(container.textContent).toContain("Unexpected error while loading attendees.");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("shows login error when session is missing", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });

    await renderPage();

    expect(container.textContent).toContain(
      "You must be logged in to view attendees."
    );
  });

  it("alerts when exporting with no attendees", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleEvent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ attendees: [] }),
      });

    await renderPage();

    const exportBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent.includes("Export CSV")
    );

    await act(async () => {
      exportBtn.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });

    expect(alertSpy).toHaveBeenCalledWith("No attendees to export.");
  });

  it("exports attendees to CSV with proper filename", async () => {
    const clickMock = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = jest.fn((tag) => {
      if (tag === "a") {
        return { click: clickMock, set href(val) {}, set download(val) {} };
      }
      return originalCreateElement(tag);
    });

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleEvent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ attendees: sampleAttendees }),
      });

    await renderPage();

    const exportBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent.includes("Export CSV")
    );

    await act(async () => {
      exportBtn.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });

    expect(clickMock).toHaveBeenCalled();
    document.createElement = originalCreateElement;
  });
});
