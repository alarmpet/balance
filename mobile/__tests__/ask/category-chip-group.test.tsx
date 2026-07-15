import { fireEvent, render } from '@testing-library/react-native';

import { CategoryChipGroup } from '@/src/features/ask/ui/CategoryChipGroup';

test('category chips expose one checked option and update selection', async () => {
  const onChange = jest.fn();
  const view = await render(
    <CategoryChipGroup
      value="일상"
      options={['일상', '회사', '관계', '여행', '돈', '성장']}
      onChange={onChange}
    />,
  );

  expect(view.getByLabelText('카테고리 선택')).toHaveProp('accessibilityRole', 'radiogroup');
  expect(view.getByRole('radio', { name: '일상' })).toHaveProp('accessibilityState', {
    checked: true,
    disabled: false,
  });
  await fireEvent.press(view.getByRole('radio', { name: '회사' }));
  expect(onChange).toHaveBeenCalledWith('회사');
});

test('disabled category chips do not change the value', async () => {
  const onChange = jest.fn();
  const view = await render(
    <CategoryChipGroup
      disabled
      value="관계"
      options={['일상', '회사', '관계']}
      onChange={onChange}
    />,
  );

  const company = view.getByRole('radio', { name: '회사' });
  expect(company).toBeDisabled();
  await fireEvent.press(company);
  expect(onChange).not.toHaveBeenCalled();
});
