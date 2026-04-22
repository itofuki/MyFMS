/* src/components/Switch.tsx */

// 型をインポート
import type { FC } from 'react';

// Propsの型を定義
type SwitchProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const Switch: FC<SwitchProps> = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-1 sm:py-2">
      {/* 🌟 変更: スマホ時は文字サイズを text-base に縮小 */}
      <span className="text-base sm:text-lg text-white font-medium">{label}</span>
      
      {/* 🌟 変更: スマホ時はスケールを90%にして少し小さく表示 (scale-90 sm:scale-100) */}
      <label className="relative inline-flex items-center cursor-pointer scale-90 sm:scale-100 origin-right transition-transform">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
      </label>
    </div>
  );
};

export default Switch;