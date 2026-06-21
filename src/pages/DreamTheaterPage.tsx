import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Bot,
  History,
  Sunrise,
  Heart,
  Brain,
  Battery,
  Sparkles,
  Shield,
  Swords,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  ChevronRight,
  RotateCcw,
  CloudRain,
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { StatBar } from '../components/StatBar';
import { Modal } from '../components/Modal';
import { DreamChoiceCard } from '../components/DreamChoiceCard';
import { useGameStore } from '../store/useGameStore';
import { getDreamTrigger, formatDate } from '../utils/helpers';
import {
  DREAM_SCENARIOS,
  DREAM_THEME_INFO,
  PERSONALITY_INFO,
  EMOTION_INFO,
  getDreamIcon,
} from '../data/dreamScenarios';
import { accentClasses } from '../lib/utils';
import type {
  Robot,
  DreamScenario,
  DreamEffects,
  EmotionState,
  DreamRecord,
  MissionType,
  Personality,
} from '../types';

type DreamMode = 'select' | 'dreaming' | 'settled';

const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  transport: '运输',
  cleaning: '清洁',
  rescue: '救援',
  combat: '战斗',
};

function mergeEffects(a: DreamEffects, b: DreamEffects): DreamEffects {
  return {
    trustDelta: (a.trustDelta ?? 0) + (b.trustDelta ?? 0),
    fatigueDelta: (a.fatigueDelta ?? 0) + (b.fatigueDelta ?? 0),
    durabilityDelta: (a.durabilityDelta ?? 0) + (b.durabilityDelta ?? 0),
    personalitySet: b.personalitySet ?? a.personalitySet,
    specialtyGain: b.specialtyGain ?? a.specialtyGain,
  };
}

function fatigueColor(value: number): 'green' | 'orange' | 'red' {
  if (value >= 70) return 'red';
  if (value >= 30) return 'orange';
  return 'green';
}

function trustColor(value: number): 'green' | 'orange' | 'red' {
  if (value >= 70) return 'green';
  if (value >= 30) return 'orange';
  return 'red';
}

function EmotionChip({ emotion }: { emotion: EmotionState }) {
  const info = EMOTION_INFO[emotion];
  const Icon = getDreamIcon(info.icon);
  const accent = accentClasses(info.color);
  return (
    <span
      className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-mono whitespace-nowrap ${accent.bg} ${accent.text}`}
    >
      <Icon className="w-3 h-3" />
      {info.label}
    </span>
  );
}

function DeltaRow({
  label,
  before,
  after,
  goodWhenPositive = true,
}: {
  label: string;
  before: number | string;
  after: number | string;
  goodWhenPositive?: boolean;
}) {
  const numBefore = typeof before === 'number' ? before : 0;
  const numAfter = typeof after === 'number' ? after : 0;
  const delta = numAfter - numBefore;
  const isGood = goodWhenPositive ? delta >= 0 : delta <= 0;
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor =
    delta === 0
      ? 'text-white/40'
      : isGood
      ? 'text-neon-green'
      : 'text-neon-red';

  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40 font-mono line-through">{before}</span>
        <ChevronRight className="w-3 h-3 text-white/30" />
        <span className="text-sm font-mono font-bold text-white">{after}</span>
        <span className={`flex items-center gap-0.5 text-xs font-mono ${deltaColor}`}>
          <DeltaIcon className="w-3 h-3" />
          {delta > 0 ? `+${delta}` : delta}
        </span>
      </div>
    </div>
  );
}

function PersonalityBadge({ personality }: { personality: Personality }) {
  const info = PERSONALITY_INFO[personality];
  const Icon = getDreamIcon(info.icon);
  const accent = accentClasses(info.color);
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${accent.bg} ${accent.text}`}>
      <Icon className="w-3 h-3" />
      {info.label}
    </span>
  );
}

export function DreamTheaterPage() {
  const robots = useGameStore((s) => s.robots);
  const dreamRecords = useGameStore((s) => s.dreamRecords);
  const resolveDream = useGameStore((s) => s.resolveDream);

  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [mode, setMode] = useState<DreamMode>('select');
  const [scenario, setScenario] = useState<DreamScenario | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [path, setPath] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [emotions, setEmotions] = useState<EmotionState[]>([]);
  const [accEffects, setAccEffects] = useState<DreamEffects>({});
  const [triggerReason, setTriggerReason] = useState<string>('');
  const [settlement, setSettlement] = useState<DreamRecord | null>(null);
  const [robotBefore, setRobotBefore] = useState<Robot | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const selectedRobot = useMemo(
    () => robots.find((r) => r.id === selectedRobotId) ?? null,
    [robots, selectedRobotId],
  );

  const trigger = useMemo(
    () => (selectedRobot ? getDreamTrigger(selectedRobot) : null),
    [selectedRobot],
  );

  const sortedRobots = useMemo(() => {
    return [...robots].sort((a, b) => {
      const ta = getDreamTrigger(a).triggered ? 1 : 0;
      const tb = getDreamTrigger(b).triggered ? 1 : 0;
      if (ta !== tb) return tb - ta;
      return b.fatigue - a.fatigue;
    });
  }, [robots]);

  const handleSelectRobot = (robotId: string) => {
    setSelectedRobotId(robotId);
    setMode('select');
    setSettlement(null);
    setScenario(null);
  };

  const handleStartDream = (robot: Robot) => {
    const t = getDreamTrigger(robot);
    if (!t.triggered) return;
    const sc = DREAM_SCENARIOS[t.theme];
    const startScene = sc.scenes[sc.startSceneId];
    setScenario(sc);
    setCurrentSceneId(sc.startSceneId);
    setPath([]);
    setChoices([]);
    setEmotions([startScene.emotion]);
    setAccEffects({});
    setTriggerReason(t.reason);
    setRobotBefore({ ...robot });
    setSettlement(null);
    setMode('dreaming');
  };

  const handleSelectChoice = (choiceId: string) => {
    if (!scenario) return;
    const scene = scenario.scenes[currentSceneId];
    const choice = scene.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    const newPath = [...path, currentSceneId];
    const newChoices = [...choices, choice.id];
    const newEmotions = [...emotions, choice.emotionShift];
    const newEffects = mergeEffects(accEffects, choice.effects);

    setPath(newPath);
    setChoices(newChoices);
    setEmotions(newEmotions);
    setAccEffects(newEffects);

    if (choice.nextSceneId) {
      setCurrentSceneId(choice.nextSceneId);
      return;
    }

    const summary = {
      theme: scenario.theme,
      path: [...newPath, currentSceneId],
      choices: newChoices,
      emotions: newEmotions,
      finalEmotion: choice.emotionShift,
      effects: newEffects,
    };
    const record = resolveDream(selectedRobotId!, triggerReason, summary);
    setSettlement(record);
    setMode('settled');
  };

  const handleExit = () => {
    setMode('select');
    setScenario(null);
    setSettlement(null);
  };

  const afterRobot = selectedRobot;

  return (
    <PageContainer
      title="梦境训练剧场"
      subtitle={`可入梦机器人: ${sortedRobots.filter((r) => getDreamTrigger(r).triggered).length} | 已引导梦境: ${dreamRecords.length}`}
      actions={
        <button onClick={() => setShowHistory(true)} className="btn btn-secondary">
          <History className="w-4 h-4 mr-2" />
          梦境记录
        </button>
      }
    >
      <AnimatePresence mode="wait">
        {mode === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-5">
              <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5 text-neon-purple" />
                机器人休眠舱
              </h2>
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-2">
                {sortedRobots.length === 0 ? (
                  <div className="card p-8 text-center">
                    <Bot className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">暂无机器人</p>
                    <p className="text-xs text-white/30 mt-1">先去组装车间组装一个吧</p>
                  </div>
                ) : (
                  sortedRobots.map((robot) => {
                    const t = getDreamTrigger(robot);
                    const themeInfo = DREAM_THEME_INFO[t.theme];
                    const themeAccent = accentClasses(themeInfo.color);
                    return (
                      <motion.button
                        key={robot.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectRobot(robot.id)}
                        className={`card p-4 w-full text-left transition-all ${
                          selectedRobotId === robot.id ? 'ring-2 ring-neon-purple shadow-neon-purple' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              t.triggered ? 'bg-neon-purple/20' : 'bg-background-tertiary'
                            }`}
                          >
                            <Bot className={`w-6 h-6 ${t.triggered ? 'text-neon-purple' : 'text-white/40'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-bold text-white truncate">{robot.name}</h3>
                              {t.triggered ? (
                                <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${themeAccent.bg} ${themeAccent.text} font-mono`}>
                                  <Moon className="w-3 h-3" />
                                  可入梦
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-background-tertiary text-white/40 font-mono">
                                  平稳
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-white/50">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3 text-neon-red" />
                                {Math.round((robot.durability / robot.maxDurability) * 100)}%
                              </span>
                              <span className="flex items-center gap-1">
                                <Battery className={`w-3 h-3 ${robot.fatigue >= 70 ? 'text-neon-red' : 'text-neon-orange'}`} />
                                疲劳 {robot.fatigue}
                              </span>
                              <PersonalityBadge personality={robot.personality} />
                            </div>
                          </div>
                        </div>
                        {t.triggered && (
                          <div className={`mt-3 pt-3 border-t border-border-subtle text-xs ${themeAccent.text}`}>
                            <Moon className="w-3 h-3 inline mr-1" />
                            {themeInfo.label} · {t.reason}
                          </div>
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {selectedRobot ? (
                  <motion.div
                    key={selectedRobot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="card p-6"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-neon-purple/20 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-neon-purple" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-white">{selectedRobot.name}</h3>
                        <p className="text-sm text-white/50">
                          已入梦 {selectedRobot.dreamCount} 次 · 连续失败 {selectedRobot.consecutiveFailures} 次
                        </p>
                      </div>
                      <PersonalityBadge personality={selectedRobot.personality} />
                    </div>

                    <div className="space-y-4 mb-6">
                      <StatBar
                        label="耐久度"
                        value={selectedRobot.durability}
                        max={selectedRobot.maxDurability}
                        color={
                          selectedRobot.durability / selectedRobot.maxDurability > 0.6
                            ? 'green'
                            : selectedRobot.durability / selectedRobot.maxDurability > 0.3
                            ? 'orange'
                            : 'red'
                        }
                      />
                      <StatBar
                        label="疲劳度"
                        value={selectedRobot.fatigue}
                        max={100}
                        color={fatigueColor(selectedRobot.fatigue)}
                      />
                      <StatBar
                        label="信任值"
                        value={selectedRobot.trust}
                        max={100}
                        color={trustColor(selectedRobot.trust)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-background-tertiary rounded-xl p-3">
                        <p className="text-xs text-white/50 mb-1">性格倾向</p>
                        <p className="text-sm font-bold text-white">{PERSONALITY_INFO[selectedRobot.personality].label}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{PERSONALITY_INFO[selectedRobot.personality].bonus}</p>
                      </div>
                      <div className="bg-background-tertiary rounded-xl p-3">
                        <p className="text-xs text-white/50 mb-1">专精方向</p>
                        <p className="text-sm font-bold text-white">
                          {selectedRobot.specialty ? MISSION_TYPE_LABELS[selectedRobot.specialty] : '未定型'}
                        </p>
                        <p className="text-[11px] text-white/40 mt-0.5">{selectedRobot.specialty ? '同类任务 +8 适配' : '梦境可塑造专精'}</p>
                      </div>
                    </div>

                    {trigger?.triggered ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Moon className="w-4 h-4 text-neon-purple" />
                            <span className="font-bold text-neon-purple">触发梦境</span>
                          </div>
                          <p className="text-sm text-white/70">
                            {DREAM_THEME_INFO[trigger.theme].label} · {trigger.reason}
                          </p>
                          <p className="text-xs text-white/50 mt-1">
                            {DREAM_SCENARIOS[trigger.theme].description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartDream(selectedRobot)}
                          className="btn btn-primary w-full py-4 text-lg"
                        >
                          <Moon className="w-5 h-5 mr-2" />
                          进入梦境
                        </button>
                      </motion.div>
                    ) : (
                      <div className="p-4 rounded-xl bg-background-tertiary flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0" />
                        <div>
                          <p className="text-sm text-white font-medium">状态平稳，暂无梦境</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            低耐久、高疲劳或连续失败时会触发梦境事件
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="card p-12 text-center"
                  >
                    <Moon className="w-16 h-16 text-white/10 mx-auto mb-4" />
                    <h3 className="font-display text-xl text-white/50 mb-2">选择一个机器人</h3>
                    <p className="text-white/30">从休眠舱中选择机器人，查看它的梦境状态</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {mode === 'dreaming' && scenario && (
          <motion.div
            key="dreaming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-8">
              <DreamSceneView
                scenario={scenario}
                sceneId={currentSceneId}
                onSelectChoice={handleSelectChoice}
                onExit={handleExit}
                emotions={emotions}
              />
            </div>

            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-5 sticky top-24"
              >
                <h3 className="font-display font-bold text-neon-purple mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  梦境进程
                </h3>

                <div className="mb-5">
                  <p className="text-xs text-white/50 mb-2">情绪流变</p>
                  <div className="flex flex-wrap gap-1.5">
                    {emotions.map((e, i) => (
                      <motion.div
                        key={`${e}-${i}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <EmotionChip emotion={e} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-xs text-white/50 mb-2">已选择路径</p>
                  <div className="space-y-1.5">
                    {path.length === 0 ? (
                      <p className="text-xs text-white/30">梦境刚刚开始...</p>
                    ) : (
                      path.map((sceneId, i) => (
                        <div key={`${sceneId}-${i}`} className="flex items-center gap-2 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
                          <span className="text-white/60 truncate">{scenario.scenes[sceneId]?.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/50 mb-2">实时影响</p>
                  <div className="space-y-2 text-xs">
                    <LiveEffectRow
                      icon={<Heart className="w-3 h-3" />}
                      label="信任"
                      delta={accEffects.trustDelta}
                    />
                    <LiveEffectRow
                      icon={<Battery className="w-3 h-3" />}
                      label="疲劳"
                      delta={accEffects.fatigueDelta}
                      goodWhenPositive={false}
                    />
                    <LiveEffectRow
                      icon={<Shield className="w-3 h-3" />}
                      label="耐久"
                      delta={accEffects.durabilityDelta}
                    />
                    {accEffects.personalitySet && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">性格倾向</span>
                        <PersonalityBadge personality={accEffects.personalitySet} />
                      </div>
                    )}
                    {accEffects.specialtyGain && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">专精倾向</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neon-cyan/15 text-neon-cyan font-mono">
                          {MISSION_TYPE_LABELS[accEffects.specialtyGain]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {mode === 'settled' && settlement && robotBefore && afterRobot && (
          <motion.div
            key="settled"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto"
          >
            <DreamSettlement
              settlement={settlement}
              scenario={scenario}
              robotBefore={robotBefore}
              afterRobot={afterRobot}
              onExit={handleExit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="梦境记录"
        size="xl"
      >
        {dreamRecords.length === 0 ? (
          <div className="text-center py-8 text-white/30">
            <Moon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无梦境记录</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {[...dreamRecords].reverse().map((record) => {
              const themeInfo = DREAM_THEME_INFO[record.theme];
              const themeAccent = accentClasses(themeInfo.color);
              const finalEmotion = EMOTION_INFO[record.finalEmotion];
              return (
                <div
                  key={record.id}
                  className="flex items-start gap-4 p-3 bg-background-tertiary rounded-lg"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${themeAccent.bg}`}>
                    <Moon className={`w-5 h-5 ${themeAccent.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{record.robotName}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${themeAccent.bg} ${themeAccent.text} font-mono`}>
                        {themeInfo.label}
                      </span>
                      <span className="text-[11px] text-white/40">{record.triggerReason}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                      <span>信任 {record.trustBefore} → {record.trustAfter}</span>
                      <span className="flex items-center gap-1">
                        <CloudRain className="w-3 h-3" />
                        {finalEmotion.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0">
                    {formatDate(record.completedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

function LiveEffectRow({
  icon,
  label,
  delta,
  goodWhenPositive = true,
}: {
  icon: React.ReactNode;
  label: string;
  delta: number | undefined;
  goodWhenPositive?: boolean;
}) {
  const value = delta ?? 0;
  const isGood = goodWhenPositive ? value >= 0 : value <= 0;
  const color =
    value === 0 ? 'text-white/40' : isGood ? 'text-neon-green' : 'text-neon-red';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`flex items-center gap-0.5 font-mono ${color}`}>
        <Icon className="w-3 h-3" />
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
}

function DreamSceneView({
  scenario,
  sceneId,
  onSelectChoice,
  onExit,
  emotions,
}: {
  scenario: DreamScenario;
  sceneId: string;
  onSelectChoice: (choiceId: string) => void;
  onExit: () => void;
  emotions: EmotionState[];
}) {
  const scene = scenario.scenes[sceneId];
  const themeInfo = DREAM_THEME_INFO[scenario.theme];
  const themeAccent = accentClasses(themeInfo.color);
  const SceneIcon = getDreamIcon(themeInfo.icon);
  const currentEmotion = emotions[emotions.length - 1];

  return (
    <motion.div
      key={sceneId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="card p-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${themeAccent.bg}`}>
              <SceneIcon className={`w-5 h-5 ${themeAccent.text}`} />
            </div>
            <div>
              <p className={`text-xs font-mono ${themeAccent.text}`}>{scenario.name}</p>
              <p className="text-[11px] text-white/40">{themeInfo.label}</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            退出梦境
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display text-2xl font-bold text-white glow-text-purple">
            {scene.title}
          </h2>
          <EmotionChip emotion={currentEmotion} />
        </div>

        <motion.p
          key={scene.narrative}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-white/75 leading-relaxed mb-6 text-[15px] border-l-2 border-neon-purple/40 pl-4 italic"
        >
          {scene.narrative}
        </motion.p>

        <div className="space-y-3">
          <p className="text-xs text-white/40 font-mono uppercase tracking-wider">选择一张梦境卡片</p>
          {scene.choices.map((choice, index) => (
            <DreamChoiceCard
              key={choice.id}
              choice={choice}
              index={index}
              onSelect={() => onSelectChoice(choice.id)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function DreamSettlement({
  settlement,
  scenario,
  robotBefore,
  afterRobot,
  onExit,
}: {
  settlement: DreamRecord;
  scenario: DreamScenario | null;
  robotBefore: Robot;
  afterRobot: Robot;
  onExit: () => void;
}) {
  const themeInfo = DREAM_THEME_INFO[settlement.theme];
  const themeAccent = accentClasses(themeInfo.color);
  const finalEmotion = EMOTION_INFO[settlement.finalEmotion];
  const personalityChanged = afterRobot.personality !== robotBefore.personality;
  const specialtyChanged = afterRobot.specialty !== robotBefore.specialty;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="relative">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${themeAccent.bg}`}
          >
            <Sunrise className={`w-10 h-10 ${themeAccent.text}`} />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-white glow-text-purple mb-2">
            梦醒
          </h2>
          <p className="text-white/60">
            {afterRobot.name} 从「{scenario?.name ?? themeInfo.label}」中苏醒
          </p>
          <p className="text-xs text-white/40 mt-1">触发：{settlement.triggerReason}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs text-white/50 mb-2 font-mono uppercase tracking-wider">情绪流变</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {settlement.emotions.map((e, i) => (
              <div key={`${e}-${i}`} className="flex items-center gap-1.5">
                <EmotionChip emotion={e} />
                {i < settlement.emotions.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-white/20" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-2">
            最终情绪：<span className={themeAccent.text}>{finalEmotion.label}</span>
          </p>
        </div>

        <div className="mb-6">
          <p className="text-xs text-white/50 mb-2 font-mono uppercase tracking-wider">梦境历程</p>
          <div className="space-y-1.5">
            {settlement.path.map((sceneId, i) => (
              <div key={`${sceneId}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-neon-purple/20 text-neon-purple text-[10px] font-mono flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-white/70">{scenario?.scenes[sceneId]?.title ?? sceneId}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-white/50 mb-2 font-mono uppercase tracking-wider">状态结算</p>
          <div className="bg-background-tertiary rounded-xl p-4">
            <DeltaRow
              label="信任值"
              before={settlement.trustBefore}
              after={settlement.trustAfter}
            />
            <DeltaRow
              label="疲劳度"
              before={robotBefore.fatigue}
              after={afterRobot.fatigue}
              goodWhenPositive={false}
            />
            <DeltaRow
              label="耐久度"
              before={robotBefore.durability}
              after={afterRobot.durability}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="bg-background-tertiary rounded-xl p-4">
            <p className="text-xs text-white/50 mb-2">性格变化</p>
            {personalityChanged ? (
              <div className="flex items-center gap-2">
                <PersonalityBadge personality={robotBefore.personality} />
                <ChevronRight className="w-4 h-4 text-white/30" />
                <PersonalityBadge personality={afterRobot.personality} />
              </div>
            ) : (
              <p className="text-sm text-white/60">未发生变化</p>
            )}
          </div>
          <div className="bg-background-tertiary rounded-xl p-4">
            <p className="text-xs text-white/50 mb-2">专精成长</p>
            {specialtyChanged ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/40">
                  {robotBefore.specialty ? MISSION_TYPE_LABELS[robotBefore.specialty] : '未定型'}
                </span>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neon-cyan/15 text-neon-cyan font-mono">
                  {afterRobot.specialty ? MISSION_TYPE_LABELS[afterRobot.specialty!] : '未定型'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-white/60">
                {afterRobot.specialty ? `保持 ${MISSION_TYPE_LABELS[afterRobot.specialty]}` : '未定型'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/30 mb-6">
          <Sparkles className="w-4 h-4 text-neon-purple flex-shrink-0" />
          <p className="text-xs text-white/70">
            梦境不会直接奖励零件，而是悄然改变性格、专精与信任，影响它未来面对任务的方式。累计入梦 {afterRobot.dreamCount} 次。
          </p>
        </div>

        <button onClick={onExit} className="btn btn-primary w-full py-3">
          <CheckCircle className="w-4 h-4 mr-2" />
          确认结算
        </button>
      </div>
    </motion.div>
  );
}
