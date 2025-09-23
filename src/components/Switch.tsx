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
    <div className="flex items-center justify-between py-2">
      <span className="text-lg text-white font-medium">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
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