import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import EditEventPage from "./EditEvent";
import { useAuth } from "../../context/AuthContext";

jest.mock("../../components/NavigationBar", () => () => <div>Navigation</div>);
jest.mock("../../components/Footer", () => () => <div>Footer</div>);

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "event-123" }),
}));

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn(() => ({ data: { publicUrl: "https://img" } }));

jest.mock("../../config/supabase.js", () => ({
  __esModule: true,
  default: {
    auth: { getSession: jest.fn() },
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  },
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

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const baseEvent = {
  id: "event-123",
  title: "Edit Me",
  location: "CAS",
  date: "2099-12-31",
  time: "3:00 PM",
  capacity: 20,
  food_items: [{ item: "Pizza", qty: "5" }],
  dietary_options: ["Vegan"],
  pickup_instructions: "Bring ID",
  description: "Details",
  image_urls: ["https://example.com/img.png"],
};

describe("EditEventPage validation", () => {
  let container;
  let root;
  let alertSpy;
  let fetchMock;
  let consoleErrorSpy;
  let setFiles;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.URL.createObjectURL = jest.fn(() => "blob://img");
    global.URL.revokeObjectURL = jest.fn();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    mockNavigate.mockClear();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
    useAuth.mockReturnValue({ user: { id: "user", name: "Tester" } });
    setFiles = (input, files) => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: files,
      });
    };
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
      root.render(<EditEventPage />);
    });
    await act(async () => {
      await flushPromises();
    });
  };

  const clickSave = async () => {
    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Save Changes"
    );
    expect(saveButton).toBeTruthy();
    await act(async () => {
      saveButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });
  };

  it("alerts when no images are present", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...baseEvent, image_urls: [] }),
    });

    await renderPage();
    await clickSave();

    expect(alertSpy).toHaveBeenCalledWith("Please add at least one image.");
  });

  it("alerts when time is missing AM/PM", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...baseEvent, time: "15:00" }),
    });

    await renderPage();
    await clickSave();

    expect(alertSpy).toHaveBeenCalledWith(
      "Time must include AM or PM (e.g., 3:00 PM)."
    );
  });

  it("alerts when required fields are missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...baseEvent,
        dietary_options: [],
        image_urls: ["https://example.com/img.png"],
        food_items: [{ item: "", qty: "" }],
      }),
    });

    await renderPage();
    await clickSave();

    expect(alertSpy).toHaveBeenCalledWith(
      "Please complete all required fields, including title, location, date, time, capacity, food items, and at least one dietary option."
    );
  });

  it("handles fetch failure when loading event", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "load failed" }),
    });

    await renderPage();

    expect(alertSpy).toHaveBeenCalledWith("Failed to load event.");
    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  it("handles submission failure", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => baseEvent,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "update failed" }),
      });

    await renderPage();
    await clickSave();

    expect(alertSpy).toHaveBeenCalledWith("update failed");
  });

  it("enforces max images and rejects non-images", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...baseEvent, image_urls: [] }),
    });

    await renderPage();

    const fileInput = container.querySelector("#image-upload");
    const imageFile = new File(["img"], "img.png", { type: "image/png" });
    const badFile = new File(["txt"], "note.txt", { type: "text/plain" });

    await act(async () => {
      setFiles(fileInput, [badFile]);
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      await flushPromises();
    });
    expect(alertSpy).toHaveBeenCalledWith("note.txt is not an image file");

    alertSpy.mockClear();
    await act(async () => {
      setFiles(fileInput, Array(6).fill(imageFile));
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      await flushPromises();
    });
    expect(alertSpy).toHaveBeenCalled();
  });

  it("requires login before save", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => baseEvent,
    });

    await renderPage();
    expect(alertSpy).toHaveBeenCalledWith("You must be logged in.");
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("submits successfully when inputs are valid", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => baseEvent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "updated" }),
      });

    await renderPage();
    await clickSave();

    expect(fetchMock).toHaveBeenLastCalledWith(
      `${process.env.REACT_APP_API_URL}/api/events/${baseEvent.id}`,
      expect.objectContaining({ method: "PUT" })
    );
    expect(alertSpy).toHaveBeenCalledWith("Event updated successfully!");
    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  it("allows adding food items and toggling dietary options", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => baseEvent,
    });

    await renderPage();

    const addBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "+"
    );
    expect(addBtn).toBeTruthy();
    await act(async () => {
      Simulate.click(addBtn);
      await flushPromises();
    });
    const rows = container.querySelectorAll(".food-section .form-row");
    expect(rows.length).toBeGreaterThan(1);

    const veganButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Vegan"
    );
    await act(async () => {
      Simulate.click(veganButton);
      await flushPromises();
    });
    expect(veganButton.className).not.toContain("selected");
  });

  it("removes existing and new images and uploads new ones on save", async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...baseEvent, image_urls: ["existing.jpg"] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "updated" }),
      });

    await renderPage();

    const removeExisting = container.querySelector(".remove-image-btn");
    await act(async () => {
      Simulate.click(removeExisting);
      await flushPromises();
    });
    expect(container.textContent).toContain("Add Images (0/5)");

    const fileInput = container.querySelector("#image-upload");
    const imageFile = new File(["img"], "img.png", { type: "image/png" });
    await act(async () => {
      setFiles(fileInput, [imageFile]);
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      await flushPromises();
    });

    const removeNew = container.querySelector(".remove-image-btn");
    await act(async () => {
      Simulate.click(removeNew);
      await flushPromises();
    });
    expect(container.querySelector(".new-image")).toBeFalsy();

    await act(async () => {
      setFiles(fileInput, [imageFile]);
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      await flushPromises();
    });

    await clickSave();

    expect(mockUpload).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenLastCalledWith(
      `${process.env.REACT_APP_API_URL}/api/events/${baseEvent.id}`,
      expect.objectContaining({ method: "PUT" })
    );
  });
});
