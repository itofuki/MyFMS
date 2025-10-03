/* src/pages/Mypage.tsx */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useSidebar, type ChapterLink } from "../contexts/SidebarContext";
import { useScheduledReloader } from "../hooks/useScheduledReloader";
import { type IconType } from 'react-icons';
import { FiCpu, FiWifi, FiGitPullRequest, FiPlay, FiFilm, FiHelpCircle, FiEdit, FiBookOpen} from "react-icons/fi";
import { TimetableContainer, type Day, type Subject } from '../components/Timetable';
import ChapterFrame from '../components/ChapterFrame';
import StudyRoom from '../components/StudyRoom';
import Assignments from '../components/Assignments';


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

type CourseStyle = {
  icon: IconType;
  label: string;
  color: string;
};

const courseStyles: Record<string, CourseStyle> = {
  'AI': {
    icon: FiCpu,
    label: 'AI',
    color: 'text-purple-400',
  },
  'IoT': {
    icon: FiWifi,
    label: 'IoT',
    color: 'text-sky-400',
  },
  'Robot': {
    icon: FiGitPullRequest,
    label: 'Robot',
    color: 'text-orange-400',
  },
  'GAME': {
    icon: FiPlay,
    label: 'Game',
    color: 'text-emerald-400',
  },
  'CG': {
    icon: FiFilm,
    label: 'CG',
    color: 'text-amber-400',
  },
};

// コース名から適切なスタイルを取得するヘルパー関数
const getCourseStyle = (courseName: string): CourseStyle | null => {
  if (!courseName) return null;
  const lowerCaseCourseName = courseName.toLowerCase();
  
  // Object.keysを使ってキーの配列を取得し、findメソッドで一致するキーを探す
  const matchedKey = Object.keys(courseStyles).find(key => 
    lowerCaseCourseName.includes(key.toLowerCase())
  );

  // 一致するキーが見つかった場合、そのキーを使ってオブジェクトを返す
  if (matchedKey) {
    return courseStyles[matchedKey];
  }
  
  return {
    icon: FiHelpCircle,
    label: '未選択',
    color: 'text-slate-400',
  };
};


// =================================================================
// MyPageコンポーネント本体
// =================================================================

export default function MyPage() {
  const { setChapterLinks, activeChapter, setActiveChapter } = useSidebar();

  const myPageChapters: ChapterLink[] = [
    { id: 'timetable', label: '時間割' },
    { id: 'assignments', label: '課題' },
    { id: 'study-room', label: '自習室' },
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

  const uniqueSubjects = Object.values(weeklySubjects)
    .flat()
    .filter((subject, index, self) => 
      index === self.findIndex(s => s.id.split('-')[0] === subject.id.split('-')[0])
    )
    .map(subject => ({
      id: parseInt(subject.id.split('-')[0], 10), // subject_id (number)
      name: subject.name, // subject_name
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

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

  const generateDynamicTitle = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const mday = now.getDate();
    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
    const wday = weekDays[now.getDay()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    let currentPeriodLabel: string | null = null;
    for (const periodInfo of periodTimes) {
      const startTime = new Date(now);
      startTime.setHours(periodInfo.start.h, periodInfo.start.m, 0, 0);
      
      const endTime = new Date(now);
      endTime.setHours(periodInfo.end.h, periodInfo.end.m, 0, 0);

      if (now >= startTime && now <= endTime) {
        currentPeriodLabel = `${periodInfo.period}限`;
        break;
      }
    }

    // 文字列の代わりにJSXを返し、各部分にスタイルを適用します
    return (
      <span className="flex items-baseline">
        {/* --- 日付部分 --- */}
        <span className="text-2xl md:text-3xl font-bold">{month}</span>
        <span className="text-base md:text-lg mx-0.5 md:mx-1">/</span>
        <span className="text-2xl md:text-3xl font-bold">{mday}</span>
        <span className="text-base md:text-xl ml-1">({wday})</span>
        
        {/* --- 時刻部分 --- */}
        <span className="ml-2 md:ml-4 flex items-baseline">
          <span className="text-2xl md:text-3xl font-bold">{hours}</span>
          <span className="text-base md:text-lg mx-0.5 md:mx-1">:</span>
          <span className="text-2xl md:text-3xl font-bold">{minutes}</span>
        </span>
        
        {/* --- 時限部分 --- */}
        {currentPeriodLabel && (
          <span className="text-base md:text-xl ml-1">({currentPeriodLabel})</span>
        )}
      </span>
    );
  };

  const courseStyle = getCourseStyle(courseName);

  const renderMainContent = () => {
    switch (activeChapter) {
      case 'timetable':
        return (
          <TimetableContainer
            isWeeklyView={isWeeklyView}
            toggleTimetableView={toggleTimetableView}
            dynamicTitle={generateDynamicTitle()}
            courseName={courseName}
            courseStyle={courseStyle}
            isProfileSet={isProfileSet}
            weeklySubjects={weeklySubjects}
          />
        );
      case 'assignments':
        return (
          <ChapterFrame title="課題" icon={FiEdit}>
            <Assignments subject={uniqueSubjects} />
          </ChapterFrame>
        );
      case 'study-room':
        return (
          <ChapterFrame title="自習室" icon={FiBookOpen}>
            <StudyRoom />
          </ChapterFrame>
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