# Offline toolkit for Apollo

[![wercker status](https://app.wercker.com/status/49f7bc2d8750d6799ca861e12897208f/s/master "wercker status")](https://app.wercker.com/project/byKey/49f7bc2d8750d6799ca861e12897208f)

Apollo-Offline provides a custom network interface and Redux store enhancer that enable seamless offline-first app development using the Apollo GraphQL client.

Apollo-Offline is built on top [Redux-Offline](https://github.com/jevakallio/redux-offline) (and thus inherits all of is features).

## Install

using [yarn](https://yarnpkg.com/en/)
```shell
yarn add apollo-offline
```

or npm
```shell
npm install --save apollo-offline
```

Apollo-Offline additionally requires you to have the following peer dependencies installed:
- ```apollo-client```
- ```redux```
- ```redux-offline```

## Usage
Apollo-Offline aims to make use of Apollo's existing offline(-ish) features (e.g. built-in caching and optimistic responses for mutations). This means when migrating, your code won't have to change a lot (as long as you are already using these features).

> With Apollo-Offline, the code of your queries and mutations looks exactly like it would without.

However, there is one exception: The *"optimistic fetch"* feature.  
What this does is it tries to first read a query's response from the cache, but if (and only if!) a network connection is available will get the server's response in the background and write it to the cache (at this point e.g. wrapped React components will update a second time).

Basically this means your UI's queries will always work if the requested data is available in the local cache and it will always keep the cached data consistent with your server data if it can be reached.

*Note: In my opinion, this is what ```fetchPolicy: 'cache-and-network'``` should do (but doesn't - it errors if the server can't be reached).*

For instructions on how to use it, see the examples below.

### Examples

#### Setup
```javascript
import { ApolloClient, createNetworkInterface } from 'apollo-client';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import config from 'redux-offline/lib/defaults';

import offline from 'apollo-offline';

// 1. Wrap your network interface
const { enhancer, networkInterface } = offline(
  createNetworkInterface({
    uri: `http://localhost`,
  }),
);

// 2. Create your Apollo client
const client = new ApolloClient({
  /* Your Apollo configuration here... */
  networkInterface,
});

// 3. Pass the client to the offline network interface
// (Optional, but needed for the optimistic fetch feature)
networkInterface.setClient(client);

// 4. Create your redux store
export const store = createStore(
  combineReducers({
    apollo: client.reducer(),
  }),
  undefined,
  compose(
    applyMiddleware(client.middleware()),

    // Apply offline store enhancer
    // (You can pass your own redux-offline config, but the default one is a good starting point)
    enhancer(config),
  ),
);
```

#### Vanilla JS
```javascript
/* Setup here... */

// Queries
client.query({ query: /* Your query here */ });

// - Using optimistic fetch feature
client.query({
  fetchPolicy: 'network-only',
  query: /* Your query here */,
  variables: {
    __offline__: true,
  },
});

// Mutations
client.mutate({
  mutation: /* Your mutation here */,
  optimisticResponse: /* Your optimistic response here */,
  update: /* Your update resolver here */,
});
```

#### React
In your entry point:

```javascript
/* Setup here... */

import { ApolloProvider } from 'react-apollo';
import { connect } from 'react-redux';

import App from './App'; // Your main application component

// Component to postpone render until after Redux state has been rehydrated
const Rehydrated = connect(({ rehydrated }) => ({ rehydrated }))
  ((props) => props.rehydrated ? props.children : props.loading);

ReactDOM.render(
  <ApolloProvider client={client} store={store}>
    <Rehydrate>
      <App />
    </Rehydrate>
  </ApolloProvider>,
  document.getElementById('root'),
);
```

When wrapping your components:
```javascript
import React from 'react';
import { graphql } from 'react-apollo';

// Queries
const wrappedComponent = graphql(/* Your query here */)(/* Your component here */);

// - Using optimistic fetch feature
const wrappedComponent = graphql(
  /* Your query here */,
  {
    options: {
      fetchPolicy: 'network-only',
      variables: {
        __offline__: true,
      },
    },
  },
)(/* Your component here */);

// Mutations (you will want to provide an optimistic response when executing them)
const wrappedComponent = graphql(
  /* Your mutation here */,
  {
    options: {
      update: /* You update resolver here */,
    },
  },
)(/* Your component here */);
```
