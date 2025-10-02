/* src/pages/Mypage.tsx */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useSidebar, type ChapterLink } from "../contexts/SidebarContext";
import { useScheduledReloader } from "../hooks/useScheduledReloader";
import { FiMaximize, FiMinimize, FiArrowRight } from "react-icons/fi";
import { Timetable, type Day, type Subject } from '../components/Timetable';
//import Assignments from '../components/Assignments';

// =================================================================
// 型定義と共通データ
// =================================================================

const VALID_DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
function isDay(key: any): key is Day {
  return VALID_DAYS.includes(key);
}

const periodTimes = [
  { period: 1, start: { h: 9, m: 15 }, end: { h: 10, m: 55 } },
  { period: 2, start: { h: 10, m: 55 }, end: { h: 12, m: 25 } },
  { period: 3, start: { h: 13, m: 20 }, end: { h: 14, m: 50 } },
  { period: 4, start: { h: 15, m: 0 }, end: { h: 16, m: 30 } },
  { period: 5, start: { h: 16, m: 40 }, end: { h: 18, m: 10 } },
  { period: 6, start: { h: 18, m: 20 }, end: { h: 19, m: 50 } },
];

type TimetableRpcData = {
  id: number;
  name: string;
  teacher: string;
  wday: string;
  period: number;
  classroom: string;
};


// =================================================================
// MyPageコンポーネント本体
// =================================================================

export default function MyPage() {
  const { setChapterLinks, activeChapter, setActiveChapter } = useSidebar();

  const myPageChapters: ChapterLink[] = [
    { id: 'timetable', label: '時間割' },
    { id: 'assignments', label: '課題' },
  ];

  // ▼▼▼ このページが表示された瞬間に、Layoutにチャプターリストを登録します ▼▼▼
  useEffect(() => {
    // Layoutにチャプターリストを渡す
    setChapterLinks(myPageChapters);
    // 初期表示するチャプターを設定
    if (!activeChapter) {
      setActiveChapter('timetable');
    }

    // このページから離れるときに、Layoutのチャプターリストを空にする（クリーンアップ処理）
    // これにより、他のページではサイドバーが表示されなくなります。
    return () => {
      setChapterLinks([]);
      setActiveChapter('');
    };
  }, [setChapterLinks, setActiveChapter]);


  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [courseName, setCourseName] = useState<string>("");
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [weeklySubjects, setWeeklySubjects] = useState<Record<Day, Subject[]>>({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] });
  const [loading, setLoading] = useState(true);
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(false);
  const [openedSubjects, setOpenedSubjects] = useState<string[]>([]);
  const [isProfileSet, setIsProfileSet] = useState(false);

  const toggleTimetableView = () => {
    setIsWeeklyView(prev => !prev);
  };

  const reloadTimes = [
    { hour: 9, minute: 10 }, { hour: 10, minute: 50 }, { hour: 13, minute: 15 },
    { hour: 14, minute: 55 }, { hour: 16, minute: 35 }, { hour: 18, minute: 15 },
    { hour: 19, minute: 55 },
  ];
  useScheduledReloader(reloadTimes);

  useEffect(() => {
    const fetchUserTimetable = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      setUser(user);
      const [timetableRes, profileRes] = await Promise.all([
        supabase.rpc('get_user_timetable', { p_user_id: user.id }),
        supabase.from("profile").select("auto_open, course(name)").eq("user_id", user.id).single()
      ]);
      
      if (timetableRes.error) {
        console.error("RPC関数の呼び出しに失敗しました:", timetableRes.error);
        setLoading(false);
        return;
      }

      if(profileRes.error) {
        console.error("プロフィール情報の取得に失敗:", profileRes.error);
        setIsProfileSet(false);
      } else {
        const profileData = profileRes.data as any;
        const courseNameValue = profileData?.course?.name;
        if (courseNameValue) {
          setCourseName(courseNameValue);
          setIsProfileSet(true);
        } else {
          setCourseName("コース未設定");
          setIsProfileSet(false);
        }
        setAutoOpenEnabled(profileData?.auto_open ?? false);
      }

      const initialSubjects: Record<Day, Subject[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] };
      const groupedSubjects = (timetableRes.data as TimetableRpcData[] || []).reduce(
        (acc: Record<Day, Subject[]>, subject: TimetableRpcData) => {
          const day = subject.wday;
          if (isDay(day)) {
            acc[day].push({
              id: `${subject.id}-${day}-${subject.period}`,
              name: subject.name,
              teacher: subject.teacher,
              wday: day,
              period: subject.period,
              classroom: subject.classroom,
            });
          }
          return acc;
        }, initialSubjects);

      Object.values(groupedSubjects).forEach(dayArray => {
        dayArray.sort((a, b) => a.period - b.period);
      });

      setWeeklySubjects(groupedSubjects);
      setLoading(false);
    };
    fetchUserTimetable();
  }, [navigate]);

  useEffect(() => {
    const todayKey = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][new Date().getDay() - 1];
    const todaySubjects = weeklySubjects[todayKey as Day] || [];

    if (!autoOpenEnabled || loading || todaySubjects.length === 0) {
      return;
    }

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    todaySubjects.forEach(subject => {
      const timeInfo = periodTimes.find(p => p.period === subject.period);
      if (!timeInfo) return;

      const startTime = new Date(now);
      startTime.setHours(timeInfo.start.h, timeInfo.start.m, 0, 0);
      const openTime = new Date(startTime.getTime() - 5 * 60 * 1000); // 5分前

      if (now >= openTime && now < startTime && !openedSubjects.includes(subject.id)) {
        console.log(`${subject.name} のLMSページを開きます...`);
        const dbId = subject.id.split('-')[0];
        const url = `https://lms-tokyo.iput.ac.jp/course/view.php?id=${dbId}`;
        window.open(url, '_blank');
        setOpenedSubjects(prev => [...prev, subject.id]);
      }
    });
  }, [loading, autoOpenEnabled, weeklySubjects, openedSubjects]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  const renderMainContent = () => {
    switch (activeChapter) {
      case 'timetable':
        return (
            <div className="flex flex-col bg-slate-900/70 backdrop-blur-lg border border-white/10 shadow-xl rounded-lg">
                <div className="w-full flex justify-between items-center px-4 md:px-6 py-4">
                  <div className="flex items-baseline space-x-4">
                    <h1 className="font-orbitron font-bold text-cyan-300 text-glow text-xl sm:text-2xl">
                        {isWeeklyView ? "WEEKLY SCHEDULE" : "TODAY'S SCHEDULE"}
                    </h1>
                    <span className="text-base md:text-xl font-medium text-gray-300">{courseName || '未選択'}</span>
                  </div>
                  <button onClick={toggleTimetableView} className="text-gray-400 hover:text-cyan-400 transition-colors duration-300" aria-label="表示切替">
                      {isWeeklyView ? <FiMinimize size={24} /> : <FiMaximize size={24} />}
                  </button>
                </div>
                {isProfileSet ? (
                  <div className="flex justify-center items-center min-h-[250px] md:min-h-[350px] bg-slate-950 rounded-lg pt-5 md:pt-6 pb-8 md:pb-10 px-2">
                    <Timetable isWeeklyView={isWeeklyView} weeklyData={weeklySubjects} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[350px] bg-slate-950 rounded-lg m-4">
                    <div className="text-center py-10 px-4">
                        <h2 className="text-xl font-semibold text-white mb-2">時間割を表示するには設定が必要です</h2>
                        <p className="text-gray-400 mb-6">所属コースと英語クラスを選択してください。</p>
                        <Link to="/setting" className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                            <span>設定ページへ</span>
                            <FiArrowRight />
                        </Link>
                    </div>
                </div>
                )}
            </div>
        );
      case 'assignments':
        return (
            <div className="flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-lg border border-white/10 shadow-xl rounded-lg w-full min-h-[350px]">
                <h1 className="font-orbitron font-bold text-cyan-300 text-glow text-xl sm:text-3xl mb-4">ASSIGNMENTS</h1>
                <p className="text-gray-400">ここは課題表示エリアです。今後実装されます。</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-2 py-4 md:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto pt-16">
        <div className="flex justify-between items-center mb-5">
            <div className="flex flex-row items-baseline space-x-2 md:space-x-4">
                <h1 className="text-[1.3rem] md:text-3xl font-bold text-white font-display pl-2">マイページ</h1>
                {user && <span className="text-sm md:text-lg font-medium text-gray-300">{user.email}</span>}
            </div>
        </div>
        {renderMainContent()}
      </div>
    </div>
  );
}