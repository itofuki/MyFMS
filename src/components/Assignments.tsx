import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import ChapterFrame from './ChapterFrame';
import { FiPlus, FiTrash2, FiCalendar, FiInbox, FiFileText, FiTool, FiLink, FiEdit2, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import { TextInput, Select, Button, Group, Checkbox, useMantineTheme, SimpleGrid } from '@mantine/core';
import { DatePickerInput, type DayProps } from '@mantine/dates';
import 'dayjs/locale/ja';
import type { User } from '@supabase/supabase-js';

// --- 型定義 ---
type Assignment = {
  id: number;
  name: string;
  deadline: string;
  done: boolean;
  classification: 'official' | 'private';
  user_id: string | null;
  subject_name: string | null;
  url: string | null;
};

type Subject = { id: number; name: string };
interface AssignmentsProps { subject: Subject[] }

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

  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // フォーム用State
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [newTime, setNewTime] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');

  // --- データ取得 ---
  const fetchAssignments = async () => {
    const { data, error } = await supabase.rpc('get_user_assignments');
    if (error) { console.error('Error fetching assignments:', error); setAssignments([]); }
    else if (data) { setAssignments(data as Assignment[]); }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
        if (profileData) setUserRole(profileData.role);
      }
      await fetchAssignments();
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // --- イベントハンドラ ---
  const getDayProps = (dateString: string): Partial<DayProps> => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const styles: React.CSSProperties = {};
    if (date.getDay() === 6) { styles.color = theme.colors.blue[6]; }
    if (date.getTime() === today.getTime()) {
      styles.outline = `2px solid ${theme.colors.teal[6]}`;
      styles.outlineOffset = '-2px';
    }
    return { style: styles };
  };

  const handleDateChange = (value: Date | string | null | any) => {
    if (!value) {
      setNewDate(null);
      return;
    }
    setNewDate(new Date(value));
  };

  const resetForm = () => {
    setEditingId(null);
    setNewName('');
    setNewDate(null);
    setNewTime('');
    setNewSubjectId(null);
    setNewUrl('');
  };

  const handleEditClick = (assign: Assignment) => {
    setEditingId(assign.id);
    setNewName(assign.name);
    setNewUrl(assign.url || '');
    
    const matchedSubject = subject.find(s => s.name === assign.subject_name);
    setNewSubjectId(matchedSubject ? matchedSubject.id.toString() : null);
    
    const dateObj = new Date(assign.deadline);
    setNewDate(dateObj);
    setNewTime(format(dateObj, 'HH:mm'));

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleAddOrUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newName || !newDate) return;
    
    const datePart = format(newDate, 'yyyy-MM-dd');
    const timePart = newTime || '23:59';
    const deadlineForSupabase = new Date(`${datePart}T${timePart}:00`).toISOString();
    
    const isOfficial = isAdminMode && userRole === 'admin';
    
    if (editingId) {
      const updatePayload = {
        name: newName,
        deadline: deadlineForSupabase,
        subject_id: newSubjectId ? parseInt(newSubjectId, 10) : null,
        url: newUrl || null,
      };

      const { error } = await supabase.from('assignment').update(updatePayload).eq('id', editingId);
      if (!error) {
        resetForm();
        await fetchAssignments();
      } else {
        console.error('Error updating assignment:', error);
        alert('課題の更新に失敗しました。');
      }
    } else {
      const newAssignment = {
        name: newName,
        deadline: deadlineForSupabase,
        subject_id: newSubjectId ? parseInt(newSubjectId, 10) : null,
        classification: isOfficial ? 'official' : 'private' as const,
        user_id: currentUser.id,
        url: newUrl || null,
      };
      
      const { error } = await supabase.from('assignment').insert(newAssignment);
      if (!error) {
        resetForm();
        await fetchAssignments();
      } else {
        console.error('Error adding assignment:', error);
        alert('課題の追加に失敗しました。権限がありません。');
      }
    }
  };
  
  const handleToggleDone = async (assignmentId: number, currentStatus: boolean) => {
    if (!currentUser) return;
    const newStatus = !currentStatus;
    setAssignments(prev => prev.map(assign => assign.id === assignmentId ? { ...assign, done: newStatus } : assign));
    
    const { error } = await supabase.from('assignment_status').upsert(
      { user_id: currentUser.id, assignment_id: assignmentId, done: newStatus }, 
      { onConflict: 'user_id, assignment_id' }
    );
    if (error) {
      console.error('Error updating status:', error);
      setAssignments(prev => prev.map(assign => assign.id === assignmentId ? { ...assign, done: currentStatus } : assign));
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!window.confirm("本当にこの課題を削除しますか？")) return;
    
    const { error } = await supabase
      .from('assignment')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assignment:', error);
      alert('課題の削除に失敗しました。');
    } else {
      setAssignments(prev => prev.filter(a => a.id !== id));
      if (editingId === id) resetForm(); 
    }
  };

  const getAssignmentStyles = (assignment: Assignment): string => {
    if (assignment.classification === 'official') {
      return `bg-slate-800 border-l-4 ${assignment.done ? 'border-amber-700' : 'border-amber-400'}`;
    }
    if (assignment.done) { return 'bg-slate-800/60 border-l-4 border-slate-600'; }
    return 'bg-slate-700/80 border-l-4 border-cyan-500';
  };

  // --- 表示用データ生成 ---
  const displayedAssignments = useMemo(() => {
    const enrolledSubjectNames = subject.map(s => s.name);
    const filteredBySubject = assignments.filter(assignment => 
      !assignment.subject_name || enrolledSubjectNames.includes(assignment.subject_name)
    );
    if (isAdminMode && userRole === 'admin') {
      return filteredBySubject.filter(a => a.classification === 'official');
    }
    return filteredBySubject;
  }, [assignments, isAdminMode, userRole, subject]);

  if (loading) return <p className="text-slate-400 text-center py-10">読み込み中...</p>;

  // --- レンダリング ---
  return (
    // 🌟 修正：最外周のdiv。管理者モード時は背景を少し黄色く（bg-yellow-900/30）する。枠線とシャドウは削除。
    <div className={`transition-all duration-300 ${isAdminMode ? 'bg-yellow-900/30' : ''}`}>
    <ChapterFrame
      title={
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
            <FiFileText className={`text-2xl sm:text-3xl transition-colors ${isAdminMode ? 'text-yellow-400' : 'text-cyan-400'}`} />
            <span className={`font-orbitron font-bold text-glow text-xl sm:text-3xl transition-colors ${isAdminMode ? 'text-yellow-400' : 'text-cyan-300'}`}>
              課題
            </span>
          </div>
          {userRole === 'admin' && (
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
              <Button
                onClick={() => {
                  setIsAdminMode(prev => !prev);
                  resetForm();
                }}
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
      <div className={`w-full flex flex-col gap-8 md:px-10 p-2 sm:p-4 rounded-xl transition-all duration-300`}>
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
                const canDelete = (isAdminMode && userRole === 'admin') || 
                                  (assignment.classification === 'private' && assignment.user_id === currentUser?.id);

                return (
                  <div 
                    key={assignment.id} 
                    className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 ${getAssignmentStyles(assignment)} ring-cyan-500 ${editingId === assignment.id ? 'ring-2' : ''}`}
                  >
                    <div className="flex items-center w-full min-w-0">
                      <Checkbox
                        checked={assignment.done}
                        onChange={() => handleToggleDone(assignment.id, assignment.done)}
                        size="md"
                      />
                      <div className="ml-4 w-full min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {assignment.url ? (
                            <a 
                              href={assignment.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`font-semibold truncate hover:underline transition-colors ${assignment.done ? 'text-slate-500 line-through' : (isAdminMode ? 'text-yellow-400' : 'text-cyan-400')}`}
                            >
                              {assignment.name}
                            </a>
                          ) : (
                            <p className={`font-semibold truncate transition-colors ${assignment.done ? 'text-slate-500 line-through' : (isAdminMode ? 'text-yellow-400' : 'text-slate-100')}`}>
                              {assignment.name}
                            </p>
                          )}
                        </div>
                        <div className={`flex items-center text-xs md:text-sm mt-1 ${assignment.done ? 'text-slate-600' : 'text-slate-400'}`}>
                          <span className="flex items-center gap-1 mr-3 whitespace-nowrap">
                            <FiCalendar size={14} />
                            <span>{formatDateTime(assignment.deadline)}</span>
                          </span>
                          <span className="block truncate">{assignment.subject_name || '未分類'}</span>
                        </div>
                      </div>
                    </div>
                    {canDelete && (
                      <div className="flex items-center gap-1 sm:gap-2 ml-2 flex-shrink-0">
                        <button 
                          onClick={() => handleEditClick(assignment)} 
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-full transition-colors"
                          aria-label="編集"
                        >
                          <FiEdit2 size={18}/>
                        </button>
                        <button onClick={() => handleDeleteAssignment(assignment.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-700/50 rounded-full transition-colors ml-2" aria-label="削除">
                          <FiTrash2 size={18}/>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- 課題追加・編集フォームエリア --- */}
        <div ref={formRef} className={`bg-slate-800/50 p-4 rounded-lg transition-all duration-300 ring-cyan-500 ${editingId ? 'ring-2 shadow-lg shadow-cyan-500/10' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-md text-slate-200 flex items-center gap-2">
              {editingId ? (
                <><FiEdit2 className="text-cyan-400" /> 課題を編集</>
              ) : (
                <><FiPlus className="text-slate-400" /> {isAdminMode && userRole === 'admin' ? '新しい[公式]課題を追加' : '新しい個人課題を追加'}</>
              )}
            </h3>
            {editingId && (
              <Button size="xs" variant="subtle" color="gray" onClick={resetForm} leftSection={<FiX />}>
                キャンセル
              </Button>
            )}
          </div>
          
          <form onSubmit={handleAddOrUpdateAssignment} className="space-y-2">
            <TextInput
              label="課題名"
              placeholder="例）中間レポート"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              required
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Select
                label="科目"
                placeholder="科目を選択"
                data={subject.map(s => ({ value: s.id.toString(), label: s.name }))}
                value={newSubjectId}
                onChange={(value) => setNewSubjectId(value)}
                searchable
                nothingFoundMessage="科目が見つかりません"
              />
              <TextInput
                label="URL（任意）"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.currentTarget.value)}
                leftSection={<FiLink size={16} />}
              />
            </SimpleGrid>
            <Group grow>
              <DatePickerInput
                label="期限日"
                placeholder="日付を選択"
                value={newDate}
                onChange={handleDateChange}
                locale="ja"
                valueFormat="YYYY/MM/DD"
                required
                firstDayOfWeek={0}
                getDayProps={getDayProps}
              />
              <TextInput label="時刻（任意）" type="time" value={newTime} onChange={(e) => setNewTime(e.currentTarget.value)} />
            </Group>
            
            <Group grow className="mt-6 max-w-md mx-auto">
              <Button 
                type="submit" 
                color={editingId ? "cyan" : "blue"}
                leftSection={editingId ? <FiEdit2 size={16} /> : <FiPlus size={16} />} 
              >
                {editingId ? '更新を保存する' : (isAdminMode && userRole === 'admin' ? '公式課題として追加' : '個人課題を追加')}
              </Button>
            </Group>
          </form>
        </div>
      </div>
    </ChapterFrame>
    </div>
  );
};

export default Assignments;