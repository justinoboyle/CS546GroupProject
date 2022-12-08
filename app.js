const express = require("express");
const app = express();
const session = require("express-session");
const configRoutes = require("./routes");
const port = process.env.PORT || 3000;
const path = require("path")
const AUTH_SECRET = process.env.AUTH_SECRET || "SomeSecret";

const {
    engine
} = require("express-handlebars");

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

// public public/css folder at /public
app.use("/public", express.static(path.join(__dirname, 'public')));

app.use(
    session({
        name: "AuthCookie",
        secret: AUTH_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use((req, res, next) => {
    console.log(
        `[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} (${
      // @ts-ignore
      req.session?.user ? "Authenticated User" : "Non-Authenticated User"
    })`
    );
    next();
});

configRoutes(app);

app.listen(port, () => console.log(`Server is running on port ${port}!`));