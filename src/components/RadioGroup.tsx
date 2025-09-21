/* src/components/RadioGroup.tsx */

type Option = {
  value: string;
  label: string;
};

type RadioGroupProps = {
  options: Option[];
  selectedValue: string;
  onChange: (value: string) => void;
  legend: string; // ラジオグループ全体のタイトル
};

export default function RadioGroup({
  options,
  selectedValue,
  onChange,
  legend,
}: RadioGroupProps) {
  const groupName = legend.replace(/\s+/g, '-').toLowerCase(); // inputのname属性を動的に生成

  return (
    // fieldsetはフォームの関連要素をグループ化するのに適したタグ
    <fieldset className="w-full">
      <legend className="block text-left text-gray-300 mb-3 text-lg">
        {legend}
      </legend>
      <div className="flex flex-col md:flex-row gap-4">
        {options.map((option) => (
          <div key={option.value} className="flex-1">
            {/* 1. input本体は画面上から隠す */}
            <input
              type="radio"
              id={option.value}
              name={groupName}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => onChange(option.value)}
              className="peer hidden" // peerクラスを付与して非表示に
            />
            {/* 2. labelをボタンのように見せかける */}
            <label
              htmlFor={option.value}
              className={`
                flex items-center justify-center w-full p-4 rounded-lg cursor-pointer
                border border-cyan-500/30 bg-black/30 text-gray-300
                transition-all duration-300 ease-in-out
                hover:border-cyan-400 hover:bg-cyan-900/40
                
                // 3. peer(input)がチェックされたらlabelのスタイルを変更
                peer-checked:border-cyan-400
                peer-checked:bg-cyan-900/50
                peer-checked:text-white
                peer-checked:shadow-[0_0_15px_rgba(0,255,255,0.4)]
              `}
            >
              <span className="text-lg font-semibold">{option.label}</span>
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}