import type { FC, ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
};

const Collapsible: FC<Props> = ({ title, children }) => {
  return (
    // `group`クラスで、子の要素から<details>の状態を参照可能にする
    <details className="group border-t border-white/20 py-3">
      {/* list-noneでデフォルトの▶を消し、flexでレイアウトを調整 */}
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-300">{title}</h2>
        <div className="text-cyan-400 text-2xl transition-transform duration-300 group-open:-rotate-90">
          ◀
        </div>
      </summary>

      {/* 開閉するコンテンツ */}
      <div className="mt-4">
        {children}
      </div>
    </details>
  );
};

export default Collapsible;