const express = require("express");
const { url } = require("inspector");
const cookieParser = require('cookie-parser')
const { stripVTControlCharacters } = require("util");
const { urlencoded } = require("express");
const { request } = require("http");
const app = express()
const PORT = 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "test123!"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

const userIdByEmailIndex = {
  'user@example.com': 'aJ48lW',
  'user2@example.com': 'user2RandomID'
}

//HELPER FUNCTIONS
const createNewUser = function (newUser) {
  users[newUser.id] = newUser
  userIdByEmailIndex[newUser.email] = newUser.id
}

const getUserByEmail = function (email) {
  const userId = userIdByEmailIndex[email]
  return users[userId]
}

const urlsForUser = function (userId) {
  const urls = {}
  const ids = Object.keys(urlDatabase) //shortURls
  for (let id of ids) { //objects of shortURLs
    const url = urlDatabase[id] //
    if (userId === url.userID) {
      urls[id] = url
    }
  }
  return urls
}

const generateRandomString = function () {
  let output = ''
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charLength = char.length
  for (let i = 0; i < 6; i++) {
    output += char.charAt(Math.floor(Math.random() * charLength))
  }
  return output
}

app.get("/", (req, res) => {
  res.send("Hello!")
})

app.get("/urls.json"), (req, res) => {
  res.json(urlDatabase)
}

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello<b>World</b></body></html>\n")
})

//BROWSE
app.get("/login", (req, res) => {
  for (let key in users) {
    const user = users[key]
    if (user.id === req.cookies['user_id']) {
      return res.redirect("/urls")
    }
  }
  res.render("urls_login", { user: null })
})

//BROWSE
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"]
  if (userId === undefined) {
    res.send("<html><body>You need to log in!</body></html>\n");
  }
  const urls = urlsForUser(userId)
  const templateVars = { urls, user: users[userId] }; //urlDatabase above becomes urls in urls_index.js
  res.render("urls_index", templateVars);
});

//READ
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  for (let key in users) {
    const user = users[key]
    if (user.id !== req.cookies['user_id']) {
      return res.redirect("/login")
    } else {
      res.render("urls_new", templateVars);
    }
  }
});

//READ
app.get("/register", (req, res) => {
  for (let key in users) {
    const user = users[key]
    if (user.id === req.cookies['user_id']) {
      return res.redirect("/urls")
    }
  }
  const templateVars = { user: users[req.cookies["user_id"]] }
  // const templateVars = { user: false }
  res.render("urls_registration", templateVars)
})

//READ

app.get(`/u/:id`, (req, res) => {
  const longURL = urlDatabase[req.params.id]
  if (longURL === undefined) {
    res.send("<html><body>The url does not exist!</body></html>\n");
  }
  if (longURL) {
    res.redirect(longURL.longURL);
  } else {
    redirect("/urls")
  }
});

//READ
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies['user_id']
  if (userId === undefined) { //if they are not logged in
    res.status(403).send("403: Not Found")
  }
  const urlsForUserByUrlId = urlsForUser(userId)
  const url = urlsForUserByUrlId[req.params.id]
  if (url === undefined) {
    res.status(403).send("403: Not Found")
    return
  }

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

//EDIT
//add an id, email, and password to users object
app.post("/register", (req, res) => {
  const newUserID = generateRandomString()
  const newEmail = req.body.email
  const existingUser = getUserByEmail(newEmail) //helper function
  const newPassword = req.body.password
  let user = { id: newUserID, email: newEmail, password: newPassword }
  if (newEmail === "" || newPassword === "") {
    res.status(400).send("400: Not Found")
    return
  }
  if (existingUser !== undefined) {
    res.status(400).send("400: Not Found")
    return
  }
  createNewUser(user) //helper function
  //lookup the specific user object in the users object using the user_id cookie value
  res.cookie('user_id', newUserID)
  res.redirect('/urls')
})

//EDIT
app.post("/urls/:id", (req, res) => {
  //update the value of the stored
  //long URL based on the value of the new body
  //need to update an existing longURL
  const userId = req.cookies['user_id']
  if (userId !== users[req.params.id]) {
    res.send("<html><body>Only the owner of the URL can edit!</body></html>\n");
  }
  const existingURL = req.params.id
  urlDatabase[existingURL] = req.body
  res.redirect('/urls')
})

//DELETE
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies['user_id']
  if (userId !== users[req.params.id]) {
    res.send("<html><body>Only the owner of the URL can delete!</body></html>\n");
  }
  delete urlDatabase[req.params.id] //deletes the respective URL
  res.redirect("/urls") //with the redirect to original page it looks like all we did was remove it
})

//ADD
app.post("/urls", (req, res) => {
  if (req.cookies['user_id'] === undefined) {
    res.send("<html><body>You need to log in!</body></html>\n");
  }
  const newShortURL = generateRandomString() //urlDatabase[newShortURL] = newLongURL
  const newLongURL = req.body //what the user inputs into the text field
  urlDatabase[newShortURL] = newLongURL
  res.redirect(`/urls`)
  res.send(newShortURL);
});

//COOKIES

app.post("/login", (req, res) => {
  const email = req.body.email
  const user = getUserByEmail(email)
  const password = req.body.password
  if (user === undefined) {
    res.status(403).send("403: Not Found")
    return
  } else if (user.email === email && user.password !== password) {
    res.status(403).send("403: Not Found")
    return
  } else {
    res.cookie('user_id', user.id)
    //res.cookie has 2 parameters, name and value
    res.redirect("/urls")
  }
})

//COOKIES

app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect("/login")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})

