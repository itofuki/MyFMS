import type { FC, ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
};

const Collapsible: FC<Props> = ({ title, children }) => {
  return (
    <details className="group border-t border-white/20 py-3">

      <summary className="flex cursor-pointer list-none items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-300">{title}</h2>
        <div className="text-cyan-400 text-lg sm:text-xl transition-transform duration-300 group-open:-rotate-90">
          ◀
        </div>
      </summary>

      <div className="mt-4">
        {children}
      </div>
    </details>
  );
};

export default Collapsible;