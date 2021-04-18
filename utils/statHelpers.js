const EmailBundle = require('../model/emailBundle')
const Order = require('../model/order')

const getDay = (daysFromToday) => {
    let today = new Date()
    if (daysFromToday) today = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromToday);
    return today.toDateString()
}

const getStatsFromTimespan = async (timespan) => {
    const timespans = {
        'day':0,
        'week':7,
        'month':30,
        'year':365,
        'all':50000
    }
    let start,end
    if (Object.keys(timespans).includes(timespan)){
        end = getDay()
        start = getDay(timespans[timespan])
    }
    else{
        const [startDay,endDay] = timespan.split(':')
        let [sday,smonth,syear] = startDay.split('/')
        let [eday,emonth,eyear] = endDay.split('/')
        start = new Date(syear,smonth-1,sday)
        end = new Date(eyear,emonth-1,eday)
    }

    const sampled = await Order.aggregate([{
        $match:{
            value:0
        }
    },{
        $lookup:{
            from: 'users',
            localField: 'orderedBy',
            foreignField: '_id',
            as:'user'
        }
    },{
        $addFields: {
            'email' : '$user.email'
        }
    },{
        $project: {
            "email" : 1
        }
    },{
        $unwind: '$email'
    }])

    const emailSet = new Set()
    for (const user of sampled){
        emailSet.add(user.email)
    }
    
    const emails = await EmailBundle.find({
        'date': {
            $lte: new Date(end).setHours(23,59,59,999),
            $gte: new Date(start)
        },
        includeInStats:true
    })
    
    const samples = await Order.find({
        value:0,
        'date': {
            $lte: new Date(end).setHours(23,59,59,999),
            $gte: new Date(start)
        }
    })

    console.log(emails)

    const stats = {
        terramia: 0,
        terramia_net: 0,
        total:0,
        samples:samples.length
    }

    for (const emailBundle of emails){
        stats.total += emailBundle.terramia.length + emailBundle.terramia_net.length
        for (const email of emailBundle.terramia){
            if (emailSet.has(email)){
                stats.terramia += 1
            }
        }
        for (const email of emailBundle.terramia_net){
            if (emailSet.has(email)){
                stats.terramia += 1
                stats.terramia_net += 1
            }
        }
    }
    return stats
}

getStatsFromTimespan('day')
module.exports = {getStatsFromTimespan}
