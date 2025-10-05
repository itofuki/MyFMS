import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import ChapterFrame from './ChapterFrame';
import { FiPlus, FiTrash2, FiCalendar, FiInbox, FiEdit, FiTool } from 'react-icons/fi';
import { format } from 'date-fns';
import { TextInput, Select, Button, Group, Checkbox, useMantineTheme } from '@mantine/core';
import { DatePickerInput, type DayProps } from '@mantine/dates';
import 'dayjs/locale/ja';
import type { User } from '@supabase/supabase-js';

// --- 型定義 ---
type Assignment = {
  id: number;
  name: string;
  deadline: string;
  done: boolean;
  classification: 'official' | 'individual'; // 課題の種別
  user_id: string | null; // individual課題の所有者
  subject: { name: string } | null;
};

type Subject = { id: number; name: string };

interface AssignmentsProps {
  subject: Subject[];
}

// --- ヘルパー関数 ---
const formatDateTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return format(date, "MM/dd HH:mm");
};

const today = new Date();
today.setHours(0, 0, 0, 0);


// --- コンポーネント本体 ---
const Assignments: React.FC<AssignmentsProps> = ({ subject }) => {
  const theme = useMantineTheme();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // フォーム用State
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<string | null>(null);

  // --- データ取得 ---
  const fetchAssignments = async (user: User | null) => {
    if (!user) {
      setAssignments([]);
      return;
    }
    // official課題、または自分が作成したindividual課題を取得
    const { data, error } = await supabase
      .from('assignment')
      .select('id, name, deadline, done, classification, user_id, subject(name)')
      .or(`classification.eq.official,and(classification.eq.individual,user_id.eq.${user.id})`)
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
      setCurrentUser(user);

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
      await fetchAssignments(user);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // --- イベントハンドラ ---
  const getDayProps = (dateString: string): Partial<DayProps> => {
  // Mantineから渡される 'YYYY-MM-DD' 形式の文字列を分解してDateオブジェクトに変換
  // この方法がタイムゾーンの影響を受けにくく、最も安全です
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const styles: React.CSSProperties = {};
  
  // 土曜日(6)のスタイル
  if (date.getDay() === 6) {
    styles.color = theme.colors.blue[6];
  }

  // 今日の日付(today)と比較してスタイルを適用
  if (date.getTime() === today.getTime()) {
    styles.outline = `2px solid ${theme.colors.teal[6]}`;
    styles.outlineOffset = '-2px';
  }

  return { style: styles };
};

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newName || !newDate) return;

    const datePart = format(newDate, 'yyyy-MM-dd');
    const timePart = newTime || '23:59';
    const deadlineForSupabase = new Date(`${datePart}T${timePart}:00`).toISOString();

    const isOfficial = isAdminMode && userRole === 'admin';
    const newAssignment = {
      name: newName,
      deadline: deadlineForSupabase,
      subject_id: newSubjectId ? parseInt(newSubjectId, 10) : null,
      classification: isOfficial ? 'official' : 'individual' as const,
      user_id: isOfficial ? null : currentUser.id,
    };

    const { error } = await supabase.from('assignment').insert(newAssignment);

    if (error) {
      console.error('Error adding assignment:', error);
    } else {
      setNewName('');
      setNewDate(null);
      setNewTime('');
      setNewSubjectId(null);
      await fetchAssignments(currentUser);
    }
  };

  const handleToggleDone = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('assignment')
      .update({ done: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating assignment:', error);
    } else {
      setAssignments(prev =>
        prev.map(assign =>
          assign.id === id ? { ...assign, done: !currentStatus } : assign
        ).sort((a, b) => Number(a.done) - Number(b.done) || new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      );
    }
  };
  
  const handleDeleteAssignment = async (id: number) => {
    const { error } = await supabase
      .from('assignment')
      .delete()
      .eq('id', id);

    if(error) {
      console.error('Error deleting assignment:', error);
    } else {
      await fetchAssignments(currentUser);
    }
  };

  const getAssignmentStyles = (assignment: Assignment): string => {
    // 公式課題は完了状態に関わらず、専用のスタイルを適用
    if (assignment.classification === 'official') {
      return 'bg-slate-800 border-l-4 border-amber-400 shadow-md shadow-amber-500/10';
    }
    // 個人課題は完了状態に応じてスタイルを変更
    if (assignment.done) {
      return 'bg-slate-800/60 border-l-4 border-slate-600';
    }
    return 'bg-slate-700/80 border-l-4 border-cyan-500';
  };

  // --- 表示用データ生成 ---
  const displayedAssignments = useMemo(() => {
    if (isAdminMode && userRole === 'admin') {
      return assignments.filter(a => a.classification === 'official');
    }
    return assignments;
  }, [assignments, isAdminMode, userRole]);


  if (loading) return <p className="text-slate-400 text-center py-10">読み込み中...</p>;

  // --- レンダリング ---
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
                size="xs"
                className="sm:px-4 sm:text-sm"
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
      <div className="w-full flex flex-col gap-8 md:px-10 pt-2 pb-2">
        {/* --- 課題一覧エリア --- */}
        <div>
          {displayedAssignments.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-800/50 rounded-lg">
              <FiInbox size={48} className="mx-auto text-slate-500 mb-4" />
              <h3 className="font-bold text-lg text-slate-300">
                {isAdminMode ? '表示できる公式課題はありません' : '課題はまだありません'}
              </h3>
              <p className="text-slate-400 mt-1">下のフォームから新しい課題を追加しましょう。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedAssignments.map(assignment => {
                const canModify = (isAdminMode && userRole === 'admin') || 
                                  (assignment.classification === 'individual' && assignment.user_id === currentUser?.id);

                return (
                  <div 
                    key={assignment.id} 
                    className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 ${getAssignmentStyles(assignment)}`}
                  >
                    <div className="flex items-center w-full min-w-0">
                      <Checkbox
                        checked={assignment.done}
                        onChange={() => handleToggleDone(assignment.id, assignment.done)}
                        size="md"
                        disabled={!canModify}
                      />
                      <div className="ml-4 w-full min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold truncate ${assignment.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{assignment.name}</p>
                        </div>
                        <div className={`flex items-center text-xs md:text-sm mt-1 ${assignment.done ? 'text-slate-600' : 'text-slate-400'}`}>
                          <span className="flex items-center gap-1 mr-3 whitespace-nowrap">
                            <FiCalendar size={14} />
                            <span>{formatDateTime(assignment.deadline)}</span>
                          </span>
                          <span className="block truncate">
                            {assignment.subject?.name || '未分類'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canModify && (
                      <button onClick={() => handleDeleteAssignment(assignment.id)} className="text-slate-500 hover:text-red-500 transition-colors ml-2">
                        <FiTrash2 size={18}/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- 課題追加フォームエリア --- */}
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <h3 className="font-bold text-md text-slate-200 mb-3">
            {isAdminMode && userRole === 'admin' ? '新しい[公式]課題を追加' : '新しい個人課題を追加'}
          </h3>
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
                onChange={setNewDate}
                locale="ja"
                valueFormat="YYYY/MM/DD"
                required
                firstDayOfWeek={0}
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
              {isAdminMode && userRole === 'admin' ? '公式課題として追加' : '個人課題を追加'}
            </Button>
          </form>
        </div>
      </div>
    </ChapterFrame>
  );
};

export default Assignments;