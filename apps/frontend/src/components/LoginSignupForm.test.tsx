/**
 * ログイン/サインアップUIコンポーネントのテスト（タスク 10.2）
 * - メール/パスワード入力フォームの表示を検証
 * - ログイン・サインアップ処理の呼び出しを検証
 * - エラーメッセージとバリデーション表示を検証
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginSignupForm from './LoginSignupForm';

const mockSignInEmail = vi.fn();
const mockSignUpEmail = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args),
    },
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args),
    },
  },
}));

describe('LoginSignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('メールとパスワードの入力フォームを表示する', () => {
    render(<LoginSignupForm />);
    const emailField = screen.getByPlaceholderText(/メール/i) || screen.getByLabelText(/メール/i);
    const passwordField = screen.getByPlaceholderText(/パスワード/i) || screen.getByLabelText(/パスワード/i);
    expect(emailField).toBeDefined();
    expect(passwordField).toBeDefined();
  });

  it('ログインとサインアップを切り替えるUIがある', () => {
    render(<LoginSignupForm />);
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /サインアップ/i })).toBeDefined();
  });

  it('ログインモードで送信すると signIn.email が呼ばれる', async () => {
    mockSignInEmail.mockResolvedValue({ data: {}, error: null });
    render(<LoginSignupForm />);
    const emailInput = screen.getByPlaceholderText(/メール|email/i) || screen.getByLabelText(/メール|email/i);
    const passwordInput = screen.getByPlaceholderText(/パスワード|password/i) || screen.getByLabelText(/パスワード|password/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    const loginButton = screen.getByRole('button', { name: /ログイン|サインイン|sign in/i });
    fireEvent.click(loginButton);
    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
    });
  });

  it('サインアップモードで送信すると signUp.email が呼ばれる', async () => {
    mockSignUpEmail.mockResolvedValue({ data: {}, error: null });
    render(<LoginSignupForm />);
    const switchButton = screen.getByRole('button', { name: /サインアップ/i });
    fireEvent.click(switchButton);
    await waitFor(() => {
      const nameInput = screen.queryByPlaceholderText(/名前/i) || screen.queryByLabelText(/名前/i);
      expect(nameInput).toBeDefined();
    });
    const nameInput = screen.getByPlaceholderText(/名前|name/i) || screen.getByLabelText(/名前|name/i);
    const emailInput = screen.getByPlaceholderText(/メール|email/i) || screen.getByLabelText(/メール|email/i);
    const passwordInput = screen.getByPlaceholderText(/パスワード|password/i) || screen.getByLabelText(/パスワード|password/i);
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    const submitButton = screen.getByRole('button', { name: /サインアップ|登録|sign up/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
      );
    });
  });

  it('認証エラー時にエラーメッセージを表示する', async () => {
    mockSignInEmail.mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } });
    render(<LoginSignupForm />);
    const emailInput = screen.getByPlaceholderText(/メール|email/i) || screen.getByLabelText(/メール|email/i);
    const passwordInput = screen.getByPlaceholderText(/パスワード|password/i) || screen.getByLabelText(/パスワード|password/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    const loginButton = screen.getByRole('button', { name: /ログイン|サインイン|sign in/i });
    fireEvent.click(loginButton);
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined();
    });
  });

  it('バリデーションでメール未入力時にエラーを表示する', async () => {
    render(<LoginSignupForm />);
    const passwordInput = screen.getByPlaceholderText(/パスワード/i) || screen.getByLabelText(/パスワード/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    const loginButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(loginButton);
    await waitFor(() => {
      expect(mockSignInEmail).not.toHaveBeenCalled();
      expect(screen.getByRole('alert').textContent).toContain('メールを入力してください');
    });
  });
});
