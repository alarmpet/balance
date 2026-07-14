import { colors } from '@/src/design/tokens';

test('defines semantic soft surfaces used by balance cards', () => {
  expect(colors).toMatchObject({
    primarySoft: '#F0ECFF',
    optionASoft: '#EAF2FF',
    optionBSoft: '#FFF0F4',
    insightSoft: '#F5F2FF',
  });
});

