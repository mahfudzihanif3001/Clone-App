import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getItemAsync } from "expo-secure-store";

const httpLink = new HttpLink({
  // uri: "https://mc9pfpq1-3000.asse.devtunnels.ms/",
  uri: "https://mcd.iniwebhanif.web.id/",
});

const authLink = setContext(async (_, { headers }) => {
  const token = await getItemAsync("accessToken");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
