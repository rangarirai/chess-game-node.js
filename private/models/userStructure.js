const userSchemaFields = {
  username: String,
  password: String,
  paypalAddress: String,
  deposit: Number,
  withdraw: Number,
  room: String,
  transactions: [],
  color: String,
  searching: Boolean,
  playing: Boolean,
  opponent: String,
  gameId: String,
};
const userDefaultFields = {
  username: "",
  password: "",
  paypalAddress: "",
  deposit: 0,
  withdraw: 0,
  room: "five",
  transactions: [],
  color: "",
  searching: false,
  playing: false,
  opponent: null,
  gameId: null,
};
exports.userSchemaFields = userSchemaFields;
exports.userDefaultFields = userDefaultFields;
