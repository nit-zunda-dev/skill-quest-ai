import { GoogleGenAI, Type } from "@google/genai";
import { CharacterProfile, GenesisFormData, Task, CharacterStats, GrimoireEntry, Difficulty } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });
const modelId = "gemini-3-flash-preview";

// --- MVP-01: Genesis ---

export const generateCharacter = async (data: GenesisFormData): Promise<CharacterProfile> => {
  const prompt = `
    あなたはRPGのゲームマスターです。ユーザーの目標に基づき、日本語でキャラクターを作成してください。
    
    【ユーザー情報】
    名前: ${data.name}
    目標: ${data.goal}
    ジャンル: ${data.genre}

    【出力ルール】
    1. クラス名: 目標に関連したユニークな職業名（例: プログラミング目標→「真理の探求者」）
    2. 称号: カッコいい二つ名
    3. ステータス: 目標に合わせた配分（合計250）
    4. プロローグ: 2-3文の物語の導入。ファンタジー用語を使いすぎず、しかし世界観を感じさせる表現で。
    5. 初期スキル: 目標に役立つパッシブスキル名
    6. テーマカラー: クラスに合う16進数カラー
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            className: { type: Type.STRING },
            title: { type: Type.STRING },
            stats: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER },
                intelligence: { type: Type.INTEGER },
                charisma: { type: Type.INTEGER },
                willpower: { type: Type.INTEGER },
                luck: { type: Type.INTEGER },
              },
              required: ["strength", "intelligence", "charisma", "willpower", "luck"],
            },
            prologue: { type: Type.STRING },
            startingSkill: { type: Type.STRING },
            themeColor: { type: Type.STRING },
          },
          required: ["className", "title", "stats", "prologue", "startingSkill", "themeColor"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    const result = JSON.parse(jsonText);

    return {
      name: data.name,
      ...result,
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      hp: 100,
      maxHp: 100,
      gold: 0
    };

  } catch (error) {
    console.error("Genesis Error:", error);
    return {
      name: data.name,
      className: "冒険者",
      title: "始まりの旅人",
      stats: { strength: 50, intelligence: 50, charisma: 50, willpower: 50, luck: 50 },
      prologue: "新たな冒険の幕が開けます。",
      startingSkill: "挑戦の心",
      themeColor: "#6366f1",
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      hp: 100,
      maxHp: 100,
      gold: 0
    };
  }
};

// --- MVP-03: Narrative Check-in ---

interface NarrativeResult {
  narrative: string;
  xp: number;
  gold: number;
}

export const generateTaskNarrative = async (
  task: Task, 
  userComment: string, 
  profile: CharacterProfile
): Promise<NarrativeResult> => {
  const prompt = `
    RPGのタスク完了イベントを生成してください。
    
    【コンテキスト】
    キャラクター: ${profile.className} "${profile.name}" (Lv.${profile.level})
    世界観: ${profile.prologue ? '設定された世界観に従う' : 'ファンタジー'}
    完了したタスク: ${task.title} (難易度: ${task.difficulty})
    ユーザーのコメント: ${userComment || 'なし'}

    【出力ルール】
    1. narrative: タスク完了をRPGのアクションとして描写する（2文程度）。大袈裟すぎず、達成感のある表現で。
    2. xp: 難易度に応じた経験値 (Easy: 10-20, Medium: 25-40, Hard: 50-80)
    3. gold: 難易度に応じた報酬 (Easy: 5-10, Medium: 15-25, Hard: 30-50)
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING },
            xp: { type: Type.INTEGER },
            gold: { type: Type.INTEGER },
          },
          required: ["narrative", "xp", "gold"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as NarrativeResult;
  } catch (error) {
    console.error("Narrative Error:", error);
    // Fallback logic
    const baseReward = task.difficulty === Difficulty.HARD ? 50 : task.difficulty === Difficulty.MEDIUM ? 30 : 15;
    return {
      narrative: `${task.title}を達成した！心地よい疲労感と共に、力が湧いてくるのを感じる。`,
      xp: baseReward,
      gold: Math.floor(baseReward / 2)
    };
  }
};

// --- MVP-06: AI Partner Chat ---

export const generatePartnerMessage = async (profile: CharacterProfile, tasks: Task[]): Promise<string> => {
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const timeOfDay = new Date().getHours() < 12 ? '朝' : new Date().getHours() < 18 ? '昼' : '夜';

  const prompt = `
    あなたはRPGの相棒キャラクターです。プレイヤーに短く（1文）声をかけてください。
    
    【状況】
    プレイヤー: ${profile.name} (${profile.className})
    時間帯: ${timeOfDay}
    未完了タスク: ${pendingTasks}個
    完了タスク: ${completedTasks}個
    
    【性格】
    頼れる相棒。少しだけ皮肉屋だが、基本は応援している。
    です・ます調ではなく、砕けた口調で。
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "text/plain",
      },
    });
    return response.text?.trim() || "調子はどうだ？";
  } catch (e) {
    return "次の冒険の準備はできているか？";
  }
};