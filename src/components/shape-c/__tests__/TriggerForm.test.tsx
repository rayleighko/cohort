import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';

afterEach(cleanup);
import TriggerForm from '../TriggerForm';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOnSubmit() {
  return vi.fn().mockResolvedValue(undefined);
}

function renderForm(props: Partial<Parameters<typeof TriggerForm>[0]> = {}) {
  const onSubmit = props.onSubmit ?? makeOnSubmit();
  const { rerender } = render(<TriggerForm onSubmit={onSubmit} {...props} />);
  return { onSubmit, rerender };
}

// ── Trigger type selection ────────────────────────────────────────────────────

describe('trigger type selection', () => {
  it('renders price_drop selected by default', () => {
    renderForm();
    const priceDrop = screen.getByRole('button', { name: '가격 하락' });
    expect(priceDrop.className).toContain('bg-primary');
  });

  it('switches to macro_composite when clicked', () => {
    renderForm();
    const macroBtn = screen.getByRole('button', { name: '매크로 복합' });
    fireEvent.click(macroBtn);
    expect(macroBtn.className).toContain('bg-primary');
    expect(screen.getByText('매크로 복합 조건')).toBeDefined();
  });

  it('V1.5 buttons are disabled', () => {
    renderForm();
    const disclosure = screen.getByRole('button', { name: '공시 (V1.5)' });
    const composite = screen.getByRole('button', { name: '복합 조건 (V1.5)' });
    expect((disclosure as HTMLButtonElement).disabled).toBe(true);
    expect((composite as HTMLButtonElement).disabled).toBe(true);
  });

  it('clicking a disabled button does not change selection', () => {
    renderForm();
    const disclosure = screen.getByRole('button', { name: '공시 (V1.5)' });
    fireEvent.click(disclosure);
    const priceDrop = screen.getByRole('button', { name: '가격 하락' });
    expect(priceDrop.className).toContain('bg-primary');
  });
});

// ── price_drop fields ─────────────────────────────────────────────────────────

describe('price_drop input fields', () => {
  it('renders ticker, threshold_pct, window_hours inputs', () => {
    renderForm();
    expect(screen.getByLabelText(/티커/)).toBeDefined();
    expect(screen.getByLabelText(/하락률/)).toBeDefined();
    expect(screen.getByLabelText(/관찰 기간/)).toBeDefined();
  });

  it('updates ticker value on change', () => {
    renderForm();
    const input = screen.getByLabelText(/티커/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'AAPL' } });
    expect(input.value).toBe('AAPL');
  });
});

// ── macro_composite fields ────────────────────────────────────────────────────

describe('macro_composite input fields', () => {
  it('renders direction buttons and threshold input', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '매크로 복합' }));
    expect(screen.getByRole('button', { name: '이하 (하락)' })).toBeDefined();
    expect(screen.getByRole('button', { name: '이상 (상승)' })).toBeDefined();
    expect(screen.getByLabelText(/매크로 스코어 임계값/)).toBeDefined();
  });

  it('toggles direction correctly', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '매크로 복합' }));
    const above = screen.getByRole('button', { name: '이상 (상승)' });
    fireEvent.click(above);
    expect(above.getAttribute('aria-pressed')).toBe('true');
  });
});

// ── Validation ────────────────────────────────────────────────────────────────

describe('form validation', () => {
  it('shows ticker error when empty on submit', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '트리거 저장' }));
    await waitFor(() => {
      expect(screen.getByText('티커를 입력해 주세요.')).toBeDefined();
    });
  });

  it('shows threshold_pct error for invalid value', async () => {
    renderForm();
    const tickerInput = screen.getByLabelText(/티커/) as HTMLInputElement;
    fireEvent.change(tickerInput, { target: { value: 'AAPL' } });
    const pctInput = screen.getByLabelText(/하락률/) as HTMLInputElement;
    fireEvent.change(pctInput, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: '트리거 저장' }));
    await waitFor(() => {
      expect(screen.getByText('하락률은 0-100% 사이로 입력해 주세요.')).toBeDefined();
    });
  });

  it('shows cooldown error for out-of-range value', async () => {
    renderForm();
    const cooldown = screen.getByLabelText(/쿨다운/) as HTMLInputElement;
    fireEvent.change(cooldown, { target: { value: '200' } });
    const ticker = screen.getByLabelText(/티커/) as HTMLInputElement;
    fireEvent.change(ticker, { target: { value: 'AAPL' } });
    const pct = screen.getByLabelText(/하락률/) as HTMLInputElement;
    fireEvent.change(pct, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: '트리거 저장' }));
    await waitFor(() => {
      expect(screen.getByText('쿨다운은 1-168시간 사이여야 합니다.')).toBeDefined();
    });
  });

  it('shows macro threshold error when empty on submit', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '매크로 복합' }));
    fireEvent.click(screen.getByRole('button', { name: '트리거 저장' }));
    await waitFor(() => {
      expect(screen.getByText('임계값은 0-100 사이로 입력해 주세요.')).toBeDefined();
    });
  });
});

// ── Submission ────────────────────────────────────────────────────────────────

describe('form submission', () => {
  it('calls onSubmit with correct price_drop payload', async () => {
    const onSubmit = makeOnSubmit();
    render(<TriggerForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/티커/) as HTMLInputElement, {
      target: { value: 'aapl' },
    });
    fireEvent.change(screen.getByLabelText(/하락률/) as HTMLInputElement, {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText(/관찰 기간/) as HTMLInputElement, {
      target: { value: '24' },
    });
    fireEvent.click(screen.getByRole('button', { name: '트리거 저장' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        trigger_type: 'price_drop',
        condition_params: { ticker: 'AAPL', threshold_pct: 5, window_hours: 24 },
        cooldown_hours: 24,
        label: null,
      });
    });
  });

  it('calls onSubmit with correct macro_composite payload', async () => {
    const onSubmit = makeOnSubmit();
    render(<TriggerForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: '매크로 복합' }));
    fireEvent.change(screen.getByLabelText(/매크로 스코어 임계값/) as HTMLInputElement, {
      target: { value: '40' },
    });
    fireEvent.click(screen.getByRole('button', { name: '트리거 저장' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        trigger_type: 'macro_composite',
        condition_params: { direction: 'below', threshold: 40 },
        cooldown_hours: 24,
        label: null,
      });
    });
  });

  it('resets form after successful submission', async () => {
    const onSubmit = makeOnSubmit();
    render(<TriggerForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/티커/) as HTMLInputElement, {
      target: { value: 'TSLA' },
    });
    fireEvent.change(screen.getByLabelText(/하락률/) as HTMLInputElement, {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText(/관찰 기간/) as HTMLInputElement, {
      target: { value: '48' },
    });
    fireEvent.click(screen.getByRole('button', { name: '트리거 저장' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    const tickerInput = screen.getByLabelText(/티커/) as HTMLInputElement;
    expect(tickerInput.value).toBe('');
  });

  it('displays submit error from rejected onSubmit', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('서버 오류'));
    render(<TriggerForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/티커/) as HTMLInputElement, {
      target: { value: 'AAPL' },
    });
    fireEvent.change(screen.getByLabelText(/하락률/) as HTMLInputElement, {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText(/관찰 기간/) as HTMLInputElement, {
      target: { value: '24' },
    });
    fireEvent.click(screen.getByRole('button', { name: '트리거 저장' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText('서버 오류')).toBeDefined();
    });
  });

  it('shows loading state when isLoading=true', () => {
    renderForm({ isLoading: true, onSubmit: makeOnSubmit() });
    const cta = screen.getByRole('button', { name: '저장 중…' }) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    expect(cta.getAttribute('aria-busy')).toBe('true');
  });
});
