import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import PostEvent from "./PostEvent";
import supabase from "../../config/supabase.js";

const API_URL = process.env.REACT_APP_API_URL;
if (!API_URL) {
  throw new Error("API_URL error.");
}
const mockNavigate = jest.fn();

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../components/NavigationBar", () => () => (
  <div data-testid="navigation" />
));
jest.mock("../../components/Footer", () => () => <div data-testid="footer" />);

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

jest.mock("../../config/supabase.js", () => {
  const mockSupabase = {
    auth: { getSession: jest.fn() },
    storage: { from: jest.fn() },
  };
  return {
    __esModule: true,
    default: mockSupabase,
    APP_API_URL: process.env.REACT_APP_API_URL,
  };
});

describe("PostEvent", () => {
  let container;
  let root;
  let alertSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = jest.fn();
    mockNavigate.mockReset();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "fake-token" } },
    });
    const mockUpload = jest
      .fn()
      .mockResolvedValue({ data: { path: "path" }, error: null });
    const mockGetPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: "http://example.com/image.png" },
    });
    supabase.storage.from = jest.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 123 }),
    });
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    container = null;
    jest.clearAllMocks();
    global.fetch = undefined;
    consoleErrorSpy.mockRestore();
  });

  test("submits a new event and navigates back to events list", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const mockFile = new File(["dummy"], "test.png", { type: "image/png" });

    const setValue = (el, value) => {
      el.value = value;
      Simulate.change(el, { target: { value } });
    };

    const titleInput = container.querySelector(
      'input[placeholder="e.g., Spark! Demo Day"]'
    );
    const locationSelect = container.querySelector("select");
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector(
      'input[placeholder="3:00 PM - 5:00 PM"]'
    );
    const foodItemInput = container.querySelector(
      'input[placeholder="e.g., Cheese Pizza"]'
    );
    const foodQtyInput = container.querySelector(
      'input[placeholder="e.g., 8 Slices"]'
    );
    const capacityInput = container.querySelector(
      'input[placeholder="e.g., 11"]'
    );
    const dietaryButton = container.querySelector("button.dietary-tag");
    const imageInput = container.querySelector('input[type="file"]');
    const form = container.querySelector("form.post-form");

    act(() => {
      setValue(titleInput, "Test Event");
      setValue(locationSelect, "CDS");
      setValue(dateInput, "2099-01-01");
      setValue(timeInput, "1:00 PM - 2:00 PM");
      setValue(foodItemInput, "Pizza");
      setValue(foodQtyInput, "3 boxes");
      setValue(capacityInput, "20");
    });

    act(() => {
      Simulate.click(dietaryButton);
    });

    act(() => {
      Simulate.change(imageInput, { target: { files: [mockFile] } });
    });

    await act(async () => {
      Simulate.submit(form);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/events`);
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer fake-token");

    const payload = JSON.parse(options.body);
    expect(payload.title).toBe("Test Event");
    expect(payload.location).toBe("CDS");
    expect(payload.date).toBe("2099-01-01");
    expect(payload.time).toBe("1:00 PM - 2:00 PM");
    expect(payload.capacity).toBe(20);
    expect(payload.food_items[0]).toEqual({ item: "Pizza", qty: "3 boxes" });
    expect(payload.dietary_options).toContain("Vegan");
    expect(payload.image_urls).toEqual(["http://example.com/image.png"]);

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Event posted successfully")
    );
    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  test("alerts when required fields are missing", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const mockFile = new File(["dummy"], "test.png", { type: "image/png" });
    const locationSelect = container.querySelector("select");
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector(
      'input[placeholder="3:00 PM - 5:00 PM"]'
    );
    const foodItemInput = container.querySelector(
      'input[placeholder="e.g., Cheese Pizza"]'
    );
    const foodQtyInput = container.querySelector(
      'input[placeholder="e.g., 8 Slices"]'
    );
    const capacityInput = container.querySelector(
      'input[placeholder="e.g., 11"]'
    );
    const dietaryButton = container.querySelector("button.dietary-tag");
    const imageInput = container.querySelector('input[type="file"]');
    const form = container.querySelector("form.post-form");

    act(() => {
      Simulate.change(locationSelect, { target: { value: "CDS" } });
      Simulate.change(dateInput, { target: { value: "2099-01-01" } });
      Simulate.change(timeInput, { target: { value: "1:00 PM - 2:00 PM" } });
      Simulate.change(foodItemInput, { target: { value: "Pizza" } });
      Simulate.change(foodQtyInput, { target: { value: "3 boxes" } });
      Simulate.change(capacityInput, { target: { value: "20" } });
      Simulate.click(dietaryButton);
      Simulate.change(imageInput, { target: { files: [mockFile] } });
    });

    await act(async () => {
      Simulate.submit(form);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("complete all required fields")
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("alerts when no event image is provided", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const setValue = (el, value) => {
      el.value = value;
      Simulate.change(el, { target: { value } });
    };

    const titleInput = container.querySelector(
      'input[placeholder="e.g., Spark! Demo Day"]'
    );
    const locationSelect = container.querySelector("select");
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector(
      'input[placeholder="3:00 PM - 5:00 PM"]'
    );
    const foodItemInput = container.querySelector(
      'input[placeholder="e.g., Cheese Pizza"]'
    );
    const foodQtyInput = container.querySelector(
      'input[placeholder="e.g., 8 Slices"]'
    );
    const capacityInput = container.querySelector(
      'input[placeholder="e.g., 11"]'
    );
    const dietaryButton = container.querySelector("button.dietary-tag");
    const form = container.querySelector("form.post-form");

    act(() => {
      setValue(titleInput, "Test Event");
      setValue(locationSelect, "CDS");
      setValue(dateInput, "2099-01-01");
      setValue(timeInput, "1:00 PM - 2:00 PM");
      setValue(foodItemInput, "Pizza");
      setValue(foodQtyInput, "3 boxes");
      setValue(capacityInput, "20");
    });

    act(() => {
      Simulate.click(dietaryButton);
    });

    await act(async () => {
      Simulate.submit(form);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("upload at least one event image")
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("alerts when time is missing AM/PM", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const mockFile = new File(["dummy"], "test.png", { type: "image/png" });
    const setValue = (el, value) => {
      el.value = value;
      Simulate.change(el, { target: { value } });
    };

    const titleInput = container.querySelector(
      'input[placeholder="e.g., Spark! Demo Day"]'
    );
    const locationSelect = container.querySelector("select");
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector(
      'input[placeholder="3:00 PM - 5:00 PM"]'
    );
    const foodItemInput = container.querySelector(
      'input[placeholder="e.g., Cheese Pizza"]'
    );
    const foodQtyInput = container.querySelector(
      'input[placeholder="e.g., 8 Slices"]'
    );
    const capacityInput = container.querySelector(
      'input[placeholder="e.g., 11"]'
    );
    const dietaryButton = container.querySelector("button.dietary-tag");
    const imageInput = container.querySelector('input[type="file"]');
    const form = container.querySelector("form.post-form");

    act(() => {
      setValue(titleInput, "Test Event");
      setValue(locationSelect, "CDS");
      setValue(dateInput, "2099-01-01");
      setValue(timeInput, "13:00 - 14:00");
      setValue(foodItemInput, "Pizza");
      setValue(foodQtyInput, "3 boxes");
      setValue(capacityInput, "20");
      Simulate.click(dietaryButton);
      Simulate.change(imageInput, { target: { files: [mockFile] } });
    });

    await act(async () => {
      Simulate.submit(form);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("include AM or PM")
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("alerts when date is in the past", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const mockFile = new File(["dummy"], "test.png", { type: "image/png" });
    const setValue = (el, value) => {
      el.value = value;
      Simulate.change(el, { target: { value } });
    };

    const titleInput = container.querySelector(
      'input[placeholder="e.g., Spark! Demo Day"]'
    );
    const locationSelect = container.querySelector("select");
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector(
      'input[placeholder="3:00 PM - 5:00 PM"]'
    );
    const foodItemInput = container.querySelector(
      'input[placeholder="e.g., Cheese Pizza"]'
    );
    const foodQtyInput = container.querySelector(
      'input[placeholder="e.g., 8 Slices"]'
    );
    const capacityInput = container.querySelector(
      'input[placeholder="e.g., 11"]'
    );
    const dietaryButton = container.querySelector("button.dietary-tag");
    const imageInput = container.querySelector('input[type="file"]');
    const form = container.querySelector("form.post-form");

    act(() => {
      setValue(titleInput, "Test Event");
      setValue(locationSelect, "CDS");
      setValue(dateInput, "2000-01-01");
      setValue(timeInput, "1:00 PM - 2:00 PM");
      setValue(foodItemInput, "Pizza");
      setValue(foodQtyInput, "3 boxes");
      setValue(capacityInput, "20");
      Simulate.click(dietaryButton);
      Simulate.change(imageInput, { target: { files: [mockFile] } });
    });

    await act(async () => {
      Simulate.submit(form);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("cannot be in the past")
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("does not allow more than max images and shows alert", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const imageInput = container.querySelector('input[type="file"]');
    const files = Array.from({ length: 6 }).map(
      (_, i) => new File(["x"], `img${i}.png`, { type: "image/png" })
    );

    act(() => {
      Simulate.change(imageInput, { target: { files } });
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("only upload")
    );
    expect(container.querySelectorAll(".image-preview")).toHaveLength(0);
  });

  test("rejects non-image files on upload", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const imageInput = container.querySelector('input[type="file"]');
    const badFile = new File(["oops"], "doc.txt", { type: "text/plain" });

    act(() => {
      Simulate.change(imageInput, { target: { files: [badFile] } });
    });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("not an image"));
    expect(container.querySelectorAll(".image-preview")).toHaveLength(0);
  });

  test("removes an uploaded image", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const imageInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy"], "test.png", { type: "image/png" });

    act(() => {
      Simulate.change(imageInput, { target: { files: [file] } });
    });

    expect(container.querySelectorAll(".image-preview")).toHaveLength(1);

    const removeBtn = container.querySelector(".remove-image-btn");
    act(() => {
      removeBtn.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    });

    expect(container.querySelectorAll(".image-preview")).toHaveLength(0);
  });

  test("requires at least one dietary option", async () => {
    await act(async () => {
      root.render(<PostEvent />);
    });

    const mockFile = new File(["dummy"], "test.png", { type: "image/png" });
    const setValue = (el, value) => {
      el.value = value;
      Simulate.change(el, { target: { value } });
    };

    const titleInput = container.querySelector(
      'input[placeholder="e.g., Spark! Demo Day"]'
    );
    const locationSelect = container.querySelector("select");
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector(
      'input[placeholder="3:00 PM - 5:00 PM"]'
    );
    const foodItemInput = container.querySelector(
      'input[placeholder="e.g., Cheese Pizza"]'
    );
    const foodQtyInput = container.querySelector(
      'input[placeholder="e.g., 8 Slices"]'
    );
    const capacityInput = container.querySelector(
      'input[placeholder="e.g., 11"]'
    );
    const imageInput = container.querySelector('input[type="file"]');
    const form = container.querySelector("form.post-form");

    act(() => {
      setValue(titleInput, "Test Event");
      setValue(locationSelect, "CDS");
      setValue(dateInput, "2099-01-01");
      setValue(timeInput, "1:00 PM - 2:00 PM");
      setValue(foodItemInput, "Pizza");
      setValue(foodQtyInput, "3 boxes");
      setValue(capacityInput, "20");
      Simulate.change(imageInput, { target: { files: [mockFile] } });
    });

    await act(async () => {
      Simulate.submit(form);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("select at least one dietary option")
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("alerts when not logged in before submit", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    await act(async () => {
      root.render(<PostEvent />);
    });

    const mockFile = new File(["dummy"], "test.png", { type: "image/png" });
    const setValue = (el, value) => {
      el.value = value;
      Simulate.change(el, { target: { value } });
    };

    const titleInput = container.querySelector(
      'input[placeholder="e.g., Spark! Demo Day"]'
    );
    const locationSelect = container.querySelector("select");
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector(
      'input[placeholder="3:00 PM - 5:00 PM"]'
    );
    const foodItemInput = container.querySelector(
      'input[placeholder="e.g., Cheese Pizza"]'
    );
    const foodQtyInput = container.querySelector(
      'input[placeholder="e.g., 8 Slices"]'
    );
    const capacityInput = container.querySelector(
      'input[placeholder="e.g., 11"]'
    );
    const dietaryButton = container.querySelector("button.dietary-tag");
    const imageInput = container.querySelector('input[type="file"]');
    const form = container.querySelector("form.post-form");

    act(() => {
      setValue(titleInput, "Test Event");
      setValue(locationSelect, "CDS");
      setValue(dateInput, "2099-01-01");
      setValue(timeInput, "1:00 PM - 2:00 PM");
      setValue(foodItemInput, "Pizza");
      setValue(foodQtyInput, "3 boxes");
      setValue(capacityInput, "20");
      Simulate.click(dietaryButton);
      Simulate.change(imageInput, { target: { files: [mockFile] } });
    });

    await act(async () => {
      Simulate.submit(form);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "You must be logged in to post an event."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("alerts when server rejects event creation", async () => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "server says no" }),
    });
    global.fetch = fetchMock;

    await act(async () => {
      root.render(<PostEvent />);
    });

    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { access_token: "fake-token" } },
    });

    const mockFile = new File(["dummy"], "test.png", { type: "image/png" });
    const setValue = (el, value) => {
      el.value = value;
      Simulate.change(el, { target: { value } });
    };

    const titleInput = container.querySelector(
      'input[placeholder="e.g., Spark! Demo Day"]'
    );
    const locationSelect = container.querySelector("select");
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector(
      'input[placeholder="3:00 PM - 5:00 PM"]'
    );
    const foodItemInput = container.querySelector(
      'input[placeholder="e.g., Cheese Pizza"]'
    );
    const foodQtyInput = container.querySelector(
      'input[placeholder="e.g., 8 Slices"]'
    );
    const capacityInput = container.querySelector(
      'input[placeholder="e.g., 11"]'
    );
    const dietaryButton = container.querySelector("button.dietary-tag");
    const imageInput = container.querySelector('input[type="file"]');
    const form = container.querySelector("form.post-form");

    act(() => {
      setValue(titleInput, "Test Event");
      setValue(locationSelect, "CDS");
      setValue(dateInput, "2099-01-01");
      setValue(timeInput, "1:00 PM - 2:00 PM");
      setValue(foodItemInput, "Pizza");
      setValue(foodQtyInput, "3 boxes");
      setValue(capacityInput, "20");
      Simulate.click(dietaryButton);
      Simulate.change(imageInput, { target: { files: [mockFile] } });
    });

    await act(async () => {
      Simulate.submit(form);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to post event")
    );
  });
});
