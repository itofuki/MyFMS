import { useState, useEffect } from "react"; // 👈 1. useStateとuseEffectをインポート
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js"; // 👈 2. Userの型をインポート

export default function MyPage() {
  const navigate = useNavigate();
  // 3. ユーザー情報を保存するためのstateを作成 (初期値はnull)
  const [user, setUser] = useState<User | null>(null);

  // 4. コンポーネントが最初に描画されたときに一度だけ実行
  useEffect(() => {
    // ユーザー情報を取得する非同期関数を定義
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error.message);
        // エラーがあればログインページなどにリダイレクトさせることも可能
        // navigate("/login"); 
      } else if (data.user) {
        setUser(data.user); // 取得したユーザー情報をstateに保存
      }
    };

    fetchUser();
  }, [navigate]); // navigateを依存配列に追加

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // ユーザー情報がまだ読み込まれていない場合はローディング表示
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
      <div className="w-full max-w-2xl p-8 rounded-2xl backdrop-blur-xl bg-white/10 shadow-lg border border-white/20 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">
          マイページ
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          ログインに成功しました！現在作成中です...
        </p>
        
        <div className="mb-8 p-4 bg-black/30 rounded-lg">
          <p className="text-gray-400">あなたのメールアドレス:</p>
          {/* 5. stateからユーザーのメールアドレスを表示 */}
          <p className="text-cyan-300 text-xl">{user.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 font-semibold text-lg text-white shadow-lg hover:scale-105 transition-transform duration-300"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}