-- 統合テスト用: 全テーブルのデータを削除（子→親の順。D1はPRAGMA foreign_keys未対応のため明示的順序）
DELETE FROM interaction_logs;
DELETE FROM user_progress;
DELETE FROM grimoire_entries;
DELETE FROM quests;
DELETE FROM session;
DELETE FROM account;
DELETE FROM user_character_generated;
DELETE FROM user_character_profile;
DELETE FROM ai_daily_usage;
DELETE FROM rate_limit_logs;
DELETE FROM verification;
DELETE FROM user;
DELETE FROM skills;
