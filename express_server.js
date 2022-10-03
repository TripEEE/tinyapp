const express = require("express");
const { url } = require("inspector");
const { stripVTControlCharacters } = require("util");
const app = express()
const PORT = 8080

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }))

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase }; //urlDatabase becomes urls in urls_index.js
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString() //urlDatabase[newShortURL] = newLongURL
  const newLongURL = req.body.longURL //what the user inputs into the text field
  urlDatabase[newShortURL] = newLongURL
  console.log(urlDatabase)
  console.log(newLongURL); // Log the POST request body to the console
  res.redirect(`/urls/:${newShortURL}`)
  res.send(newShortURL);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  // urls/b2xVn2
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!")
})


app.get("/urls.json"), (req, res) => {
  res.json(urlDatabase)
}

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello<b>World</b></body></html>\n")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})

