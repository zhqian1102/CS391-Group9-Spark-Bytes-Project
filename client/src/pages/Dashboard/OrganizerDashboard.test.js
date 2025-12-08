import React, { act } from "react";
import { createRoot } from "react-dom/client";
import OrganizerDashboard from "./OrganizerDashboard";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL;
if (!API_URL) {
  throw new Error("API_URL is not set.");
}

jest.mock("../../components/NavigationBar", () => () => <div>Navigation</div>);
jest.mock("../../components/Footer", () => () => <div>Footer</div>);

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
  id: "user-123",
  name: "Organizer",
  email: "organizer@example.com",
};

const futureEvent = {
  id: "event-1",
  title: "Future Feast",
  date: "2099-12-31",
  time: "12:00 PM",
  location: "BU Campus",
  capacity: 20,
  attendees_count: 5,
  dietary_options: ["Vegan"],
  image_urls: ["https://example.com/image.jpg"],
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));
const formatLocalDate = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

describe("OrganizerDashboard edit and delete actions", () => {
  let container;
  let root;
  let alertSpy;
  let confirmSpy;
  let fetchMock;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
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
    jest.clearAllMocks();
  });

  const renderDashboard = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<OrganizerDashboard />);
    });
    await act(async () => {
      await flushPromises();
    });
    await act(async () => {
      await flushPromises();
    });
  };

  const getButtonByText = (text) =>
    Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === text
    );

  const getSectionByTitle = (title) =>
    Array.from(
      container.querySelectorAll("section.posted-events-section")
    ).find((section) => section.querySelector("h3")?.textContent === title);

  it("fetches posted events and groups them into upcoming and past", async () => {
    const today = new Date();
    const upcomingDate = new Date(today);
    upcomingDate.setDate(today.getDate() + 1);
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 1);

    const upcoming = {
      ...futureEvent,
      id: "upcoming-1",
      title: "Upcoming Feast",
      date: formatLocalDate(upcomingDate),
    };
    const past = {
      ...futureEvent,
      id: "past-1",
      title: "Past Feast",
      date: formatLocalDate(pastDate),
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posted: [upcoming, past] }),
    });

    await renderDashboard();

    const upcomingSection = getSectionByTitle("Upcoming Events");
    const pastSection = getSectionByTitle("Past Events");

    expect(upcomingSection?.textContent).toContain(upcoming.title);
    expect(upcomingSection?.textContent).not.toContain(past.title);
    expect(pastSection?.textContent).toContain(past.title);
    expect(pastSection?.textContent).not.toContain(upcoming.title);
  });

  it("navigates to edit event when Edit is clicked", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posted: [futureEvent] }),
    });

    await renderDashboard();

    const editButton = getButtonByText("Edit");
    expect(editButton).toBeTruthy();

    await act(async () => {
      editButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });

    expect(mockNavigate).toHaveBeenCalledWith(`/editevent/${futureEvent.id}`);
  });

  it("alerts and removes the event when delete succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posted: [futureEvent] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "deleted" }),
      });

    await renderDashboard();

    const deleteButton = getButtonByText("Delete");
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      "This event has reserved attendees. Delete it and notify them anyway?"
    );
    expect(alertSpy).toHaveBeenCalledWith("Event deleted successfully.");
    expect(container.textContent).not.toContain(futureEvent.title);
  });

  it("alerts and keeps the event when delete fails", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posted: [futureEvent] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Deletion failed" }),
      });

    await renderDashboard();

    const deleteButton = getButtonByText("Delete");
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      "This event has reserved attendees. Delete it and notify them anyway?"
    );
    expect(alertSpy).toHaveBeenCalledWith("Deletion failed");
    expect(container.textContent).toContain(futureEvent.title);
  });
});
