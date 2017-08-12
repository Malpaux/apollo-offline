/**
 * @file Reducer test suite
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

import { REHYDRATE_STORE } from './constants';

import reducer from './reducer';

describe('rehydrated reducer', () => {
  it('should reduce the rehydrated flag', () => {
    expect(reducer(undefined, { type: 'SOME_ACTION_TYPE' })).toBe(false);
    expect(reducer(false, { type: REHYDRATE_STORE })).toBe(true);
  });
});
