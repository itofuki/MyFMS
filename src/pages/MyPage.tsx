import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useScheduledReloader } from "../hooks/useScheduledReloader";
import { FiSettings, FiMaximize, FiMinimize } from "react-icons/fi";
import { Timetable, type Day, type Subject } from '../components/Timetable';

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

export default function MyPage() {
  const reloadTimes = [
    { hour: 9, minute: 10 }, { hour: 10, minute: 50 }, { hour: 13, minute: 15 },
    { hour: 14, minute: 55 }, { hour: 16, minute: 35 }, { hour: 18, minute: 15 },
    { hour: 19, minute: 55 },
  ];
  useScheduledReloader(reloadTimes);

  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [courseName, setCourseName] = useState<string>("");
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [weeklySubjects, setWeeklySubjects] = useState<Record<Day, Subject[]>>({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [],
  });
  const [loading, setLoading] = useState(true);
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(false);
  const [openedSubjects, setOpenedSubjects] = useState<string[]>([]);

  const toggleTimetableView = () => {
    setIsWeeklyView(prev => !prev);
  };

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
    } else {
      const profileData = profileRes.data as any;
      setCourseName(profileData?.course?.name || "コース未設定");
      setAutoOpenEnabled(profileData?.auto_open ?? false);
    }

    const initialSubjects: Record<Day, Subject[]> = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [],
    };

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

    // 設定がオフ、または読み込み中、または今日の授業がなければ何もしない
    if (!autoOpenEnabled || loading || todaySubjects.length === 0) {
      return;
    }

    // ページが読み込まれた時点の時刻で一度だけチェックする
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

    todaySubjects.forEach(subject => {
      const timeInfo = periodTimes.find(p => p.period === subject.period);
      if (!timeInfo) return;

      const startTime = new Date(now);
      startTime.setHours(timeInfo.start.h, timeInfo.start.m, 0, 0);
      
      const openTime = new Date(startTime.getTime() - 5 * 60 * 1000); // 5分前

      // ページがリロードされた時刻が5分前の範囲内、かつまだ開いていない場合
      if (now >= openTime && now < startTime && !openedSubjects.includes(subject.id)) {
        console.log(`${subject.name} のLMSページを開きます...`);
        
        const dbId = subject.id.split('-')[0];
        const url = `https://lms-tokyo.iput.ac.jp/course/view.php?id=${dbId}`;
        
        window.open(url, '_blank');
        
        setOpenedSubjects(prev => [...prev, subject.id]);
      }
    });
  // 依存配列から openedSubjects を削除し、データ読み込み完了時にのみ実行されるようにする
  }, [loading, autoOpenEnabled, weeklySubjects]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center text-white px-2 mt-20">
      <div className="w-full max-w-4xl px-2 py-3 sm:p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20 text-center">
        
        <div className="flex justify-between items-center mb-6 sm:pb-4">
          <div className="flex flex-col sm:flex-row items-baseline space-x-4 pl-3 pt-6 sm:pt-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">マイページ</h1>
            {user && <span className="text-md font-medium text-gray-300">{user.email}</span>}
          </div>
          <Link to="/setting" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 pr-3 pt-6" aria-label="設定ページへ">
            <FiSettings size={28} className="glowing-gear" />
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center bg-slate-900 text-white p-2 py-4 sm:py-7 rounded-lg">
          <div className="w-full flex justify-between items-center pb-4 pt-3 px-2 sm:px-6">
            <div className="flex items-baseline space-x-4">
              <h1 className="font-orbitron font-bold text-cyan-300 text-glow text-xl sm:text-3xl">
                {isWeeklyView ? "WEEKLY SCHEDULE" : "TODAY'S SCHEDULE"}
              </h1>
              <span className="text-base sm:text-2xl font-medium text-gray-300">{courseName || '未選択'}</span>
            </div>
            <button onClick={toggleTimetableView} className="text-gray-400 hover:text-cyan-400 transition-colors duration-300" aria-label="表示切替">
              {isWeeklyView ? <FiMinimize size={24} /> : <FiMaximize size={24} />}
            </button>
          </div>
          
          <Timetable isWeeklyView={isWeeklyView} weeklyData={weeklySubjects} />
        
        </div>
        
      </div>
    </div>
  );
}