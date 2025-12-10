import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import Login from "./Login";
import { useAuth } from "../../context/AuthContext";

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, jest.fn()],
}));

jest.mock("../../components/NavigationBar", () => () => <div>Navigation</div>);
jest.mock("../../components/Footer", () => () => <div>Footer</div>);

global.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Login page", () => {
  let container;
  let root;
  let alertSpy;
  let authMocks;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    mockNavigate.mockClear();
    mockSearchParams = new URLSearchParams();
    authMocks = {
      login: jest.fn(),
      register: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationCode: jest.fn(),
    };
    useAuth.mockReturnValue(authMocks);
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
      root.render(<Login />);
    });
    await act(async () => {
      await flushPromises();
    });
  };

  const setInputValue = async (id, value) => {
    const el = container.querySelector(`#${id}`);
    await act(async () => {
      el.value = value;
      Simulate.change(el, { target: { value, name: el.name, id: el.id } });
      await flushPromises();
    });
  };

  const clickButtonByText = async (text) => {
    const btn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === text
    );
    await act(async () => {
      btn?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await flushPromises();
    });
  };

  const submitForm = async () => {
    const form = container.querySelector("form");
    await act(async () => {
      Simulate.submit(form);
      await flushPromises();
    });
  };

  it("shows error for non-BU email on login", async () => {
    authMocks.login.mockResolvedValue({ success: false, error: "bad creds" });

    await renderPage();

    await setInputValue("email", "user@gmail.com");
    await setInputValue("password", "secret123");
    await submitForm();

    expect(container.textContent).toContain("Please use your BU email address (@bu.edu)");
    expect(authMocks.login).not.toHaveBeenCalled();
  });

  it("shows error when signup passwords do not match", async () => {
    await renderPage();

    await clickButtonByText("Sign Up");

    await setInputValue("name", "Student Tester");
    await setInputValue("email", "student@bu.edu");
    await setInputValue("password", "secret123");
    await setInputValue("confirmPassword", "mismatch");
    expect(container.querySelector("#email").value).toBe("student@bu.edu");
    await submitForm();

    expect(container.textContent).toContain("Passwords do not match. Please try again.");
    expect(authMocks.register).not.toHaveBeenCalled();
  });

  it("logs in successfully and navigates to events", async () => {
    authMocks.login.mockResolvedValue({
      success: true,
      user: { name: "Tester" },
    });

    await renderPage();

    await setInputValue("email", "user@bu.edu");
    await setInputValue("password", "secret123");
    expect(container.querySelector("#email").value).toBe("user@bu.edu");
    await submitForm();

    expect(authMocks.login).toHaveBeenCalledWith("user@bu.edu", "secret123");
    expect(alertSpy).toHaveBeenCalledWith("Login successful! Welcome back, Tester!");
    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  it("shows verification step after signup that needs code", async () => {
    authMocks.register.mockResolvedValue({
      success: true,
      needsVerification: true,
      message: "Code sent",
    });

    await renderPage();

    await clickButtonByText("Sign Up");

    await setInputValue("name", "Student Tester");
    await setInputValue("email", "student@bu.edu");
    await setInputValue("password", "secret123");
    await setInputValue("confirmPassword", "secret123");
    expect(container.querySelector("#email").value).toBe("student@bu.edu");
    await submitForm();

    expect(authMocks.register).toHaveBeenCalledWith(
      "Student Tester",
      "student@bu.edu",
      "secret123",
      "student"
    );
    expect(alertSpy).toHaveBeenCalledWith("Code sent");
    expect(container.textContent).toContain("Verification Code");
    expect(container.textContent).toContain("student@bu.edu");
  });

  it("navigates to login after signup success without verification", async () => {
    authMocks.register.mockResolvedValue({
      success: true,
      needsVerification: false,
      message: "Registered!",
    });

    await renderPage();
    await clickButtonByText("Sign Up");

    await setInputValue("name", "Student Tester");
    await setInputValue("email", "student@bu.edu");
    await setInputValue("password", "secret123");
    await setInputValue("confirmPassword", "secret123");
    await submitForm();

    expect(authMocks.register).toHaveBeenCalledWith(
      "Student Tester",
      "student@bu.edu",
      "secret123",
      "student"
    );
    expect(alertSpy).toHaveBeenCalledWith("Registered!");
    expect(mockNavigate).toHaveBeenCalledWith("/login");

    const submitBtn = container.querySelector('button[type="submit"]');
    expect(submitBtn.textContent).toBe("Login");
  });

  it("shows error when verification code is invalid", async () => {
    authMocks.register.mockResolvedValue({
      success: true,
      needsVerification: true,
      message: "Code sent",
    });
    authMocks.verifyEmail.mockResolvedValue({
      success: false,
      error: "Invalid code",
    });

    await renderPage();
    await clickButtonByText("Sign Up");

    await setInputValue("name", "Student Tester");
    await setInputValue("email", "student@bu.edu");
    await setInputValue("password", "secret123");
    await setInputValue("confirmPassword", "secret123");
    await submitForm();

    await setInputValue("verificationCode", "123456");
    await submitForm();

    expect(authMocks.verifyEmail).toHaveBeenCalledWith(
      "student@bu.edu",
      "123456"
    );
    expect(container.textContent).toContain("Invalid code");
  });

  it("displays login error returned from auth", async () => {
    authMocks.login.mockResolvedValue({ success: false, error: "Invalid credentials" });

    await renderPage();
    await setInputValue("email", "user@bu.edu");
    await setInputValue("password", "wrong");
    await submitForm();

    expect(authMocks.login).toHaveBeenCalledWith("user@bu.edu", "wrong");
    expect(container.textContent).toContain("Invalid credentials");
  });

  it("shows register error when signup fails", async () => {
    authMocks.register.mockResolvedValue({ success: false, error: "Email taken" });

    await renderPage();
    await clickButtonByText("Sign Up");
    await setInputValue("name", "Student Tester");
    await setInputValue("email", "student@bu.edu");
    await setInputValue("password", "secret123");
    await setInputValue("confirmPassword", "secret123");
    await submitForm();

    expect(authMocks.register).toHaveBeenCalled();
    expect(container.textContent).toContain("Email taken");
  });

  it("verifies code successfully and navigates", async () => {
    authMocks.register.mockResolvedValue({
      success: true,
      needsVerification: true,
      message: "Code sent",
    });
    authMocks.verifyEmail.mockResolvedValue({
      success: true,
      message: "Verified",
      user: { name: "Tester" },
    });

    await renderPage();
    await clickButtonByText("Sign Up");
    await setInputValue("name", "Student Tester");
    await setInputValue("email", "student@bu.edu");
    await setInputValue("password", "secret123");
    await setInputValue("confirmPassword", "secret123");
    await submitForm();

    await setInputValue("verificationCode", "123456");
    await submitForm();

    expect(authMocks.verifyEmail).toHaveBeenCalledWith("student@bu.edu", "123456");
    expect(alertSpy).toHaveBeenCalledWith(
      "Verified Welcome to Spark Bytes, Tester!"
    );
    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  it("resends verification code and handles error", async () => {
    authMocks.register.mockResolvedValue({
      success: true,
      needsVerification: true,
      message: "Code sent",
    });
    authMocks.resendVerificationCode
      .mockResolvedValueOnce({ success: true, message: "Resent" })
      .mockResolvedValueOnce({ success: false, error: "No code" });

    await renderPage();
    await clickButtonByText("Sign Up");
    await setInputValue("name", "Student Tester");
    await setInputValue("email", "student@bu.edu");
    await setInputValue("password", "secret123");
    await setInputValue("confirmPassword", "secret123");
    await submitForm(); // enters verification mode

    // first resend success
    await clickButtonByText("Didn't receive the code? Resend");
    expect(authMocks.resendVerificationCode).toHaveBeenCalledWith("student@bu.edu");
    expect(alertSpy).toHaveBeenCalledWith("Resent");

    // second resend failure
    await clickButtonByText("Didn't receive the code? Resend");
    expect(container.textContent).toContain("No code");
  });

  it("honors mode=signup in URL search params", async () => {
    mockSearchParams = new URLSearchParams("mode=signup");
    await renderPage();
    const submitBtn = container.querySelector('button[type=\"submit\"]');
    expect(submitBtn.textContent).toBe("Create Account");
  });
});
