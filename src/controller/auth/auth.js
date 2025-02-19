import { Customer, DeliveryPartner } from "../../model/user.js";
import jwt from "jsonwebtoken";

const generateTokens = (user) => {
  const acessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return { acessToken, refreshToken };
};

export const loginCustomer = async (req, reply) => {
  try {
    const { phone } = req.body;
    let customer = await Customer.findOne({ phone });

    if (!customer) {
      customer = new Customer({
        phone,
        role: "Customer",
        isActivated: true,
      });
      await customer.save();
    }
    const { acessToken, refreshToken } = generateTokens(customer);
    return reply.send({
      message: "Login Successful",
      acessToken,
      refreshToken,
      customer,
    });
  } catch (error) {
    return reply.status(500).send({ message: "An error occured", error });
  }
};

export const loginDeliveryPartner = async (req, reply) => {
  try {
    const { email, password } = req.body;
    const deliveryPartner = await DeliveryPartner.findOne({ email });

    if (!deliveryPartner) {
      return reply.status(404).send({ message: "Delivery partner not found" });
    }
    const isMatch = password === deliveryPartner.password;

    if (!isMatch) {
      return reply.status(400).send({ message: "Invalid Credentials" });
    }
    const { acessToken, refreshToken } = generateTokens(deliveryPartner);

    return reply.send({
      message: "Login Successful",
      acessToken,
      refreshToken,
      deliveryPartner,
    });
  } catch (error) {
    return reply.status(500).send({ message: "An error occured", error });
  }
};

export const refreshToken = async (req, reply) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return reply.status(401).send({ message: "Refresh token required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    let user;

    if (decoded.role === "Customer") {
      user = await Customer.findOne(decoded.userId);
    } else if (decoded.role === "Delivery Partner") {
      user = await DeliveryPartner.findOne(decoded.userId);
    } else {
      return reply.status(403).send({ message: "Invalid Role" });
    }
    if (!user) {
      return reply.status(403).send({ message: "User not found" });
    }
    const { acessToken, refreshToken: newRefreshToken } = generateTokens(user);

    return reply.send({
      message: " Token Refreshed",
      acessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return reply.status(403).send({ message: "Invalid refresh token" });
  }
};

export const fetchUSer = async (req, reply) => {
  try {
    const { ueseId, role } = req.user;
    let user;

    if (role === "Customer") {
      user = await Customer.findById(userId);
    } else if (role === "Delivery Partner") {
      user = await DeliveryPartner.findById(userId);
    } else {
      return reply.status(403).send({ message: "Invalid Role" });
      ("");
    }
    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }
    return reply.send({
      message: "User fetcehd sucessfully",
      user,
    });
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};
