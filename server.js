require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const bodyParser = require("body-parser");

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://final-api-01iz.onrender.com",
      "https://form-n-auth.onrender.com",
      "https://e-commerce-final-a12i.onrender.com",
      "https://old.uptimerobot.com",
    ],
  })
);
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.BACKEND_URL}/product?pageSize=100`
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
        const unitAmount = product?.salePrice || product.price;
        return {
          price_data: {
            currency: "gel",
            product_data: {
              name: product.title,
            },
            unit_amount: unitAmount * 100,
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${process.env.CLIENT_URL}/payment-success`,
      cancel_url: `${process.env.CLIENT_URL}/`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post(
  "/webhooks",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Webhook Error: " + error.message);
      return res.status(400).send(`Webhook error ${error.message}`);
    }

    if (event.type === "checkout.session.completed") {
      console.log("AEEE");
      console.log(session);
      const session = event.data.object;

      res
        .status(200)
        .json({ success: true, paymentId: session.payment_intent });
    }
  }
);

app.listen(5000);
