import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import RadioGroup from "../components/RadioGroup"; // RadioGroupコンポーネントをインポート

export default function Setting() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const courseOptions = [
    { value: 'AI', label: 'AI' },
    { value: 'IoT', label: 'IoT' },
    { value: 'Robot', label: 'Robot' },
    { value: 'Game', label: 'Game' },
    { value: 'CG', label: 'CG' },
  ];

  // ユーザー情報と現在のコース設定を取得
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
        if (profiles) setCourse(profiles.course || "");
      } else {
        navigate("/login");
      }
    };
    fetchUserData();
  }, [navigate]);

  // コースをDBに保存する処理
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      course: course,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);
    if (error) {
      alert("エラーが発生しました: " + error.message);
    } else {
      alert("コースを更新しました！");
      navigate("/mypage"); // 保存後にマイページへ戻る
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
      <div className="w-full max-w-2xl p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">コース選択</h1>
        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <RadioGroup
            legend="所属するコースを選択してください"
            options={courseOptions}
            selectedValue={course}
            onChange={setCourse}
          />
          <div className="text-center pt-4">
            <button type="submit" disabled={loading} className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50">
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
        <Link to="/mypage" className="text-cyan-400 hover:underline">
          マイページに戻る
        </Link>
      </div>
    </div>
  );
}