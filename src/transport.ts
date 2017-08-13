/**
 * Offline network interface for Apollo
 * @module apollo-offline/transport
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

import { ApolloClient, NetworkInterface as BasicNetworkInterface, Request } from 'apollo-client';
import { Store } from 'redux';

import { APOLLO_OFFLINE_COMMIT, APOLLO_OFFLINE_QUEUE, APOLLO_OFFLINE_ROLLBACK } from './constants';

export interface NetworkInterface extends BasicNetworkInterface {
  use(middlewares: any[]): NetworkInterface;
  useAfter(afterwares: any[]): NetworkInterface;
}

/** Offline network interface for Apollo */
export default class OfflineNetworkInterface implements NetworkInterface {
  constructor(
    /** The actual network interface */
    public networkInterface: NetworkInterface,
    /** The redux store redux-offline is hooked up to */
    public store?: Store<any>,
    /** The apollo client (used for cache access) */
    public client?: ApolloClient,
  ) {}

  /** Send a request */
  public query(request: Request) {
    return new Promise((resolve, reject) => {
      const { variables } = request;
      if (variables && (variables as { [key: string]: any }).__offline__ && this.client) {
        // __offline__ flag passed: Try using cached result & queue network fetch

        try {
          // Try to read optimistic response from cache
          resolve({ data: this.client.readQuery(request as any) });

          // Queue fetch network request
          this.networkInterface.query(request).then(({ data }) =>
            this.client && this.client.writeQuery({ ...(request as any), data }),
          ).catch(() => {/* ignore */});

          return;
        } catch (ignore) {/* fall-through */}
      } else if (this.store) {
        // Store w/ redux-offline exists -> queue request
        return this.store.dispatch({
          meta: {
            offline: {
              commit: { type: APOLLO_OFFLINE_COMMIT, meta: { request } },
              effect: {
                // Resolve returned promise once request has been comitted
                callback: resolve,
                request,
              },
              rollback: { type: APOLLO_OFFLINE_ROLLBACK, meta: { request } },
            },
          },
          type: APOLLO_OFFLINE_QUEUE,
        });
      }

      // No store passed/reading from cache failed -> fall back to standard transport
      this.networkInterface.query(request).then(resolve).catch(reject);
    });
  }

  /** Set the apollo client used for cache access */
  public setClient(client: ApolloClient): OfflineNetworkInterface {
    this.client = client;
    return this;
  }

  /** Apply middleware */
  public use(middlewares: any[]): OfflineNetworkInterface {
    this.networkInterface.use(middlewares);
    return this;
  }

  /** Apply afterware */
  public useAfter(middlewares: any[]): OfflineNetworkInterface {
    this.networkInterface.useAfter(middlewares);
    return this;
  }
}
