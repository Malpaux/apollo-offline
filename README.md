# Offline toolkit for Apollo

[![wercker status](https://app.wercker.com/status/49f7bc2d8750d6799ca861e12897208f/s/master "wercker status")](https://app.wercker.com/project/byKey/49f7bc2d8750d6799ca861e12897208f)

Apollo-Offline provides a custom network interface and Redux store enhancer that enable seamless offline-first app development using the Apollo GraphQL client.

Apollo-Offline is built on top [Redux-Offline](https://github.com/jevakallio/redux-offline) (and thus inherits all of is features).

It aims to make use of Apollo's existing offline(-ish) features (e.g. built-in caching and optimistic responses for mutations). This means when migrating, your code won't have to change a lot (as long as you are already using these features).

> With Apollo-Offline, the code of your queries and mutations looks exactly like it would without.

There is one exception to this: The *"optimistic fetch"* feature.  

#### Optimistic Fetch
What *"optimistic fetch"* does is it tries to first read a query's response from the cache, but if (and only if!) a network connection is available will get the server's response in the background and write it to the cache (at that point e.g. wrapped React components will update a second time).

Basically this means your UI's queries will always work if the requested data is available in the local cache and it will always keep the cached data consistent with your server data if it can be reached.

*Note: In my opinion, this is what ```fetchPolicy: 'cache-and-network'``` should do (but doesn't - it errors if the server can't be reached).*

To enable it, add an ```__offline__``` field with a truthy value to the query variables of that specific query (i.e. ```variables: { __offline__: true }```).  
For further instructions, see the examples below.

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

## Usage (Examples)

### Setup
```javascript
import { ApolloClient, createNetworkInterface } from 'apollo-client';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import config from '@redux-offline/redux-offline/lib/defaults';

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

*Note: Once set up, apollo-offline intercepts all queries/mutations to enable its seamless offline-first behaviour.  
If you want to selectively exclude some queries/mutations from this, you can revert back to Apollo's default behaviour by adding an ```__online__``` field with a truthy value to the query variables of that specific query/mutation (i.e. ```variables: { __online__: true }```).*

### Vanilla JS
```javascript
/* Setup goes here... */

// Queries
client.query({ query: /* Your query here */ });

// - Using optimistic fetch feature
client.query({
  fetchPolicy: 'network-only',
  query: /* Your query here */,
  variables: {
    __offline__: true, // Enable optimistic fetch
  },
});

// Mutations
client.mutate({
  mutation: /* Your mutation here */,
  optimisticResponse: /* Your optimistic response here */,
  update: /* Your update resolver here */,
});
```

### React
In your entry point:

```javascript
/* Setup goes here... */

import { ApolloProvider } from 'react-apollo';
import { connect } from 'react-redux';

import App from './App'; // Your main application component

// Component to postpone render until after Redux state has been rehydrated
const Rehydrated = connect(({ rehydrated }) => ({ rehydrated }))
  ((props) => props.rehydrated ? props.children : props.loading);

const Loading = () => <div> Loading... </div>;

ReactDOM.render(
  <ApolloProvider client={client} store={store}>
    <Rehydrated loading={<Loading />}>
      <App />
    </Rehydrated>
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
        __offline__: true, // Enable optimistic fetch
      },
    },
  },
)(/* Your component here */);

// Mutations (you will want to provide an optimistic response when executing them)
const wrappedComponent = graphql(
  /* Your mutation here */,
  {
    options: {
      update: /* Your update resolver here */,
    },
  },
)(/* Your component here */);
```

## Developing

This is what you do after you have cloned the repository:

```shell
yarn / npm install
```

(Install dependencies)

### Linting

Execute TSLint

```shell
npm run lint
```

Try to automatically fix linting errors
```shell
npm run lint:fix
```

### Testing

Execute Jest unit tests using

```shell
npm test

npm run test:coverage
```

Tests are defined in the same directory the module lives in. They are specified in '[module].test.js' files.

### Building

To build the project, execute

```shell
npm run build
```

This saves the production ready code into 'dist/'.
