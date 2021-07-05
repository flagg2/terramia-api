const verify = require("../../middlewares/verifyToken");
const methods = require("../../middlewares/methods");
const User = require("../../model/user");
const Order = require("../../model/order");
const moment = require("moment");
const tm = require("../../utils/templateMailer");
const bcrypt = require("bcryptjs");
const { serverError, notFound } = require("../../utils/errors");
const {
   patchProfileValidation,
   changePasswordValidation,
   requestSamplesValidation,
   joinCompetitionValidation,
   trackClickValidation,
} = require("../../utils/validation");

const router = require("express").Router();

router.all("/orders", methods(["GET"]));
router.get("/orders", verify(0), async (req, res) => {
   const orders = [];
   try {
      const userInfo = await User.findById(req.user._id);
      if (!userInfo)
         throw {
            error: "not-found",
            message: "User with the provided id was not found",
         };
      for (const order in userInfo.orders) {
         const ord = await Order.findById(userInfo.orders[order]);
         ord.clientSecret = undefined;
         orders.push({ ord });
      }
      res.send({
         message: "Orders retrieved successfully",
         count: orders.length,
         orders: orders,
      });
   } catch (err) {
      res.status(404).send(...err);
   }
});

//get info about the user
router.all("/requestSamples", methods(["POST"]));
router.post("/requestSamples", verify(0), async (req, res) => {
   if (requestSamplesValidation(req, res)) return;
   try {
      const user = await User.findById(req.user._id);
      if (user.sampleSent)
         return res.status(400).send({
            message: "Samples have already been sent to this user",
            error: "already-sent",
         });
      user.sampleType = req.body.type;
      await user.save();
      res.send({
         message: "Samples requested successfully",
      });
   } catch (err) {
      serverError(res, err);
   }
});

router.all("/profile", methods(["GET", "PATCH"]));
router.get("/profile", verify(0), async (req, res) => {
   try {
      const userInfo = await User.findById(req.user._id).select("-password");
      if (!userInfo)
         throw {
            error: "not-found",
            message: "User with the provided id was not found",
         };
      res.send({
         message: "User info retrieved successfully",
         user: userInfo,
      });
   } catch (err) {
      serverError(res, err);
   }
});

//update user info

router.patch("/profile", verify(0), async (req, res) => {
   //validate req
   if (patchProfileValidation(req, res)) return;

   //properties ktore je mozne zmenit
   const props = ["email", "phone"];
   try {
      //update user
      const user = await User.findById(req.user._id);
      for (const prop of props) {
         if (req.body[prop] !== undefined) {
            //check if email exists
            if (prop == "email") {
               const userByReq = await User.findOne({
                  email: { $regex: "﻿?" + req.body.email },
                  tempUser: false,
               });
               if (userByReq && userByReq.email != user.email) {
                  return res.status(409).send({
                     message: "Email already exists",
                     type: "email",
                     error: "exists",
                  });
               }
            }
            //check if phone exists
            else if (prop == "phone") {
               const userByReq = await User.findOne({
                  phone: req.body.phone,
                  tempUser: false,
               });
               if (userByReq && userByReq.phone != user.phone) {
                  return res.status(409).send({
                     message: "Phone number already exists",
                     type: "phone",
                     error: "exists",
                  });
               }
            }
         }
      }
      await User.findByIdAndUpdate(req.user._id, { ...req.body });
      const su = await User.findById(req.user._id).select("-password -resetSecret");
      res.send({
         message: "Records updated successfully",
         user: su,
      });
   } catch (err) {
      serverError(res, err);
   }
});

router.all("/password", methods(["POST"]));
router.post("/password", verify(0), async (req, res) => {
   if (changePasswordValidation(req, res)) return;
   const salt = await bcrypt.genSalt(10);
   const hashPassword = await bcrypt.hash(req.body.password, salt);
   try {
      const user = await User.findById(req.user._id);
      const validPass = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!validPass) {
         return res.status(400).send({
            message: "The old password provided is invalid",
            error: "invalid-password",
         });
      }
      user.password = hashPassword;
      user.save();
      res.send({
         message: "Password changed successfully",
      });
   } catch (err) {
      serverError(res, err);
   }
});

router.all("/track", methods(["POST"]));
router.post("/track", async (req, res) => {
   if (trackClickValidation(req, res)) return;
   try {
      const user = await User.findOne({ email: req.body.email, tempUser: false });
      if (!user) return notFound(res, "User");
      if (!user.emailClicks) user.emailClicks = {};
      if (!user.emailClicksCount) user.emailClicksCount = 0;
      if (user.emailClicks[req.body.url]) {
         user.emailClicks[req.body.url]++;
      } else {
         user.emailClicks[req.body.url] = 1;
      }
      user.markModified("emailClicks");
      user.emailClicksCount++;
      await user.save();
      res.send({
         message: "Data saved successfully",
      });
   } catch (err) {
      serverError(res, err);
   }
});

router.all("/competition", methods(["POST"]));
router.post("/competition", async (req, res) => {
   if (joinCompetitionValidation(req, res)) return;
   const user = await User.findOne({ email: req.body.email, tempUser: false });
   if (!user) return notFound(res, "User");
   if (user.joinedCompetition) {
      return res.status(400).send({
         message: "Do súťaže ste sa už raz zapojili",
      });
   }
   user.joinedCompetition = true;
   const in13days = moment().add(13, "days").format("DD/MM/YYYY");
   user.samplesRequestValidAfter = in13days;
   await tm.scheduleTemplate(user, 1, "sutaz");
   await tm.scheduleTemplate(user, 5, "kviz");
   await tm.scheduleTemplate(user, 14, "vzorka1");
   await tm.scheduleTemplate(user, 28, "vyhody");
   tm.addToAudience([req.body.email]);
   res.send({
      message: "Úspešne ste sa zapojili do súťaže!",
   });
});

module.exports = router;
