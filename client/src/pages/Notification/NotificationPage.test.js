import React, { act } from "react";
import { createRoot } from "react-dom/client";
import NotificationPage from "./NotificationPage";
import { useAuth } from "../../context/AuthContext";

jest.mock("../../components/NavigationBar", () => () => <div>Navigation</div>);
jest.mock("../../components/Footer", () => () => <div>Footer</div>);

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("NotificationPage", () => {
  let container;
  let root;
  let fetchMock;
  let consoleErrorSpy;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  const renderPage = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<NotificationPage />);
    });
    await act(async () => {
      await flushPromises();
    });
  };

  it("shows error when user is not logged in", async () => {
    useAuth.mockReturnValue({ user: null });

    await renderPage();

    expect(container.textContent).toContain("Please log in to view notifications");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders notifications when fetch succeeds", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1", name: "User" } });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          userId: "alice",
          userName: "Alice",
          message: 'Alice reserved your food event "Spark! Demo Day"',
          created_at: "2025-01-02T00:00:00Z",
          is_read: false,
          type: "reservation",
        },
      ],
    });

    await renderPage();

    expect(fetchMock).toHaveBeenCalled();
    expect(container.textContent).toContain("reserved your food event");
  });

  it("shows error when fetch fails", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" } });
    fetchMock.mockResolvedValueOnce({
      ok: false,
    });

    await renderPage();

    expect(container.textContent).toContain("Failed to load notifications");
  });
});
