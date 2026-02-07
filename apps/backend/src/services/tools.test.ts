import { describe, it, expect, vi } from 'vitest';
import {
  AI_TOOL_DEFINITIONS,
  executeToolCall,
  runChatWithTools,
  type ChatRunBinding,
  type ToolDefinition,
} from './tools';

describe('Function Calling tools', () => {
  describe('AI_TOOL_DEFINITIONS', () => {
    it('defines exactly three tools', () => {
      expect(AI_TOOL_DEFINITIONS).toHaveLength(3);
    });

    it('each tool has name, description, and parameters (JSON schema)', () => {
      for (const tool of AI_TOOL_DEFINITIONS) {
        expect(tool).toHaveProperty('name');
        expect(typeof tool.name).toBe('string');
        expect(tool).toHaveProperty('description');
        expect(typeof tool.description).toBe('string');
        expect(tool).toHaveProperty('parameters');
        expect(tool.parameters).toHaveProperty('type', 'object');
        expect(tool.parameters).toHaveProperty('properties');
        expect(typeof tool.parameters.properties).toBe('object');
        expect(tool.parameters).toHaveProperty('required');
        expect(Array.isArray(tool.parameters.required)).toBe(true);
      }
    });

    it('defines submit_answer, request_hint, search_docs', () => {
      const names = AI_TOOL_DEFINITIONS.map((t: ToolDefinition) => t.name);
      expect(names).toContain('submit_answer');
      expect(names).toContain('request_hint');
      expect(names).toContain('search_docs');
    });
  });

  describe('executeToolCall', () => {
    it('submit_answer returns non-empty string', () => {
      const result = executeToolCall('submit_answer', { code: 'const x = 1;', confidence: 0.9 });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('request_hint returns non-empty string', () => {
      const result = executeToolCall('request_hint', { level: 2 });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('search_docs returns non-empty string', () => {
      const result = executeToolCall('search_docs', { query: 'JavaScript' });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('unknown tool returns fallback message', () => {
      const result = executeToolCall('unknown_tool', {});
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('runChatWithTools', () => {
    it('returns response text when AI returns no tool_calls', async () => {
      const run = vi.fn().mockResolvedValue({ response: 'こんにちは。' });
      const ai: ChatRunBinding = { run };
      const messages = [{ role: 'user' as const, content: '挨拶して' }];

      const result = await runChatWithTools(ai, messages);

      expect(result).toBe('こんにちは。');
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('executes tool and calls AI again with tool result when tool_calls returned', async () => {
      const run = vi
        .fn()
        .mockResolvedValueOnce({
          response: '',
          tool_calls: [{ name: 'search_docs', arguments: { query: 'fetch API' } }],
        })
        .mockResolvedValueOnce({ response: 'fetch APIのドキュメントは以下です。' });
      const ai: ChatRunBinding = { run };
      const messages = [{ role: 'user' as const, content: 'fetchの使い方を教えて' }];

      const result = await runChatWithTools(ai, messages);

      expect(result).toBe('fetch APIのドキュメントは以下です。');
      expect(run).toHaveBeenCalledTimes(2);
      const secondCall = run.mock.calls[1];
      const secondMessages = (secondCall[1] as { messages: unknown[] }).messages;
      expect(secondMessages.some((m) => (m as { role?: string }).role === 'tool')).toBe(true);
    });
  });
});
