import { ApolloClient } from 'apollo-client';
import { Store } from 'redux';

export const createMockStore = <T = any>(reducer?: (state: T, action: any) => T) => {
  const _actions: any[] = [];

  return { // tslint:disable-line no-object-literal-type-assertion
    _actions,
    _reducer: reducer,
    dispatch: jest.fn((action: any) => { _actions.push(action); }),
    getState: jest.fn(),
    replaceReducer: jest.fn(),
    subscribe: jest.fn(),
  };
};

// tslint:disable max-classes-per-file

export class MockNetworkInterface {
  public query = jest.fn(() =>
    Promise.resolve({ data: {}, errors: [] }),
  );

  public use = jest.fn(() => this);
  public useAfter = jest.fn(() => this);
}

export class MockOfflineNetworkInterface extends MockNetworkInterface {
  public setClient = jest.fn((client: ApolloClient) => {
    this.client = client;
    return this;
  });

  constructor(
    /** The actual network interface */
    public networkInterface = new MockNetworkInterface(),
    /** The redux store redux-offline is hooked up to */
    public store?: Store<any>,
    /** The apollo client (used for cache access) */
    public client?: ApolloClient,
  ) { super(); }
}

// tslint:enable
