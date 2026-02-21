/**
 * NotFoundPage の単体テスト（Task 6.1, Requirements 5.1）
 * 未定義パス用の 404 画面: タイトル「見つかりません」、ランディング・ログインへのリンク。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';
import { PATH_LANDING, PATH_LOGIN } from '@/lib/paths';

const TITLE_NOT_FOUND = 'ページが見つかりません';
const TITLE_APP = 'Skill Quest AI';

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>
  );
}

describe('NotFoundPage (Task 6.1, Req 5.1)', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('renders 404 and "ページが見つかりません" so user and crawlers recognize not-found', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeTruthy();
    expect(screen.getByText(/ページが見つかりません/)).toBeTruthy();
  });

  it('sets document.title to include not-found message and app name', async () => {
    renderNotFound();
    await waitFor(() => {
      expect(document.title).toContain(TITLE_NOT_FOUND);
      expect(document.title).toContain(TITLE_APP);
    });
  });

  it('provides link to landing', () => {
    renderNotFound();
    const links = screen.getAllByRole('link');
    const toLanding = links.find((el) => el.getAttribute('href') === PATH_LANDING);
    expect(toLanding).toBeTruthy();
  });

  it('provides link to login', () => {
    renderNotFound();
    const links = screen.getAllByRole('link');
    const toLogin = links.find((el) => el.getAttribute('href') === PATH_LOGIN);
    expect(toLogin).toBeTruthy();
  });
});
