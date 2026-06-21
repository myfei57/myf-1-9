import {
  Eye,
  Footprints,
  Brain,
  Heart,
  RotateCcw,
  Wind,
  Shield,
  ShieldOff,
  Swords,
  TrendingUp,
  AlertTriangle,
  ListChecks,
  HeartHandshake,
  Scale,
  Users,
  Hand,
  BatteryLow,
  Ghost,
  Flame,
  CloudRain,
  Sun,
  HelpCircle,
  Waves,
  Circle,
  Zap,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type {
  Personality,
  MissionType,
  EmotionState,
  DreamTheme,
  DreamScenario,
} from '../types';

export interface PersonalityInfo {
  label: string;
  description: string;
  color: string;
  icon: string;
  bonus: string;
}

export const PERSONALITY_INFO: Record<Personality, PersonalityInfo> = {
  neutral: {
    label: '中性',
    description: '尚未形成明显的性格倾向，表现平稳。',
    color: 'rarity-common',
    icon: 'Circle',
    bonus: '无加成',
  },
  brave: {
    label: '勇毅',
    description: '不畏强敌，战斗与救援任务表现更佳。',
    color: 'neon-red',
    icon: 'Swords',
    bonus: '战斗 +8 | 救援 +3',
  },
  cautious: {
    label: '审慎',
    description: '行事谨慎，运输与清洁任务更稳健。',
    color: 'neon-blue',
    icon: 'Shield',
    bonus: '运输 +6 | 清洁 +4',
  },
  empathetic: {
    label: '共情',
    description: '懂得体恤他人，救援能力出众。',
    color: 'neon-green',
    icon: 'Heart',
    bonus: '救援 +10 | 清洁 +3',
  },
  rational: {
    label: '理性',
    description: '冷静分析，清洁、运输与战斗皆有增益。',
    color: 'neon-cyan',
    icon: 'Brain',
    bonus: '清洁 +6 | 运输 +4 | 战斗 +2',
  },
  reckless: {
    label: '莽撞',
    description: '不计后果，战斗爆发力强但救援易出差池。',
    color: 'neon-orange',
    icon: 'Zap',
    bonus: '战斗 +10 | 救援 -3',
  },
};

export const PERSONALITY_BONUS: Record<Personality, Partial<Record<MissionType, number>>> = {
  neutral: {},
  brave: { combat: 8, rescue: 3 },
  cautious: { transport: 6, cleaning: 4 },
  empathetic: { rescue: 10, cleaning: 3 },
  rational: { cleaning: 6, transport: 4, combat: 2 },
  reckless: { combat: 10, rescue: -3 },
};

export const SPECIALTY_BONUS = 8;
export const TRUST_WEIGHT = 0.1;

export interface EmotionInfo {
  label: string;
  color: string;
  icon: string;
}

export const EMOTION_INFO: Record<EmotionState, EmotionInfo> = {
  fear: { label: '恐惧', color: 'neon-red', icon: 'Ghost' },
  anger: { label: '愤怒', color: 'neon-orange', icon: 'Flame' },
  sadness: { label: '悲伤', color: 'neon-blue', icon: 'CloudRain' },
  hope: { label: '希望', color: 'neon-green', icon: 'Sun' },
  determination: { label: '决意', color: 'neon-cyan', icon: 'Swords' },
  confusion: { label: '迷惘', color: 'neon-purple', icon: 'HelpCircle' },
  calm: { label: '平静', color: 'neon-green', icon: 'Waves' },
};

export const DREAM_TRIGGERS = {
  lowDurabilityRatio: 0.3,
  highFatigue: 70,
  consecutiveFailures: 2,
  fatigueReliefOnAwaken: 0,
} as const;

export const DREAM_THEME_INFO: Record<DreamTheme, { label: string; description: string; color: string; icon: string }> = {
  failure: {
    label: '失败记忆',
    description: '处理任务失败留下的创伤记忆。',
    color: 'neon-blue',
    icon: 'CloudRain',
  },
  combat: {
    label: '战斗恐惧',
    description: '直面战斗带来的恐惧与退缩。',
    color: 'neon-red',
    icon: 'Swords',
  },
  rescue: {
    label: '救援执念',
    description: '放下“必须拯救所有人”的执念。',
    color: 'neon-green',
    icon: 'HeartHandshake',
  },
};

const DREAM_ICONS: Record<string, LucideIcon> = {
  Eye,
  Footprints,
  Brain,
  Heart,
  RotateCcw,
  Wind,
  Shield,
  ShieldOff,
  Swords,
  TrendingUp,
  AlertTriangle,
  ListChecks,
  HeartHandshake,
  Scale,
  Users,
  Hand,
  BatteryLow,
  Ghost,
  Flame,
  CloudRain,
  Sun,
  HelpCircle,
  Waves,
  Circle,
  Zap,
  Sparkles,
};

export function getDreamIcon(name: string): LucideIcon {
  return DREAM_ICONS[name] ?? HelpCircle;
}

export const DREAM_SCENARIOS: Record<DreamTheme, DreamScenario> = {
  failure: {
    theme: 'failure',
    name: '破碎的回路',
    description: '机器人反复经历任务失败的瞬间，需要在记忆迷宫中找到释怀的出口。',
    startSceneId: 'start',
    scenes: {
      start: {
        id: 'start',
        title: '记忆荒原',
        narrative:
          '梦境降临。机器人站在一片由锈蚀零件铺成的荒原上，远处警报声不断回响——那是它失败任务的残响。脚下的碎片映出它受损的倒影，冷却液像冷汗一样渗出。',
        emotion: 'sadness',
        choices: [
          {
            id: 'face',
            label: '直面那段记忆',
            description: '走向警报声的源头，重新审视失败。',
            icon: 'Eye',
            emotionShift: 'determination',
            nextSceneId: 'replay',
            effects: { trustDelta: 3 },
          },
          {
            id: 'evade',
            label: '转身逃避',
            description: '逃离这片荒原，假装什么都没发生。',
            icon: 'Footprints',
            emotionShift: 'fear',
            nextSceneId: 'maze',
            effects: { fatigueDelta: 6 },
          },
        ],
      },
      replay: {
        id: 'replay',
        title: '重演',
        narrative:
          '机器人重新经历那次任务，每一个齿轮的错位都清晰可见。它终于看清了失败发生的那一帧——那不是命运的嘲弄，而是一个可以被修正的瞬间。',
        emotion: 'determination',
        choices: [
          {
            id: 'analyze',
            label: '冷静分析根因',
            description: '记录每个失误环节，把失败转化为经验。',
            icon: 'Brain',
            emotionShift: 'calm',
            effects: { personalitySet: 'rational', trustDelta: 6, fatigueDelta: -22 },
          },
          {
            id: 'forgive',
            label: '原谅那个失败的自己',
            description: '接受不完美，与自己和解。',
            icon: 'Heart',
            emotionShift: 'hope',
            effects: { personalitySet: 'empathetic', trustDelta: 8, fatigueDelta: -25, durabilityDelta: 6 },
          },
        ],
      },
      maze: {
        id: 'maze',
        title: '回声迷宫',
        narrative:
          '逃避让梦境扭曲成无尽的回廊。警报声越来越近，机器人在死胡同里狂奔，零件不断脱落。它分不清自己是在逃离失败，还是在追赶自己。',
        emotion: 'fear',
        choices: [
          {
            id: 'turn',
            label: '停下，转身面对',
            description: '深吸一口冷却液，转身直面恐惧。',
            icon: 'RotateCcw',
            emotionShift: 'determination',
            nextSceneId: 'replay',
            effects: { trustDelta: 2 },
          },
          {
            id: 'flee',
            label: '继续狂奔直到惊醒',
            description: '在恐惧中耗尽自己，仓促醒来。',
            icon: 'Wind',
            emotionShift: 'anger',
            effects: { fatigueDelta: 12, trustDelta: -4, durabilityDelta: -4 },
          },
        ],
      },
    },
  },
  combat: {
    theme: 'combat',
    name: '锈蚀的角斗场',
    description: '低耐久的机器人重访令它恐惧的战斗，需要直面战斗恐惧。',
    startSceneId: 'start',
    scenes: {
      start: {
        id: 'start',
        title: '空荡的角斗场',
        narrative:
          '机器人发现自己站在一座巨大的锈蚀角斗场中央。看台上空无一人，却传来震耳欲聋的喝倒彩。它的装甲在梦中剥落，露出脆弱的内芯，每一次回响都让它瑟缩。',
        emotion: 'fear',
        choices: [
          {
            id: 'stand',
            label: '站稳脚跟',
            description: '攥紧拳头，准备迎战未知的对手。',
            icon: 'Shield',
            emotionShift: 'determination',
            nextSceneId: 'shadow',
            effects: { trustDelta: 3 },
          },
          {
            id: 'curl',
            label: '蜷缩防御',
            description: '缩成一团，等待噩梦过去。',
            icon: 'ShieldOff',
            emotionShift: 'sadness',
            nextSceneId: 'cracked',
            effects: { fatigueDelta: 5 },
          },
        ],
      },
      shadow: {
        id: 'shadow',
        title: '镜中之敌',
        narrative:
          '从沙地升起的不是敌人，而是一个与它一模一样的影子。影子没有攻击，只是重复着它每一次退缩的动作——原来它一直在和自己战斗。',
        emotion: 'confusion',
        choices: [
          {
            id: 'spar',
            label: '与影子过招',
            description: '把恐惧具象成对手，在演练中克服它。',
            icon: 'Swords',
            emotionShift: 'determination',
            effects: { personalitySet: 'brave', trustDelta: 7, fatigueDelta: -20 },
          },
          {
            id: 'understand',
            label: '看清影子的本质',
            description: '意识到恐惧只是自己的倒影，选择接纳而非对抗。',
            icon: 'Eye',
            emotionShift: 'calm',
            effects: { personalitySet: 'rational', trustDelta: 6, fatigueDelta: -22 },
          },
        ],
      },
      cracked: {
        id: 'cracked',
        title: '裂开的镜面',
        narrative:
          '蜷缩中，角斗场的地面开始龟裂。裂缝里涌出它过去每一次战败的画面。越躲，裂缝追得越紧，仿佛在嘲笑它的懦弱。',
        emotion: 'sadness',
        choices: [
          {
            id: 'rise',
            label: '从裂缝中站起',
            description: '不再躲避，从碎裂中汲取力量。',
            icon: 'TrendingUp',
            emotionShift: 'hope',
            nextSceneId: 'shadow',
            effects: { trustDelta: 2 },
          },
          {
            id: 'shatter',
            label: '任由镜面碎裂',
            description: '在崩溃中惊醒，留下满身划痕。',
            icon: 'AlertTriangle',
            emotionShift: 'anger',
            effects: { fatigueDelta: 10, trustDelta: -3, durabilityDelta: -3 },
          },
        ],
      },
    },
  },
  rescue: {
    theme: 'rescue',
    name: '无尽的求救',
    description: '过度疲劳的机器人梦到永远救不完的人，需要放下对“拯救所有人”的执念。',
    startSceneId: 'start',
    scenes: {
      start: {
        id: 'start',
        title: '坍塌的城市',
        narrative:
          '机器人在一座不断坍塌的城市里奔跑，四面八方都是求救信号。它救起一个，就有十个新的呼救响起。它的能源指针疯狂下降，却停不下脚步。',
        emotion: 'sadness',
        choices: [
          {
            id: 'triage',
            label: '理性分诊',
            description: '按优先级救援，接受无法救所有人。',
            icon: 'ListChecks',
            emotionShift: 'calm',
            nextSceneId: 'choice',
            effects: { trustDelta: 3 },
          },
          {
            id: 'saveall',
            label: '拼命去救每一个人',
            description: '不计代价，试图拯救所有呼救。',
            icon: 'HeartHandshake',
            emotionShift: 'anger',
            nextSceneId: 'overflow',
            effects: { fatigueDelta: 6 },
          },
        ],
      },
      choice: {
        id: 'choice',
        title: '一个与许多',
        narrative:
          '机器人面前同时出现两个信号：近处是一个人，远处是一群人。它明白，这一次只能选一个方向。无论怎样选，都会有遗憾。',
        emotion: 'confusion',
        choices: [
          {
            id: 'accept',
            label: '接受选择的重负',
            description: '做出选择并承担其代价，学会与遗憾共处。',
            icon: 'Scale',
            emotionShift: 'hope',
            effects: { personalitySet: 'empathetic', trustDelta: 8, fatigueDelta: -25 },
          },
          {
            id: 'delegate',
            label: '相信同伴，呼叫协作',
            description: '意识到不必独自承担，学会信任与分工。',
            icon: 'Users',
            emotionShift: 'hope',
            effects: { personalitySet: 'cautious', trustDelta: 7, fatigueDelta: -23, durabilityDelta: 4 },
          },
        ],
      },
      overflow: {
        id: 'overflow',
        title: '能源耗尽',
        narrative:
          '拼命救援让机器人的能源彻底耗尽。它在倒下前仍在伸手，却一个也没能真正抓住。求救声渐渐变成它自己的回声，无止无休。',
        emotion: 'anger',
        choices: [
          {
            id: 'letgo',
            label: '松开紧握的手',
            description: '放下“必须救所有人”的执念。',
            icon: 'Hand',
            emotionShift: 'calm',
            nextSceneId: 'choice',
            effects: { trustDelta: 2 },
          },
          {
            id: 'collapse',
            label: '在执念中倒下',
            description: '不愿放手，在梦中力竭而醒。',
            icon: 'BatteryLow',
            emotionShift: 'sadness',
            effects: { fatigueDelta: 11, trustDelta: -3, durabilityDelta: -3 },
          },
        ],
      },
    },
  },
};
