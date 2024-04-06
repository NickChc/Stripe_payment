require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://final-api-01iz.onrender.com",
      "https://form-n-auth.onrender.com",
    ],
  })
);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const response = await axios.get(
      "https://final-api-01iz.onrender.com/product?pageSize=100"
    );
    const products = response.data.products;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.items.map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!item) {
          throw new Error(`Product with ID ${item.id} not found.`);
        }
        return {
          price_data: {
            currency: "gel",
            product_data: {
              name: product.title,
            },
            unit_amount: product.price * 100,
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${process.env.CLIENT_URL}/payment-success`,
      cancel_url: `${process.env.CLIENT_URL}/page_/1`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});




app.listen(5000);
