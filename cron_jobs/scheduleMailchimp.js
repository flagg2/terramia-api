const CronJob = require('cron').CronJob;
const moment = require('moment')
const Order = require('../model/order')
const User = require('../model/user')
const client = require("@mailchimp/mailchimp_marketing");

const listId = 'a7e3f99d01'
const templateId7 = 165643
const templateId14 = 165615
const templateId21 = 10000019
const templateId28 = 10000202

client.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: "us18",
});

const emailJob = async () => {
    const suc = await processOrdersForTheDay()
    if (!suc){
        console.error('Error creating new audience segment')
    }
    const ago7 = moment().subtract(7,'days')
    const suc1 = await createAndSendCampaign(ago7,templateId7,'Dostali ste vzorku doTERRA oleja na vyskúšanie?❤','Veríme, že Vás kvalitný olej potešil😊')
    if (!suc1){
        console.error('Error sending the 7 day email')
    }
    const ago14 = moment().subtract(14,'days')
    const suc2 = await createAndSendCampaign(ago14,templateId14,'Ako získať ďalšie esenciálne oleje?❤','Pozrite si naše video a vyhrajte🎉🎉🎉')
    if (!suc2){
        console.error('Error sending the 14 day email')
    }
    const ago21 = moment().subtract(21,'days')
    const suc3 = await createAndSendCampaign(ago21,templateId21,'Balík olejov a 7 darčekov 😍','Získajte more darčekov a zľavu 25%🍀')
    if (!suc3){
        console.error('Error sending the 21 day email')
    }
    /*const ago28 = moment().subtract(28,'days')
    const suc4 = await createAndSendCampaign(ago28,templateId28,'Ktoré oleje sú pre Vás najvhodnejšie?😱','Vyplňte rýchly dotazník a vyberte si riešenie podľa seba!😍')
    if (!suc4){
        console.error('Error sending the 14 day email')
    }*/
}

const job = new CronJob('0 0 */1 * *', async function () {
    emailJob()
})

const addSegment = async (emails) => {
    try {
        const today = moment().format('MM-DD-YYYY')
        console.log(today)
        const response = await client.lists.createSegment(listId, {
            name: today,
            static_segment: emails
        });
        return response.id
    } catch (err) {
        console.log(err)
    }
}

const addToAudience = async (emails) => {
    try{
    const members = []
    for (const email of emails) {
        members.push({
            email_address: email,
            status: 'subscribed'
        })
    }
    await client.lists.batchListMembers(listId, {
        members: members,
    });
    return true
    }
    catch(err){
        console.error(err)
    }
}

const getSegmentIdOfDay = async (dayMoment) => {
    try{
    const stamp = dayMoment.format('MM-DD-YYYY')
    const response = await client.lists.listSegments(listId,{count:1000});
    const segments = response.segments
    const segment = segments.find(x => x.name === stamp)
    if (!segment) return false
    return segment.id
    }
    catch(err){
        console.error(err)
        return false
    }
  }


const processOrdersForTheDay = async() => {
    try{
    const emails = await getTodaysEmailAddresses()
    if (emails.length == 0) return
    const addedSuccessfully = await addToAudience(emails)
    if (!addedSuccessfully){
        console.error('Emails could not be added to audience')
        return false
    }
    const segmentId = await addSegment(emails)
    if (!segmentId) {
        console.error('Invalid segment id')
        return false
        }   
    }
    catch(err){
        console.error(err)
        return false
    }
}


const createAndSendCampaign = async (dayMoment, templateId, subject_line, preview_text) => {
    const segmentId = await getSegmentIdOfDay(dayMoment)
    if (!segmentId) return false
    const campaignId = await createCampaign(segmentId,templateId,subject_line,preview_text)
    if (!campaignId){
        return console.error('Invalid campaign id')
    }
    const campaignSentSuccessfully = await sendCampaign(campaignId)
    if (!campaignSentSuccessfully){
        return console.error('Could not send campaign')
    }
    console.log('Campaign created and sent successfully')
    
}

const sendCampaign = async (campaignId) => {
    try{
  const response = await client.campaigns.send(campaignId);
  return true
    }
    catch(err){
        console.log(err)
    }
};

const createCampaign = async (segmentId, templateId, subject_line, preview_text) => {
    try{
    const response = await client.campaigns.create({
        type: "regular",
        recipients:{
            list_id:listId,
            segment_opts:{
                saved_segment_id:segmentId
            }
        },
        settings:{
            subject_line:subject_line,
            title:'Terramia Vzorky kampaň',
            preview_text:preview_text,
            from_name:'Terramia',
            use_conversation:false,
            auto_footer:true,
            inline_css:true,
            auto_tweet:false,
            auto_fb_post:[],
            fb_comments:false,
            reply_to:'info@terramia.sk',
            template_id:templateId
        },
        content_type:'template'
        
        });
    return response.id
      }
      catch(err){
        console.error(err)
      }
  };

const getTodaysEmailAddresses = async () => {
    try{
    const today = moment().add(1,'days')
    const ago1 = moment().subtract(1,'days')
    console.log(today,ago1)
    const orders = await Order.find({
        date: {
            $lt: today.toDate(),
            $gte: ago1.toDate(),
        },
        value:0
    })
    const emailAddresses = []
        for (const order of orders) {
            const user = await User.findById(order.orderedBy)
            if (user && user.email) {
                emailAddresses.push(user.email)
            }
        }
    console.log(emailAddresses)
    return emailAddresses
    }
    catch (err) {
        console.log(err)
        return []
    }
}
if (process.env.SEND_MAIL == 'true'){
    job.start()
}

