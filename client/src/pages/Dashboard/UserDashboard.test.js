import React, { act } from "react";
import { createRoot } from "react-dom/client";
import UserDashboard from "./UserDashboard";
import { useAuth } from "../../context/AuthContext";

jest.mock("../../components/NavigationBar", () => () => <div>Navigation</div>);
jest.mock("../../components/Footer", () => () => <div>Footer</div>);
jest.mock("../../components/EventDetailModal", () => () => (
  <div>EventDetailModal</div>
));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../config/supabase.js", () => ({
  __esModule: true,
  default: { auth: { getSession: jest.fn() } },
  APP_API_URL: process.env.REACT_APP_API_URL,
}));

const {
  default: {
    auth: { getSession: mockGetSession },
  },
} = jest.requireMock("../../config/supabase.js");

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const mockUser = {
  id: "user-321",
  name: "Student",
  email: "student@example.com",
};

const baseEvent = {
  id: "event-1",
  title: "Test Event",
  date: "2099-12-31",
  time: "10:00 AM",
  location: "Campus",
  capacity: 10,
  attendees_count: 5,
  dietary_options: ["Vegan"],
  image_urls: ["https://example.com/img.jpg"],
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const formatLocalDate = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

describe("UserDashboard reserved events flow", () => {
  let container;
  let root;
  let alertSpy;
  let confirmSpy;
  let fetchMock;
  let consoleErrorSpy;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockNavigate.mockClear();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
    });
    useAuth.mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
    alertSpy.mockRestore();
    confirmSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  const renderDashboard = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<UserDashboard />);
    });
    await act(async () => {
      await flushPromises();
    });
  };

  const getButtonByText = (text) =>
    Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === text
    );

  it("fetches reserved events and shows only upcoming ones", async () => {
    const today = new Date();
    const upcomingDate = new Date(today);
    upcomingDate.setDate(today.getDate() + 1);
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 1);

    const upcoming = {
      ...baseEvent,
      id: "upcoming-1",
      title: "Upcoming Event",
      date: formatLocalDate(upcomingDate),
    };
    const past = {
      ...baseEvent,
      id: "past-1",
      title: "Past Event",
      date: formatLocalDate(pastDate),
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reservedEventIds: [upcoming.id, past.id] }),
      })
      .mockResolvedValueOnce({
        json: async () => upcoming,
      })
      .mockResolvedValueOnce({
        json: async () => past,
      });

    await renderDashboard();

    expect(container.textContent).toContain(upcoming.title);
    expect(container.textContent).not.toContain(past.title);
  });

  it("alerts on failure to load reserved events", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "boom" }),
    });

    await renderDashboard();

    expect(alertSpy).toHaveBeenCalledWith("Failed to fetch reserved event IDs");
  });

  it("cancels a reservation successfully", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reservedEventIds: [baseEvent.id] }),
      })
      .mockResolvedValueOnce({
        json: async () => baseEvent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "cancelled" }),
      });

    await renderDashboard();

    const cancelButton = getButtonByText("Cancel");
    expect(cancelButton).toBeTruthy();

    await act(async () => {
      cancelButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });

    expect(alertSpy).toHaveBeenCalledWith("Reservation cancelled");
    expect(container.textContent).not.toContain(baseEvent.title);
  });

  it("alerts and keeps event when cancellation fails", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reservedEventIds: [baseEvent.id] }),
      })
      .mockResolvedValueOnce({
        json: async () => baseEvent,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Cannot cancel" }),
      });

    await renderDashboard();

    const cancelButton = getButtonByText("Cancel");
    expect(cancelButton).toBeTruthy();

    await act(async () => {
      cancelButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });

    expect(alertSpy).toHaveBeenCalledWith("Cannot cancel");
    expect(container.textContent).toContain(baseEvent.title);
  });
});
