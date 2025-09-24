/* src/pages/MyPage.tsx */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useScheduledReloader } from "../hooks/useScheduledReloader";
import { FiSettings } from "react-icons/fi";
import { Timetable } from '../components/Timetable';

export default function MyPage() {
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
    <div className="min-h-screen flex flex-col items-center text-white mt-12">
      <div className="w-full max-w-2xl p-4 sm:p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20 text-center">
        <div className="flex justify-between items-center mb-6 sm:pb-4">
          
          <div className="flex flex-col sm:flex-row items-baseline space-x-4">
            <h1 className="text-2xl sm:text-4xl font-bold text-black-100 font-display">
              MyPage
            </h1>
            <span className="text-md font-medium text-gray-300">
              {user.email}
            </span>
          </div>

          <Link 
            to="/setting"
            className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
            aria-label="設定ページへ"
          >
            <FiSettings size={28} className="glowing-gear" />
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center bg-slate-900 text-white p-4 sm:pt-10">
          <div className="flex items-baseline space-x-4 pt-2 pb-4">
            <h1 className="sm:mb-8 font-orbitron text-xl sm:text-3xl font-bold text-cyan-300 text-glow">
              TODAY'S SCHEDULE
            </h1>
            <span className="text-lg sm:text-2xl font-medium text-gray-300">
              {course || '未選択'}
            </span>
          </div>
          
          <Timetable />
        
        </div>
        
      </div>
    </div>
  );
}