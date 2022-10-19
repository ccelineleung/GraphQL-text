const { ApolloServer, gql, PubSub } = require('apollo-server');
const depthLimit = require('./limiter');

const typeDefs = gql`
  type Query {
    hello(name: String): String!
    user: User
  }

  type User {
    id: ID!
    username: String!
    firstLetterOfUsername: String!
  }

  type Error {
    field: String!
    message: String!
  }

  type registerResponse {
    errors: [Error!]!
    user: User
  }
  #   //create update delete
  #   type Mutation {
  #     register: User
  #   }

  input UserInfo {
    username: String!
    password: String!
    age: Int
  }
  type Mutation {
    register(userInfo: UserInfo!): registerResponse!
    login(userInfo: UserInfo!): String!
  }

  #   type Subscription {
  #     newUser: User!
  #   }
`;

// const NEW_USER = 'NEW_USER';

const resolvers = {
  //   Subscription: {
  //     newUser: {
  //       subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(NEW_USER),
  //     },
  //   },
  User: {
    firstLetterOfUsername: (parent) => {
      return parent.username[0];
    },
    // username: (parent) => {
    //   // console.log(parent);
    //   return parent.username;
    // },
  },
  Query: {
    hello: (parent, { name }) => {
      return `hey ${name}`;
    },
    user: () => ({
      id: 1,
      username: 'tom',
    }),
  },
  Mutation: {
    login: async (parent, { userInfo: { username } }, context, info) => {
      // context.res.cookie('')
      //check the password
      //await checkPassword(password)
      console.log(context);
      return username;
    },
    register: (_, { userInfo: { username } }, { pubsub }) => {
      const user = {
        id: 1,
        username,
      };

      pubsub.publish(NEW_USER, {
        newUser: user,
      });
      return {
        errors: [
          {
            field: 'username',
            message: 'bad',
          },
          {
            field: 'username2',
            message: 'bad2',
          },
        ],
        user,
      };
    },
  },
};

// const pubsub = new PubSub();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(2)],
  context: ({ req, res }) => ({ req, res }),
});

server.listen().then(({ url }) => console.log(`server started at ${url}`));
