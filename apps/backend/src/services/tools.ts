/**
 * Function Calling 用ツール定義（JSONスキーマ形式）と実行ロジック
 * design.md / docs/architecture/06_AI設計.md に準拠
 */

/** Workers AI のツール定義（name, description, parameters は JSON Schema 互換） */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: number[] }>;
    required: string[];
  };
}

/** ツール定義（submit_answer, request_hint, search_docs） */
export const AI_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'submit_answer',
    description: 'ユーザーの回答を提出し、クエスト完了判定を行う',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '提出するコードまたは回答' },
        confidence: { type: 'number', description: '自信度 (0-1)' },
      },
      required: ['code', 'confidence'],
    },
  },
  {
    name: 'request_hint',
    description: 'ヒントを表示する（XPを消費）',
    parameters: {
      type: 'object',
      properties: {
        level: { type: 'number', description: 'ヒントのレベル (1-3)', enum: [1, 2, 3] },
      },
      required: ['level'],
    },
  },
  {
    name: 'search_docs',
    description: '関連する技術ドキュメント（RAG）を検索する',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '検索クエリ' },
      },
      required: ['query'],
    },
  },
];

/** Workers AI run() のチャット＋ツール用オプション・レスポンス型 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface ToolCallItem {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatRunResponse {
  response?: string;
  tool_calls?: ToolCallItem[];
}

/** messages と tools を渡して run できるバインディング（Llama 3.1 Function Calling 用） */
export interface ChatRunBinding {
  run(
    model: string,
    options: { messages: ChatMessage[]; tools: ToolDefinition[]; [key: string]: unknown }
  ): Promise<ChatRunResponse>;
}

const MODEL_LLAMA_31_8B = '@cf/meta/llama-3.1-8b-instruct';

/**
 * ツール名と引数を受け取り、実行結果の文字列を返す。
 * 実装はスタブ（D1更新・RAG検索はタスク範囲外のため簡易応答）。
 */
export function executeToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'submit_answer': {
      const code = typeof args.code === 'string' ? args.code : String(args.code ?? '');
      const confidence = typeof args.confidence === 'number' ? args.confidence : 0;
      return JSON.stringify({ accepted: true, message: '提出を受け付けました。', code: code.slice(0, 200), confidence });
    }
    case 'request_hint': {
      const level = typeof args.level === 'number' ? args.level : 1;
      const hints: Record<number, string> = {
        1: 'ヒント(1): 問題文の条件を再度確認してみましょう。',
        2: 'ヒント(2): よく使うパターンがドキュメントに載っています。',
        3: 'ヒント(3): 答えに近い考え方の例を提示します。',
      };
      return JSON.stringify({ hint: hints[level] ?? hints[1] });
    }
    case 'search_docs': {
      const query = typeof args.query === 'string' ? args.query : String(args.query ?? '');
      return JSON.stringify({ results: [`「${query}」に関するドキュメントの抜粋です。`] });
    }
    default:
      return JSON.stringify({ error: 'Unknown tool', name });
  }
}

/**
 * Llama 3.1 の Function Calling を使用し、ツール実行結果を再度 LLM に入力して最終回答を生成する。
 */
export async function runChatWithTools(
  ai: ChatRunBinding,
  messages: ChatMessage[],
  model: string = MODEL_LLAMA_31_8B
): Promise<string> {
  const options = { messages, tools: AI_TOOL_DEFINITIONS };
  const response = await ai.run(model, options);

  if (response.tool_calls && response.tool_calls.length > 0) {
    const nextMessages: ChatMessage[] = [...messages];
    nextMessages.push({
      role: 'assistant',
      content: response.response ?? JSON.stringify(response.tool_calls),
    });
    for (const tc of response.tool_calls) {
      const result = executeToolCall(tc.name, tc.arguments ?? {});
      nextMessages.push({ role: 'tool', content: result });
    }
    const final = await ai.run(model, { ...options, messages: nextMessages });
    return final.response ?? '';
  }

  return response.response ?? '';
}
