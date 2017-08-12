/**
 * Reduce rehydrated flag
 * @module apollo-offline/transport
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

import { REHYDRATE_STORE } from './constants';

/** Reduce rehydrated flag */
export default (state = false, action: { type: string }) => {
  if (action.type === REHYDRATE_STORE) return true;
  return state;
};
