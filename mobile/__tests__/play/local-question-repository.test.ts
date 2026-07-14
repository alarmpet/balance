import { LocalQuestionRepository } from '@/src/features/play/data/LocalQuestionRepository';
import type {
  DistributionStage,
  Question,
  QuestionVisibility,
} from '@/src/features/play/domain/question';

function question(
  id: string,
  visibility: QuestionVisibility,
  stage: DistributionStage,
): Question {
  return {
    id,
    optionA: `${id}-A`,
    optionB: `${id}-B`,
    description: null,
    category: '일상',
    visibility,
    closesAt: null,
    isDaily: false,
    stage,
    weightsA: {},
    weightsB: {},
  };
}

test('feeds only public active and test questions', async () => {
  const repository = new LocalQuestionRepository([
    question('public-active', 'public', 'active'),
    question('public-test', 'public', 'test'),
    question('link-active', 'link', 'active'),
    question('public-pending', 'public', 'pending'),
    question('public-limited', 'public', 'limited'),
    question('public-hidden', 'public', 'hidden'),
  ]);

  const feed = await repository.getFeed({ userId: 'guest', cursor: null, limit: 20 });

  expect(feed.items.map((item) => item.id)).toEqual(['public-active', 'public-test']);
  expect(feed.nextCursor).toBeNull();
});

test('starts public creations in test while keeping link-only creations out of feed', async () => {
  const repository = new LocalQuestionRepository([]);
  const sharedInput = {
    authorId: 'guest-author',
    optionA: '집에 있기',
    optionB: '외출하기',
    description: null,
    category: '일상',
    closesAt: null,
  };

  const publicQuestion = await repository.create({
    ...sharedInput,
    visibility: 'public',
  });
  const linkQuestion = await repository.create({
    ...sharedInput,
    visibility: 'link',
  });
  const feed = await repository.getFeed({ userId: 'guest-reader', cursor: null, limit: 20 });

  expect(publicQuestion.stage).toBe('test');
  expect(linkQuestion.stage).toBe('pending');
  expect(feed.items.map((item) => item.id)).toEqual([publicQuestion.id]);
});
