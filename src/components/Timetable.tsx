import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Timetable.css';


export type Subject = {
  id: string;
  wday: string;
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

const periodTimes = [
  { period: 1, start: { h: 9, m: 15 }, end: { h: 10, m: 55 } },
  { period: 2, start: { h: 10, m: 55 }, end: { h: 12, m: 25 } },
  { period: 3, start: { h: 13, m: 20 }, end: { h: 14, m: 50 } },
  { period: 4, start: { h: 15, m: 0 }, end: { h: 16, m: 30 } },
  { period: 5, start: { h: 16, m: 40 }, end: { h: 18, m: 10 } },
  { period: 6, start: { h: 18, m: 20 }, end: { h: 19, m: 50 } },
];

const formatTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;


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
      subjects.map(subject => {
        const dbId = subject.id.split('-')[0];
        const url = `https://lms-tokyo.iput.ac.jp/course/view.php?id=${dbId}`;
        const timeInfo = periodTimes.find(p => p.period === subject.period);

        return (
          <a
            key={subject.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <motion.div
              layoutId={`card-container-${subject.id}`}
              transition={layoutTransition}
              className="w-full bg-slate-800/80 border border-white/20 rounded-lg p-2 md:p-3 text-left flex items-center space-x-4 hover:bg-slate-700/60 transition-colors duration-200"
            >
              <div className="flex flex-col items-center justify-center text-center basis-1/5 flex-shrink-0 pr-3 border-r border-slate-600">
                <p className="flex items-baseline text-cyan-400 font-bold text-xl md:text-2xl">
                  <span className="text-md">{subject.period}</span>
                  <span className="text-base font-medium text-cyan-500 ml-[1px] md:ml-[3px]">限</span>
                </p>
                {timeInfo && (
                  <p className="text-gray-400 text-[9px] md:text-xs font-mono">
                    {formatTime(timeInfo.start.h, timeInfo.start.m)}-{formatTime(timeInfo.end.h, timeInfo.end.m)}
                  </p>
                )}
              </div>

              <div className="flex-grow basis-4/5 min-w-0 space-y-[2px]">
                <p className="font-semibold text-sm md:text-lg text-white truncate">{subject.name}</p>
                <p className="text-xs md:text-sm text-gray-400">{subject.classroom} / {subject.teacher}</p>
              </div>
            </motion.div>
          </a>
        );
      })
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
                const dbId = subject.id.split('-')[0];
                const url = `https://lms-tokyo.iput.ac.jp/course/view.php?id=${dbId}`;
                  return (
                    <a
                      key={subject.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-15 md:h-16 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <motion.div
                        layoutId={`card-container-${subject.id}`}
                        transition={layoutTransition}
                        className="w-full h-full bg-slate-800/80 rounded p-1 md:p-2 flex flex-col justify-center items-center space-y-1 text-center hover:bg-slate-700/60 transition-colors duration-200"
                      >
                        <p className="font-semibold text-white line-clamp-2 md:w-full text-[10px] md:text-xs">{subject.name}</p>
                        <p className="text-gray-400 line-clamp-1 text-[9px] md:text-[10px]">{subject.classroom}</p>
                      </motion.div>
                    </a>
                  );
              } else {
                return (
                  <div
                    key={`${day}-${period}`}
                    className="w-full h-15 md:h-16 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg"
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