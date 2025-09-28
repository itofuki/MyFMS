import { useId } from 'react';

type Option = {
  value: string | number;
  label: string;
};

type RadioGroupProps = {
  options: Option[];
  selectedValue: string | number | null;
  // onChangeの型をより厳密に定義
  onChange: (value: any) => void;
  legend: string;
};

export default function RadioGroup({
  options,
  selectedValue,
  onChange,
  legend,
}: RadioGroupProps) {
  // コンポーネントごとに一意なIDを生成し、IDの衝突を防ぐ
  const baseId = useId();

  return (
    <fieldset className="w-full">
      <legend className="block text-left text-gray-300 mb-3 text-lg">
        {legend}
      </legend>
      <div className="flex flex-row flex-wrap gap-4">
        {options.map((option) => {
          // 各オプションに一意なIDを割り当てる
          const uniqueId = `${baseId}-${option.value}`;

          return (
            <div key={uniqueId}>
              <input
                type="radio"
                id={uniqueId} // 生成した一意なIDを使用
                // name属性はグループ内で共通にする
                name={baseId} 
                // HTMLのvalue属性は文字列であるべきなので明示的に変換
                value={String(option.value)}
                checked={selectedValue === option.value}
                onChange={() => onChange(option.value)}
                className="peer hidden"
              />
              <label
                htmlFor={uniqueId} // inputのidと対応させる
                className={`
                  flex items-center justify-center p-4 rounded-lg cursor-pointer
                  border border-cyan-500/30 bg-black/30 text-gray-300
                  transition-all duration-300 ease-in-out
                  hover:border-cyan-400 hover:bg-cyan-900/40
                  
                  /* チェック時のスタイル */
                  peer-checked:border-cyan-400
                  peer-checked:bg-cyan-900/50
                  peer-checked:text-white
                  peer-checked:shadow-[0_0_15px_rgba(0,255,255,0.4)]

                  /* キーボードフォーカス時のスタイル */
                  peer-focus-visible:ring-2 
                  peer-focus-visible:ring-cyan-400 
                  peer-focus-visible:ring-offset-2 
                  peer-focus-visible:ring-offset-gray-800
                `}
              >
                <span className="text-lg font-semibold px-3">{option.label}</span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}