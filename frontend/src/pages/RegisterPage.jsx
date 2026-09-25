import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import api from "../services/api";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      const data = res.data?.data;
      if (data) {
        login(data);
        addToast("Account created! 🎉");
        navigate("/");
      } else {
        addToast("Invalid response from server", "error");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration failed. Please try again.";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <GlassCard className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-glow flex items-center justify-center text-lg font-bold"
          >
            AI
          </motion.div>
          <h1 className="text-xl font-semibold text-slate-50">
            Create your AI Interview Coach account
          </h1>
          <p className="text-xs text-slate-400 text-center">
            Track your interview progress, get AI feedback, and build real
            confidence for placements.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="At least 8 characters"
            />
          </div>
          <PrimaryButton
            type="submit"
            className="w-full mt-2 gap-2"
            disabled={loading}
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account..." : "Sign up"}
          </PrimaryButton>
        </form>

        <div className="text-xs text-slate-400 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-300 hover:text-indigo-200 underline-offset-2 underline"
          >
            Login
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default RegisterPage;

