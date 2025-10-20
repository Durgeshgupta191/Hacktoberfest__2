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

    // OTP-related state
    pendingEmail: null,
    isVerifyingOTP: false,
    otpSent: false,
    otpResendTimer: 0,

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
            toast.error(error.response?.data?.message || "Signup failed");
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
            toast.error(error.response?.data?.message || "OTP verification failed");
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
            toast.error(error.response?.data?.message || "Failed to resend OTP");
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            get().connectSocket()
            toast.success("Logged in successfully")
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed")
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
            toast.error(error.response?.data?.message || "Google login failed");
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
        } catch (error) {
            console.error("Logout error:", error);
            const message = error.response?.data?.message || "Logout failed";
            toast.error(message);
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message);
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
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    },
}));