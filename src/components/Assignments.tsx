import { motion } from 'framer-motion';

// 課題データの型定義
// exportしておくことで、他のファイルからもこの型を参照できます。
export type Assignment = {
  id: string;
  courseName: string;
  title:string;
  dueDate: string;
};

// 仮の課題データ
// 将来的には、このファイルの外からpropsとして渡すか、
// このコンポーネント内でAPIを叩いて取得することになります。
const sampleAssignments: Assignment[] = [
  { id: '1', courseName: 'Webデザイン', title: '中間ポートフォリオ', dueDate: '2025-10-10' },
  { id: '2', courseName: 'データ構造とアルゴリズム', title: '課題3: 探索アルゴリズム', dueDate: '2025-10-12' },
  { id: '3', courseName: 'プロジェクトマネジメント', title: 'WBSの提出', dueDate: '2025-10-15' },
];

const Assignments = () => (
  <motion.div
    key="assignments"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="w-full max-w-2xl p-4 space-y-4"
  >
    <h1 className="text-2xl font-bold text-white mb-4">課題一覧</h1>
    {sampleAssignments.length > 0 ? (
      sampleAssignments.map(assignment => (
        <motion.div 
          key={assignment.id} 
          className="bg-slate-800/80 border border-white/20 rounded-lg p-4"
          layout
        >
          <div className="flex justify-between items-center">
            <p className="text-sm text-cyan-400">{assignment.courseName}</p>
            <p className="text-xs text-gray-400">提出期限: {assignment.dueDate}</p>
          </div>
          <p className="font-semibold text-lg text-white mt-1">{assignment.title}</p>
        </motion.div>
      ))
    ) : (
      <div className="text-gray-400 text-center py-10">現在、課題はありません</div>
    )}
  </motion.div>
);

// コンポーネントを他のファイルで使えるようにエクスポートします
export default Assignments;