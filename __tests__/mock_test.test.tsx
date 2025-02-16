import { add } from '@/utils/mock_test';

describe('add test', () => {
  test('Should add to 5', () => {
    expect(add(2, 3)).toEqual(5);
  });
});