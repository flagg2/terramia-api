const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.EMAIL_PASSWORD);
const templates = require("../config/sg_templates");
const moment = require("moment");
const ContactsApi = require("./sendgridContactsWrapper");
const contactsApi = new ContactsApi(process.env.EMAIL_PASSWORD);

module.exports = {
   addToAudience: async (contacts) => {
      await contactsApi.addContacts(contacts, process.env.SG_LIST_NAME ?? "Terramia");
   },
   scheduleTemplate: async (user, days, templateName) => {
      const date = moment().add(days, "days").format("DD/MM/YYYY");
      if (!user.scheduledMails[date]) {
         user.scheduledMails[date] = [];
      }
      user.scheduledMails[date].push(templateName);
      user.markModified("scheduledMails");
      await user.save();
   },
   sendTemplate: async (config) => {
      if (config.name) {
         const matchingTemplate = templates.find((x) => config.name == x.name);
         if (matchingTemplate) {
            config = {
               ...config,
               template_id: matchingTemplate.template_id,
               category: matchingTemplate.category,
            };
         }
      }
      const msg = {
         to: config.email,
         from: "anticache2@terramia.sk",
         subject: "Testing",
         template_id: config.template_id,
         category: config.category,
         dynamic_template_data: {
            ...config.data,
            email: config.email,
         },
      };
      try {
         const res = await sendgrid.send(msg);
         return res;
      } catch (err) {
         console.log(err.response.body.errors);
      }
   },
};
