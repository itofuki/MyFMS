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

type Subject = { 
  id: number; 
  name: string; 
};

type DbSubject = {
  id: number;
  category_code: string; 
  subject_classes: any[];
  subject_departments: any[];
  subject_courses: any[];
};

interface AssignmentsProps { subject: Subject[] }

interface LmsEvent {
  uid: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  categoryCode?: string;
  url?: string;
}

type UnifiedAssignment = {
  id: number | string;
  name: string;
  deadline: string;
  done: boolean;
  classification: 'official' | 'private';
  user_id: string | null;
  subject_name: string | null;
  url: string | null;
  isLms: boolean;
  description?: string;
  subjectCategoryType: 'class' | 'department' | 'course' | 'none';
};

type LmsStatus = {
  lms_uid: string;
  done: boolean;
};

// --- ヘルパー関数 ---
const formatDateTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return format(date, "MM/dd HH:mm");
};
const today = new Date();
today.setHours(0, 0, 0, 0);

const getDeadlineStatus = (deadlineDate: string, isDone: boolean) => {
  if (isDone) return { color: 'text-slate-600', label: '' };
  
  const now = new Date();
  const deadline = new Date(deadlineDate);
  const diffTime = deadline.getTime() - now.getTime();
  
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffTime < 0) return { color: 'text-red-600 font-bold', label: '(Overdue)' };
  
  if (diffHours < 24) {
    const hours = diffHours === 0 ? '1' : diffHours;
    return { color: 'text-red-400 font-bold', label: `(あと ${hours} 時間)` };
  }
  
  return {
    color: diffDays <= 3 ? 'text-orange-400 font-bold' : 'text-slate-400',
    label: `(あと ${diffDays} 日)`
  };
};

const getSubjectCategoryType = (dbSub?: DbSubject): 'class' | 'department' | 'course' | 'none' => {
  if (!dbSub) return 'none';
  if (dbSub.subject_classes && dbSub.subject_classes.length > 0) return 'class';
  if (dbSub.subject_departments && dbSub.subject_departments.length > 0) return 'department';
  if (dbSub.subject_courses && dbSub.subject_courses.length > 0) return 'course';
  return 'none';
};

const getBadgeStyle = (type: string, isDone: boolean) => {
  if (isDone) return 'bg-slate-700/50 text-slate-500 border-slate-600/50'; 

  switch (type) {
    case 'class': return 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50';
    case 'department': return 'bg-indigo-900/30 text-indigo-300 border-indigo-800/50';
    case 'course': return 'bg-purple-900/30 text-purple-300 border-purple-800/50';
    default: return 'bg-cyan-900/30 text-cyan-300 border-cyan-800/50';
  }
};

const Assignments: React.FC<AssignmentsProps> = ({ subject }) => {
  const theme = useMantineTheme();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [lmsEvents, setLmsEvents] = useState<LmsEvent[]>([]);
  const [dbSubjects, setDbSubjects] = useState<DbSubject[]>([]);
  const [lmsStatuses, setLmsStatuses] = useState<LmsStatus[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [newTime, setNewTime] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');

  const fetchAssignments = async () => {
    const { data, error } = await supabase.rpc('get_user_assignments');
    if (error) { console.error('Error fetching assignments:', error); setAssignments([]); }
    else if (data) { setAssignments(data as Assignment[]); }
  };

  const fetchLmsEvents = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-lms-calendar');
      if (error) throw error;
      if (data && data.events) {
        setLmsEvents(data.events);
      }
    } catch (err) {
      console.error("LMSカレンダー取得エラー:", err);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      const fetchDbSubjects = async () => {
        const { data, error } = await supabase
          .from('subjects')
          .select(`
            id, 
            category_code,
            subject_classes (subject_id),
            subject_departments (subject_id),
            subject_courses (subject_id)
          `);
          
        if (!error && data) {
          setDbSubjects(data as DbSubject[]);
        } else if (error) {
          console.error("subjectsテーブルのJOIN取得エラー:", error);
        }
      };

      let fetches: Promise<any>[] = [
        fetchAssignments(),
        fetchLmsEvents(),
        fetchDbSubjects()
      ];

      if (user) {
        const fetchUserProfile = async () => {
          const { data: profileData } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
          if (profileData) setUserRole(profileData.role);
        };
        const fetchLmsStatuses = async () => {
          const { data, error } = await supabase.from('lms_assignment_status').select('lms_uid, done').eq('user_id', user.id);
          if (!error && data) setLmsStatuses(data);
        };

        fetches.push(fetchUserProfile());
        fetches.push(fetchLmsStatuses());
      }
      
      await Promise.all(fetches);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

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

  const handleEditClick = (assign: UnifiedAssignment) => {
    if (assign.isLms) return; 
    setEditingId(assign.id as number);
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
  
  const handleToggleDone = async (assignmentId: number | string, currentStatus: boolean, isLms: boolean) => {
    if (!currentUser) return;
    const newStatus = !currentStatus;
    if (isLms) {
      setLmsStatuses(prev => {
        const existing = prev.find(s => s.lms_uid === assignmentId);
        if (existing) {
          return prev.map(s => s.lms_uid === assignmentId ? { ...s, done: newStatus } : s);
        }
        return [...prev, { lms_uid: assignmentId as string, done: newStatus }];
      });
      const { error } = await supabase.from('lms_assignment_status').upsert(
        { user_id: currentUser.id, lms_uid: assignmentId as string, done: newStatus }, 
        { onConflict: 'user_id, lms_uid' }
      );
      if (error) {
        console.error('Error updating LMS status:', error);
        alert('ステータスの更新に失敗しました。');
        setLmsStatuses(prev => prev.map(s => s.lms_uid === assignmentId ? { ...s, done: currentStatus } : s));
      }
    } else {
      setAssignments(prev => prev.map(assign => assign.id === assignmentId ? { ...assign, done: newStatus } : assign));
      const { error } = await supabase.from('assignment_status').upsert(
        { user_id: currentUser.id, assignment_id: assignmentId as number, done: newStatus }, 
        { onConflict: 'user_id, assignment_id' }
      );
      if (error) {
        console.error('Error updating status:', error);
        setAssignments(prev => prev.map(assign => assign.id === assignmentId ? { ...assign, done: currentStatus } : assign));
      }
    }
  };

  const handleDeleteAssignment = async (id: number | string, isLms: boolean) => {
    if (isLms) return; 
    if (!window.confirm("本当にこの課題を削除しますか？")) return;
    const { error } = await supabase.from('assignment').delete().eq('id', id as number);
    if (error) {
      console.error('Error deleting assignment:', error);
      alert('課題の削除に失敗しました。');
    } else {
      setAssignments(prev => prev.filter(a => a.id !== id));
      if (editingId === id) resetForm(); 
    }
  };

  const getAssignmentStyles = (assignment: UnifiedAssignment): string => {
    if (assignment.classification === 'official') {
      return `bg-slate-800 border-l-4 ${assignment.done ? 'border-amber-700' : 'border-amber-400'}`;
    }
    if (assignment.done) { return 'bg-slate-800/60 border-l-4 border-slate-600'; }
    return 'bg-slate-700/80 border-l-4 border-cyan-500';
  };

  const unifiedAssignments = useMemo(() => {
    const enrolledSubjectNames = subject.map(s => s.name);
    const filteredDb = assignments.filter(assignment => 
      !assignment.subject_name || enrolledSubjectNames.includes(assignment.subject_name)
    );
    const dbUnified: UnifiedAssignment[] = filteredDb.map(a => {
      const matchedSubjectProp = subject.find(s => s.name === a.subject_name);
      const dbSub = matchedSubjectProp ? dbSubjects.find(s => s.id === matchedSubjectProp.id) : undefined;
      return {
        ...a,
        isLms: false,
        subjectCategoryType: getSubjectCategoryType(dbSub)
      };
    });

    const nowDate = new Date();
    const twoWeeksLater = new Date(nowDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const excludedKeywords = ['出欠', '出席', 'attendance', 'アンケート開始'];
    const filteredLms = lmsEvents.filter(e => {
      const eventTime = e.end ? new Date(e.end) : new Date(e.start);
      const isWithinTwoWeeks = eventTime >= nowDate && eventTime <= twoWeeksLater;
      const summaryLower = e.summary.toLowerCase(); 
      const hasExcludedKeyword = excludedKeywords.some(keyword => summaryLower.includes(keyword));
      return isWithinTwoWeeks && !hasExcludedKeyword;
    });

    const lmsUnified: UnifiedAssignment[] = filteredLms.map(event => {
      const matchedSubject = dbSubjects.find(s => s.category_code && event.categoryCode && s.category_code === event.categoryCode);
      let eventUrl = '';
      if (matchedSubject) eventUrl = `https://lms-tokyo.iput.ac.jp/course/view.php?id=${matchedSubject.id}`;
      else if (event.categoryCode) eventUrl = `https://lms-tokyo.iput.ac.jp/course/search.php?search=${event.categoryCode}`;
      else if (event.url) eventUrl = event.url;
      const displaySubjectName = subject.find(s => s.id === matchedSubject?.id)?.name || '未分類(LMS)';
      const statusObj = lmsStatuses.find(s => s.lms_uid === event.uid);
      const isDone = statusObj ? statusObj.done : false;

      return {
        id: event.uid,
        name: event.summary,
        deadline: event.end || event.start,
        done: isDone, 
        classification: 'official',
        user_id: null,
        subject_name: displaySubjectName,
        url: eventUrl,
        isLms: true,
        description: event.description,
        subjectCategoryType: getSubjectCategoryType(matchedSubject)
      };
    });

    let combined = [...dbUnified, ...lmsUnified];
    if (isAdminMode && userRole === 'admin') combined = combined.filter(a => a.classification === 'official');
    return combined.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [assignments, lmsEvents, dbSubjects, subject, isAdminMode, userRole, lmsStatuses]);

  if (loading) return <p className="text-slate-400 text-center py-10">読み込み中...</p>;

  return (
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
                  onClick={() => { setIsAdminMode(prev => !prev); resetForm(); }}
                  variant="outline"
                  color={isAdminMode ? "cyan" : "yellow"}
                  size="xs"
                  className="sm:px-4 sm:text-sm"
                >
                  <div className="flex items-center justify-center">
                    <FiTool size={16} />
                    <span className="hidden sm:inline ml-2">{isAdminMode ? '通常モード' : '管理者モード'}</span>
                  </div>
                </Button>
              </div>
            )}
          </>
        }
      >
        <div className="w-full flex flex-col gap-8 md:px-10 p-2 sm:p-4 rounded-xl transition-all duration-300">
          <div>
            {unifiedAssignments.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <FiInbox size={32} className="mx-auto text-slate-500 mb-3" />
                <p className="text-slate-400 text-sm">{isAdminMode ? '表示できる公式課題はありません' : '直近2週間の課題はまだありません 🎉'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unifiedAssignments.map(assignment => {
                  const canDelete = !assignment.isLms && ((isAdminMode && userRole === 'admin') || (assignment.classification === 'private' && assignment.user_id === currentUser?.id));
                  const cleanTitle = (title: string) => title.replace(/[「」]|の提出期限/g, '');
                  const status = getDeadlineStatus(assignment.deadline, assignment.done);

                  return (
                    <div key={assignment.id} className={`p-4 rounded-lg flex transition-all duration-300 ${getAssignmentStyles(assignment)} ring-cyan-500 ${editingId === assignment.id ? 'ring-2' : ''} items-center`}>
                      {/* 🌟 チェックボックス：flex-shrink-0でサイズを固定 */}
                      <Checkbox
                        checked={assignment.done}
                        onChange={() => handleToggleDone(assignment.id, assignment.done, assignment.isLms)}
                        size="md"
                        className="flex-shrink-0"
                      />
                      
                      {/* 🌟 メインコンテンツ：タイトル・説明文など全てを包含 */}
                      <div className="ml-4 w-full min-w-0 flex flex-col gap-1">
                        {/* 上段：教科名・締め切り */}
                        <div className="flex justify-between items-center w-full gap-2">
                          <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border inline-block truncate max-w-full transition-colors duration-300 ${getBadgeStyle(assignment.subjectCategoryType, assignment.done)}`}>
                            {assignment.subject_name || '未分類'}
                          </span>
                          <div className={`flex items-center gap-1 whitespace-nowrap text-xs md:text-sm flex-shrink-0 ${status.color}`}>
                            <FiCalendar size={14} />
                            <span>{formatDateTime(assignment.deadline)}</span>
                            {status.label && <span className="hidden md:inline ml-1 text-[10px] md:text-xs opacity-90">{status.label}</span>}
                          </div>
                        </div>

                        {/* --- 下段：タイトル(左) と 操作ボタン(右下) --- */}
                        <div className="flex justify-between items-end w-full gap-4">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {assignment.url ? (
                              <a 
                                href={assignment.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                /* 🌟 text-slate-100 に統一。完了時は line-through と text-slate-500 を適用 */
                                className={`font-semibold text-base sm:text-lg truncate hover:underline transition-colors flex items-center gap-2 ${
                                  assignment.done ? 'text-slate-500 line-through' : 'text-slate-100'
                                }`}
                              >
                                {cleanTitle(assignment.name)}
                                {assignment.isLms && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/30 flex-shrink-0 mt-0.5">LMS</span>}
                              </a>
                            ) : (
                              <p 
                                /* 🌟 text-slate-100 に統一 */
                                className={`font-semibold text-base sm:text-lg truncate transition-colors flex items-center gap-2 ${
                                  assignment.done ? 'text-slate-500 line-through' : 'text-slate-100'
                                }`}
                              >
                                {cleanTitle(assignment.name)}
                                {assignment.isLms && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/30 flex-shrink-0 mt-0.5">LMS</span>}
                              </p>
                            )}
                          </div>

                          {/* ...以下、ボタン部分... */}
                          {canDelete && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => handleEditClick(assignment)} className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50 rounded-md transition-colors"><FiEdit2 size={16}/></button>
                              <button onClick={() => handleDeleteAssignment(assignment.id, assignment.isLms)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-slate-700/50 rounded-md transition-colors"><FiTrash2 size={16}/></button>
                            </div>
                          )}
                        </div>

                        {/* 🌟 説明文：メインコンテンツ（flex-col）の一部として配置 */}
                        {assignment.isLms && assignment.description && (
                          <div 
                            className="mt-2 text-xs text-slate-300 line-clamp-2 prose prose-invert prose-sm whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: assignment.description }} 
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 課題フォーム */}
          <div ref={formRef} className={`bg-slate-800/50 p-4 rounded-lg transition-all duration-300 ring-cyan-500 ${editingId ? 'ring-2 shadow-lg shadow-cyan-500/10' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-md text-slate-200 flex items-center gap-2">
                {editingId ? <><FiEdit2 className="text-cyan-400" /> 課題を編集</> : <><FiPlus className="text-slate-400" /> {isAdminMode && userRole === 'admin' ? '新しい[公式]課題を追加' : '新しい個人課題を追加'}</>}
              </h3>
              {editingId && <Button size="xs" variant="subtle" color="gray" onClick={resetForm} leftSection={<FiX />}>キャンセル</Button>}
            </div>
            <form onSubmit={handleAddOrUpdateAssignment} className="space-y-2">
              <TextInput label="課題名" placeholder="例）中間レポート" value={newName} onChange={(e) => setNewName(e.currentTarget.value)} required />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Select label="科目" placeholder="科目を選択" data={subject.map(s => ({ value: s.id.toString(), label: s.name }))} value={newSubjectId} onChange={(value) => setNewSubjectId(value)} searchable nothingFoundMessage="科目が見つかりません" />
                <TextInput label="URL（任意）" placeholder="https://example.com" value={newUrl} onChange={(e) => setNewUrl(e.currentTarget.value)} leftSection={<FiLink size={16} />} />
              </SimpleGrid>
              <Group grow>
                <DatePickerInput label="期限日" placeholder="日付を選択" value={newDate} onChange={handleDateChange} locale="ja" valueFormat="YYYY/MM/DD" required firstDayOfWeek={0} getDayProps={getDayProps} />
                <TextInput label="時刻（任意）" type="time" value={newTime} onChange={(e) => setNewTime(e.currentTarget.value)} />
              </Group>
              <Group grow className="mt-6 max-w-md mx-auto">
                <Button type="submit" color={editingId ? "cyan" : "blue"} leftSection={editingId ? <FiEdit2 size={16} /> : <FiPlus size={16} />}>{editingId ? '更新を保存する' : (isAdminMode && userRole === 'admin' ? '公式課題として追加' : '個人課題を追加')}</Button>
              </Group>
            </form>
          </div>
        </div>
      </ChapterFrame>
    </div>
  );
};

export default Assignments;