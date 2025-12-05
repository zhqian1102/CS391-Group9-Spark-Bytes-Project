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
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
    alertSpy.mockRestore();
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

  it("logs out and navigates to login", async () => {
    await renderPage();
    await clickButton("Logout", ".logout-btn");
    expect(logoutMock).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
