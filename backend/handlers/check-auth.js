import jwt from "jsonwebtoken";

const checkAuth = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log(token);
    if (!token) {
      console.log("decodedToken");
      throw new Error("Authentification failed");
    }
    const decodedToken = jwt.verify(token, "cleSuperSecrete!");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = ("Authentification failed!" + err, 401);
    return next(error);
  }
};

export default checkAuth;
