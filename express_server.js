const cookieSession = require('cookie-session')
const express = require("express");
const { url } = require("inspector");
const cookieParser = require('cookie-parser')
const { stripVTControlCharacters } = require("util");
const { urlencoded } = require("express");
const { request } = require("http");
const bcrypt = require("bcryptjs");
const app = express()
const PORT = 8080

const { getUserByEmail, generateRandomString } = require("./helpers.js")
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(cookieSession({
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}))
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
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "test123!"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

const urlsForUser = function (userId) {
  const urls = {}
  const ids = Object.keys(urlDatabase) //shortURls
  for (let id of ids) { //objects of shortURLs
    const url = urlDatabase[id]
    if (userId === url.userID) {
      urls[id] = url
    }
  }
  return urls
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
    if (user.id === req.session.user_id
    ) {
      return res.redirect("/urls")
    }
  }
  res.render("urls_login", { user: null })
})

//BROWSE
app.get("/urls", (req, res) => {
  const userId = req.session.user_id

  if (userId === undefined) {
    res.send("<html><body>User undefined</body></html>\n");
  }
  const urls = urlsForUser(userId)
  const templateVars = { urls, user: users[userId] }; //urlDatabase above becomes urls in urls_index.js
  res.render("urls_index", templateVars);
});

//READ
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id
  if (!userId) {
    return res.redirect("/login")
  }
  const templateVars = {
    user: users[req.session.user_id]
  }
  res.render("urls_new", templateVars);
});

//READ
app.get("/register", (req, res) => {
  for (let key in users) {
    const user = users[key]
    if (user.id === req.session.user_id
    ) {
      return res.redirect("/urls")
    }
  }
  const templateVars = {
    user: null
  }
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
  const userId = req.session.user_id

  if (userId === undefined) { //if they are not logged in
    res.status(403).send("403: Not Logged In")
  }
  const urlsForUserByUrlId = urlsForUser(userId)
  const url = urlsForUserByUrlId[req.params.id]
  if (url === undefined) {
    res.status(403).send("403: Not Found")
    return
  }

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[userId] };
  res.render("urls_show", templateVars);
});

//REGISTER
//add an id, email, and password to users object
app.post("/register", (req, res) => {
  const newUserID = generateRandomString()
  const newEmail = req.body.email//helper function
  const existingUser = getUserByEmail(newEmail, users)
  const newPassword = req.body.password
  const hashedPassword = bcrypt.hashSync(newPassword, 10)
  let user = { id: newUserID, email: newEmail, password: hashedPassword }
  if (newEmail === "" || hashedPassword === "") {
    res.status(400).send("400: Please do not leave fields blank")
    return
  }
  if (existingUser !== undefined) {
    res.status(400).send("400: Not Found")
    return
  }
  req.session.user_id = newUserID
  users[newUserID] = user //helper function
  //lookup the specific user object in the users object using the user_id cookie value
  res.redirect('/urls')
})

//EDIT
app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id

  if (users[req.session.user_id] && userId !== users[req.session.user_id].id) {
    res.send("<html><body>Only the owner of the URL can edit!</body></html>\n");
  }
  // make the value of existing url to new short URL
  const existingURL = req.params.id
  const newShortURL = req.body.shortURL
  const existingURLObj = urlDatabase[existingURL]
  urlDatabase[newShortURL] = { ...existingURLObj };
  delete urlDatabase[existingURL];
  res.redirect('/urls')
})

//DELETE
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id
  if (users[req.session.user_id] && userId !== users[req.session.user_id].id) {
    res.send("<html><body>Only the owner of the URL can delete!</body></html>\n");
  }
  delete urlDatabase[req.params.id] //deletes the respective URL
  res.redirect("/urls") //with the redirect to original page it looks like all we did was remove it
})

//ADD A URL IN CREATE NEW URL
app.post("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.send("<html><body>User undefined</body></html>\n");
  }
  const newShortURL = generateRandomString()
  const longURL = req.body.longURL //what the user inputs into the text field

  urlDatabase[newShortURL] = { longURL, userID: req.session.user_id }

  res.redirect(`/urls/${newShortURL}`)
});

//COOKIES

app.post("/login", (req, res) => {
  const email = req.body.email
  const user = getUserByEmail(email, users)
  const password = req.body.password
  if (user === undefined) {
    res.status(403).send("403: Email Not Found")
    return
  }
  const hashedPasswordTrue = bcrypt.compareSync(password, user.password);
  //compare to user.password since it was registered as hash
  if (!hashedPasswordTrue) {
    res.status(403).send("403: Incorrect Password")
    return
  } else {
    req.session.user_id = user.id
    res.redirect("/urls")
  }
})

//COOKIES

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/login")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})
