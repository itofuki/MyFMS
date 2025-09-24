import { Book, MapPin } from 'lucide-react';

// --- データと型定義 (変更なし) ---
const scheduleData = [
  { period: 2, time: '10:55 - 12:25', subject: '英語コミュニケーションⅡbA', teacher: 'Tsumori Kino', room: '341', isCurrent: false },
  { period: 3, time: '13:20 - 14:50', subject: 'メディア情報処理実習', teacher: '上條・町出', room: '374・376', isCurrent: true },
  { period: 4, time: '15:30 - 16:30', subject: 'メディア情報処理実習', teacher: '上條・町出', room: '374・376', isCurrent: false },
  { period: 5, time: '16:40 - 18:10', subject: '担任ミーティング', teacher: '駒井 章治', room: '374', isCurrent: false },
];

type ScheduleItem = {
  period: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  isCurrent: boolean;
};

// --- 2. 各授業を表示するカードのコンポーネント (レイアウト変更) ---
const TimeTableCard = ({ item }: { item: ScheduleItem }) => {
  const cardClasses = `
    group w-full max-w-2xl rounded-lg border transition-all duration-300
    bg-white/5 backdrop-blur-sm 
    p-4 max-w-md
    ${item.isCurrent 
      ? 'border-cyan-400 shadow-lg shadow-cyan-500/30 scale-110'
      : 'border-white/10'
    }
    hover:border-cyan-400 hover:scale-[1.01] hover:bg-white/10
  `;

  return (
    <div className={cardClasses}>
      <div className="flex items-start space-x-4">
        
        {/* 左カラム: 時刻と時限 */}
        <div className="flex-shrink-0 flex-col text-left text-cyan-400/80">
          <p className="text-lg font-bold">{item.period}限</p>
          <p className="text-[9px] sm:text-xs">{item.time}</p>
        </div>

        {/* 右カラム: 授業詳細 */}
        <div className="flex-grow border-l border-white/10 pl-4">
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300">
            {item.subject}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300 justify-center">
            <p className="flex items-center space-x-2">
              <Book size={15} />
              <span>{item.teacher}</span>
            </p>
            <p className="flex items-center space-x-2">
              <MapPin size={15} />
              <span>{item.room}</span>
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export const Timetable = () => {
  return (
    <div className="relative w-full p-2 font-sans">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-cyan-500/30 via-cyan-500/10 to-transparent"></div>
      <div className="relative flex w-full flex-col items-center space-y-3">
        {scheduleData.map((item) => (
          <TimeTableCard key={item.period} item={item} />
        ))}
      </div>
    </div>
  );
};