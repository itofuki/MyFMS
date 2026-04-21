/* src/pages/Setting.tsx */

import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { toast } from 'sonner';
import { FiSettings } from "react-icons/fi";
import RadioGroup from "./RadioGroup";
import Switch from "./Switch";
import Collapsible from "./Collapsible";
import ChapterFrame from "../components/ChapterFrame"; 

type DeptDB = { id: number; name: string; code: string };
type CourseDB = { id: number; department_id: number; name: string; code: string };
type ClassDB = { id: number; course_id: number; name: string };

export default function Setting() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  
  const [departmentsDB, setDepartmentsDB] = useState<DeptDB[]>([]);
  const [coursesDB, setCoursesDB] = useState<CourseDB[]>([]);
  const [classesDB, setClassesDB] = useState<ClassDB[]>([]);

  const [department, setDepartment] = useState<number | null>(null);
  const [baseCourse, setBaseCourse] = useState<number | null>(null);
  const [courseClass, setCourseClass] = useState<number | null>(null);
  
  const [englishID, setEnglishID] = useState<number | null>(null);
  const [autoOpen, setAutoOpen] = useState<boolean>(true);
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const englishClassOptions = [
    { value: "3803", label: 'A' }, { value: "3804", label: 'B' }, { value: "3805", label: 'C' },
    { value: "3806", label: 'D' }, { value: "3807", label: 'E' }, { value: "3808", label: 'F' },
    { value: "3809", label: 'G' },
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);

      const [resDept, resCourse, resClass, resProfile] = await Promise.all([
        supabase.from('departments').select('*').order('id'),
        supabase.from('courses').select('*').order('id'),
        supabase.from('classes').select('*').order('id'),
        supabase.from('profiles').select('class_id, english_id, auto_open, is_light_mode').eq('user_id', user.id).single()
      ]);

      const depts = resDept.data || [];
      const crses = resCourse.data || [];
      const clses = resClass.data || [];

      setDepartmentsDB(depts);
      setCoursesDB(crses);
      setClassesDB(clses);

      const profile = resProfile.data;

      if (profile?.class_id) {
        const myClass = clses.find(c => c.id === profile.class_id);
        if (myClass) {
          setCourseClass(myClass.id);
          const myCourse = crses.find(c => c.id === myClass.course_id);
          if (myCourse) {
            setBaseCourse(myCourse.id);
            setDepartment(myCourse.department_id);
          }
        }
        setEnglishID(profile.english_id || null);
        setAutoOpen(profile.auto_open ?? true);
        setIsLightMode(profile.is_light_mode ?? false);
      } else if (depts.length > 0 && crses.length > 0 && clses.length > 0) {
        const firstDept = depts[0];
        const firstCourse = crses.find(c => c.department_id === firstDept.id);
        if (firstCourse) {
          const firstClass = clses.find(c => c.course_id === firstCourse.id);
          setDepartment(firstDept.id);
          setBaseCourse(firstCourse.id);
          if (firstClass) setCourseClass(firstClass.id);
        }
      }
    };
    fetchAllData();
  }, [navigate]);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [isLightMode]);

  useEffect(() => {
    if (department && coursesDB.length > 0) {
      const availableCourses = coursesDB.filter(c => c.department_id === department);
      if (availableCourses.length > 0 && !availableCourses.find(c => c.id === baseCourse)) {
        setBaseCourse(availableCourses[0].id);
      }
    }
  }, [department, coursesDB, baseCourse]);

  useEffect(() => {
    if (baseCourse && classesDB.length > 0) {
      const availableClasses = classesDB.filter(c => c.course_id === baseCourse);
      if (availableClasses.length > 0 && !availableClasses.find(c => c.id === courseClass)) {
        setCourseClass(availableClasses[0].id);
      }
    }
  }, [baseCourse, classesDB, courseClass]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!courseClass) {
      toast.error("クラスを最後まで選択してください");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        class_id: courseClass,
        english_id: englishID,
        auto_open: autoOpen,
        is_light_mode: isLightMode,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("設定を更新しました！");
    } catch (error: any) {
      toast.error(`エラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    toast.success("ログアウトしました。");
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return <div>Loading...</div>;

  const departmentOptions = departmentsDB.map(d => ({ value: String(d.id), label: d.name }));
  const courseOptions = coursesDB
    .filter(c => String(c.department_id) === String(department))
    .map(c => ({ value: String(c.id), label: c.name }));
  const classOptions = classesDB
    .filter(c => String(c.course_id) === String(baseCourse))
    .map(c => ({ value: String(c.id), label: c.name }));

  return (
    <ChapterFrame
      title={
        <div className="flex justify-center items-center gap-3 w-full">
          {/* 🌟 ライトモード時はアイコンを少し濃い青緑に */}
          <FiSettings className="text-cyan-600 dark:text-cyan-400 text-2xl sm:text-3xl transition-colors duration-300" />
          <span className="font-orbitron font-bold text-cyan-700 dark:text-cyan-300 dark:text-glow text-xl sm:text-3xl transition-colors duration-300">
            設定
          </span>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center p-2 animate-in fade-in duration-300">
        
        {/* 🌟 カード部分をライト/ダーク両対応に。transitionを追加して色の変化を滑らかに。 */}
        <div className="w-full max-w-3xl bg-white/80 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-5 md:p-8 mb-6 shadow-xl transition-all duration-300">

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {/* 🌟 親要素に文字色の両対応を設定。RadioGroupなどの子要素に継承させます。 */}
            <div className="text-slate-800 dark:text-slate-200 transition-colors duration-300">
              <RadioGroup 
                legend="所属する学科を選択してください" 
                options={departmentOptions} 
                selectedValue={department ? String(department) : null} 
                onChange={(val) => setDepartment(Number(val))} 
              />
            </div>
            
            {department && courseOptions.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 text-slate-800 dark:text-slate-200 transition-colors duration-300">
                <RadioGroup 
                  legend="コースを選択してください" 
                  options={courseOptions} 
                  selectedValue={baseCourse ? String(baseCourse) : null} 
                  onChange={(val) => setBaseCourse(Number(val))} 
                />
              </div>
            )}

            {baseCourse && classOptions.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 text-slate-800 dark:text-slate-200 transition-colors duration-300">
                <RadioGroup 
                  legend="クラスを選択してください" 
                  options={classOptions} 
                  selectedValue={courseClass ? String(courseClass) : null} 
                  onChange={(val) => setCourseClass(Number(val))} 
                />
              </div>
            )}

            {/* 🌟 線の色を両対応に */}
            <hr className="border-t border-slate-200 dark:border-white/10 my-6 transition-colors duration-300" />
            
            <div className="text-slate-800 dark:text-slate-200 transition-colors duration-300">
              <RadioGroup 
                legend="英語のクラスを選択してください" 
                options={englishClassOptions} 
                selectedValue={englishID ? String(englishID) : null} 
                onChange={(val) => setEnglishID(Number(val))} 
              />
            </div>
            
            {/* 🌟 Collapsible内部の文字色も対応 */}
            <div className="text-slate-800 dark:text-white transition-colors duration-300">
              <Collapsible title="Advanced">
                <div className="space-y-4 pt-2">
                  <Switch label="授業開始前に自動で出席確認を開く" checked={autoOpen} onChange={setAutoOpen} />
                  <Switch label="ライトモード（白ベース）にする" checked={isLightMode} onChange={setIsLightMode} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 transition-colors duration-300">
                  ※ポップアップブロックを解除してください
                </p>
              </Collapsible>
            </div>

            <div className="text-center pt-6">
              <button type="submit" disabled={loading} className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50">
                {loading ? "保存中..." : "保存"}
              </button>
            </div>
          </form>

          <hr className="border-t border-slate-200 dark:border-white/10 my-8 transition-colors duration-300" />
          
          <div className="text-center">
            {/* 🌟 見出しとログアウトボタンの色を両対応に */}
            <h3 className="text-sm md:text-base font-semibold text-slate-500 dark:text-slate-400 mb-4 transition-colors duration-300">
              アカウント操作
            </h3>
            <button 
              onClick={handleLogout} 
              className="w-full max-w-xs py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 hover:bg-red-500/80 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 hover:border-red-500 transition-all duration-300"
            >
              ログアウト
            </button>
          </div>
          
        </div>
      </div>
    </ChapterFrame>
  );
}