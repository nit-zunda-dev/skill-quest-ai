-- フェーズ1: Skill Quest / AI / ガチャ等のレガシーテーブルを削除（FK 依存の子から順）
DROP TABLE IF EXISTS interaction_logs;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS user_acquired_items;
DROP TABLE IF EXISTS partner_item_grants;
DROP TABLE IF EXISTS partner_favorability;
DROP TABLE IF EXISTS quests;
DROP TABLE IF EXISTS grimoire_entries;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS user_character_generated;
DROP TABLE IF EXISTS user_character_profile;
DROP TABLE IF EXISTS ai_daily_usage;
DROP TABLE IF EXISTS rate_limit_logs;
