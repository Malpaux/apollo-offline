/**
 * Offline store enhancer
 * @module apollo-offline/enhancer
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

import { offline as reduxOffline } from '@redux-offline/redux-offline';
import { Config } from '@redux-offline/redux-offline/lib/types';
import { compose } from 'redux';

import { APOLLO_OFFLINE_QUEUE, REHYDRATE_STORE } from './constants';
import rehydrateReducer from './reducer';
import OfflineNetworkInterface from './transport';

/** Offline store enhancer */
export default (
  networkInterface: OfflineNetworkInterface,
  rehydratedKey: string = 'rehydrated',
) => (config: Config) => (createStore: any) => (
  reducer: (state: { [key: string]: any }, action: any) => { [key: string]: any },
  preloadedState?: { [key: string]: any },
  enhancer: any = (x: any) => x,
) => {
  const { persistCallback, persistOptions } = config;

  /* tslint:disable:strict-boolean-expressions */
  // Blacklist rehydrated flag
  const blacklist = persistOptions && persistOptions.blacklist ?
    persistOptions.blacklist
  : [];
  blacklist.push(rehydratedKey);
  /* tslint:enable */

  // Create enhanced redux store
  const store = createStore(
    // Add reducer for rehydrated flag
    (state: { [key: string]: any } = {}, action: any) => {
      const { [rehydratedKey]: rehydrated, ...rest } = state;

      return {
        ...reducer(rest, action),
        [rehydratedKey]: rehydrateReducer(rehydrated, action),
      };
    },
    preloadedState,
    compose(
      enhancer,
      // Add redux offline
      reduxOffline({
        ...config,
        effect: (effect, action) => {
          if (action.type === APOLLO_OFFLINE_QUEUE) {
            // Try to execute queued request
            return networkInterface.networkInterface.query(effect.request)
              .then((data) => {
                // Request successful -> resolve transport promise
                const { callback } = effect;
                if (typeof callback === 'function') callback(data);
                return data;
              });
          }

          /* tslint:disable:strict-boolean-expressions */
          // Unknown effect type
          return config && config.effect ?
            config.effect(effect, action)
          : Promise.reject('Unhandled offline effect');
          /* tslint:enable */
        },
        persistCallback: () => {
          // tslint:disable-next-line:strict-boolean-expressions
          if (persistCallback) persistCallback();

          // Store has been rehydrated
          store.dispatch({ type: REHYDRATE_STORE });
        },
        persistOptions: {
          ...persistOptions,
          blacklist,
        },
      }),
    ),
  );

  // Pass redux store to network interface
  networkInterface.store = store;
  return store;
};
