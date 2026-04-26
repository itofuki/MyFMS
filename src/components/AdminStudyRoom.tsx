/* src/components/AdminStudyRoom.tsx */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const AdminStudyRoom = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(true); // 初期値をtrueに変更（チラつき防止）

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  // 1. セッションと権限の確認
  useEffect(() => {
    const checkUserRole = async (userSession: Session | null) => {
      setSession(userSession);
      
      if (userSession?.user) {
        setIsCheckingRole(true);
        // profilesテーブルから自分のroleを取得する
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', userSession.user.id)
          .single();

        console.log("プロフィール取得チェック:", { data, error, uid: userSession.user.id });
        
        if (!error && data?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setIsCheckingRole(false);
      } else {
        setIsAdmin(false);
        setIsCheckingRole(false);
      }
    };

    // 初期ロード時のセッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserRole(session);
    });

    // ログイン状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 4. アップロード＆AI処理
  const handleUploadAndProcess = async () => {
    if (!file) return setMessage('画像を選択してください。');
    setIsProcessing(true);
    setMessage('1/3: Supabaseに画像をアップロード中...');

    try {
      const filePath = `studyroom/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setMessage('2/3: AIに渡すための一時的なURLを発行中...');
      const { data: urlData, error: urlError } = await supabase.storage
        .from('images')
        .createSignedUrl(filePath, 60);
        
      if (urlError) throw urlError;

      setMessage('3/3: AI（Gemini）で画像を解析・DB登録中...');
      const { error: functionError } = await supabase.functions.invoke('process-schedule-image', {
        body: { 
          imageUrl: urlData.signedUrl,
          year: new Date().getFullYear()
        }
      });

      if (functionError) {
        let realErrorMessage = functionError.message;
        // サーバーからのレスポンス(JSON)があれば、その中の error メッセージを取り出す
        if (functionError.context) {
          try {
            const errorBody = await functionError.context.json();
            realErrorMessage = errorBody.error || realErrorMessage;
          } catch (e) {
            console.error("エラーボディの読み取り失敗", e);
          }
        }
        throw new Error(realErrorMessage);
      }

      setMessage('✨ スケジュールのAI読み取りとデータベース登録が完了しました！');
    } catch (error: any) {
      console.error(error);
      setMessage(`❌ エラーが発生しました: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // UIの表示分岐
  // ----------------------------------------------------

  // 管理者権限の確認中、未ログイン、または管理者ではない場合は何も表示しない
  if (isCheckingRole || !session || !isAdmin) {
    return null;
  }

  // 管理者(admin)の場合のみアップロード画面を表示
  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-lg text-slate-200 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-cyan-400 font-orbitron">時間割アップロード</h2>
        {/* ログアウトボタンを削除しました */}
      </div>
      
      <div className="mb-6">
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setFile(e.target.files?.[0] || null)} 
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-cyan-900 file:text-cyan-300 cursor-pointer"
        />
      </div>

      <button 
        onClick={handleUploadAndProcess} 
        disabled={!file || isProcessing}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600 disabled:text-slate-400"
      >
        {isProcessing ? '処理を実行中...' : 'アップロード ＆ AIで自動登録'}
      </button>

      {message && (
        <div className={`mt-6 p-4 rounded-md text-sm ${message.includes('❌') ? 'bg-red-900/50 text-red-200' : 'bg-slate-900 text-cyan-200'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminStudyRoom;