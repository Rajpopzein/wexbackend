import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const saltRounds = 10;

const enctirypt = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

const decodeEncription = async (password, hash) => {
  console.log("decodeEncription", password, hash);
  const validation = await bcrypt.compare(password, hash);
  return validation;
};

var privateKey = "234";

const jwtGeneratot = ({ data }) => {
  const payload = {
    id: data._id,
    email: data.email,
  };
  try {
    const token = jwt.sign({ data: payload }, privateKey, { expiresIn: "1h" });
    return token;
  } catch (err) {
    console.error("Error generating token:", err);
    return "Token not valid";
  }
};

export { enctirypt, decodeEncription, jwtGeneratot };
