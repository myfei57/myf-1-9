import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Store,
  Part,
  PartType,
  Rarity,
  Robot,
  MissionRecord,
  RepairRecord,
  DreamRecord,
  DreamSummary,
  AssemblyPlan,
  GameConfig,
} from '../types';
import {
  DEFAULT_CONFIG,
  MISSIONS,
  INITIAL_CREDITS,
  INITIAL_MATERIALS,
  BLIND_BOX_PRICES,
} from '../data/defaultConfig';
import {
  generateId,
  generateRandomPart,
  calculateRobotStats as calcStats,
  calculateAdaptability as calcAdapt,
  getMissionReaction,
  clamp,
} from '../utils/helpers';

const EMPTY_SELECTED_PARTS: Record<PartType, Part | null> = {
  head: null,
  body: null,
  arm: null,
  leg: null,
  core: null,
  tool: null,
};

type PersistedGameState = {
  parts: Part[];
  robots: Robot[];
  credits: number;
  materials: number;
  missionRecords: MissionRecord[];
  repairRecords: RepairRecord[];
  dreamRecords: DreamRecord[];
  assemblyPlans: AssemblyPlan[];
  config: GameConfig;
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      parts: [],
      robots: [],
      credits: INITIAL_CREDITS,
      materials: INITIAL_MATERIALS,
      missionRecords: [],
      repairRecords: [],
      dreamRecords: [],
      assemblyPlans: [],
      config: DEFAULT_CONFIG,
      selectedParts: { ...EMPTY_SELECTED_PARTS },

      addPart: (part) => set((state) => ({ parts: [...state.parts, part] })),

      removePart: (partId) =>
        set((state) => ({
          parts: state.parts.filter((p) => p.id !== partId),
        })),

      updatePart: (partId, updates) =>
        set((state) => ({
          parts: state.parts.map((p) =>
            p.id === partId ? { ...p, ...updates } : p
          ),
        })),

      addRobot: (robot) => set((state) => ({ robots: [...state.robots, robot] })),

      removeRobot: (robotId) =>
        set((state) => ({
          robots: state.robots.filter((r) => r.id !== robotId),
        })),

      updateRobot: (robotId, updates) =>
        set((state) => ({
          robots: state.robots.map((r) =>
            r.id === robotId ? { ...r, ...updates } : r
          ),
        })),

      addCredits: (amount) =>
        set((state) => ({ credits: state.credits + amount })),

      spendCredits: (amount) => {
        const state = get();
        if (state.credits >= amount) {
          set({ credits: state.credits - amount });
          return true;
        }
        return false;
      },

      addMaterials: (amount) =>
        set((state) => ({ materials: state.materials + amount })),

      spendMaterials: (amount) => {
        const state = get();
        if (state.materials >= amount) {
          set({ materials: state.materials - amount });
          return true;
        }
        return false;
      },

      addMissionRecord: (record) =>
        set((state) => ({ missionRecords: [...state.missionRecords, record] })),

      addRepairRecord: (record) =>
        set((state) => ({ repairRecords: [...state.repairRecords, record] })),

      addDreamRecord: (record) =>
        set((state) => ({ dreamRecords: [...state.dreamRecords, record] })),

      resolveDream: (robotId, triggerReason, summary) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) {
          throw new Error('Robot not found');
        }

        const { effects } = summary;
        const trustBefore = robot.trust;
        const newTrust = clamp(
          robot.trust + (effects.trustDelta ?? 0),
          0,
          100,
        );
        const newFatigue = clamp(
          robot.fatigue + (effects.fatigueDelta ?? 0),
          0,
          100,
        );
        const newDurability = clamp(
          robot.durability + (effects.durabilityDelta ?? 0),
          0,
          robot.maxDurability,
        );

        const updates: Partial<Robot> = {
          trust: newTrust,
          fatigue: newFatigue,
          durability: newDurability,
          dreamCount: robot.dreamCount + 1,
        };

        if (effects.personalitySet) {
          updates.personality = effects.personalitySet;
        }
        if (effects.specialtyGain) {
          updates.specialty = effects.specialtyGain;
        }
        if (summary.theme === 'failure') {
          updates.consecutiveFailures = 0;
        }

        state.updateRobot(robotId, updates);

        const record: DreamRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          theme: summary.theme,
          triggerReason,
          path: summary.path,
          choices: summary.choices,
          emotions: summary.emotions,
          finalEmotion: summary.finalEmotion,
          effects,
          trustBefore,
          trustAfter: newTrust,
          completedAt: Date.now(),
        };
        state.addDreamRecord(record);

        return record;
      },

      addAssemblyPlan: (plan) =>
        set((state) => ({ assemblyPlans: [...state.assemblyPlans, plan] })),

      removeAssemblyPlan: (planId) =>
        set((state) => ({
          assemblyPlans: state.assemblyPlans.filter((p) => p.id !== planId),
        })),

      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      resetConfig: () => set({ config: DEFAULT_CONFIG }),

      setSelectedPart: (slot, part) =>
        set((state) => ({
          selectedParts: {
            ...state.selectedParts,
            [slot]: part,
          },
        })),

      clearSelectedParts: () => set({ selectedParts: { ...EMPTY_SELECTED_PARTS } }),

      recyclePart: (partId) => {
        const state = get();
        const part = state.parts.find((p) => p.id === partId);
        if (!part) return;

        const recycleRate = state.config.recyclingRates[part.rarity];
        const materialsGained = Math.floor(part.maxDurability * recycleRate);

        set((s) => ({
          parts: s.parts.filter((p) => p.id !== partId),
          materials: s.materials + materialsGained,
        }));
      },

      repairRobot: (robotId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) return { success: false, cost: 0, restored: 0 };

        const { repairRules } = state.config;
        
        if (robot.repairCount >= repairRules.maxRepairs) {
          return { success: false, cost: 0, restored: 0 };
        }

        const durabilityNeeded = robot.maxDurability - robot.durability;
        const cost = durabilityNeeded * repairRules.materialCostPerPoint;

        if (!state.spendMaterials(cost)) {
          return { success: false, cost, restored: 0 };
        }

        const successRate = clamp(
          repairRules.baseSuccessRate - robot.repairCount * repairRules.degradeRate,
          0.1,
          repairRules.baseSuccessRate
        );
        const success = Math.random() < successRate;

        let restored = 0;
        if (success) {
          restored = durabilityNeeded;
          state.updateRobot(robotId, {
            durability: robot.maxDurability,
            repairCount: robot.repairCount + 1,
          });
        } else {
          state.updateRobot(robotId, {
            repairCount: robot.repairCount + 1,
          });
        }

        const record: RepairRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          materialCost: cost,
          success,
          durabilityRestored: restored,
          repairedAt: Date.now(),
        };
        state.addRepairRecord(record);

        return { success, cost, restored };
      },

      executeMission: (robotId, missionId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        const mission = MISSIONS.find((m) => m.id === missionId);

        if (!robot || !mission) {
          throw new Error('Robot or mission not found');
        }

        const adaptability = state.calculateAdaptability(robot, mission);
        const successChance = clamp(adaptability / 100, 0.1, 0.95);
        const success = Math.random() < successChance;

        let durabilityLoss = Math.floor(mission.difficulty * 5 * Math.random() + 5);
        if (robot.isOverloaded) {
          durabilityLoss += state.config.overloadRules.durabilityPenalty;
        }

        const newDurability = clamp(robot.durability - durabilityLoss, 0, robot.maxDurability);

        let fatigueGain = 8 + mission.difficulty * 2;
        if (robot.isOverloaded) fatigueGain += 5;
        if (!success) fatigueGain += 6;
        const newFatigue = clamp(robot.fatigue + fatigueGain, 0, 100);
        const newConsecutiveFailures = success ? 0 : robot.consecutiveFailures + 1;

        state.updateRobot(robotId, {
          durability: newDurability,
          fatigue: newFatigue,
          consecutiveFailures: newConsecutiveFailures,
        });

        let rewards = { credits: 0, materials: 0 };
        if (success) {
          rewards = {
            credits: mission.rewards.credits,
            materials: mission.rewards.materials,
          };
          state.addCredits(rewards.credits);
          state.addMaterials(rewards.materials);

          if (mission.rewards.blindBox) {
            const bonusParts = state.openBlindBox(mission.rewards.blindBox, true);
            bonusParts.forEach((p) => state.addPart(p));
          }
        }

        const reaction = getMissionReaction(robot.personality, success, robot.trust);

        const record: MissionRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          missionId: mission.id,
          missionName: mission.name,
          success,
          adaptability,
          rewards,
          durabilityLoss,
          fatigueGain,
          reaction,
          completedAt: Date.now(),
        };
        state.addMissionRecord(record);

        return record;
      },

      calculateRobotStats: (parts) => {
        const state = get();
        return calcStats(parts, state.config);
      },

      calculateAdaptability: (robot, mission) => {
        const state = get();
        return calcAdapt(robot, mission, state.config);
      },

      generateRandomPart: (minRarity) => {
        const state = get();
        return generateRandomPart(state.config, minRarity);
      },

      openBlindBox: (type, free = false) => {
        const state = get();
        const price = BLIND_BOX_PRICES[type];

        if (!free && !state.spendCredits(price)) {
          return [];
        }

        const parts: Part[] = [];
        const count = type === 'legendary' ? 5 : type === 'epic' ? 4 : type === 'rare' ? 3 : 2;

        for (let i = 0; i < count; i++) {
          const part = generateRandomPart(state.config, type);
          parts.push(part);
        }

        return parts;
      },

      loadFromStorage: () => {},

      resetGame: () =>
        set({
          parts: [],
          robots: [],
          credits: INITIAL_CREDITS,
          materials: INITIAL_MATERIALS,
          missionRecords: [],
          repairRecords: [],
          dreamRecords: [],
          assemblyPlans: [],
          selectedParts: { ...EMPTY_SELECTED_PARTS },
        }),
    }),
    {
      name: 'robot-workshop-storage',
      version: 2,
      migrate: (persistedState, version) => {
        const s = (persistedState ?? {}) as Partial<PersistedGameState>;
        if (version < 2) {
          s.robots = (s.robots ?? []).map((r) => ({
            ...r,
            fatigue: r.fatigue ?? 0,
            consecutiveFailures: r.consecutiveFailures ?? 0,
            personality: r.personality ?? 'neutral',
            specialty: r.specialty ?? null,
            trust: r.trust ?? 50,
            dreamCount: r.dreamCount ?? 0,
          }));
          s.dreamRecords = s.dreamRecords ?? [];
        }
        return s as PersistedGameState;
      },
      partialize: (state) => ({
        parts: state.parts,
        robots: state.robots,
        credits: state.credits,
        materials: state.materials,
        missionRecords: state.missionRecords,
        repairRecords: state.repairRecords,
        dreamRecords: state.dreamRecords,
        assemblyPlans: state.assemblyPlans,
        config: state.config,
      }),
    }
  )
);
