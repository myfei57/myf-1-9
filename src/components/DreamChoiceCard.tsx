import { motion } from 'framer-motion';
import { ChevronRight, Sunrise, Eye } from 'lucide-react';
import type { DreamChoice } from '../types';
import { getDreamIcon, EMOTION_INFO } from '../data/dreamScenarios';
import { accentClasses } from '../lib/utils';

interface DreamChoiceCardProps {
  choice: DreamChoice;
  index: number;
  onSelect: () => void;
}

export function DreamChoiceCard({ choice, index, onSelect }: DreamChoiceCardProps) {
  const Icon = getDreamIcon(choice.icon);
  const EmotionIcon = getDreamIcon(EMOTION_INFO[choice.emotionShift].icon);
  const emotion = EMOTION_INFO[choice.emotionShift];
  const accent = accentClasses(emotion.color);
  const awakens = !choice.nextSceneId;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group relative w-full text-left card p-4 border-border-moderate hover:border-neon-purple/60 hover:shadow-neon-purple/30 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-neon-purple/15 flex items-center justify-center flex-shrink-0 group-hover:bg-neon-purple/25 transition-colors">
          <Icon className="w-5 h-5 text-neon-purple" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-display font-bold text-white">{choice.label}</h4>
            {awakens ? (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-neon-orange/20 text-neon-orange font-mono">
                <Sunrise className="w-3 h-3" />
                梦醒
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue font-mono">
                <Eye className="w-3 h-3" />
                深入
              </span>
            )}
          </div>
          <p className="text-xs text-white/60 leading-relaxed">{choice.description}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono ${accent.bg} ${accent.text}`}>
              <EmotionIcon className="w-3 h-3" />
              {emotion.label}
            </span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-neon-purple group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

