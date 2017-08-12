/**
 * @file Main entry point
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

/**
 * Apollo offline toolkit using redux-offline
 * @module apollo-offline
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

import enhancer from './enhancer';
import OfflineNetworkInterface, { NetworkInterface } from './transport';

// Reexport to include in generated type definitions
import { Config } from 'redux-offline';
export { Config as EnhancerConfig };

/** Create toolkit from original network interface */
export default (
  networkInterface: NetworkInterface,
  rehydratedKey?: string,
) => {
  const offlineNetworkInterface = new OfflineNetworkInterface(networkInterface);

  return {
    enhancer: enhancer(offlineNetworkInterface, rehydratedKey),
    networkInterface: offlineNetworkInterface,
  };
};
