"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { PiPasswordBold } from "react-icons/pi";
import { MdError } from "react-icons/md";
import { ShieldCheck } from "lucide-react";
import { setAuthCookie, isAuthenticated, clearPendingOtpCookie } from "@/lib/auth";

export default function VerifyOtp() {
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState(false);

  // ── Auth check (background, no loader) ───────────────────────
  useEffect(() => {
    try {
      if (isAuthenticated()) {
        router.replace("/dashboard");
      }
    } catch {
      // ignore
    }

    const storedEmail = localStorage.getItem("email");
    if (storedEmail) setEmail(storedEmail);
  }, [router]);

  // Handle bfcache restoration: re-check auth and restore email state
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        try {
          if (isAuthenticated()) {
            router.replace("/dashboard");
          }
        } catch {
          // ignore
        }

        const storedEmail = localStorage.getItem("email");
        if (storedEmail) setEmail(storedEmail);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  // ── Always render form (no loading state) ────────────────────
  const handleVerify = async () => {
    if (!otp) {
      setErrors(true);
      toast.error("Please enter OTP");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("permissions", JSON.stringify(data.permissions));
        localStorage.setItem("role", data.role);
        setAuthCookie(data.token);
        clearPendingOtpCookie();

        toast.success("Login successful!");
        router.replace("/dashboard");
      } else {
        setErrors(true);
        toast.error(data.msg);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B1120] text-white overflow-hidden">

      {/* LEFT SIDE (same as login style) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center border-r border-white/10 px-16">

        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-purple-700/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-blue-600/20 blur-[140px] rounded-full" />

        <div className="relative z-10 max-w-xl">

          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-[#4F0DCB] flex items-center justify-center shadow-lg">
              <ShieldCheck size={24} />
            </div>

            <h1 className="text-3xl font-bold">OTP Verification</h1>
          </div>

          <h2 className="text-5xl font-bold leading-[65px]">
            Secure Your <br /> Login Access
          </h2>

          <p className="text-gray-400 mt-7 text-[16px] leading-8 max-w-lg">
            Enter the OTP sent to your email to continue securely into dashboard.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE (EXACT SAME STRUCTURE AS LOGIN) */}
      <div className="w-full lg:w-[480px] flex items-center justify-center px-6 py-10">

        <div className="w-full max-w-[360px]">

          {/* HEADER */}
          <div className="mb-10">
            <p className="text-gray-400 text-sm tracking-wide">
              Two Factor Authentication
            </p>

            <h1 className="text-4xl font-bold mt-3">Verify OTP</h1>

            <p className="text-gray-500 mt-3 text-sm leading-6">
              Enter code sent to your email
            </p>
          </div>

          {/* FORM */}
          <div className="flex flex-col gap-7">

            {/* EMAIL DISPLAY (same style as login input block) */}
            <div className="flex flex-col gap-3">

              <label className="text-[14px] text-gray-300 font-medium">
                Email
              </label>

              <div className="flex items-center h-[46px] px-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[14px]">
                {email}
              </div>
            </div>

            {/* OTP INPUT */}
            <div className="flex flex-col gap-3">

              <label className="text-[14px] text-gray-300 font-medium">
                OTP Code
              </label>

              <div
                className={`flex items-center h-[46px] px-4 rounded-xl bg-white/5 border transition-all ${
                  errors ? "border-red-500" : "border-white/10"
                }`}
              >
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setErrors(false);
                  }}
                  className="flex-1 bg-transparent outline-none text-white text-[14px] placeholder:text-gray-500"
                />

                {errors ? (
                  <MdError className="text-red-500 text-[18px]" />
                ) : (
                  <PiPasswordBold className="text-gray-400 text-[18px]" />
                )}
              </div>
            </div>

            {/* BUTTON (same as login) */}
            <div className="pt-2 flex justify-center items-center">
              <button
                onClick={handleVerify}
                className="w-[220px] h-[46px] z-20 rounded-xl bg-[#4F0DCB] hover:bg-[#5b21d4] transition-all duration-300 font-medium text-[14px] shadow-lg shadow-purple-900/30 hover:cursor-pointer"
              >
                Verify OTP
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
