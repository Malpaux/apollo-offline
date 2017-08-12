/**
 * @file Entry point test suite
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

/**
 * Important: This test also serves as a point to
 * import the entire lib for coverage reporting
 */

import { MockNetworkInterface } from './__mocks__';

import offline, * as lib from './';

describe('entry point', () => {
  it('should have exports', () => {
    expect(lib).toBeTruthy();
    expect(Object.keys(lib).length).not.toBe(0);
  });

  // Disabled because typescript type exports appear as undefined while testing
  xit('should not have undefined exports', () => {
    Object.keys(lib).forEach((key) => {
      expect((lib as { [key: string]: any })[key]).toBeTruthy();
    });
  });
});

describe('toolkit factory', () => {
  it('should create a new offline toolkit', () => {
    const toolkit = offline(new MockNetworkInterface());
    expect(typeof toolkit.enhancer).toBe('function');
    expect(typeof toolkit.networkInterface.query).toBe('function');

    const toolkit2 = offline(new MockNetworkInterface(), 'rehydrate');
    expect(typeof toolkit2.enhancer).toBe('function');
    expect(typeof toolkit2.networkInterface.query).toBe('function');
  });
});
