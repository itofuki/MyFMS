/* src/pages/LoginForm.tsx */

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // SupabaseのsignInWithPasswordメソッドを呼び出す
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      alert("ログインしました！");
      navigate("/mypage");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20">
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-400 drop-shadow-md">
          🔮 Welcome Back
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm mb-2 text-purple-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:outline-none border border-white/20"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-2 text-purple-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:outline-none border border-white/20"
              placeholder="********"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300"
          >
            Login
          </button>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-gray-400">
          Don't have an account?
          <Link to="/register" className="text-purple-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}