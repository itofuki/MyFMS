/* src/pages/MyPage.tsx */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useScheduledReloader } from "../hooks/useScheduledReloader";
import RotatingCarousel from '../components/RotatingCarousel';

export default function MyPage() {
  const photoItems = [
    { id: 1, title: '時間割', imageUrl: '/images/curriculumIA2.webp' },
    { id: 2, title: '自習室1', imageUrl: '/images/studyroom9.3.webp' },
    { id: 3, title: '自習室2', imageUrl: '/images/studyroom9.4.webp' },
  ];

  const reloadTimes = [
    { hour: 9, minute: 5 },
    { hour: 10, minute: 45 },
    { hour: 13, minute: 10 },
    { hour: 14, minute: 50 },
    { hour: 16, minute: 30 },
    { hour: 18, minute: 10 },
    { hour: 19, minute: 50 },
  ];
  useScheduledReloader(reloadTimes);

  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // DBから現在のコースを取得して表示する
        const { data: profiles } = await supabase
          .from("profiles")
          .select("course")
          .eq("user_id", user.id)
          .single();
        if (profiles) {
          setCourse(profiles.course || "");
        }
      } else {
        navigate("/login");
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
      <div className="w-full max-w-2xl p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">マイページ</h1>
        
        {/* メールとコース表示エリア */}
        <div className="mb-8 p-4 bg-black/30 rounded-lg text-left space-y-2">
          <div>
            <p className="text-gray-400 text-sm">メールアドレス:</p>
            <p className="text-cyan-300 text-lg">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">選択中のコース:</p>
            <p className="text-cyan-300 text-lg">{course || '未選択'}</p>
          </div>
        </div>
        
        {/* コース選択ページへのリンクボタン */}
        <Link 
          to="/setting"
          className="inline-block mb-8 px-6 py-2 border border-cyan-500 text-cyan-400 font-semibold rounded-full hover:bg-cyan-500 hover:text-white transition-colors"
        >
          コースを選択 / 変更する
        </Link>
        
        {/* カルーセル */}
        <div className="mb-8">
          <RotatingCarousel items={photoItems} />
        </div>

        <button onClick={handleLogout} className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300">
          ログアウト
        </button>
      </div>
    </div>
  );
}