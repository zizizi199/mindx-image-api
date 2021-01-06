const UserModel = require('./user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const genToken = (userId) => {
  const token = jwt.sign(
    { userId }, // data cần mã hóa
    process.env.JWT_SECRET, // private key
    {
      expiresIn: process.env.JWT_EXPIRES_IN // thời gian tồn tại token
    }
  );
  return token;
}

const createUser = async ({ username, password }) => {
  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);

  const user = await UserModel.create({ username, password: hashPassword });
  const token = genToken(user._id)

  return { user, token };
};

const findUser = async ({ username, password }) => {
  const foundUser = await UserModel.findOne({ username }).lean();

  if (!foundUser) throw new Error('Not found user');

  const { password:foundPassword, ...restUser } = foundUser;
  // not use foundPassword === password
  const samePassword = bcrypt.compareSync(password, foundPassword);
  if (!samePassword) throw new Error('Password wrong');

  // gen token chứa thông tin cơ bản người dùng
  const token = genToken(restUser._id)

  return { user: restUser, token };
}

module.exports = {
  createUser,
  findUser
}