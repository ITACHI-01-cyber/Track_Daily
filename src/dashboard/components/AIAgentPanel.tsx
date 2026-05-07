import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { type Dispatch, type SetStateAction } from 'react';
import { Habit, Task } from '../../types';
import { cn } from '../../utils';

interface AIAgentPanelProps {
  tasks: Task[];
  habits: Habit[];
  chatMessages: { role: 'user' | 'model'; text: string }[];
  chatInput: string;
  isChatLoading: boolean;
  setChatMessages: Dispatch<SetStateAction<{ role: 'user' | 'model'; text: string }[]>>;
  setChatInput: Dispatch<SetStateAction<string>>;
  setIsChatLoading: Dispatch<SetStateAction<boolean>>;
}

export function AIAgentPanel({
  tasks,
  habits,
  chatMessages,
  chatInput,
  isChatLoading,
  setChatMessages,
  setChatInput,
  setIsChatLoading,
}: AIAgentPanelProps) {
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput;
    const newMessages = [...chatMessages, { role: 'user' as const, text: userText }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const trackerSnapshot = {
        generatedAt: new Date().toISOString(),
        habits: habits.map(habit => ({
          id: habit.id,
          name: habit.name,
          type: habit.type,
          frequency: habit.frequency,
          streak: habit.streak,
          createdAt: habit.createdAt,
          history: habit.history,
        })),
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          date: task.date,
          startTime: task.startTime,
          endTime: task.endTime,
          priority: task.priority,
          completed: task.completed,
        })),
      };
      const contextPrompt = `You are an AI productivity coach inside a habit tracker app.
You can see the user's full synced habit and tracker data below. Use it when answering.
Keep responses concise, practical, and specific to the user's real data.

Full tracker snapshot:
${JSON.stringify(trackerSnapshot, null, 2)}

User message: ${userText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
      });

      setChatMessages([...newMessages, { role: 'model', text: response.text || 'I am having trouble thinking right now. Please try again later.' }]);
    } catch (e) {
      console.error('AI Error', e);
      setChatMessages([...newMessages, { role: 'model', text: 'Failed to load AI response. Please check your API key in the environment variables.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-[32px] p-6 flex flex-col h-[450px]">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-card-border">
        <div className="p-2 rounded-xl text-bg-dark bg-brand-lime shadow-sm"><Bot size={20} /></div>
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">AI Productivity Agent</h3>
          <p className="text-xs text-gray-500">Sees all habits and trackers</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-hide">
        {chatMessages.map((msg, i) => (
          <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-2xl p-3 shadow-sm", msg.role === 'user' ? "bg-brand-blue text-white rounded-br-sm" : "bg-black/30 border border-card-border text-gray-100 rounded-bl-sm")}>
              <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px] uppercase font-bold tracking-wider">
                {msg.role === 'user' ? <User size={12} /> : <Sparkles size={12} />}
                {msg.role === 'user' ? 'You' : 'Agent'}
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex w-full justify-start">
            <div className="bg-black/30 border border-card-border text-gray-100 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3 shadow-sm">
              <Loader2 size={16} className="animate-spin text-brand-lime" />
              <span className="text-sm text-gray-500 font-medium animate-pulse">Agent is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center bg-black/30 p-1.5 rounded-2xl border border-card-border focus-within:border-brand-lime transition-all shadow-sm">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about your habits, tasks, or streaks..."
          className="flex-1 bg-transparent border-none focus:outline-none px-3 text-sm text-gray-100"
        />
        <button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()} className="p-2.5 rounded-xl text-bg-dark bg-brand-lime transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
