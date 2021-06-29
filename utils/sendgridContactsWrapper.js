const axios = require("axios");
const apiRoute = "https://api.sendgrid.com/v3";
module.exports = class SendgridContactsWrapper {
   constructor(apiKey) {
      this.apiKey = apiKey;
   }
   async getContactListIdByName(name) {
      const res = await this.#sendRequest("GET", "/marketing/lists");
      return res.find((list) => list.name == name)?.id;
   }
   async addContacts(emails, listName) {
      const contacts = [];
      for (const email of emails) {
         contacts.push({ email: email });
      }
      const res = await this.#sendRequest(
         "PUT",
         "/marketing/contacts",
         listName
            ? {
                 list_ids: [await this.getContactListIdByName(listName)],
                 contacts: contacts,
              }
            : {
                 contacts: contacts,
              }
      );
      return res;
   }
   async #sendRequest(method, route, data) {
      try {
         const config = {
            method: method,
            url: `${apiRoute}${route}`,
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${this.apiKey}`,
            },
            data: data,
         };
         const result = await axios(config);
         return result.data.result;
      } catch (err) {
         console.log(err);
         return err;
      }
   }
};
