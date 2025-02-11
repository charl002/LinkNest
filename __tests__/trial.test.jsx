import { add } from '../app/page'

describe('add', () => {
    test('Should add to 5', () => {
      expect(add(2, 3)).toEqual(5);
    });
  });