const { ApolloServer, gql, PubSub } = require('apollo-server');
const depthLimit = require('./limiter');

const typeDefs = gql`
  type Query {
    hello(name: String): String!
    user: User
  }

  type User {
    id: ID!
    username: String
    firstLetterOfUsername: FirstLetterOfUsername
  }

  type FirstLetterOfUsername {
    firstLetterOfUsername: String!
    secondLetterOfUsername: String!
  }

  type Error {
    field: String!
    message: String!
  }

  type RegisterResponse {
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
    register(userInfo: UserInfo!): RegisterResponse!
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
  FirstLetterOfUsername: {
    firstLetterOfUsername: (parent) => {
      return parent.username[0];
    },
    secondLetterOfUsername: (parent) => {
      return parent.username[1];
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
    user: () => (
      {
        id: 1,
        username: 'tom',
      },
      {
        id: 2,
        username: 'Jimmy',
      }
    ),
  },
  Mutation: {
    login: async (parent, { userInfo: { username } }, context) => {
      // context.res.cookie('')
      //check the password
      //await checkPassword(password)
      console.log(context);
      return username;
    },
    register: (_, { userInfo: { username } }) => {
      const user = {
        id: 1,
        username,
      };

      // pubsub.publish(NEW_USER, {
      //   newUser: user,
      // });
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
  validationRules: [depthLimit(1)],
  context: ({ req, res }) => ({ req, res }),
});

server.listen().then(({ url }) => console.log(`server started at ${url}`));
