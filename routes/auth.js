const express = require("express");
const router = express.Router();

const { UserError } = require("../helpers/userHelper");

const { users } = require("../data");

const renderLogin = (res, error) =>
  res.render("auth", {
    login: true,
    layout: false,
    title: "Log in",
    target: "/auth/login",
    error,
  });

const renderRegister = (res, error) =>
  res.render("auth", {
    login: false,
    layout: false,
    title: "Sign up",
    target: "/auth/register",
    error,
  });

const handleError = async (error, res) => {
  if (!!error?._status) {
    return res
      .status(error._status)
      .render("forbiddenAccess", { message: error.message });
  }
  console.error("Unhandled exception occured");
  console.error(error);
  return res
    .status(500)
    .render("forbiddenAccess", { message: "Internal server error" });
};

router.route("/").get(async (req, res) => {
  // @ts-ignore
  if (req.session?.user) {
    return res.redirect("/");
  }

  return renderLogin(res);
});

router
  .route("/register")
  .get(async (req, res) => {
    // @ts-ignore
    if (req.session?.user) {
      return res.redirect("/");
    }
    return renderRegister(res);
  })
  .post(async (req, res) => {
    try {
      const { usernameInput, passwordInput } = req.body;

      if (!usernameInput || !passwordInput)
        throw new UserError("Username and password must be provided");

      // run createUser
      const resp = await users.createUser(usernameInput, passwordInput);

      if (!resp?.userInserted) {
        throw new Error("Could not insert user or did not return userInserted");
      }

      return res.redirect("/");
    } catch (e) {
      if (e instanceof UserError) {
        return renderRegister(res, e.message);
      }
      return handleError(e, res);
    }
  });

router
  .route("/login")
  .get(async (req, res) => {
    // @ts-ignore
    if (req.session?.user) {
      return res.redirect("/");
    }
    return renderLogin(res);
  })
  .post(async (req, res) => {
    try {
      // get username and password from body
      const { usernameInput, passwordInput } = req.body;
      // validate username and password
      // if not exist throw UserError

      if (!usernameInput || !passwordInput)
        throw new UserError("Username and password must be provided");

      const resp = await users.checkUser(usernameInput, passwordInput);

      if (!resp?.authenticatedUser)
        throw new UserError("Either the username or password is invalid");
      // @ts-ignore - hack to ignore
      req.session.user = { username: usernameInput.toLowerCase() };

      res.redirect("/");
    } catch (e) {
      // TODO proper status
      if (e instanceof UserError) {
        return renderLogin(res, e.message);
      }
      return handleError(e, res);
    }
  });

router.route("/logout").get(async (req, res) => {
  // @ts-ignore
  if (!req.session?.user) return renderLogin(res, "You have been logged out.");

  // @ts-ignore
  req.session.destroy();

  return renderLogin(res, "You have been logged out.");
});

module.exports = router;
