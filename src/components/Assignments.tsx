/* src/components/Assignments.tsx */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FiPlus, FiTrash2, FiCalendar, FiInbox } from 'react-icons/fi';

// 外部から渡される科目の型
type Subject = {
  id: number;
  name: string;
};

// 課題の型
type Assignment = {
  id: number;
  name: string;
  deadline: string;
  done: boolean;
  subject: { name: string } | null;
};

// コンポーネントが受け取るPropsの型
interface AssignmentsProps {
  subject: Subject[];
}

const formatDateTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

const Assignments: React.FC<AssignmentsProps> = ({ subject }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(''); // 日付用
  const [newTime, setNewTime] = useState(''); // 時刻用
  const [newSubjectId, setNewSubjectId] = useState<string>('');

  // 課題データを取得する関数
  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('assignment')
      .select('id, name, deadline, done, subject(name)') // subjectテーブルから科目名(name)をJOIN
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Error fetching assignments:', error);
    } else if (data) {
      setAssignments(data as unknown as Assignment[]);
    }
    setLoading(false);
  };

  // コンポーネント表示時に課題を取得
  useEffect(() => {
    fetchAssignments();
  }, []);

  // 課題を追加する処理
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newName || !newDate || !newSubjectId) return;

    const timePart = newTime || '23:59';
    const localDateTimeString = `${newDate}T${timePart}`;
    const deadlineDate = new Date(localDateTimeString);
    const deadlineForSupabase = deadlineDate.toISOString();

    const { error } = await supabase
      .from('assignment')
      .insert({
        name: newName,
        deadline: deadlineForSupabase,
        subject_id: parseInt(newSubjectId, 10),
        user_id: user.id,
      });

    if (error) {
      console.error('Error adding assignment:', error);
    } else {
      // フォームをリセットし、課題リストを再取得
      setNewName('');
      setNewDate('');
      setNewTime('');
      setNewSubjectId('');
      await fetchAssignments();
    }
  };

  // 完了状態を切り替える処理
  const handleToggleDone = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('assignment')
      .update({ done: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating assignment:', error);
    } else {
      // UIを即時反映
      setAssignments(prev =>
        prev.map(assign =>
          assign.id === id ? { ...assign, done: !currentStatus } : assign
        )
      );
    }
  };
  
  // 課題を削除する処理
  const handleDeleteAssignment = async (id: number) => {
    const { error } = await supabase
      .from('assignment')
      .delete()
      .eq('id', id);

    if(error) {
      console.error('Error deleting assignment:', error);
    } else {
      await fetchAssignments();
    }
  }


  if (loading) return <p className="text-slate-400">読み込み中...</p>;

  return (
    <div className="w-full flex flex-col gap-8">
      
      {/* --- 課題一覧エリア --- */}
      <div>
        {assignments.length === 0 ? (
          // 課題が一つもない場合の表示（Empty State）
          <div className="text-center py-10 px-4 bg-slate-800/50 rounded-lg">
            <FiInbox size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="font-bold text-lg text-slate-300">課題はまだありません</h3>
            <p className="text-slate-400 mt-1">下のフォームから新しい課題を追加しましょう。</p>
          </div>
        ) : (
          // 課題がある場合のリスト表示
          <div className="space-y-3">
            {assignments.map(assignment => (
              <div 
                key={assignment.id} 
                className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 ${
                  assignment.done 
                    ? 'bg-slate-800/60 border-l-4 border-slate-600' 
                    : 'bg-slate-700/80 border-l-4 border-cyan-500'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={assignment.done}
                    onChange={() => handleToggleDone(assignment.id, assignment.done)}
                    className="h-5 w-5 rounded bg-slate-600 text-cyan-500 focus:ring-cyan-600 border-slate-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="ml-4">
                    <p className={`font-semibold ${assignment.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{assignment.name}</p>
                    <div className={`flex items-center gap-2 text-sm ${assignment.done ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>{assignment.subject?.name || '未分類'}</span>
                      <span className="flex items-center gap-1">
                        <FiCalendar size={14} />
                        {/* ▼▼▼ 日付表示をフォーマット関数を使うように変更 ▼▼▼ */}
                        <span>{formatDateTime(assignment.deadline)}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteAssignment(assignment.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                  <FiTrash2 size={18}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- 課題追加フォームエリア --- */}
      <div className="bg-slate-800/50 p-4 rounded-lg">
        <h3 className="font-bold text-lg text-slate-200 mb-4">新しい課題を追加</h3>
        <form onSubmit={handleAddAssignment} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="課題名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <select
              value={newSubjectId}
              onChange={(e) => setNewSubjectId(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded-md w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            >
              <option value="">科目を選択</option>
              {subject.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded-md w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded-md w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg transition-colors">
            <FiPlus size={20} />
            <span>課題を追加</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assignments;