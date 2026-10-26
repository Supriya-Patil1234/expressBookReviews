const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Promise wrapper around the book data
const getBooks = () => new Promise((resolve) => resolve(books));

// Get the book list
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await getBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  getBooks()
    .then((allBooks) => {
      const book = allBooks[req.params.isbn];
      if (book) return res.status(200).send(JSON.stringify(book, null, 4));
      return res.status(404).json({ message: "Book not found" });
    })
    .catch(() => res.status(500).json({ message: "Error retrieving book" }));
});

// Get book details based on author
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author.toLowerCase();
  const allBooks = await getBooks();
  const result = Object.keys(allBooks)
    .filter((key) => allBooks[key].author.toLowerCase() === author)
    .map((key) => ({ isbn: key, ...allBooks[key] }));
  if (result.length === 0) return res.status(404).json({ message: "No books found for this author" });
  return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
});

// Get book details based on title
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title.toLowerCase();
  const allBooks = await getBooks();
  const result = Object.keys(allBooks)
    .filter((key) => allBooks[key].title.toLowerCase() === title)
    .map((key) => ({ isbn: key, ...allBooks[key] }));
  if (result.length === 0) return res.status(404).json({ message: "No books found with this title" });
  return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
});

// Get book reviews
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book.reviews, null, 4));
});

/* ---------- Axios client functions (Promise callbacks / async-await) ----------
   These call the running server's own endpoints. */

// All books (Promise callbacks)
const getAllBooksAxios = () => {
  return axios.get(`${BASE_URL}/`)
    .then((response) => response.data)
    .catch((err) => console.error("Error fetching all books:", err.message));
};

// By ISBN (Promise callbacks)
const getBookByISBNAxios = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((err) => console.error("Error fetching book by ISBN:", err.message));
};

// By author (async/await)
const getBooksByAuthorAxios = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching books by author:", err.message);
  }
};

// By title (async/await)
const getBooksByTitleAxios = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching books by title:", err.message);
  }
};

module.exports.general = public_users;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getBookByISBNAxios = getBookByISBNAxios;
module.exports.getBooksByAuthorAxios = getBooksByAuthorAxios;
module.exports.getBooksByTitleAxios = getBooksByTitleAxios;