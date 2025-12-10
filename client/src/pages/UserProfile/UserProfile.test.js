import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import UserProfile from "./UserProfile";
import { useAuth } from "../../context/AuthContext";

jest.mock("../../components/NavigationBar", () => () => <div>Navigation</div>);
jest.mock("../../components/Footer", () => () => <div>Footer</div>);

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@bu.edu",
  userType: "student",
  dietaryPreferences: ["Vegan"],
  profilePicture: null,
};

describe("UserProfile", () => {
  let container;
  let root;
  let alertSpy;
  let updateProfileMock;
  let logoutMock;
  let refreshUserMock;
  let OriginalFileReader;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    updateProfileMock = jest.fn();
    logoutMock = jest.fn();
    refreshUserMock = jest.fn();
    useAuth.mockReturnValue({
      user: mockUser,
      updateProfile: updateProfileMock,
      logout: logoutMock,
      refreshUser: refreshUserMock,
    });
    mockNavigate.mockClear();
    OriginalFileReader = global.FileReader;
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
    alertSpy.mockRestore();
    global.FileReader = OriginalFileReader;
    jest.clearAllMocks();
  });

  const renderPage = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<UserProfile />);
    });
    await act(async () => {
      await flushPromises();
    });
  };

  const clickButton = async (text, selector) => {
    let btn = null;
    if (selector) {
      btn = container.querySelector(selector);
    }
    if (!btn) {
      btn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent.includes(text)
      );
    }
    await act(async () => {
      btn?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });
  };

  it("redirects to login when user is missing", async () => {
    useAuth.mockReturnValueOnce({
      user: null,
      updateProfile: updateProfileMock,
      logout: logoutMock,
      refreshUser: refreshUserMock,
    });

    await renderPage();

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("toggles edit mode and saves profile", async () => {
    updateProfileMock.mockResolvedValue({ success: true });

    await renderPage();

    await clickButton("Edit Profile");

    const nameInput = container.querySelector('input[name="name"]');
    await act(async () => {
      Simulate.change(nameInput, {
        target: { name: "name", value: "Updated User" },
      });
      await flushPromises();
    });

    await clickButton("Save Changes");

    expect(updateProfileMock).toHaveBeenCalledWith({
      name: "Updated User",
      dietaryPreferences: mockUser.dietaryPreferences,
      profilePicture: null,
    });
    expect(container.textContent).toContain("Profile updated successfully!");
  });

  it("shows error message when save fails", async () => {
    updateProfileMock.mockResolvedValue({
      success: false,
      error: "Update failed",
    });

    await renderPage();
    await clickButton("Edit Profile");
    await clickButton("Save Changes");

    expect(container.textContent).toContain("Update failed");
  });

  it("updates dietary preferences only while editing", async () => {
    await renderPage();
    await clickButton("Edit Profile");

    const veganButton = Array.from(
      container.querySelectorAll("button")
    ).find((btn) => btn.textContent === "Vegan");
    const kosherButton = Array.from(
      container.querySelectorAll("button")
    ).find((btn) => btn.textContent === "Kosher");

    expect(veganButton.className).toContain("selected");
    expect(kosherButton.className).not.toContain("selected");

    await clickButton("Vegan");
    await clickButton("Kosher");

    expect(veganButton.className).not.toContain("selected");
    expect(kosherButton.className).toContain("selected");
  });

  it("clears edits and messages on cancel", async () => {
    await renderPage();
    await clickButton("Edit Profile");

    const fileInput = container.querySelector("#profile-image-upload");
    const badFile = new File(["oops"], "oops.txt", { type: "text/plain" });

    await act(async () => {
      Simulate.change(fileInput, { target: { files: [badFile] } });
      await flushPromises();
    });
    expect(container.textContent).toContain(
      "Please select a valid image (JPG, PNG, GIF, WebP, or SVG)"
    );

    const nameInput = container.querySelector('input[name="name"]');
    await act(async () => {
      Simulate.change(nameInput, {
        target: { name: "name", value: "Another Name" },
      });
      await flushPromises();
    });
    expect(nameInput.value).toBe("Another Name");

    await clickButton("Cancel", ".btn-secondary");

    expect(nameInput.value).toBe(mockUser.name);
    expect(container.textContent).not.toContain("Please select a valid image");
    expect(container.textContent).not.toContain("Save Changes");
  });

  it("rejects oversized image files", async () => {
    await renderPage();
    await clickButton("Edit Profile");

    const fileInput = container.querySelector("#profile-image-upload");
    const bigFile = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "big.png",
      { type: "image/png" }
    );

    await act(async () => {
      Simulate.change(fileInput, { target: { files: [bigFile] } });
      await flushPromises();
    });

    expect(container.textContent).toContain("Image must be less than 5MB");
  });

  it("renders preview for valid image uploads", async () => {
    global.FileReader = jest.fn(() => {
      return {
        onloadend: null,
        onerror: null,
        readAsDataURL() {
          this.result = "data:image/png;base64,preview";
          this.onloadend?.();
        },
      };
    });

    await renderPage();
    await clickButton("Edit Profile");

    const fileInput = container.querySelector("#profile-image-upload");
    const imageFile = new File(["png"], "avatar.png", { type: "image/png" });

    await act(async () => {
      Simulate.change(fileInput, { target: { files: [imageFile] } });
      await flushPromises();
    });

    const previewImg = container.querySelector("img.profile-picture");
    expect(previewImg).toBeTruthy();
    expect(previewImg.src).toContain("data:image/png;base64,preview");
  });

  it("logs out and navigates to login", async () => {
    await renderPage();
    await clickButton("Logout", ".logout-btn");
    expect(logoutMock).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
