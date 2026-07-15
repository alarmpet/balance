import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import type { Question } from '@/src/features/play/domain/question';
import { AskScreen } from '@/src/features/ask/ui/AskScreen';

const createdQuestion: Question = {
  id: '72000000-0000-0000-0000-000000000099',
  optionA: '집에 있기',
  optionB: '외출하기',
  description: null,
  category: '일상',
  visibility: 'link',
  closesAt: null,
  isDaily: false,
  stage: 'pending',
  weightsA: {},
  weightsB: {},
};

function createRepository(create = jest.fn().mockResolvedValue(createdQuestion)) {
  return {
    getDaily: jest.fn(),
    getFeed: jest.fn(),
    getById: jest.fn(),
    getVoteEvidence: jest.fn(),
    vote: jest.fn(),
    skip: jest.fn(),
    create,
    report: jest.fn(),
  } as jest.Mocked<QuestionRepository>;
}

test('shows canonical category chips and honest default settings', async () => {
  const view = await render(<AskScreen repository={createRepository()} userId="guest-layout" />);

  expect(view.getByRole('header', { name: '밸런스 작성' })).toBeTruthy();
  expect(view.getByLabelText('카테고리 선택')).toBeTruthy();
  expect(view.getAllByRole('radio').filter((node) =>
    ['일상', '회사', '관계', '여행', '돈', '성장'].includes(node.props.accessibilityLabel),
  )).toHaveLength(6);
  expect(view.getByLabelText('마감 시간, 마감 없음')).toBeTruthy();
  expect(view.getByLabelText('공개 방식, 전체 공개')).toBeTruthy();
  expect(view.queryByText('추가 설정')).toBeNull();
});

test('disables visibility controls when mutation permission is closed', async () => {
  const view = await render(
    <AskScreen canMutate={false} repository={createRepository()} userId="guest-readonly" />,
  );

  const publicRadio = view.getByRole('radio', { name: '전체 공개' });
  const linkRadio = view.getByRole('radio', { name: '링크로만 공개' });
  expect(publicRadio).toHaveProp('accessibilityState', { checked: true, disabled: true });
  expect(linkRadio).toBeDisabled();
  await fireEvent.press(linkRadio);
  expect(publicRadio).toHaveProp('accessibilityState', { checked: true, disabled: true });
  expect(linkRadio).toHaveProp('accessibilityState', { checked: false, disabled: true });
});

test('creates link-only questions through the unified form', async () => {
  const repository = createRepository();
  const view = await render(<AskScreen repository={repository} userId="guest-1" />);

  await fireEvent.changeText(view.getByPlaceholderText('선택지 A'), '집에 있기');
  await fireEvent.changeText(view.getByPlaceholderText('선택지 B'), '외출하기');
  await fireEvent.press(view.getByText('링크로만 공개'));
  await fireEvent.press(view.getByRole('button', { name: '게시하기' }));

  await waitFor(() => {
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({
      authorId: 'guest-1',
      optionA: '집에 있기',
      optionB: '외출하기',
      description: null,
      category: '일상',
      visibility: 'link',
      closesAt: null,
    });
  });
  expect(view.getByText('질문이 등록되었어요. 실제 사용자에게 테스트 노출을 시작합니다.')).toBeTruthy();
  expect(view.getByPlaceholderText('선택지 A')).toHaveProp('value', '');
  expect(view.getByPlaceholderText('선택지 B')).toHaveProp('value', '');
});

test('asks for notification opt-in only after a question is created', async () => {
  const repository = createRepository();
  const registerNotifications = jest.fn().mockResolvedValue({ status: 'registered' });
  const view = await render(
    <AskScreen
      canMutate
      registerNotifications={registerNotifications}
      repository={repository}
      userId="71000000-0000-0000-0000-000000000099"
    />,
  );

  expect(registerNotifications).not.toHaveBeenCalled();
  await fireEvent.changeText(view.getByLabelText('선택지 A'), 'A');
  await fireEvent.changeText(view.getByLabelText('선택지 B'), 'B');
  expect(registerNotifications).not.toHaveBeenCalled();
  await fireEvent.press(view.getByRole('button', { name: '게시하기' }));

  await waitFor(() => expect(registerNotifications).toHaveBeenCalledWith({
    identity: { userId: '71000000-0000-0000-0000-000000000099', source: 'anonymous' },
    shouldContinue: expect.any(Function),
  }));
  expect(repository.create.mock.invocationCallOrder[0])
    .toBeLessThan(registerNotifications.mock.invocationCallOrder[0]);
});

test('offline question creation never starts notification registration', async () => {
  const registerNotifications = jest.fn();
  const view = await render(
    <AskScreen source="offline" registerNotifications={registerNotifications} repository={createRepository()} userId="guest_00000000-0000-0000-0000-000000000001" />,
  );
  await fireEvent.changeText(view.getByLabelText('선택지 A'), 'A');
  await fireEvent.changeText(view.getByLabelText('선택지 B'), 'B');
  await fireEvent.press(view.getByRole('button', { name: '게시하기' }));
  await waitFor(() => expect(view.getByText(/등록되었어요/)).toBeTruthy());
  expect(registerNotifications).not.toHaveBeenCalled();
});

test('tracks create funnel without option or description text', async () => {
  const trackEvent = jest.fn().mockResolvedValue(undefined);
  const view = await render(
    <AskScreen trackEvent={trackEvent} repository={createRepository()} userId="71000000-0000-0000-0000-000000000001" />,
  );
  await fireEvent.changeText(view.getByLabelText('선택지 A'), 'private A');
  await fireEvent.changeText(view.getByLabelText('선택지 B'), 'private B');
  await fireEvent.press(view.getByRole('button', { name: '게시하기' }));
  await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ name: 'question_created' })));
  expect(trackEvent).toHaveBeenCalledWith({
    name: 'question_create_started', userId: '71000000-0000-0000-0000-000000000001', source: 'ask',
  });
  expect(JSON.stringify(trackEvent.mock.calls)).not.toContain('private A');
  expect(JSON.stringify(trackEvent.mock.calls)).not.toContain('private B');
});

test('never prompts for notifications when question creation fails', async () => {
  const registerNotifications = jest.fn();
  const view = await render(
    <AskScreen
      registerNotifications={registerNotifications}
      repository={createRepository(jest.fn().mockRejectedValue(new Error('offline')))}
      userId="guest-failed"
    />,
  );

  await fireEvent.changeText(view.getByLabelText('선택지 A'), 'A');
  await fireEvent.changeText(view.getByLabelText('선택지 B'), 'B');
  await fireEvent.press(view.getByRole('button', { name: '게시하기' }));
  await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
  expect(registerNotifications).not.toHaveBeenCalled();
});

test('does not prompt after mutation capability is revoked during creation', async () => {
  let resolveCreate!: (question: Question) => void;
  const repository = createRepository(jest.fn(() => new Promise<Question>((resolve) => {
    resolveCreate = resolve;
  })));
  const registerNotifications = jest.fn();
  const view = await render(
    <AskScreen canMutate registerNotifications={registerNotifications} repository={repository} userId="guest-conflict" />,
  );
  await fireEvent.changeText(view.getByLabelText('선택지 A'), 'A');
  await fireEvent.changeText(view.getByLabelText('선택지 B'), 'B');
  await fireEvent.press(view.getByRole('button', { name: '게시하기' }));

  await view.rerender(
    <AskScreen canMutate={false} registerNotifications={registerNotifications} repository={repository} userId="guest-conflict" />,
  );
  await act(async () => resolveCreate(createdQuestion));
  expect(registerNotifications).not.toHaveBeenCalled();
});

test('keeps typed input when submission fails', async () => {
  const create = jest.fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(createdQuestion);
  const repository = createRepository(create);
  const view = await render(<AskScreen repository={repository} userId="guest-2" />);

  await fireEvent.changeText(view.getByPlaceholderText('선택지 A'), '일찍 자기');
  await fireEvent.changeText(view.getByPlaceholderText('선택지 B'), '늦잠 자기');
  await fireEvent.changeText(view.getByLabelText('질문 설명'), '요즘 잠이 부족해서 고민이에요.');
  await fireEvent.press(view.getByRole('radio', { name: '관계' }));
  await fireEvent.press(view.getByRole('radio', { name: '링크로만 공개' }));
  await fireEvent.press(view.getByRole('radio', { name: '7일' }));
  await fireEvent.press(view.getByRole('button', { name: '게시하기' }));

  await waitFor(() => {
    expect(view.getByRole('alert')).toHaveTextContent(
      '질문을 등록하지 못했어요. 다시 시도해 주세요.',
    );
  });
  expect(view.getByPlaceholderText('선택지 A')).toHaveProp('value', '일찍 자기');
  expect(view.getByPlaceholderText('선택지 B')).toHaveProp('value', '늦잠 자기');
  expect(view.getByLabelText('질문 설명')).toHaveProp('value', '요즘 잠이 부족해서 고민이에요.');
  expect(view.getByRole('radio', { name: '관계' })).toHaveProp(
    'accessibilityState', { checked: true, disabled: false },
  );
  expect(view.getByRole('radio', { name: '링크로만 공개' })).toHaveProp(
    'accessibilityState', { checked: true, disabled: false },
  );
  expect(view.getByRole('radio', { name: '7일' })).toHaveProp(
    'accessibilityState', { checked: true, disabled: false },
  );

  await fireEvent.press(view.getByRole('button', { name: '질문 등록 다시 시도' }));
  await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
  expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
    optionA: '일찍 자기', optionB: '늦잠 자기', category: '관계', visibility: 'link',
    description: '요즘 잠이 부족해서 고민이에요.', closesAt: expect.any(String),
  }));
});

test('does not submit duplicate options', async () => {
  const repository = createRepository();
  const view = await render(<AskScreen repository={repository} userId="guest-3" />);

  await fireEvent.changeText(view.getByPlaceholderText('선택지 A'), '같은 선택');
  await fireEvent.changeText(view.getByPlaceholderText('선택지 B'), '  같은 선택  ');
  const submit = view.getByRole('button', { name: '게시하기' });

  expect(submit).toBeDisabled();
  await fireEvent.press(submit);
  expect(repository.create).not.toHaveBeenCalled();

  await fireEvent.changeText(view.getByPlaceholderText('선택지 A'), '가');
  await fireEvent.changeText(view.getByPlaceholderText('선택지 B'), '\u1100\u1161');
  expect(view.getByRole('button', { name: '게시하기' })).toBeDisabled();
});

test('ignores a late completion from a replaced screen generation', async () => {
  let resolveCreate!: (question: Question) => void;
  const firstRepository = createRepository(
    jest.fn(
      () =>
        new Promise<Question>((resolve) => {
          resolveCreate = resolve;
        }),
    ),
  );
  const nextRepository = createRepository();
  const view = await render(<AskScreen repository={firstRepository} userId="guest-old" />);

  await fireEvent.changeText(view.getByPlaceholderText('선택지 A'), '이전 A');
  await fireEvent.changeText(view.getByPlaceholderText('선택지 B'), '이전 B');
  await fireEvent.press(view.getByRole('button', { name: '게시하기' }));

  await view.rerender(<AskScreen repository={nextRepository} userId="guest-new" />);
  await fireEvent.changeText(view.getByPlaceholderText('선택지 A'), '새로운 A');
  await fireEvent.changeText(view.getByPlaceholderText('선택지 B'), '새로운 B');
  await act(async () => resolveCreate(createdQuestion));

  expect(view.getByPlaceholderText('선택지 A')).toHaveProp('value', '새로운 A');
  expect(view.getByPlaceholderText('선택지 B')).toHaveProp('value', '새로운 B');
  expect(
    view.queryByText('질문이 등록되었어요. 실제 사용자에게 테스트 노출을 시작합니다.'),
  ).toBeNull();
});

test('exposes category and visibility radio state to assistive technology', async () => {
  const view = await render(
    <AskScreen repository={createRepository()} userId="guest-accessibility" />,
  );
  expect(view.getByLabelText('카테고리 선택')).toHaveProp('accessibilityRole', 'radiogroup');
  expect(view.getByRole('radio', { name: '일상' })).toHaveProp(
    'accessibilityState', { checked: true, disabled: false },
  );
  expect(view.getByLabelText('공개 방식')).toHaveProp('accessibilityRole', 'radiogroup');
  const publicRadio = view.getByRole('radio', { name: '전체 공개' });
  const linkRadio = view.getByRole('radio', { name: '링크로만 공개' });
  expect(publicRadio).toHaveProp('accessibilityState', { checked: true, disabled: false });
  expect(linkRadio).toHaveProp('accessibilityState', { checked: false, disabled: false });

  await fireEvent.press(linkRadio);
  expect(publicRadio).toHaveProp('accessibilityState', { checked: false, disabled: false });
  expect(linkRadio).toHaveProp('accessibilityState', { checked: true, disabled: false });
});

test('accepts only one create request from rapid submit presses', async () => {
  let resolveCreate!: (question: Question) => void;
  const repository = createRepository(
    jest.fn(
      () =>
        new Promise<Question>((resolve) => {
          resolveCreate = resolve;
        }),
    ),
  );
  const view = await render(<AskScreen repository={repository} userId="guest-rapid" />);

  await fireEvent.changeText(view.getByPlaceholderText('선택지 A'), '바다');
  await fireEvent.changeText(view.getByPlaceholderText('선택지 B'), '산');
  const submit = view.getByRole('button', { name: '게시하기' });
  await fireEvent.press(submit);
  await fireEvent.press(submit);

  expect(repository.create).toHaveBeenCalledTimes(1);
  await act(async () => resolveCreate(createdQuestion));
});
