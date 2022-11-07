const getUserByEmail = function (email, database) {
  for (let id in database) {
    if (database[id].email === email) {
      return database[id]
    }
  }
};

const generateRandomString = function () {
  let output = ''
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charLength = char.length
  for (let i = 0; i < 6; i++) {
    output += char.charAt(Math.floor(Math.random() * charLength))
  }
  return output
};

module.exports = { getUserByEmail, generateRandomString }