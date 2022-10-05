const express = require("express");
const { url } = require("inspector");
const cookieParser = require('cookie-parser')
const { stripVTControlCharacters } = require("util");
const app = express()
const PORT = 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
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
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] }; //urlDatabase above becomes urls in urls_index.js
  res.render("urls_index", templateVars);
});

//READ
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] }
  res.render("urls_new", templateVars);
});

//READ
app.get("/urls/register", (req, res) => {
  const templateVars = { username: req.cookies["username"] }
  res.render("urls_registration", templateVars)
})

//READ
app.get(`/u/:id`, (req, res) => {
  const longURL = urlDatabase[req.params.id] //req.params is whatever is in your url
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('/urls')
  }
});

//READ
app.get("/urls/:id", (req, res) => {
  // urls/b2xVn2
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

//EDIT
//add an id, email, and password to users object
app.post("/urls/register", (req, res) => {
  const newUserID = generateRandomString()
  const newEmail = req.body.email
  const newPassword = req.body.password
  users[newUserID] = { id: newUserID, email: newEmail, password: newPassword }
})

//EDIT
app.post("/urls/:id", (req, res) => {
  //update the value of the stored
  //long URL based on the value of the new body
  //need to update an existing longURL
  // //
  // console.log("Hi I'm here")
  const existingURL = req.params.id
  urlDatabase[existingURL] = req.body.longURL
  res.redirect('/urls')
})

//DELETE
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id] //deletes the respective URL
  res.redirect("/urls") //with the redirect to original page it looks like all we did was remove it
})

//ADD
app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString() //urlDatabase[newShortURL] = newLongURL
  const newLongURL = req.body.longURL //what the user inputs into the text field
  urlDatabase[newShortURL] = newLongURL
  res.redirect(`/urls/${newShortURL}`)
  res.send(newShortURL);
});

//COOKIES
app.post("/login", (req, res) => {
  const username = req.body.username //grab value of that key
  res.cookie('username', username)
  //res.cookie has 2 parameters, name and value
  res.redirect("/urls")
})

//COOKIES

app.post("/logout", (req, res) => {
  res.clearCookie('username')
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})

