import { describe, it, expect } from 'vitest';
import {
  createTestUser,
  createTestQuest,
  createTestCharacterProfile,
  createTestGrimoireEntry,
} from './factories';
import type { AuthUser } from '../../apps/backend/src/types';
import type { Task, CharacterProfile, GrimoireEntry } from '@skill-quest/shared';
import { TaskType, Difficulty } from '@skill-quest/shared';

describe('Test Data Factories', () => {
  describe('createTestUser', () => {
    it('should create a valid AuthUser with default values', () => {
      const user = createTestUser();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(user.email).toContain('@');
    });

    it('should allow overriding default values', () => {
      const overrides: Partial<AuthUser> = {
        id: 'custom-id',
        email: 'custom@example.com',
        name: 'Custom Name',
      };
      const user = createTestUser(overrides);
      expect(user.id).toBe('custom-id');
      expect(user.email).toBe('custom@example.com');
      expect(user.name).toBe('Custom Name');
    });

    it('should create unique users when called multiple times', () => {
      const user1 = createTestUser();
      const user2 = createTestUser();
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('createTestQuest', () => {
    it('should create a valid Task with default values', () => {
      const quest = createTestQuest();
      expect(quest).toHaveProperty('id');
      expect(quest).toHaveProperty('title');
      expect(quest).toHaveProperty('type');
      expect(quest).toHaveProperty('difficulty');
      expect(quest).toHaveProperty('completed');
      expect(typeof quest.id).toBe('string');
      expect(typeof quest.title).toBe('string');
      expect(Object.values(TaskType)).toContain(quest.type);
      expect(Object.values(Difficulty)).toContain(quest.difficulty);
      expect(typeof quest.completed).toBe('boolean');
    });

    it('should allow overriding default values', () => {
      const overrides = {
        title: 'Custom Quest',
        type: TaskType.HABIT,
        difficulty: Difficulty.HARD,
        completed: true,
      };
      const quest = createTestQuest(overrides);
      expect(quest.title).toBe('Custom Quest');
      expect(quest.type).toBe(TaskType.HABIT);
      expect(quest.difficulty).toBe(Difficulty.HARD);
      expect(quest.completed).toBe(true);
    });

    it('should create unique quests when called multiple times', () => {
      const quest1 = createTestQuest();
      const quest2 = createTestQuest();
      expect(quest1.id).not.toBe(quest2.id);
    });
  });

  describe('createTestCharacterProfile', () => {
    it('should create a valid CharacterProfile with default values', () => {
      const profile = createTestCharacterProfile();
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('className');
      expect(profile).toHaveProperty('title');
      expect(profile).toHaveProperty('prologue');
      expect(profile).toHaveProperty('themeColor');
      expect(profile).toHaveProperty('level');
      expect(profile).toHaveProperty('currentXp');
      expect(profile).toHaveProperty('nextLevelXp');
      expect(profile).toHaveProperty('gold');
      expect(typeof profile.name).toBe('string');
      expect(typeof profile.className).toBe('string');
      expect(typeof profile.title).toBe('string');
      expect(typeof profile.prologue).toBe('string');
      expect(profile.themeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof profile.level).toBe('number');
      expect(typeof profile.currentXp).toBe('number');
      expect(typeof profile.nextLevelXp).toBe('number');
      expect(typeof profile.gold).toBe('number');
    });

    it('should allow overriding default values', () => {
      const overrides = {
        name: 'Custom Character',
        className: 'Mage',
        level: 5,
      };
      const profile = createTestCharacterProfile(overrides);
      expect(profile.name).toBe('Custom Character');
      expect(profile.className).toBe('Mage');
      expect(profile.level).toBe(5);
    });
  });

  describe('createTestGrimoireEntry', () => {
    it('should create a valid GrimoireEntry with default values', () => {
      const entry = createTestGrimoireEntry();
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('taskTitle');
      expect(entry).toHaveProperty('narrative');
      expect(entry).toHaveProperty('rewardXp');
      expect(entry).toHaveProperty('rewardGold');
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.date).toBe('string');
      expect(typeof entry.taskTitle).toBe('string');
      expect(typeof entry.narrative).toBe('string');
      expect(typeof entry.rewardXp).toBe('number');
      expect(typeof entry.rewardGold).toBe('number');
      // date should be in ISO format (YYYY-MM-DD)
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should allow overriding default values', () => {
      const overrides = {
        taskTitle: 'Custom Task',
        narrative: 'Custom narrative',
        rewardXp: 100,
        rewardGold: 50,
      };
      const entry = createTestGrimoireEntry(overrides);
      expect(entry.taskTitle).toBe('Custom Task');
      expect(entry.narrative).toBe('Custom narrative');
      expect(entry.rewardXp).toBe(100);
      expect(entry.rewardGold).toBe(50);
    });

    it('should create unique entries when called multiple times', () => {
      const entry1 = createTestGrimoireEntry();
      const entry2 = createTestGrimoireEntry();
      expect(entry1.id).not.toBe(entry2.id);
    });
  });
});
