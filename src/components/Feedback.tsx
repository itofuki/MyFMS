/* src/components/Feedback.tsx */

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import ChapterFrame from './ChapterFrame';
import { FiMessageSquare, FiSend } from 'react-icons/fi';
import { Textarea, Button } from '@mantine/core';

const Feedback = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null, // ログインしていない場合はnull（設定次第）
          content: content.trim(),
        });

      if (error) throw error;

      setMessage({ type: 'success', text: '貴重なご意見ありがとうございます！送信が完了しました。' });
      setContent(''); // フォームをクリア
    } catch (error) {
      console.error('Feedback submission error:', error);
      setMessage({ type: 'error', text: '送信に失敗しました。時間をおいて再度お試しください。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ChapterFrame
      title={
        <div className="flex justify-center items-center gap-3 w-full">
          <FiMessageSquare className="text-cyan-400 text-2xl sm:text-3xl" />
          <span className="font-orbitron font-bold text-cyan-300 text-glow text-xl sm:text-3xl">
            ご意見・ご要望
          </span>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-2xl bg-slate-800/80 border-2 border-cyan-400/50 rounded-xl p-4 md:p-8 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <p className="text-slate-300 text-sm md:text-base mb-6 text-center">
            MyFMSをより良くするためのアイデア、バグの報告、追加してほしい機能など、自由にお書きください。
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Textarea
              placeholder="例：〇〇の機能が使いにくい。△△の機能を追加してほしい。"
              minRows={5}
              autosize
              value={content}
              onChange={(e) => setContent(e.currentTarget.value)}
              disabled={isSubmitting}
              styles={(theme) => ({
                input: {
                  backgroundColor: 'rgba(15, 23, 42, 0.6)', // bg-slate-900/60
                  color: theme.colors.gray[3],
                  borderColor: theme.colors.cyan[9],
                  '&:focus': {
                    borderColor: theme.colors.cyan[5],
                  },
                },
              })}
            />

            <Button
              type="submit"
              color="cyan"
              size="md"
              loading={isSubmitting}
              disabled={!content.trim()}
              leftSection={<FiSend />}
              className="mt-2 w-full sm:w-auto self-center"
            >
              送信する
            </Button>
          </form>

          {message && (
            <div
              className={`mt-6 p-4 rounded-md text-sm text-center font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50'
                  : 'bg-red-900/40 text-red-300 border border-red-800/50'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </ChapterFrame>
  );
};

export default Feedback;