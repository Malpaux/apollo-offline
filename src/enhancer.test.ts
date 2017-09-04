/**
 * @file Enhancer test suite
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

jest.mock('redux-offline', () => ({
  offline: jest.fn((): any => (createStore: any) => (
      reducer: any,
      preloadedState: any,
      _enhancer: any = (x: any) => x,
    ) => createStore(reducer, preloadedState, _enhancer)),
}));

import { offline } from 'redux-offline';
import config from 'redux-offline/lib/defaults';
import { createMockStore, MockOfflineNetworkInterface } from './__mocks__';
import { APOLLO_OFFLINE_QUEUE, REHYDRATE_STORE } from './constants';

import enhancer from './enhancer';

describe('store enhancer', () => {
  it('create a new store enhancer', () => {
    const store = enhancer(new MockOfflineNetworkInterface())(config)(createMockStore)((x) => x);

    expect(offline).toHaveBeenCalledTimes(1);
    expect((store as any)._reducer(undefined, { type: 'SOME_ACTION_TYPE' })).toEqual({
      rehydrated: false,
    });

    const store2 = enhancer(new MockOfflineNetworkInterface())({
      ...config,
      persistCallback: () => {/**/},
      persistOptions: {
        blacklist: ['key'],
      },
    })(createMockStore)(
      () => ({ reducer: true }),
      {},
      (x: any) => x,
    );

    expect(offline).toHaveBeenCalledTimes(2);
    expect((store2 as any)._reducer({ rehydrated: false }, { type: 'SOME_ACTION_TYPE' })).toEqual({
      reducer: true,
      rehydrated: false,
    });
  });

  it('should work', async () => {
    jest.clearAllMocks();

    const networkInterface = new MockOfflineNetworkInterface();
    const response = { data: {} };
    (networkInterface.networkInterface.query as any)
      .mockImplementation(() => Promise.resolve(response));

    const effect = jest.fn();
    const persistCallback = jest.fn();

    const store = enhancer(networkInterface)({
      ...config,
      effect,
      persistCallback,
    })(createMockStore)((x) => x);

    const request = {};
    const callback = jest.fn();
    const args = { callback, request };

    const { effect: _effect, persistCallback: _persistCallback } =
      (offline as any).mock.calls[0][0];

    // Test executing a queued request
    await _effect(args, { type: APOLLO_OFFLINE_QUEUE });
    expect(networkInterface.networkInterface.query).toHaveBeenCalledTimes(1);
    expect(networkInterface.networkInterface.query).toHaveBeenCalledWith(request);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(response);

    // Test executing a queued request w/ invalid callback
    jest.clearAllMocks();
    await _effect({ callback: 'function', request }, { type: APOLLO_OFFLINE_QUEUE });
    expect(networkInterface.networkInterface.query).toHaveBeenCalledTimes(1);
    expect(networkInterface.networkInterface.query).toHaveBeenCalledWith(request);

    // Test handling an unknown action
    jest.clearAllMocks();
    const action = { type: 'SOME_ACTION_TYPE' };
    await _effect(args, action);
    expect(networkInterface.networkInterface.query).toHaveBeenCalledTimes(0);
    expect(callback).toHaveBeenCalledTimes(0);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledWith(args, action);

    // Test persist callback
    jest.clearAllMocks();
    _persistCallback();
    expect(store._actions[0]).toEqual({ type: REHYDRATE_STORE });
    expect(persistCallback).toHaveBeenCalledTimes(1);
  });
});
