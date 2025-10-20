import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  typingUsers: {},

  // OTP-related state
  pendingEmail: null,
  isVerifyingOTP: false,
  otpSent: false,
  otpResendTimer: 0,

  // Helper to extract error message safely
  _getErrorMessage: (error, fallback = "An error occurred") => {
    if (!error) return fallback;
    if (error.response && error.response.data) {
      return (
        error.response.data.message ||
        error.response.data.error ||
        JSON.stringify(error.response.data) ||
        fallback
      );
    }
    if (error.message) return error.message;
    return String(error);
  },

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
      console.log("Error in checkAuth: ", error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      // Backend should return the email and indicate OTP was sent
      set({ pendingEmail: res.data.email, otpSent: true });
      toast.success("OTP sent to your email!");
    } catch (error) {
      const msg = get()._getErrorMessage(error, "Signup failed");
      toast.error(msg);
      console.log("Error in signup: ", error);
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifyOTP: async (otp) => {
    set({ isVerifyingOTP: true });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", {
        email: get().pendingEmail,
        otp,
      });
      set({ authUser: res.data, pendingEmail: null, otpSent: false });
      toast.success("Email verified! Logged in successfully");
      get().connectSocket();
    } catch (error) {
      const msg = get()._getErrorMessage(error, "OTP verification failed");
      toast.error(msg);
      console.log("Error in verifyOTP: ", error);
    } finally {
      set({ isVerifyingOTP: false });
    }
  },

  resendOTP: async () => {
    try {
      await axiosInstance.post("/auth/resend-otp", {
        email: get().pendingEmail,
      });
      set({ otpResendTimer: 60 });
      toast.success("OTP resent to your email");

      // Countdown timer
      const interval = setInterval(() => {
        set((state) => {
          const newTimer = state.otpResendTimer - 1;
          if (newTimer <= 0) clearInterval(interval);
          return { otpResendTimer: newTimer };
        });
      }, 1000);
    } catch (error) {
      const msg = get()._getErrorMessage(error, "Failed to resend OTP");
      toast.error(msg);
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      get().connectSocket();
      toast.success("Logged in successfully");
    } catch (error) {
      const msg = get()._getErrorMessage(error, "Login failed");
      toast.error(msg);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  googleLogin: async (googleToken) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/google-login", {
        token: googleToken,
      });
      set({ authUser: res.data });
      toast.success("Logged in successfully!");
      get().connectSocket();
    } catch (error) {
      const msg = get()._getErrorMessage(error, "Google login failed");
      toast.error(msg);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();

      // Clear encryption data
      try {
        const mod = await import("./useEncryptionStore");
        if (
          mod &&
          mod.useEncryptionStore &&
          typeof mod.useEncryptionStore.getState === "function"
        ) {
          const clearFn = mod.useEncryptionStore.getState().clearEncryptionData;
          if (typeof clearFn === "function") {
            clearFn();
          }
        }
      } catch (err) {
        console.warn("Unable to clear encryption data on logout:", err);
      }
    } catch (error) {
      const msg = get()._getErrorMessage(error, "Logout failed");
      toast.error(msg);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      const msg = get()._getErrorMessage(error, "Failed to update profile");
      toast.error(msg);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      withCredentials: true,
    });
    socket.connect();
    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("userTyping", ({ userId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [userId]: true },
      }));
    });

    socket.on("userStopTyping", ({ userId }) => {
      set((state) => {
        const newTypingUsers = { ...state.typingUsers };
        delete newTypingUsers[userId];
        return { typingUsers: newTypingUsers };
      });
    });

    // Global handlers for incoming messages
    socket.on("newMessage", async (message) => {
      try {
        console.debug("[socket] newMessage received", message);
        const mod = await import("./useChatStore");
        const chatStore = mod.useChatStore;
        const currentUser = get().authUser;
        if (!chatStore || !currentUser) return;

        const selectedUser = chatStore.getState().selectedUser;
        if (selectedUser && message.senderId === selectedUser._id) {
          chatStore.setState((s) => ({ messages: [...s.messages, message] }));
        } else {
          chatStore.setState((s) => ({ messages: [...s.messages, message] }));
          if (message.senderId !== currentUser._id) {
            chatStore.getState().notifyNewMessage(message, { isGroup: false });
          }
        }
      } catch (err) {
        console.warn("global newMessage handler error", err);
      }
    });

    socket.on("newGroupMessage", async (message) => {
      try {
        console.debug("[socket] newGroupMessage received", message);
        const mod = await import("./useChatStore");
        const chatStore = mod.useChatStore;
        const currentUser = get().authUser;
        if (!chatStore || !currentUser) return;

        const selectedGroup = chatStore.getState().selectedGroup;
        chatStore.setState((s) => ({
          groupMessages: [...s.groupMessages, message],
        }));

        if (!selectedGroup || message.groupId !== selectedGroup._id) {
          if (message.senderId !== currentUser._id) {
            chatStore.getState().notifyNewMessage(message, { isGroup: true });
          }
        }
      } catch (err) {
        console.warn("global newGroupMessage handler error", err);
      }
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));