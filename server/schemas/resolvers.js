import bookSchema from "../models/Book";

const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("savedBooks");

        return userData;
      }

      throw new AuthenticationError("Not Logged In");
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { input }, context) => {
        if (context.user) {
            const updatedBooks = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $push: { savedBooks: input }},
                { new: true, runValidators: true }
            ).populate('savedBooks');
            
            return updatedBooks;
        }

        throw new AuthenticationError("Not Logged In!");

    },
    deleteBook: async (parent, { bookId }, context) => {
        if (context.user) {
            const updatedBooks = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId: bookId } }},
                { new: true }
            ).populate('savedBooks');

            return updatedBooks;
        }

        throw new AuthenticationError("Not Logged In!");

    }

  },
};

export default resolvers;
//   async saveBook({ user, body }, res) {
//     console.log(user);
//     try {
//       const updatedUser = await User.findOneAndUpdate(
//         { _id: user._id },
//         { $addToSet: { savedBooks: body } },
//         { new: true, runValidators: true }
//       );
//       return res.json(updatedUser);
//     } catch (err) {
//       console.log(err);
//       return res.status(400).json(err);
//     }
//   },
//   // remove a book from `savedBooks`
//   async deleteBook({ user, params }, res) {
//     const updatedUser = await User.findOneAndUpdate(
//       { _id: user._id },
//       { $pull: { savedBooks: { bookId: params.bookId } } },
//       { new: true }
//     );
//     if (!updatedUser) {
//       return res.status(404).json({ message: "Couldn't find user with this id!" });
//     }
//     return res.json(updatedUser);
//   },
// };
