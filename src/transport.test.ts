/**
 * @file Apollo offline network interface test suite
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

jest.mock('apollo-client');

import { ApolloClient } from 'apollo-client';
import { createMockStore, MockNetworkInterface } from './__mocks__';
import { APOLLO_OFFLINE_COMMIT, APOLLO_OFFLINE_QUEUE, APOLLO_OFFLINE_ROLLBACK } from './constants';

import OfflineNetworkInterface from './transport';

describe('offline network interface', () => {
  it('should create a new offline network interface', () => {
    expect(new OfflineNetworkInterface(new MockNetworkInterface()));
  });

  it('should send a request', async () => {
    const mockNetworkInterface = new MockNetworkInterface();
    const networkInterface = new OfflineNetworkInterface(mockNetworkInterface);

    const request = {
      operationName: 'SomeQuery',
      query: {} as any,
    };

    // Test fallback when no store is available
    const response = { data: {} };
    (mockNetworkInterface.query as any).mockImplementation(() => Promise.resolve(response));

    expect(await networkInterface.query(request)).toBe(response);
    expect(mockNetworkInterface.query).toHaveBeenCalledTimes(1);
    expect(mockNetworkInterface.query).toHaveBeenCalledWith(request);

    // Test queueing
    jest.clearAllMocks();

    const store = createMockStore();
    networkInterface.store = store;
    const promise = networkInterface.query(request);
    expect(store._actions.length).toBe(1);
    expect(store._actions[0].meta.offline.effect.request).toBe(request);

    const response2 = { data: {} };
    store._actions[0].meta.offline.effect.callback(response2);

    delete store._actions[0].meta.offline.effect;
    expect(store._actions[0]).toEqual({
      meta: {
        offline: {
          commit: { type: APOLLO_OFFLINE_COMMIT, meta: { request } },
          rollback: { type: APOLLO_OFFLINE_ROLLBACK, meta: { request } },
        },
      },
      type: APOLLO_OFFLINE_QUEUE,
    });

    expect(await promise).toBe(response2);
    expect(mockNetworkInterface.query).toHaveBeenCalledTimes(0);

    // Test optimistic response on queries
    jest.clearAllMocks();

    const client = new ApolloClient();
    const request2 = {
      operationName: 'SomeQuery',
      query: {} as any,
      variables: { __offline__: true },
    };

    const response3 = {};
    (client.readQuery as any).mockImplementation(() => response3);

    expect(((await networkInterface.setClient(client).query(request2)) as any).data)
      .toBe(response3);
    expect(client.readQuery).toHaveBeenCalledTimes(1);
    expect(client.writeQuery).toHaveBeenCalledTimes(1);
    expect(mockNetworkInterface.query).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();

    // Test error handling while writing query (optimistic query response)
    (client.writeQuery as any).mockImplementation(() => { throw new Error(); });

    expect(((await networkInterface.setClient(client).query(request2)) as any).data)
      .toBe(response3);
    expect(client.readQuery).toHaveBeenCalledTimes(1);
    expect(client.writeQuery).toHaveBeenCalledTimes(1);
    expect(mockNetworkInterface.query).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();

    // Test fallback when reading query from cache fails
    (client.readQuery as any).mockImplementation(() => { throw new Error(); });
    (client.writeQuery as any).mockReset();

    expect(await networkInterface.setClient(client).query(request2)).toBe(response);
    expect(client.readQuery).toHaveBeenCalledTimes(1);
    expect(client.writeQuery).toHaveBeenCalledTimes(0);
    expect(mockNetworkInterface.query).toHaveBeenCalledTimes(1);
  });

  it('should set the apollo client', () => {
    const networkInterface = new OfflineNetworkInterface(new MockNetworkInterface());
    const client = new ApolloClient();

    expect(networkInterface.client).toBe(undefined);
    expect(networkInterface.setClient(client)).toBe(networkInterface);
    expect(networkInterface.client).toBe(client);
  });

  it('should apply middle- & afterware', () => {
    const mockNetworkInterface = new MockNetworkInterface();
    const networkInterface = new OfflineNetworkInterface(mockNetworkInterface);
    const middleware = [() => {/**/}];
    const afterware = [() => {/**/}];

    expect(networkInterface.use(middleware)).toBe(networkInterface);
    expect(mockNetworkInterface.use).toHaveBeenCalledTimes(1);
    expect(mockNetworkInterface.use).toHaveBeenCalledWith(middleware);

    expect(networkInterface.useAfter(afterware)).toBe(networkInterface);
    expect(mockNetworkInterface.useAfter).toHaveBeenCalledTimes(1);
    expect(mockNetworkInterface.useAfter).toHaveBeenCalledWith(afterware);
  });
});
