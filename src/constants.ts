/**
 * Constants
 * @module apollo-offline/constants
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

/** Action type to queue a request */
export const APOLLO_OFFLINE_QUEUE = 'APOLLO_OFFLINE_QUEUE';
/** Action type dispatched after successful commit */
export const APOLLO_OFFLINE_COMMIT = 'APOLLO_OFFLINE_COMMIT';
/** Action type dispatched after failed commit (no more retries) */
export const APOLLO_OFFLINE_ROLLBACK = 'APOLLO_OFFLINE_ROLLBACK';
/** Action type dispatched after successful store rehydration */
export const REHYDRATE_STORE = 'REHYDRATE_STORE';
