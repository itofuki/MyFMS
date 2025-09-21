import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // async/await を使って非同期処理を記述
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // SupabaseのsignUpメソッドを呼び出す
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        // エラーが発生した場合
        throw error;
      }

      // 成功した場合
      alert("登録確認メールを送信しました。メールボックスをご確認ください。");
      console.log("ユーザー情報:", data.user);

    } catch (error) {
      // エラー処理
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20">
        <h2 className="text-3xl font-bold text-center mb-6 text-cyan-400 drop-shadow-md">
          🚀 Future Register
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm mb-2 text-cyan-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none border border-white/20"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-2 text-cyan-300">Password</label>
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300"
          >
            Register
          </button>
        </form>

        {/* Login link */}
        <p className="text-center mt-6 text-sm text-gray-400">
          Already have an account?{" "}
          {/* <a>タグを<Link>に変更し、hrefをtoに変更 */}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}