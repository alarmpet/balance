import type {
  OptionWeights,
  ValueAxisId,
  VoteChoice,
} from '../../play/domain/question';

export interface BrainVote {
  questionId: string;
  choice: VoteChoice;
  weights: OptionWeights;
  category?: string;
}

export interface AxisScore {
  score: number;
  evidenceIds: string[];
}

export interface CategoryProfile {
  category: string;
  voteCount: number;
  axes: Record<ValueAxisId, AxisScore>;
  topAxes: ValueAxisId[];
}

export interface BrainSummary {
  voteCount: number;
  stage: 'awakening' | 'axes' | 'type' | 'context';
  axes: Record<ValueAxisId, AxisScore>;
  topAxes: ValueAxisId[];
  archetype: string | null;
  categoryProfiles: CategoryProfile[];
}

const AXIS_IDS: ValueAxisId[] = [
  'freedom',
  'stability',
  'relationship',
  'reality',
  'emotion',
  'growth',
  'efficiency',
  'fun',
];

const AXIS_LABELS: Record<ValueAxisId, string> = {
  freedom: '자유',
  stability: '안정',
  relationship: '관계',
  reality: '현실',
  emotion: '감성',
  growth: '성장',
  efficiency: '효율',
  fun: '재미',
};

function emptyAxes(): Record<ValueAxisId, AxisScore> {
  return {
    freedom: { score: 0, evidenceIds: [] },
    stability: { score: 0, evidenceIds: [] },
    relationship: { score: 0, evidenceIds: [] },
    reality: { score: 0, evidenceIds: [] },
    emotion: { score: 0, evidenceIds: [] },
    growth: { score: 0, evidenceIds: [] },
    efficiency: { score: 0, evidenceIds: [] },
    fun: { score: 0, evidenceIds: [] },
  };
}

function stageFor(voteCount: number): BrainSummary['stage'] {
  if (voteCount >= 50) return 'context';
  if (voteCount >= 20) return 'type';
  if (voteCount >= 10) return 'axes';
  return 'awakening';
}

export function calculateBrain(votes: BrainVote[]): BrainSummary {
  const axes = emptyAxes();
  const categories = new Map<string, { voteCount: number; axes: Record<ValueAxisId, AxisScore> }>();

  for (const vote of votes) {
    const category = vote.category?.trim() || '기타';
    const categoryProfile = categories.get(category) ?? { voteCount: 0, axes: emptyAxes() };
    categoryProfile.voteCount += 1;
    categories.set(category, categoryProfile);
    for (const axis of AXIS_IDS) {
      const weight = vote.weights[axis];
      if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
        continue;
      }
      axes[axis].score += weight;
      axes[axis].evidenceIds.push(vote.questionId);
      categoryProfile.axes[axis].score += weight;
      categoryProfile.axes[axis].evidenceIds.push(vote.questionId);
    }
  }

  const topAxes = [...AXIS_IDS].sort(
    (left, right) => axes[right].score - axes[left].score || left.localeCompare(right),
  );
  const voteCount = votes.length;
  let archetype: string | null = null;

  if (voteCount >= 20) {
    const [first, second, third] = topAxes;
    archetype =
      axes[second].score === axes[third].score
        ? '균형을 탐색하는 중'
        : `${AXIS_LABELS[first]}·${AXIS_LABELS[second]} 선택가`;
  }

  const categoryProfiles = [...categories.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, profile]) => {
      for (const axis of AXIS_IDS) {
        profile.axes[axis].score /= profile.voteCount;
      }
      const categoryTopAxes = [...AXIS_IDS].sort(
        (left, right) =>
          profile.axes[right].score - profile.axes[left].score || left.localeCompare(right),
      );
      return {
        category,
        voteCount: profile.voteCount,
        axes: profile.axes,
        topAxes: categoryTopAxes,
      };
    });

  return {
    voteCount,
    stage: stageFor(voteCount),
    axes,
    topAxes,
    archetype,
    categoryProfiles,
  };
}
