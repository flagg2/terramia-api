const EmailBundle = require("../model/emailBundle");
const Order = require("../model/order");

const getDay = (daysFromToday) => {
   let today = new Date();
   if (daysFromToday) today = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromToday);
   return today.toDateString();
};

const getStatsFromTimespan = async (timespan) => {
   const timespans = {
      day: 0,
      week: 7,
      month: 30,
      year: 365,
      all: 50000,
   };
   let start, end;
   if (Object.keys(timespans).includes(timespan)) {
      end = getDay();
      start = getDay(timespans[timespan]);
   } else {
      const [startDay, endDay] = timespan.split(":");
      let [sday, smonth, syear] = startDay.split("/");
      let [eday, emonth, eyear] = endDay.split("/");
      start = new Date(syear, smonth - 1, sday);
      end = new Date(eyear, emonth - 1, eday).setHours(23, 59, 59, 999);
   }

   //users who recieved samples
   const sampled = await Order.aggregate([
      {
         $match: {
            value: 0,
         },
      },
      {
         $lookup: {
            from: "users",
            localField: "orderedBy",
            foreignField: "_id",
            as: "user",
         },
      },
      {
         $addFields: {
            email: "$user.email",
         },
      },
      {
         $project: {
            email: 1,
         },
      },
      {
         $unwind: "$email",
      },
   ]);

   //users who were registered and are friends of terramia team
   const withAction = await Order.aggregate([
      {
         $match: {
            date: {
               $lte: new Date(end),
               $gte: new Date(start),
            },
            applyDiscount: true,
            value: {
               $gt: 0,
            },
            status: {
               $not: { $eq: "pending" },
            },
            action: true,
         },
      },
      {
         $lookup: {
            from: "users",
            localField: "orderedBy",
            foreignField: "_id",
            as: "user",
         },
      },
      {
         $addFields: {
            email: "$user.email",
         },
      },
      {
         $project: {
            email: 1,
         },
      },
      {
         $unwind: "$email",
      },
   ]);

   //users who registered and are not friends of terramia team
   console.log(end, start);
   const withoutAction = await Order.aggregate([
      {
         $match: {
            date: {
               $lte: new Date(end),
               $gte: new Date(start),
            },
            value: {
               $gt: 0,
            },
            applyDiscount: true,
            status: {
               $not: { $eq: "pending" },
            },
            $or: [{ action: { $exists: false } }, { action: false }],
         },
      },
      {
         $lookup: {
            from: "users",
            localField: "orderedBy",
            foreignField: "_id",
            as: "user",
         },
      },
      {
         $addFields: {
            email: "$user.email",
         },
      },
      {
         $project: {
            email: 1,
         },
      },
      {
         $unwind: "$email",
      },
   ]);

   const sampledEmailsSet = new Set();
   for (const user of sampled) {
      sampledEmailsSet.add(user.email);
   }

   const emails = await EmailBundle.find({
      date: {
         $lte: new Date(end).setHours(23, 59, 59, 999),
         $gte: new Date(start),
      },
      includeInStats: true,
   });

   const samples = await Order.find({
      value: 0,
      date: {
         $lte: new Date(end).setHours(23, 59, 59, 999),
         $gte: new Date(start),
      },
   });

   let terramiaNetSampled = 0;
   let withActionSampled = 0;
   let withoutActionSampled = 0;

   for (const email of withAction) {
      if (sampledEmailsSet.has(email.email)) {
         withActionSampled += 1;
      }
   }

   for (const email of withoutAction) {
      if (sampledEmailsSet.has(email.email)) {
         withoutActionSampled += 1;
      }
   }

   for (const emailBundle of emails) {
      for (const email of emailBundle.terramia_net) {
         if (sampledEmailsSet.has(email)) {
            terramiaNetSampled += 1;
         }
      }
   }

   const stats = {
      kpi: withoutAction.length,
      kpi_net: withoutAction.length + terramiaNetSampled,
      manual: withAction.length,
      kpi_sample: withActionSampled + withoutActionSampled,
      kpi_net_plus_manual: withoutAction.length + terramiaNetSampled + withAction.length,
      sampled: samples.length,
   };

   return stats;
};

getStatsFromTimespan("day");
module.exports = { getStatsFromTimespan };
