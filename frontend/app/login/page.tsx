"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import { MdOutlineMailLock, MdError } from "react-icons/md";
import { Sparkles } from "lucide-react";
import { setCookie, removeCookie, isAuthenticated, setPendingOtpCookie } from "@/lib/auth";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    email: false,
    password: false,
  });
 

  useEffect(() => {
    try {
      if (isAuthenticated()) {
        router.replace("/dashboard");
      }
    } catch {
      // ignore
    }
  }, [router]);

  // Handle bfcache restoration: re-check auth when page is restored from cache
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
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  const handleLogin = async () => {
    // ── Clear stale OTP state from any previous login ────────────
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    localStorage.removeItem("role");
    removeCookie("auth_token");

    const newErrors = {
      email: !email,
      password: !password,
    };

    setErrors(newErrors);

    if (!email || !password) {
      if (!email && !password) {
        toast.error("Email and Password required");
      } else if (!email) {
        toast.error("Email required");
      } else {
        toast.error("Password required");
      }

      return;
    }

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.msg);

        localStorage.setItem("email", email);
        setCookie("auth_email", email);
        setPendingOtpCookie(email);

        router.push("/verify-otp");
      } else {
        toast.error(data.msg);

        if (data.error === "email") {
          setErrors({
            email: true,
            password: false,
          });
        } else if (data.error === "password") {
          setErrors({
            email: false,
            password: true,
          });
        }
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B1120] text-white overflow-hidden">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center border-r border-white/10 px-16">
        {/* BLUR EFFECTS */}
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-purple-700/20 blur-[140px] rounded-full" />

        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-blue-600/20 blur-[140px] rounded-full" />

        <div className="relative z-10 max-w-xl">
          {/* LOGO */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-[#4F0DCB] flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Sparkles size={24} />
            </div>

            <h1 className="text-3xl font-bold tracking-wide">
              User Management
            </h1>
          </div>

          {/* TITLE */}
          <h2 className="text-5xl font-bold leading-[65px]">
            Manage Users
            <br />
            With Modern UI
          </h2>

          {/* DESCRIPTION */}
          <p className="text-gray-400 mt-7 text-[16px] leading-8 max-w-lg">
            Secure admin dashboard with permissions, roles, OTP authentication
            and modern user management system.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-[480px] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px]">
          {/* HEADER */}
          <div className="mb-10">
            <p className="text-gray-400 text-sm tracking-wide">Welcome Back</p>

            <h1 className="text-4xl font-bold mt-3">Login</h1>

            <p className="text-gray-500 mt-3 text-sm leading-6">
              Login to continue dashboard access
            </p>
          </div>

          {/* FORM */}
          <div className="flex flex-col gap-7">
            {/* EMAIL */}
            <div className="flex flex-col gap-3">
              <label className="text-[14px] text-gray-300 font-medium">
                Email
              </label>

              <div
                className={`flex items-center h-[46px] px-4 rounded-xl bg-white/5 border transition-all ${
                  errors.email ? "border-red-500" : "border-white/10"
                }`}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({
                      ...errors,
                      email: false,
                    });
                  }}
                  className="flex-1 bg-transparent outline-none text-white text-[14px] placeholder:text-gray-500"
                />

                {errors.email ? (
                  <MdError className="text-red-500 text-[18px]" />
                ) : (
                  <MdOutlineMailLock className="text-gray-400 text-[18px]" />
                )}
              </div>
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col gap-3">
              <label className="text-[14px] text-gray-300 font-medium">
                Password
              </label>

              <div
                className={`flex items-center h-[46px] px-4 rounded-xl bg-white/5 border transition-all ${
                  errors.password ? "border-red-500" : "border-white/10"
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    setErrors({
                      ...errors,
                      password: false,
                    });
                  }}
                  className="flex-1 bg-transparent outline-none text-white text-[14px] placeholder:text-gray-500"
                />

                {errors.password ? (
                  <MdError className="text-red-500 text-[18px]" />
                ) : showPassword ? (
                  <IoIosEyeOff
                    onClick={() => {
                      setShowPassword(false);
                    }}
                    className="text-gray-400 text-[18px] cursor-pointer"
                  />
                ) : (
                  <IoIosEye
                    onClick={() => {
                      setShowPassword(true);
                    }}
                    className="text-gray-400 text-[18px] cursor-pointer"
                  />
                )}
              </div>
            </div>

            {/* BUTTON */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleLogin}
                className="w-[220px] h-[46px] z-20 rounded-xl bg-[#4F0DCB] hover:bg-[#5b21d4] transition-all duration-300 font-medium text-[14px] shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                Send OTP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
