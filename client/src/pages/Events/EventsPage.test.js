import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import EventsPage from "./EventsPage";
import supabase from "../../config/supabase.js";

const mockNavigate = jest.fn();

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "user@bu.edu" } }),
}));

jest.mock("../../components/NavigationBar", () => () => (
  <div data-testid="navigation" />
));
jest.mock("../../components/Footer", () => () => <div data-testid="footer" />);
jest.mock("../../components/EventDetailModal", () => (props) => (
  <div data-testid="event-modal" data-open={props.open} />
));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: "" }),
  };
});

jest.mock("../../config/supabase.js", () => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: mockSupabase,
    APP_API_URL: "http://localhost:5001",
  };
});

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("EventsPage", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    mockNavigate.mockReset();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "token-123" } },
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    container = null;
    jest.clearAllMocks();
    global.fetch = undefined;
  });

  test("loads events and renders reserved status", async () => {
    const eventResponse = {
      events: [
        {
          id: 1,
          title: "Pizza Party",
          date: "2099-12-31",
          time: "3:00 PM - 5:00 PM",
          location: "GSU",
          capacity: 10,
          attendees_count: 3,
          dietary_options: ["Vegan"],
          food_items: [{ item: "Pizza", qty: "5 boxes" }],
          image_urls: [],
        },
      ],
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => eventResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ reservedEventIds: [1] }),
      });

    await act(async () => {
      root.render(<EventsPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5001/api/events",
      { headers: { Authorization: "Bearer token-123" } }
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5001/api/events/reserved/me",
      { headers: { Authorization: "Bearer token-123" } }
    );

    expect(container.textContent).toContain("Available Food Events");
    expect(container.textContent).toContain("Pizza Party");
    expect(container.textContent).toContain("7 Spots Left");
    expect(container.textContent).toContain("1 events available");
    expect(container.textContent).toContain("Reserved");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
