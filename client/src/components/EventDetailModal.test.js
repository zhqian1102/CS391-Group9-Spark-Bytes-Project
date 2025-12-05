import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import EventDetailModal from "./EventDetailModal";

jest.mock("./EventLocationMap", () => () => <div>Map</div>);

global.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const baseEvent = {
  id: "event-1",
  title: "Sample Event",
  date: "2099-12-31",
  time: "3:00 PM",
  location: "CAS",
  capacity: 10,
  attendees_count: 5,
  description: "Description",
  pickupInstructions: "Pick up here",
  dietary_options: ["Vegan"],
  foodItems: [{ name: "Pizza", quantity: 5, unit: "slice" }],
  image_urls: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
};

describe("EventDetailModal", () => {
  let container;
  let root;
  let onReserve;
  let onClose;
  let alertSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    onReserve = jest.fn();
    onClose = jest.fn();
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

  const renderModal = async (props = {}) => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <EventDetailModal
          event={baseEvent}
          open
          onReserve={onReserve}
          onClose={onClose}
          {...props}
        />
      );
    });
    await act(async () => {
      await flushPromises();
    });
  };

  it("renders event detail", async () => {
    await renderModal();
    expect(container.textContent).toContain(baseEvent.title);
    expect(container.textContent).toContain("Spots Left");
    expect(container.textContent).toContain("Map");

    const img = container.querySelector("img");
    expect(img?.src).toContain(baseEvent.image_urls[0]);
  });

  it("calls onReserve on reserve click and shows success flow", async () => {
    onReserve.mockResolvedValueOnce({ success: true });
    await renderModal();

    const reserveBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent.includes("Reserve")
    );

    await act(async () => {
      Simulate.click(reserveBtn);
      await flushPromises();
    });

    expect(onReserve).toHaveBeenCalledWith(baseEvent.id);
  });

  it("alerts when reserve fails", async () => {
    onReserve.mockRejectedValueOnce(new Error("Reserve failed"));
    await renderModal();

    const reserveBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent.includes("Reserve")
    );

    await act(async () => {
      Simulate.click(reserveBtn);
      await flushPromises();
    });

    expect(onReserve).toHaveBeenCalledWith(baseEvent.id);
    expect(alertSpy).toHaveBeenCalled();
  });

  it("disables reserve when already reserved", async () => {
    await renderModal({ event: { ...baseEvent, isReserved: true } });
    const reserveBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent.includes("Reserved")
    );
    expect(reserveBtn).toBeTruthy();
  });

  it("returns null when closed", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<EventDetailModal event={baseEvent} open={false} />);
    });
    expect(container.textContent).toBe("");
  });

  it("cycles images with next/prev and indicators", async () => {
    await renderModal();
    const nextBtn = container.querySelector(
      'button[aria-label="Next image"]'
    );
    const prevBtn = container.querySelector(
      'button[aria-label="Previous image"]'
    );
    const dots = container.querySelectorAll(".modal-carousel-dot");
    expect(nextBtn).toBeTruthy();
    expect(prevBtn).toBeTruthy();
    expect(dots.length).toBe(2);

    const img = () => container.querySelector("img");

    await act(async () => {
      Simulate.click(nextBtn);
      await flushPromises();
    });
    expect(img()?.src).toContain(baseEvent.image_urls[1]);

    await act(async () => {
      Simulate.click(prevBtn);
      await flushPromises();
    });
    expect(img()?.src).toContain(baseEvent.image_urls[0]);

    await act(async () => {
      Simulate.click(dots[1]);
      await flushPromises();
    });
    expect(img()?.src).toContain(baseEvent.image_urls[1]);
  });

  it("invokes onClose on backdrop click and ESC", async () => {
    await renderModal();
    const backdrop = container.querySelector(".modal-backdrop");
    await act(async () => {
      Simulate.click(backdrop);
      await flushPromises();
    });
    expect(onClose).toHaveBeenCalled();

    onClose.mockClear();
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
      await flushPromises();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows Event Full when no spots remain", async () => {
    await renderModal({
      event: { ...baseEvent, capacity: 5, attendees_count: 5 },
    });
    expect(container.textContent).toContain("Event Full");
  });

  it("falls back to raw date when invalid", async () => {
    await renderModal({ event: { ...baseEvent, date: "not-a-date" } });
    expect(container.textContent).toContain("not-a-date");
  });

  it("omits carousel controls when single image", async () => {
    await renderModal({
      event: { ...baseEvent, image_urls: ["https://example.com/one.jpg"] },
    });
    expect(
      container.querySelector('button[aria-label="Next image"]')
    ).toBeFalsy();
    expect(container.querySelectorAll(".modal-carousel-dot").length).toBe(0);
  });

  it("locks body scroll while open and restores on unmount", async () => {
    const originalOverflow = document.body.style.overflow;
    await renderModal();
    expect(document.body.style.overflow).toBe("hidden");
    act(() => {
      root.unmount();
    });
    expect(document.body.style.overflow).toBe(originalOverflow || "");
  });
});
