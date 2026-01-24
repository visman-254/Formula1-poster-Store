import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authorization header:", authHeader); 

  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("JWT verification error:", err); 
      return res.status(403).json({ message: "Invalid token." });
    }
    req.user = user; 
    console.log("Token verified, user:", user); 
    next();
  });
};
export const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. You are not an admin." });
  }
  req.isAdmin = true;
  
  next();
}
