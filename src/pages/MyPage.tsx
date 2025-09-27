import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useScheduledReloader } from "../hooks/useScheduledReloader";
import { FiSettings, FiMaximize, FiMinimize } from "react-icons/fi";
import { Timetable, type Day, type Subject } from '../components/Timetable';

export default function MyPage() {
  const reloadTimes = [
    { hour: 9, minute: 5 }, { hour: 10, minute: 45 }, { hour: 13, minute: 10 },
    { hour: 14, minute: 50 }, { hour: 16, minute: 30 }, { hour: 18, minute: 10 },
    { hour: 19, minute: 50 },
  ];
  useScheduledReloader(reloadTimes);

  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<string>("");
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [weeklySubjects, setWeeklySubjects] = useState<Record<Day, Subject[]>>({
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
  });

  const toggleTimetableView = () => {
    setIsWeeklyView(prev => !prev);
  };

  useEffect(() => {
  const fetchUserDataAndSubjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: profile } = await supabase
        .from("profile")
        .select("course, english_class")
        .eq("user_id", user.id)
        .single();

      console.log('取得したプロフィール:', profile);
      
      if (profile && profile.course) {
        setCourse(profile.course);

        // 1. ユーザーのコースに属する授業を、時間割情報と共にすべて取得
        const { data: allSubjects, error } = await supabase
          .from('subject')
          .select(`
            id,
            name,
            teacher,
            subject_period (wday, period, classroom)
          `)
          .or(`course_name.eq.${profile.course},course_name.is.null`);

        if (error) {
          console.error('授業データの取得に失敗しました:', error);
          return;
        }

        if (allSubjects) {
          console.log('1. Supabaseから取得したデータ:', allSubjects);

          let filteredSubjects = allSubjects;

          // ユーザーに english_class が設定されている場合のみ、絞り込みを実行
          if (profile.english_class) {
            filteredSubjects = allSubjects.filter(subject => {
              // 「英語」という名前で始まる科目は、特別扱いする
              if (subject.name.startsWith('英語コミュニケーション')) {
                // ユーザーのクラスと科目名が完全に一致するか判定
                return subject.name === profile.english_class;
              }
              // 「英語」で始まらない科目は、すべて表示対象とする
              return true;
            });
          } else {
            // もしユーザーに english_class が設定されていない場合、
            // どの英語クラスかわからないため、すべての英語科目を非表示にする
            filteredSubjects = allSubjects.filter(subject => !subject.name.startsWith('英語'));
          }

          console.log('2. 英語クラスで絞り込んだ後:', filteredSubjects);

          // 3. Timetableコンポーネント用のデータ形式に整形
          const flattenedSubjects = filteredSubjects.flatMap(subject => 
            subject.subject_period.map(periodInfo => ({
              id: `${subject.id}-${periodInfo.wday}-${periodInfo.period}`,
              name: subject.name,
              day_of_week: periodInfo.wday,
              period: periodInfo.period,
              classroom: subject.teacher,
              teacher: periodInfo.classroom,
            }))
          );

          console.log("--- ステップ3: 整形後のデータ詳細チェック ---");
          flattenedSubjects.forEach(sub => {
            console.log(`科目: ${sub.name}, 曜日: "${sub.day_of_week}" (文字数: ${sub.day_of_week?.length})`);
          });

          const groupedSubjects = flattenedSubjects.reduce((acc, subject) => {
              const day = subject.day_of_week?.trim() as Day | undefined;
              if (day && Object.keys(acc).includes(day)) {
                acc[day].push(subject);
              }
              return acc;
            }, { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] } as Record<Day, Subject[]>);


          Object.values(groupedSubjects).forEach(dayArray => {
            dayArray.sort((a, b) => a.period - b.period);
          });

          console.log('4. 最終的な曜日ごとのオブジェクト:', groupedSubjects);
          
          setWeeklySubjects(groupedSubjects);
        }
      }
    } else {
      navigate("/login");
    }
  };
  fetchUserDataAndSubjects();
}, [navigate]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center text-white px-3 mt-12 sm:mt-12">
      <div className="w-full max-w-4xl px-1 py-3 sm:p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20 text-center">
        
        <div className="flex justify-between items-center mb-6 sm:pb-4">
          <div className="flex flex-col sm:flex-row items-baseline space-x-4 pl-3 pt-6 sm:pt-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">マイページ</h1>
            <span className="text-md font-medium text-gray-300">{user.email}</span>
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
              <span className="text-base sm:text-2xl font-medium text-gray-300">{course || '未選択'}</span>
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