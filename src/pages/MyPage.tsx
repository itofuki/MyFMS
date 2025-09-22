/* src/pages/MyPage.tsx */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useScheduledReloader } from "../hooks/useScheduledReloader";
import RotatingCarousel from '../components/RotatingCarousel';
import { FiSettings } from "react-icons/fi";

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

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
      <div className="w-full max-w-2xl p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20 text-center">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-cyan-400 text-glow font-display">
            マイページ
          </h1>
          <Link 
            to="/setting"
            className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
            aria-label="設定ページへ"
          >
            <FiSettings size={28} className="glowing-gear" />
          </Link>
        </div>

        {/* 👇 メールとコース表示エリア */}
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
        
        {/* カルーセル */}
        <div className="mb-8">
          <RotatingCarousel items={photoItems} />
        </div>
      </div>
    </div>
  );
}