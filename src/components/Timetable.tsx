import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Timetable.css';


export type Subject = {
  id: string;
  day_of_week: string;
  period: number;
  name: string;
  classroom: string;
  teacher: string;
};
export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

interface TimetableProps {
  isWeeklyView: boolean;
  weeklyData: Record<Day, Subject[]>;
}

const layoutTransition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const;


const PeriodAxis = ({ maxPeriods }: { maxPeriods: number }) => (
  <div className="flex flex-col items-center space-y-2">
    <p className="font-bold text-transparent select-none">軸</p>
    <div className="w-full space-y-2">
      {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(period => (
        <div
          key={`period-axis-${period}`}
          className="w-full h-16 flex items-center justify-center text-cyan-400 font-bold text-lg md:text-2xl"
        >
          {period}
        </div>
      ))}
    </div>
  </div>
);

const DailySchedule = ({ subjects }: { subjects: Subject[] }) => (
  <motion.div className="w-full max-w-md p-4 space-y-3">
    {subjects.length > 0 ? (
      subjects.map(subject => (
        <motion.div
          key={subject.id}
          layoutId={`card-container-${subject.id}`}
          transition={layoutTransition}
          className="w-full bg-slate-800/80 border border-white/20 rounded-lg p-3 text-left flex items-center space-x-4"
        >
          <div className="text-cyan-400 font-bold text-xl md:text-2xl pr-2 border-r border-gray-600">{subject.period}</div>
          <div className="flex-grow min-w-0">
            <p className="font-semibold text-md md:text-lg text-white truncate">{subject.name}</p>
            <p className="text-sm text-gray-400">{subject.classroom} / {subject.teacher}</p>
          </div>
        </motion.div>
      ))
    ) : (
      <div className="text-gray-400 text-center py-10">今日の授業はありません</div>
    )}
  </motion.div>
);

const WeeklySchedule = ({ weeklySubjects }: { weeklySubjects: Record<Day, Subject[]> }) => {
  const MAX_PERIODS = 6;
  const days: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <motion.div
      className="w-full max-w-3xl grid grid-cols-5 md:grid md:[grid-template-columns:auto_repeat(5,1fr)] gap-2 sm:gap-4"
    >
      <div className="hidden md:flex">
        <PeriodAxis maxPeriods={MAX_PERIODS} />
      </div>
      {days.map(day => (
        <div key={day} className="flex flex-col items-center space-y-2 min-w-0">
          <p className="font-bold text-cyan-300">{day}</p>
          <div className="w-full space-y-2">
            {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map(period => {
              const subject = weeklySubjects[day]?.find(s => s.period === period);

              if (subject) {
                return (
                  <motion.div
                    key={subject.id}
                    layoutId={`card-container-${subject.id}`}
                    transition={layoutTransition}
                    className="w-full h-16 bg-slate-800/80 rounded p-2 flex flex-col justify-center items-center space-y-1 text-center"
                  >
                    <p className="font-semibold text-white line-clamp-2 md:w-full text-[10px] md:text-xs">{subject.name}</p>
                    <p className="text-gray-400 line-clamp-1 text-[9px] md:text-[10px]">{subject.classroom}</p>
                  </motion.div>
                );
              } else {
                return (
                  <div
                    key={`${day}-${period}`}
                    className="w-full h-16 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg"
                  />
                );
              }
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

// --- メインコンポーネント ---
export const Timetable: React.FC<TimetableProps> = ({ isWeeklyView, weeklyData }) => {
  const getTodayDay = (): Day => {
    // 現在時刻は日本のタイムゾーンを基準にする
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const dayIndex = now.getDay();
    const days: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days[dayIndex - 1] || 'Fri'; 
  };
  
  const today = getTodayDay();
  const todaySubjects = weeklyData[today] || [];

  return (
    <div className="schedule-container">
      <AnimatePresence mode="wait">
        {isWeeklyView ? (
          <WeeklySchedule key="weekly" weeklySubjects={weeklyData} />
        ) : (
          <DailySchedule key="daily" subjects={todaySubjects} />
        )}
      </AnimatePresence>
    </div>
  );
};