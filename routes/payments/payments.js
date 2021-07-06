const router = require("express").Router();
const methods = require("../../middlewares/methods");
const Product = require("../../model/product");
const Order = require("../../model/order");
const moment = require("moment");
const { createPaymentValidation } = require("../../utils/validation");
const User = require("../../model/user");
const { serverError } = require("../../utils/errors");
const { validateCoupon, finishOrder, calculateAddedCosts, calculateOrderAmount } = require("../../utils/orderHelpers");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

router.all("/webhook", methods(["POST"]));
router.post("/webhook", async (req, res) => {
   const sig = req.headers["stripe-signature"];
   let event;
   try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.WEBHOOK_SECRET);
   } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
   }
   if (event.type == "payment_intent.succeeded") {
      const secret = event.data.object.client_secret;
      try {
         const order = await Order.findOne({
            clientSecret: secret,
         });
         if (!order) {
            return res.status(400).send(`Webhook error: invalid secret`);
         }
         if (!order.ordered) {
            return finishOrder(order, res, true);
         }
      } catch (err) {
         console.log(err);
         res.status(400).send();
      }
   }
   res.send();
});

router.all("/skip", methods(["POST"]));
router.post("/skip", async (req, res) => {
   if (createPaymentValidation(req, res)) return;
   const { orderId } = req.body;
   try {
      const order = await Order.findById(orderId);
      if (!order)
         return res.status(400).send({
            message: "The order id provided was invalid",
            error: "not-found",
         });
      if (order.status != "pending")
         return res.status(400).send({
            message: "This order is not pending",
            error: "not-pending",
         });
      if (order.applyDiscount)
         return res.status(400).send({
            message: "Only card payment is valid for discounted orders",
            error: "invalid-payment-method",
         });
      await calculateAddedCosts(order, req.body.shouldDeliver, "cash", req.body.applyDiscount);
      if (await validateCoupon(order, res)) return;
      if (order.value == 0) {
         const today = moment();
         const user = await User.findById(order.orderedBy);
         if (user.receivedSamples) {
            return res.status(404).send({
               message: "Tento použivateľ už vzorky obdržal",
            });
         } else if (user.registeredInDoTerra) {
            return res.status(404).send({
               message: "Do súťaže sa môžu prihlásiť iba použivatelia, ktorí ešte nie sú registrovaní v DoTerra",
            });
         } else if (moment(user.samplesRequestValidAfter, "DD/MM/YYYY").isAfter(today)) {
            return res.status(404).send({
               message: "Tento použivateľ nemá nárok na vzorku zadarmo",
            });
         } else {
            user.receivedSamples = true;
            await user.save();
         }
      }
      order.status = "ordered";
      const orderAmount = await calculateOrderAmount(order);
      order.value = orderAmount;
      await order.save();
      finishOrder(order, res, false);
      res.send({
         message: "Payment skipped successfully",
      });
   } catch (err) {
      serverError(res, err);
   }
});

router.all("/create", methods(["POST"]));
router.post("/create", async (req, res) => {
   if (createPaymentValidation(req, res)) return;
   const { orderId } = req.body;
   try {
      const order = await Order.findById(orderId);
      if (!order)
         return res.status(400).send({
            message: "The order id provided was invalid",
            error: "not-found",
         });
      if (order.status != "pending")
         return res.status(400).send({
            message: "This order is not pending",
            error: "not-pending",
         });
      if (await validateCoupon(order, res)) return;
      const paymentIntent = await stripe.paymentIntents.create({
         amount: order.value,
         currency: "eur",
      });
      order.clientSecret = paymentIntent.client_secret;
      await order.save();
      res.send({
         message: "Payment intent created successfully",
         clientSecret: paymentIntent.client_secret,
      });
   } catch (err) {
      serverError(res, err);
   }
});

module.exports = router;
