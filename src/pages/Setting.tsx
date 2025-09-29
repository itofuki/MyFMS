/* src/pages/Setting */

import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { toast } from 'sonner';
import RadioGroup from "../components/RadioGroup";
import Switch from "../components/Switch";
import Collapsible from "../components/Collapsible";

export default function Setting() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [courseID, setCourseID] = useState<string | null>(null);
  const [englishID, setEnglishID] = useState<number | null>(null);
  const [autoOpen, setAutoOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const courseOptions = [
    { value: 'IA', label: 'AI' },
    { value: 'IS', label: 'IoT' },
    { value: 'IR', label: 'Robot' },
    { value: 'DG', label: 'Game' },
    { value: 'DC', label: 'CG' },
  ];

  const englishClassOptions = [
    { value: 3418, label: 'A' },
    { value: 3419, label: 'B' },
    { value: 3420, label: 'C' },
    { value: 3421, label: 'D' },
    { value: 3422, label: 'E' },
    { value: 3423, label: 'F' },
    { value: 3424, label: 'G' },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from("profile")
          .select("course_id, english_id, auto_open")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          setCourseID(profile.course_id || null);
          setEnglishID(profile.english_id || null);
          setAutoOpen(profile.auto_open ?? true);
        }
      } else {
        navigate("/login");
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("profile").upsert({
        user_id: user.id,
        course_id: courseID,
        english_id: englishID,
        auto_open: autoOpen,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("設定を更新しました！");
      navigate("/mypage");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`エラーが発生しました: ${error.message}`);
      }
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

  return (
    <div className="min-h-screen flex flex-col items-center text-white px-2 mt-20">
      <div className="w-full max-w-2xl p-2 sm:p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display pl-3 pt-6">
            設定
          </h1>
          <Link to="/mypage" className="text-md text-cyan-400 hover:underline pr-3 pt-6">
            マイページに戻る
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mb-8 text-left">
          <RadioGroup
            legend="所属するコースを選択してください"
            options={courseOptions}
            selectedValue={courseID}
            onChange={setCourseID}
          />
          <RadioGroup
            legend="英語のクラスを選択してください"
            options={englishClassOptions}
            selectedValue={englishID}
            onChange={setEnglishID}
          />
          
          <Collapsible title="Advanced">
            <Switch
              label="授業開始前に自動で出席確認を開く"
              checked={autoOpen}
              onChange={setAutoOpen}
            />
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
          <button 
            onClick={handleLogout} 
            className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}