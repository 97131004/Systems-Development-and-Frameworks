/* eslint no-console: 0 */

import Vue from "vue";
import App from "./App.vue";
import VueApollo from "vue-apollo";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { onError } from "apollo-link-error";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { Settings, Key } from "./settings.js";

const authMiddleware = new ApolloLink((operation, forward) => {
  const token = Settings.get(Key.AuthToken);
  operation.setContext({
    headers: {
      authorization: token ? `${token}` : null
    }
  });
  return forward(operation);
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
    if (networkError.statusCode === 401) {
      Settings.set(Key.AuthToken, null);
    }
  }
});

const httpLink = createHttpLink({
  uri: "http://localhost:4000/"
});

const apolloClient = new ApolloClient({
  link: authMiddleware.concat(httpLink, errorLink),
  cache: new InMemoryCache(),
  connectToDevTools: true
});

Vue.use(VueApollo);

const apolloProvider = new VueApollo({
  defaultClient: apolloClient
});

new Vue({
  el: "#app",
  apolloProvider,
  render: instance => instance(App)
});