/* src/components/Assignments.tsx */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ChapterFrame from './ChapterFrame'; 
import { FiPlus, FiTrash2, FiCalendar, FiInbox, FiEdit, FiTool } from 'react-icons/fi';
import { format } from 'date-fns'; // format関数をインポート

// Mantineのコンポーネントをインポート
import { TextInput, Select, Button, Group, Checkbox, useMantineTheme } from '@mantine/core';
import { DatePickerInput, type DayProps } from '@mantine/dates';
import 'dayjs/locale/ja'; // DatePickerの日本語化

// --- 型定義 ---
type Subject = { id: number; name: string; };

// Supabaseからのデータ型に合わせて修正
type Assignment = {
  id: number;
  name: string;
  deadline: string;
  done: boolean;
  subject: { name: string } | null;
};

interface AssignmentsProps {
  subject: Subject[];
}

const formatDateTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return format(date, "MM/dd HH:mm");
};

const today = new Date();
today.setHours(0, 0, 0, 0);


const Assignments: React.FC<AssignmentsProps> = ({ subject }) => {
  const theme = useMantineTheme();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('assignment')
      .select('id, name, deadline, done, subject(name)')
      .order('done', { ascending: true })
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Error fetching assignments:', error);
    } else if (data) {
      setAssignments(data as unknown as Assignment[]);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profile') 
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user role:', profileError);
        } else if (profileData) {
          setUserRole(profileData.role);
        }
      }

      await fetchAssignments();
      setLoading(false);
    };

    fetchInitialData();
  }, []);

  const getDayProps = (dateString: string): Partial<DayProps> => {
    const [year, month, day] = dateString.split('-').map(Number);
    const calendarDate = new Date(year, month - 1, day);
    const styles: React.CSSProperties = {};

    if (calendarDate.getDay() === 6) {
      styles.color = theme.colors.blue[6];
    }
    if (calendarDate.getTime() === today.getTime()) {
      styles.outline = `2px solid ${theme.colors.teal[6]}`;
      styles.outlineOffset = '-2px';
    }
    return { style: styles };
  };

  // 課題を追加する処理
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newName || !newDate) return;

    const datePart = format(newDate, 'yyyy-MM-dd');
    const timePart = newTime || '23:59';
    const localDateTimeString = `${datePart}T${timePart}`;
    const deadlineDate = new Date(localDateTimeString);
    const deadlineForSupabase = deadlineDate.toISOString();

    const { error } = await supabase.from('assignment').insert({
      name: newName,
      deadline: deadlineForSupabase,
      subject_id: newSubjectId ? parseInt(newSubjectId, 10) : null,
      user_id: user.id,
    });

    if (error) {
      console.error('Error adding assignment:', error);
    } else {
      setNewName('');
      setNewDate(null);
      setNewTime('');
      setNewSubjectId(null);
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
      // 完了状態の切り替えはUIの応答性を優先してローカルで更新
      setAssignments(prev =>
        prev.map(assign =>
          assign.id === id ? { ...assign, done: !currentStatus } : assign
        ).sort((a, b) => Number(a.done) - Number(b.done) || new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) // ソート順を維持
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

  if (loading) return <p className="text-slate-400 text-center py-10">読み込み中...</p>;

  return (
    <ChapterFrame
      title={
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
            <FiEdit className="text-cyan-400 text-2xl sm:text-3xl" />
            <span className="font-orbitron font-bold text-cyan-300 text-glow text-xl sm:text-3xl">
              課題
            </span>
          </div>

          {userRole === 'admin' && (
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
              <Button
                onClick={() => setIsAdminMode(prev => !prev)}
                variant="outline"
                color={isAdminMode ? "cyan" : "yellow"}
                size="sm"
              >
                <div className="flex items-center justify-center">
                  <FiTool size={16} />
                  <span className="hidden sm:inline ml-2">
                    {isAdminMode ? '通常モード' : '管理者モード'}
                  </span>
                </div>
              </Button>
            </div>
          )}
        </>
      }
    >
      {isAdminMode && userRole === 'admin' ? (
        // 管理者モードの表示
        <div className="flex items-center justify-center w-full h-96 bg-slate-800/50 rounded-lg">
          <p className="text-slate-300 text-xl font-bold">
            管理者モードです
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-8 md:px-10 pt-2 pb-2">
          {/* --- 課題一覧エリア --- */}
      <div>
        {assignments.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-800/50 rounded-lg">
            <FiInbox size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="font-bold text-lg text-slate-300">課題はまだありません</h3>
            <p className="text-slate-400 mt-1">下のフォームから新しい課題を追加しましょう。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(assignment => (
              <div 
                key={assignment.id} 
                className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 ${assignment.done ? 'bg-slate-800/60 border-l-4 border-slate-600' : 'bg-slate-700/80 border-l-4 border-cyan-500'}`}
              >
                <div className="flex items-center w-full min-w-0">
                  <Checkbox
                    checked={assignment.done}
                    onChange={() => handleToggleDone(assignment.id, assignment.done)}
                    size="md"
                  />
                  <div className="ml-4 w-full min-w-0">
                  <p className={`font-semibold truncate ${assignment.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{assignment.name}</p>
                  
                  <div className={`
                    flex items-center 
                    md:justify-start md:gap-2 
                    text-xs md:text-sm 
                    ${assignment.done ? 'text-slate-600' : 'text-slate-400'}`}>
                    
                    {/* モバイル表示時の左半分 */}
                    <span className="flex items-center gap-1 mr-3 md:w-auto">
                      <FiCalendar size={14} />
                      <span className="truncate">{formatDateTime(assignment.deadline)}</span>
                    </span>
                    
                    {/* モバイル表示時の右半分 */}
                    <span className="truncate md:w-auto">
                      {assignment.subject?.name || '未分類'}
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

      {/* --- 課題追加フォームエリア (Mantine UI) --- */}
      <div className="bg-slate-800/50 p-4 rounded-lg">
        <h3 className="font-bold text-md text-slate-200 mb-3">新しい課題を追加</h3>
        <form onSubmit={handleAddAssignment} className="space-y-2">
          <TextInput
            label="課題名"
            placeholder="例）中間レポート"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            required
          />
          <Select
            label="科目"
            placeholder="科目を選択"
            data={subject.map(s => ({ value: s.id.toString(), label: s.name }))}
            value={newSubjectId}
            onChange={(value) => setNewSubjectId(value)}
            searchable
            nothingFoundMessage="科目が見つかりません"
          />
          <Group grow>
            <DatePickerInput
              label="期限日"
              placeholder="日付を選択"
              value={newDate}
              // 【v8仕様】 onChangeは文字列を返すので、直接setNewDateでOK
              onChange={setNewDate}
              locale="ja"
              valueFormat="YYYY/MM/DD"
              required
              firstDayOfWeek={0}
              // 【v8仕様】 getDayPropsを使用します
              getDayProps={getDayProps}
            />
            <TextInput label="時刻（任意）" type="time" value={newTime} onChange={(e) => setNewTime(e.currentTarget.value)} />
          </Group>
          <Button 
            type="submit" 
            fullWidth 
            leftSection={<FiPlus size={16} />} 
            className="mt-6 max-w-md mx-auto"
          >
            課題を追加
          </Button>
        </form>
      </div>
    </div>
      )}
    </ChapterFrame>
  );
};

export default Assignments;