/* src/components/StudyRoom.tsx */

const StudyRoom = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const mday = today.getDate();

  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();

  const weekOfMonth = Math.ceil((mday + firstDayOfWeek) / 7) - 1;
  const imageName = `${month + 1}.${weekOfMonth}.webp`;
  const imagePath = `/images/studyroom/${imageName}`;

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl my-2 md:my-5 rounded-md">
        <img 
          src={imagePath} 
          alt={`自習室 ${month + 1}月 第${weekOfMonth}週`}
          className="w-full h-auto rounded" 
        />
      </div>

      <p className="text-slate-400 mt-4 text-sm text-center">
        ※閉館時間21:30（第1・3・5土曜は20:00）
      </p>
    </div>
  );
};

export default StudyRoom;