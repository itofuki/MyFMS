/* src/pages/Setting */

import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { toast } from 'sonner';
import RadioGroup from "../components/RadioGroup";
import Switch from "../components/Switch";
import Collapsible from "../components/Collapsible";

// DBから取得するマスターデータの型（IDは数値）
type DeptDB = { id: number; name: string; code: string };
type CourseDB = { id: number; department_id: number; name: string; code: string };
type ClassDB = { id: number; course_id: number; name: string };

export default function Setting() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  
  // DBから取得したマスターデータ
  const [departmentsDB, setDepartmentsDB] = useState<DeptDB[]>([]);
  const [coursesDB, setCoursesDB] = useState<CourseDB[]>([]);
  const [classesDB, setClassesDB] = useState<ClassDB[]>([]);

  // 選択状態（IDの数値を保持します）
  const [department, setDepartment] = useState<number | null>(null);
  const [baseCourse, setBaseCourse] = useState<number | null>(null);
  const [courseClass, setCourseClass] = useState<number | null>(null);
  
  const [englishID, setEnglishID] = useState<number | null>(null);
  const [autoOpen, setAutoOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const englishClassOptions = [
    { value: "3803", label: 'A' }, { value: "3804", label: 'B' }, { value: "3805", label: 'C' },
    { value: "3806", label: 'D' }, { value: "3807", label: 'E' }, { value: "3808", label: 'F' },
    { value: "3809", label: 'G' },
  ];

  // 初回データ取得
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
        supabase.from('profiles').select('class_id, english_id, auto_open').eq('user_id', user.id).single()
      ]);

      const depts = resDept.data || [];
      const crses = resCourse.data || [];
      const clses = resClass.data || [];

      setDepartmentsDB(depts);
      setCoursesDB(crses);
      setClassesDB(clses);

      const profile = resProfile.data;

      // 既存の設定があれば復元、なければ初期値（先頭の要素）をセット
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

  // 学科が変わったら、その学科の先頭のコースを選択
  useEffect(() => {
    if (department && coursesDB.length > 0) {
      const availableCourses = coursesDB.filter(c => c.department_id === department);
      if (availableCourses.length > 0 && !availableCourses.find(c => c.id === baseCourse)) {
        setBaseCourse(availableCourses[0].id);
      }
    }
  }, [department, coursesDB]);

  // コースが変わったら、そのコースの先頭のクラスを選択
  useEffect(() => {
    if (baseCourse && classesDB.length > 0) {
      const availableClasses = classesDB.filter(c => c.course_id === baseCourse);
      if (availableClasses.length > 0 && !availableClasses.find(c => c.id === courseClass)) {
        setCourseClass(availableClasses[0].id);
      }
    }
  }, [baseCourse, classesDB]);

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
        class_id: courseClass, // 数値のID (例: 3000000) を保存
        english_id: englishID,
        auto_open: autoOpen,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("設定を更新しました！");
      navigate("/mypage");
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

  // 数値と文字列の違いによるバグを防ぐため、すべて文字列(String)に変換してから比較・生成する
  const departmentOptions = departmentsDB.map(d => ({ value: String(d.id), label: d.name }));
  
  const courseOptions = coursesDB
    .filter(c => String(c.department_id) === String(department))
    .map(c => ({ value: String(c.id), label: c.name }));
    
  const classOptions = classesDB
    .filter(c => String(c.course_id) === String(baseCourse))
    .map(c => ({ value: String(c.id), label: c.name }));

  return (
    <div className="min-h-screen flex flex-col items-center text-white px-2 pt-18 md:pt-20 pb-10">
      <div className="w-full max-w-2xl px-3 py-5 md:p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display pl-3 pt-3">設定</h1>
          <Link to="/mypage" className="text-md text-cyan-400 hover:underline pr-3 pt-3">マイページに戻る</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mb-8 text-left">
          <RadioGroup 
            legend="所属する学科を選択してください" 
            options={departmentOptions} 
            selectedValue={department ? String(department) : null} 
            onChange={(val) => setDepartment(Number(val))} 
          />
          
          {department && courseOptions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <RadioGroup 
                legend="コースを選択してください" 
                options={courseOptions} 
                selectedValue={baseCourse ? String(baseCourse) : null} 
                onChange={(val) => setBaseCourse(Number(val))} 
              />
            </div>
          )}

          {baseCourse && classOptions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <RadioGroup 
                legend="クラスを選択してください" 
                options={classOptions} 
                selectedValue={courseClass ? String(courseClass) : null} 
                onChange={(val) => setCourseClass(Number(val))} 
              />
            </div>
          )}

          <hr className="border-t border-white/10 my-6" />
          
          <RadioGroup 
            legend="英語のクラスを選択してください" 
            options={englishClassOptions} 
            selectedValue={englishID ? String(englishID) : null} 
            onChange={(val) => setEnglishID(Number(val))} 
          />
          
          <Collapsible title="Advanced">
            <Switch label="授業開始前に自動で出席確認を開く" checked={autoOpen} onChange={setAutoOpen} />
            <p>※ポップアップブロックを解除してください</p>
          </Collapsible>

          <div className="text-center pt-4">
            <button type="submit" disabled={loading} className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50">
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
        <hr className="border-t border-white/20 my-8" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">アカウント操作</h3>
          <button onClick={handleLogout} className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300">ログアウト</button>
        </div>
      </div>
    </div>
  );
}