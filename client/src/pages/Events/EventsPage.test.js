import React, { act } from "react";
import { Simulate } from "react-dom/test-utils";
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

const API_URL = process.env.REACT_APP_API_URL;
if (!API_URL) {
  throw new Error("API_URL is not set.");
}
const mockNavigate = jest.fn();

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../context/AuthContext", () => {
  const mockUseAuth = jest.fn(() => ({
    user: { id: "user-1", email: "user@bu.edu", dietaryPreferences: [] },
  }));
  return {
    __esModule: true,
    useAuth: mockUseAuth,
    __mockUseAuth: mockUseAuth,
  };
});

const { __mockUseAuth: mockUseAuth } = jest.requireMock(
  "../../context/AuthContext"
);

jest.mock("../../components/NavigationBar", () => (props) => (
  <div data-testid="navigation">
    <input
      data-testid="search-input"
      value={props.searchQuery}
      onChange={(e) => props.setSearchQuery(e.target.value)}
    />
  </div>
));
jest.mock("../../components/Footer", () => () => <div data-testid="footer" />);
jest.mock("../../components/EventDetailModal", () => (props) => (
  <div
    data-testid="event-modal"
    data-open={props.open}
    data-event-id={props.event?.id}
  >
    <button
      data-testid="reserve-btn"
      onClick={() => props.onReserve?.(props.event?.id)}
    >
      Reserve
    </button>
    <button data-testid="close-modal" onClick={props.onClose}>
      Close
    </button>
  </div>
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
    APP_API_URL: process.env.REACT_APP_API_URL,
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

    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "user@bu.edu", dietaryPreferences: [] },
    });
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
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/events`, {
      headers: { Authorization: "Bearer token-123" },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/api/events/reserved/me`,
      { headers: { Authorization: "Bearer token-123" } }
    );

    expect(container.textContent).toContain("Available Food Events");
    expect(container.textContent).toContain("Pizza Party");
    expect(container.textContent).toContain("7 Spots Left");
    expect(container.textContent).toContain("1 events available");
    expect(container.textContent).toContain("Reserved");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("renders full state when no spots remain", async () => {
    const eventResponse = {
      events: [
        {
          id: 2,
          title: "Sold Out Event",
          date: "2099-12-31",
          time: "2:00 PM - 3:00 PM",
          location: "GSU",
          capacity: 1,
          attendees_count: 1,
          dietary_options: [],
          food_items: [],
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
        json: async () => ({ reservedEventIds: [] }),
      });

    await act(async () => {
      root.render(<EventsPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    const card = container.querySelector(".event-card.full");
    const button = container.querySelector(".view-detail-btn");

    expect(card).not.toBeNull();
    expect(container.textContent).toContain("Full");
    expect(button).not.toBeNull();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("View Detail");
  });

  test("filters events by search and dietary selection", async () => {
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
          food_items: [],
          image_urls: [],
        },
        {
          id: 2,
          title: "Salad Social",
          date: "2099-12-31",
          time: "4:00 PM - 5:00 PM",
          location: "CAS",
          capacity: 5,
          attendees_count: 1,
          dietary_options: ["Gluten-Free"],
          food_items: [],
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
        json: async () => ({ reservedEventIds: [] }),
      });

    await act(async () => {
      root.render(<EventsPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    const searchInput = container.querySelector('[data-testid="search-input"]');
    const dietarySelect = container.querySelector(".filter-select");

    act(() => {
      searchInput.value = "salad";
      Simulate.change(searchInput, { target: { value: "salad" } });
    });

    expect(container.textContent).toContain("Salad Social");
    expect(container.textContent).not.toContain("Pizza Party");

    act(() => {
      Simulate.change(dietarySelect, { target: { value: "Gluten-Free" } });
    });

    expect(container.textContent).toContain("1 events available");
    expect(container.textContent).toContain("Salad Social");
  });

  test("opens the detail modal when clicking View Detail", async () => {
    const eventResponse = {
      events: [
        {
          id: 3,
          title: "Cake Meetup",
          date: "2099-12-31",
          time: "1:00 PM - 2:00 PM",
          location: "COM",
          capacity: 5,
          attendees_count: 1,
          dietary_options: [],
          food_items: [],
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
        json: async () => ({ reservedEventIds: [] }),
      });

    await act(async () => {
      root.render(<EventsPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    const button = container.querySelector(".view-detail-btn");

    await act(async () => {
      Simulate.click(button);
    });

    expect(container.querySelector('[data-testid="event-modal"]').dataset.open).toBe("true");
  });

  test("shows no-events message when search results are empty", async () => {
    const eventResponse = {
      events: [
        {
          id: 4,
          title: "Sandwich Gathering",
          date: "2099-12-31",
          time: "10:00 AM - 11:00 AM",
          location: "ENG",
          capacity: 10,
          attendees_count: 1,
          dietary_options: [],
          food_items: [],
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
        json: async () => ({ reservedEventIds: [] }),
      });

    await act(async () => {
      root.render(<EventsPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    const searchInput = container.querySelector('[data-testid="search-input"]');

    act(() => {
      searchInput.value = "no-match";
      Simulate.change(searchInput, { target: { value: "no-match" } });
    });

    expect(container.textContent).toContain("0 events available");
    expect(container.textContent).toContain("No events found matching your filters.");
    expect(
      container.querySelector(".clear-filters-btn")
    ).not.toBeNull();
  });

  test("auto-applies user dietary preference and can clear filters", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@bu.edu",
        dietaryPreferences: ["Kosher"],
      },
    });

    const eventResponse = {
      events: [
        {
          id: 5,
          title: "Bagel Brunch",
          date: "2099-12-31",
          time: "9:00 AM - 10:00 AM",
          location: "GSU",
          capacity: 10,
          attendees_count: 2,
          dietary_options: ["Kosher"],
          food_items: [],
          image_urls: [],
        },
        {
          id: 6,
          title: "Non-Kosher Lunch",
          date: "2099-12-31",
          time: "11:00 AM - 12:00 PM",
          location: "CAS",
          capacity: 10,
          attendees_count: 1,
          dietary_options: ["Vegan"],
          food_items: [],
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
        json: async () => ({ reservedEventIds: [] }),
      });

    await act(async () => {
      root.render(<EventsPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    const dietarySelect = container.querySelector(".filter-select");
    expect(dietarySelect.value).toBe("Kosher");
    expect(container.textContent).toContain("Bagel Brunch");
    expect(container.textContent).not.toContain("Non-Kosher Lunch");

    const clearBtn = container.querySelector(".clear-btn");
    await act(async () => {
      Simulate.click(clearBtn);
    });

    expect(dietarySelect.value).toBe("");
    expect(container.textContent).toContain("2 events available");
  });

  test("filters out past events", async () => {
    const today = new Date();
    const pastDate = `${today.getFullYear() - 1}-01-01`;
    const futureDate = `${today.getFullYear() + 1}-01-01`;

    const eventResponse = {
      events: [
        {
          id: 7,
          title: "Past Event",
          date: pastDate,
          time: "1:00 PM - 2:00 PM",
          location: "GSU",
          capacity: 10,
          attendees_count: 1,
          dietary_options: [],
          food_items: [],
          image_urls: [],
        },
        {
          id: 8,
          title: "Future Event",
          date: futureDate,
          time: "1:00 PM - 2:00 PM",
          location: "GSU",
          capacity: 10,
          attendees_count: 1,
          dietary_options: [],
          food_items: [],
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
        json: async () => ({ reservedEventIds: [] }),
      });

    await act(async () => {
      root.render(<EventsPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    expect(container.textContent).toContain("Future Event");
    expect(container.textContent).not.toContain("Past Event");
    expect(container.textContent).toContain("1 events available");
  });

  test("reserves an event via modal and updates counts", async () => {
    window.alert = jest.fn();

    const eventResponse = {
      events: [
        {
          id: 9,
          title: "Cookie Swap",
          date: "2099-12-31",
          time: "6:00 PM - 7:00 PM",
          location: "GSU",
          capacity: 2,
          attendees_count: 0,
          dietary_options: [],
          food_items: [],
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
        json: async () => ({ reservedEventIds: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "reserved" }),
      });

    await act(async () => {
      root.render(<EventsPage />);
    });

    await act(async () => {
      await flushPromises();
    });

    const viewBtn = container.querySelector(".view-detail-btn");
    await act(async () => {
      Simulate.click(viewBtn);
    });

    const reserveBtn = container.querySelector('[data-testid="reserve-btn"]');
    await act(async () => {
      Simulate.click(reserveBtn);
      await flushPromises();
    });

    expect(global.fetch).toHaveBeenLastCalledWith(
      `${API_URL}/api/events/9/reserve`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer token-123",
          "Content-Type": "application/json",
        },
      }
    );

    expect(container.textContent).toContain("Reserved");
    expect(container.textContent).toContain("1 Spots Left");
    expect(window.alert).toHaveBeenCalledWith("Reservation confirmed!");
  });
});
