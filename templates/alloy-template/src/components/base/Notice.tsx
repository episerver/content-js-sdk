import { ReactNode } from 'react';

interface NoticeProps {
  children: ReactNode;
  title: string;
  date?: string;
}

function Notice({ children, title, date }: NoticeProps) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-sm max-w-sm">
      <h2 className="text-teal-600 font-medium text-lg mb-1 hover:underline cursor-pointer">
        {title}
      </h2>
      {date && <time className="text-gray-500 text-sm block mb-3">{date}</time>}
      <div className="text-gray-700 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default Notice;
